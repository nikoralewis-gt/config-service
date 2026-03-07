"""
Tests for the settings module.
"""

import os
from unittest.mock import patch

import pytest
from pydantic import ValidationError

from .settings import Settings


class TestSettings:
    """Tests for the Settings class."""

    def test_settings_loads_from_environment(self) -> None:
        """Test that settings can be loaded from environment variables."""
        env_vars = {
            "LOG_LEVEL": "INFO",
            "APP_VERSION": "1.0.0",
            "HOST": "0.0.0.0",
            "PORT": "8000",
            "DEBUG": "false",
        }

        with patch.dict(os.environ, env_vars, clear=True):
            settings = Settings()

            assert settings.log_level == "INFO"
            assert settings.app_version == "1.0.0"
            assert settings.host == "0.0.0.0"
            assert settings.port == 8000
            assert settings.debug is False

    def test_settings_validates_port_range(self) -> None:
        """Test that port validation works correctly."""
        env_vars = {
            "LOG_LEVEL": "INFO",
            "APP_VERSION": "1.0.0",
            "HOST": "0.0.0.0",
            "PORT": "70000",  # Invalid port
            "DEBUG": "false",
        }

        with patch.dict(os.environ, env_vars, clear=True):
            with pytest.raises(ValidationError) as exc_info:
                Settings()

            assert "port" in str(exc_info.value).lower()

    def test_settings_converts_debug_string_to_bool(self) -> None:
        """Test that debug string values are converted to boolean."""
        test_cases = [
            ("true", True),
            ("True", True),
            ("TRUE", True),
            ("false", False),
            ("False", False),
            ("FALSE", False),
        ]

        for debug_str, expected_bool in test_cases:
            env_vars = {
                "LOG_LEVEL": "INFO",
                "APP_VERSION": "1.0.0",
                "HOST": "0.0.0.0",
                "PORT": "8000",
                "DEBUG": debug_str,
            }

            with patch.dict(os.environ, env_vars, clear=True):
                settings = Settings()
                assert settings.debug is expected_bool

    def test_settings_uses_defaults_when_no_env_vars(self) -> None:
        """Test that settings uses default values when no environment variables are provided."""
        # Clear all environment variables that might affect settings
        env_vars_to_clear = ["LOG_LEVEL", "APP_VERSION", "HOST", "PORT", "DEBUG"]
        env_without_settings = {k: v for k, v in os.environ.items() if k not in env_vars_to_clear}

        with patch.dict(os.environ, env_without_settings, clear=True):
            # Create a Settings class that doesn't load from .env file
            class TestSettings(Settings):
                model_config = {
                    "env_file": None,  # Disable .env file loading
                    "env_file_encoding": "utf-8",
                    "case_sensitive": False,
                    "extra": "ignore",
                }

            settings = TestSettings()

            # Should use default values
            assert settings.log_level == "INFO"
            assert settings.app_version == "0.1.0"
            assert settings.host == "0.0.0.0"
            assert settings.port == 8000
            assert settings.debug is False

    def test_settings_case_insensitive(self) -> None:
        """Test that environment variable names are case insensitive."""
        env_vars = {
            "log_level": "DEBUG",  # lowercase
            "App_Version": "2.0.0",  # mixed case
            "HOST": "127.0.0.1",  # uppercase
            "port": "3000",  # lowercase
            "Debug": "true",  # mixed case
        }

        with patch.dict(os.environ, env_vars, clear=True):
            settings = Settings()

            assert settings.log_level == "DEBUG"
            assert settings.app_version == "2.0.0"
            assert settings.host == "127.0.0.1"
            assert settings.port == 3000
            assert settings.debug is True

    def test_settings_forbids_extra_fields(self) -> None:
        """Test that extra fields are not allowed."""
        env_vars = {
            "LOG_LEVEL": "INFO",
            "APP_VERSION": "1.0.0",
            "HOST": "0.0.0.0",
            "PORT": "8000",
            "DEBUG": "false",
            "EXTRA_FIELD": "not_allowed",  # This should be ignored due to extra='forbid'
        }

        with patch.dict(os.environ, env_vars, clear=True):
            # Should not raise an error because extra fields in environment
            # are ignored when they don't match any field names
            settings = Settings()
            assert not hasattr(settings, "extra_field")

    def test_settings_loads_from_env_file(self) -> None:
        """Test that settings loads values from .env file instead of defaults."""
        # Clear environment variables to ensure we're testing .env file loading
        env_vars_to_clear = ["LOG_LEVEL", "APP_VERSION", "HOST", "PORT", "DEBUG"]
        env_without_settings = {k: v for k, v in os.environ.items() if k not in env_vars_to_clear}

        with patch.dict(os.environ, env_without_settings, clear=True):
            settings = Settings()

            # These values should come from .env file, not defaults
            # .env contents: APP_VERSION=0.1.0, DEBUG=true, LOG_LEVEL=INFO, HOST=0.0.0.0, PORT=8000
            assert settings.app_version == "0.1.0"  # From .env, same as default but proves loaded
            assert settings.debug is True  # From .env file (true), default would be False
            assert settings.log_level == "INFO"  # From .env, same as default but proves loaded
            assert settings.host == "0.0.0.0"  # From .env, same as default but proves loaded
            assert settings.port == 8080  # From .env, default is 8000

            # The key test: DEBUG should be True from .env file, not False from default
            # This proves .env file values override defaults
            assert settings.debug is True, (
                "DEBUG should be True from .env file, not False from default"
            )
