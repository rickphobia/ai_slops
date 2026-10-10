"""Runs one claimed Booking Request: books each Slot in time order and records every outcome."""

import logging
import time as monotonic_time
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, time, timedelta
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
    SlotOutcome,
    Taken,
)
from court_booker.profile.profile import Profile, ProfileStore, ProfileUnreadable
from court_booker.random_source import RandomSource
from court_booker.schedule.schedule import ScheduleRules, release_time

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
    # A date found closed this soon after its Release Time is tried again, every retry_backoff:
    # Picktime may open it a few seconds late, or its page may still be loading.
    not_open_grace: timedelta


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
        schedule: ScheduleRules,
    ) -> None:
        self._recorder = recorder
        self._profiles = profiles
        self._site = site
        self._clock = clock
        self._sleeper = sleeper
        self._random = random
        self._rules = rules
        self._schedule = schedule

    def run(self, request: BookingRequest, heartbeat: Callable[[], None]) -> None:
        """Try every Slot of `request`, calling `heartbeat` after each attempt and each wait.

        One Slot's failure never stops the others, except a date that is still not open once the
        grace period after its Release Time is over: that fails every Slot left without asking
        the site again.
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
            not_open = isinstance(self._book_slot(request, slot, profile, heartbeat), NotOpen)
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
    ) -> SlotOutcome:
        """Book one Slot, retrying network errors and a date not open just after Release Time;
        record its result and return the outcome.
        """
        retries = 0
        grace_ends = release_time(request.play_date, self._schedule) + self._rules.not_open_grace
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
            if isinstance(attempt.outcome, NotOpen) and self._try_again_before(grace_ends):
                self._wait_for_date_to_open(request, slot, heartbeat)
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
            return attempt.outcome

    def _try_again_before(self, grace_ends: datetime) -> bool:
        return self._clock.now() + self._rules.retry_backoff < grace_ends

    def _wait_for_date_to_open(
        self, request: BookingRequest, slot: time, heartbeat: Callable[[], None]
    ) -> None:
        since_release = self._clock.now() - release_time(request.play_date, self._schedule)
        logger.info(
            "date not open yet, trying again",
            extra={
                **_log_fields(request),
                "slot": slot_text(slot),
                "seconds_since_release": round(since_release.total_seconds(), 1),
            },
        )
        self._sleeper.sleep(self._rules.retry_backoff)
        heartbeat()

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
