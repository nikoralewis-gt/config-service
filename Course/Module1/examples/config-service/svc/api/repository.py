"""
Database repository layer with direct SQL queries.

This module replaces SQLAlchemy ORM models with repository pattern
using direct PostgreSQL queries through psycopg2 with ULID support.
"""

import json
from typing import Any

from pydantic import ValidationError
from ulid import ULID as generate_ulid

from api.db_connection import DatabasePool, json_serializer
from api.schemas import ApplicationDB, ConfigurationDB


class ApplicationRepository:
    """Repository for Application operations."""

    def __init__(self, db_pool: DatabasePool):
        self.db = db_pool

    async def create(self, name: str, description: str | None = None) -> dict[str, Any]:
        """Create a new application with default configuration."""
        app_id = generate_ulid()
        app_id_str = str(app_id)

        query = """
            INSERT INTO applications (id, name, description)
            VALUES (%s, %s, %s)
            RETURNING id, name, description
        """

        result = await self.db.execute_mutation(
            query, (app_id_str, name, description), return_id=True
        )

        if not result:
            raise RuntimeError("Failed to create application")

        # Create default configuration
        default_config = {"name": "value"}
        config_json = json.dumps(default_config, default=json_serializer)

        config_query = """
            INSERT INTO configurations (application_id, config)
            VALUES (%s, %s)
        """

        config_result = await self.db.execute_mutation(config_query, (app_id_str, config_json))

        if config_result is None:
            raise RuntimeError("Failed to create default configuration for application")

        # Validate the database result using Pydantic
        try:
            validated_app = ApplicationDB(**result)
            return validated_app.model_dump()
        except ValidationError as e:
            raise RuntimeError(f"Database returned invalid application data: {e}") from e

    async def get_by_id(self, app_id: str) -> dict[str, Any] | None:
        """Get application by ID."""
        query = "SELECT id, name, description FROM applications WHERE id = %s"

        result = await self.db.execute_query(query, (app_id,), fetch_one=True, fetch_all=False)

        if not result:
            return None

        # Validate the database result using Pydantic
        try:
            validated_app = ApplicationDB(**result)  # type: ignore
            return validated_app.model_dump()
        except ValidationError as e:
            raise RuntimeError(f"Database returned invalid application data: {e}") from e

    async def get_by_name(self, name: str) -> dict[str, Any] | None:
        """Get application by name."""
        query = "SELECT id, name, description FROM applications WHERE name = %s"

        result = await self.db.execute_query(query, (name,), fetch_one=True, fetch_all=False)

        if not result:
            return None

        # Validate the database result using Pydantic
        try:
            validated_app = ApplicationDB(**result)  # type: ignore
            return validated_app.model_dump()
        except ValidationError as e:
            raise RuntimeError(f"Database returned invalid application data: {e}") from e

    async def list_all(self) -> list[dict[str, Any]]:
        """List all applications."""
        query = "SELECT id, name, description FROM applications ORDER BY name"

        results = await self.db.execute_query(query)

        if not results:
            return []

        # Validate each database result using Pydantic
        validated_apps = []
        for row in results:
            try:
                validated_app = ApplicationDB(**row)  # type: ignore
                validated_apps.append(validated_app.model_dump())
            except ValidationError as e:
                raise RuntimeError(f"Database returned invalid application data: {e}") from e

        return validated_apps

    async def update(
        self, app_id: str, name: str | None = None, description: str | None = None
    ) -> dict[str, Any] | None:
        """Update application."""
        updates = []
        params = []

        if name is not None:
            updates.append("name = %s")
            params.append(name)

        if description is not None:
            updates.append("description = %s")
            params.append(description)

        if not updates:
            return await self.get_by_id(app_id)

        params.append(app_id)

        query = f"""
            UPDATE applications
            SET {", ".join(updates)}
            WHERE id = %s
            RETURNING id, name, description
        """

        result = await self.db.execute_mutation(query, tuple(params), return_id=True)

        if not result:
            return None

        # Validate the database result using Pydantic
        try:
            validated_app = ApplicationDB(**result)
            return validated_app.model_dump()
        except ValidationError as e:
            raise RuntimeError(f"Database returned invalid application data: {e}") from e

    async def delete(self, app_id: str) -> bool:
        """Delete application and its configuration."""
        query = "DELETE FROM applications WHERE id = %s"

        rowcount = await self.db.execute_mutation(query, (app_id,))

        return rowcount is not None and rowcount > 0


class ConfigurationRepository:
    """Repository for Configuration operations."""

    def __init__(self, db_pool: DatabasePool):
        self.db = db_pool

    async def upsert(self, application_id: str, config: dict[str, Any]) -> dict[str, Any]:
        """Create or update configuration for an application."""
        # Validate input using Pydantic
        try:
            _ = ConfigurationDB(application_id=application_id, config=config)
        except ValidationError as e:
            raise ValueError(f"Invalid configuration data: {e}") from e

        config_json = json.dumps(config, default=json_serializer)

        query = """
            INSERT INTO configurations (application_id, config)
            VALUES (%s, %s)
            ON CONFLICT (application_id)
            DO UPDATE SET config = EXCLUDED.config
            RETURNING application_id, config
        """

        result = await self.db.execute_mutation(
            query, (application_id, config_json), return_id=True
        )

        if not result:
            raise RuntimeError("Failed to upsert configuration")

        # Validate the database result using Pydantic
        try:
            validated_config = ConfigurationDB(**result)
            return validated_config.model_dump()
        except ValidationError as e:
            raise RuntimeError(f"Database returned invalid configuration data: {e}") from e

    async def get_by_application_id(self, application_id: str) -> dict[str, Any] | None:
        """Get configuration by application ID."""
        query = """
            SELECT application_id, config
            FROM configurations
            WHERE application_id = %s
        """

        result = await self.db.execute_query(
            query, (application_id,), fetch_one=True, fetch_all=False
        )

        if not result:
            return None

        # Validate the database result using Pydantic
        try:
            validated_config = ConfigurationDB(**result)  # type: ignore
            return validated_config.model_dump()
        except ValidationError as e:
            raise RuntimeError(f"Database returned invalid configuration data: {e}") from e

    async def get_by_application_name(self, name: str) -> dict[str, Any] | None:
        """Get configuration by application name."""
        query = """
            SELECT c.application_id, c.config
            FROM configurations c
            JOIN applications a ON c.application_id = a.id
            WHERE a.name = %s
        """

        result = await self.db.execute_query(query, (name,), fetch_one=True, fetch_all=False)

        if not result:
            return None

        # Validate the database result using Pydantic
        try:
            validated_config = ConfigurationDB(**result)  # type: ignore
            return validated_config.model_dump()
        except ValidationError as e:
            raise RuntimeError(f"Database returned invalid configuration data: {e}") from e

    async def delete(self, application_id: str) -> bool:
        """Delete configuration for an application."""
        query = "DELETE FROM configurations WHERE application_id = %s"

        rowcount = await self.db.execute_mutation(query, (application_id,))

        return rowcount is not None and rowcount > 0
