import logging
import re
from datetime import UTC, datetime
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient

from tests.support import (
    OPERATOR_PASSWORD,
    PREFIX,
    FakeClock,
    FixedRandom,
    csrf_token_in,
    make_client,
)

PROFILE = {
    "first_name": "Meiling",
    "email": "meiling@example.com",
    "unit_number": "B-07-11",
    "mobile": "0198765432",
}
# 20:00 on Tuesday 6 October, Malaysia time.
NOW = datetime(2026, 10, 6, 12, 0, tzinfo=UTC)


def logged_in_client(tmp_path: Path, clock: FakeClock, fraction: float = 0.5) -> TestClient:
    client = make_client(tmp_path / "court-booker.sqlite3", clock, FixedRandom(fraction))
    token = csrf_token_in(client.get(f"{PREFIX}/login").text)
    client.post(f"{PREFIX}/login", data={"password": OPERATOR_PASSWORD, "csrf_token": token})
    return client


def save_profile(client: TestClient) -> None:
    token = csrf_token_in(client.get(f"{PREFIX}/profile").text)
    client.post(f"{PREFIX}/profile", data={**PROFILE, "csrf_token": token})


@pytest.fixture
def clock() -> FakeClock:
    return FakeClock(NOW)


@pytest.fixture
def client(tmp_path: Path, clock: FakeClock) -> TestClient:
    client = logged_in_client(tmp_path, clock)
    save_profile(client)
    return client


def create(client: TestClient, play_date: str, slots: list[str]) -> httpx.Response:
    token = csrf_token_in(client.get(f"{PREFIX}/requests/new").text)
    response: httpx.Response = client.post(
        f"{PREFIX}/requests/new",
        data={"play_date": play_date, "slots": slots, "csrf_token": token},
        follow_redirects=False,
    )
    return response


def edit(client: TestClient, request_id: int, slots: list[str]) -> httpx.Response:
    token = csrf_token_in(client.get(f"{PREFIX}/").text)
    response: httpx.Response = client.post(
        f"{PREFIX}/requests/{request_id}/edit",
        data={"slots": slots, "csrf_token": token},
        follow_redirects=False,
    )
    return response


def cancel(client: TestClient, request_id: int) -> httpx.Response:
    token = csrf_token_in(client.get(f"{PREFIX}/").text)
    response: httpx.Response = client.post(
        f"{PREFIX}/requests/{request_id}/cancel",
        data={"csrf_token": token},
        follow_redirects=False,
    )
    return response


def request_cards(client: TestClient) -> list[str]:
    """The text of each Booking Request on the list page, top to bottom, whitespace squashed."""
    page = client.get(f"{PREFIX}/").text
    cards = re.findall(r'<li class="request[^"]*">(.*?)</li>', page, flags=re.DOTALL)
    return [" ".join(re.sub(r"<[^>]+>", " ", card).split()) for card in cards]


def test_the_new_page_offers_a_date_picker_and_one_checkbox_per_slot(client: TestClient) -> None:
    page = client.get(f"{PREFIX}/requests/new").text

    assert 'type="date"' in page
    assert 'min="2026-10-06"' in page
    boxes = re.findall(r'type="checkbox" name="slots" value="([^"]+)"', page)
    assert boxes == ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"]
    assert 'name="viewport"' in page


def test_a_future_date_runs_between_0001_and_0002_after_its_release_time(
    client: TestClient,
) -> None:
    response = create(client, "2026-10-09", ["20:00", "18:00"])

    assert response.status_code == 303
    assert response.headers["location"] == f"{PREFIX}/"
    # Released at midnight on the 7th; the fixed random source picks the middle of 60 to 120 s.
    assert request_cards(client) == [
        "Fri 9 Oct 2026 Slots: 18:00, 20:00 Status: Waiting "
        "Runs at Wed 7 Oct 2026, 00:01:30 (Malaysia time) Edit Cancel"
    ]


@pytest.mark.parametrize(("fraction", "shown"), [(0.0, "00:01:00"), (1.0, "00:02:00")])
def test_the_run_time_stays_inside_the_jitter_window(
    tmp_path: Path, clock: FakeClock, fraction: float, shown: str
) -> None:
    client = logged_in_client(tmp_path, clock, fraction)
    save_profile(client)

    create(client, "2026-10-09", ["08:00"])

    assert f"Runs at Wed 7 Oct 2026, {shown}" in request_cards(client)[0]


@pytest.mark.parametrize("play_date", ["2026-10-06", "2026-10-08"])
def test_a_date_already_in_the_booking_window_runs_in_about_a_minute(
    client: TestClient, play_date: str
) -> None:
    create(client, play_date, ["10:00"])

    assert "Runs at Tue 6 Oct 2026, 20:01:00" in request_cards(client)[0]


def test_editing_slots_keeps_the_run_time(client: TestClient, clock: FakeClock) -> None:
    create(client, "2026-10-09", ["08:00"])
    clock.current = datetime(2026, 10, 6, 15, 0, tzinfo=UTC)

    response = edit(client, 1, ["12:00", "10:00"])

    assert response.status_code == 303
    assert request_cards(client) == [
        "Fri 9 Oct 2026 Slots: 10:00, 12:00 Status: Waiting "
        "Runs at Wed 7 Oct 2026, 00:01:30 (Malaysia time) Edit Cancel"
    ]


def test_the_edit_page_shows_the_date_and_ticks_the_chosen_slots(client: TestClient) -> None:
    create(client, "2026-10-09", ["08:00", "20:00"])

    page = client.get(f"{PREFIX}/requests/1/edit").text

    assert "Fri 9 Oct 2026" in page
    assert 'type="date"' not in page
    checked = re.findall(r'name="slots" value="([^"]+)" checked', page)
    assert checked == ["08:00", "20:00"]


def test_the_list_shows_upcoming_dates_first_then_past_ones(
    client: TestClient, clock: FakeClock
) -> None:
    for play_date in ["2026-10-12", "2026-10-07", "2026-10-09", "2026-10-08"]:
        create(client, play_date, ["08:00"])
    # Two days later (venue time), the 7th and 8th have passed.
    clock.current = datetime(2026, 10, 8, 16, 30, tzinfo=UTC)

    dates = [card.split(" Slots")[0] for card in request_cards(client)]

    assert dates == ["Fri 9 Oct 2026", "Mon 12 Oct 2026", "Thu 8 Oct 2026", "Wed 7 Oct 2026"]


def test_a_request_needs_a_profile(tmp_path: Path, clock: FakeClock) -> None:
    client = logged_in_client(tmp_path, clock)

    response = create(client, "2026-10-09", ["08:00"])

    assert response.status_code == 422
    assert "Save the Profile first" in response.text
    assert f'href="{PREFIX}/profile"' in response.text
    assert request_cards(client) == []


@pytest.mark.parametrize(
    ("play_date", "slots", "message"),
    [
        ("2026-10-05", ["08:00"], "2026-10-05 is in the past"),
        ("", ["08:00"], "Pick a date."),
        ("next friday", ["08:00"], "Pick a date."),
        ("2026-10-09", [], "Tick at least one Slot."),
        ("2026-10-09", ["09:00"], "&#39;09:00&#39; is not one of the Court&#39;s Slots."),
        ("2026-10-09", ["08:00", "22:00"], "&#39;22:00&#39; is not one of the Court&#39;s Slots."),
    ],
)
def test_a_broken_rule_shows_its_message_keeps_the_input_and_saves_nothing(
    client: TestClient, play_date: str, slots: list[str], message: str
) -> None:
    response = create(client, play_date, slots)

    assert response.status_code == 422
    assert message in response.text
    assert f'value="{play_date}"' in response.text
    assert request_cards(client) == []


def test_the_past_is_judged_in_venue_time(client: TestClient, clock: FakeClock) -> None:
    # 00:30 on the 7th in Malaysia, still the 6th in UTC.
    clock.current = datetime(2026, 10, 6, 16, 30, tzinfo=UTC)

    response = create(client, "2026-10-06", ["08:00"])

    assert response.status_code == 422
    assert "2026-10-06 is in the past" in response.text


def test_a_date_can_have_only_one_booking_request(client: TestClient) -> None:
    create(client, "2026-10-09", ["08:00"])

    response = create(client, "2026-10-09", ["10:00"])

    assert response.status_code == 422
    assert "There is already a Booking Request for 2026-10-09" in response.text
    assert len(request_cards(client)) == 1


def test_a_cancelled_request_frees_its_date(client: TestClient) -> None:
    create(client, "2026-10-09", ["08:00"])
    cancel(client, 1)

    response = create(client, "2026-10-09", ["10:00"])

    assert response.status_code == 303
    assert len(request_cards(client)) == 2


def test_an_edit_with_a_broken_rule_changes_nothing(client: TestClient) -> None:
    create(client, "2026-10-09", ["08:00"])

    for slots, message in [([], "Tick at least one Slot."), (["07:00"], "not one of the Court")]:
        response = edit(client, 1, slots)

        assert response.status_code == 422
        assert message in response.text
    assert "Slots: 08:00 " in request_cards(client)[0]


def test_cancel_marks_the_request_cancelled_and_removes_its_actions(client: TestClient) -> None:
    create(client, "2026-10-09", ["08:00"])

    response = cancel(client, 1)

    assert response.status_code == 303
    assert request_cards(client) == ["Fri 9 Oct 2026 Slots: 08:00 Status: Cancelled"]


def test_a_cancelled_request_can_be_neither_edited_nor_cancelled_again(
    client: TestClient,
) -> None:
    create(client, "2026-10-09", ["08:00"])
    cancel(client, 1)

    for response in (
        client.get(f"{PREFIX}/requests/1/edit"),
        edit(client, 1, ["10:00"]),
        cancel(client, 1),
    ):
        assert response.status_code == 409
        assert "is Cancelled, so it can&#39;t be changed" in response.text
    assert request_cards(client) == ["Fri 9 Oct 2026 Slots: 08:00 Status: Cancelled"]


def test_an_unknown_request_is_not_found(client: TestClient) -> None:
    assert client.get(f"{PREFIX}/requests/42/edit").status_code == 404
    assert edit(client, 42, ["08:00"]).status_code == 404
    assert cancel(client, 42).status_code == 404


def test_a_logged_out_visitor_is_sent_to_login(tmp_path: Path, clock: FakeClock) -> None:
    client = make_client(tmp_path / "court-booker.sqlite3", clock)
    token = csrf_token_in(client.get(f"{PREFIX}/login").text)
    form = {"play_date": "2026-10-09", "slots": ["08:00"], "csrf_token": token}

    for response in (
        client.get(f"{PREFIX}/requests/new", follow_redirects=False),
        client.post(f"{PREFIX}/requests/new", data=form, follow_redirects=False),
        client.get(f"{PREFIX}/requests/1/edit", follow_redirects=False),
        client.post(f"{PREFIX}/requests/1/edit", data=form, follow_redirects=False),
        client.post(f"{PREFIX}/requests/1/cancel", data=form, follow_redirects=False),
    ):
        assert response.status_code == 303
        assert response.headers["location"] == f"{PREFIX}/login"


def test_slots_follow_the_configured_list(tmp_path: Path, clock: FakeClock) -> None:
    client = make_client(tmp_path / "court-booker.sqlite3", clock, COURT_BOOKER_SLOTS="09:00,19:30")
    token = csrf_token_in(client.get(f"{PREFIX}/login").text)
    client.post(f"{PREFIX}/login", data={"password": OPERATOR_PASSWORD, "csrf_token": token})
    save_profile(client)

    page = client.get(f"{PREFIX}/requests/new").text

    assert re.findall(r'name="slots" value="([^"]+)"', page) == ["09:00", "19:30"]
    assert create(client, "2026-10-09", ["19:30"]).status_code == 303
    assert create(client, "2026-10-10", ["08:00"]).status_code == 422


def test_changes_are_logged_without_profile_data(
    client: TestClient, caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.INFO):
        create(client, "2026-10-09", ["08:00"])
        create(client, "2026-10-09", ["08:00"])
        edit(client, 1, ["10:00"])
        cancel(client, 1)

    messages = [record.getMessage() for record in caplog.records]
    for message in (
        "booking request created",
        "booking request not created",
        "booking request slots changed",
        "booking request cancelled",
    ):
        assert message in messages
    created = next(r for r in caplog.records if r.getMessage() == "booking request created")
    assert vars(created)["run_at"] == "2026-10-06T16:01:30+00:00"
    logged = "\n".join(f"{record.getMessage()} {vars(record)}" for record in caplog.records)
    for value in PROFILE.values():
        assert value not in logged
