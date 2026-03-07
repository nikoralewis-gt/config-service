"""
Configuration settings using Pydantic Settings.

This module defines the application configuration using Pydantic's BaseSettings
which automatically loads values from environment variables.
"""

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Uses Pydantic Settings to automatically load and validate configuration
    from environment variables with type checking and validation.
    """

    # Logging configuration
    log_level: str = Field(
        default="INFO",
        description="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)",
        examples=["INFO", "DEBUG"],
    )

    # Application metadata
    app_version: str = Field(
        default="0.1.0", description="Application version string", examples=["0.1.0", "1.2.3"]
    )

    # Server configuration
    host: str = Field(
        default="0.0.0.0",
        description="Host address to bind the server to",
        examples=["0.0.0.0", "127.0.0.1"],
    )

    port: int = Field(
        default=8000,
        description="Port number to bind the server to",
        examples=[8000, 3000],
        ge=1,
        le=65535,
    )

    # Development configuration
    debug: bool = Field(
        default=False, description="Enable debug mode with auto-reload", examples=[True, False]
    )

    # Database configuration
    database_url: str = Field(
        default="postgresql://config_user:config_pass@localhost:5432/config_db",
        description="Database connection URL",
        examples=[
            "postgresql://user:pass@localhost:5432/dbname",
            "postgresql://config_user:config_pass@db:5432/config_db",
        ],
    )

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }


# Global settings instance
settings = Settings()
