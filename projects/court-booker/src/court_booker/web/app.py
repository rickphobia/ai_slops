"""Builds the FastAPI app from validated Settings and the adapters it uses."""

from fastapi import Depends, FastAPI, Request
from fastapi.responses import RedirectResponse
from starlette.responses import Response

from court_booker.auth.login import LoginFailures, OperatorLogin
from court_booker.auth.session_cookies import CsrfTokens, SessionSigner
from court_booker.clock import Clock
from court_booker.config import Settings
from court_booker.profile.profile import ProfileStore
from court_booker.web import home_page, login_pages, profile_page
from court_booker.web.access import Access, LoginRequired, check_csrf, path_for, require_operator


def create_app(
    settings: Settings,
    *,
    login_failures: LoginFailures,
    profile_store: ProfileStore,
    clock: Clock,
) -> FastAPI:
    # root_path makes routes match both behind nginx (/ai-projects/court-booker/healthz) and
    # directly (/healthz), and makes generated links carry the prefix.
    app = FastAPI(
        title="court-booker",
        root_path=settings.root_path,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
        # Every POST, on any page, must carry this browser's CSRF token.
        dependencies=[Depends(check_csrf)],
    )
    app.state.access = Access(
        login=OperatorLogin(
            password_hash=settings.operator_password_hash,
            failures=login_failures,
            clock=clock,
            max_failures=settings.login_max_failures,
            lockout=settings.login_lockout,
        ),
        sessions=SessionSigner(
            secret=settings.session_secret,
            password_hash=str(settings.operator_password_hash),
            lifetime=settings.session_lifetime,
        ),
        csrf=CsrfTokens(secret=settings.session_secret),
        clock=clock,
        secure_cookies=settings.secure_cookies,
        cookie_path=settings.root_path or "/",
    )

    app.state.profile_store = profile_store

    @app.exception_handler(LoginRequired)
    def send_to_login(request: Request, _: LoginRequired) -> Response:
        return RedirectResponse(path_for(request, "login"), status_code=303)

    @app.get("/healthz")
    def healthz() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(login_pages.router)
    # Everything else needs the Operator; new pages go on routers included this way.
    app.include_router(home_page.router, dependencies=[Depends(require_operator)])
    app.include_router(profile_page.router, dependencies=[Depends(require_operator)])
    return app
