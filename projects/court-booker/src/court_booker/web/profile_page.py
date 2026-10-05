"""The Profile page: shows the saved Profile and saves edits. Profile values are never logged."""

import logging

from fastapi import APIRouter, Form, Request
from fastapi.responses import RedirectResponse
from starlette.responses import Response

from court_booker.profile.profile import InvalidProfile, ProfileStore, parse_profile
from court_booker.web.access import access_of, log_context, path_for

logger = logging.getLogger(__name__)

router = APIRouter()


def _store(request: Request) -> ProfileStore:
    store: ProfileStore = request.app.state.profile_store
    return store


@router.get("/profile", name="profile")
def profile_page(request: Request, saved: bool = False) -> Response:
    profile = _store(request).load()
    values = vars(profile) if profile else {}
    return access_of(request).render(
        request, "profile.html", {"values": values, "errors": {}, "saved": saved}
    )


@router.post("/profile", name="profile_submit")
def profile_submit(
    request: Request,
    first_name: str = Form(""),
    email: str = Form(""),
    unit_number: str = Form(""),
    mobile: str = Form(""),
) -> Response:
    try:
        profile = parse_profile(first_name, email, unit_number, mobile)
    except InvalidProfile as error:
        # Field names only: the values are friend B's details.
        logger.info(
            "profile not saved: invalid fields",
            extra={**log_context(request), "fields": sorted(error.errors)},
        )
        values = {
            "first_name": first_name,
            "email": email,
            "unit_number": unit_number,
            "mobile": mobile,
        }
        return access_of(request).render(
            request,
            "profile.html",
            {"values": values, "errors": error.errors, "saved": False},
            status_code=422,
        )
    _store(request).save(profile)
    logger.info("profile saved", extra=log_context(request))
    return RedirectResponse(f"{path_for(request, 'profile')}?saved=1", status_code=303)
