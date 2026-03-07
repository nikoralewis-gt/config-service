"""Database connection management."""

from contextlib import contextmanager
from sqlite3 import Connection, Row
import sqlite3
from pathlib import Path
from typing import Generator


class Database:
    """Database connection manager for SQLite."""
    
    def __init__(self, db_path: str):
        """Initialize database manager.
        
        Args:
            db_path: Path to the SQLite database file.
        """
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
    
    @contextmanager
    def get_connection(self) -> Generator[Connection, None, None]:
        """Context manager for database connections.
        
        Yields:
            SQLite connection with Row factory and foreign keys enabled.
            
        The connection will automatically commit on success or rollback on error.
        """
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = Row
        conn.execute("PRAGMA foreign_keys = ON")
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
