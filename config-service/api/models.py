"""Pydantic models for API request/response validation."""

from pydantic import BaseModel, Field
from pydantic_extra_types.ulid import ULID
from datetime import datetime
from typing import Optional, List


class ApplicationBase(BaseModel):
    """Base application model with common fields."""
    
    name: str = Field(..., min_length=1, max_length=256, description="Application name")
    description: Optional[str] = Field(None, max_length=1024, description="Application description")


class ApplicationCreate(ApplicationBase):
    """Model for creating a new application."""
    pass


class ApplicationUpdate(ApplicationBase):
    """Model for updating an existing application."""
    pass


class Application(ApplicationBase):
    """Complete application model with all fields."""
    
    id: ULID = Field(..., description="Unique application identifier (ULID)")
    created_at: datetime = Field(..., description="Timestamp when application was created")
    updated_at: datetime = Field(..., description="Timestamp when application was last updated")
    configuration_ids: List[ULID] = Field(default_factory=list, description="List of configuration IDs for this application")
    
    model_config = {"from_attributes": True}


class ConfigurationBase(BaseModel):
    """Base configuration model with common fields."""
    
    application_id: ULID = Field(..., description="ID of the application this configuration belongs to")
    name: str = Field(..., min_length=1, max_length=256, description="Configuration name")
    description: Optional[str] = Field(None, max_length=1024, description="Configuration description")
    settings: dict[str, str] = Field(default_factory=dict, description="Configuration settings as name/value pairs")


class ConfigurationCreate(ConfigurationBase):
    """Model for creating a new configuration."""
    pass


class ConfigurationUpdate(BaseModel):
    """Model for updating an existing configuration.
    
    All fields are optional to allow partial updates.
    """
    
    name: Optional[str] = Field(None, min_length=1, max_length=256, description="Configuration name")
    description: Optional[str] = Field(None, max_length=1024, description="Configuration description")
    settings: Optional[dict[str, str]] = Field(None, description="Configuration settings as name/value pairs")


class Configuration(ConfigurationBase):
    """Complete configuration model with all fields."""
    
    id: ULID = Field(..., description="Unique configuration identifier (ULID)")
    created_at: datetime = Field(..., description="Timestamp when configuration was created")
    updated_at: datetime = Field(..., description="Timestamp when configuration was last updated")
    
    model_config = {"from_attributes": True}
