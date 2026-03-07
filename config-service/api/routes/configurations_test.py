"""Tests for configuration API routes."""

import pytest
from httpx import AsyncClient, ASGITransport
from api.main import app


@pytest.fixture
async def test_application():
    """Create a test application for configuration tests."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/applications",
            json={"name": "Config Test App"}
        )
        return response.json()["id"]


@pytest.mark.asyncio
async def test_create_configuration(test_application):
    """Test creating a new configuration."""
    app_id = await test_application
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/configurations",
            json={
                "application_id": app_id,
                "name": "Test Config",
                "description": "Test description",
                "settings": {"key1": "value1", "key2": "value2"}
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Config"
        assert data["description"] == "Test description"
        assert data["settings"] == {"key1": "value1", "key2": "value2"}
        assert "id" in data
        assert "created_at" in data


@pytest.mark.asyncio
async def test_create_configuration_minimal(test_application):
    """Test creating a configuration with minimal data."""
    app_id = await test_application
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/configurations",
            json={
                "application_id": app_id,
                "name": "Minimal Config"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Minimal Config"
        assert data["settings"] == {}


@pytest.mark.asyncio
async def test_create_configuration_invalid_application():
    """Test creating a configuration for non-existent application."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/configurations",
            json={
                "application_id": "01HQWXYZ1234567890ABCDEFGH",
                "name": "Test Config",
                "settings": {}
            }
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]


@pytest.mark.asyncio
async def test_create_configuration_duplicate_name(test_application):
    """Test creating a configuration with duplicate name for same application."""
    app_id = await test_application
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create first configuration
        await client.post(
            "/api/v1/configurations",
            json={
                "application_id": app_id,
                "name": "Duplicate Config",
                "settings": {}
            }
        )
        
        # Try to create duplicate
        response = await client.post(
            "/api/v1/configurations",
            json={
                "application_id": app_id,
                "name": "Duplicate Config",
                "settings": {}
            }
        )
        
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_list_configurations(test_application):
    """Test listing all configurations."""
    app_id = await test_application
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create some configurations
        await client.post(
            "/api/v1/configurations",
            json={"application_id": app_id, "name": "Config 1", "settings": {}}
        )
        await client.post(
            "/api/v1/configurations",
            json={"application_id": app_id, "name": "Config 2", "settings": {}}
        )
        
        # List configurations
        response = await client.get("/api/v1/configurations")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2


@pytest.mark.asyncio
async def test_list_configurations_filtered(test_application):
    """Test listing configurations filtered by application_id."""
    app_id = await test_application
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create another application
        app2_response = await client.post(
            "/api/v1/applications",
            json={"name": "App 2"}
        )
        app2_id = app2_response.json()["id"]
        
        # Create configurations for both applications
        await client.post(
            "/api/v1/configurations",
            json={"application_id": app_id, "name": "Config A", "settings": {}}
        )
        await client.post(
            "/api/v1/configurations",
            json={"application_id": app2_id, "name": "Config B", "settings": {}}
        )
        
        # List configurations for first application only
        response = await client.get(f"/api/v1/configurations?application_id={app_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert all(c["application_id"] == app_id for c in data)


@pytest.mark.asyncio
async def test_get_configuration(test_application):
    """Test getting a single configuration."""
    app_id = await test_application
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create configuration
        create_response = await client.post(
            "/api/v1/configurations",
            json={
                "application_id": app_id,
                "name": "Get Test Config",
                "settings": {"test": "value"}
            }
        )
        config_id = create_response.json()["id"]
        
        # Get configuration
        response = await client.get(f"/api/v1/configurations/{config_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == config_id
        assert data["name"] == "Get Test Config"
        assert data["settings"] == {"test": "value"}


@pytest.mark.asyncio
async def test_get_configuration_not_found():
    """Test getting a non-existent configuration."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/configurations/01HQWXYZ1234567890ABCDEFGH")
        
        assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_configuration(test_application):
    """Test updating a configuration."""
    app_id = await test_application
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create configuration
        create_response = await client.post(
            "/api/v1/configurations",
            json={
                "application_id": app_id,
                "name": "Original Config",
                "description": "Original",
                "settings": {"old": "value"}
            }
        )
        config_id = create_response.json()["id"]
        
        # Update configuration
        response = await client.put(
            f"/api/v1/configurations/{config_id}",
            json={
                "name": "Updated Config",
                "description": "Updated",
                "settings": {"new": "value"}
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Config"
        assert data["description"] == "Updated"
        assert data["settings"] == {"new": "value"}


@pytest.mark.asyncio
async def test_update_configuration_partial(test_application):
    """Test partial update of a configuration."""
    app_id = await test_application
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create configuration
        create_response = await client.post(
            "/api/v1/configurations",
            json={
                "application_id": app_id,
                "name": "Original",
                "settings": {"key": "value"}
            }
        )
        config_id = create_response.json()["id"]
        
        # Update only settings
        response = await client.put(
            f"/api/v1/configurations/{config_id}",
            json={"settings": {"updated": "settings"}}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Original"  # Name unchanged
        assert data["settings"] == {"updated": "settings"}


@pytest.mark.asyncio
async def test_update_configuration_not_found():
    """Test updating a non-existent configuration."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.put(
            "/api/v1/configurations/01HQWXYZ1234567890ABCDEFGH",
            json={"name": "Updated"}
        )
        
        assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_configuration_duplicate_name(test_application):
    """Test updating a configuration with a name that already exists."""
    app_id = await test_application
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create two configurations
        await client.post(
            "/api/v1/configurations",
            json={"application_id": app_id, "name": "Config A", "settings": {}}
        )
        create_response = await client.post(
            "/api/v1/configurations",
            json={"application_id": app_id, "name": "Config B", "settings": {}}
        )
        config_b_id = create_response.json()["id"]
        
        # Try to update Config B to have Config A's name
        response = await client.put(
            f"/api/v1/configurations/{config_b_id}",
            json={"name": "Config A"}
        )
        
        assert response.status_code == 409


@pytest.mark.asyncio
async def test_delete_configuration(test_application):
    """Test deleting a configuration."""
    app_id = await test_application
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create configuration
        create_response = await client.post(
            "/api/v1/configurations",
            json={"application_id": app_id, "name": "To Delete", "settings": {}}
        )
        config_id = create_response.json()["id"]
        
        # Delete configuration
        response = await client.delete(f"/api/v1/configurations/{config_id}")
        
        assert response.status_code == 204
        
        # Verify it's deleted
        get_response = await client.get(f"/api/v1/configurations/{config_id}")
        assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_delete_configuration_not_found():
    """Test deleting a non-existent configuration."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.delete("/api/v1/configurations/01HQWXYZ1234567890ABCDEFGH")
        
        assert response.status_code == 404
