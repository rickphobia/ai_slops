from datetime import UTC, date, datetime, time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

from court_booker.adapters.sqlite.booking_request_store import SqliteBookingRequestRepository
from court_booker.adapters.sqlite.database import SqliteDatabase
from court_booker.booking_requests.booking_requests import (
    BookingRequests,
    DateInPast,
    NoSlots,
    ProfileMissing,
    UnknownSlot,
)
from court_booker.profile.profile import Profile
from court_booker.schedule.schedule import ScheduleRules
from tests.support import FakeClock, FixedRandom

PROFILE = Profile(
    first_name="Meiling", email="meiling@example.com", unit_number="B-07-11", mobile="0198765432"
)
RULES = ScheduleRules(
    venue_timezone=ZoneInfo("Asia/Kuala_Lumpur"),
    booking_window_days=2,
    jitter_min=timedelta(seconds=60),
    jitter_max=timedelta(seconds=120),
    open_date_delay=timedelta(seconds=60),
)


class FakeProfileStore:
    def __init__(self, profile: Profile | None = PROFILE) -> None:
        self.profile = profile

    def load(self) -> Profile | None:
        return self.profile

    def save(self, profile: Profile) -> None:
        self.profile = profile


@pytest.fixture
def clock() -> FakeClock:
    # 20:00 on 6 October, venue time.
    return FakeClock(datetime(2026, 10, 6, 12, 0, tzinfo=UTC))


def booking_requests(
    tmp_path: Path, clock: FakeClock, profiles: FakeProfileStore | None = None
) -> BookingRequests:
    database = SqliteDatabase(tmp_path / "court-booker.sqlite3")
    database.migrate()
    return BookingRequests(
        repository=SqliteBookingRequestRepository(database),
        profiles=profiles or FakeProfileStore(),
        clock=clock,
        random=FixedRandom(0.5),
        slots=(time(8), time(10), time(20)),
        schedule=RULES,
    )


def test_create_stores_the_slots_in_order_and_the_run_time(
    tmp_path: Path, clock: FakeClock
) -> None:
    created = booking_requests(tmp_path, clock).create("2026-10-09", ["20:00", "08:00", "20:00"])

    assert created.play_date == date(2026, 10, 9)
    assert created.slots == (time(8), time(20))
    assert created.run_at == datetime(2026, 10, 6, 16, 1, 30, tzinfo=UTC)


@pytest.mark.parametrize(
    ("slot_texts", "error"), [([], NoSlots), (["8:00"], UnknownSlot), (["12:00"], UnknownSlot)]
)
def test_slots_must_be_ticked_and_configured(
    tmp_path: Path, clock: FakeClock, slot_texts: list[str], error: type[Exception]
) -> None:
    with pytest.raises(error):
        booking_requests(tmp_path, clock).create("2026-10-09", slot_texts)


def test_a_profile_is_checked_before_anything_else(tmp_path: Path, clock: FakeClock) -> None:
    service = booking_requests(tmp_path, clock, FakeProfileStore(None))

    with pytest.raises(ProfileMissing):
        service.create("not a date", [])


def test_a_request_whose_date_has_passed_can_no_longer_be_edited(
    tmp_path: Path, clock: FakeClock
) -> None:
    service = booking_requests(tmp_path, clock)
    created = service.create("2026-10-07", ["08:00"])
    clock.advance(timedelta(days=2))

    with pytest.raises(DateInPast):
        service.edit_slots(created.id, ["10:00"])
    assert service.get(created.id).slots == (time(8),)


def test_schedule_order_puts_today_and_later_first_then_the_past_newest_first(
    tmp_path: Path, clock: FakeClock
) -> None:
    service = booking_requests(tmp_path, clock)
    for play_date in ["2026-10-20", "2026-10-06", "2026-10-07", "2026-10-10"]:
        service.create(play_date, ["08:00"])
    # 00:30 on 10 October, venue time.
    clock.current = datetime(2026, 10, 9, 16, 30, tzinfo=UTC)

    order = [request.play_date.day for request in service.in_schedule_order()]

    assert order == [10, 20, 7, 6]
