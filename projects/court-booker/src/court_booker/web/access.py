"""Who may see what: the session cookie, CSRF checks and rendering pages with a CSRF token."""

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from fastapi import HTTPException, Request
from fastapi.templating import Jinja2Templates
from starlette.responses import Response

from court_booker.auth.login import OperatorLogin
from court_booker.auth.session_cookies import CsrfTokens, SessionSigner
from court_booker.clock import Clock

logger = logging.getLogger(__name__)

SESSION_COOKIE = "court_booker_session"
CSRF_COOKIE = "court_booker_csrf"
CSRF_FIELD = "csrf_token"

_templates = Jinja2Templates(directory=Path(__file__).parent / "templates")


@dataclass(frozen=True)
class Access:
    login: OperatorLogin
    sessions: SessionSigner
    csrf: CsrfTokens
    clock: Clock
    secure_cookies: bool
    # Cookies stay under the app's path prefix, away from the other projects on the domain.
    cookie_path: str

    def is_logged_in(self, request: Request) -> bool:
        return self.sessions.is_valid(request.cookies.get(SESSION_COOKIE), self.clock.now())

    def start_session(self, response: Response) -> None:
        self._set_cookie(
            response,
            SESSION_COOKIE,
            self.sessions.issue(self.clock.now()),
            max_age=int(self.sessions.lifetime.total_seconds()),
        )

    def end_session(self, response: Response) -> None:
        response.delete_cookie(
            SESSION_COOKIE,
            path=self.cookie_path,
            secure=self.secure_cookies,
            httponly=True,
            samesite="strict",
        )

    def render(
        self, request: Request, template: str, context: dict[str, Any], status_code: int = 200
    ) -> Response:
        """Render a page, giving its forms a CSRF token tied to this browser's nonce cookie."""
        nonce = request.cookies.get(CSRF_COOKIE)
        new_nonce = None if nonce else self.csrf.new_nonce()
        token = self.csrf.token_for(nonce or new_nonce or "")
        response = _templates.TemplateResponse(
            request, template, {**context, "csrf_token": token}, status_code=status_code
        )
        if new_nonce:
            # A browser-session cookie: a new one comes with the next page after a restart.
            self._set_cookie(response, CSRF_COOKIE, new_nonce, max_age=None)
        return response

    def _set_cookie(self, response: Response, name: str, value: str, max_age: int | None) -> None:
        response.set_cookie(
            name,
            value,
            max_age=max_age,
            path=self.cookie_path,
            secure=self.secure_cookies,
            httponly=True,
            samesite="strict",
        )


class LoginRequired(Exception):
    """A logged-out visitor asked for a page that needs the Operator."""


def access_of(request: Request) -> Access:
    access: Access = request.app.state.access
    return access


def path_for(request: Request, route_name: str) -> str:
    """The route's path including the prefix, kept relative so it works behind nginx's https."""
    return request.url_for(route_name).path


async def check_csrf(request: Request) -> None:
    """Reject any POST whose form token doesn't match this browser's CSRF cookie."""
    if request.method != "POST":
        return
    # Starlette caches the parsed form, so the route's own Form() fields still read it.
    form = await request.form()
    token = form.get(CSRF_FIELD)
    if not access_of(request).csrf.is_valid(
        request.cookies.get(CSRF_COOKIE), token if isinstance(token, str) else None
    ):
        logger.warning(
            "rejected a form with a missing or bad CSRF token", extra=log_context(request)
        )
        raise HTTPException(status_code=403, detail="The form expired. Go back and try again.")


def require_operator(request: Request) -> None:
    if not access_of(request).is_logged_in(request):
        raise LoginRequired


def log_context(request: Request) -> dict[str, str]:
    return {"path": request.url.path, "client": request.client.host if request.client else ""}
