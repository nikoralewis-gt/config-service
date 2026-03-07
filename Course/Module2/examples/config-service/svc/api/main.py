"""
Config Service API

A centralized HTTP API service for managing application configurations.
"""

import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI

from .db_connection import db_pool
from .endpoints import router as api_router
from .migrations import get_migration_manager
from .settings import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting up Config Service API")
    db_pool.initialize()

    # Run database migrations
    migration_manager = await get_migration_manager(db_pool)
    await migration_manager.run_migrations()

    yield

    # Shutdown
    logger.info("Shutting down Config Service API")
    db_pool.close()


# Create FastAPI application
svc = FastAPI(
    title="Config Service API",
    description="Centralized configuration management service",
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Include API routes
svc.include_router(api_router, prefix="/api/v1", tags=["Configuration Management"])


@svc.get("/health")
async def health_check() -> dict[str, Any]:
    """
    Health check endpoint.

    Returns:
        Dict containing service status and basic information.
    """
    return {
        "status": "ok",
        "service": "config-service",
        "version": settings.app_version,
    }


@svc.get("/")
async def root() -> dict[str, str]:
    """
    Root endpoint with basic service information.

    Returns:
        Dict containing welcome message and documentation links.
    """
    return {
        "message": "Config Service API",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting Config Service API on {settings.host}:{settings.port}")

    uvicorn.run(
        "main:svc",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
