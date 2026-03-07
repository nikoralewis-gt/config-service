"""
Database connection management using psycopg2 with async support.

This module provides connection pooling, query execution, and transaction management.
"""

import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from typing import Any

import psycopg2
import psycopg2.extras
from psycopg2.pool import ThreadedConnectionPool

from api.settings import settings

logger = logging.getLogger(__name__)


class DatabasePool:
    """Connection pool manager for PostgreSQL using psycopg2."""

    def __init__(self):
        self._pool: ThreadedConnectionPool | None = None
        self._executor = ThreadPoolExecutor(max_workers=10)
        self._active_connections = 0
        self._connection_lock = asyncio.Lock()

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
        """Get a connection from the pool with manual tracking."""
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
        conn = None
        try:
            conn = await asyncio.get_event_loop().run_in_executor(self._executor, _get_conn)

            # Track active connection
            async with self._connection_lock:
                self._active_connections += 1

            yield conn
        except Exception:
            # Handle connection acquisition failure
            if conn is not None:
                async with self._connection_lock:
                    self._active_connections -= 1
                await asyncio.get_event_loop().run_in_executor(self._executor, _put_conn, conn)
            raise
        finally:
            # Always decrement counter and return connection if acquired
            if conn is not None:
                async with self._connection_lock:
                    self._active_connections -= 1
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

    def get_pool_metrics(self) -> dict[str, int]:
        """Get current pool capacity metrics for monitoring."""
        if not self._pool:
            return {"active": 0, "total": 0, "idle": 0}

        total_connections = self._pool.maxconn
        active_connections = self._active_connections
        idle_connections = max(0, total_connections - active_connections)

        return {"active": active_connections, "total": total_connections, "idle": idle_connections}


# Global database pool instance
db_pool = DatabasePool()


async def get_db_pool() -> DatabasePool:
    """Dependency function to get database pool for FastAPI endpoints."""
    return db_pool
