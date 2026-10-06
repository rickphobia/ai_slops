import time as wall_clock
from datetime import timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from tests.support import PREFIX, FakeClock, make_client, tick


@pytest.fixture
def clock() -> FakeClock:
    return FakeClock()


@pytest.fixture
def client(tmp_path: Path, clock: FakeClock) -> TestClient:
    return make_client(tmp_path / "court-booker.sqlite3", clock)


def test_healthz_answers_ok_under_the_path_prefix(client: TestClient) -> None:
    response = client.get(f"{PREFIX}/healthz")

    assert response.status_code == 200
    # Before the first tick there is no age yet; the app has only just started.
    assert response.json() == {"status": "ok", "database": "ok", "last_tick_seconds_ago": None}


def test_healthz_needs_no_login(client: TestClient) -> None:
    response = client.get(f"{PREFIX}/healthz", follow_redirects=False)

    assert response.status_code == 200


def test_healthz_reports_the_age_of_the_last_tick(client: TestClient, clock: FakeClock) -> None:
    tick(client)
    clock.advance(timedelta(seconds=42))

    response = client.get(f"{PREFIX}/healthz")

    assert response.status_code == 200
    assert response.json()["last_tick_seconds_ago"] == 42


def test_healthz_fails_when_the_last_tick_is_stale(client: TestClient, clock: FakeClock) -> None:
    tick(client)
    clock.advance(timedelta(seconds=601))

    response = client.get(f"{PREFIX}/healthz")

    assert response.status_code == 503
    assert response.json() == {
        "status": "failing",
        "database": "ok",
        "last_tick_seconds_ago": 601,
    }


def test_healthz_fails_when_the_scheduler_never_ticks(client: TestClient, clock: FakeClock) -> None:
    clock.advance(timedelta(seconds=601))

    assert client.get(f"{PREFIX}/healthz").status_code == 503


def test_healthz_fails_when_the_database_is_unreadable(tmp_path: Path, client: TestClient) -> None:
    tick(client)
    (tmp_path / "court-booker.sqlite3").unlink()

    response = client.get(f"{PREFIX}/healthz")

    assert response.status_code == 503
    assert response.json()["database"] == "unreachable"


def test_startup_runs_a_tick_in_the_background(client: TestClient) -> None:
    with client:
        deadline = wall_clock.monotonic() + 5
        while client.get(f"{PREFIX}/healthz").json()["last_tick_seconds_ago"] is None:
            assert wall_clock.monotonic() < deadline, "no tick within 5 seconds of startup"
            wall_clock.sleep(0.01)


def test_unknown_paths_are_not_found(client: TestClient) -> None:
    response = client.get(f"{PREFIX}/nope")

    assert response.status_code == 404
