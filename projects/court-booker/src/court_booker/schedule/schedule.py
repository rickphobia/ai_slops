"""When a date opens on Picktime and when its Booking Request runs. Pure functions, no I/O."""

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from court_booker.random_source import RandomSource


@dataclass(frozen=True)
class ScheduleRules:
    venue_timezone: ZoneInfo
    booking_window_days: int
    # A run starts a random moment in [jitter_min, jitter_max] after Release Time, so the
    # bookings look like a person's rather than arriving at the same instant every night.
    jitter_min: timedelta
    jitter_max: timedelta
    # How long after creation a request for an already open date runs.
    open_date_delay: timedelta


def venue_today(now: datetime, rules: ScheduleRules) -> date:
    """The date at the venue at `now`, which can differ from the UTC date."""
    return now.astimezone(rules.venue_timezone).date()


def release_time(play_date: date, rules: ScheduleRules) -> datetime:
    """Midnight venue time, Booking Window days before `play_date`."""
    release_day = play_date - timedelta(days=rules.booking_window_days)
    return datetime.combine(release_day, time(0), tzinfo=rules.venue_timezone)


def run_time(
    play_date: date, now: datetime, rules: ScheduleRules, random: RandomSource
) -> datetime:
    """When a Booking Request for `play_date` created at `now` should run, in UTC."""
    release = release_time(play_date, rules)
    if now >= release:
        return (now + rules.open_date_delay).astimezone(UTC)
    jitter_seconds = random.uniform(
        rules.jitter_min.total_seconds(), rules.jitter_max.total_seconds()
    )
    return (release + timedelta(seconds=jitter_seconds)).astimezone(UTC)
