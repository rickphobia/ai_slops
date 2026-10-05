from dataclasses import replace
from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from court_booker.schedule.schedule import ScheduleRules, release_time, run_time, venue_today
from tests.support import FixedRandom

VENUE = ZoneInfo("Asia/Kuala_Lumpur")
RULES = ScheduleRules(
    venue_timezone=VENUE,
    booking_window_days=2,
    jitter_min=timedelta(seconds=60),
    jitter_max=timedelta(seconds=120),
    open_date_delay=timedelta(seconds=60),
)
# 12:00 venue time on 6 October.
NOON_ON_THE_6TH = datetime(2026, 10, 6, 4, 0, tzinfo=UTC)


def venue_time(
    year: int, month: int, day: int, hour: int, minute: int, second: int = 0
) -> datetime:
    return datetime(year, month, day, hour, minute, second, tzinfo=VENUE)


@pytest.mark.parametrize(
    ("play_date", "expected"),
    [
        (date(2026, 10, 9), venue_time(2026, 10, 7, 0, 0)),
        # Month end, year end and a leap day.
        (date(2026, 11, 1), venue_time(2026, 10, 30, 0, 0)),
        (date(2027, 1, 1), venue_time(2026, 12, 30, 0, 0)),
        (date(2028, 3, 1), venue_time(2028, 2, 28, 0, 0)),
        (date(2028, 3, 2), venue_time(2028, 2, 29, 0, 0)),
    ],
)
def test_release_time_is_venue_midnight_booking_window_days_before(
    play_date: date, expected: datetime
) -> None:
    assert release_time(play_date, RULES) == expected


def test_release_time_follows_the_booking_window_setting() -> None:
    rules = replace(RULES, booking_window_days=7)

    assert release_time(date(2026, 10, 9), rules) == venue_time(2026, 10, 2, 0, 0)


@pytest.mark.parametrize(
    ("fraction", "expected"),
    [
        (0.0, venue_time(2026, 10, 7, 0, 1, 0)),
        (0.5, venue_time(2026, 10, 7, 0, 1, 30)),
        (1.0, venue_time(2026, 10, 7, 0, 2, 0)),
    ],
)
def test_a_future_date_runs_within_the_jitter_window_after_release_time(
    fraction: float, expected: datetime
) -> None:
    assert run_time(date(2026, 10, 9), NOON_ON_THE_6TH, RULES, FixedRandom(fraction)) == expected


def test_run_time_is_returned_in_utc() -> None:
    result = run_time(date(2026, 10, 9), NOON_ON_THE_6TH, RULES, FixedRandom(0.0))

    assert result.tzinfo == UTC
    assert result == datetime(2026, 10, 6, 16, 1, tzinfo=UTC)


def test_a_date_far_ahead_runs_after_its_own_release_time() -> None:
    result = run_time(date(2027, 6, 30), NOON_ON_THE_6TH, RULES, FixedRandom(0.5))

    assert result == venue_time(2027, 6, 28, 0, 1, 30)


@pytest.mark.parametrize(
    "play_date",
    [
        date(2026, 10, 6),  # today
        date(2026, 10, 8),  # released at the last venue midnight
    ],
)
def test_an_already_open_date_runs_after_the_short_delay(play_date: date) -> None:
    result = run_time(play_date, NOON_ON_THE_6TH, RULES, FixedRandom(0.5))

    assert result == NOON_ON_THE_6TH + timedelta(seconds=60)


def test_a_date_released_this_very_instant_counts_as_open() -> None:
    now = venue_time(2026, 10, 7, 0, 0).astimezone(UTC)

    assert run_time(date(2026, 10, 9), now, RULES, FixedRandom(0.5)) == now + timedelta(seconds=60)


def test_one_second_before_release_time_still_waits_for_it() -> None:
    now = venue_time(2026, 10, 6, 23, 59, 59).astimezone(UTC)

    assert run_time(date(2026, 10, 9), now, RULES, FixedRandom(0.0)) == venue_time(
        2026, 10, 7, 0, 1
    )


def test_venue_today_uses_the_venue_timezone_not_utc() -> None:
    # 16:00 UTC on the 6th is already midnight on the 7th in Malaysia.
    assert venue_today(datetime(2026, 10, 6, 16, 0, tzinfo=UTC), RULES) == date(2026, 10, 7)
    assert venue_today(datetime(2026, 10, 6, 15, 59, tzinfo=UTC), RULES) == date(2026, 10, 6)
