"""Database migration system."""

import logging
from pathlib import Path
from sqlite3 import Connection
from typing import List

logger = logging.getLogger(__name__)


def get_pending_migrations(conn: Connection) -> List[Path]:
    """Get list of pending migrations that haven't been applied.
    
    Args:
        conn: Database connection.
        
    Returns:
        List of migration file paths that need to be applied.
    """
    # Ensure migrations table exists
    conn.execute("""
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Get list of applied migrations
    applied = {row[0] for row in conn.execute("SELECT name FROM migrations")}
    
    # Find all migration files
    migrations_dir = Path(__file__).parent
    migration_files = sorted(migrations_dir.glob("*.sql"))
    
    # Filter to only pending migrations
    pending = [f for f in migration_files if f.name not in applied]
    
    return pending


def apply_migration(conn: Connection, migration_file: Path) -> None:
    """Apply a single migration file.
    
    Args:
        conn: Database connection.
        migration_file: Path to the migration SQL file.
    """
    logger.info(f"Applying migration: {migration_file.name}")
    
    # Read and execute migration SQL
    sql = migration_file.read_text()
    conn.executescript(sql)
    
    # Record migration as applied
    conn.execute(
        "INSERT INTO migrations (name) VALUES (?)",
        (migration_file.name,)
    )
    
    logger.info(f"Migration applied successfully: {migration_file.name}")


def run_migrations(db) -> None:
    """Run all pending migrations.
    
    Args:
        db: Database instance with get_connection method.
    """
    from api.database import Database
    
    if not isinstance(db, Database):
        raise TypeError("db must be a Database instance")
    
    with db.get_connection() as conn:
        pending = get_pending_migrations(conn)
        
        if not pending:
            logger.info("No pending migrations")
            return
        
        logger.info(f"Found {len(pending)} pending migration(s)")
        
        for migration_file in pending:
            apply_migration(conn, migration_file)
        
        logger.info("All migrations applied successfully")


if __name__ == "__main__":
    """Run migrations from command line."""
    import sys
    from api.config import get_settings
    from api.database import Database
    
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    try:
        settings = get_settings()
        db = Database(settings.database_path)
        run_migrations(db)
        logger.info("Migration process completed")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)
