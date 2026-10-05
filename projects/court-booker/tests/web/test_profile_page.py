import html
import logging
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient

from tests.support import OPERATOR_PASSWORD, PREFIX, FakeClock, csrf_token_in, make_client

FORM = {
    "first_name": "Meiling",
    "email": "meiling@example.com",
    "unit_number": "B-07-11",
    "mobile": "0198765432",
}


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    client = make_client(tmp_path / "court-booker.sqlite3", FakeClock())
    token = csrf_token_in(client.get(f"{PREFIX}/login").text)
    client.post(f"{PREFIX}/login", data={"password": OPERATOR_PASSWORD, "csrf_token": token})
    return client


def submit(client: TestClient, fields: dict[str, str]) -> httpx.Response:
    token = csrf_token_in(client.get(f"{PREFIX}/profile").text)
    response: httpx.Response = client.post(
        f"{PREFIX}/profile", data={**fields, "csrf_token": token}, follow_redirects=False
    )
    return response


def test_the_first_save_stores_the_profile_and_shows_it(client: TestClient) -> None:
    response = submit(client, FORM)

    assert response.status_code == 303
    assert response.headers["location"] == f"{PREFIX}/profile?saved=1"
    page = client.get(response.headers["location"]).text
    assert "Profile saved." in page
    for value in FORM.values():
        assert f'value="{value}"' in page


def test_an_edit_replaces_the_saved_values(client: TestClient) -> None:
    submit(client, FORM)
    submit(client, {**FORM, "mobile": "0111111111"})

    page = client.get(f"{PREFIX}/profile").text
    assert 'value="0111111111"' in page
    assert "0198765432" not in page


def test_an_empty_profile_page_has_blank_fields(client: TestClient) -> None:
    page = client.get(f"{PREFIX}/profile").text

    assert 'name="first_name" type="text" value=""' in page
    assert "Profile saved." not in page


@pytest.mark.parametrize(
    ("field", "value", "message"),
    [
        ("first_name", "", "Enter a first name."),
        ("email", "meiling.example.com", "Enter a valid email address"),
        ("mobile", "+6019 876", "Enter the mobile number as digits only"),
    ],
)
def test_a_bad_field_shows_its_message_keeps_the_input_and_saves_nothing(
    client: TestClient, field: str, value: str, message: str
) -> None:
    submit(client, FORM)
    response = submit(client, {**FORM, "unit_number": "C-01-01", field: value})

    assert response.status_code == 422
    assert message in response.text
    assert f'value="{html.escape(value)}"' in response.text
    assert 'value="B-07-11"' in client.get(f"{PREFIX}/profile").text


def test_a_logged_out_visitor_is_sent_to_login(tmp_path: Path) -> None:
    client = make_client(tmp_path / "court-booker.sqlite3", FakeClock())

    token = csrf_token_in(client.get(f"{PREFIX}/login").text)

    for response in (
        client.get(f"{PREFIX}/profile", follow_redirects=False),
        client.post(
            f"{PREFIX}/profile", data={**FORM, "csrf_token": token}, follow_redirects=False
        ),
    ):
        assert response.status_code == 303
        assert response.headers["location"] == f"{PREFIX}/login"


def test_profile_values_never_reach_the_logs(
    client: TestClient, caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.DEBUG):
        submit(client, FORM)
        submit(client, {**FORM, "email": "bad-email"})

    logged = "\n".join(f"{record.getMessage()} {vars(record)}" for record in caplog.records)
    assert "profile saved" in logged
    for value in [*FORM.values(), "bad-email"]:
        assert value not in logged
