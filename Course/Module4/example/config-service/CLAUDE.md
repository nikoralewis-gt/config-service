# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: MANDATORY INSTRUCTION

If Claude has not already read @AGENTS.md during this session. It MUST do so NOW before proceeding with next steps. This file, and the files it references contain very important context when working with this code base.

## Project Structure

Configuration Service is a dual-component system:
- **svc/**: FastAPI-based Python backend with PostgreSQL database
- **ui/**: Framework-less TypeScript frontend using Web Components
- **ui/@config-client/**: Reusable TypeScript client library for the API

## Common Development Commands

### Setup
```bash
make install          # Install all dependencies (svc and ui)
make up               # Start PostgreSQL database
```

### Running Services
```bash
make run-svc          # Start API server at localhost:8000
make run-ui           # Start UI dev server at localhost:3000
```

### Testing
```bash
make test             # Run all tests (svc and ui)
make test-svc         # Run backend tests only
make test-ui          # Run frontend tests only
```

### Code Quality
```bash
make format           # Format Python code with ruff
cd svc && uv run ruff check .    # Lint Python code
cd ui && npm run type-check      # TypeScript type checking
```

### Database Operations
```bash
make db-migrate       # Apply database migrations
make db-reset         # Reset database (drop and recreate)
```

### Building
```bash
make ui-build         # Build UI for production
cd ui/@config-client && npm run build  # Build client library
```

## Architecture Overview

### Backend (svc/)
- **FastAPI** REST API with automatic OpenAPI docs at `/docs`
- **PostgreSQL** with JSONB for flexible configuration storage
- **Repository Pattern** with direct SQL (no ORM)
- **ULID** identifiers for applications
- **Pydantic** schemas for validation
- **Custom migration system** with version tracking

Key files:
- `api/main.py`: FastAPI application setup
- `api/endpoints.py`: API route handlers
- `api/repository.py`: Database access layer
- `api/schemas.py`: Pydantic models for validation

### Frontend (ui/)
- **Web Components** with Shadow DOM (no framework)
- **TypeScript** with strict type checking
- **Vite** for build tooling
- **Vitest** for testing with JSDOM

Key files:
- `src/main.ts`: Component registration
- `src/components/`: Web component implementations
- `src/services/config-client.ts`: API service layer

### Client Library (ui/@config-client/)
- Standalone TypeScript library for API access
- Comprehensive error handling and type safety
- Used by both the UI and available for external consumers

## API Endpoints

- `GET /api/v1/config/{name}`: Get configuration by app name (main client endpoint)
- `GET /api/v1/applications`: List all applications
- `POST /api/v1/applications`: Create new application
- `GET /api/v1/applications/{id}`: Get application by ID
- `PUT /api/v1/applications/{id}`: Update application
- `DELETE /api/v1/applications/{id}`: Delete application
- `GET /api/v1/applications/{id}/config`: Get app configuration
- `PUT /api/v1/applications/{id}/config`: Update app configuration
- `GET /health`: Health check

## Environment Setup

Backend requires `.env` file in `svc/` directory:
```bash
cd svc && cp .env.example .env
```

## Technology Stack

- **Python**: 3.13.5 with uv package manager
- **TypeScript**: 5.9.2
- **Database**: PostgreSQL 17.5
- **Testing**: pytest (backend), vitest (frontend)
- **Linting**: ruff (Python), TypeScript compiler
- **Build**: Vite (frontend), native Python packaging