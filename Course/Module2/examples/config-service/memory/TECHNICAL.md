# Configuration Service Technical Details

## Technology Stack

### Backend (Service)
- **Language**: Python >=3.13
- **Framework**: FastAPI
- **Database**: PostgreSQL with JSONB support
- **Database Access**: psycopg2 (direct SQL, no ORM)
- **Validation**: Pydantic
- **Unique IDs**: ULID (Universally Unique Lexicographically Sortable Identifier)
- **API Documentation**: OpenAPI via FastAPI
- **Testing**: pytest

### Frontend (UI)
- **Language**: TypeScript
- **Component Model**: Web Components (Custom Elements + Shadow DOM)
- **Build Tool**: Vite
- **Testing**: Vitest
- **No Framework**: Intentionally framework-less (no React, Angular, Vue)

## Development Environment

### Prerequisites
- Python >=3.13
- Node.js >=24
- PostgreSQL >=17
- Docker and Docker Compose (optional, for containerized development)

## Database Configuration

### Connection
- Connection pooling with psycopg2.pool.ThreadedConnectionPool
- Async database operations using ThreadPoolExecutor
- Environment-based configuration via DATABASE_URL

### Schema
- Two primary tables: applications and configurations
- ULID primary keys (26 character string)
- JSONB for flexible configuration storage
- Automatic timestamp tracking (created_at, updated_at)
- Database migrations using raw SQL files

## API Design

### Endpoints
- RESTful API design
- JSON request/response format
- Versioned API paths (/api/v1/...)
- Comprehensive error handling
- Consistent response structure

### Authentication & Security
- Input validation using Pydantic
- SQL injection protection via parameterized queries
- Rate limiting (to be implemented)
- Authentication (to be implemented)

### Validation Constraints
- **Application Names**: 
  - Alphanumeric characters, underscores, and hyphens only (regex: `^[a-zA-Z0-9_\-]+$`)
  - 1-255 characters in length
  - Cannot be empty or whitespace-only
  - Must be unique across all applications
- **Application Descriptions**: 
  - Maximum 1000 characters
  - Optional field (can be null)
  - Empty strings converted to null
- **Configuration Data**: 
  - Must be valid JSON object (dictionary/map structure)
  - Cannot be empty
  - Maximum payload size: 1MB (1,048,576 bytes)
  - Stored as JSONB in PostgreSQL for efficient querying
- **ULID Validation**: 
  - Exactly 26 characters in length
  - Base32 encoding using characters: 0-9, A-Z (excluding I, L, O, U)
  - Case-insensitive input, stored as uppercase
  - Lexicographically sortable by creation time
- **Database Constraints**: 
  - Foreign key relationships enforced with CASCADE delete
  - Automatic timestamp tracking (created_at, updated_at)
  - JSONB GIN indexing for configuration queries

## Testing Strategy

### Backend Testing
- Unit tests with pytest
- Repository tests with database fixtures
- Endpoint tests with FastAPI TestClient
- Migration tests for schema validation

### Frontend Testing
- Component tests with Vitest
- Simple tests for basic functionality
- Integration tests for component interactions
- Accessibility tests for UI components

## Deployment

### Service Deployment
- Docker container deployment
- Environment variable configuration
- Health check endpoint for monitoring
- Database migration on startup

### UI Deployment
- Static file hosting
- Build process: `npm run build`
- Output directory: `dist/`
- No server-side rendering required

## Performance Considerations

### Backend
- Connection pooling for database efficiency
- Async database operations
- JSONB indexing for query performance
- Lightweight, direct SQL queries

### Frontend
- Minimal dependencies
- Native browser APIs
- Efficient DOM updates
- Component-scoped CSS

## Development Workflow

### Code Organization
- Modular code structure
- Clear separation of concerns
- Repository pattern for data access
- Component-based UI architecture

### Version Control
- Feature branch workflow
- Pull request reviews
- Semantic versioning
- Conventional commits

### CI/CD
- Automated testing
- Linting and type checking
- Build validation
- Containerized deployment
