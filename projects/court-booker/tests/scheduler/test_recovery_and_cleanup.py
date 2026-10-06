"""Downtime, restarts, old data and screenshots, through the whole app with a fake clock."""

from datetime import UTC, datetime, time, timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from court_booker.adapters.sqlite.database import SqliteDatabase
from court_booker.court_booking_site import Taken
from tests.support import (
    OPERATOR_PASSWORD,
    PREFIX,
    FakeClock,
    FakeSite,
    FixedRandom,
    csrf_token_in,
    make_client,
    tick,
)
from tests.web.test_booking_request_pages import NOW, create, request_cards, save_profile

# Runs at 00:01:30 on Wed 7 Oct, Malaysia time (see test_booking_at_release_time).
PLAY_DATE = "2026-10-09"
RUN_AT = datetime(2026, 10, 6, 16, 1, 30, tzinfo=UTC)
SCREENSHOT_LINK = f"{PREFIX}/requests/1/slots/20:00/screenshot"


@pytest.fixture
def clock() -> FakeClock:
    return FakeClock(NOW)


@pytest.fixture
def screenshot_dir(tmp_path: Path) -> Path:
    return tmp_path / "screenshots"


@pytest.fixture
def site(clock: FakeClock, screenshot_dir: Path) -> FakeSite:
    return FakeSite(clock, screenshot_dir=screenshot_dir)


def app_client(
    tmp_path: Path, clock: FakeClock, site: FakeSite, screenshot_dir: Path
) -> TestClient:
    return make_client(
        tmp_path / "court-booker.sqlite3",
        clock,
        FixedRandom(),
        site,
        COURT_BOOKER_SCREENSHOT_DIR=str(screenshot_dir),
    )


@pytest.fixture
def client(tmp_path: Path, clock: FakeClock, site: FakeSite, screenshot_dir: Path) -> TestClient:
    client = app_client(tmp_path, clock, site, screenshot_dir)
    log_in(client)
    save_profile(client)
    return client


def log_in(client: TestClient) -> None:
    token = csrf_token_in(client.get(f"{PREFIX}/login").text)
    client.post(f"{PREFIX}/login", data={"password": OPERATOR_PASSWORD, "csrf_token": token})


def run_one(client: TestClient, clock: FakeClock, slots: list[str]) -> None:
    create(client, PLAY_DATE, slots)
    clock.current = RUN_AT
    assert tick(client) == 1


def test_a_request_picked_up_within_5_minutes_is_not_late(
    client: TestClient, clock: FakeClock
) -> None:
    create(client, PLAY_DATE, ["20:00"])
    clock.current = RUN_AT + timedelta(minutes=5)

    assert tick(client) == 1
    assert "Ran late" not in request_cards(client)[0]


def test_a_request_picked_up_over_5_minutes_late_says_so(
    client: TestClient, clock: FakeClock, site: FakeSite
) -> None:
    create(client, PLAY_DATE, ["20:00"])
    # The server was down over the run time and came back at 03:00 Malaysia time.
    clock.current = datetime(2026, 10, 6, 19, 0, tzinfo=UTC)

    assert tick(client) == 1

    assert len(site.calls) == 1
    assert request_cards(client)[0].startswith(
        "Fri 9 Oct 2026 Status: Done Ran late: ran at Wed 7 Oct 2026, 03:00:00 "
        "(Asia/Kuala_Lumpur time) 20:00: Booked"
    )


def test_a_waiting_request_whose_date_has_passed_is_missed(
    client: TestClient, clock: FakeClock, site: FakeSite
) -> None:
    create(client, PLAY_DATE, ["18:00", "20:00"])
    # Down until the day after the date, Malaysia time.
    clock.current = datetime(2026, 10, 9, 16, 0, tzinfo=UTC)

    assert tick(client) == 0

    assert site.calls == []
    assert request_cards(client) == [
        "Fri 9 Oct 2026 Status: Done 18:00: Failed (missed) 20:00: Failed (missed)"
    ]


def test_a_request_found_booking_at_startup_is_not_rerun(
    tmp_path: Path, client: TestClient, clock: FakeClock, site: FakeSite, screenshot_dir: Path
) -> None:
    site.script = {time(16): [Taken()]}

    def die_during_second_attempt() -> None:
        if len(site.calls) == 2:
            raise SystemExit("power cut")

    site.during_book = die_during_second_attempt
    create(client, PLAY_DATE, ["16:00", "18:00", "20:00"])
    clock.current = RUN_AT
    with pytest.raises(SystemExit):
        tick(client)

    restarted_site = FakeSite(clock)
    restarted = app_client(tmp_path, clock, restarted_site, screenshot_dir)
    with restarted:  # runs startup
        pass
    clock.advance(timedelta(minutes=1))
    assert tick(restarted) == 0

    assert restarted_site.calls == []
    card = request_cards(client)[0]
    assert card.startswith("Fri 9 Oct 2026 Status: Done 16:00: Taken tried")
    assert "18:00: Failed (interrupted, check Picktime) tried" in card
    assert card.endswith("20:00: Failed (interrupted, check Picktime)")


def test_requests_results_and_screenshots_are_deleted_after_retention(
    client: TestClient, clock: FakeClock, screenshot_dir: Path
) -> None:
    create(client, "2026-10-10", ["20:00"])
    run_one(client, clock, ["18:00", "20:00"])
    screenshots = sorted(screenshot_dir.iterdir())
    assert len(screenshots) == 2

    # The last moment of 8 Nov, Malaysia time: the 9th is 30 days ago, so still kept.
    clock.current = datetime(2026, 11, 8, 15, 59, tzinfo=UTC)
    tick(client)
    log_in(client)  # the session from a month ago has expired
    assert len(request_cards(client)) == 2
    assert all(path.exists() for path in screenshots)

    clock.current = datetime(2026, 11, 8, 16, 0, tzinfo=UTC)
    tick(client)

    assert [card.split(" Status")[0] for card in request_cards(client)] == ["Sat 10 Oct 2026"]
    assert not any(path.exists() for path in screenshots)


def test_retention_follows_the_setting(
    tmp_path: Path, clock: FakeClock, site: FakeSite, screenshot_dir: Path
) -> None:
    client = make_client(
        tmp_path / "court-booker.sqlite3",
        clock,
        FixedRandom(),
        site,
        COURT_BOOKER_SCREENSHOT_DIR=str(screenshot_dir),
        COURT_BOOKER_RETENTION_DAYS="1",
    )
    log_in(client)
    save_profile(client)
    run_one(client, clock, ["20:00"])

    # 11 Oct, Malaysia time.
    clock.current = datetime(2026, 10, 10, 16, 0, tzinfo=UTC)
    tick(client)

    log_in(client)
    assert request_cards(client) == []
    assert list(screenshot_dir.iterdir()) == []


def test_a_tried_slot_links_to_its_screenshot(client: TestClient, clock: FakeClock) -> None:
    run_one(client, clock, ["20:00"])

    assert f'href="{SCREENSHOT_LINK}"' in client.get(f"{PREFIX}/").text
    response = client.get(SCREENSHOT_LINK)

    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert response.content == b"\x89PNG 2026-10-09-2000-1.png"


def test_screenshots_are_only_for_the_logged_in_operator(
    tmp_path: Path, client: TestClient, clock: FakeClock, site: FakeSite, screenshot_dir: Path
) -> None:
    run_one(client, clock, ["20:00"])
    stranger = app_client(tmp_path, clock, site, screenshot_dir)

    response = stranger.get(SCREENSHOT_LINK, follow_redirects=False)

    assert response.status_code == 303
    assert response.headers["location"] == f"{PREFIX}/login"


def test_a_slot_without_a_screenshot_has_no_link_and_none_is_served(client: TestClient) -> None:
    create(client, PLAY_DATE, ["20:00"])

    assert "screenshot" not in client.get(f"{PREFIX}/").text
    assert client.get(SCREENSHOT_LINK).status_code == 404
    assert client.get(f"{PREFIX}/requests/1/slots/08:00/screenshot").status_code == 404
    assert client.get(f"{PREFIX}/requests/9/slots/20:00/screenshot").status_code == 404


def test_a_screenshot_file_that_is_gone_is_not_found(
    client: TestClient, clock: FakeClock, screenshot_dir: Path
) -> None:
    run_one(client, clock, ["20:00"])
    for path in screenshot_dir.iterdir():
        path.unlink()

    assert client.get(SCREENSHOT_LINK).status_code == 404


def test_only_files_inside_the_screenshot_directory_are_served(
    tmp_path: Path, client: TestClient, clock: FakeClock
) -> None:
    run_one(client, clock, ["20:00"])
    database_path = tmp_path / "court-booker.sqlite3"
    # A row pointing outside the directory, however it got there.
    with SqliteDatabase(database_path).connection() as connection:
        connection.execute("UPDATE slot_attempts SET screenshot = ?", (str(database_path),))
    outside = client.get(SCREENSHOT_LINK)
    with SqliteDatabase(database_path).connection() as connection:
        traversal = str(tmp_path / "screenshots" / ".." / "court-booker.sqlite3")
        connection.execute("UPDATE slot_attempts SET screenshot = ?", (traversal,))
    climbing_out = client.get(SCREENSHOT_LINK)

    assert (outside.status_code, climbing_out.status_code) == (404, 404)
    assert b"SQLite" not in outside.content + climbing_out.content
