"""
Tests for repository layer using psycopg2 with ULID.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest
from ulid import ULID as generate_ulid

from api.repository import ApplicationRepository, ConfigurationRepository


class TestApplicationRepository:
    """Tests for ApplicationRepository."""

    @pytest.fixture
    def mock_db_pool(self):
        """Mock database pool."""
        return MagicMock()

    @pytest.fixture
    def repo(self, mock_db_pool):
        """Application repository with mocked database."""
        return ApplicationRepository(mock_db_pool)

    @pytest.mark.asyncio
    async def test_create_application(self, repo, mock_db_pool):
        """Test creating a new application."""
        app_id = str(generate_ulid())

        mock_db_pool.execute_mutation = AsyncMock(
            return_value={"id": app_id, "name": "test-app", "description": "Test description"}
        )

        result = await repo.create("test-app", "Test description")

        assert result["name"] == "test-app"
        assert result["description"] == "Test description"
        assert isinstance(result["id"], str)

        # Verify the SQL calls (application + default configuration)
        assert mock_db_pool.execute_mutation.call_count == 2

        # First call should be application creation
        first_call = mock_db_pool.execute_mutation.call_args_list[0]
        app_query = first_call[0][0]
        app_params = first_call[0][1]

        assert "INSERT INTO applications" in app_query
        assert app_params[1] == "test-app"
        assert app_params[2] == "Test description"

        # Second call should be default configuration creation
        second_call = mock_db_pool.execute_mutation.call_args_list[1]
        config_query = second_call[0][0]
        config_params = second_call[0][1]

        assert "INSERT INTO configurations" in config_query
        assert config_params[1] == '{"name": "value"}'

    @pytest.mark.asyncio
    async def test_get_by_id_found(self, repo, mock_db_pool):
        """Test getting application by ID when it exists."""
        app_id = str(generate_ulid())

        mock_db_pool.execute_query = AsyncMock(
            return_value={"id": app_id, "name": "test-app", "description": "Test description"}
        )

        result = await repo.get_by_id(app_id)

        assert result is not None
        assert result["name"] == "test-app"
        assert result["id"] == app_id

        # Verify the SQL call
        mock_db_pool.execute_query.assert_called_once()
        call_args = mock_db_pool.execute_query.call_args
        query = call_args[0][0]
        params = call_args[0][1]

        assert "SELECT id, name, description FROM applications WHERE id = %s" in query
        assert params[0] == app_id

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, repo, mock_db_pool):
        """Test getting application by ID when it doesn't exist."""
        app_id = str(generate_ulid())

        mock_db_pool.execute_query = AsyncMock(return_value=None)

        result = await repo.get_by_id(app_id)

        assert result is None

    @pytest.mark.asyncio
    async def test_get_by_name(self, repo, mock_db_pool):
        """Test getting application by name."""
        app_id = str(generate_ulid())

        mock_db_pool.execute_query = AsyncMock(
            return_value={"id": app_id, "name": "test-app", "description": "Test description"}
        )

        result = await repo.get_by_name("test-app")

        assert result is not None
        assert result["name"] == "test-app"

        # Verify the SQL call
        mock_db_pool.execute_query.assert_called_once()
        call_args = mock_db_pool.execute_query.call_args
        query = call_args[0][0]
        params = call_args[0][1]

        assert "WHERE name = %s" in query
        assert params[0] == "test-app"

    @pytest.mark.asyncio
    async def test_list_all(self, repo, mock_db_pool):
        """Test listing all applications."""
        app_id1 = generate_ulid()
        app_id2 = generate_ulid()

        mock_db_pool.execute_query = AsyncMock(
            return_value=[
                {"id": str(app_id1), "name": "app1", "description": "First app"},
                {"id": str(app_id2), "name": "app2", "description": "Second app"},
            ]
        )

        result = await repo.list_all()

        assert len(result) == 2
        assert result[0]["name"] == "app1"
        assert result[1]["name"] == "app2"
        assert isinstance(result[0]["id"], str)
        assert isinstance(result[1]["id"], str)

    @pytest.mark.asyncio
    async def test_update_application(self, repo, mock_db_pool):
        """Test updating application."""
        app_id = str(generate_ulid())

        mock_db_pool.execute_mutation = AsyncMock(
            return_value={"id": app_id, "name": "updated-app", "description": "Updated description"}
        )

        result = await repo.update(app_id, name="updated-app", description="Updated description")

        assert result is not None
        assert result["name"] == "updated-app"
        assert result["description"] == "Updated description"

        # Verify the SQL call
        mock_db_pool.execute_mutation.assert_called_once()
        call_args = mock_db_pool.execute_mutation.call_args
        query = call_args[0][0]
        params = call_args[0][1]

        assert "UPDATE applications" in query
        assert "SET name = %s, description = %s" in query
        assert params[0] == "updated-app"
        assert params[1] == "Updated description"
        assert params[2] == app_id

    @pytest.mark.asyncio
    async def test_delete_application(self, repo, mock_db_pool):
        """Test deleting application."""
        app_id = str(generate_ulid())

        mock_db_pool.execute_mutation = AsyncMock(return_value=1)  # 1 row affected

        result = await repo.delete(app_id)

        assert result is True

        # Verify the SQL call
        mock_db_pool.execute_mutation.assert_called_once()
        call_args = mock_db_pool.execute_mutation.call_args
        query = call_args[0][0]
        params = call_args[0][1]

        assert "DELETE FROM applications WHERE id = %s" in query
        assert params[0] == app_id


class TestConfigurationRepository:
    """Tests for ConfigurationRepository."""

    @pytest.fixture
    def mock_db_pool(self):
        """Mock database pool."""
        return MagicMock()

    @pytest.fixture
    def repo(self, mock_db_pool):
        """Configuration repository with mocked database."""
        return ConfigurationRepository(mock_db_pool)

    @pytest.mark.asyncio
    async def test_upsert_configuration(self, repo, mock_db_pool):
        """Test upserting configuration."""
        app_id = str(generate_ulid())
        config_data = {"key": "value", "number": 42}

        mock_db_pool.execute_mutation = AsyncMock(
            return_value={"application_id": app_id, "config": config_data}
        )

        result = await repo.upsert(app_id, config_data)

        assert result["application_id"] == app_id
        assert result["config"] == config_data

        # Verify the SQL call
        mock_db_pool.execute_mutation.assert_called_once()
        call_args = mock_db_pool.execute_mutation.call_args
        query = call_args[0][0]
        params = call_args[0][1]

        assert "INSERT INTO configurations" in query
        assert "ON CONFLICT (application_id)" in query
        assert params[0] == app_id
        # params[1] should be JSON string
        assert '"key": "value"' in params[1]
        assert '"number": 42' in params[1]

    @pytest.mark.asyncio
    async def test_get_by_application_id(self, repo, mock_db_pool):
        """Test getting configuration by application ID."""
        app_id = str(generate_ulid())
        config_data = {"api_url": "https://api.example.com"}

        mock_db_pool.execute_query = AsyncMock(
            return_value={"application_id": app_id, "config": config_data}
        )

        result = await repo.get_by_application_id(app_id)

        assert result is not None
        assert result["application_id"] == app_id
        assert result["config"] == config_data

    @pytest.mark.asyncio
    async def test_get_by_application_name(self, repo, mock_db_pool):
        """Test getting configuration by application name."""
        app_id = str(generate_ulid())
        config_data = {"enabled": True}

        mock_db_pool.execute_query = AsyncMock(
            return_value={"application_id": app_id, "config": config_data}
        )

        result = await repo.get_by_application_name("test-app")

        assert result is not None
        assert result["application_id"] == app_id
        assert result["config"] == config_data

        # Verify the SQL call includes JOIN
        mock_db_pool.execute_query.assert_called_once()
        call_args = mock_db_pool.execute_query.call_args
        query = call_args[0][0]
        params = call_args[0][1]

        assert "JOIN applications a ON" in query
        assert "WHERE a.name = %s" in query
        assert params[0] == "test-app"

    @pytest.mark.asyncio
    async def test_delete_configuration(self, repo, mock_db_pool):
        """Test deleting configuration."""
        app_id = str(generate_ulid())

        mock_db_pool.execute_mutation = AsyncMock(return_value=1)  # 1 row affected

        result = await repo.delete(app_id)

        assert result is True

        # Verify the SQL call
        mock_db_pool.execute_mutation.assert_called_once()
        call_args = mock_db_pool.execute_mutation.call_args
        query = call_args[0][0]
        params = call_args[0][1]

        assert "DELETE FROM configurations WHERE application_id = %s" in query
        assert params[0] == app_id
