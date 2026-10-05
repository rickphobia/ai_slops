from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from tests.support import PREFIX, FakeClock, make_client


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    return make_client(tmp_path / "court-booker.sqlite3", FakeClock())


def test_healthz_answers_ok_under_the_path_prefix(client: TestClient) -> None:
    response = client.get(f"{PREFIX}/healthz")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_healthz_needs_no_login(client: TestClient) -> None:
    response = client.get(f"{PREFIX}/healthz", follow_redirects=False)

    assert response.status_code == 200


def test_unknown_paths_are_not_found(client: TestClient) -> None:
    response = client.get(f"{PREFIX}/nope")

    assert response.status_code == 404
