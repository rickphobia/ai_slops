"""The login page and logout: the only pages a logged-out visitor can use."""

import logging

from fastapi import APIRouter, Form, Request
from fastapi.responses import RedirectResponse
from starlette.responses import Response

from court_booker.auth.login import LockedOut, LoggedIn, WrongPassword
from court_booker.web.access import access_of, log_context, path_for

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/login", name="login")
def login_page(request: Request) -> Response:
    access = access_of(request)
    if access.is_logged_in(request):
        return RedirectResponse(path_for(request, "home"), status_code=303)
    return access.render(request, "login.html", {"error": None})


@router.post("/login", name="login_submit")
def login_submit(request: Request, password: str = Form("")) -> Response:
    access = access_of(request)
    result = access.login.attempt(password)
    match result:
        case LoggedIn():
            logger.info("operator logged in", extra=log_context(request))
            response: Response = RedirectResponse(path_for(request, "home"), status_code=303)
            access.start_session(response)
            return response
        case WrongPassword():
            logger.warning("login failed: wrong password", extra=log_context(request))
            return access.render(
                request, "login.html", {"error": "Wrong password."}, status_code=401
            )
        case LockedOut(minutes_left=minutes_left):
            logger.warning(
                "login refused: locked out after too many wrong passwords",
                extra={**log_context(request), "minutes_left": minutes_left},
            )
            unit = "minute" if minutes_left == 1 else "minutes"
            error = f"Too many wrong passwords. Try again in {minutes_left} {unit}."
            return access.render(request, "login.html", {"error": error}, status_code=429)


@router.post("/logout", name="logout")
def logout(request: Request) -> Response:
    logger.info("operator logged out", extra=log_context(request))
    response = RedirectResponse(path_for(request, "login"), status_code=303)
    access_of(request).end_session(response)
    return response
