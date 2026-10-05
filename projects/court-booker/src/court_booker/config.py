"""Every setting court-booker reads, loaded from the environment and validated once at startup."""

from collections.abc import Mapping
from dataclasses import dataclass

LOG_LEVELS = ("DEBUG", "INFO", "WARNING", "ERROR")


class ConfigError(Exception):
    """A setting is missing or has a value court-booker can't use."""


@dataclass(frozen=True)
class Settings:
    log_level: str
    host: str
    port: int
    # The public path prefix the host nginx serves the app under.
    root_path: str


def load_settings(environ: Mapping[str, str]) -> Settings:
    """Build Settings from `environ`, raising ConfigError that names the first bad variable."""
    return Settings(
        log_level=_log_level(environ, "COURT_BOOKER_LOG_LEVEL", default="INFO"),
        host=_non_blank(environ, "COURT_BOOKER_HOST", default="127.0.0.1"),
        port=_port(environ, "COURT_BOOKER_PORT", default=8000),
        root_path=_root_path(
            environ, "COURT_BOOKER_ROOT_PATH", default="/ai-projects/court-booker"
        ),
    )


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


def _port(environ: Mapping[str, str], name: str, *, default: int) -> int:
    raw = environ.get(name, str(default)).strip()
    try:
        port = int(raw)
    except ValueError:
        raise ConfigError(f"{name} must be a whole number, got {raw!r}") from None
    if not 1 <= port <= 65535:
        raise ConfigError(f"{name} must be between 1 and 65535, got {port}")
    return port


def _root_path(environ: Mapping[str, str], name: str, *, default: str) -> str:
    value = environ.get(name, default).strip()
    if not value.startswith("/"):
        raise ConfigError(f"{name} must start with '/', got {value!r}")
    return value.rstrip("/")
