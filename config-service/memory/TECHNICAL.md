# TECHNICAL.md

<!--
Instructions for the assistant:
Populate this document using the referenced source files.
Maintain structure. Do not invent patterns not present in the codebase.
-->

## Overview

Config Hub is implemented as a Python 3.13+ REST API service using FastAPI for the web framework and SQLite for data persistence. The implementation emphasizes simplicity, transparency, and type safety through direct SQL queries (no ORM), comprehensive type hints, and Pydantic validation. The service uses ULID-based identifiers for sortable, URL-safe primary keys and follows a clean separation between API models, route handlers, and database operations.

## Technology Stack

### Backend (Service)
- **Language**: Python >=3.13
- **Framework**: FastAPI 0.116+
- **Database**: SQLite 3
- **Database Access**: Direct SQL (no ORM)
- **Validation**: Pydantic 2.11+
- **Settings Management**: Pydantic Settings 2.0+
- **Unique IDs**: ULID (python-ulid 2.0+)
- **ASGI Server**: Uvicorn 0.30+
- **API Documentation**: OpenAPI via FastAPI (automatic)
- **Testing**: pytest 8.4+, pytest-asyncio 0.24+, httpx 0.28+
- **Package Manager**: uv (fast Python package installer)

### Frontend (UI)
- **Language**: TypeScript
- **Component Model**: Web Components (Custom Elements + Shadow DOM)
- **Build Tool**: Vite
- **Testing**: Vitest
- **No Framework**: Intentionally framework-less (no React, Angular, Vue)

## Development Environment

### Prerequisites
- Python >=3.13
- Node.js (for UI development)
- uv package manager
- SQLite 3 (included with Python)

### Setup
```bash
# Install dependencies
uv sync

# Copy environment configuration
cp .env.example .env

# Run migrations
make migrate

# Start development server
make run
```

## Coding Conventions

### Python Style
- **PEP 8 Compliance**: Follow Python style guidelines
- **Type Hints**: Full type annotations throughout codebase
- **Docstrings**: Module, class, and function documentation using Google style
- **Naming**: 
  - `snake_case` for functions, variables, and modules
  - `PascalCase` for classes
  - `UPPER_CASE` for constants

### File Organization
- **Co-located Tests**: Test files use `_test.py` suffix and live alongside source files
- **Modular Routes**: Route handlers organized in `api/routes/` directory
- **Clear Separation**: Models, database, config, and routes in separate modules

### Code Quality
- **Test Coverage**: Target 80%+ coverage
- **Type Safety**: Use mypy-compatible type hints
- **Validation**: Pydantic models for all API inputs/outputs
- **Error Handling**: Explicit exception handling with appropriate HTTP status codes

## Patterns

### Direct SQL Pattern
The codebase uses raw SQL queries instead of an ORM for transparency and control:

```python
# Example from applications.py
row = conn.execute(
    "SELECT * FROM applications WHERE id = ?",
    (id,)
).fetchone()
```

**Rationale**: Direct SQL provides full visibility into database operations, avoids ORM complexity, and maintains explicit data access patterns.

### Database Connection Management
The `Database` class provides context-managed connections:

```python
# From database.py
with db.get_connection() as conn:
    # Execute queries
    result = conn.execute("SELECT * FROM applications").fetchall()
```

**Features**:
- Context manager ensures proper connection cleanup
- Row factory returns dict-like rows for easy access
- Foreign key constraints enabled by default

### Request/Response Model Separation
Separate Pydantic models for different operations:

```python
# From models.py
class ApplicationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=256)
    description: Optional[str] = Field(None, max_length=1024)

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(ApplicationBase):
    pass

class Application(ApplicationBase):
    id: str
    created_at: datetime
    updated_at: datetime
    configuration_ids: List[str] = Field(default_factory=list)
```

**Benefits**: Clear separation between input validation and response serialization, supports partial updates.

### Lifespan Management
FastAPI lifespan context manager handles startup/shutdown:

```python
# From main.py
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    settings = get_settings()
    db = Database(settings.database_path)
    run_migrations(db)
    app.state.db = db
    
    yield
    
    # Shutdown (cleanup if needed)
```

**Purpose**: Initialize database, run migrations, configure logging before accepting requests.

### Dependency Injection via App State
Database instance stored in FastAPI app state:

```python
# From route handlers
async def create_application(app_data: ApplicationCreate, request: Request):
    db = request.app.state.db
    # Use db for queries
```

**Advantage**: Avoids global state while making database accessible to all route handlers.

### ULID Generation
Sortable, URL-safe identifiers for primary keys:

```python
# From applications.py
import uuid
from ulid import ULID

app_id = str(ULID.from_uuid(uuid.uuid4()))
```

**Benefits**: Time-based sorting, URL-safe, distributed-friendly generation.

## Error Handling

### HTTP Exception Pattern
Route handlers raise HTTPException with appropriate status codes:

```python
# 404 Not Found
if not row:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Application with id '{id}' not found"
    )

# 409 Conflict
if existing:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=f"Application with name '{app_data.name}' already exists"
    )
```

### Database Constraint Handling
SQLite integrity errors caught and translated to HTTP errors:

```python
try:
    conn.execute(
        "INSERT INTO applications (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (app_id, app_data.name, app_data.description, now, now)
    )
except sqlite3.IntegrityError as e:
    logger.error(f"Database integrity error: {e}")
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Application with this name already exists"
    )
```

### Validation Errors
Pydantic automatically validates request bodies and returns 422 Unprocessable Entity for invalid data.

### Common HTTP Status Codes
- **200 OK**: Successful GET, PUT
- **201 Created**: Successful POST
- **204 No Content**: Successful DELETE
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Duplicate name or constraint violation
- **422 Unprocessable Entity**: Invalid request data (automatic via Pydantic)

## Logging

### Configuration
Standard Python logging configured in lifespan manager:

```python
# From main.py
logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
```

### Usage Pattern
Module-level loggers for structured logging:

```python
# From route handlers
import logging

logger = logging.getLogger(__name__)

# Log errors
logger.error(f"Database integrity error: {e}")

# Log info
logger.info("Database migrations completed")
```

### Log Levels
- **DEBUG**: Detailed diagnostic information
- **INFO**: General informational messages (default)
- **WARNING**: Warning messages
- **ERROR**: Error messages
- **CRITICAL**: Critical errors

### Configuration
Log level controlled via environment variable:
```bash
LOG_LEVEL=DEBUG  # or INFO, WARNING, ERROR, CRITICAL
```

## Configuration

### Environment-Based Settings
Pydantic Settings for configuration management:

```python
# From config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_path: str = "data/config.db"
    log_level: str = "INFO"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )
```

### Available Settings
- **DATABASE_PATH**: Path to SQLite database file (default: `data/config.db`)
- **LOG_LEVEL**: Logging level (default: `INFO`)
- **API_HOST**: API server host (default: `0.0.0.0`)
- **API_PORT**: API server port (default: `8000`)

### Environment File
Settings loaded from `.env` file or environment variables:

```bash
# .env.example
DATABASE_PATH=data/config.db
LOG_LEVEL=INFO
API_HOST=0.0.0.0
API_PORT=8000
```

### Usage
```python
from api.config import get_settings

settings = get_settings()
db = Database(settings.database_path)
```

## Database Schema

### Tables
**applications**
- `id` (TEXT PRIMARY KEY): ULID identifier
- `name` (TEXT NOT NULL UNIQUE): Application name
- `description` (TEXT): Optional description
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**configurations**
- `id` (TEXT PRIMARY KEY): ULID identifier
- `application_id` (TEXT NOT NULL): Foreign key to applications
- `name` (TEXT NOT NULL): Configuration name
- `description` (TEXT): Optional description
- `settings` (TEXT NOT NULL): JSON-encoded settings (dict[str, str])
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp
- UNIQUE constraint on (application_id, name)
- CASCADE delete on application deletion

### Indexes
- `idx_applications_name`: Index on application name
- `idx_configurations_application_id`: Index on configuration application_id
- `idx_configurations_name`: Index on configuration name

### Migrations
Sequential SQL migration files in `migrations/` directory:
- `001_initial_schema.sql`: Initial schema creation
- Tracked in `migrations` table
- Applied automatically on startup

## Testing Strategy

### Test Organization
- **Co-located Tests**: Tests live alongside source files with `_test.py` suffix
- **Test Discovery**: pytest finds all `*_test.py` files
- **Async Support**: pytest-asyncio for async test functions

### Test Types
**Unit Tests**: Test individual functions and classes
```python
# From database_test.py
def test_database_connection():
    db = Database(":memory:")
    with db.get_connection() as conn:
        result = conn.execute("SELECT 1").fetchone()
        assert result[0] == 1
```

**Integration Tests**: Test API endpoints
```python
# From routes tests
async def test_create_application(client):
    response = await client.post(
        "/api/v1/applications",
        json={"name": "test-app", "description": "Test"}
    )
    assert response.status_code == 201
```

### Running Tests
```bash
# All tests with coverage
make test

# Specific test file
uv run python -m pytest api/database_test.py

# With verbose output
uv run python -m pytest -v
```

### Coverage
- Target: 80%+ coverage
- Excludes: Test files, `__init__.py` files
- Report: Generated in terminal and HTML format

## Validation Constraints

### Application Validation
- **Name**: 
  - 1-256 characters
  - Required (non-empty)
  - Must be unique
- **Description**: 
  - 0-1024 characters
  - Optional (can be null)

### Configuration Validation
- **Application ID**: 
  - Required
  - Must reference existing application
- **Name**: 
  - 1-256 characters
  - Required
  - Must be unique per application
- **Description**: 
  - 0-1024 characters
  - Optional
- **Settings**: 
  - Must be valid dict[str, str]
  - Required (cannot be empty)
  - Stored as JSON text in SQLite

### ULID Validation
- **Format**: 26-character Base32 string
- **Characters**: 0-9, A-Z (case-insensitive)
- **Sortable**: Lexicographically sortable by creation time

## Deployment

### Service Deployment
- **Single Instance**: Designed for single-instance deployment with SQLite
- **Database Persistence**: SQLite file must be persisted across restarts
- **Migration on Startup**: Automatic schema migration during application startup
- **Health Check**: `/health` endpoint for monitoring
- **Process Management**: Run via uvicorn, managed by systemd/supervisord/Docker

### Running the Service
```bash
# Development
make run

# Production (via uvicorn directly)
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000
```

### UI Deployment
- **Static Files**: Build output in `dist/` directory
- **Build Command**: `npm run build`
- **Hosting**: Any static file server (nginx, Apache, CDN)
- **No Server Required**: Pure client-side application

## Performance Considerations

### Backend
- **Direct SQL**: Avoids ORM overhead for better performance
- **SQLite Performance**: Excellent read performance for single-instance deployments
- **Indexes**: Database indexes on common query patterns (name lookups, foreign keys)
- **Connection Management**: Context managers ensure proper cleanup

### Limitations
- **Single Writer**: SQLite supports only one writer at a time
- **Horizontal Scaling**: Not supported with current SQLite implementation
- **Migration Path**: For multi-instance deployments, migrate to PostgreSQL/MySQL

### Frontend
- **Minimal Dependencies**: Native Web Components reduce bundle size
- **Efficient Updates**: Component-scoped rendering
- **No Framework Overhead**: Direct DOM manipulation

## Examples

### Creating a Pydantic Model
```python
from pydantic import BaseModel, Field
from typing import Optional

class ApplicationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=256)
    description: Optional[str] = Field(None, max_length=1024)
```

### Database Query Pattern
```python
with db.get_connection() as conn:
    row = conn.execute(
        "SELECT * FROM applications WHERE id = ?",
        (app_id,)
    ).fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
```

### Route Handler Structure
```python
@router.post("/applications", response_model=Application, status_code=201)
async def create_application(app_data: ApplicationCreate, request: Request):
    db = request.app.state.db
    
    with db.get_connection() as conn:
        # Generate ID and timestamps
        app_id = str(ULID.from_uuid(uuid.uuid4()))
        now = datetime.utcnow()
        
        # Insert into database
        conn.execute(
            "INSERT INTO applications (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (app_id, app_data.name, app_data.description, now, now)
        )
        
        # Return created resource
        return Application(id=app_id, name=app_data.name, ...)
```

### Error Handling Pattern
```python
try:
    conn.execute("INSERT INTO applications ...", params)
except sqlite3.IntegrityError as e:
    logger.error(f"Database integrity error: {e}")
    raise HTTPException(
        status_code=409,
        detail="Application with this name already exists"
    )
```

### Configuration Usage
```python
from api.config import get_settings

settings = get_settings()
db = Database(settings.database_path)
logger.setLevel(settings.log_level)
```
