"""Command-line entrypoint: loads settings, sets up logging and runs a subcommand."""

import argparse
import getpass
import logging
import os
import sys
from typing import TextIO

import uvicorn

from court_booker.adapters.sqlite.database import DatabaseError, SqliteDatabase
from court_booker.adapters.sqlite.login_failures import SqliteLoginFailures
from court_booker.auth.passwords import hash_password
from court_booker.clock import SystemClock
from court_booker.config import ConfigError, Settings, load_settings
from court_booker.json_logging import configure_logging
from court_booker.web.app import create_app

logger = logging.getLogger(__name__)


def serve(settings: Settings) -> int:
    database = SqliteDatabase(settings.database_path)
    try:
        database.migrate()
    except DatabaseError as error:
        logger.error("database unusable: %s", error)
        return 2
    app = create_app(settings, login_failures=SqliteLoginFailures(database), clock=SystemClock())
    logger.info(
        "starting web server",
        extra={"host": settings.host, "port": settings.port, "root_path": settings.root_path},
    )
    # log_config=None keeps uvicorn's loggers on our JSON handler instead of its own format.
    uvicorn.run(app, host=settings.host, port=settings.port, log_config=None)
    return 0


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
    return serve(settings)


if __name__ == "__main__":
    sys.exit(main())
