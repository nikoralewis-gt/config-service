"""Tests for application configuration."""

import os
import pytest
from api.config import Settings, get_settings


def test_settings_defaults():
    """Test that settings have correct default values."""
    settings = Settings()
    
    assert settings.database_path == "data/config.db"
    assert settings.log_level == "INFO"
    assert settings.api_host == "0.0.0.0"
    assert settings.api_port == 8000


def test_settings_from_env(monkeypatch):
    """Test that settings can be loaded from environment variables."""
    monkeypatch.setenv("DATABASE_PATH", "test.db")
    monkeypatch.setenv("LOG_LEVEL", "DEBUG")
    monkeypatch.setenv("API_HOST", "127.0.0.1")
    monkeypatch.setenv("API_PORT", "9000")
    
    settings = Settings()
    
    assert settings.database_path == "test.db"
    assert settings.log_level == "DEBUG"
    assert settings.api_host == "127.0.0.1"
    assert settings.api_port == 9000


def test_settings_case_insensitive(monkeypatch):
    """Test that environment variable names are case insensitive."""
    monkeypatch.setenv("database_path", "lowercase.db")
    monkeypatch.setenv("LOG_LEVEL", "WARNING")
    
    settings = Settings()
    
    assert settings.database_path == "lowercase.db"
    assert settings.log_level == "WARNING"


def test_get_settings():
    """Test get_settings function returns Settings instance."""
    settings = get_settings()
    
    assert isinstance(settings, Settings)
    assert hasattr(settings, "database_path")
    assert hasattr(settings, "log_level")
    assert hasattr(settings, "api_host")
    assert hasattr(settings, "api_port")


def test_settings_type_validation(monkeypatch):
    """Test that settings validate types correctly."""
    monkeypatch.setenv("API_PORT", "8080")
    
    settings = Settings()
    
    # Should convert string to int
    assert isinstance(settings.api_port, int)
    assert settings.api_port == 8080


def test_settings_invalid_port(monkeypatch):
    """Test that invalid port raises validation error."""
    monkeypatch.setenv("API_PORT", "not_a_number")
    
    with pytest.raises(Exception):  # Pydantic validation error
        Settings()
