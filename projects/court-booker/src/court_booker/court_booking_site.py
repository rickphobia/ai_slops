"""The interface for booking one Slot on the venue's booking site, and what an attempt returns."""

from dataclasses import dataclass
from datetime import date, time, timedelta
from pathlib import Path
from typing import Protocol

from court_booker.profile.profile import Profile


@dataclass(frozen=True)
class Booked:
    """The site confirmed the Booking."""


@dataclass(frozen=True)
class Taken:
    """Someone else has the Slot."""


@dataclass(frozen=True)
class NotOpen:
    """The date isn't open for booking on the site yet."""


@dataclass(frozen=True)
class NetworkError:
    """The page didn't load or answer in time; trying again may work."""

    step: str
    detail: str


@dataclass(frozen=True)
class Rejected:
    """The site refused the booking with its own message (for example, a per-unit limit)."""

    message: str


@dataclass(frozen=True)
class ReadyToBook:
    """Dry run: the form is filled for the Slot and was not submitted."""


SlotOutcome = Booked | Taken | NotOpen | NetworkError | Rejected | ReadyToBook


@dataclass(frozen=True)
class SlotAttempt:
    outcome: SlotOutcome
    # None only when the browser failed before there was a page to capture.
    screenshot: Path | None
    duration: timedelta


class CourtBookingSite(Protocol):
    def book(self, day: date, slot: time, profile: Profile, *, dry_run: bool) -> SlotAttempt:
        """Book `slot` on `day` for `profile`; with `dry_run`, fill everything but don't submit."""
        ...
