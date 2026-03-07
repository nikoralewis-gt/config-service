"""
Database connection management using psycopg2 with async support.

This module provides connection pooling, query execution, and transaction management
to replace SQLAlchemy with direct PostgreSQL access.
"""

import asyncio
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from typing import Any

import psycopg2
import psycopg2.extras
from psycopg2.pool import ThreadedConnectionPool
from pydantic_extra_types.ulid import ULID

from api.settings import settings

logger = logging.getLogger(__name__)


class DatabasePool:
    """Connection pool manager for PostgreSQL using psycopg2."""

    def __init__(self):
        self._pool: ThreadedConnectionPool | None = None
        self._executor = ThreadPoolExecutor(max_workers=10)

    def initialize(self) -> None:
        """Initialize the connection pool."""
        # Parse database URL to extract connection parameters
        db_url = settings.database_url
        if db_url.startswith("postgresql+asyncpg://"):
            db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
        elif db_url.startswith("postgresql://"):
            pass
        else:
            raise ValueError(f"Unsupported database URL format: {db_url}")

        try:
            self._pool = ThreadedConnectionPool(
                minconn=1, maxconn=20, dsn=db_url, cursor_factory=psycopg2.extras.RealDictCursor
            )
            logger.info("Database connection pool initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            raise

    def close(self) -> None:
        """Close all connections in the pool."""
        if self._pool:
            self._pool.closeall()
            self._executor.shutdown(wait=True)
            logger.info("Database connection pool closed")

    @asynccontextmanager
    async def get_connection(self):
        """Get a connection from the pool."""
        if not self._pool:
            raise RuntimeError("Database pool not initialized")

        def _get_conn():
            if self._pool is None:
                raise RuntimeError("Database pool not initialized")
            return self._pool.getconn()

        def _put_conn(conn):
            if self._pool is None:
                raise RuntimeError("Database pool not initialized")
            self._pool.putconn(conn)

        # Get connection in thread pool to avoid blocking
        conn = await asyncio.get_event_loop().run_in_executor(self._executor, _get_conn)

        try:
            yield conn
        finally:
            await asyncio.get_event_loop().run_in_executor(self._executor, _put_conn, conn)

    async def execute_query(
        self,
        query: str,
        params: tuple | None = None,
        fetch_one: bool = False,
        fetch_all: bool = True,
    ) -> dict[str, Any] | list[dict[str, Any]] | None:
        """Execute a query and return results."""
        async with self.get_connection() as conn:

            def _execute():
                with conn.cursor() as cursor:
                    cursor.execute(query, params)

                    if fetch_one:
                        result = cursor.fetchone()
                        return dict(result) if result else None
                    elif fetch_all:
                        results = cursor.fetchall()
                        return [dict(row) for row in results]
                    else:
                        return None

            return await asyncio.get_event_loop().run_in_executor(self._executor, _execute)

    async def execute_mutation(
        self, query: str, params: tuple | None = None, return_id: bool = False
    ) -> Any | None:
        """Execute an INSERT/UPDATE/DELETE query."""
        async with self.get_connection() as conn:

            def _execute():
                with conn.cursor() as cursor:
                    cursor.execute(query, params)
                    conn.commit()

                    if return_id and cursor.rowcount > 0:
                        # For INSERT with RETURNING clause
                        result = cursor.fetchone()
                        return dict(result) if result else None

                    return cursor.rowcount

            return await asyncio.get_event_loop().run_in_executor(self._executor, _execute)

    @asynccontextmanager
    async def transaction(self):
        """Context manager for database transactions."""
        async with self.get_connection() as conn:

            def _begin():
                conn.autocommit = False

            def _commit():
                conn.commit()

            def _rollback():
                conn.rollback()

            await asyncio.get_event_loop().run_in_executor(self._executor, _begin)

            try:
                yield conn
                await asyncio.get_event_loop().run_in_executor(self._executor, _commit)
            except Exception:
                await asyncio.get_event_loop().run_in_executor(self._executor, _rollback)
                raise
            finally:
                # Reset autocommit
                await asyncio.get_event_loop().run_in_executor(
                    self._executor, lambda: setattr(conn, "autocommit", True)
                )


# Global database pool instance
db_pool = DatabasePool()


async def get_db_pool() -> DatabasePool:
    """Dependency function to get database pool for FastAPI endpoints."""
    return db_pool


def json_serializer(obj: Any) -> str:
    """Custom JSON serializer for ULID and other types."""
    if isinstance(obj, ULID):
        return str(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def json_deserializer(s: str) -> Any:
    """Custom JSON deserializer."""
    return json.loads(s)
