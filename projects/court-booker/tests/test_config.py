import pytest

from court_booker.config import ConfigError, Settings, load_settings


def test_defaults_apply_when_nothing_is_set() -> None:
    assert load_settings({}) == Settings(
        log_level="INFO",
        host="127.0.0.1",
        port=8000,
        root_path="/ai-projects/court-booker",
    )


def test_reads_every_setting_from_the_environment() -> None:
    settings = load_settings(
        {
            "COURT_BOOKER_LOG_LEVEL": "debug",
            "COURT_BOOKER_HOST": "0.0.0.0",
            "COURT_BOOKER_PORT": "9000",
            "COURT_BOOKER_ROOT_PATH": "/elsewhere/",
        }
    )

    assert settings == Settings(
        log_level="DEBUG", host="0.0.0.0", port=9000, root_path="/elsewhere"
    )


@pytest.mark.parametrize(
    ("variable", "value"),
    [
        ("COURT_BOOKER_LOG_LEVEL", "LOUD"),
        ("COURT_BOOKER_PORT", "eighty"),
        ("COURT_BOOKER_PORT", "0"),
        ("COURT_BOOKER_PORT", "70000"),
        ("COURT_BOOKER_HOST", "  "),
        ("COURT_BOOKER_ROOT_PATH", "no-leading-slash"),
    ],
)
def test_a_bad_value_fails_naming_the_variable(variable: str, value: str) -> None:
    with pytest.raises(ConfigError, match=variable):
        load_settings({variable: value})
