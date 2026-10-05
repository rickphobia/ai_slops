import io
import json

import pytest

from court_booker.auth.passwords import parse_password_hash
from court_booker.cli import main, print_password_hash
from tests.support import required_env


class TerminalInput(io.StringIO):
    def isatty(self) -> bool:
        return True


def test_a_bad_setting_stops_startup_with_a_message_naming_it(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    for name, value in required_env(COURT_BOOKER_PORT="eighty").items():
        monkeypatch.setenv(name, value)

    assert main(["serve"]) == 2

    record = json.loads(capsys.readouterr().out)
    assert record["level"] == "ERROR"
    assert "COURT_BOOKER_PORT" in record["message"]


def test_hash_password_runs_without_any_settings(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.delenv("COURT_BOOKER_OPERATOR_PASSWORD_HASH", raising=False)
    monkeypatch.setattr("sys.stdin", io.StringIO("piped password\n"))

    assert main(["hash-password"]) == 0

    printed = capsys.readouterr().out.strip()
    assert parse_password_hash(printed).matches("piped password")


def test_hash_password_at_a_terminal_asks_twice_without_echo(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    answers = iter(["typed password", "typed password"])
    monkeypatch.setattr("getpass.getpass", lambda prompt: next(answers))
    stdout, stderr = io.StringIO(), io.StringIO()

    assert print_password_hash(TerminalInput(), stdout, stderr) == 0

    assert parse_password_hash(stdout.getvalue()).matches("typed password")
    assert "typed password" not in stdout.getvalue()


def test_hash_password_refuses_two_different_passwords(monkeypatch: pytest.MonkeyPatch) -> None:
    answers = iter(["first", "second"])
    monkeypatch.setattr("getpass.getpass", lambda prompt: next(answers))
    stdout, stderr = io.StringIO(), io.StringIO()

    assert print_password_hash(TerminalInput(), stdout, stderr) == 1

    assert stdout.getvalue() == ""
    assert "don't match" in stderr.getvalue()


def test_hash_password_refuses_an_empty_password() -> None:
    stdout, stderr = io.StringIO(), io.StringIO()

    assert print_password_hash(io.StringIO("\n"), stdout, stderr) == 1

    assert stdout.getvalue() == ""
