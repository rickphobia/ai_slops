"""Booking Requests and their Slots in SQLite."""

import sqlite3
from collections.abc import Sequence
from datetime import UTC, date, datetime, time
from pathlib import Path

from court_booker.adapters.sqlite.database import SqliteDatabase
from court_booker.booking_requests.booking_requests import (
    BookingRequest,
    BookingRequestStatus,
    DateTaken,
    SlotResult,
    SlotStatus,
    slot_text,
)

_WAITING = BookingRequestStatus.WAITING.value
_SELECT_REQUESTS = "SELECT id, play_date, status, run_at, started_at FROM booking_requests"
_SELECT_SLOTS = (
    "SELECT request_id, slot, status, reason, attempted_at, retries, screenshot FROM slot_attempts"
)


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
            requests = _load(connection, "WHERE id = ?", (request_id,))
        return requests[0] if requests else None

    def all(self) -> list[BookingRequest]:
        with self._database.connection() as connection:
            return _load(connection, "", ())

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

    def claim_next_due(self, now: datetime) -> BookingRequest | None:
        with self._database.connection() as connection:
            # The write lock makes the pick and the Waiting → Booking… change one step, so two
            # ticks (or a tick and an edit) can never both get the same request.
            connection.execute("BEGIN IMMEDIATE")
            # Compared in Python: ISO text with and without microseconds doesn't sort as time.
            rows = connection.execute(
                "SELECT id, run_at FROM booking_requests WHERE status = ?", (_WAITING,)
            ).fetchall()
            due = sorted(
                (datetime.fromisoformat(run_at), request_id)
                for request_id, run_at in rows
                if datetime.fromisoformat(run_at) <= now
            )
            if not due:
                return None
            request_id = due[0][1]
            connection.execute(
                "UPDATE booking_requests SET status = ?, started_at = ? WHERE id = ?",
                (BookingRequestStatus.BOOKING.value, _utc_text(now), request_id),
            )
            return _load(connection, "WHERE id = ?", (request_id,))[0]

    def record_slot(self, request_id: int, result: SlotResult) -> None:
        with self._database.connection() as connection:
            connection.execute(
                "UPDATE slot_attempts SET status = ?, reason = ?, attempted_at = ?, "
                "retries = ?, screenshot = ? WHERE request_id = ? AND slot = ?",
                (
                    result.status.value,
                    result.reason,
                    _utc_text(result.attempted_at) if result.attempted_at else None,
                    result.retries,
                    str(result.screenshot) if result.screenshot else None,
                    request_id,
                    slot_text(result.slot),
                ),
            )

    def finish(self, request_id: int) -> None:
        with self._database.connection() as connection:
            connection.execute(
                "UPDATE booking_requests SET status = ? WHERE id = ?",
                (BookingRequestStatus.DONE.value, request_id),
            )

    def fail_missed(self, today: date, reason: str) -> list[int]:
        with self._database.connection() as connection:
            connection.execute("BEGIN IMMEDIATE")
            # play_date is ISO text, so it sorts as a date.
            rows = connection.execute(
                "SELECT id FROM booking_requests WHERE status = ? AND play_date < ?",
                (_WAITING, today.isoformat()),
            ).fetchall()
            return _fail_unfinished(connection, [row[0] for row in rows], reason)

    def fail_interrupted(self, reason: str) -> list[int]:
        with self._database.connection() as connection:
            connection.execute("BEGIN IMMEDIATE")
            rows = connection.execute(
                "SELECT id FROM booking_requests WHERE status = ?",
                (BookingRequestStatus.BOOKING.value,),
            ).fetchall()
            return _fail_unfinished(connection, [row[0] for row in rows], reason)

    def delete_dated_before(self, cutoff: date) -> list[Path]:
        with self._database.connection() as connection:
            connection.execute("BEGIN IMMEDIATE")
            ids = [
                row[0]
                for row in connection.execute(
                    "SELECT id FROM booking_requests WHERE play_date < ?", (cutoff.isoformat(),)
                ).fetchall()
            ]
            placeholders = ",".join("?" * len(ids))
            screenshots = connection.execute(
                f"SELECT screenshot FROM slot_attempts WHERE request_id IN ({placeholders}) "
                "AND screenshot IS NOT NULL",
                ids,
            ).fetchall()
            connection.execute(
                f"DELETE FROM slot_attempts WHERE request_id IN ({placeholders})", ids
            )
            connection.execute(f"DELETE FROM booking_requests WHERE id IN ({placeholders})", ids)
        return [Path(row[0]) for row in screenshots]

    def ping(self) -> None:
        with self._database.connection() as connection:
            connection.execute("SELECT 1 FROM booking_requests LIMIT 1").fetchall()


def _insert_slots(connection: sqlite3.Connection, request_id: int, slots: Sequence[time]) -> None:
    connection.executemany(
        "INSERT INTO slot_attempts (request_id, slot, status) VALUES (?, ?, ?)",
        [(request_id, slot_text(slot), SlotStatus.WAITING.value) for slot in slots],
    )


def _fail_unfinished(
    connection: sqlite3.Connection, request_ids: list[int], reason: str
) -> list[int]:
    """Mark the requests Done, failing every Slot that has no outcome yet with `reason`."""
    placeholders = ",".join("?" * len(request_ids))
    connection.execute(
        f"UPDATE slot_attempts SET status = ?, reason = ? WHERE request_id IN ({placeholders}) "
        "AND status IN (?, ?)",
        (
            SlotStatus.FAILED.value,
            reason,
            *request_ids,
            SlotStatus.WAITING.value,
            SlotStatus.BOOKING.value,
        ),
    )
    connection.execute(
        f"UPDATE booking_requests SET status = ? WHERE id IN ({placeholders})",
        (BookingRequestStatus.DONE.value, *request_ids),
    )
    return request_ids


def _is_waiting(connection: sqlite3.Connection, request_id: int) -> bool:
    row = connection.execute(
        "SELECT status FROM booking_requests WHERE id = ?", (request_id,)
    ).fetchone()
    return row is not None and row[0] == _WAITING


def _load(
    connection: sqlite3.Connection, where: str, parameters: tuple[object, ...]
) -> list[BookingRequest]:
    requests = connection.execute(f"{_SELECT_REQUESTS} {where}", parameters).fetchall()
    ids = [row[0] for row in requests]
    placeholders = ",".join("?" * len(ids))
    slot_rows = connection.execute(
        f"{_SELECT_SLOTS} WHERE request_id IN ({placeholders})", ids
    ).fetchall()
    results: dict[int, list[SlotResult]] = {request_id: [] for request_id in ids}
    for request_id, *slot_row in slot_rows:
        results[request_id].append(_slot_result_from(slot_row))
    return [
        BookingRequest(
            id=request_id,
            play_date=date.fromisoformat(play_date),
            slot_results=tuple(sorted(results[request_id], key=lambda result: result.slot)),
            status=BookingRequestStatus(status),
            run_at=datetime.fromisoformat(run_at),
            started_at=datetime.fromisoformat(started_at) if started_at else None,
        )
        for request_id, play_date, status, run_at, started_at in requests
    ]


def _slot_result_from(row: list[object]) -> SlotResult:
    slot, status, reason, attempted_at, retries, screenshot = row
    assert isinstance(slot, str) and isinstance(status, str) and isinstance(retries, int)
    return SlotResult(
        slot=time.fromisoformat(slot),
        status=SlotStatus(status),
        reason=reason if isinstance(reason, str) else None,
        attempted_at=datetime.fromisoformat(attempted_at)
        if isinstance(attempted_at, str)
        else None,
        retries=retries,
        screenshot=Path(screenshot) if isinstance(screenshot, str) else None,
    )


def _utc_text(moment: datetime) -> str:
    return moment.astimezone(UTC).isoformat()
