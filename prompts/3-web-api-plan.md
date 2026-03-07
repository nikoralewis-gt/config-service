# Config Service - Comprehensive Implementation Plan

## Executive Summary

This document provides a detailed implementation plan for a REST Web API Configuration Service built with Python and FastAPI. The service manages applications and their configuration settings using SQLite as the database, without an ORM. The implementation follows modern Python best practices with comprehensive testing, type safety, and developer-friendly tooling.

## 1. Project Dependencies

### 1.1 Core Dependencies

All dependencies will be managed using `uv` (not pip). The following packages are required:

| Package | Version | Purpose |
|---------|---------|---------|
| python | 3.13+ | Runtime environment |
| fastapi | 0.116+ | Web framework |
| pydantic | 2.11+ | Data validation |
| pydantic-settings | 2.0+,<3.0.0 | Environment configuration |
| uvicorn | latest | ASGI server |
| python-ulid | 2.0+,<3.0.0 | ULID generation |
| pydantic-extra-types | latest | Pydantic ULID type |

### 1.2 Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| pytest | 8.4+ | Testing framework |
| pytest-cov | latest | Test coverage reporting |
| pytest-asyncio | latest | Async test support |
| httpx | 0.28+ | HTTP client for testing |

### 1.3 Python Built-in Modules

- `sqlite3` - Database adapter (built-in)
- `json` - JSON serialization
- `datetime` - Timestamp handling
- `contextlib` - Context managers
- `pathlib` - File path handling
- `logging` - Application logging

## 2. Project Structure

```
config-service/
├── .env.example              # Example environment variables
├── .gitignore               # Git ignore patterns
├── Makefile                 # Common development tasks
├── pyproject.toml           # Project metadata and dependencies
├── README.md                # Project documentation
├── api/
│   ├── __init__.py         # API package initialization
│   ├── main.py             # FastAPI application entry point
│   ├── main_test.py        # Tests for main application
│   ├── config.py           # Configuration management
│   ├── config_test.py      # Configuration tests
│   ├── database.py         # Database connection management
│   ├── database_test.py    # Database tests
│   ├── models.py           # Pydantic models
│   ├── models_test.py      # Model tests
│   └── routes/
│       ├── __init__.py     # Routes package initialization
│       ├── applications.py # Application endpoints
│       ├── applications_test.py # Application endpoint tests
│       ├── configurations.py # Configuration endpoints
│       └── configurations_test.py # Configuration endpoint tests
└── migrations/
    ├── 001_initial_schema.sql # Initial database schema
    ├── migrations.py          # Migration system implementation
    └── migrations_test.py     # Migration system tests
```

## 3. Database Schema

### 3.1 Migrations Table

```sql
CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 Applications Table

```sql
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,  -- ULID as string
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_applications_name ON applications(name);
```

### 3.3 Configurations Table

```sql
CREATE TABLE IF NOT EXISTS configurations (
    id TEXT PRIMARY KEY,  -- ULID as string
    application_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    settings TEXT NOT NULL,  -- JSON string
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    UNIQUE(application_id, name)
);

CREATE INDEX idx_configurations_application_id ON configurations(application_id);
CREATE INDEX idx_configurations_name ON configurations(name);
```

## 4. Data Models (Pydantic)

### 4.1 Application Models

```python
from pydantic import BaseModel, Field
from pydantic_extra_types.ulid import ULID
from datetime import datetime
from typing import Optional, List

class ApplicationBase(BaseModel):
    """Base application model with common fields."""
    name: str = Field(..., min_length=1, max_length=256)
    description: Optional[str] = Field(None, max_length=1024)

class ApplicationCreate(ApplicationBase):
    """Model for creating a new application."""
    pass

class ApplicationUpdate(ApplicationBase):
    """Model for updating an application."""
    pass

class Application(ApplicationBase):
    """Complete application model with all fields."""
    id: ULID
    created_at: datetime
    updated_at: datetime
    configuration_ids: List[ULID] = []
    
    model_config = {"from_attributes": True}
```

### 4.2 Configuration Models

```python
class ConfigurationBase(BaseModel):
    """Base configuration model with common fields."""
    application_id: ULID
    name: str = Field(..., min_length=1, max_length=256)
    description: Optional[str] = Field(None, max_length=1024)
    settings: dict[str, str] = Field(default_factory=dict)

class ConfigurationCreate(ConfigurationBase):
    """Model for creating a new configuration."""
    pass

class ConfigurationUpdate(BaseModel):
    """Model for updating a configuration."""
    name: Optional[str] = Field(None, min_length=1, max_length=256)
    description: Optional[str] = Field(None, max_length=1024)
    settings: Optional[dict[str, str]] = None

class Configuration(ConfigurationBase):
    """Complete configuration model with all fields."""
    id: ULID
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}
```

## 5. API Endpoints

All endpoints are prefixed with `/api/v1`.

### 5.1 Application Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/v1/applications` | Create application | ApplicationCreate | Application (201) |
| GET | `/api/v1/applications` | List all applications | - | List[Application] (200) |
| GET | `/api/v1/applications/{id}` | Get single application | - | Application (200) |
| PUT | `/api/v1/applications/{id}` | Update application | ApplicationUpdate | Application (200) |
| DELETE | `/api/v1/applications/{id}` | Delete application | - | 204 No Content |

### 5.2 Configuration Endpoints

| Method | Endpoint | Description | Query Params | Request Body | Response |
|--------|----------|-------------|--------------|--------------|----------|
| POST | `/api/v1/configurations` | Create configuration | - | ConfigurationCreate | Configuration (201) |
| GET | `/api/v1/configurations` | List configurations | application_id (optional) | - | List[Configuration] (200) |
| GET | `/api/v1/configurations/{id}` | Get single configuration | - | - | Configuration (200) |
| PUT | `/api/v1/configurations/{id}` | Update configuration | - | ConfigurationUpdate | Configuration (200) |
| DELETE | `/api/v1/configurations/{id}` | Delete configuration | - | - | 204 No Content |

### 5.3 Error Responses

All endpoints return consistent error responses:

```python
class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
```

Status codes:
- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate names)
- `500` - Internal Server Error

## 6. Implementation Details

### 6.1 Database Connection Management

**File: `api/database.py`**

```python
from contextlib import contextmanager
from sqlite3 import Connection, Row
import sqlite3
from pathlib import Path
from typing import Generator

class Database:
    """Database connection manager."""
    
    def __init__(self, db_path: str):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
    
    @contextmanager
    def get_connection(self) -> Generator[Connection, None, None]:
        """Context manager for database connections."""
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
```

### 6.2 Migration System

**File: `migrations/migrations.py`**

The migration system should:
1. Check for a `migrations` table; create if missing
2. Scan the `migrations/` folder for `*.sql` files
3. Sort files numerically by prefix (001_, 002_, etc.)
4. Execute any migrations not yet recorded in the migrations table
5. Record each successful migration with name and timestamp

**Key functions:**
- `get_pending_migrations(conn: Connection) -> List[str]`
- `apply_migration(conn: Connection, migration_file: Path) -> None`
- `run_migrations(db: Database) -> None`

### 6.3 Configuration Management

**File: `api/config.py`**

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    """Application configuration from environment variables."""
    
    database_path: str = "data/config.db"
    log_level: str = "INFO"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )

def get_settings() -> Settings:
    """Get application settings singleton."""
    return Settings()
```

### 6.4 FastAPI Application Setup

**File: `api/main.py`**

```python
from fastapi import FastAPI
from contextlib import asynccontextmanager
from api.config import get_settings
from api.database import Database
from migrations.migrations import run_migrations
from api.routes import applications, configurations
import logging

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    settings = get_settings()
    
    # Configure logging
    logging.basicConfig(level=settings.log_level)
    
    # Initialize database
    db = Database(settings.database_path)
    run_migrations(db)
    
    # Store database in app state
    app.state.db = db
    
    yield
    
    # Cleanup (if needed)

app = FastAPI(
    title="Config Service API",
    version="1.0.0",
    lifespan=lifespan
)

# Include routers
app.include_router(
    applications.router,
    prefix="/api/v1",
    tags=["applications"]
)
app.include_router(
    configurations.router,
    prefix="/api/v1",
    tags=["configurations"]
)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
```

### 6.5 Route Implementation Pattern

**Example: `api/routes/applications.py`**

```python
from fastapi import APIRouter, HTTPException, Request, status
from api.models import Application, ApplicationCreate, ApplicationUpdate
from pydantic_extra_types.ulid import ULID
from typing import List
import json
from datetime import datetime

router = APIRouter()

@router.post("/applications", response_model=Application, status_code=status.HTTP_201_CREATED)
async def create_application(app_data: ApplicationCreate, request: Request):
    """Create a new application."""
    db = request.app.state.db
    
    with db.get_connection() as conn:
        # Check for duplicate name
        existing = conn.execute(
            "SELECT id FROM applications WHERE name = ?",
            (app_data.name,)
        ).fetchone()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Application with name '{app_data.name}' already exists"
            )
        
        # Generate ULID
        app_id = str(ULID())
        now = datetime.utcnow()
        
        # Insert application
        conn.execute(
            """
            INSERT INTO applications (id, name, description, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (app_id, app_data.name, app_data.description, now, now)
        )
        
        # Fetch and return created application
        row = conn.execute(
            "SELECT * FROM applications WHERE id = ?",
            (app_id,)
        ).fetchone()
        
        return Application(
            id=ULID.from_str(row["id"]),
            name=row["name"],
            description=row["description"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            configuration_ids=[]
        )
```

## 7. Testing Strategy

### 7.1 Test Organization

- All test files use `_test.py` suffix
- Tests are co-located with the code they test
- Use pytest fixtures for common setup
- Aim for 80% coverage of critical paths

### 7.2 Test Fixtures

**Common fixtures in `api/conftest.py` (if needed):**

```python
import pytest
from api.database import Database
from pathlib import Path
import tempfile

@pytest.fixture
def test_db():
    """Create a temporary test database."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    
    db = Database(db_path)
    yield db
    
    # Cleanup
    Path(db_path).unlink(missing_ok=True)

@pytest.fixture
async def test_client():
    """Create a test client for the FastAPI app."""
    from httpx import AsyncClient
    from api.main import app
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
```

### 7.3 Test Examples

**Unit test example (`api/database_test.py`):**
```python
def test_database_connection(test_db):
    """Test database connection context manager."""
    with test_db.get_connection() as conn:
        result = conn.execute("SELECT 1").fetchone()
        assert result[0] == 1
```

**API test example (`api/routes/applications_test.py`):**
```python
@pytest.mark.asyncio
async def test_create_application(test_client):
    """Test creating a new application."""
    response = await test_client.post(
        "/api/v1/applications",
        json={"name": "Test App", "description": "Test description"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test App"
    assert "id" in data
```

## 8. Environment Configuration

### 8.1 .env.example

```env
# Database configuration
DATABASE_PATH=data/config.db

# Logging
LOG_LEVEL=INFO

# API Server
API_HOST=0.0.0.0
API_PORT=8000
```

### 8.2 .gitignore

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv/
*.egg-info/
dist/
build/

# Testing
.pytest_cache/
.coverage
htmlcov/
.tox/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Environment
.env

# Database
*.db
*.db-journal
data/

# UV
.uv/
uv.lock
```

## 9. Makefile

```makefile
.PHONY: test run migrate clean install

# Run all tests with coverage
test:
	uv run python -m pytest --cov=api --cov=migrations --cov-report=html --cov-report=term

# Start the development server
run:
	uv run python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

# Run database migrations
migrate:
	uv run python -m migrations.migrations

# Clean generated files and caches
clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .pytest_cache .coverage htmlcov dist build

# Install dependencies
install:
	uv sync
```

## 10. pyproject.toml

```toml
[project]
name = "config-service"
version = "1.0.0"
description = "REST API Configuration Service"
requires-python = ">=3.13"
dependencies = [
    "fastapi>=0.116.0",
    "pydantic>=2.11.0",
    "pydantic-settings>=2.0.0,<3.0.0",
    "uvicorn[standard]>=0.30.0",
    "python-ulid>=2.0.0,<3.0.0",
    "pydantic-extra-types>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.4.0",
    "pytest-cov>=5.0.0",
    "pytest-asyncio>=0.24.0",
    "httpx>=0.28.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.pytest.ini_options]
testpaths = ["api", "migrations"]
python_files = "*_test.py"
asyncio_mode = "auto"

[tool.coverage.run]
source = ["api", "migrations"]
omit = ["*_test.py", "*/__init__.py"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
]
```

## 11. README.md Structure

The README should include:

1. **Project Overview** - Brief description of the service
2. **Features** - List of capabilities
3. **Requirements** - Python 3.13+, uv
4. **Installation** - Setup instructions
5. **Configuration** - Environment variables
6. **Usage** - How to run the service
7. **API Documentation** - Link to /docs (FastAPI auto-generated)
8. **Development** - How to run tests, contribute
9. **Project Structure** - Overview of folders and files
10. **License** - If applicable

## 12. Implementation Steps

### Phase 1: Project Setup
1. Create project directory structure
2. Initialize `pyproject.toml` with dependencies
3. Create `.env.example` and `.gitignore`
4. Set up `Makefile`
5. Install dependencies with `uv sync`

### Phase 2: Database Layer
1. Implement `api/database.py` with connection manager
2. Write tests in `api/database_test.py`
3. Create `migrations/001_initial_schema.sql`
4. Implement `migrations/migrations.py`
5. Write tests in `migrations/migrations_test.py`

### Phase 3: Configuration & Models
1. Implement `api/config.py` with Pydantic Settings
2. Write tests in `api/config_test.py`
3. Implement `api/models.py` with all Pydantic models
4. Write tests in `api/models_test.py`

### Phase 4: API Routes - Applications
1. Implement `api/routes/applications.py` with all endpoints
2. Write comprehensive tests in `api/routes/applications_test.py`
3. Test all CRUD operations and error cases

### Phase 5: API Routes - Configurations
1. Implement `api/routes/configurations.py` with all endpoints
2. Write comprehensive tests in `api/routes/configurations_test.py`
3. Test all CRUD operations, filtering, and error cases

### Phase 6: Main Application
1. Implement `api/main.py` with FastAPI app and lifespan
2. Write tests in `api/main_test.py`
3. Test application startup, health check, and routing

### Phase 7: Documentation & Polish
1. Write comprehensive `README.md`
2. Verify all tests pass with `make test`
3. Check test coverage meets 80% target
4. Run the service with `make run` and test manually
5. Review code for PEP 8 compliance and type hints

## 13. Key Design Decisions

### 13.1 No ORM
- Direct SQL provides full control and transparency
- Simpler for a small service with straightforward queries
- Easier to optimize and debug
- Less abstraction overhead

### 13.2 ULID for Primary Keys
- Sortable by creation time
- URL-safe
- More compact than UUIDs
- Better for distributed systems (future-proof)

### 13.3 Co-located Tests
- Tests live next to the code they test
- Easier to find and maintain
- Encourages writing tests as you code
- Clear 1:1 relationship between code and tests

### 13.4 FastAPI Lifespan
- Clean startup/shutdown logic
- Database initialization happens once
- Proper resource management
- Follows FastAPI best practices

### 13.5 Settings via Pydantic
- Type-safe configuration
- Validation of environment variables
- Clear documentation of required settings
- Easy to extend

## 14. Error Handling Strategy

### 14.1 Database Errors
- Catch `sqlite3.IntegrityError` for constraint violations (409 Conflict)
- Catch `sqlite3.Error` for general database errors (500 Internal Server Error)
- Log all database errors for debugging

### 14.2 Validation Errors
- Pydantic automatically validates request bodies
- FastAPI returns 422 for validation errors
- Custom validators for business logic (e.g., name uniqueness)

### 14.3 Not Found Errors
- Check if resource exists before operations
- Return 404 with clear message indicating what wasn't found
- Include resource type and ID in error message

### 14.4 Logging
- Log all errors with appropriate levels (ERROR, WARNING, INFO)
- Include request context (endpoint, method, user agent if available)
- Use structured logging for easier parsing
- Log to stdout for container compatibility

## 15. Future Considerations (Not Implemented Now)

The following features are explicitly NOT part of this implementation but may be added later:

- Authentication and authorization
- Rate limiting
- Caching layer
- Database connection pooling
- Async database operations
- GraphQL API
- WebSocket support for real-time updates
- Multi-tenancy
- Audit logging
- Data encryption at rest
- Backup and restore functionality

## 16. Success Criteria

The implementation will be considered complete when:

1. ✅ All dependencies are correctly specified in `pyproject.toml`
2. ✅ Project structure matches the defined layout
3. ✅ All database tables are created via migrations
4. ✅ All API endpoints are implemented and functional
5. ✅ All code files have corresponding test files
6. ✅ Test coverage is at least 80% for critical paths
7. ✅ All tests pass with `make test`
8. ✅ Service starts successfully with `make run`
9. ✅ API documentation is accessible at `/docs`
10. ✅ All error cases return appropriate status codes
11. ✅ Code follows PEP 8 and includes type hints
12. ✅ README provides clear setup and usage instructions

## 17. Development Workflow

### 17.1 Initial Setup
```bash
# Clone or create project directory
cd config-service

# Install dependencies
uv sync

# Copy environment file
cp .env.example .env

# Run migrations
make migrate

# Run tests
make test

# Start server
make run
```

### 17.2 Daily Development
```bash
# Make code changes
# Write corresponding tests
# Run tests
make test

# Start server to test manually
make run

# Visit http://localhost:8000/docs for API documentation
```

### 17.3 Before Committing
```bash
# Run all tests
make test

# Clean up
make clean

# Verify service starts
make run
```

## 18. Conclusion

This implementation plan provides a complete roadmap for building a production-ready REST API Configuration Service. The plan emphasizes:

- **Simplicity** - No unnecessary complexity or dependencies
- **Testability** - Comprehensive test coverage with clear patterns
- **Maintainability** - Clean code structure and documentation
- **Developer Experience** - Easy setup and common tasks via Makefile
- **Type Safety** - Full type hints and Pydantic validation
- **Production Readiness** - Proper error handling, logging, and configuration

By following this plan step-by-step, you will create a robust, well-tested service that meets all specified requirements without adding unnecessary features or dependencies.
