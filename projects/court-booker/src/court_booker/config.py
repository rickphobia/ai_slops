"""Every setting court-booker reads, loaded from the environment and validated once at startup."""

from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import timedelta
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from cryptography.fernet import Fernet

from court_booker.auth.passwords import InvalidPasswordHash, PasswordHash, parse_password_hash

LOG_LEVELS = ("DEBUG", "INFO", "WARNING", "ERROR")
_MIN_SESSION_SECRET_LENGTH = 32


class ConfigError(Exception):
    """A setting is missing or has a value court-booker can't use."""


@dataclass(frozen=True)
class Settings:
    log_level: str
    host: str
    port: int
    # The public path prefix the host nginx serves the app under.
    root_path: str
    database_path: Path
    operator_password_hash: PasswordHash = field(repr=False)
    session_secret: bytes = field(repr=False)
    session_lifetime: timedelta
    # Off only for local runs over plain http; the public site is https.
    secure_cookies: bool
    login_max_failures: int
    login_lockout: timedelta
    # Encrypts the Profile in the database (decision 0003).
    profile_key: bytes = field(repr=False)
    # The public Picktime booking page, and the Court's name as that page lists it.
    picktime_url: str
    court_name: str
    # An IANA name; the browser runs in it, because the page shows Slot times in local time.
    venue_timezone: str
    picktime_page_timeout: timedelta
    # Every booking attempt saves a screenshot of the page here.
    screenshot_dir: Path


def load_settings(environ: Mapping[str, str]) -> Settings:
    """Build Settings from `environ`, raising ConfigError that names the first bad variable."""
    return Settings(
        log_level=_log_level(environ, "COURT_BOOKER_LOG_LEVEL", default="INFO"),
        host=_non_blank(environ, "COURT_BOOKER_HOST", default="127.0.0.1"),
        port=_port(environ, "COURT_BOOKER_PORT", default=8000),
        root_path=_root_path(
            environ, "COURT_BOOKER_ROOT_PATH", default="/ai-projects/court-booker"
        ),
        database_path=Path(
            _non_blank(environ, "COURT_BOOKER_DATABASE_PATH", default="data/court-booker.sqlite3")
        ),
        operator_password_hash=_password_hash(environ, "COURT_BOOKER_OPERATOR_PASSWORD_HASH"),
        session_secret=_session_secret(environ, "COURT_BOOKER_SESSION_SECRET"),
        session_lifetime=timedelta(
            days=_positive_int(environ, "COURT_BOOKER_SESSION_DAYS", default=30)
        ),
        secure_cookies=_boolean(environ, "COURT_BOOKER_SECURE_COOKIES", default=True),
        login_max_failures=_positive_int(environ, "COURT_BOOKER_LOGIN_MAX_FAILURES", default=5),
        login_lockout=timedelta(
            minutes=_positive_int(environ, "COURT_BOOKER_LOGIN_LOCKOUT_MINUTES", default=15)
        ),
        profile_key=_fernet_key(environ, "COURT_BOOKER_PROFILE_KEY"),
        picktime_url=_http_url(
            environ,
            "COURT_BOOKER_PICKTIME_URL",
            default="https://www.picktime.com/f1bb4627-4b1b-483d-b746-4c34c8808d53",
        ),
        court_name=_non_blank(environ, "COURT_BOOKER_COURT_NAME", default="Badminton Hall 1"),
        venue_timezone=_timezone(
            environ, "COURT_BOOKER_VENUE_TIMEZONE", default="Asia/Kuala_Lumpur"
        ),
        picktime_page_timeout=timedelta(
            seconds=_positive_int(environ, "COURT_BOOKER_PICKTIME_TIMEOUT_SECONDS", default=30)
        ),
        screenshot_dir=Path(
            _non_blank(environ, "COURT_BOOKER_SCREENSHOT_DIR", default="data/screenshots")
        ),
    )


def _required(environ: Mapping[str, str], name: str) -> str:
    value = environ.get(name, "").strip()
    if not value:
        raise ConfigError(f"{name} is required (see .env.example)")
    return value


def _log_level(environ: Mapping[str, str], name: str, *, default: str) -> str:
    value = environ.get(name, default).strip().upper()
    if value not in LOG_LEVELS:
        raise ConfigError(f"{name} must be one of {', '.join(LOG_LEVELS)}, got {value!r}")
    return value


def _non_blank(environ: Mapping[str, str], name: str, *, default: str) -> str:
    value = environ.get(name, default).strip()
    if not value:
        raise ConfigError(f"{name} must not be blank")
    return value


def _whole_number(environ: Mapping[str, str], name: str, *, default: int) -> int:
    raw = environ.get(name, str(default)).strip()
    try:
        return int(raw)
    except ValueError:
        raise ConfigError(f"{name} must be a whole number, got {raw!r}") from None


def _port(environ: Mapping[str, str], name: str, *, default: int) -> int:
    port = _whole_number(environ, name, default=default)
    if not 1 <= port <= 65535:
        raise ConfigError(f"{name} must be between 1 and 65535, got {port}")
    return port


def _positive_int(environ: Mapping[str, str], name: str, *, default: int) -> int:
    number = _whole_number(environ, name, default=default)
    if number < 1:
        raise ConfigError(f"{name} must be at least 1, got {number}")
    return number


def _boolean(environ: Mapping[str, str], name: str, *, default: bool) -> bool:
    raw = environ.get(name, "true" if default else "false").strip().lower()
    if raw not in ("true", "false"):
        raise ConfigError(f"{name} must be true or false, got {raw!r}")
    return raw == "true"


def _root_path(environ: Mapping[str, str], name: str, *, default: str) -> str:
    value = environ.get(name, default).strip()
    if not value.startswith("/"):
        raise ConfigError(f"{name} must start with '/', got {value!r}")
    return value.rstrip("/")


def _http_url(environ: Mapping[str, str], name: str, *, default: str) -> str:
    value = _non_blank(environ, name, default=default)
    if not value.startswith(("https://", "http://")):
        raise ConfigError(f"{name} must be an http(s) URL, got {value!r}")
    return value


def _timezone(environ: Mapping[str, str], name: str, *, default: str) -> str:
    value = _non_blank(environ, name, default=default)
    try:
        ZoneInfo(value)
    except (ZoneInfoNotFoundError, ValueError):
        raise ConfigError(
            f"{name} must be an IANA timezone like Asia/Kuala_Lumpur, got {value!r}"
        ) from None
    return value


def _password_hash(environ: Mapping[str, str], name: str) -> PasswordHash:
    try:
        return parse_password_hash(_required(environ, name))
    except InvalidPasswordHash as error:
        # The message describes the format only; the value itself stays out of logs.
        raise ConfigError(
            f"{name} is not a hash from `court-booker hash-password`: {error}"
        ) from None


def _session_secret(environ: Mapping[str, str], name: str) -> bytes:
    value = _required(environ, name)
    if len(value) < _MIN_SESSION_SECRET_LENGTH:
        raise ConfigError(
            f"{name} must be at least {_MIN_SESSION_SECRET_LENGTH} characters "
            "(make one with `openssl rand -hex 32`)"
        )
    return value.encode()


def _fernet_key(environ: Mapping[str, str], name: str) -> bytes:
    key = _required(environ, name).encode()
    try:
        Fernet(key)
    except ValueError:
        # Like the other secrets, the value itself stays out of the message.
        raise ConfigError(
            f"{name} is not a Fernet key (32 random bytes in url-safe base64; "
            "see .env.example for how to make one)"
        ) from None
    return key
