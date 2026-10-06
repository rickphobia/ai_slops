"""One scheduler tick: close missed requests, run each due one, delete old ones; and health."""

import logging
import threading
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Protocol

from court_booker.booking_requests.booking_requests import BookingRequest
from court_booker.booking_run.booking_run import BookingRun
from court_booker.clock import Clock
from court_booker.schedule.schedule import ScheduleRules, venue_today

logger = logging.getLogger(__name__)

MISSED_REASON = "missed"
INTERRUPTED_REASON = "interrupted, check Picktime"


class RunQueue(Protocol):
    def claim_next_due(self, now: datetime) -> BookingRequest | None:
        """Move the earliest due Waiting request to Booking… in one atomic step and return it.

        None when nothing is due. A request can be claimed only once, however many callers.
        """
        ...

    def finish(self, request_id: int) -> None:
        """Mark a claimed request Done."""
        ...

    def fail_missed(self, today: date, reason: str) -> list[int]:
        """Mark Waiting requests dated before `today` Done, every Slot Failed; return their ids."""
        ...

    def fail_interrupted(self, reason: str) -> list[int]:
        """Mark Booking… requests Done, Slots without an outcome Failed; return their ids."""
        ...

    def delete_dated_before(self, cutoff: date) -> list[Path]:
        """Delete requests dated before `cutoff` and their Slots; return their screenshot paths."""
        ...

    def ping(self) -> None:
        """Raise if the store can't be read."""
        ...


@dataclass(frozen=True)
class SchedulerHealth:
    healthy: bool
    database_reachable: bool
    # None before the first tick.
    last_tick_age: timedelta | None


class Scheduler:
    def __init__(
        self,
        *,
        queue: RunQueue,
        booking_run: BookingRun,
        clock: Clock,
        schedule: ScheduleRules,
        retention: timedelta,
        stale_after: timedelta,
    ) -> None:
        self._queue = queue
        self._schedule = schedule
        self._retention = retention
        self._booking_run = booking_run
        self._clock = clock
        self._stale_after = stale_after
        self._started_at = clock.now()
        # A long run beats this after every attempt, so a busy scheduler isn't reported stale.
        self._last_beat: datetime | None = None
        self._lock = threading.Lock()

    def recover_interrupted(self) -> None:
        """At startup: a request left in Booking… was cut short by a restart.

        It is never re-run: a Slot may have been booked before the cut, and booking it twice
        would hold the Court for nothing. The Operator checks Picktime instead.
        """
        for request_id in self._queue.fail_interrupted(INTERRUPTED_REASON):
            logger.warning("booking request interrupted", extra={"request_id": request_id})

    def tick(self) -> int:
        """Close missed requests, run each one due, delete old ones; return how many ran."""
        self._beat()
        today = venue_today(self._clock.now(), self._schedule)
        for request_id in self._queue.fail_missed(today, MISSED_REASON):
            logger.warning("booking request missed", extra={"request_id": request_id})
        ran = 0
        while (request := self._queue.claim_next_due(self._clock.now())) is not None:
            logger.info(
                "booking request claimed",
                extra={"request_id": request.id, "play_date": request.play_date.isoformat()},
            )
            self._booking_run.run(request, heartbeat=self._beat)
            self._queue.finish(request.id)
            ran += 1
            self._beat()
        self._delete_old(venue_today(self._clock.now(), self._schedule))
        logger.debug("scheduler tick done", extra={"requests_run": ran})
        return ran

    def health(self) -> SchedulerHealth:
        now = self._clock.now()
        try:
            self._queue.ping()
            database_reachable = True
        except Exception as error:
            # Any failure here means the database can't be read; the health check reports it.
            logger.error("health check: database unreachable: %s", error)
            database_reachable = False
        with self._lock:
            last_beat = self._last_beat
        last_tick_age = now - last_beat if last_beat else None
        # Before the first tick, give the background loop time to start.
        age_for_staleness = last_tick_age if last_tick_age is not None else now - self._started_at
        return SchedulerHealth(
            healthy=database_reachable and age_for_staleness <= self._stale_after,
            database_reachable=database_reachable,
            last_tick_age=last_tick_age,
        )

    def _delete_old(self, today: date) -> None:
        cutoff = today - self._retention
        screenshots = self._queue.delete_dated_before(cutoff)
        for screenshot in screenshots:
            try:
                screenshot.unlink(missing_ok=True)
            except OSError as error:
                # The row is gone, so nothing will serve this file; the log says to remove it.
                logger.warning(
                    "old screenshot not deleted: %s", error, extra={"path": str(screenshot)}
                )
        if screenshots:
            logger.info(
                "old booking requests deleted",
                extra={"before": cutoff.isoformat(), "screenshots": len(screenshots)},
            )

    def _beat(self) -> None:
        with self._lock:
            self._last_beat = self._clock.now()
