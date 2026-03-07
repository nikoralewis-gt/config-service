"""
Tests for migration system - focusing on critical schema management scenarios.
"""

from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from api.migrations import MigrationManager, get_migration_manager


class TestCriticalMigrationScenarios:
    """Tests for critical migration scenarios that affect data integrity."""

    @pytest.fixture
    def migration_manager(self):
        """Create migration manager with mocked database pool."""
        mock_db_pool = MagicMock()
        mock_db_pool.execute_mutation = AsyncMock()
        mock_db_pool.execute_query = AsyncMock()
        return MigrationManager(mock_db_pool, "test_migrations")

    @pytest.mark.asyncio
    async def test_migration_table_created_if_missing(self, migration_manager):
        """Critical: Migration tracking table must be created on first run."""
        await migration_manager.ensure_migrations_table()

        migration_manager.db.execute_mutation.assert_called_once()
        call_args = migration_manager.db.execute_mutation.call_args[0][0]
        assert "CREATE TABLE IF NOT EXISTS schema_migrations" in call_args

    @pytest.mark.asyncio
    async def test_applied_migrations_retrieved_correctly(self, migration_manager):
        """Critical: Must accurately track which migrations have been applied."""
        # Mock database returning applied migrations
        migration_manager.db.execute_query = AsyncMock(
            return_value=[
                {"version": "001_initial_schema"},
                {"version": "002_add_indexes"},
            ]
        )

        applied = await migration_manager.get_applied_migrations()

        assert applied == ["001_initial_schema", "002_add_indexes"]

    @pytest.mark.asyncio
    async def test_table_drop_removes_all_schema_objects(self, migration_manager):
        """Critical: Database reset must completely clean schema."""
        await migration_manager.drop_tables()

        # Verify all expected DROP statements were executed
        calls = migration_manager.db.execute_mutation.call_args_list
        drop_statements = [call[0][0] for call in calls]

        # Check critical tables are dropped
        assert any("DROP TABLE IF EXISTS configurations" in stmt for stmt in drop_statements)
        assert any("DROP TABLE IF EXISTS applications" in stmt for stmt in drop_statements)
        assert any("DROP TABLE IF EXISTS schema_migrations" in stmt for stmt in drop_statements)
        # Check functions are also dropped
        assert any("DROP FUNCTION" in stmt for stmt in drop_statements)

    def test_missing_migrations_directory_handled_gracefully(self, migration_manager):
        """Critical: Missing migrations directory should not crash the system."""
        # Create a test directory that doesn't exist
        with patch("pathlib.Path.exists", return_value=False):
            migrations = migration_manager.get_available_migrations()
            assert migrations == []

    @pytest.mark.asyncio
    async def test_no_migrations_to_apply_when_none_pending(self, migration_manager):
        """Critical: When no migrations needed, should skip safely."""
        # Mock that ensure_migrations_table succeeds
        migration_manager.db.execute_mutation.return_value = None

        # Mock that no migrations are available
        with patch.object(migration_manager, "get_applied_migrations", return_value=[]):
            with patch.object(migration_manager, "get_available_migrations", return_value=[]):
                await migration_manager.run_migrations()

                # Only ensure_migrations_table should have been called
                migration_manager.db.execute_mutation.assert_called_once()


class TestMigrationManagerFactory:
    """Tests for migration manager creation."""

    @pytest.mark.asyncio
    async def test_get_migration_manager_returns_configured_instance(self):
        """Critical: Factory function must return properly configured manager."""
        mock_db_pool = MagicMock()

        manager = await get_migration_manager(mock_db_pool)

        assert isinstance(manager, MigrationManager)
        assert manager.db == mock_db_pool
        assert manager.migrations_dir == Path("migrations")


class TestMigrationWorkflowIntegrity:
    """Tests for migration workflow integrity."""

    @pytest.fixture
    def migration_manager(self):
        """Create migration manager with mocked database pool."""
        mock_db_pool = MagicMock()
        mock_db_pool.execute_mutation = AsyncMock()
        mock_db_pool.execute_query = AsyncMock()
        return MigrationManager(mock_db_pool)

    @pytest.mark.asyncio
    async def test_migration_workflow_ensures_table_first(self, migration_manager):
        """Critical: Migration workflow must ensure schema_migrations table exists."""
        # Mock no applied migrations and no available migrations
        migration_manager.db.execute_query.return_value = []

        with patch.object(migration_manager, "get_available_migrations", return_value=[]):
            await migration_manager.run_migrations()

            # Should call ensure_migrations_table
            migration_manager.db.execute_mutation.assert_called_once()
            call_args = migration_manager.db.execute_mutation.call_args[0][0]
            assert "CREATE TABLE IF NOT EXISTS schema_migrations" in call_args
