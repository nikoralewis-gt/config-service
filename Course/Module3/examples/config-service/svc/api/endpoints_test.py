"""
Tests for the API endpoints using psycopg2-based repositories with ULID.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from ulid import ULID as generate_ulid

from api.db_connection import get_db_pool
from api.endpoints import router as api_router


class TestApplicationAPI:
    """Tests for application management endpoints."""

    @pytest.fixture
    def mock_db_pool(self):
        """Mock database pool for testing."""
        return MagicMock()

    @pytest.fixture
    def client(self, mock_db_pool):
        """Test client with mocked database."""
        # Create a test app without lifespan manager
        test_app = FastAPI()
        test_app.include_router(api_router, prefix="/api/v1")
        test_app.dependency_overrides[get_db_pool] = lambda: mock_db_pool
        yield TestClient(test_app)
        test_app.dependency_overrides.clear()

    def test_create_application_success(self, client, mock_db_pool):
        """Test successful application creation."""
        # Mock repository behavior
        app_id = str(generate_ulid())
        mock_db_pool.execute_query = AsyncMock(return_value=None)  # No existing app
        mock_db_pool.execute_mutation = AsyncMock(
            return_value={"id": app_id, "name": "test-app", "description": "Test application"}
        )

        response = client.post(
            "/api/v1/applications", json={"name": "test-app", "description": "Test application"}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "test-app"
        assert data["description"] == "Test application"
        assert "id" in data

    def test_create_application_duplicate_name(self, client, mock_db_pool):
        """Test application creation with duplicate name."""
        # Mock existing application
        mock_db_pool.execute_query = AsyncMock(
            return_value={
                "id": str(generate_ulid()),
                "name": "test-app",
                "description": "Existing app",
            }
        )

        response = client.post(
            "/api/v1/applications", json={"name": "test-app", "description": "Test application"}
        )

        assert response.status_code == 409
        data = response.json()
        assert "already exists" in data["detail"]

    def test_list_applications(self, client, mock_db_pool):
        """Test listing all applications."""
        app_id1 = str(generate_ulid())
        app_id2 = str(generate_ulid())

        mock_db_pool.execute_query = AsyncMock(
            return_value=[
                {"id": app_id1, "name": "app1", "description": "First app"},
                {"id": app_id2, "name": "app2", "description": "Second app"},
            ]
        )

        response = client.get("/api/v1/applications")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["name"] == "app1"
        assert data[1]["name"] == "app2"

    def test_get_application_by_id(self, client, mock_db_pool):
        """Test getting application by ID."""
        app_id = str(generate_ulid())

        mock_db_pool.execute_query = AsyncMock(
            return_value={"id": app_id, "name": "test-app", "description": "Test application"}
        )

        response = client.get(f"/api/v1/applications/{app_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "test-app"
        assert data["id"] == app_id

    def test_get_application_not_found(self, client, mock_db_pool):
        """Test getting non-existent application."""
        app_id = str(generate_ulid())

        mock_db_pool.execute_query = AsyncMock(return_value=None)

        response = client.get(f"/api/v1/applications/{app_id}")

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"]

    def test_delete_application(self, client, mock_db_pool):
        """Test deleting application."""
        app_id = str(generate_ulid())

        mock_db_pool.execute_mutation = AsyncMock(return_value=1)  # 1 row affected

        response = client.delete(f"/api/v1/applications/{app_id}")

        assert response.status_code == 204

    def test_delete_application_not_found(self, client, mock_db_pool):
        """Test deleting non-existent application."""
        app_id = str(generate_ulid())

        mock_db_pool.execute_mutation = AsyncMock(return_value=0)  # 0 rows affected

        response = client.delete(f"/api/v1/applications/{app_id}")

        assert response.status_code == 404


class TestConfigurationAPI:
    """Tests for configuration management endpoints."""

    @pytest.fixture
    def mock_db_pool(self):
        """Mock database pool for testing."""
        return MagicMock()

    @pytest.fixture
    def client(self, mock_db_pool):
        """Test client with mocked database."""
        # Create a test app without lifespan manager
        test_app = FastAPI()
        test_app.include_router(api_router, prefix="/api/v1")
        test_app.dependency_overrides[get_db_pool] = lambda: mock_db_pool
        yield TestClient(test_app)
        test_app.dependency_overrides.clear()

    def test_update_configuration(self, client, mock_db_pool):
        """Test updating application configuration."""
        app_id = str(generate_ulid())
        config_data = {
            "api_endpoint": "https://api.example.com",
            "timeout": 30,
            "features": {"dark_mode": True},
        }

        # Mock application exists
        mock_db_pool.execute_query = AsyncMock(
            return_value={"id": app_id, "name": "test-app", "description": "Test app"}
        )

        # Mock configuration upsert
        mock_db_pool.execute_mutation = AsyncMock(
            return_value={"application_id": app_id, "config": config_data}
        )

        response = client.put(f"/api/v1/applications/{app_id}/config", json={"config": config_data})

        assert response.status_code == 200
        data = response.json()
        assert data["application_id"] == app_id
        assert data["config"] == config_data

    def test_update_configuration_app_not_found(self, client, mock_db_pool):
        """Test updating configuration for non-existent application."""
        app_id = str(generate_ulid())

        mock_db_pool.execute_query = AsyncMock(return_value=None)

        response = client.put(
            f"/api/v1/applications/{app_id}/config", json={"config": {"key": "value"}}
        )

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"]

    def test_get_configuration_by_id(self, client, mock_db_pool):
        """Test getting configuration by application ID."""
        app_id = str(generate_ulid())
        config_data = {"key": "value", "number": 42}

        mock_db_pool.execute_query = AsyncMock(
            return_value={"application_id": app_id, "config": config_data}
        )

        response = client.get(f"/api/v1/applications/{app_id}/config")

        assert response.status_code == 200
        data = response.json()
        assert data["application_id"] == app_id
        assert data["config"] == config_data

    def test_get_configuration_by_name(self, client, mock_db_pool):
        """Test getting configuration by application name."""
        config_data = {"api_url": "https://api.test.com", "enabled": True}

        mock_db_pool.execute_query = AsyncMock(
            return_value={"application_id": str(generate_ulid()), "config": config_data}
        )

        response = client.get("/api/v1/config/test-app")

        assert response.status_code == 200
        data = response.json()
        assert data == config_data

    def test_get_configuration_not_found(self, client, mock_db_pool):
        """Test getting non-existent configuration."""
        mock_db_pool.execute_query = AsyncMock(return_value=None)

        response = client.get("/api/v1/config/nonexistent-app")

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"]
