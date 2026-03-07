"""Tests for Pydantic models."""

import pytest
from pydantic import ValidationError
from pydantic_extra_types.ulid import ULID
from datetime import datetime
from api.models import (
    ApplicationBase,
    ApplicationCreate,
    ApplicationUpdate,
    Application,
    ConfigurationBase,
    ConfigurationCreate,
    ConfigurationUpdate,
    Configuration,
)


def test_application_base_valid():
    """Test ApplicationBase with valid data."""
    app = ApplicationBase(name="Test App", description="Test description")
    
    assert app.name == "Test App"
    assert app.description == "Test description"


def test_application_base_no_description():
    """Test ApplicationBase without description (optional field)."""
    app = ApplicationBase(name="Test App")
    
    assert app.name == "Test App"
    assert app.description is None


def test_application_base_name_too_long():
    """Test ApplicationBase with name exceeding max length."""
    with pytest.raises(ValidationError):
        ApplicationBase(name="x" * 257)


def test_application_base_name_empty():
    """Test ApplicationBase with empty name."""
    with pytest.raises(ValidationError):
        ApplicationBase(name="")


def test_application_base_description_too_long():
    """Test ApplicationBase with description exceeding max length."""
    with pytest.raises(ValidationError):
        ApplicationBase(name="Test", description="x" * 1025)


def test_application_create():
    """Test ApplicationCreate model."""
    app = ApplicationCreate(name="New App", description="New description")
    
    assert app.name == "New App"
    assert app.description == "New description"


def test_application_update():
    """Test ApplicationUpdate model."""
    app = ApplicationUpdate(name="Updated App")
    
    assert app.name == "Updated App"


def test_application_full():
    """Test full Application model."""
    ulid = ULID()
    now = datetime.utcnow()
    
    app = Application(
        id=ulid,
        name="Test App",
        description="Test",
        created_at=now,
        updated_at=now,
        configuration_ids=[]
    )
    
    assert app.id == ulid
    assert app.name == "Test App"
    assert app.created_at == now
    assert app.configuration_ids == []


def test_application_with_configuration_ids():
    """Test Application with configuration IDs."""
    app_id = ULID()
    config_id1 = ULID()
    config_id2 = ULID()
    now = datetime.utcnow()
    
    app = Application(
        id=app_id,
        name="Test App",
        created_at=now,
        updated_at=now,
        configuration_ids=[config_id1, config_id2]
    )
    
    assert len(app.configuration_ids) == 2
    assert config_id1 in app.configuration_ids


def test_configuration_base_valid():
    """Test ConfigurationBase with valid data."""
    app_id = ULID()
    
    config = ConfigurationBase(
        application_id=app_id,
        name="Config1",
        description="Test config",
        settings={"key1": "value1", "key2": "value2"}
    )
    
    assert config.application_id == app_id
    assert config.name == "Config1"
    assert config.settings == {"key1": "value1", "key2": "value2"}


def test_configuration_base_empty_settings():
    """Test ConfigurationBase with empty settings."""
    app_id = ULID()
    
    config = ConfigurationBase(
        application_id=app_id,
        name="Config1"
    )
    
    assert config.settings == {}


def test_configuration_base_name_validation():
    """Test ConfigurationBase name validation."""
    app_id = ULID()
    
    # Empty name should fail
    with pytest.raises(ValidationError):
        ConfigurationBase(application_id=app_id, name="")
    
    # Too long name should fail
    with pytest.raises(ValidationError):
        ConfigurationBase(application_id=app_id, name="x" * 257)


def test_configuration_create():
    """Test ConfigurationCreate model."""
    app_id = ULID()
    
    config = ConfigurationCreate(
        application_id=app_id,
        name="New Config",
        settings={"env": "production"}
    )
    
    assert config.application_id == app_id
    assert config.name == "New Config"
    assert config.settings["env"] == "production"


def test_configuration_update_partial():
    """Test ConfigurationUpdate with partial data."""
    # Only name
    config = ConfigurationUpdate(name="Updated Name")
    assert config.name == "Updated Name"
    assert config.description is None
    assert config.settings is None
    
    # Only settings
    config = ConfigurationUpdate(settings={"new": "value"})
    assert config.name is None
    assert config.settings == {"new": "value"}


def test_configuration_update_all_fields():
    """Test ConfigurationUpdate with all fields."""
    config = ConfigurationUpdate(
        name="Updated",
        description="Updated desc",
        settings={"key": "value"}
    )
    
    assert config.name == "Updated"
    assert config.description == "Updated desc"
    assert config.settings == {"key": "value"}


def test_configuration_full():
    """Test full Configuration model."""
    app_id = ULID()
    config_id = ULID()
    now = datetime.utcnow()
    
    config = Configuration(
        id=config_id,
        application_id=app_id,
        name="Test Config",
        description="Test",
        settings={"key": "value"},
        created_at=now,
        updated_at=now
    )
    
    assert config.id == config_id
    assert config.application_id == app_id
    assert config.name == "Test Config"
    assert config.settings == {"key": "value"}


def test_configuration_settings_dict_validation():
    """Test that settings must be a dictionary."""
    app_id = ULID()
    
    # Valid dict
    config = ConfigurationBase(
        application_id=app_id,
        name="Test",
        settings={"key": "value"}
    )
    assert isinstance(config.settings, dict)
    
    # Invalid type should fail
    with pytest.raises(ValidationError):
        ConfigurationBase(
            application_id=app_id,
            name="Test",
            settings="not a dict"
        )
