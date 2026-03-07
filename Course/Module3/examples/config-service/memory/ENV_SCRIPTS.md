# Environments

The Configuration Service is designed to run in local development and production environments. All environments use the same PostgreSQL database schema and FastAPI backend with a TypeScript Web Components frontend.

## Local Environment

### Prerequisites
- **Python**: >=3.13 with `uv` package manager
- **Node.js**: >=24 with `npm` package manager
- **PostgreSQL**: >=17.5
- **Docker & Docker Compose**: For containerized database
- **Make**: For running project tasks

### Ports
- **API Service**: http://localhost:8000 (configurable via `PORT` env var, defaults to 8080)
- **UI Development**: http://localhost:3000 (Vite dev server)
- **Database**: localhost:5432 (containerized) or localhost:5433 (docker-compose mapping)
- **PgAdmin**: http://localhost:5050 (admin interface)

### Environment Setup

1. **Service Environment** (`svc/.env`):
   ```bash
   cd svc && cp .env.example .env
   ```

   Key variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `DEBUG`: Enable debug logging (true/false)
   - `LOG_LEVEL`: Logging level (INFO, DEBUG, WARNING, ERROR)
   - `HOST`: Server bind address (0.0.0.0 for development)
   - `PORT`: Server port (8080 default)

2. **Database Setup**:
   - Containerized: `make up` (starts PostgreSQL + PgAdmin via docker-compose)
   - Native: Install PostgreSQL 17.5+ locally and configure DATABASE_URL

3. **Dependencies**:
   - Backend: `uv sync --dev` (managed by uv virtual environment)
   - Frontend: `npm install` (local node_modules)
   - Client Library: `cd ui/@config-client && npm install`

## Non-Local Environment

Currently configured for local development only. Production deployment patterns to be established based on organizational infrastructure requirements.

Recommended deployment approach:
- **Backend**: Containerized FastAPI service with PostgreSQL database
- **Frontend**: Static file hosting (CDN or web server)
- **Database**: Managed PostgreSQL instance with connection pooling

## Environment-Specific Configs

### Debug Configuration
- **DEBUG=true**: Enables detailed error responses and debug logging
- **LOG_LEVEL**: Controls Python logging verbosity
  - `DEBUG`: Verbose logging including SQL queries
  - `INFO`: Standard operational logging (default)
  - `WARNING`: Warnings and errors only
  - `ERROR`: Errors only

### Database Configuration
- **Connection Pooling**: psycopg2 ThreadedConnectionPool (5-20 connections)
- **Migration Management**: Custom SQL-based system with version tracking
- **Health Checks**: Built-in database connectivity validation

### Frontend Configuration
- **Development**: Vite dev server with hot reload and API proxy
- **Production**: Static build output served from `dist/` directory
- **TypeScript**: Strict mode with comprehensive type checking

## Deployment Rules

### Local Development
- Database migrations run automatically on service startup
- No build step required for development (live reloading)
- Environment variables loaded from `.env` files

### Production Deployment
- **Backend**:
  - Run database migrations before deployment: `make db-migrate`
  - Build and deploy FastAPI container
  - Configure production DATABASE_URL and environment variables
- **Frontend**:
  - Build static assets: `make ui-build`
  - Deploy `ui/dist/` contents to static hosting
  - Configure API endpoint URLs for production backend

### CI/CD Pipeline Requirements
- Run full test suite: `make test`
- Code quality checks: `make format`, `make lint`, `cd ui && npm run type-check`
- Coverage validation: `make coverage-svc` (Backend >=80% required)
- Build validation: `make ui-build`

## Task Running

### IMPORTANT: Use Make Commands Only

**CRITICAL CONSISTENCY RULE**: All development tasks, verification processes, and regular operations MUST use Make commands. This ensures consistency across the entire development team and prevents configuration drift.

**When to use Make vs direct commands**:
- ✅ **ALWAYS Use Make For**: Development workflows, testing, building, deployment, code quality checks
- ⚠️  **Direct Commands Only For**: Specific troubleshooting, debugging individual components, one-off investigations

### Primary Task Runner: Make
All development tasks are orchestrated through the Makefile. Use `make help` to see all available commands:

```bash
make help          # Show available commands
make install       # Install all dependencies (svc + ui)
make test          # Run all tests (svc + ui)
make up            # Start PostgreSQL database
make run-svc       # Start API server (localhost:8000)
make run-ui        # Start UI dev server (localhost:3000)
```

### Backend Tasks (Use Make Commands)
```bash
# Development workflow - USE THESE COMMANDS:
make run-svc       # Start development server
make test-svc      # Run backend tests
make db-migrate    # Apply database migrations
make db-reset      # Reset database (drop and recreate)
make format        # Code formatting with ruff
make lint          # Code linting with ruff
make coverage-svc  # Tests with coverage analysis (>=80% required)
```

### Frontend Tasks (Use Make + npm)
```bash
# Development workflow - USE THESE COMMANDS:
make run-ui        # Start Vite dev server (port 3000)
make test-ui       # Run Vitest tests
make ui-build      # Build for production (TypeScript + Vite)
make coverage-ui   # Tests with coverage analysis

# TypeScript validation (npm command - no Make equivalent yet):
cd ui && npm run type-check    # TypeScript validation
```

### Database Management
```bash
make db-migrate  # Apply pending migrations
make db-reset    # Drop and recreate all tables
make up          # Start containerized PostgreSQL + PgAdmin
```

### Complete Development Workflow Commands
```bash
# Setup and Installation
make install     # Install all dependencies (svc + ui)
make up          # Start PostgreSQL database

# Development Servers
make run-svc     # Start API development server (port 8000)
make run-ui      # Start UI development server (port 3000)

# Testing and Verification (REQUIRED BEFORE COMMITS)
make test        # Run all tests (svc + ui)
make lint        # Run Python linting checks
make format      # Format Python code with ruff
cd ui && npm run type-check  # TypeScript validation

# Coverage Analysis
make coverage-svc     # Backend test coverage (>=80% required)
make coverage-ui      # Frontend test coverage

# Database Operations
make db-migrate  # Apply database migrations
make db-reset    # Reset database (drop and recreate)

# Build and Deployment
make ui-build    # Build UI for production deployment

# Cleanup
make clean       # Remove generated files and caches
```

### Quick Verification Workflow
```bash
# Run this sequence before any commit:
make test && make lint && make format && cd ui && npm run type-check
```
