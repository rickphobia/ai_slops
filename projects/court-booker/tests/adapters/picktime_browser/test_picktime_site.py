"""The Picktime adapter in real headless Chromium, against a local copy of the booking page."""

import json
import logging
import threading
from collections.abc import Iterator
from datetime import date, time, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, ClassVar
from urllib.parse import urlencode

import pytest

from court_booker.adapters.picktime_browser.picktime_site import PicktimeBrowserSite
from court_booker.court_booking_site import (
    Booked,
    NetworkError,
    NotOpen,
    ReadyToBook,
    Rejected,
    SlotAttempt,
    Taken,
)
from court_booker.profile.profile import Profile
from tests.support import FakeClock

BOOKING_PAGE = (Path(__file__).parent / "booking_page.html").read_bytes()
PROFILE = Profile(
    first_name="Mei Ling", email="mei@example.com", unit_number="A-12-3", mobile="0123456789"
)
OPEN_DAY = date(2026, 10, 8)


class BookingPageServer(ThreadingHTTPServer):
    submissions: ClassVar[list[dict[str, Any]]] = []


class BookingPageHandler(BaseHTTPRequestHandler):
    server: BookingPageServer

    def do_GET(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(BOOKING_PAGE)

    def do_POST(self) -> None:
        body = self.rfile.read(int(self.headers["Content-Length"]))
        self.server.submissions.append(json.loads(body))
        self.send_response(204)
        self.end_headers()

    def log_message(self, format: str, *args: object) -> None:
        """Keep the test output quiet."""


@pytest.fixture(scope="module")
def page_server() -> Iterator[BookingPageServer]:
    server = BookingPageServer(("127.0.0.1", 0), BookingPageHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield server
    server.shutdown()
    thread.join()


@pytest.fixture
def submissions(page_server: BookingPageServer) -> list[dict[str, Any]]:
    page_server.submissions.clear()
    return page_server.submissions


def site_at(
    url: str, screenshots: Path, court_name: str = "Badminton Hall 1"
) -> PicktimeBrowserSite:
    return PicktimeBrowserSite(
        page_url=url,
        court_name=court_name,
        timezone="Asia/Kuala_Lumpur",
        page_timeout=timedelta(seconds=3),
        screenshot_dir=screenshots,
        clock=FakeClock(),
    )


def page_url(server: BookingPageServer, **query: str) -> str:
    """The local booking page, with 7 and 8 Oct open unless `query` says otherwise."""
    query = {"open": "20261007,20261008", **query}
    port = server.server_address[1]
    return f"http://127.0.0.1:{port}/?{urlencode(query, safe=',')}"


def site_for(server: BookingPageServer, screenshots: Path, **query: str) -> PicktimeBrowserSite:
    return site_at(page_url(server, **query), screenshots)


def book(site: PicktimeBrowserSite, slot: time, *, dry_run: bool = False) -> SlotAttempt:
    return site.book(OPEN_DAY, slot, PROFILE, dry_run=dry_run)


def test_books_the_slot_with_the_profile_in_the_right_fields(
    page_server: BookingPageServer, submissions: list[dict[str, Any]], tmp_path: Path
) -> None:
    attempt = book(site_for(page_server, tmp_path), time(20, 0))

    assert attempt.outcome == Booked()
    assert submissions == [
        {
            "startdate": "202610082000",
            "first_name": "Mei Ling",
            "email": "mei@example.com",
            "unit_number": "A-12-3",
            "mobile": "0123456789",
            "notes": "",
        }
    ]


def test_writes_a_screenshot_of_the_final_page(
    page_server: BookingPageServer, submissions: list[dict[str, Any]], tmp_path: Path
) -> None:
    attempt = book(site_for(page_server, tmp_path), time(20, 0))

    assert attempt.screenshot is not None
    assert attempt.screenshot.parent == tmp_path
    assert attempt.screenshot.read_bytes().startswith(b"\x89PNG")
    assert attempt.duration > timedelta(0)


def test_dry_run_fills_the_form_but_never_submits(
    page_server: BookingPageServer, submissions: list[dict[str, Any]], tmp_path: Path
) -> None:
    attempt = book(site_for(page_server, tmp_path), time(18, 0), dry_run=True)

    assert attempt.outcome == ReadyToBook()
    assert submissions == []
    assert attempt.screenshot is not None and attempt.screenshot.exists()


def test_no_longer_available_after_book_is_taken(
    page_server: BookingPageServer, submissions: list[dict[str, Any]], tmp_path: Path
) -> None:
    attempt = book(site_for(page_server, tmp_path, result="taken"), time(20, 0))

    assert attempt.outcome == Taken()


def test_a_slot_missing_from_an_open_date_is_taken(
    page_server: BookingPageServer, submissions: list[dict[str, Any]], tmp_path: Path
) -> None:
    attempt = book(site_for(page_server, tmp_path, slots="0800,1000"), time(20, 0))

    assert attempt.outcome == Taken()
    assert submissions == []


def test_a_disabled_date_is_not_open(
    page_server: BookingPageServer, submissions: list[dict[str, Any]], tmp_path: Path
) -> None:
    attempt = book(site_for(page_server, tmp_path, open="20261007"), time(20, 0))

    assert attempt.outcome == NotOpen()
    assert submissions == []


def test_an_open_date_with_no_slots_is_not_open(
    page_server: BookingPageServer, submissions: list[dict[str, Any]], tmp_path: Path
) -> None:
    attempt = book(site_for(page_server, tmp_path, slots=""), time(20, 0))

    assert attempt.outcome == NotOpen()


def test_any_other_error_after_book_is_rejected_with_picktimes_text(
    page_server: BookingPageServer, submissions: list[dict[str, Any]], tmp_path: Path
) -> None:
    attempt = book(site_for(page_server, tmp_path, result="rejected"), time(20, 0))

    assert attempt.outcome == Rejected("Only one booking per unit per day is allowed")


def test_an_unreachable_page_is_a_network_error_naming_the_step(tmp_path: Path) -> None:
    # Nothing listens on port 9 (discard) here, so the connection is refused at once.
    attempt = book(site_at("http://127.0.0.1:9/", tmp_path), time(20, 0))

    assert isinstance(attempt.outcome, NetworkError)
    assert attempt.outcome.step == "open page"


def test_a_missing_court_is_a_network_error_at_pick_court(
    page_server: BookingPageServer, tmp_path: Path
) -> None:
    site = site_at(page_url(page_server), tmp_path, court_name="Squash Court 9")

    attempt = book(site, time(20, 0))

    assert isinstance(attempt.outcome, NetworkError)
    assert attempt.outcome.step == "pick court"
    assert attempt.screenshot is not None and attempt.screenshot.exists()


def test_logs_each_step_without_profile_values(
    page_server: BookingPageServer,
    submissions: list[dict[str, Any]],
    tmp_path: Path,
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.DEBUG, logger="court_booker")

    book(site_for(page_server, tmp_path), time(20, 0))

    steps = [getattr(record, "step", None) for record in caplog.records]
    assert steps == [
        "open page",
        "pick court",
        "pick date",
        "pick slot",
        "fill form",
        "submit",
        "read result",
        None,  # the closing summary
    ]
    logged = " ".join(f"{record.getMessage()} {record.__dict__}" for record in caplog.records)
    for value in ("Mei Ling", "mei@example.com", "A-12-3", "0123456789"):
        assert value not in logged


def test_dry_run_fails_when_something_covers_the_book_button(
    page_server: BookingPageServer, submissions: list[dict[str, Any]], tmp_path: Path
) -> None:
    attempt = book(site_for(page_server, tmp_path, covered="yes"), time(20, 0), dry_run=True)

    assert isinstance(attempt.outcome, NetworkError)
    assert attempt.outcome.step == "fill form"
    assert submissions == []


def test_a_venue_rule_that_says_not_available_stays_rejected(
    page_server: BookingPageServer, submissions: list[dict[str, Any]], tmp_path: Path
) -> None:
    message = "Booking not available: one booking per unit per day"
    site = site_for(page_server, tmp_path, result="rejected", message=message)

    attempt = book(site, time(20, 0))

    assert attempt.outcome == Rejected(message)
