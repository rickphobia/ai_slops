"""Fakes and builders shared by the tests."""

import re
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, time, timedelta
from pathlib import Path

from fastapi.testclient import TestClient

from court_booker.adapters.sqlite.booking_request_store import SqliteBookingRequestRepository
from court_booker.adapters.sqlite.database import SqliteDatabase
from court_booker.adapters.sqlite.login_failures import SqliteLoginFailures
from court_booker.adapters.sqlite.profile_store import SqliteProfileStore
from court_booker.auth.passwords import hash_password
from court_booker.config import load_settings
from court_booker.court_booking_site import Booked, SlotAttempt, SlotOutcome
from court_booker.profile.profile import Profile
from court_booker.scheduler.scheduler import Scheduler
from court_booker.web.app import create_app

PREFIX = "/ai-projects/court-booker"
OPERATOR_PASSWORD = "correct horse battery staple"
# A cheap scrypt cost keeps the tests fast; production hashes use the default cost.
OPERATOR_PASSWORD_HASH = str(hash_password(OPERATOR_PASSWORD, cost=2**10))
SESSION_SECRET = "s" * 32
PROFILE_KEY = "k" * 43 + "="  # any 32 bytes in url-safe base64 is a Fernet key


class FakeClock:
    def __init__(self, start: datetime = datetime(2026, 10, 6, 12, 0, tzinfo=UTC)) -> None:
        self.current = start
        self.sleeps: list[timedelta] = []

    def now(self) -> datetime:
        return self.current

    def advance(self, delta: timedelta) -> None:
        self.current += delta

    def sleep(self, duration: timedelta) -> None:
        """Waiting just moves the fake time on; `sleeps` records each wait."""
        self.sleeps.append(duration)
        self.current += duration


class FixedRandom:
    """Always picks the same point in a range: 0.0 is its low end, 1.0 its high end."""

    def __init__(self, fraction: float = 0.5) -> None:
        self.fraction = fraction

    def uniform(self, low: float, high: float) -> float:
        return low + (high - low) * self.fraction


@dataclass(frozen=True)
class BookCall:
    day: date
    slot: time
    profile: Profile
    dry_run: bool
    # The fake clock's time when the call was made.
    at: datetime


@dataclass
class FakeSite:
    """A CourtBookingSite that answers from a script per Slot and records every call.

    A Slot with no script left is Booked. `during_book`, if set, runs inside each call, to act
    while a run is in progress.
    """

    clock: FakeClock
    script: dict[time, list[SlotOutcome]] = field(default_factory=dict)
    calls: list[BookCall] = field(default_factory=list)
    attempt_duration: timedelta = timedelta(seconds=8)
    during_book: Callable[[], None] | None = None

    def book(self, day: date, slot: time, profile: Profile, *, dry_run: bool) -> SlotAttempt:
        self.calls.append(BookCall(day, slot, profile, dry_run, self.clock.now()))
        if self.during_book:
            self.during_book()
        outcomes = self.script.get(slot, [])
        outcome = outcomes.pop(0) if outcomes else Booked()
        self.clock.advance(self.attempt_duration)
        return SlotAttempt(
            outcome=outcome,
            screenshot=Path(f"/screens/{day}-{slot:%H%M}-{len(self.calls)}.png"),
            duration=self.attempt_duration,
        )


def required_env(**overrides: str) -> dict[str, str]:
    """The smallest environment the app starts with, plus `overrides`."""
    return {
        "COURT_BOOKER_OPERATOR_PASSWORD_HASH": OPERATOR_PASSWORD_HASH,
        "COURT_BOOKER_SESSION_SECRET": SESSION_SECRET,
        "COURT_BOOKER_PROFILE_KEY": PROFILE_KEY,
        **overrides,
    }


def make_client(
    database_path: Path,
    clock: FakeClock,
    random_source: FixedRandom | None = None,
    site: FakeSite | None = None,
    **env: str,
) -> TestClient:
    """The whole app over a real SQLite file, as the server builds it, at a fake time.

    The scheduler doesn't tick by itself unless the client is used as a context manager
    (which runs startup); tests call `tick(client)` instead.
    """
    settings = load_settings(required_env(COURT_BOOKER_DATABASE_PATH=str(database_path), **env))
    database = SqliteDatabase(settings.database_path)
    database.migrate()
    app = create_app(
        settings,
        login_failures=SqliteLoginFailures(database),
        profile_store=SqliteProfileStore(database, settings.profile_key, clock),
        booking_request_store=SqliteBookingRequestRepository(database),
        court_booking_site=site or FakeSite(clock),
        clock=clock,
        sleeper=clock,
        random_source=random_source or FixedRandom(),
    )
    # https, because the session cookie is Secure and the client won't send it over http.
    return TestClient(app, base_url="https://testserver")


def csrf_token_in(html: str) -> str:
    match = re.search(r'name="csrf_token" value="([^"]+)"', html)
    assert match, "page has no CSRF token"
    return match.group(1)


def tick(client: TestClient) -> int:
    """Run one scheduler tick at the fake clock's time; return how many requests ran."""
    scheduler: Scheduler = client.app.state.scheduler  # type: ignore[attr-defined]
    return scheduler.tick()
