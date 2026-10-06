"""One scheduler tick: claim each due Booking Request in turn and run it; and its health."""

import logging
import threading
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Protocol

from court_booker.booking_requests.booking_requests import BookingRequest
from court_booker.booking_run.booking_run import BookingRun
from court_booker.clock import Clock

logger = logging.getLogger(__name__)


class RunQueue(Protocol):
    def claim_next_due(self, now: datetime) -> BookingRequest | None:
        """Move the earliest due Waiting request to Booking… in one atomic step and return it.

        None when nothing is due. A request can be claimed only once, however many callers.
        """
        ...

    def finish(self, request_id: int) -> None:
        """Mark a claimed request Done."""
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
        stale_after: timedelta,
    ) -> None:
        self._queue = queue
        self._booking_run = booking_run
        self._clock = clock
        self._stale_after = stale_after
        self._started_at = clock.now()
        # A long run beats this after every attempt, so a busy scheduler isn't reported stale.
        self._last_beat: datetime | None = None
        self._lock = threading.Lock()

    def tick(self) -> int:
        """Run every request due now, one at a time; return how many ran."""
        self._beat()
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

    def _beat(self) -> None:
        with self._lock:
            self._last_beat = self._clock.now()
