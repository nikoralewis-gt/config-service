"""Tests for application API routes."""

import pytest
from httpx import AsyncClient, ASGITransport
from api.main import app


@pytest.mark.asyncio
async def test_create_application():
    """Test creating a new application."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/applications",
            json={"name": "Test App", "description": "Test description"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test App"
        assert data["description"] == "Test description"
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data
        assert data["configuration_ids"] == []


@pytest.mark.asyncio
async def test_create_application_without_description():
    """Test creating an application without description."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/applications",
            json={"name": "Minimal App"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Minimal App"
        assert data["description"] is None


@pytest.mark.asyncio
async def test_create_application_duplicate_name():
    """Test creating an application with duplicate name."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create first application
        await client.post(
            "/api/v1/applications",
            json={"name": "Duplicate App"}
        )
        
        # Try to create duplicate
        response = await client.post(
            "/api/v1/applications",
            json={"name": "Duplicate App"}
        )
        
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_create_application_invalid_data():
    """Test creating an application with invalid data."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Empty name
        response = await client.post(
            "/api/v1/applications",
            json={"name": ""}
        )
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_applications():
    """Test listing all applications."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create some applications
        await client.post("/api/v1/applications", json={"name": "App 1"})
        await client.post("/api/v1/applications", json={"name": "App 2"})
        
        # List applications
        response = await client.get("/api/v1/applications")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2


@pytest.mark.asyncio
async def test_get_application():
    """Test getting a single application."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create application
        create_response = await client.post(
            "/api/v1/applications",
            json={"name": "Get Test App"}
        )
        app_id = create_response.json()["id"]
        
        # Get application
        response = await client.get(f"/api/v1/applications/{app_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == app_id
        assert data["name"] == "Get Test App"


@pytest.mark.asyncio
async def test_get_application_not_found():
    """Test getting a non-existent application."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/applications/01HQWXYZ1234567890ABCDEFGH")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]


@pytest.mark.asyncio
async def test_update_application():
    """Test updating an application."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create application
        create_response = await client.post(
            "/api/v1/applications",
            json={"name": "Original Name", "description": "Original"}
        )
        app_id = create_response.json()["id"]
        
        # Update application
        response = await client.put(
            f"/api/v1/applications/{app_id}",
            json={"name": "Updated Name", "description": "Updated"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == app_id
        assert data["name"] == "Updated Name"
        assert data["description"] == "Updated"


@pytest.mark.asyncio
async def test_update_application_not_found():
    """Test updating a non-existent application."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.put(
            "/api/v1/applications/01HQWXYZ1234567890ABCDEFGH",
            json={"name": "Updated"}
        )
        
        assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_application_duplicate_name():
    """Test updating an application with a name that already exists."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create two applications
        await client.post("/api/v1/applications", json={"name": "App A"})
        create_response = await client.post("/api/v1/applications", json={"name": "App B"})
        app_b_id = create_response.json()["id"]
        
        # Try to update App B to have App A's name
        response = await client.put(
            f"/api/v1/applications/{app_b_id}",
            json={"name": "App A"}
        )
        
        assert response.status_code == 409


@pytest.mark.asyncio
async def test_delete_application():
    """Test deleting an application."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create application
        create_response = await client.post(
            "/api/v1/applications",
            json={"name": "To Delete"}
        )
        app_id = create_response.json()["id"]
        
        # Delete application
        response = await client.delete(f"/api/v1/applications/{app_id}")
        
        assert response.status_code == 204
        
        # Verify it's deleted
        get_response = await client.get(f"/api/v1/applications/{app_id}")
        assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_delete_application_not_found():
    """Test deleting a non-existent application."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.delete("/api/v1/applications/01HQWXYZ1234567890ABCDEFGH")
        
        assert response.status_code == 404


@pytest.mark.asyncio
async def test_application_with_configurations():
    """Test that application includes configuration IDs."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create application
        app_response = await client.post(
            "/api/v1/applications",
            json={"name": "App with Configs"}
        )
        app_id = app_response.json()["id"]
        
        # Create configuration for this application
        await client.post(
            "/api/v1/configurations",
            json={
                "application_id": app_id,
                "name": "Config 1",
                "settings": {"key": "value"}
            }
        )
        
        # Get application
        response = await client.get(f"/api/v1/applications/{app_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["configuration_ids"]) == 1
