"""
Pydantic schemas for request/response validation and database models.

This module defines the data models used for API request validation,
response serialization, and database record validation using Pydantic with ULID support.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator
from pydantic_extra_types.ulid import ULID


class ApplicationBase(BaseModel):
    """Base schema for application data."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        pattern=r"^[a-zA-Z0-9_\-]+$",
        description="Application name (alphanumeric, underscore, hyphen only)",
        examples=["web-app", "mobile_app", "api-service"],
    )

    description: str | None = Field(
        None,
        max_length=1000,
        description="Human-readable description of the application",
        examples=["Main web application", "Mobile app for iOS and Android"],
    )


class ApplicationCreate(ApplicationBase):
    """Schema for creating a new application."""

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: str) -> str:
        """Validate that name is not just whitespace."""
        if not v or not v.strip():
            raise ValueError("Application name cannot be empty or whitespace")
        return v.strip()

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str | None) -> str | None:
        """Validate and clean description."""
        if v is not None:
            v = v.strip()
            if not v:  # Empty string after strip
                return None
        return v


class ApplicationResponse(ApplicationBase):
    """Schema for application response data."""

    id: ULID = Field(
        ...,
        description="Unique identifier for the application",
    )

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("id")
    def serialize_ulid(self, value: ULID) -> str:
        """Serialize ULID to string for JSON response."""
        return str(value)


class ConfigurationUpdate(BaseModel):
    """Schema for updating application configuration."""

    config: dict[str, Any] = Field(
        ...,
        description="Configuration data as key-value pairs",
        examples=[
            {
                "api_endpoint": "https://api.example.com",
                "timeout": 30,
                "features": {"dark_mode": True, "notifications": False},
            }
        ],
    )

    @field_validator("config")
    @classmethod
    def validate_config_not_empty(cls, v: dict[str, Any]) -> dict[str, Any]:
        """Validate that config is not empty."""
        if not v:
            raise ValueError("Configuration cannot be empty")
        return v

    @field_validator("config")
    @classmethod
    def validate_config_size(cls, v: dict[str, Any]) -> dict[str, Any]:
        """Validate config size (prevent extremely large payloads)."""
        import json

        if len(json.dumps(v)) > 1024 * 1024:  # 1MB limit
            raise ValueError("Configuration payload too large (max 1MB)")
        return v


class ConfigurationResponse(BaseModel):
    """Schema for configuration response data."""

    application_id: ULID = Field(
        ...,
        description="ID of the application this configuration belongs to",
    )

    config: dict[str, Any] = Field(
        ...,
        description="Configuration data as key-value pairs",
    )

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("application_id")
    def serialize_application_id(self, value: ULID) -> str:
        """Serialize application_id ULID to string for JSON response."""
        return str(value)


class ErrorResponse(BaseModel):
    """Schema for error responses."""

    detail: str = Field(
        ...,
        description="Error message describing what went wrong",
        examples=["Application not found", "Invalid configuration data"],
    )


class HealthResponse(BaseModel):
    """Schema for health check response."""

    status: str = Field(
        ...,
        description="Service health status",
        examples=["healthy"],
    )

    version: str = Field(
        ...,
        description="Application version",
        examples=["0.1.0"],
    )


# Database Models
# ===============


class ApplicationDB(BaseModel):
    """Database model for Application records."""

    id: str = Field(..., description="ULID as string")
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=1000)

    model_config = ConfigDict(from_attributes=True)

    @field_validator("id")
    @classmethod
    def validate_ulid_format(cls, v: str) -> str:
        """Validate ULID format."""
        if len(v) != 26:
            raise ValueError("ULID must be exactly 26 characters")
        # Basic ULID character validation (Base32 encoding)
        allowed_chars = set("0123456789ABCDEFGHJKMNPQRSTVWXYZ")
        if not all(c in allowed_chars for c in v.upper()):
            raise ValueError("ULID contains invalid characters")
        return v.upper()


class ConfigurationDB(BaseModel):
    """Database model for Configuration records."""

    application_id: str = Field(..., description="ULID as string")
    config: dict[str, Any] = Field(..., description="JSON configuration data")

    model_config = ConfigDict(from_attributes=True)

    @field_validator("application_id")
    @classmethod
    def validate_ulid_format(cls, v: str) -> str:
        """Validate ULID format."""
        if len(v) != 26:
            raise ValueError("ULID must be exactly 26 characters")
        # Basic ULID character validation (Base32 encoding)
        allowed_chars = set("0123456789ABCDEFGHJKMNPQRSTVWXYZ")
        if not all(c in allowed_chars for c in v.upper()):
            raise ValueError("ULID contains invalid characters")
        return v.upper()

    @field_validator("config")
    @classmethod
    def validate_config_structure(cls, v: dict[str, Any]) -> dict[str, Any]:
        """Validate configuration structure."""
        if not isinstance(v, dict):
            raise ValueError("Configuration must be a valid JSON object")
        return v


class MigrationDB(BaseModel):
    """Database model for Migration tracking records."""

    version: str = Field(..., min_length=1, max_length=255)
    applied_at: datetime = Field(default_factory=datetime.now)

    model_config = ConfigDict(from_attributes=True)

    @field_validator("version")
    @classmethod
    def validate_version_format(cls, v: str) -> str:
        """Validate migration version format."""
        if not v.strip():
            raise ValueError("Migration version cannot be empty")
        return v.strip()
