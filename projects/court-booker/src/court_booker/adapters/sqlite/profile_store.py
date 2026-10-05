"""The Profile in SQLite as one Fernet-encrypted record (decision 0003)."""

import json
from dataclasses import asdict
from datetime import UTC

from cryptography.fernet import Fernet, InvalidToken

from court_booker.adapters.sqlite.database import SqliteDatabase
from court_booker.clock import Clock
from court_booker.profile.profile import Profile


class ProfileUnreadable(Exception):
    """The stored Profile can't be decrypted, most likely because the key changed."""


class SqliteProfileStore:
    def __init__(self, database: SqliteDatabase, key: bytes, clock: Clock) -> None:
        self._database = database
        self._fernet = Fernet(key)
        self._clock = clock

    def load(self) -> Profile | None:
        with self._database.connection() as connection:
            row = connection.execute("SELECT token FROM profile WHERE id = 1").fetchone()
        if row is None:
            return None
        try:
            fields = json.loads(self._fernet.decrypt(row[0]))
        except InvalidToken:
            raise ProfileUnreadable(
                "the stored Profile can't be decrypted with COURT_BOOKER_PROFILE_KEY; "
                "restore the key it was saved with, or delete the profile row and re-enter it"
            ) from None
        return Profile(**fields)

    def save(self, profile: Profile) -> None:
        token = self._fernet.encrypt(json.dumps(asdict(profile)).encode())
        updated_at = self._clock.now().astimezone(UTC).isoformat(timespec="seconds")
        with self._database.connection() as connection:
            connection.execute(
                "INSERT INTO profile (id, token, updated_at) VALUES (1, ?, ?) "
                "ON CONFLICT (id) DO UPDATE SET token = excluded.token, "
                "updated_at = excluded.updated_at",
                (token, updated_at),
            )
