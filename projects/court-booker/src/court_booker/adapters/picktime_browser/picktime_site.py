"""Books one Slot through the public Picktime booking page in headless Chromium (decision 0002).

Each attempt starts a fresh browser and walks the page as a person would: pick the Court, the
date and the Slot, fill in the form, click Book and read what the page says. The selectors and
texts come from the live page as read on 2026-10-06; a Picktime redesign breaks them, and the
screenshot plus the logged step show where.
"""

import logging
import time as monotonic_time
from datetime import date, time, timedelta
from pathlib import Path

from playwright.sync_api import Browser, Page, ViewportSize, sync_playwright
from playwright.sync_api import Error as PlaywrightError

from court_booker.clock import Clock
from court_booker.court_booking_site import (
    Booked,
    NetworkError,
    NotOpen,
    ReadyToBook,
    Rejected,
    SlotAttempt,
    SlotOutcome,
    Taken,
)
from court_booker.profile.profile import Profile

logger = logging.getLogger(__name__)

# A common laptop screen; the page lays out its desktop view at this width.
_VIEWPORT: ViewportSize = {"width": 1366, "height": 768}
_CONFIRMED = "your booking has been confirmed"
# Picktime's wording for a Slot someone else got first (lower case, matched as a substring).
_TAKEN_PHRASES = ("no longer available", "not available", "already full")


class _Steps:
    """Logs each step as it starts and remembers it, so a failure can name where it happened."""

    def __init__(self, day: date, slot: time) -> None:
        self.current = "open page"
        self._fields = {"date": day.isoformat(), "slot": slot.strftime("%H:%M")}

    def start(self, step: str) -> None:
        self.current = step
        logger.info("picktime: %s", step, extra={**self._fields, "step": step})


class PicktimeBrowserSite:
    def __init__(
        self,
        *,
        page_url: str,
        court_name: str,
        timezone: str,
        page_timeout: timedelta,
        screenshot_dir: Path,
        clock: Clock,
    ) -> None:
        self.page_url = page_url
        self._court_name = court_name
        # The page shows Slot times in the browser's timezone, so run the browser in the venue's.
        self._timezone = timezone
        self._page_timeout_ms = page_timeout.total_seconds() * 1000
        self._screenshot_dir = screenshot_dir
        self._clock = clock

    def book(self, day: date, slot: time, profile: Profile, *, dry_run: bool) -> SlotAttempt:
        started = monotonic_time.monotonic()
        steps = _Steps(day, slot)
        screenshot: Path | None = None
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch()
                try:
                    page = self._new_page(browser)
                    try:
                        outcome = self._walk(page, steps, day, slot, profile, dry_run=dry_run)
                    except PlaywrightError as error:
                        outcome = _network_error(steps.current, error)
                    screenshot = self._screenshot(page, day, slot)
                finally:
                    browser.close()
        except PlaywrightError as error:
            # The browser itself failed to start or crashed: no page to capture.
            outcome = _network_error(steps.current, error)
        duration = timedelta(seconds=monotonic_time.monotonic() - started)
        logger.info(
            "picktime attempt finished: %s",
            type(outcome).__name__,
            extra={
                "date": day.isoformat(),
                "slot": slot.strftime("%H:%M"),
                "dry_run": dry_run,
                "outcome": type(outcome).__name__,
                # Picktime's own words, as-is: they explain venue rules we didn't know about.
                "picktime_message": outcome.message if isinstance(outcome, Rejected) else None,
                "duration_seconds": round(duration.total_seconds(), 2),
                "screenshot": str(screenshot) if screenshot else None,
            },
        )
        return SlotAttempt(outcome=outcome, screenshot=screenshot, duration=duration)

    def _new_page(self, browser: Browser) -> Page:
        context = browser.new_context(
            user_agent=_desktop_chrome_user_agent(browser.version),
            viewport=_VIEWPORT,
            timezone_id=self._timezone,
            locale="en-US",
        )
        context.set_default_timeout(self._page_timeout_ms)
        return context.new_page()

    def _walk(
        self, page: Page, steps: _Steps, day: date, slot: time, profile: Profile, *, dry_run: bool
    ) -> SlotOutcome:
        steps.start("open page")
        page.goto(self.page_url, wait_until="domcontentloaded")

        steps.start("pick court")
        page.locator(".resource-list li", has_text=self._court_name).first.click()

        steps.start("pick date")
        ymd = day.strftime("%Y%m%d")
        page.locator(".data-date-item").first.wait_for()
        date_item = page.locator(f'.data-date-item[data-date="{ymd}"]')
        if date_item.count() == 0 or "disable" in (date_item.get_attribute("class") or ""):
            return NotOpen()
        date_item.click()

        steps.start("pick slot")
        # Wait for this date's Slots (or its empty message), not those of the default date.
        page.locator(f'.booking-page-timings-btn[startdate^="{ymd}"], .no-slots').first.wait_for()
        if page.locator(f'.booking-page-timings-btn[startdate^="{ymd}"]').count() == 0:
            return NotOpen()
        slot_button = page.locator(f'.booking-page-timings-btn[startdate="{ymd}{slot:%H%M}"]')
        if slot_button.count() == 0:
            return Taken()
        slot_button.click()

        steps.start("fill form")
        for label, value in (
            ("First Name", profile.first_name),
            ("Email Id", profile.email),
            ("Unit Number", profile.unit_number),
            ("Mobile", profile.mobile),
        ):
            field = page.locator(".information-box .form-group").filter(
                has=page.locator("label", has_text=label)
            )
            field.locator("input").fill(value)
        book_button = page.locator(".booknow")
        if dry_run:
            # A trial click runs every check a real one does (visible, enabled, not covered by
            # the cookie banner or ad bar) without clicking, so dry-run proves Book is reachable.
            book_button.click(trial=True)
            return ReadyToBook()

        steps.start("submit")
        book_button.click()

        steps.start("read result")
        confirmation = page.locator(".booking-confirm-head h2")
        alert = page.locator(".sweet-alert.visible p")
        confirmation.or_(alert).first.wait_for()
        if confirmation.count() > 0:
            text = confirmation.inner_text().strip()
            return Booked() if _CONFIRMED in text.lower() else Rejected(text)
        text = alert.inner_text().strip()
        if any(phrase in text.lower() for phrase in _TAKEN_PHRASES):
            return Taken()
        return Rejected(text)

    def _screenshot(self, page: Page, day: date, slot: time) -> Path | None:
        taken_at = self._clock.now().strftime("%Y%m%dT%H%M%S%fZ")
        path = self._screenshot_dir / f"{day:%Y%m%d}-{slot:%H%M}-{taken_at}.png"
        try:
            self._screenshot_dir.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=path, full_page=True)
        except (PlaywrightError, OSError) as error:
            # A missing screenshot mustn't hide the booking outcome; the log says why it's missing.
            logger.warning("picktime screenshot failed: %s", error, extra={"path": str(path)})
            return None
        return path


def _network_error(step: str, error: PlaywrightError) -> NetworkError:
    detail = error.message.splitlines()[0] if error.message else type(error).__name__
    logger.warning("picktime step failed: %s: %s", step, detail, extra={"step": step})
    return NetworkError(step=step, detail=detail)


def _desktop_chrome_user_agent(browser_version: str) -> str:
    """The user agent desktop Chrome on Linux sends, instead of the headless one.

    Chrome reports only its major version; the rest is zeros.
    """
    major = browser_version.split(".")[0]
    return (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
        f"Chrome/{major}.0.0.0 Safari/537.36"
    )
