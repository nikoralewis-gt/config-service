# Configuration Service Technical Details

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

## Database Configuration

### Connection
- File-based SQLite database
- Context-managed connections via Database class
- Foreign key constraints enabled by default
- Row factory returns dict-like rows for easy access

### Schema
- Two primary tables: applications and configurations
- ULID primary keys (26 character string)
- JSON-encoded settings stored as TEXT
- Automatic timestamp tracking (created_at, updated_at)
- Database migrations using sequential SQL files

## API Design

### Endpoints
- RESTful API design
- JSON request/response format
- Versioned API paths (/api/v1/...)
- Comprehensive error handling with appropriate HTTP status codes
- Automatic OpenAPI documentation at /docs and /redoc

### Validation & Security
- Input validation using Pydantic models
- SQL injection protection via parameterized queries
- Type-safe request/response handling
- Comprehensive field validation with constraints

### Validation Constraints
- **Application Names**: 
  - 1-256 characters in length
  - Required (non-empty)
  - Must be unique across all applications
- **Application Descriptions**: 
  - Maximum 1024 characters
  - Optional field (can be null)
- **Configuration Names**:
  - 1-256 characters in length
  - Required (non-empty)
  - Must be unique per application
- **Configuration Settings**: 
  - Must be valid dict[str, str]
  - Required (cannot be empty)
  - Stored as JSON text in SQLite
- **ULID Validation**: 
  - 26-character Base32 string
  - Lexicographically sortable by creation time
  - URL-safe identifiers

## Testing Strategy

### Backend Testing
- Unit tests with pytest
- Co-located tests with `_test.py` suffix
- Integration tests with FastAPI TestClient
- In-memory SQLite databases for test isolation
- Async test support via pytest-asyncio
- Target: 80%+ test coverage

### Frontend Testing
- Component tests with Vitest
- Unit tests for individual components
- Integration tests for component interactions
- Simple, focused test cases

## Deployment

### Service Deployment
- Single-instance deployment with SQLite
- Docker container support
- Environment variable configuration
- Database migrations run automatically on startup
- Health check endpoint (/health) for monitoring

### UI Deployment
- Static file hosting
- Build process: `npm run build`
- Output directory: `dist/`
- No server-side rendering required

## Performance Considerations

### Backend
- Direct SQL avoids ORM overhead
- SQLite provides excellent read performance for single-instance deployments
- Database indexes on common query patterns (name lookups, foreign keys)
- Context managers ensure proper connection cleanup

### Limitations
- SQLite single-writer limitation (not suitable for horizontal scaling)
- For multi-instance deployments, migration to PostgreSQL/MySQL would be required

### Frontend
- Minimal dependencies with native Web Components
- Efficient component-scoped rendering
- No framework overhead

## Development Workflow

### Code Organization
- Modular route handlers in `api/routes/` directory
- Clear separation: models, database, config, routes in separate modules
- Co-located tests alongside source files

### Coding Conventions
- **Python Style**: PEP 8 compliance, full type hints, Google-style docstrings
- **Naming**: snake_case for functions/variables, PascalCase for classes, UPPER_CASE for constants
- **Error Handling**: Explicit HTTP exceptions with appropriate status codes
- **Logging**: Structured logging with configurable log levels

### Version Control
- Git-based workflow
- Conventional commits recommended
- Clean separation of concerns for easier code review
