"""
Tests for Pydantic model validation.
"""

import pytest
from pydantic import ValidationError

from api.schemas import ApplicationCreate, ApplicationDB, ConfigurationDB, ConfigurationUpdate


class TestAPIValidation:
    """Tests for API request/response validation."""

    def test_application_create_valid(self):
        """Test valid application creation."""
        app = ApplicationCreate(name="test-app", description="Test description")
        assert app.name == "test-app"
        assert app.description == "Test description"

    def test_application_create_name_validation(self):
        """Test application name validation."""
        # Test empty name - Pydantic's min_length will catch this first
        with pytest.raises(ValidationError, match="String should have at least 1 character"):
            ApplicationCreate(name="", description="Test description")

        # Test whitespace only name - pattern validation will catch this first
        with pytest.raises(ValidationError, match="String should match pattern"):
            ApplicationCreate(name="   ", description="Test description")

        # Test invalid characters
        with pytest.raises(ValidationError, match="String should match pattern"):
            ApplicationCreate(name="test app!", description="Test description")

    def test_application_create_description_cleaning(self):
        """Test description cleaning and validation."""
        # Test empty description becomes None
        app = ApplicationCreate(name="test-app", description="   ")
        assert app.description is None

        # Test description trimming
        app = ApplicationCreate(name="test-app", description="  Test description  ")
        assert app.description == "Test description"

    def test_configuration_update_validation(self):
        """Test configuration update validation."""
        # Valid config
        config = ConfigurationUpdate(config={"key": "value", "number": 42})
        assert config.config == {"key": "value", "number": 42}

        # Empty config should fail
        with pytest.raises(ValidationError, match="Configuration cannot be empty"):
            ConfigurationUpdate(config={})

    def test_configuration_update_size_limit(self):
        """Test configuration size limit."""
        # Create large config (over 1MB)
        large_config = {"key": "x" * (1024 * 1024 + 1)}

        with pytest.raises(ValidationError, match="Configuration payload too large"):
            ConfigurationUpdate(config=large_config)


class TestDatabaseValidation:
    """Tests for database model validation."""

    def test_application_db_valid(self):
        """Test valid application database model."""
        app = ApplicationDB(
            id="01FQCFTGXVJ3DGVPQZCRTYFWM1", name="test-app", description="Test description"
        )
        assert app.id == "01FQCFTGXVJ3DGVPQZCRTYFWM1"
        assert app.name == "test-app"

    def test_application_db_ulid_validation(self):
        """Test ULID validation in database model."""
        # Invalid ULID length
        with pytest.raises(ValidationError, match="ULID must be exactly 26 characters"):
            ApplicationDB(id="short", name="test-app", description="Test description")

        # Invalid ULID characters
        with pytest.raises(ValidationError, match="ULID contains invalid characters"):
            ApplicationDB(id="01FQCFTGXVJ3DGVPQZCRTYFWM!", name="test-app", description="Test")

    def test_configuration_db_valid(self):
        """Test valid configuration database model."""
        config = ConfigurationDB(
            application_id="01FQCFTGXVJ3DGVPQZCRTYFWM1", config={"key": "value"}
        )
        assert config.application_id == "01FQCFTGXVJ3DGVPQZCRTYFWM1"
        assert config.config == {"key": "value"}

    def test_configuration_db_structure_validation(self):
        """Test configuration structure validation."""
        # Valid dict
        config = ConfigurationDB(
            application_id="01FQCFTGXVJ3DGVPQZCRTYFWM1",
            config={"key": "value", "nested": {"inner": "value"}},
        )
        assert isinstance(config.config, dict)
