"""Booking Requests: the rules for creating, editing and cancelling them, and their order."""

import logging
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from enum import StrEnum
from pathlib import Path
from typing import Protocol

from court_booker.clock import Clock
from court_booker.profile.profile import ProfileStore
from court_booker.random_source import RandomSource
from court_booker.schedule.schedule import ScheduleRules, run_time, venue_today

logger = logging.getLogger(__name__)

# A run that starts this long after its run time (the server was down) is shown as late.
LATE_AFTER = timedelta(minutes=5)


class BookingRequestStatus(StrEnum):
    WAITING = "Waiting"
    BOOKING = "Booking…"
    DONE = "Done"
    CANCELLED = "Cancelled"


class SlotStatus(StrEnum):
    WAITING = "Waiting"
    BOOKING = "Booking…"
    BOOKED = "Booked"
    TAKEN = "Taken"
    FAILED = "Failed"


@dataclass(frozen=True)
class SlotResult:
    """Where one Slot of a Booking Request stands, and how its last attempt went."""

    slot: time
    status: SlotStatus = SlotStatus.WAITING
    # Why it Failed, in words for the Operator.
    reason: str | None = None
    # When the last attempt started, in UTC.
    attempted_at: datetime | None = None
    # Network-error retries made after the first try.
    retries: int = 0
    screenshot: Path | None = None


@dataclass(frozen=True)
class BookingRequest:
    id: int
    play_date: date
    # Earliest first.
    slot_results: tuple[SlotResult, ...]
    status: BookingRequestStatus
    # Chosen once at creation, in UTC.
    run_at: datetime
    # When the scheduler claimed it, in UTC; None until it runs.
    started_at: datetime | None = None

    @property
    def ran_late(self) -> bool:
        return self.started_at is not None and self.started_at - self.run_at > LATE_AFTER

    @property
    def slots(self) -> tuple[time, ...]:
        return tuple(result.slot for result in self.slot_results)


def slot_text(slot: time) -> str:
    """A Slot's name: its start time as HH:MM, as forms, logs and the database use it."""
    return slot.isoformat("minutes")


class BookingRequestError(Exception):
    """A Booking Request rule was broken; the message is written for the Operator."""


class ProfileMissing(BookingRequestError):
    def __init__(self) -> None:
        super().__init__("Save the Profile first: Picktime needs it to make the Booking.")


class InvalidDate(BookingRequestError):
    def __init__(self) -> None:
        super().__init__("Pick a date.")


class DateInPast(BookingRequestError):
    def __init__(self, play_date: date) -> None:
        super().__init__(f"{play_date.isoformat()} is in the past. Pick today or a later date.")


class NoSlots(BookingRequestError):
    def __init__(self) -> None:
        super().__init__("Tick at least one Slot.")


class UnknownSlot(BookingRequestError):
    def __init__(self, slot_text: str) -> None:
        super().__init__(f"{slot_text!r} is not one of the Court's Slots.")


class DateTaken(BookingRequestError):
    def __init__(self, play_date: date) -> None:
        super().__init__(
            f"There is already a Booking Request for {play_date.isoformat()}. "
            "Edit that one instead."
        )


class NotWaiting(BookingRequestError):
    def __init__(self, request: BookingRequest) -> None:
        super().__init__(
            f"The Booking Request for {request.play_date.isoformat()} is {request.status}, "
            "so it can't be changed."
        )


class BookingRequestNotFound(BookingRequestError):
    def __init__(self, request_id: int) -> None:
        super().__init__(f"There is no Booking Request {request_id}.")


class BookingRequestRepository(Protocol):
    def add(
        self, play_date: date, slots: Sequence[time], run_at: datetime, created_at: datetime
    ) -> int:
        """Store a Waiting request and return its id; DateTaken if the date has a live one."""
        ...

    def get(self, request_id: int) -> BookingRequest | None: ...

    def all(self) -> list[BookingRequest]: ...

    def replace_slots_if_waiting(self, request_id: int, slots: Sequence[time]) -> bool:
        """Replace the Slots in one step with the status check; False if it isn't Waiting."""
        ...

    def cancel_if_waiting(self, request_id: int) -> bool:
        """Cancel in one step with the status check; False if it isn't Waiting."""
        ...


class BookingRequests:
    def __init__(
        self,
        *,
        repository: BookingRequestRepository,
        profiles: ProfileStore,
        clock: Clock,
        random: RandomSource,
        slots: Sequence[time],
        schedule: ScheduleRules,
    ) -> None:
        self._repository = repository
        self._profiles = profiles
        self._clock = clock
        self._random = random
        self.slots = tuple(slots)
        self.schedule = schedule

    def today(self) -> date:
        return venue_today(self._clock.now(), self.schedule)

    def create(self, date_text: str, slot_texts: Sequence[str]) -> BookingRequest:
        """Check every rule, then store a Waiting request with its run time chosen now."""
        if self._profiles.load() is None:
            raise ProfileMissing
        play_date = self._parse_date(date_text)
        slots = self._parse_slots(slot_texts)
        now = self._clock.now()
        run_at = run_time(play_date, now, self.schedule, self._random)
        request_id = self._repository.add(play_date, slots, run_at, now)
        logger.info(
            "booking request created",
            extra={
                "request_id": request_id,
                "play_date": play_date.isoformat(),
                "slots": [slot_text(slot) for slot in slots],
                "run_at": run_at.isoformat(),
            },
        )
        return self.get(request_id)

    def edit_slots(self, request_id: int, slot_texts: Sequence[str]) -> BookingRequest:
        """Replace the Slots of a Waiting request. Its date and run time stay as they were."""
        request = self.get(request_id)
        if request.play_date < self.today():
            raise DateInPast(request.play_date)
        slots = self._parse_slots(slot_texts)
        if not self._repository.replace_slots_if_waiting(request_id, slots):
            raise NotWaiting(self.get(request_id))
        logger.info(
            "booking request slots changed",
            extra={
                "request_id": request_id,
                "play_date": request.play_date.isoformat(),
                "slots": [slot_text(slot) for slot in slots],
            },
        )
        return self.get(request_id)

    def cancel(self, request_id: int) -> None:
        request = self.get(request_id)
        if not self._repository.cancel_if_waiting(request_id):
            raise NotWaiting(self.get(request_id))
        logger.info(
            "booking request cancelled",
            extra={"request_id": request_id, "play_date": request.play_date.isoformat()},
        )

    def get(self, request_id: int) -> BookingRequest:
        request = self._repository.get(request_id)
        if request is None:
            raise BookingRequestNotFound(request_id)
        return request

    def in_schedule_order(self) -> list[BookingRequest]:
        """Today and later first, soonest at the top; then past dates, most recent first."""
        today = self.today()
        requests = self._repository.all()
        upcoming = sorted((r for r in requests if r.play_date >= today), key=_by_date)
        past = sorted((r for r in requests if r.play_date < today), key=_by_date, reverse=True)
        return upcoming + past

    def _parse_date(self, date_text: str) -> date:
        try:
            play_date = date.fromisoformat(date_text.strip())
        except ValueError:
            raise InvalidDate from None
        if play_date < self.today():
            raise DateInPast(play_date)
        return play_date

    def _parse_slots(self, slot_texts: Sequence[str]) -> tuple[time, ...]:
        if not slot_texts:
            raise NoSlots
        by_text = {slot_text(slot): slot for slot in self.slots}
        chosen: set[time] = set()
        for text in slot_texts:
            if text not in by_text:
                raise UnknownSlot(text)
            chosen.add(by_text[text])
        return tuple(sorted(chosen))


def _by_date(request: BookingRequest) -> date:
    return request.play_date
