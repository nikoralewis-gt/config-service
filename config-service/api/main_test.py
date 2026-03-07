"""Tests for main FastAPI application."""

import pytest
from httpx import AsyncClient, ASGITransport
from api.main import app


@pytest.mark.asyncio
async def test_health_check():
    """Test health check endpoint."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}


@pytest.mark.asyncio
async def test_root_endpoint():
    """Test root endpoint."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Config Service API"
        assert data["version"] == "1.0.0"
        assert "docs" in data
        assert "health" in data


@pytest.mark.asyncio
async def test_openapi_docs_available():
    """Test that OpenAPI documentation is available."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/docs")
        
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_openapi_json_available():
    """Test that OpenAPI JSON schema is available."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/openapi.json")
        
        assert response.status_code == 200
        data = response.json()
        assert data["info"]["title"] == "Config Service API"
        assert data["info"]["version"] == "1.0.0"


@pytest.mark.asyncio
async def test_app_has_database_state():
    """Test that app state includes database after startup."""
    # The lifespan context manager should initialize the database
    assert hasattr(app.state, "db")
