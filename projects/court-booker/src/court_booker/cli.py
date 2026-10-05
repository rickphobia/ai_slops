"""Command-line entrypoint: loads settings, sets up logging and runs a subcommand."""

import argparse
import getpass
import logging
import os
import sys
from datetime import date, datetime, time
from typing import TextIO

import uvicorn

from court_booker.adapters.picktime_browser.picktime_site import PicktimeBrowserSite
from court_booker.adapters.sqlite.database import DatabaseError, SqliteDatabase
from court_booker.adapters.sqlite.login_failures import SqliteLoginFailures
from court_booker.adapters.sqlite.profile_store import ProfileUnreadable, SqliteProfileStore
from court_booker.auth.passwords import hash_password
from court_booker.clock import SystemClock
from court_booker.config import ConfigError, Settings, load_settings
from court_booker.court_booking_site import CourtBookingSite, ReadyToBook
from court_booker.json_logging import configure_logging
from court_booker.profile.profile import ProfileStore
from court_booker.web.app import create_app

logger = logging.getLogger(__name__)


def serve(settings: Settings) -> int:
    database = SqliteDatabase(settings.database_path)
    try:
        database.migrate()
    except DatabaseError as error:
        logger.error("database unusable: %s", error)
        return 2
    clock = SystemClock()
    app = create_app(
        settings,
        login_failures=SqliteLoginFailures(database),
        profile_store=SqliteProfileStore(database, settings.profile_key, clock),
        clock=clock,
    )
    logger.info(
        "starting web server",
        extra={"host": settings.host, "port": settings.port, "root_path": settings.root_path},
    )
    # log_config=None keeps uvicorn's loggers on our JSON handler instead of its own format.
    uvicorn.run(app, host=settings.host, port=settings.port, log_config=None)
    return 0


def dry_run(
    day: date, slot: time, profile_store: ProfileStore, site: CourtBookingSite, stdout: TextIO
) -> int:
    """Fill the live booking form for `slot` on `day` with the stored Profile; never click Book."""
    try:
        profile = profile_store.load()
    except ProfileUnreadable as error:
        print(f"Can't read the stored Profile: {error}", file=stdout)
        return 1
    if profile is None:
        print("No Profile saved yet; save one on the Profile page first.", file=stdout)
        return 1
    attempt = site.book(day, slot, profile, dry_run=True)
    print(f"Outcome: {attempt.outcome}", file=stdout)
    print(f"Screenshot: {attempt.screenshot or 'none'}", file=stdout)
    print(f"Took: {attempt.duration.total_seconds():.1f}s", file=stdout)
    return 0 if isinstance(attempt.outcome, ReadyToBook) else 1


def run_dry_run(settings: Settings, day: date, slot: time) -> int:
    database = SqliteDatabase(settings.database_path)
    try:
        database.migrate()
    except DatabaseError as error:
        logger.error("database unusable: %s", error)
        return 2
    clock = SystemClock()
    site = PicktimeBrowserSite(
        page_url=settings.picktime_url,
        court_name=settings.court_name,
        timezone=settings.venue_timezone,
        page_timeout=settings.picktime_page_timeout,
        screenshot_dir=settings.screenshot_dir,
        clock=clock,
    )
    profile_store = SqliteProfileStore(database, settings.profile_key, clock)
    return dry_run(day, slot, profile_store, site, sys.stdout)


def _iso_date(value: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise argparse.ArgumentTypeError(
            f"expected a date like 2026-10-08, got {value!r}"
        ) from None


def _slot_time(value: str) -> time:
    try:
        return datetime.strptime(value, "%H:%M").time()
    except ValueError:
        raise argparse.ArgumentTypeError(f"expected a Slot like 20:00, got {value!r}") from None


def print_password_hash(stdin: TextIO, stdout: TextIO, stderr: TextIO) -> int:
    """Ask for the Operator password and print its hash for COURT_BOOKER_OPERATOR_PASSWORD_HASH.

    At a terminal the password is asked twice without echo; piped in, the first line is read.
    """
    if stdin.isatty():
        password = getpass.getpass("Operator password: ")
        if getpass.getpass("Same password again: ") != password:
            print("The passwords don't match; nothing printed.", file=stderr)
            return 1
    else:
        password = stdin.readline().rstrip("\r\n")
    if not password:
        print("The password must not be empty.", file=stderr)
        return 1
    print(hash_password(password), file=stdout)
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="court-booker")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("serve", help="run the website")
    commands.add_parser(
        "hash-password", help="print the hash of the Operator password for the env file"
    )
    dry_run_command = commands.add_parser(
        "dry-run", help="fill the live Picktime form with the stored Profile and stop before Book"
    )
    dry_run_command.add_argument("--date", required=True, type=_iso_date, help="like 2026-10-08")
    dry_run_command.add_argument("--slot", required=True, type=_slot_time, help="like 20:00")
    args = parser.parse_args(argv)

    # It makes the value the settings need, so it must run before they are checked.
    if args.command == "hash-password":
        return print_password_hash(sys.stdin, sys.stdout, sys.stderr)

    # Log the config error as JSON too; the configured level isn't known until it loads.
    configure_logging("INFO")
    try:
        settings = load_settings(os.environ)
    except ConfigError as error:
        logger.error("invalid configuration: %s", error)
        return 2
    configure_logging(settings.log_level)
    if args.command == "dry-run":
        return run_dry_run(settings, args.date, args.slot)
    return serve(settings)


if __name__ == "__main__":
    sys.exit(main())
