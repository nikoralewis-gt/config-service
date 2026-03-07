"""Tests for database migration system."""

import pytest
import tempfile
from pathlib import Path
from api.database import Database
from migrations.migrations import get_pending_migrations, apply_migration, run_migrations


@pytest.fixture
def test_db():
    """Create a temporary test database."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    
    db = Database(db_path)
    yield db
    
    # Cleanup
    Path(db_path).unlink(missing_ok=True)


def test_get_pending_migrations_creates_table(test_db):
    """Test that get_pending_migrations creates migrations table."""
    with test_db.get_connection() as conn:
        pending = get_pending_migrations(conn)
        
        # Verify migrations table exists
        result = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'"
        ).fetchone()
        assert result is not None


def test_get_pending_migrations_returns_sql_files(test_db):
    """Test that get_pending_migrations finds SQL files."""
    with test_db.get_connection() as conn:
        pending = get_pending_migrations(conn)
        
        # Should find at least the initial schema migration
        assert len(pending) > 0
        assert all(f.suffix == ".sql" for f in pending)


def test_get_pending_migrations_excludes_applied(test_db):
    """Test that applied migrations are excluded from pending list."""
    with test_db.get_connection() as conn:
        # Get initial pending count
        pending_before = get_pending_migrations(conn)
        initial_count = len(pending_before)
        
        # Mark first migration as applied
        if pending_before:
            conn.execute(
                "INSERT INTO migrations (name) VALUES (?)",
                (pending_before[0].name,)
            )
        
        # Get pending again
        pending_after = get_pending_migrations(conn)
        
        # Should have one less pending migration
        assert len(pending_after) == initial_count - 1


def test_apply_migration(test_db):
    """Test applying a migration file."""
    # Create a test migration file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.sql', delete=False) as f:
        f.write("CREATE TABLE test_table (id INTEGER PRIMARY KEY);")
        migration_file = Path(f.name)
    
    try:
        with test_db.get_connection() as conn:
            # Ensure migrations table exists
            get_pending_migrations(conn)
            
            # Apply migration
            apply_migration(conn, migration_file)
            
            # Verify table was created
            result = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='test_table'"
            ).fetchone()
            assert result is not None
            
            # Verify migration was recorded
            result = conn.execute(
                "SELECT name FROM migrations WHERE name = ?",
                (migration_file.name,)
            ).fetchone()
            assert result is not None
    finally:
        migration_file.unlink(missing_ok=True)


def test_run_migrations(test_db):
    """Test running all pending migrations."""
    run_migrations(test_db)
    
    # Verify applications table exists
    with test_db.get_connection() as conn:
        result = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='applications'"
        ).fetchone()
        assert result is not None
        
        # Verify configurations table exists
        result = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='configurations'"
        ).fetchone()
        assert result is not None


def test_run_migrations_idempotent(test_db):
    """Test that running migrations multiple times is safe."""
    # Run migrations twice
    run_migrations(test_db)
    run_migrations(test_db)
    
    # Should not cause errors and tables should still exist
    with test_db.get_connection() as conn:
        result = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='applications'"
        ).fetchone()
        assert result is not None


def test_run_migrations_invalid_db_type():
    """Test that run_migrations validates database type."""
    with pytest.raises(TypeError):
        run_migrations("not a database")


def test_migration_creates_indexes(test_db):
    """Test that migrations create the required indexes."""
    run_migrations(test_db)
    
    with test_db.get_connection() as conn:
        # Check for application name index
        result = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_applications_name'"
        ).fetchone()
        assert result is not None
        
        # Check for configuration indexes
        result = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_configurations_application_id'"
        ).fetchone()
        assert result is not None
