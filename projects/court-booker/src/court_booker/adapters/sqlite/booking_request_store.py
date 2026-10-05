"""Booking Requests and their Slots in SQLite."""

import sqlite3
from collections.abc import Sequence
from datetime import UTC, date, datetime, time

from court_booker.adapters.sqlite.database import SqliteDatabase
from court_booker.booking_requests.booking_requests import (
    BookingRequest,
    BookingRequestStatus,
    DateTaken,
    slot_text,
)

_WAITING = BookingRequestStatus.WAITING.value
_SELECT_REQUESTS = """
    SELECT r.id, r.play_date, r.status, r.run_at, group_concat(s.slot)
    FROM booking_requests r LEFT JOIN slot_attempts s ON s.request_id = r.id
"""


class SqliteBookingRequestRepository:
    def __init__(self, database: SqliteDatabase) -> None:
        self._database = database

    def add(
        self, play_date: date, slots: Sequence[time], run_at: datetime, created_at: datetime
    ) -> int:
        with self._database.connection() as connection:
            try:
                cursor = connection.execute(
                    "INSERT INTO booking_requests (play_date, status, run_at, created_at) "
                    "VALUES (?, ?, ?, ?)",
                    (play_date.isoformat(), _WAITING, _utc_text(run_at), _utc_text(created_at)),
                )
            except sqlite3.IntegrityError:
                # The partial unique index: another live request already holds this date.
                raise DateTaken(play_date) from None
            request_id = cursor.lastrowid
            assert request_id is not None
            _insert_slots(connection, request_id, slots)
        return request_id

    def get(self, request_id: int) -> BookingRequest | None:
        with self._database.connection() as connection:
            row = connection.execute(
                f"{_SELECT_REQUESTS} WHERE r.id = ? GROUP BY r.id", (request_id,)
            ).fetchone()
        return _request_from(row) if row else None

    def all(self) -> list[BookingRequest]:
        with self._database.connection() as connection:
            rows = connection.execute(f"{_SELECT_REQUESTS} GROUP BY r.id").fetchall()
        return [_request_from(row) for row in rows]

    def replace_slots_if_waiting(self, request_id: int, slots: Sequence[time]) -> bool:
        with self._database.connection() as connection:
            # Take the write lock before reading the status, so nothing can claim the
            # request between the check and the change.
            connection.execute("BEGIN IMMEDIATE")
            if not _is_waiting(connection, request_id):
                return False
            connection.execute("DELETE FROM slot_attempts WHERE request_id = ?", (request_id,))
            _insert_slots(connection, request_id, slots)
        return True

    def cancel_if_waiting(self, request_id: int) -> bool:
        with self._database.connection() as connection:
            cursor = connection.execute(
                "UPDATE booking_requests SET status = ? WHERE id = ? AND status = ?",
                (BookingRequestStatus.CANCELLED.value, request_id, _WAITING),
            )
        return cursor.rowcount == 1


def _insert_slots(connection: sqlite3.Connection, request_id: int, slots: Sequence[time]) -> None:
    connection.executemany(
        "INSERT INTO slot_attempts (request_id, slot, status) VALUES (?, ?, ?)",
        [(request_id, slot_text(slot), _WAITING) for slot in slots],
    )


def _is_waiting(connection: sqlite3.Connection, request_id: int) -> bool:
    row = connection.execute(
        "SELECT status FROM booking_requests WHERE id = ?", (request_id,)
    ).fetchone()
    return row is not None and row[0] == _WAITING


def _request_from(row: tuple[int, str, str, str, str | None]) -> BookingRequest:
    request_id, play_date, status, run_at, slots = row
    return BookingRequest(
        id=request_id,
        play_date=date.fromisoformat(play_date),
        slots=tuple(sorted(time.fromisoformat(slot) for slot in (slots or "").split(",") if slot)),
        status=BookingRequestStatus(status),
        run_at=datetime.fromisoformat(run_at),
    )


def _utc_text(moment: datetime) -> str:
    return moment.astimezone(UTC).isoformat()
