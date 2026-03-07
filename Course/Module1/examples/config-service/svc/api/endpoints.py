"""
API endpoints for configuration management.

This module defines FastAPI routes using the repository pattern
"""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError

from api.db_connection import DatabasePool, get_db_pool
from api.repository import ApplicationRepository, ConfigurationRepository
from api.schemas import (
    ApplicationCreate,
    ApplicationResponse,
    ConfigurationResponse,
    ConfigurationUpdate,
    ErrorResponse,
)

router = APIRouter()
pool = Depends(get_db_pool)


def get_application_repo(db_pool: DatabasePool = pool) -> ApplicationRepository:
    """Dependency to get application repository."""
    return ApplicationRepository(db_pool)


def get_configuration_repo(db_pool: DatabasePool = pool) -> ConfigurationRepository:
    """Dependency to get configuration repository."""
    return ConfigurationRepository(db_pool)


# Type aliases for cleaner function signatures
AppRepo = Annotated[ApplicationRepository, Depends(get_application_repo)]
ConfigRepo = Annotated[ConfigurationRepository, Depends(get_configuration_repo)]


@router.post(
    "/applications",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input"},
        409: {"model": ErrorResponse, "description": "Application already exists"},
    },
)
async def create_application(application: ApplicationCreate, repo: AppRepo) -> ApplicationResponse:
    """Create a new application."""
    try:
        # Check if application already exists
        existing = await repo.get_by_name(application.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Application with name '{application.name}' already exists",
            )

        result = await repo.create(application.name, application.description)
        return ApplicationResponse(**result)

    except HTTPException:
        raise
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Validation error: {str(e)}",
        ) from e
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}",
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create application: {str(e)}",
        ) from e


@router.get(
    "/applications",
    response_model=list[ApplicationResponse],
    responses={
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def list_applications(repo: AppRepo) -> list[ApplicationResponse]:
    """List all applications."""
    try:
        applications = await repo.list_all()
        return [ApplicationResponse(**app) for app in applications]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list applications: {str(e)}",
        ) from e


@router.get(
    "/applications/{application_id}",
    response_model=ApplicationResponse,
    responses={
        404: {"model": ErrorResponse, "description": "Application not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_application(application_id: str, repo: AppRepo) -> ApplicationResponse:
    """Get application by ID."""
    try:
        application = await repo.get_by_id(application_id)
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Application with ID {application_id} not found",
            )

        return ApplicationResponse(**application)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get application: {str(e)}",
        ) from e


@router.put(
    "/applications/{application_id}/config",
    response_model=ConfigurationResponse,
    responses={
        404: {"model": ErrorResponse, "description": "Application not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def update_configuration(
    application_id: str,
    config_update: ConfigurationUpdate,
    app_repo: AppRepo,
    config_repo: ConfigRepo,
) -> ConfigurationResponse:
    """Update configuration for an application."""
    try:
        # Verify application exists
        application = await app_repo.get_by_id(application_id)
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Application with ID {application_id} not found",
            )

        result = await config_repo.upsert(application_id, config_update.config)
        return ConfigurationResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update configuration: {str(e)}",
        ) from e


@router.get(
    "/applications/{application_id}/config",
    response_model=ConfigurationResponse,
    responses={
        404: {"model": ErrorResponse, "description": "Application or configuration not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_configuration(application_id: str, config_repo: ConfigRepo) -> ConfigurationResponse:
    """Get configuration for an application."""
    try:
        configuration = await config_repo.get_by_application_id(application_id)
        if not configuration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Configuration for application {application_id} not found",
            )

        return ConfigurationResponse(**configuration)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get configuration: {str(e)}",
        ) from e


@router.get(
    "/config/{application_name}",
    response_model=dict[str, Any],
    responses={
        404: {"model": ErrorResponse, "description": "Application or configuration not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_configuration_by_name(
    application_name: str, config_repo: ConfigRepo
) -> dict[str, Any]:
    """Get configuration for an application by name (main API endpoint for applications)."""
    try:
        configuration = await config_repo.get_by_application_name(application_name)
        if not configuration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Configuration for application '{application_name}' not found",
            )

        return configuration["config"]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get configuration: {str(e)}",
        ) from e


@router.delete(
    "/applications/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {"model": ErrorResponse, "description": "Application not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def delete_application(application_id: str, repo: AppRepo) -> None:
    """Delete an application and its configuration."""
    try:
        deleted = await repo.delete(application_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Application with ID {application_id} not found",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete application: {str(e)}",
        ) from e
