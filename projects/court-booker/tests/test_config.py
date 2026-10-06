from datetime import time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

from court_booker.auth.passwords import parse_password_hash
from court_booker.config import ConfigError, Settings, load_settings
from court_booker.schedule.schedule import ScheduleRules
from tests.support import OPERATOR_PASSWORD_HASH, PROFILE_KEY, SESSION_SECRET, required_env


def test_defaults_apply_when_only_the_secrets_are_set() -> None:
    assert load_settings(required_env()) == Settings(
        log_level="INFO",
        host="127.0.0.1",
        port=8000,
        root_path="/ai-projects/court-booker",
        database_path=Path("data/court-booker.sqlite3"),
        operator_password_hash=parse_password_hash(OPERATOR_PASSWORD_HASH),
        session_secret=SESSION_SECRET.encode(),
        session_lifetime=timedelta(days=30),
        secure_cookies=True,
        login_max_failures=5,
        login_lockout=timedelta(minutes=15),
        profile_key=PROFILE_KEY.encode(),
        slots=(time(8), time(10), time(12), time(14), time(16), time(18), time(20)),
        schedule=ScheduleRules(
            venue_timezone=ZoneInfo("Asia/Kuala_Lumpur"),
            booking_window_days=2,
            jitter_min=timedelta(seconds=60),
            jitter_max=timedelta(seconds=120),
            open_date_delay=timedelta(seconds=60),
        ),
        picktime_url="https://www.picktime.com/f1bb4627-4b1b-483d-b746-4c34c8808d53",
        court_name="Badminton Hall 1",
        picktime_page_timeout=timedelta(seconds=30),
        screenshot_dir=Path("data/screenshots"),
    )


def test_reads_every_setting_from_the_environment() -> None:
    settings = load_settings(
        required_env(
            COURT_BOOKER_LOG_LEVEL="debug",
            COURT_BOOKER_HOST="0.0.0.0",
            COURT_BOOKER_PORT="9000",
            COURT_BOOKER_ROOT_PATH="/elsewhere/",
            COURT_BOOKER_DATABASE_PATH="/data/db.sqlite3",
            COURT_BOOKER_SESSION_DAYS="7",
            COURT_BOOKER_SECURE_COOKIES="false",
            COURT_BOOKER_LOGIN_MAX_FAILURES="3",
            COURT_BOOKER_LOGIN_LOCKOUT_MINUTES="60",
            COURT_BOOKER_SLOTS=" 19:30, 09:00 ",
            COURT_BOOKER_VENUE_TIMEZONE="Asia/Singapore",
            COURT_BOOKER_BOOKING_WINDOW_DAYS="0",
            COURT_BOOKER_RUN_JITTER_MIN_SECONDS="0",
            COURT_BOOKER_RUN_JITTER_MAX_SECONDS="30",
            COURT_BOOKER_OPEN_DATE_DELAY_SECONDS="5",
            COURT_BOOKER_PICKTIME_URL="http://127.0.0.1:9999/booking",
            COURT_BOOKER_COURT_NAME="Court 2",
            COURT_BOOKER_PICKTIME_TIMEOUT_SECONDS="45",
            COURT_BOOKER_SCREENSHOT_DIR="/data/screenshots",
        )
    )

    assert settings == Settings(
        log_level="DEBUG",
        host="0.0.0.0",
        port=9000,
        root_path="/elsewhere",
        database_path=Path("/data/db.sqlite3"),
        operator_password_hash=parse_password_hash(OPERATOR_PASSWORD_HASH),
        session_secret=SESSION_SECRET.encode(),
        session_lifetime=timedelta(days=7),
        secure_cookies=False,
        login_max_failures=3,
        login_lockout=timedelta(minutes=60),
        profile_key=PROFILE_KEY.encode(),
        slots=(time(9), time(19, 30)),
        schedule=ScheduleRules(
            venue_timezone=ZoneInfo("Asia/Singapore"),
            booking_window_days=0,
            jitter_min=timedelta(0),
            jitter_max=timedelta(seconds=30),
            open_date_delay=timedelta(seconds=5),
        ),
        picktime_url="http://127.0.0.1:9999/booking",
        court_name="Court 2",
        picktime_page_timeout=timedelta(seconds=45),
        screenshot_dir=Path("/data/screenshots"),
    )


def test_secrets_are_kept_out_of_the_settings_repr() -> None:
    text = repr(load_settings(required_env()))

    assert SESSION_SECRET not in text
    assert PROFILE_KEY not in text
    assert OPERATOR_PASSWORD_HASH.split(":")[-1] not in text


@pytest.mark.parametrize(
    "variable",
    [
        "COURT_BOOKER_OPERATOR_PASSWORD_HASH",
        "COURT_BOOKER_SESSION_SECRET",
        "COURT_BOOKER_PROFILE_KEY",
    ],
)
def test_a_missing_secret_fails_naming_the_variable(variable: str) -> None:
    environ = required_env()
    del environ[variable]

    with pytest.raises(ConfigError, match=f"{variable} is required"):
        load_settings(environ)


@pytest.mark.parametrize(
    ("variable", "value"),
    [
        ("COURT_BOOKER_LOG_LEVEL", "LOUD"),
        ("COURT_BOOKER_PORT", "eighty"),
        ("COURT_BOOKER_PORT", "0"),
        ("COURT_BOOKER_PORT", "70000"),
        ("COURT_BOOKER_HOST", "  "),
        ("COURT_BOOKER_ROOT_PATH", "no-leading-slash"),
        ("COURT_BOOKER_DATABASE_PATH", " "),
        ("COURT_BOOKER_OPERATOR_PASSWORD_HASH", "plain-text-password"),
        ("COURT_BOOKER_SESSION_SECRET", "too-short"),
        ("COURT_BOOKER_SESSION_DAYS", "0"),
        ("COURT_BOOKER_SECURE_COOKIES", "yes"),
        ("COURT_BOOKER_LOGIN_MAX_FAILURES", "five"),
        ("COURT_BOOKER_LOGIN_LOCKOUT_MINUTES", "-1"),
        ("COURT_BOOKER_PROFILE_KEY", "not-a-fernet-key"),
        ("COURT_BOOKER_SLOTS", ""),
        ("COURT_BOOKER_SLOTS", "08:00,8pm"),
        ("COURT_BOOKER_SLOTS", "08:00,08:00"),
        ("COURT_BOOKER_SLOTS", "08:00:30"),
        ("COURT_BOOKER_VENUE_TIMEZONE", "Malaysia/Nowhere"),
        ("COURT_BOOKER_VENUE_TIMEZONE", "../etc/passwd"),
        ("COURT_BOOKER_BOOKING_WINDOW_DAYS", "-1"),
        ("COURT_BOOKER_RUN_JITTER_MIN_SECONDS", "-5"),
        ("COURT_BOOKER_RUN_JITTER_MAX_SECONDS", "soon"),
        ("COURT_BOOKER_OPEN_DATE_DELAY_SECONDS", "-1"),
        ("COURT_BOOKER_PICKTIME_URL", "www.picktime.com/page"),
        ("COURT_BOOKER_COURT_NAME", " "),
        ("COURT_BOOKER_PICKTIME_TIMEOUT_SECONDS", "0"),
        ("COURT_BOOKER_SCREENSHOT_DIR", " "),
    ],
)
def test_a_bad_value_fails_naming_the_variable(variable: str, value: str) -> None:
    with pytest.raises(ConfigError, match=variable):
        load_settings(required_env(**{variable: value}))


def test_a_bad_password_hash_is_not_echoed_in_the_error() -> None:
    with pytest.raises(ConfigError) as error:
        load_settings(required_env(COURT_BOOKER_OPERATOR_PASSWORD_HASH="hunter2"))

    assert "hunter2" not in str(error.value)


def test_a_bad_profile_key_is_not_echoed_in_the_error() -> None:
    with pytest.raises(ConfigError, match="not a Fernet key") as error:
        load_settings(required_env(COURT_BOOKER_PROFILE_KEY="short-secret-key"))

    assert "short-secret-key" not in str(error.value)


def test_a_jitter_window_that_ends_before_it_starts_fails() -> None:
    with pytest.raises(ConfigError, match="COURT_BOOKER_RUN_JITTER_MAX_SECONDS"):
        load_settings(
            required_env(
                COURT_BOOKER_RUN_JITTER_MIN_SECONDS="120", COURT_BOOKER_RUN_JITTER_MAX_SECONDS="60"
            )
        )
