import json

import pytest

from court_booker.cli import main


def test_a_bad_setting_stops_startup_with_a_message_naming_it(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setenv("COURT_BOOKER_PORT", "eighty")

    assert main(["serve"]) == 2

    record = json.loads(capsys.readouterr().out)
    assert record["level"] == "ERROR"
    assert "COURT_BOOKER_PORT" in record["message"]
