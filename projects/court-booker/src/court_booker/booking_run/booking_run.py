"""Runs one claimed Booking Request: books each Slot in time order and records every outcome."""

import logging
import time as monotonic_time
from collections.abc import Callable
from dataclasses import dataclass
from datetime import time, timedelta
from typing import Protocol

from court_booker.booking_requests.booking_requests import (
    BookingRequest,
    SlotResult,
    SlotStatus,
    slot_text,
)
from court_booker.clock import Clock, Sleeper
from court_booker.court_booking_site import (
    Booked,
    CourtBookingSite,
    NetworkError,
    NotOpen,
    ReadyToBook,
    Rejected,
    SlotAttempt,
    Taken,
)
from court_booker.profile.profile import Profile, ProfileStore, ProfileUnreadable
from court_booker.random_source import RandomSource

logger = logging.getLogger(__name__)

NOT_OPEN_REASON = "date not open on Picktime yet"


@dataclass(frozen=True)
class RunRules:
    # A random pause in [pause_min, pause_max] between two Slots, so it looks like a person.
    pause_min: timedelta
    pause_max: timedelta
    # How many times a network error is retried; each wait doubles the one before
    max_retries: int
    retry_backoff: timedelta


class SlotResultRecorder(Protocol):
    def record_slot(self, request_id: int, result: SlotResult) -> None:
        """Save one Slot's status as soon as it is known."""
        ...


class BookingRun:
    def __init__(
        self,
        *,
        recorder: SlotResultRecorder,
        profiles: ProfileStore,
        site: CourtBookingSite,
        clock: Clock,
        sleeper: Sleeper,
        random: RandomSource,
        rules: RunRules,
    ) -> None:
        self._recorder = recorder
        self._profiles = profiles
        self._site = site
        self._clock = clock
        self._sleeper = sleeper
        self._random = random
        self._rules = rules

    def run(self, request: BookingRequest, heartbeat: Callable[[], None]) -> None:
        """Try every Slot of `request`, calling `heartbeat` after each attempt and each wait.

        One Slot's failure never stops the others, except a date that isn't open yet: that
        fails every Slot left without asking the site again.
        """
        started = monotonic_time.monotonic()
        logger.info(
            "booking run started",
            extra={
                **_log_fields(request),
                "slots": [slot_text(slot) for slot in request.slots],
            },
        )
        # Decrypted now rather than at creation, so Profile edits reach waiting requests.
        profile, profile_problem = self._load_profile(request)
        tried_one = False
        not_open = False
        for slot in request.slots:
            if profile is None or not_open:
                reason = NOT_OPEN_REASON if not_open else profile_problem
                self._record(request, SlotResult(slot, SlotStatus.FAILED, reason=reason))
                continue
            if tried_one:
                self._pause(heartbeat)
            tried_one = True
            result = self._book_slot(request, slot, profile, heartbeat)
            not_open = result.reason == NOT_OPEN_REASON
        logger.info(
            "booking run finished",
            extra={
                **_log_fields(request),
                "duration_seconds": round(monotonic_time.monotonic() - started, 1),
            },
        )

    def _load_profile(self, request: BookingRequest) -> tuple[Profile | None, str]:
        try:
            profile = self._profiles.load()
        except ProfileUnreadable as error:
            logger.error(
                "booking run can't read the Profile: %s", error, extra=_log_fields(request)
            )
            return None, "the saved Profile can't be read; save it again"
        if profile is None:
            logger.error("booking run found no Profile saved", extra=_log_fields(request))
            return None, "no Profile saved"
        return profile, ""

    def _pause(self, heartbeat: Callable[[], None]) -> None:
        seconds = self._random.uniform(
            self._rules.pause_min.total_seconds(), self._rules.pause_max.total_seconds()
        )
        self._sleeper.sleep(timedelta(seconds=seconds))
        heartbeat()

    def _book_slot(
        self, request: BookingRequest, slot: time, profile: Profile, heartbeat: Callable[[], None]
    ) -> SlotResult:
        retries = 0
        while True:
            attempted_at = self._clock.now()
            self._record(
                request,
                SlotResult(slot, SlotStatus.BOOKING, attempted_at=attempted_at, retries=retries),
            )
            attempt = self._attempt(request, slot, profile, retries)
            heartbeat()
            if isinstance(attempt.outcome, NetworkError) and retries < self._rules.max_retries:
                self._sleeper.sleep(self._rules.retry_backoff * 2**retries)
                heartbeat()
                retries += 1
                continue
            status, reason = _status_of(attempt, retries)
            result = SlotResult(
                slot,
                status,
                reason=reason,
                attempted_at=attempted_at,
                retries=retries,
                screenshot=attempt.screenshot,
            )
            self._record(request, result)
            return result

    def _attempt(
        self, request: BookingRequest, slot: time, profile: Profile, retries: int
    ) -> SlotAttempt:
        fields = {**_log_fields(request), "slot": slot_text(slot), "retry": retries}
        try:
            attempt = self._site.book(request.play_date, slot, profile, dry_run=False)
        except Exception as error:
            # The adapter turns every expected failure into an outcome; anything else is a bug.
            # Failing just this Slot keeps the others going and the request from hanging.
            logger.exception("slot attempt crashed", extra=fields)
            return SlotAttempt(
                outcome=Rejected(f"court-booker error: {type(error).__name__}"),
                screenshot=None,
                duration=timedelta(0),
            )
        outcome = attempt.outcome
        logger.info(
            "slot attempt finished",
            extra={
                **fields,
                "outcome": type(outcome).__name__,
                "step": outcome.step if isinstance(outcome, NetworkError) else None,
                "detail": _detail(attempt),
                "duration_seconds": round(attempt.duration.total_seconds(), 1),
            },
        )
        return attempt

    def _record(self, request: BookingRequest, result: SlotResult) -> None:
        self._recorder.record_slot(request.id, result)
        if result.status is not SlotStatus.BOOKING:
            logger.info(
                "slot result: %s",
                result.status.value,
                extra={
                    **_log_fields(request),
                    "slot": slot_text(result.slot),
                    "status": result.status.value,
                    "reason": result.reason,
                    "retry": result.retries,
                },
            )


def _status_of(attempt: SlotAttempt, retries: int) -> tuple[SlotStatus, str | None]:
    """The Slot's final status and, for Failed, why, in words for the Operator."""
    match attempt.outcome:
        case Booked():
            return SlotStatus.BOOKED, None
        case Taken():
            return SlotStatus.TAKEN, None
        case NotOpen():
            return SlotStatus.FAILED, NOT_OPEN_REASON
        case Rejected(message=message):
            return SlotStatus.FAILED, message
        case NetworkError(step=step):
            tries = "1 try" if retries == 0 else f"{retries + 1} tries"
            return SlotStatus.FAILED, f"Picktime didn't answer ({step}) after {tries}"
        case ReadyToBook():
            # Only a dry run fills the form without booking; a real run must never see it.
            return SlotStatus.FAILED, "the form was filled but not submitted"


def _detail(attempt: SlotAttempt) -> str | None:
    # Picktime's own words or the browser's error; never the Profile.
    match attempt.outcome:
        case NetworkError(detail=detail):
            return detail
        case Rejected(message=message):
            return message
        case _:
            return None


def _log_fields(request: BookingRequest) -> dict[str, object]:
    return {"request_id": request.id, "play_date": request.play_date.isoformat()}
