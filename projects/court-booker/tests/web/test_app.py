from fastapi.testclient import TestClient

from court_booker.config import load_settings
from court_booker.web.app import create_app


def make_client() -> TestClient:
    return TestClient(create_app(load_settings({})))


def test_healthz_answers_ok_under_the_path_prefix() -> None:
    response = make_client().get("/ai-projects/court-booker/healthz")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_healthz_needs_no_login() -> None:
    response = make_client().get("/ai-projects/court-booker/healthz", follow_redirects=False)

    assert response.status_code == 200


def test_unknown_paths_are_not_found() -> None:
    response = make_client().get("/ai-projects/court-booker/nope")

    assert response.status_code == 404
