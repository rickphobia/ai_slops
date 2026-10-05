"""Checks the Operator password, with lockout after repeated failures."""

import math
import threading
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Protocol

from court_booker.auth.passwords import PasswordHash
from court_booker.clock import Clock


class LoginFailures(Protocol):
    """Where failed login times are kept, so a restart doesn't reset the lockout."""

    def record(self, at: datetime) -> None: ...

    def since(self, start: datetime) -> list[datetime]:
        """Failure times after `start`, oldest first."""
        ...

    def forget_before(self, cutoff: datetime) -> None: ...

    def clear(self) -> None: ...


@dataclass(frozen=True)
class LoggedIn:
    pass


@dataclass(frozen=True)
class WrongPassword:
    pass


@dataclass(frozen=True)
class LockedOut:
    minutes_left: int


LoginResult = LoggedIn | WrongPassword | LockedOut


@dataclass(frozen=True)
class OperatorLogin:
    password_hash: PasswordHash
    failures: LoginFailures
    clock: Clock
    max_failures: int
    lockout: timedelta
    # One attempt at a time: parallel guesses can't slip past the failure count, and only
    # one memory-hungry scrypt check runs at once.
    _lock: threading.Lock = field(
        default_factory=threading.Lock, init=False, repr=False, compare=False
    )

    def attempt(self, password: str) -> LoginResult:
        """Check `password`, refusing every attempt while too many recent ones have failed.

        Attempts refused by the lockout aren't recorded, so someone hammering the form can't
        keep the Operator locked out forever: the lock lifts `lockout` after the failures.
        """
        with self._lock:
            now = self.clock.now()
            recent = self.failures.since(now - self.lockout)
            if len(recent) >= self.max_failures:
                # The lock lifts once enough of the oldest failures fall out of the window.
                unlocks_at = recent[len(recent) - self.max_failures] + self.lockout
                minutes_left = math.ceil((unlocks_at - now).total_seconds() / 60)
                return LockedOut(minutes_left=max(minutes_left, 1))
            if self.password_hash.matches(password):
                self.failures.clear()
                return LoggedIn()
            self.failures.record(now)
            self.failures.forget_before(now - self.lockout)
            return WrongPassword()
