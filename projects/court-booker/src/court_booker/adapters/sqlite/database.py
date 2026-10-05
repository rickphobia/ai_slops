"""The SQLite database file: opening connections and applying schema migrations."""

import logging
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

logger = logging.getLogger(__name__)

# Each entry moves the schema one version up; PRAGMA user_version records how far a file got.
# Append new migrations; never edit one that has shipped.
MIGRATIONS: tuple[str, ...] = (
    """
    CREATE TABLE login_failures (
        id INTEGER PRIMARY KEY,
        failed_at TEXT NOT NULL  -- UTC, ISO 8601
    );
    CREATE INDEX login_failures_failed_at ON login_failures (failed_at);
    """,
    """
    CREATE TABLE profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),  -- there is only ever one Profile
        token BLOB NOT NULL,  -- Fernet token of the Profile as JSON
        updated_at TEXT NOT NULL  -- UTC, ISO 8601
    );
    """,
)


class DatabaseError(Exception):
    """The database file can't be opened or migrated."""


class SqliteDatabase:
    def __init__(self, path: Path) -> None:
        self.path = path

    def migrate(self) -> None:
        """Create the file if needed and bring its schema up to the latest version."""
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            with self.connection() as connection:
                current = connection.execute("PRAGMA user_version").fetchone()[0]
                if current > len(MIGRATIONS):
                    raise DatabaseError(
                        f"{self.path} has schema version {current}, newer than this code "
                        f"knows ({len(MIGRATIONS)}); was it written by a later release?"
                    )
                for version in range(current + 1, len(MIGRATIONS) + 1):
                    # executescript commits any open transaction first, so wrap each
                    # migration and its version bump in one explicit transaction.
                    connection.executescript(
                        f"BEGIN; {MIGRATIONS[version - 1]} PRAGMA user_version = {version}; COMMIT;"
                    )
                    logger.info("applied database migration", extra={"version": version})
        except (OSError, sqlite3.Error) as error:
            raise DatabaseError(f"can't open or migrate {self.path}: {error}") from error

    @contextmanager
    def connection(self) -> Iterator[sqlite3.Connection]:
        """A fresh connection, committed on success and rolled back on error.

        A connection per use keeps this safe across FastAPI's worker threads.
        """
        connection = sqlite3.connect(self.path, timeout=10)
        try:
            with connection:
                yield connection
        finally:
            connection.close()
