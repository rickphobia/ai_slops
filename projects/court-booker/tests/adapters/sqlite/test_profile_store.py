from pathlib import Path

import pytest
from cryptography.fernet import Fernet

from court_booker.adapters.sqlite.database import SqliteDatabase
from court_booker.adapters.sqlite.profile_store import SqliteProfileStore
from court_booker.profile.profile import Profile, ProfileUnreadable
from tests.support import PROFILE_KEY, FakeClock

PROFILE = Profile(
    first_name="Meiling", email="meiling@example.com", unit_number="B-07-11", mobile="0198765432"
)


@pytest.fixture
def database(tmp_path: Path) -> SqliteDatabase:
    database = SqliteDatabase(tmp_path / "court-booker.sqlite3")
    database.migrate()
    return database


def store(database: SqliteDatabase, key: bytes = PROFILE_KEY.encode()) -> SqliteProfileStore:
    return SqliteProfileStore(database, key, FakeClock())


def test_there_is_no_profile_until_one_is_saved(database: SqliteDatabase) -> None:
    assert store(database).load() is None


def test_a_saved_profile_loads_back_and_an_edit_replaces_it(database: SqliteDatabase) -> None:
    store(database).save(PROFILE)
    edited = Profile(**{**vars(PROFILE), "mobile": "0111111111"})
    store(database).save(edited)

    assert store(database).load() == edited
    with database.connection() as connection:
        assert connection.execute("SELECT COUNT(*) FROM profile").fetchone()[0] == 1


def test_the_database_file_holds_no_profile_value_in_plain_text(
    database: SqliteDatabase,
) -> None:
    store(database).save(PROFILE)

    raw = database.path.read_bytes()
    # The write-ahead or journal files would also count, but sqlite3 leaves none after commit.
    assert not list(database.path.parent.glob("*-wal"))
    for value in vars(PROFILE).values():
        assert value.encode() not in raw


def test_a_different_key_cannot_read_the_profile(database: SqliteDatabase) -> None:
    store(database).save(PROFILE)

    with pytest.raises(ProfileUnreadable, match="COURT_BOOKER_PROFILE_KEY"):
        store(database, key=Fernet.generate_key()).load()
