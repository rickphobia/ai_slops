"""Builds the FastAPI app from validated Settings and the adapters it uses."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Protocol

from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse, PlainTextResponse, RedirectResponse
from starlette.responses import Response

from court_booker.auth.login import LoginFailures, OperatorLogin
from court_booker.auth.session_cookies import CsrfTokens, SessionSigner
from court_booker.booking_requests.booking_requests import (
    BookingRequestNotFound,
    BookingRequestRepository,
    BookingRequests,
)
from court_booker.booking_run.booking_run import BookingRun, SlotResultRecorder
from court_booker.clock import Clock, Sleeper
from court_booker.config import Settings
from court_booker.court_booking_site import CourtBookingSite
from court_booker.profile.profile import ProfileStore
from court_booker.random_source import RandomSource
from court_booker.scheduler.background import SchedulerLoop
from court_booker.scheduler.scheduler import RunQueue, Scheduler
from court_booker.web import booking_request_pages, login_pages, profile_page
from court_booker.web.access import Access, LoginRequired, check_csrf, path_for, require_operator


class BookingRequestStore(BookingRequestRepository, RunQueue, SlotResultRecorder, Protocol):
    """Everything the pages and the scheduler need from where Booking Requests are kept."""


def create_app(
    settings: Settings,
    *,
    login_failures: LoginFailures,
    profile_store: ProfileStore,
    booking_request_store: BookingRequestStore,
    court_booking_site: CourtBookingSite,
    clock: Clock,
    sleeper: Sleeper,
    random_source: RandomSource,
) -> FastAPI:
    scheduler = Scheduler(
        queue=booking_request_store,
        booking_run=BookingRun(
            recorder=booking_request_store,
            profiles=profile_store,
            site=court_booking_site,
            clock=clock,
            sleeper=sleeper,
            random=random_source,
            rules=settings.booking_run,
            schedule=settings.schedule,
        ),
        clock=clock,
        schedule=settings.schedule,
        retention=settings.retention,
        stale_after=settings.scheduler_stale_after,
    )

    @asynccontextmanager
    async def run_scheduler(_: FastAPI) -> AsyncIterator[None]:
        scheduler.recover_interrupted()
        loop = SchedulerLoop(scheduler, settings.scheduler_interval)
        loop.start()
        yield
        loop.stop()

    # root_path makes routes match both behind nginx (/ai-projects/court-booker/healthz) and
    # directly (/healthz), and makes generated links carry the prefix.
    app = FastAPI(
        title="court-booker",
        root_path=settings.root_path,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
        lifespan=run_scheduler,
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

    app.state.scheduler = scheduler
    app.state.screenshot_dir = settings.screenshot_dir
    app.state.profile_store = profile_store
    app.state.booking_requests = BookingRequests(
        repository=booking_request_store,
        profiles=profile_store,
        clock=clock,
        random=random_source,
        slots=settings.slots,
        schedule=settings.schedule,
    )

    @app.exception_handler(LoginRequired)
    def send_to_login(request: Request, _: LoginRequired) -> Response:
        return RedirectResponse(path_for(request, "login"), status_code=303)

    @app.exception_handler(BookingRequestNotFound)
    def not_found(_: Request, error: BookingRequestNotFound) -> Response:
        return PlainTextResponse(str(error), status_code=404)

    @app.get("/healthz")
    def healthz() -> Response:
        health = scheduler.health()
        age = health.last_tick_age
        return JSONResponse(
            {
                "status": "ok" if health.healthy else "failing",
                "database": "ok" if health.database_reachable else "unreachable",
                "last_tick_seconds_ago": round(age.total_seconds()) if age is not None else None,
            },
            status_code=200 if health.healthy else 503,
        )

    app.include_router(login_pages.router)
    # Everything else needs the Operator; new pages go on routers included this way.
    app.include_router(booking_request_pages.router, dependencies=[Depends(require_operator)])
    app.include_router(profile_page.router, dependencies=[Depends(require_operator)])
    return app
