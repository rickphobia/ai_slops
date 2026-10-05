import sqlite3
from pathlib import Path

import pytest

from court_booker.adapters.sqlite.database import MIGRATIONS, DatabaseError, SqliteDatabase


def schema_version(path: Path) -> int:
    with sqlite3.connect(path) as connection:
        version: int = connection.execute("PRAGMA user_version").fetchone()[0]
    return version


def test_migrate_creates_the_file_and_its_folder(tmp_path: Path) -> None:
    path = tmp_path / "data" / "court-booker.sqlite3"

    SqliteDatabase(path).migrate()

    assert schema_version(path) == len(MIGRATIONS)


def test_migrating_twice_changes_nothing(tmp_path: Path) -> None:
    database = SqliteDatabase(tmp_path / "court-booker.sqlite3")
    database.migrate()
    with database.connection() as connection:
        connection.execute("INSERT INTO login_failures (failed_at) VALUES ('kept')")

    database.migrate()

    with database.connection() as connection:
        assert connection.execute("SELECT count(*) FROM login_failures").fetchone()[0] == 1


def test_a_file_from_a_newer_release_is_refused(tmp_path: Path) -> None:
    path = tmp_path / "court-booker.sqlite3"
    with sqlite3.connect(path) as connection:
        connection.execute(f"PRAGMA user_version = {len(MIGRATIONS) + 1}")

    with pytest.raises(DatabaseError, match="newer than this code"):
        SqliteDatabase(path).migrate()


def test_an_unopenable_path_fails_with_the_path_in_the_message(tmp_path: Path) -> None:
    blocker = tmp_path / "not-a-folder"
    blocker.write_text("")

    with pytest.raises(DatabaseError, match="not-a-folder"):
        SqliteDatabase(blocker / "court-booker.sqlite3").migrate()
