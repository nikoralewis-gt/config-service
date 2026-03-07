"""FastAPI application entry point."""

from fastapi import FastAPI
from contextlib import asynccontextmanager
from api.config import get_settings
from api.database import Database
from migrations.migrations import run_migrations
from api.routes import applications, configurations
import logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager.
    
    Handles startup and shutdown events for the FastAPI application.
    """
    settings = get_settings()
    
    # Configure logging
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    logger = logging.getLogger(__name__)
    logger.info("Starting Config Service API")
    
    # Initialize database
    db = Database(settings.database_path)
    logger.info(f"Database initialized at {settings.database_path}")
    
    # Run migrations
    run_migrations(db)
    logger.info("Database migrations completed")
    
    # Store database in app state
    app.state.db = db
    
    yield
    
    # Cleanup (if needed)
    logger.info("Shutting down Config Service API")


app = FastAPI(
    title="Config Service API",
    description="REST API for managing applications and their configuration settings",
    version="1.0.0",
    lifespan=lifespan
)


# Include routers
app.include_router(
    applications.router,
    prefix="/api/v1",
    tags=["applications"]
)
app.include_router(
    configurations.router,
    prefix="/api/v1",
    tags=["configurations"]
)


@app.get("/health")
async def health_check():
    """Health check endpoint.
    
    Returns:
        Status indicating the service is healthy.
    """
    return {"status": "healthy"}


@app.get("/")
async def root():
    """Root endpoint.
    
    Returns:
        Welcome message with links to documentation.
    """
    return {
        "message": "Config Service API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }
