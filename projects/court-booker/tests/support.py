"""Fakes and builders shared by the tests."""

import re
from datetime import UTC, datetime, timedelta
from pathlib import Path

from fastapi.testclient import TestClient

from court_booker.adapters.sqlite.database import SqliteDatabase
from court_booker.adapters.sqlite.login_failures import SqliteLoginFailures
from court_booker.adapters.sqlite.profile_store import SqliteProfileStore
from court_booker.auth.passwords import hash_password
from court_booker.config import load_settings
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

    def now(self) -> datetime:
        return self.current

    def advance(self, delta: timedelta) -> None:
        self.current += delta


def required_env(**overrides: str) -> dict[str, str]:
    """The smallest environment the app starts with, plus `overrides`."""
    return {
        "COURT_BOOKER_OPERATOR_PASSWORD_HASH": OPERATOR_PASSWORD_HASH,
        "COURT_BOOKER_SESSION_SECRET": SESSION_SECRET,
        "COURT_BOOKER_PROFILE_KEY": PROFILE_KEY,
        **overrides,
    }


def make_client(database_path: Path, clock: FakeClock, **env: str) -> TestClient:
    """The whole app over a real SQLite file, as the server builds it, at a fake time."""
    settings = load_settings(required_env(COURT_BOOKER_DATABASE_PATH=str(database_path), **env))
    database = SqliteDatabase(settings.database_path)
    database.migrate()
    app = create_app(
        settings,
        login_failures=SqliteLoginFailures(database),
        profile_store=SqliteProfileStore(database, settings.profile_key, clock),
        clock=clock,
    )
    # https, because the session cookie is Secure and the client won't send it over http.
    return TestClient(app, base_url="https://testserver")


def csrf_token_in(html: str) -> str:
    match = re.search(r'name="csrf_token" value="([^"]+)"', html)
    assert match, "page has no CSRF token"
    return match.group(1)
