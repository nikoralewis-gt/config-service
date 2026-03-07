"""Application API routes."""

from fastapi import APIRouter, HTTPException, Request, status
from api.models import Application, ApplicationCreate, ApplicationUpdate
from pydantic_extra_types.ulid import ULID
from typing import List
import sqlite3
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/applications", response_model=Application, status_code=status.HTTP_201_CREATED)
async def create_application(app_data: ApplicationCreate, request: Request):
    """Create a new application.
    
    Args:
        app_data: Application data to create.
        request: FastAPI request object.
        
    Returns:
        Created application.
        
    Raises:
        HTTPException: 409 if application name already exists.
    """
    db = request.app.state.db
    
    with db.get_connection() as conn:
        # Check for duplicate name
        existing = conn.execute(
            "SELECT id FROM applications WHERE name = ?",
            (app_data.name,)
        ).fetchone()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Application with name '{app_data.name}' already exists"
            )
        
        # Generate ULID and timestamps
        app_id = str(ULID())
        now = datetime.utcnow()
        
        # Insert application
        try:
            conn.execute(
                """
                INSERT INTO applications (id, name, description, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (app_id, app_data.name, app_data.description, now, now)
            )
        except sqlite3.IntegrityError as e:
            logger.error(f"Database integrity error: {e}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Application with this name already exists"
            )
        
        # Fetch and return created application
        row = conn.execute(
            "SELECT * FROM applications WHERE id = ?",
            (app_id,)
        ).fetchone()
        
        return Application(
            id=ULID.from_str(row["id"]),
            name=row["name"],
            description=row["description"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            configuration_ids=[]
        )


@router.get("/applications", response_model=List[Application])
async def list_applications(request: Request):
    """List all applications.
    
    Args:
        request: FastAPI request object.
        
    Returns:
        List of all applications.
    """
    db = request.app.state.db
    
    with db.get_connection() as conn:
        rows = conn.execute("SELECT * FROM applications ORDER BY name").fetchall()
        
        applications = []
        for row in rows:
            # Get configuration IDs for this application
            config_rows = conn.execute(
                "SELECT id FROM configurations WHERE application_id = ?",
                (row["id"],)
            ).fetchall()
            
            config_ids = [ULID.from_str(c["id"]) for c in config_rows]
            
            applications.append(Application(
                id=ULID.from_str(row["id"]),
                name=row["name"],
                description=row["description"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                configuration_ids=config_ids
            ))
        
        return applications


@router.get("/applications/{id}", response_model=Application)
async def get_application(id: str, request: Request):
    """Get a single application by ID.
    
    Args:
        id: Application ID (ULID).
        request: FastAPI request object.
        
    Returns:
        Application with the specified ID.
        
    Raises:
        HTTPException: 404 if application not found.
    """
    db = request.app.state.db
    
    with db.get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM applications WHERE id = ?",
            (id,)
        ).fetchone()
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Application with id '{id}' not found"
            )
        
        # Get configuration IDs for this application
        config_rows = conn.execute(
            "SELECT id FROM configurations WHERE application_id = ?",
            (id,)
        ).fetchall()
        
        config_ids = [ULID.from_str(c["id"]) for c in config_rows]
        
        return Application(
            id=ULID.from_str(row["id"]),
            name=row["name"],
            description=row["description"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            configuration_ids=config_ids
        )


@router.put("/applications/{id}", response_model=Application)
async def update_application(id: str, app_data: ApplicationUpdate, request: Request):
    """Update an existing application.
    
    Args:
        id: Application ID (ULID).
        app_data: Updated application data.
        request: FastAPI request object.
        
    Returns:
        Updated application.
        
    Raises:
        HTTPException: 404 if application not found, 409 if name conflict.
    """
    db = request.app.state.db
    
    with db.get_connection() as conn:
        # Check if application exists
        existing = conn.execute(
            "SELECT id FROM applications WHERE id = ?",
            (id,)
        ).fetchone()
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Application with id '{id}' not found"
            )
        
        # Check for name conflict with other applications
        name_conflict = conn.execute(
            "SELECT id FROM applications WHERE name = ? AND id != ?",
            (app_data.name, id)
        ).fetchone()
        
        if name_conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Application with name '{app_data.name}' already exists"
            )
        
        # Update application
        now = datetime.utcnow()
        try:
            conn.execute(
                """
                UPDATE applications 
                SET name = ?, description = ?, updated_at = ?
                WHERE id = ?
                """,
                (app_data.name, app_data.description, now, id)
            )
        except sqlite3.IntegrityError as e:
            logger.error(f"Database integrity error: {e}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Application with this name already exists"
            )
        
        # Fetch and return updated application
        row = conn.execute(
            "SELECT * FROM applications WHERE id = ?",
            (id,)
        ).fetchone()
        
        # Get configuration IDs
        config_rows = conn.execute(
            "SELECT id FROM configurations WHERE application_id = ?",
            (id,)
        ).fetchall()
        
        config_ids = [ULID.from_str(c["id"]) for c in config_rows]
        
        return Application(
            id=ULID.from_str(row["id"]),
            name=row["name"],
            description=row["description"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            configuration_ids=config_ids
        )


@router.delete("/applications/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(id: str, request: Request):
    """Delete an application.
    
    Args:
        id: Application ID (ULID).
        request: FastAPI request object.
        
    Raises:
        HTTPException: 404 if application not found.
    """
    db = request.app.state.db
    
    with db.get_connection() as conn:
        # Check if application exists
        existing = conn.execute(
            "SELECT id FROM applications WHERE id = ?",
            (id,)
        ).fetchone()
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Application with id '{id}' not found"
            )
        
        # Delete application (configurations will be cascade deleted)
        conn.execute("DELETE FROM applications WHERE id = ?", (id,))
