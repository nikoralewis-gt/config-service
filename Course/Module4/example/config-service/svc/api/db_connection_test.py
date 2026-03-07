"""
Tests for database connection management
"""

from unittest.mock import MagicMock, patch

import pytest
from ulid import ULID as StandardULID

from api.db_connection import (
    DatabasePool,
    get_db_pool,
)


class TestDatabasePool:
    """Tests for critical database connection scenarios."""

    @pytest.fixture
    def db_pool(self):
        """Create a DatabasePool instance for testing."""
        return DatabasePool()

    @patch("api.db_connection.settings")
    def test_invalid_database_url_rejected(self, mock_settings, db_pool):
        """Critical: Invalid database URLs should be caught before connection attempts."""
        mock_settings.database_url = "mysql://user:pass@localhost/db"

        with pytest.raises(ValueError, match="Unsupported database URL format"):
            db_pool.initialize()

    @patch("api.db_connection.settings")
    def test_asyncpg_url_converted_to_psycopg2(self, mock_settings, db_pool):
        """Critical: URL format conversion for compatibility."""
        mock_settings.database_url = "postgresql+asyncpg://user:pass@localhost/db"

        with patch("api.db_connection.ThreadedConnectionPool") as mock_pool_class:
            mock_pool_class.return_value = MagicMock()
            db_pool.initialize()

            # Verify the URL was converted
            call_args = mock_pool_class.call_args
            assert call_args[1]["dsn"] == "postgresql://user:pass@localhost/db"
            db_pool.close()

    @pytest.mark.asyncio
    async def test_connection_fails_when_pool_not_initialized(self, db_pool):
        """Critical: Should fail fast when database not initialized."""
        with pytest.raises(RuntimeError, match="Database pool not initialized"):
            async with db_pool.get_connection():
                pass


class TestJSONUtilities:
    """Tests for JSON serialization - critical for API data integrity."""

    def test_ulid_serialization_for_api_responses(self):
        """Critical: ULID objects must serialize correctly for API responses."""
        ulid_str = "01FQCFTGXVJ3DGVPQZCRTYFWM1"
        standard_ulid = StandardULID.from_str(ulid_str)
        # The ULID.__str__() method returns the actual ULID string
        str_result = str(standard_ulid)
        assert str_result == ulid_str


class TestDependencyInjection:
    """Tests for FastAPI dependency injection."""

    @pytest.mark.asyncio
    async def test_get_db_pool_returns_singleton(self):
        """Critical: FastAPI should get the same database pool instance."""
        from api.db_connection import db_pool as global_pool

        result = await get_db_pool()
        assert result == global_pool
        result.close()
