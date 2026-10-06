"""The current time and waiting, behind interfaces so tests can move time forward."""

import time
from datetime import UTC, datetime, timedelta
from typing import Protocol


class Clock(Protocol):
    def now(self) -> datetime:
        """The current time, timezone-aware in UTC."""
        ...


class Sleeper(Protocol):
    def sleep(self, duration: timedelta) -> None:
        """Block for `duration`."""
        ...


class SystemClock:
    def now(self) -> datetime:
        return datetime.now(UTC)

    def sleep(self, duration: timedelta) -> None:
        time.sleep(duration.total_seconds())
