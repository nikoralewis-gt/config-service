"""Application configuration management."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration from environment variables."""
    
    database_path: str = "data/config.db"
    log_level: str = "INFO"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


def get_settings() -> Settings:
    """Get application settings singleton.
    
    Returns:
        Settings instance loaded from environment variables.
    """
    return Settings()
