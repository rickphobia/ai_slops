"""Runs scheduler ticks in a background thread: one right away, then one every interval."""

import logging
import threading
from datetime import timedelta

from court_booker.scheduler.scheduler import Scheduler

logger = logging.getLogger(__name__)


class SchedulerLoop:
    def __init__(self, scheduler: Scheduler, interval: timedelta) -> None:
        self._scheduler = scheduler
        self._interval = interval
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        # A thread rather than an asyncio task: a run drives the synchronous Playwright API and
        # takes minutes, and must not hold up the web server or its startup.
        self._thread = threading.Thread(target=self._loop, name="scheduler", daemon=True)
        self._thread.start()
        logger.info("scheduler started", extra={"interval_seconds": self._interval.total_seconds()})

    def stop(self) -> None:
        """Ask the loop to stop and wait for a tick in progress, up to a few seconds."""
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=5)
            if self._thread.is_alive():
                logger.warning("scheduler still busy at shutdown; a run may be cut short")

    def _loop(self) -> None:
        while not self._stop.is_set():
            try:
                self._scheduler.tick()
            except Exception:
                # Keep ticking: a database hiccup shouldn't stop every later booking. If it
                # persists, /healthz goes stale and the uptime monitor alerts.
                logger.exception("scheduler tick failed")
            self._stop.wait(self._interval.total_seconds())
