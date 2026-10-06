"""Random choices, behind an interface so tests can fix them."""

import random
from typing import Protocol


class RandomSource(Protocol):
    def uniform(self, low: float, high: float) -> float:
        """A number between `low` and `high`, inclusive."""
        ...


class SystemRandomSource:
    def __init__(self) -> None:
        self._random = random.Random()

    def uniform(self, low: float, high: float) -> float:
        return self._random.uniform(low, high)
