import io
import json
from datetime import date, time, timedelta
from pathlib import Path

import pytest

from court_booker.auth.passwords import parse_password_hash
from court_booker.cli import dry_run, main, print_password_hash
from court_booker.court_booking_site import NotOpen, ReadyToBook, SlotAttempt, SlotOutcome
from court_booker.profile.profile import Profile
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


def test_a_missing_profile_key_stops_startup(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    for name, value in required_env().items():
        monkeypatch.setenv(name, value)
    monkeypatch.delenv("COURT_BOOKER_PROFILE_KEY")

    assert main(["serve"]) == 2

    record = json.loads(capsys.readouterr().out)
    assert "COURT_BOOKER_PROFILE_KEY is required" in record["message"]


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


class StoredProfile:
    def __init__(self, profile: Profile | None) -> None:
        self.profile = profile

    def load(self) -> Profile | None:
        return self.profile

    def save(self, profile: Profile) -> None:
        self.profile = profile


class RecordingSite:
    def __init__(self, outcome: SlotOutcome) -> None:
        self.outcome = outcome
        self.calls: list[tuple[date, time, Profile, bool]] = []

    def book(self, day: date, slot: time, profile: Profile, *, dry_run: bool) -> SlotAttempt:
        self.calls.append((day, slot, profile, dry_run))
        return SlotAttempt(self.outcome, Path("shots/20261008-2000.png"), timedelta(seconds=4))


PROFILE = Profile(
    first_name="Mei Ling", email="mei@example.com", unit_number="A-12-3", mobile="0123456789"
)


def test_dry_run_fills_the_form_with_the_stored_profile_and_prints_the_screenshot() -> None:
    site = RecordingSite(ReadyToBook())
    stdout = io.StringIO()

    assert (
        dry_run(date(2026, 10, 8), time(20, 0), StoredProfile(PROFILE), site, stdout, io.StringIO())
        == 0
    )

    assert site.calls == [(date(2026, 10, 8), time(20, 0), PROFILE, True)]
    assert "ReadyToBook" in stdout.getvalue()
    assert "shots/20261008-2000.png" in stdout.getvalue()


def test_dry_run_reports_any_other_outcome_as_a_failure() -> None:
    stdout = io.StringIO()

    exit_code = dry_run(
        date(2026, 10, 8),
        time(20, 0),
        StoredProfile(PROFILE),
        RecordingSite(NotOpen()),
        stdout,
        io.StringIO(),
    )

    assert exit_code == 1
    assert "NotOpen" in stdout.getvalue()


def test_dry_run_without_a_profile_stops_before_opening_the_page() -> None:
    site = RecordingSite(ReadyToBook())
    stdout, stderr = io.StringIO(), io.StringIO()

    assert dry_run(date(2026, 10, 8), time(20, 0), StoredProfile(None), site, stdout, stderr) == 1

    assert site.calls == []
    assert "No Profile saved yet" in stderr.getvalue()


def test_dry_run_command_reads_the_profile_from_the_database(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    database = tmp_path / "court-booker.sqlite3"
    for name, value in required_env(COURT_BOOKER_DATABASE_PATH=str(database)).items():
        monkeypatch.setenv(name, value)

    assert main(["dry-run", "--date", "2026-10-08", "--slot", "20:00"]) == 1

    assert "No Profile saved yet" in capsys.readouterr().err


@pytest.mark.parametrize(
    "arguments",
    [["--date", "8 Oct", "--slot", "20:00"], ["--date", "2026-10-08", "--slot", "8pm"]],
)
def test_dry_run_command_refuses_a_malformed_date_or_slot(arguments: list[str]) -> None:
    with pytest.raises(SystemExit) as exit_info:
        main(["dry-run", *arguments])

    assert exit_info.value.code == 2
