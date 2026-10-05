"""Command-line entrypoint: loads settings, sets up logging and runs a subcommand."""

import argparse
import logging
import os
import sys

import uvicorn

from court_booker.config import ConfigError, Settings, load_settings
from court_booker.json_logging import configure_logging
from court_booker.web.app import create_app

logger = logging.getLogger(__name__)


def serve(settings: Settings) -> None:
    logger.info(
        "starting web server",
        extra={"host": settings.host, "port": settings.port, "root_path": settings.root_path},
    )
    # log_config=None keeps uvicorn's loggers on our JSON handler instead of its own format.
    uvicorn.run(create_app(settings), host=settings.host, port=settings.port, log_config=None)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="court-booker")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("serve", help="run the website")
    args = parser.parse_args(argv)

    # Log the config error as JSON too; the configured level isn't known until it loads.
    configure_logging("INFO")
    try:
        settings = load_settings(os.environ)
    except ConfigError as error:
        logger.error("invalid configuration: %s", error)
        return 2
    configure_logging(settings.log_level)

    if args.command == "serve":
        serve(settings)
    return 0


if __name__ == "__main__":
    sys.exit(main())
