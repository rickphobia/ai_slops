"""The Profile value, its validation rules and the store interface it is saved through."""

import re
from dataclasses import dataclass
from typing import Protocol

# Deliberately loose: one @, no spaces, a dot in the domain. Picktime does the final check.
_EMAIL = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")


@dataclass(frozen=True)
class Profile:
    first_name: str
    email: str
    unit_number: str
    mobile: str


class ProfileStore(Protocol):
    def load(self) -> Profile | None: ...

    def save(self, profile: Profile) -> None: ...


class InvalidProfile(Exception):
    """One or more fields are missing or malformed; `errors` maps field name to a message."""

    def __init__(self, errors: dict[str, str]) -> None:
        super().__init__(f"invalid Profile fields: {', '.join(errors)}")
        self.errors = errors


def parse_profile(first_name: str, email: str, unit_number: str, mobile: str) -> Profile:
    """A Profile from form input, trimmed; raises InvalidProfile naming every bad field."""
    profile = Profile(
        first_name=first_name.strip(),
        email=email.strip(),
        unit_number=unit_number.strip(),
        mobile=mobile.strip(),
    )
    errors: dict[str, str] = {}
    if not profile.first_name:
        errors["first_name"] = "Enter a first name."
    if not profile.email:
        errors["email"] = "Enter an email address."
    elif not _EMAIL.fullmatch(profile.email):
        errors["email"] = "Enter a valid email address, like name@example.com."
    if not profile.unit_number:
        errors["unit_number"] = "Enter a unit number."
    if not profile.mobile:
        errors["mobile"] = "Enter a mobile number."
    elif not (profile.mobile.isascii() and profile.mobile.isdigit()):
        errors["mobile"] = "Enter the mobile number as digits only, like 0123456789."
    if errors:
        raise InvalidProfile(errors)
    return profile
