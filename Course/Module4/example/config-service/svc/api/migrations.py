"""
Simple database migration system to replace Alembic.

This module provides basic migration functionality using raw SQL files
with psycopg2 instead of SQLAlchemy/Alembic.
"""

import logging
from pathlib import Path

from api.db_connection import DatabasePool

logger = logging.getLogger(__name__)


class MigrationManager:
    """Manages database migrations using SQL files."""

    def __init__(self, db_pool: DatabasePool, migrations_dir: str = "migrations"):
        self.db = db_pool
        self.migrations_dir = Path(migrations_dir)

    async def ensure_migrations_table(self) -> None:
        """Ensure the schema_migrations table exists."""
        query = """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """
        await self.db.execute_mutation(query)
        logger.info("Ensured schema_migrations table exists")

    async def get_applied_migrations(self) -> list[str]:
        """Get list of applied migration versions."""
        query = "SELECT version FROM schema_migrations ORDER BY version"

        result = await self.db.execute_query(query)

        if isinstance(result, list):
            return [row["version"] for row in result]
        return []

    def get_available_migrations(self) -> list[tuple[str, Path]]:
        """Get list of available migration files."""
        if not self.migrations_dir.exists():
            logger.warning(f"Migrations directory {self.migrations_dir} does not exist")
            return []

        migrations = []
        for file_path in sorted(self.migrations_dir.glob("*.sql")):
            version = file_path.stem
            migrations.append((version, file_path))

        return migrations

    async def apply_migration(self, version: str, file_path: Path) -> None:
        """Apply a single migration."""
        logger.info(f"Applying migration: {version}")

        # Read migration file
        sql_content = file_path.read_text(encoding="utf-8")

        # Execute migration in a transaction
        async with self.db.transaction() as conn:

            def _execute():
                with conn.cursor() as cursor:
                    # Execute the migration SQL
                    cursor.execute(sql_content)

                    # Record migration as applied (if not already recorded in the SQL)
                    cursor.execute(
                        "INSERT INTO schema_migrations (version) VALUES (%s) ON CONFLICT DO NOTHING",  # noqa: E501
                        (version,),
                    )

            import asyncio

            await asyncio.get_event_loop().run_in_executor(None, _execute)

        logger.info(f"Successfully applied migration: {version}")

    async def run_migrations(self) -> None:
        """Run all pending migrations."""
        await self.ensure_migrations_table()

        applied = await self.get_applied_migrations()
        available = self.get_available_migrations()

        logger.info(f"Applied migrations: {applied}")
        logger.info(f"Available migrations: {[v for v, _ in available]}")

        pending = [
            (version, file_path) for version, file_path in available if version not in applied
        ]

        if not pending:
            logger.info("No pending migrations")
            return

        logger.info(f"Running {len(pending)} pending migrations")

        for version, file_path in pending:
            await self.apply_migration(version, file_path)

        logger.info("All migrations completed successfully")

    async def create_tables(self) -> None:
        """Create all tables by running migrations."""
        await self.run_migrations()

    async def drop_tables(self) -> None:
        """Drop all tables and migration tracking."""
        logger.warning("Dropping all tables")

        queries = [
            "DROP TABLE IF EXISTS configurations CASCADE",
            "DROP TABLE IF EXISTS applications CASCADE",
            "DROP TABLE IF EXISTS schema_migrations CASCADE",
            "DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE",
        ]

        for query in queries:
            await self.db.execute_mutation(query)

        logger.info("All tables dropped")


async def get_migration_manager(db_pool: DatabasePool) -> MigrationManager:
    """Get migration manager instance."""
    return MigrationManager(db_pool)
