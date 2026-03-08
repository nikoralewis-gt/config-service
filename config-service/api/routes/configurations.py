"""Configuration API routes."""

from fastapi import APIRouter, HTTPException, Request, status, Query
from api.models import Configuration, ConfigurationCreate, ConfigurationUpdate
from typing import List, Optional
import sqlite3
import json
from datetime import datetime
import logging
from ulid import ULID

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/configurations", response_model=Configuration, status_code=status.HTTP_201_CREATED)
async def create_configuration(config_data: ConfigurationCreate, request: Request):
    """Create a new configuration.
    
    Args:
        config_data: Configuration data to create.
        request: FastAPI request object.
        
    Returns:
        Created configuration.
        
    Raises:
        HTTPException: 404 if application not found, 409 if name conflict.
    """
    db = request.app.state.db
    
    with db.get_connection() as conn:
        # Check if application exists
        app_exists = conn.execute(
            "SELECT id FROM applications WHERE id = ?",
            (str(config_data.application_id),)
        ).fetchone()
        
        if not app_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Application with id '{config_data.application_id}' not found"
            )
        
        # Check for duplicate name within the same application
        existing = conn.execute(
            "SELECT id FROM configurations WHERE application_id = ? AND name = ?",
            (str(config_data.application_id), config_data.name)
        ).fetchone()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Configuration with name '{config_data.name}' already exists for this application"
            )
        
        # Generate ULID and timestamps
        config_id = str(ULID())
        now = datetime.utcnow()
        settings_json = json.dumps(config_data.settings)
        
        # Insert configuration
        try:
            conn.execute(
                """
                INSERT INTO configurations (id, application_id, name, description, settings, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (config_id, str(config_data.application_id), config_data.name, 
                 config_data.description, settings_json, now, now)
            )
        except sqlite3.IntegrityError as e:
            logger.error(f"Database integrity error: {e}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Configuration with this name already exists for this application"
            )
        
        # Fetch and return created configuration
        row = conn.execute(
            "SELECT * FROM configurations WHERE id = ?",
            (config_id,)
        ).fetchone()
        
        return Configuration(
            id=row["id"],
            application_id=row["application_id"],
            name=row["name"],
            description=row["description"],
            settings=json.loads(row["settings"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )


@router.get("/configurations", response_model=List[Configuration])
async def list_configurations(
    request: Request,
    application_id: Optional[str] = Query(None, description="Filter by application ID")
):
    """List all configurations, optionally filtered by application_id.
    
    Args:
        request: FastAPI request object.
        application_id: Optional application ID to filter by.
        
    Returns:
        List of configurations.
    """
    db = request.app.state.db
    
    with db.get_connection() as conn:
        if application_id:
            rows = conn.execute(
                "SELECT * FROM configurations WHERE application_id = ? ORDER BY name",
                (application_id,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM configurations ORDER BY name"
            ).fetchall()
        
        configurations = []
        for row in rows:
            configurations.append(Configuration(
                id=row["id"],
                application_id=row["application_id"],
                name=row["name"],
                description=row["description"],
                settings=json.loads(row["settings"]),
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            ))
        
        return configurations


@router.get("/configurations/{id}", response_model=Configuration)
async def get_configuration(id: str, request: Request):
    """Get a single configuration by ID.
    
    Args:
        id: Configuration ID (ULID).
        request: FastAPI request object.
        
    Returns:
        Configuration with the specified ID.
        
    Raises:
        HTTPException: 404 if configuration not found.
    """
    db = request.app.state.db
    
    with db.get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM configurations WHERE id = ?",
            (id,)
        ).fetchone()
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Configuration with id '{id}' not found"
            )
        
        return Configuration(
            id=row["id"],
            application_id=row["application_id"],
            name=row["name"],
            description=row["description"],
            settings=json.loads(row["settings"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )


@router.put("/configurations/{id}", response_model=Configuration)
async def update_configuration(id: str, config_data: ConfigurationUpdate, request: Request):
    """Update an existing configuration.
    
    Args:
        id: Configuration ID (ULID).
        config_data: Updated configuration data.
        request: FastAPI request object.
        
    Returns:
        Updated configuration.
        
    Raises:
        HTTPException: 404 if configuration not found, 409 if name conflict.
    """
    db = request.app.state.db
    
    with db.get_connection() as conn:
        # Check if configuration exists
        existing = conn.execute(
            "SELECT * FROM configurations WHERE id = ?",
            (id,)
        ).fetchone()
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Configuration with id '{id}' not found"
            )
        
        # Build update query dynamically based on provided fields
        update_fields = []
        update_values = []
        
        if config_data.name is not None:
            # Check for name conflict with other configurations in same application
            name_conflict = conn.execute(
                "SELECT id FROM configurations WHERE application_id = ? AND name = ? AND id != ?",
                (existing["application_id"], config_data.name, id)
            ).fetchone()
            
            if name_conflict:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Configuration with name '{config_data.name}' already exists for this application"
                )
            
            update_fields.append("name = ?")
            update_values.append(config_data.name)
        
        if config_data.description is not None:
            update_fields.append("description = ?")
            update_values.append(config_data.description)
        
        if config_data.settings is not None:
            update_fields.append("settings = ?")
            update_values.append(json.dumps(config_data.settings))
        
        # Always update the updated_at timestamp
        now = datetime.utcnow()
        update_fields.append("updated_at = ?")
        update_values.append(now)
        
        # Add id to values for WHERE clause
        update_values.append(id)
        
        # Execute update
        if update_fields:
            query = f"UPDATE configurations SET {', '.join(update_fields)} WHERE id = ?"
            try:
                conn.execute(query, update_values)
            except sqlite3.IntegrityError as e:
                logger.error(f"Database integrity error: {e}")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Configuration with this name already exists for this application"
                )
        
        # Fetch and return updated configuration
        row = conn.execute(
            "SELECT * FROM configurations WHERE id = ?",
            (id,)
        ).fetchone()
        
        return Configuration(
            id=row["id"],
            application_id=row["application_id"],
            name=row["name"],
            description=row["description"],
            settings=json.loads(row["settings"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )


@router.delete("/configurations/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_configuration(id: str, request: Request):
    """Delete a configuration.
    
    Args:
        id: Configuration ID (ULID).
        request: FastAPI request object.
        
    Raises:
        HTTPException: 404 if configuration not found.
    """
    db = request.app.state.db
    
    with db.get_connection() as conn:
        # Check if configuration exists
        existing = conn.execute(
            "SELECT id FROM configurations WHERE id = ?",
            (id,)
        ).fetchone()
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Configuration with id '{id}' not found"
            )
        
        # Delete configuration
        conn.execute("DELETE FROM configurations WHERE id = ?", (id,))
