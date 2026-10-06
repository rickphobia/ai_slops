"""Booking at Release Time, through the whole app: create through the pages, tick, read the list."""

import logging
from datetime import UTC, date, datetime, time, timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from court_booker.court_booking_site import Booked, NetworkError, NotOpen, Rejected, Taken
from court_booker.profile.profile import Profile
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
from tests.web.test_booking_request_pages import (
    NOW,
    PROFILE,
    cancel,
    create,
    edit,
    request_cards,
    save_profile,
)

# The 9th is released at 00:00 on the 7th, Malaysia time (16:00 on the 6th, UTC). The fixed
# random source picks the middle of the 60-120 s jitter.
PLAY_DATE = "2026-10-09"
RUN_AT = datetime(2026, 10, 6, 16, 1, 30, tzinfo=UTC)
# Also the middle: of the 5-20 s pause between Slots.
PAUSE = timedelta(seconds=12.5)


@pytest.fixture
def clock() -> FakeClock:
    return FakeClock(NOW)


@pytest.fixture
def site(clock: FakeClock) -> FakeSite:
    return FakeSite(clock)


def logged_in(
    database_path: Path, clock: FakeClock, site: FakeSite, fraction: float = 0.5
) -> TestClient:
    client = make_client(database_path, clock, FixedRandom(fraction), site)
    token = csrf_token_in(client.get(f"{PREFIX}/login").text)
    client.post(f"{PREFIX}/login", data={"password": OPERATOR_PASSWORD, "csrf_token": token})
    return client


@pytest.fixture
def client(tmp_path: Path, clock: FakeClock, site: FakeSite) -> TestClient:
    client = logged_in(tmp_path / "court-booker.sqlite3", clock, site)
    save_profile(client)
    return client


def run_due(client: TestClient, clock: FakeClock) -> int:
    clock.current = RUN_AT
    return tick(client)


def test_nothing_runs_before_the_run_time(
    client: TestClient, clock: FakeClock, site: FakeSite
) -> None:
    create(client, PLAY_DATE, ["20:00"])
    clock.current = RUN_AT - timedelta(microseconds=1)

    assert tick(client) == 0
    assert site.calls == []
    assert "Status: Waiting" in request_cards(client)[0]


@pytest.mark.parametrize(
    ("fraction", "run_at"),
    [
        (0.0, datetime(2026, 10, 6, 16, 1, 0, tzinfo=UTC)),
        (1.0, datetime(2026, 10, 6, 16, 2, 0, tzinfo=UTC)),
    ],
)
def test_the_run_happens_between_0001_and_0002_after_release_time(
    tmp_path: Path, clock: FakeClock, site: FakeSite, fraction: float, run_at: datetime
) -> None:
    client = logged_in(tmp_path / "court-booker.sqlite3", clock, site, fraction)
    save_profile(client)
    create(client, PLAY_DATE, ["20:00"])

    clock.current = run_at - timedelta(seconds=1)
    assert tick(client) == 0
    clock.current = run_at
    assert tick(client) == 1

    assert [call.at for call in site.calls] == [run_at]


def test_every_slot_is_tried_in_time_order_with_a_pause_between(
    client: TestClient, clock: FakeClock, site: FakeSite
) -> None:
    create(client, PLAY_DATE, ["20:00", "08:00", "14:00"])

    assert run_due(client, clock) == 1

    assert [call.slot for call in site.calls] == [time(8), time(14), time(20)]
    assert {call.day for call in site.calls} == {date(2026, 10, 9)}
    assert not any(call.dry_run for call in site.calls)
    assert clock.sleeps == [PAUSE, PAUSE]
    # Each attempt takes the fake site 8 s.
    assert request_cards(client) == [
        "Fri 9 Oct 2026 Status: Done "
        "08:00: Booked tried Wed 7 Oct 2026, 00:01:30 screenshot "
        "14:00: Booked tried Wed 7 Oct 2026, 00:01:50 screenshot "
        "20:00: Booked tried Wed 7 Oct 2026, 00:02:11 screenshot"
    ]


def test_the_profile_is_read_when_the_request_runs(
    client: TestClient, clock: FakeClock, site: FakeSite
) -> None:
    create(client, PLAY_DATE, ["20:00"])
    token = csrf_token_in(client.get(f"{PREFIX}/profile").text)
    client.post(f"{PREFIX}/profile", data={**PROFILE, "mobile": "0111111111", "csrf_token": token})

    run_due(client, clock)

    assert site.calls[0].profile == Profile(**{**PROFILE, "mobile": "0111111111"})


def test_a_taken_slot_is_never_retried_and_the_others_still_run(
    client: TestClient, clock: FakeClock, site: FakeSite
) -> None:
    create(client, PLAY_DATE, ["18:00", "20:00"])
    site.script = {time(18): [Taken()]}

    run_due(client, clock)

    assert [call.slot for call in site.calls] == [time(18), time(20)]
    card = request_cards(client)[0]
    assert "18:00: Taken tried" in card
    assert "20:00: Booked tried" in card


def test_a_network_error_is_retried_with_backoff_then_fails(
    client: TestClient, clock: FakeClock, site: FakeSite
) -> None:
    create(client, PLAY_DATE, ["18:00", "20:00"])
    error = NetworkError(step="pick date", detail="Timeout 30000ms exceeded")
    site.script = {time(18): [error, error, error]}

    run_due(client, clock)

    assert [call.slot for call in site.calls] == [time(18)] * 3 + [time(20)]
    # Backoff of 10 s, doubled, then the pause before the next Slot.
    assert clock.sleeps == [timedelta(seconds=10), timedelta(seconds=20), PAUSE]
    card = request_cards(client)[0]
    assert "18:00: Failed (Picktime didn&#39;t answer (pick date) after 3 tries)" in card
    assert "20:00: Booked" in card


def test_a_network_error_that_clears_on_a_retry_books_the_slot(
    client: TestClient, clock: FakeClock, site: FakeSite
) -> None:
    create(client, PLAY_DATE, ["20:00"])
    site.script = {time(20): [NetworkError(step="open page", detail="net::ERR_TIMED_OUT")]}

    run_due(client, clock)

    assert len(site.calls) == 2
    # The tried time is the attempt that settled it.
    assert "20:00: Booked tried Wed 7 Oct 2026, 00:01:48" in request_cards(client)[0]


def test_the_retry_count_follows_the_setting(
    tmp_path: Path, clock: FakeClock, site: FakeSite
) -> None:
    client = make_client(
        tmp_path / "court-booker.sqlite3", clock, FixedRandom(), site, COURT_BOOKER_RETRY_COUNT="0"
    )
    token = csrf_token_in(client.get(f"{PREFIX}/login").text)
    client.post(f"{PREFIX}/login", data={"password": OPERATOR_PASSWORD, "csrf_token": token})
    save_profile(client)
    create(client, PLAY_DATE, ["20:00"])
    site.script = {time(20): [NetworkError(step="submit", detail="closed")]}

    run_due(client, clock)

    assert len(site.calls) == 1
    assert "Failed (Picktime didn&#39;t answer (submit) after 1 try)" in request_cards(client)[0]


def test_a_rejection_fails_with_picktimes_text_and_is_not_retried(
    client: TestClient, clock: FakeClock, site: FakeSite
) -> None:
    create(client, PLAY_DATE, ["18:00", "20:00"])
    site.script = {time(20): [Rejected("Only one booking per unit per day")]}

    run_due(client, clock)

    assert [call.slot for call in site.calls] == [time(18), time(20)]
    card = request_cards(client)[0]
    assert "18:00: Booked" in card
    assert "20:00: Failed (Only one booking per unit per day)" in card


def test_a_date_not_open_fails_that_slot_and_the_rest_without_trying_them(
    client: TestClient, clock: FakeClock, site: FakeSite
) -> None:
    create(client, PLAY_DATE, ["16:00", "18:00", "20:00"])
    site.script = {time(16): [Booked()], time(18): [NotOpen()]}

    run_due(client, clock)

    assert [call.slot for call in site.calls] == [time(16), time(18)]
    card = request_cards(client)[0]
    assert "16:00: Booked" in card
    assert "18:00: Failed (date not open on Picktime yet) tried" in card
    assert card.endswith("20:00: Failed (date not open on Picktime yet)")


def test_a_crash_in_one_attempt_fails_only_that_slot(
    client: TestClient, clock: FakeClock, site: FakeSite
) -> None:
    create(client, PLAY_DATE, ["18:00", "20:00"])

    def crash_once() -> None:
        if len(site.calls) == 1:
            raise RuntimeError("browser vanished")

    site.during_book = crash_once

    run_due(client, clock)

    card = request_cards(client)[0]
    assert "18:00: Failed (court-booker error: RuntimeError)" in card
    assert "20:00: Booked" in card
    assert card.startswith("Fri 9 Oct 2026 Status: Done")


def test_a_request_is_never_claimed_twice(
    tmp_path: Path, client: TestClient, clock: FakeClock, site: FakeSite
) -> None:
    # A second app on the same database, as a second process or a second tick would be.
    other_site = FakeSite(clock)
    other = make_client(tmp_path / "court-booker.sqlite3", clock, FixedRandom(), other_site)
    create(client, PLAY_DATE, ["18:00", "20:00"])
    ticks_during_run: list[int] = []
    site.during_book = lambda: ticks_during_run.append(tick(other))

    assert run_due(client, clock) == 1
    assert tick(other) == 0

    assert ticks_during_run == [0, 0]
    assert other_site.calls == []
    assert [call.slot for call in site.calls] == [time(18), time(20)]


def test_while_booking_the_list_shows_progress_and_blocks_edit_and_cancel(
    client: TestClient, clock: FakeClock, site: FakeSite
) -> None:
    create(client, PLAY_DATE, ["18:00", "20:00"])
    seen: list[tuple[str, int, int, int]] = []

    def look_during_first_attempt() -> None:
        if len(site.calls) == 1:
            seen.append(
                (
                    request_cards(client)[0],
                    client.get(f"{PREFIX}/requests/1/edit").status_code,
                    edit(client, 1, ["08:00"]).status_code,
                    cancel(client, 1).status_code,
                )
            )

    site.during_book = look_during_first_attempt

    run_due(client, clock)

    assert seen == [
        (
            "Fri 9 Oct 2026 Status: Booking… "
            "18:00: Booking… tried Wed 7 Oct 2026, 00:01:30 "
            "20:00: Waiting",
            409,
            409,
            409,
        )
    ]
    # Booked as asked, not as the blocked edit would have had it.
    assert [call.slot for call in site.calls] == [time(18), time(20)]


def test_a_finished_request_can_be_neither_edited_nor_cancelled(
    client: TestClient, clock: FakeClock
) -> None:
    create(client, PLAY_DATE, ["20:00"])
    run_due(client, clock)

    assert edit(client, 1, ["08:00"]).status_code == 409
    response = cancel(client, 1)
    assert response.status_code == 409
    assert "is Done, so it can&#39;t be changed" in response.text


def test_runs_and_attempts_are_logged_without_profile_data(
    client: TestClient, clock: FakeClock, site: FakeSite, caplog: pytest.LogCaptureFixture
) -> None:
    create(client, PLAY_DATE, ["18:00", "20:00"])
    site.script = {time(18): [NetworkError(step="pick slot", detail="Timeout"), Taken()]}

    with caplog.at_level(logging.INFO):
        run_due(client, clock)

    attempts = [vars(r) for r in caplog.records if r.getMessage() == "slot attempt finished"]
    assert [
        (a["request_id"], a["play_date"], a["slot"], a["outcome"], a["retry"], a["step"])
        for a in attempts
    ] == [
        (1, PLAY_DATE, "18:00", "NetworkError", 0, "pick slot"),
        (1, PLAY_DATE, "18:00", "Taken", 1, None),
        (1, PLAY_DATE, "20:00", "Booked", 0, None),
    ]
    assert all(a["duration_seconds"] == 8.0 for a in attempts)
    messages = [record.getMessage() for record in caplog.records]
    for message in ("booking request claimed", "booking run started", "booking run finished"):
        assert message in messages
    logged = "\n".join(f"{record.getMessage()} {vars(record)}" for record in caplog.records)
    for value in PROFILE.values():
        assert value not in logged


def test_a_run_without_a_readable_profile_fails_every_slot(
    tmp_path: Path, clock: FakeClock, site: FakeSite
) -> None:
    database_path = tmp_path / "court-booker.sqlite3"
    client = logged_in(database_path, clock, site)
    save_profile(client)
    create(client, PLAY_DATE, ["18:00", "20:00"])
    # The server restarted with a different Profile key.
    restarted = make_client(
        database_path, clock, FixedRandom(), site, COURT_BOOKER_PROFILE_KEY="x" * 43 + "="
    )

    run_due(restarted, clock)

    assert site.calls == []
    card = request_cards(client)[0]
    assert "18:00: Failed (the saved Profile can&#39;t be read; save it again)" in card
    assert "20:00: Failed (the saved Profile can&#39;t be read; save it again)" in card
