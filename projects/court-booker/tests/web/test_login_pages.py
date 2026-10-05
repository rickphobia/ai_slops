import json
import logging
from datetime import timedelta
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient

from tests.support import OPERATOR_PASSWORD, PREFIX, FakeClock, csrf_token_in, make_client


@pytest.fixture
def clock() -> FakeClock:
    return FakeClock()


@pytest.fixture
def database_path(tmp_path: Path) -> Path:
    return tmp_path / "court-booker.sqlite3"


@pytest.fixture
def client(database_path: Path, clock: FakeClock) -> TestClient:
    return make_client(database_path, clock, COURT_BOOKER_LOGIN_MAX_FAILURES="3")


def log_in(client: TestClient, password: str = OPERATOR_PASSWORD) -> httpx.Response:
    token = csrf_token_in(client.get(f"{PREFIX}/login").text)
    response: httpx.Response = client.post(
        f"{PREFIX}/login",
        data={"password": password, "csrf_token": token},
        follow_redirects=False,
    )
    return response


def log_out(client: TestClient) -> httpx.Response:
    token = csrf_token_in(client.get(f"{PREFIX}/").text)
    response: httpx.Response = client.post(
        f"{PREFIX}/logout", data={"csrf_token": token}, follow_redirects=False
    )
    return response


def test_a_logged_out_visitor_is_sent_to_login(client: TestClient) -> None:
    response = client.get(f"{PREFIX}/", follow_redirects=False)

    assert response.status_code == 303
    assert response.headers["location"] == f"{PREFIX}/login"


def test_every_page_but_login_and_healthz_needs_the_operator(client: TestClient) -> None:
    # The OpenAPI schema is FastAPI's public list of every route, however it was included.
    paths = client.app.openapi()["paths"]  # type: ignore[attr-defined]
    guarded = [
        (method.upper(), path)
        for path, methods in paths.items()
        if path not in ("/login", "/healthz")
        for method in methods
    ]
    assert ("GET", "/") in guarded

    for method, path in guarded:
        token = csrf_token_in(client.get(f"{PREFIX}/login").text)
        response = client.request(
            method, f"{PREFIX}{path}", data={"csrf_token": token}, follow_redirects=False
        )
        assert response.status_code == 303, path
        assert response.headers["location"] == f"{PREFIX}/login", path


def test_the_login_page_and_healthz_need_no_login(client: TestClient) -> None:
    assert client.get(f"{PREFIX}/login").status_code == 200
    assert client.get(f"{PREFIX}/healthz").status_code == 200


def test_the_right_password_logs_in_with_a_strict_session_cookie(client: TestClient) -> None:
    response = log_in(client)

    assert response.status_code == 303
    assert response.headers["location"] == f"{PREFIX}/"
    cookie = next(
        header
        for header in response.headers.get_list("set-cookie")
        if header.startswith("court_booker_session=")
    )
    for attribute in ("HttpOnly", "SameSite=strict", "Secure", f"Path={PREFIX}"):
        assert attribute in cookie
    assert f"Max-Age={30 * 24 * 3600}" in cookie
    home = client.get(f"{PREFIX}/", follow_redirects=False)
    assert home.status_code == 200
    assert "logged in" in home.text


def test_a_wrong_password_shows_an_error_and_stays_logged_out(client: TestClient) -> None:
    response = log_in(client, "guess")

    assert response.status_code == 401
    assert "Wrong password." in response.text
    assert client.get(f"{PREFIX}/", follow_redirects=False).status_code == 303


def test_the_login_page_sends_a_logged_in_operator_home(client: TestClient) -> None:
    log_in(client)

    response = client.get(f"{PREFIX}/login", follow_redirects=False)

    assert response.headers["location"] == f"{PREFIX}/"


def test_logging_out_ends_the_session(client: TestClient) -> None:
    log_in(client)

    response = log_out(client)

    assert response.status_code == 303
    assert response.headers["location"] == f"{PREFIX}/login"
    assert client.get(f"{PREFIX}/", follow_redirects=False).status_code == 303


def test_the_session_ends_after_its_lifetime(database_path: Path, clock: FakeClock) -> None:
    client = make_client(database_path, clock, COURT_BOOKER_SESSION_DAYS="2")
    log_in(client)

    clock.advance(timedelta(days=2) - timedelta(seconds=1))
    assert client.get(f"{PREFIX}/", follow_redirects=False).status_code == 200
    clock.advance(timedelta(seconds=1))
    assert client.get(f"{PREFIX}/", follow_redirects=False).status_code == 303


def test_a_forged_session_cookie_is_refused(client: TestClient) -> None:
    client.cookies.set("court_booker_session", "v1.1791288000.forged", path=PREFIX)

    assert client.get(f"{PREFIX}/", follow_redirects=False).status_code == 303


@pytest.mark.parametrize("token", [None, "", "not-the-token"])
def test_a_post_without_a_valid_csrf_token_is_rejected(
    client: TestClient, token: str | None
) -> None:
    client.get(f"{PREFIX}/login")
    form = {"password": OPERATOR_PASSWORD}
    if token is not None:
        form["csrf_token"] = token

    response = client.post(f"{PREFIX}/login", data=form, follow_redirects=False)

    assert response.status_code == 403
    assert client.get(f"{PREFIX}/", follow_redirects=False).status_code == 303


def test_a_csrf_token_from_another_browser_is_rejected(
    client: TestClient, database_path: Path, clock: FakeClock
) -> None:
    other_browser = make_client(database_path, clock)
    others_token = csrf_token_in(other_browser.get(f"{PREFIX}/login").text)
    client.get(f"{PREFIX}/login")

    response = client.post(
        f"{PREFIX}/login",
        data={"password": OPERATOR_PASSWORD, "csrf_token": others_token},
        follow_redirects=False,
    )

    assert response.status_code == 403


def test_logout_needs_a_csrf_token(client: TestClient) -> None:
    log_in(client)

    response = client.post(f"{PREFIX}/logout", data={}, follow_redirects=False)

    assert response.status_code == 403
    assert client.get(f"{PREFIX}/", follow_redirects=False).status_code == 200


def test_too_many_wrong_passwords_lock_out_even_the_right_one(client: TestClient) -> None:
    for _ in range(3):
        assert log_in(client, "guess").status_code == 401

    response = log_in(client)

    assert response.status_code == 429
    assert "Try again in 15 minutes." in response.text
    assert client.get(f"{PREFIX}/", follow_redirects=False).status_code == 303


def test_the_lockout_lifts_after_the_configured_minutes(
    client: TestClient, clock: FakeClock
) -> None:
    for _ in range(3):
        log_in(client, "guess")

    clock.advance(timedelta(minutes=14))
    assert "Try again in 1 minute." in log_in(client).text
    clock.advance(timedelta(minutes=1))
    assert log_in(client).status_code == 303


def test_a_successful_login_resets_the_failure_count(client: TestClient, clock: FakeClock) -> None:
    for _ in range(2):
        log_in(client, "guess")
    log_in(client)
    log_out(client)

    for _ in range(2):
        log_in(client, "guess")

    assert log_in(client).status_code == 303


def test_the_lockout_survives_a_restart(database_path: Path, clock: FakeClock) -> None:
    before_restart = make_client(database_path, clock, COURT_BOOKER_LOGIN_MAX_FAILURES="3")
    for _ in range(3):
        log_in(before_restart, "guess")

    after_restart = make_client(database_path, clock, COURT_BOOKER_LOGIN_MAX_FAILURES="3")

    assert log_in(after_restart).status_code == 429


def test_logins_are_logged_without_the_password(
    client: TestClient, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.INFO, logger="court_booker")

    log_in(client, "guess-one")
    log_in(client)

    levels = {record.getMessage(): record.levelname for record in caplog.records}
    assert levels["login failed: wrong password"] == "WARNING"
    assert levels["operator logged in"] == "INFO"
    logged = json.dumps([vars(record) for record in caplog.records], default=str)
    assert "guess-one" not in logged
    assert OPERATOR_PASSWORD not in logged
