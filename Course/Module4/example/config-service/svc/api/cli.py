"""
CLI commands for database operations.

This module provides command-line utilities for managing migrations
and database operations.
"""

import asyncio
import sys

from api.db_connection import db_pool
from api.migrations import get_migration_manager


async def run_migrations():
    """Run all pending database migrations."""
    try:
        db_pool.initialize()
        migration_manager = await get_migration_manager(db_pool)
        await migration_manager.run_migrations()
        print("Migrations completed successfully")
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)
    finally:
        db_pool.close()


async def reset_database():
    """Drop and recreate all tables."""
    try:
        db_pool.initialize()
        migration_manager = await get_migration_manager(db_pool)
        await migration_manager.drop_tables()
        await migration_manager.run_migrations()
        print("Database reset completed successfully")
    except Exception as e:
        print(f"Database reset failed: {e}")
        sys.exit(1)
    finally:
        db_pool.close()


def main():
    """Main CLI entry point."""
    if len(sys.argv) < 2:
        print("Usage: python -m app.cli <command>")
        print("Commands:")
        print("  migrate - Run pending migrations")
        print("  reset   - Drop and recreate all tables")
        sys.exit(1)

    command = sys.argv[1]

    if command == "migrate":
        asyncio.run(run_migrations())
    elif command == "reset":
        asyncio.run(reset_database())
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)


if __name__ == "__main__":
    main()
