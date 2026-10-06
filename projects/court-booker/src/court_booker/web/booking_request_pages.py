"""The Booking Requests list (the home page), the pages to change one, and Slot screenshots."""

import logging
from collections.abc import Sequence
from datetime import date, datetime, time
from pathlib import Path
from typing import Annotated
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Form, Request
from fastapi.responses import FileResponse, PlainTextResponse, RedirectResponse
from starlette.responses import Response

from court_booker.booking_requests.booking_requests import (
    BookingRequest,
    BookingRequestError,
    BookingRequests,
    BookingRequestStatus,
    NotWaiting,
    ProfileMissing,
    SlotResult,
    slot_text,
)
from court_booker.web.access import access_of, log_context, path_for

logger = logging.getLogger(__name__)

router = APIRouter()

# Unticked checkboxes aren't sent, so no Slots at all arrives as an absent field.
SlotsField = Annotated[list[str], Form(default_factory=list)]


def _booking_requests(request: Request) -> BookingRequests:
    booking_requests: BookingRequests = request.app.state.booking_requests
    return booking_requests


@router.get("/", name="home")
def list_page(request: Request) -> Response:
    return _render_list(request)


@router.get("/requests/new", name="new_booking_request")
def new_page(request: Request) -> Response:
    return _render_form(request, editing=None, date_text="", slot_texts=[])


@router.post("/requests/new", name="create_booking_request")
def create(request: Request, slots: SlotsField, play_date: str = Form("")) -> Response:
    try:
        _booking_requests(request).create(play_date, slots)
    except BookingRequestError as error:
        _log_refusal(request, "booking request not created", error)
        return _render_form(
            request, editing=None, date_text=play_date, slot_texts=slots, error=error
        )
    return RedirectResponse(path_for(request, "home"), status_code=303)


@router.get("/requests/{request_id}/edit", name="edit_booking_request")
def edit_page(request: Request, request_id: int) -> Response:
    booking_request = _booking_requests(request).get(request_id)
    if booking_request.status is not BookingRequestStatus.WAITING:
        return _render_list(request, error=NotWaiting(booking_request), status_code=409)
    return _render_form(
        request,
        editing=booking_request,
        date_text=booking_request.play_date.isoformat(),
        slot_texts=[slot_text(slot) for slot in booking_request.slots],
    )


@router.post("/requests/{request_id}/edit", name="update_booking_request")
def update(request: Request, request_id: int, slots: SlotsField) -> Response:
    try:
        _booking_requests(request).edit_slots(request_id, slots)
    except NotWaiting as error:
        _log_refusal(request, "booking request not changed", error)
        return _render_list(request, error=error, status_code=409)
    except BookingRequestError as error:
        _log_refusal(request, "booking request not changed", error)
        booking_request = _booking_requests(request).get(request_id)
        return _render_form(
            request,
            editing=booking_request,
            date_text=booking_request.play_date.isoformat(),
            slot_texts=slots,
            error=error,
        )
    return RedirectResponse(path_for(request, "home"), status_code=303)


@router.post("/requests/{request_id}/cancel", name="cancel_booking_request")
def cancel(request: Request, request_id: int) -> Response:
    try:
        _booking_requests(request).cancel(request_id)
    except NotWaiting as error:
        _log_refusal(request, "booking request not cancelled", error)
        return _render_list(request, error=error, status_code=409)
    return RedirectResponse(path_for(request, "home"), status_code=303)


@router.get("/requests/{request_id}/slots/{slot}/screenshot", name="slot_screenshot")
def screenshot(request: Request, request_id: int, slot: time) -> Response:
    booking_request = _booking_requests(request).get(request_id)
    path = next(
        (result.screenshot for result in booking_request.slot_results if result.slot == slot),
        None,
    )
    screenshot_dir: Path = request.app.state.screenshot_dir
    # Only a file the database names, and only inside the screenshot directory: a bad row
    # must not turn this into a way to read any file on the server.
    if path is None or not path.resolve().is_relative_to(screenshot_dir.resolve()):
        return PlainTextResponse("This Slot has no screenshot.", status_code=404)
    if not path.is_file():
        logger.warning("screenshot file missing", extra={**log_context(request), "path": str(path)})
        return PlainTextResponse("This Slot's screenshot file is gone.", status_code=404)
    return FileResponse(path, media_type="image/png", headers={"Cache-Control": "private"})


def _log_refusal(request: Request, message: str, error: BookingRequestError) -> None:
    logger.info(message, extra={**log_context(request), "reason": type(error).__name__})


def _render_list(
    request: Request, error: BookingRequestError | None = None, status_code: int = 200
) -> Response:
    booking_requests = _booking_requests(request)
    venue_timezone = booking_requests.schedule.venue_timezone
    rows = [
        {
            "id": item.id,
            "date": _day_text(item.play_date),
            "slots": ", ".join(slot_text(slot) for slot in item.slots),
            "status": item.status.value,
            "css": item.status.name.lower(),
            "waiting": item.status is BookingRequestStatus.WAITING,
            "runs_at": _moment_text(item.run_at, venue_timezone),
            "ran_late_at": _moment_text(item.started_at, venue_timezone)
            if item.ran_late and item.started_at
            else None,
            # Every Slot is Waiting until the request runs, so only a run shows them one by one.
            "slot_results": [
                _slot_row(request, item.id, result, venue_timezone) for result in item.slot_results
            ]
            if item.status in (BookingRequestStatus.BOOKING, BookingRequestStatus.DONE)
            else [],
        }
        for item in booking_requests.in_schedule_order()
    ]
    return access_of(request).render(
        request,
        "booking_requests.html",
        {"rows": rows, "timezone": venue_timezone.key, "error": str(error) if error else None},
        status_code=status_code,
    )


def _render_form(
    request: Request,
    *,
    editing: BookingRequest | None,
    date_text: str,
    slot_texts: Sequence[str],
    error: BookingRequestError | None = None,
) -> Response:
    booking_requests = _booking_requests(request)
    action = (
        request.url_for("update_booking_request", request_id=editing.id).path
        if editing
        else path_for(request, "create_booking_request")
    )
    return access_of(request).render(
        request,
        "booking_request_form.html",
        {
            "editing": editing,
            "action": action,
            "date_label": _day_text(editing.play_date) if editing else None,
            "date_value": date_text,
            "min_date": booking_requests.today().isoformat(),
            "slots": [
                {"value": text, "checked": text in slot_texts}
                for text in (slot_text(slot) for slot in booking_requests.slots)
            ],
            "error": str(error) if error else None,
            "needs_profile": isinstance(error, ProfileMissing),
        },
        status_code=422 if error else 200,
    )


def _slot_row(
    request: Request, request_id: int, result: SlotResult, venue_timezone: ZoneInfo
) -> dict[str, str | None]:
    return {
        "screenshot": request.url_for(
            "slot_screenshot", request_id=request_id, slot=slot_text(result.slot)
        ).path
        if result.screenshot
        else None,
        "slot": slot_text(result.slot),
        "status": result.status.value,
        "css": result.status.name.lower(),
        "reason": result.reason,
        "tried_at": _moment_text(result.attempted_at, venue_timezone)
        if result.attempted_at
        else None,
    }


def _day_text(day: date) -> str:
    return f"{day:%a} {day.day} {day:%b %Y}"


def _moment_text(moment: datetime, venue_timezone: ZoneInfo) -> str:
    local = moment.astimezone(venue_timezone)
    return f"{_day_text(local.date())}, {local:%H:%M:%S}"
