from datetime import UTC, date, datetime, time
from pathlib import Path

import pytest

from court_booker.adapters.sqlite.booking_request_store import SqliteBookingRequestRepository
from court_booker.adapters.sqlite.database import SqliteDatabase
from court_booker.booking_requests.booking_requests import (
    BookingRequest,
    BookingRequestStatus,
    DateTaken,
)

PLAY_DATE = date(2026, 10, 9)
RUN_AT = datetime(2026, 10, 6, 16, 1, 30, 250000, tzinfo=UTC)
CREATED_AT = datetime(2026, 10, 6, 12, 0, tzinfo=UTC)


@pytest.fixture
def repository(tmp_path: Path) -> SqliteBookingRequestRepository:
    database = SqliteDatabase(tmp_path / "court-booker.sqlite3")
    database.migrate()
    return SqliteBookingRequestRepository(database)


def test_a_request_loads_back_as_stored(repository: SqliteBookingRequestRepository) -> None:
    request_id = repository.add(PLAY_DATE, [time(20), time(8)], RUN_AT, CREATED_AT)

    assert repository.get(request_id) == BookingRequest(
        id=request_id,
        play_date=PLAY_DATE,
        slots=(time(8), time(20)),
        status=BookingRequestStatus.WAITING,
        run_at=RUN_AT,
    )
    assert repository.all() == [repository.get(request_id)]
    assert repository.get(request_id + 1) is None


def test_a_second_live_request_for_a_date_is_refused(
    repository: SqliteBookingRequestRepository,
) -> None:
    repository.add(PLAY_DATE, [time(8)], RUN_AT, CREATED_AT)

    with pytest.raises(DateTaken):
        repository.add(PLAY_DATE, [time(10)], RUN_AT, CREATED_AT)
    assert len(repository.all()) == 1


def test_a_cancelled_request_does_not_hold_its_date(
    repository: SqliteBookingRequestRepository,
) -> None:
    first = repository.add(PLAY_DATE, [time(8)], RUN_AT, CREATED_AT)
    assert repository.cancel_if_waiting(first)

    second = repository.add(PLAY_DATE, [time(10)], RUN_AT, CREATED_AT)

    assert repository.get(second) is not None


def test_slots_change_and_cancel_only_while_waiting(
    repository: SqliteBookingRequestRepository,
) -> None:
    request_id = repository.add(PLAY_DATE, [time(8)], RUN_AT, CREATED_AT)

    assert repository.replace_slots_if_waiting(request_id, [time(10), time(12)])
    assert repository.cancel_if_waiting(request_id)
    assert not repository.cancel_if_waiting(request_id)
    assert not repository.replace_slots_if_waiting(request_id, [time(14)])

    stored = repository.get(request_id)
    assert stored is not None
    assert stored.slots == (time(10), time(12))
    assert stored.status is BookingRequestStatus.CANCELLED
    assert stored.run_at == RUN_AT
