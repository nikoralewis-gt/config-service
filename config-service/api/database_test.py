"""Tests for database connection management."""

import pytest
import tempfile
from pathlib import Path
from api.database import Database


@pytest.fixture
def test_db():
    """Create a temporary test database."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    
    db = Database(db_path)
    yield db
    
    # Cleanup
    Path(db_path).unlink(missing_ok=True)


def test_database_initialization(test_db):
    """Test database initialization creates parent directories."""
    assert test_db.db_path.parent.exists()


def test_database_connection(test_db):
    """Test database connection context manager."""
    with test_db.get_connection() as conn:
        result = conn.execute("SELECT 1").fetchone()
        assert result[0] == 1


def test_database_row_factory(test_db):
    """Test that Row factory is set for dictionary-like access."""
    with test_db.get_connection() as conn:
        conn.execute("CREATE TABLE test (id INTEGER, name TEXT)")
        conn.execute("INSERT INTO test VALUES (1, 'test')")
        row = conn.execute("SELECT * FROM test").fetchone()
        
        # Test dictionary-like access
        assert row["id"] == 1
        assert row["name"] == "test"


def test_database_foreign_keys_enabled(test_db):
    """Test that foreign keys are enabled."""
    with test_db.get_connection() as conn:
        result = conn.execute("PRAGMA foreign_keys").fetchone()
        assert result[0] == 1


def test_database_commit_on_success(test_db):
    """Test that changes are committed on successful execution."""
    with test_db.get_connection() as conn:
        conn.execute("CREATE TABLE test (id INTEGER)")
        conn.execute("INSERT INTO test VALUES (1)")
    
    # Verify data persists in new connection
    with test_db.get_connection() as conn:
        result = conn.execute("SELECT COUNT(*) FROM test").fetchone()
        assert result[0] == 1


def test_database_rollback_on_error(test_db):
    """Test that changes are rolled back on error."""
    with test_db.get_connection() as conn:
        conn.execute("CREATE TABLE test (id INTEGER PRIMARY KEY)")
    
    try:
        with test_db.get_connection() as conn:
            conn.execute("INSERT INTO test VALUES (1)")
            # This should cause an error (duplicate primary key)
            conn.execute("INSERT INTO test VALUES (1)")
    except Exception:
        pass
    
    # Verify rollback occurred
    with test_db.get_connection() as conn:
        result = conn.execute("SELECT COUNT(*) FROM test").fetchone()
        assert result[0] == 0


def test_database_connection_closes(test_db):
    """Test that connection is properly closed after use."""
    with test_db.get_connection() as conn:
        pass
    
    # Attempting to use closed connection should raise error
    with pytest.raises(Exception):
        conn.execute("SELECT 1")
