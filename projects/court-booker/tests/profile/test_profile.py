import pytest

from court_booker.profile.profile import InvalidProfile, Profile, parse_profile

# str.isdigit accepts these, but Picktime wants plain 0-9.
FULL_WIDTH_DIGITS = "".join(chr(0xFF10 + digit) for digit in range(3))


def test_a_complete_profile_is_trimmed() -> None:
    assert parse_profile(" Mei ", "mei@example.com ", " A-12-3", "0123456789 ") == Profile(
        first_name="Mei", email="mei@example.com", unit_number="A-12-3", mobile="0123456789"
    )


def test_every_missing_field_is_reported_at_once() -> None:
    with pytest.raises(InvalidProfile) as error:
        parse_profile("", " ", "", "")

    assert set(error.value.errors) == {"first_name", "email", "unit_number", "mobile"}


@pytest.mark.parametrize("email", ["mei", "mei@example", "mei @example.com", "a@b@c.com"])
def test_a_malformed_email_is_refused(email: str) -> None:
    with pytest.raises(InvalidProfile) as error:
        parse_profile("Mei", email, "A-12-3", "0123456789")

    assert error.value.errors == {"email": "Enter a valid email address, like name@example.com."}


@pytest.mark.parametrize("mobile", ["+60123456789", "012-345 6789", FULL_WIDTH_DIGITS])
def test_a_mobile_that_is_not_only_digits_is_refused(mobile: str) -> None:
    with pytest.raises(InvalidProfile) as error:
        parse_profile("Mei", "mei@example.com", "A-12-3", mobile)

    assert list(error.value.errors) == ["mobile"]


def test_the_error_message_names_fields_not_values() -> None:
    with pytest.raises(InvalidProfile) as error:
        parse_profile("Mei", "mei-at-example", "A-12-3", "0123456789")

    assert "mei-at-example" not in str(error.value)
