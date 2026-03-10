# Environment Variables and Developer Scripts

## Overview

This document describes the environments Config Hub supports, environment variables for configuration, and developer scripts for working with the project.

## Environments

### Development
- Local development with hot-reload
- File-based SQLite at `data/config.db`
- API on port 8000, UI on port 3000
- Detailed logging (DEBUG/INFO)

### Testing
- In-memory SQLite databases (`:memory:`)
- Fresh database per test
- Fast execution with coverage reporting

### Production
- Single-instance deployment
- File-based SQLite (requires backup)
- INFO/WARNING logging
- Optimized builds
- **Limitation**: SQLite single-writer (no horizontal scaling)

## Environment Variables

Configure via `config-service/.env` (copy from `.env.example`):

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DATABASE_PATH` | string | `data/config.db` | Path to SQLite database file |
| `LOG_LEVEL` | string | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL) |
| `API_HOST` | string | `0.0.0.0` | Network interface to bind (0.0.0.0 = all, 127.0.0.1 = localhost) |
| `API_PORT` | integer | `8000` | Port for API server |

**Precedence**: System env vars > `.env` file > code defaults

## Developer Scripts

### Config Service (Python/FastAPI)
Location: `config-service/` | Tool: Makefile + uv

| Command | Purpose |
|---------|---------|
| `make install` | Install Python dependencies via uv |
| `make migrate` | Run database migrations |
| `make run` | Start dev server with hot-reload (port 8000) |
| `make test` | Run tests with coverage (target: 80%+) |
| `make clean` | Remove generated files and caches |

### Config Service Client Library (TypeScript)
Location: `config-service-client/` | Tool: npm

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run build` | Compile TypeScript to JavaScript (output: `dist/`) |
| `npm test` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |

### Admin UI (TypeScript/Vite)
Location: `ui/` | Tool: npm

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies (includes local client library) |
| `npm run dev` | Start Vite dev server (port 3000, proxies to API) |
| `npm run build` | Build for production (output: `dist/`) |
| `npm run preview` | Preview production build |
| `npm run type-check` | Validate TypeScript types |
| `npm test` | Run unit tests in watch mode |
| `npm run test:run` | Run tests once (CI/CD) |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:all` | Run all tests (unit + E2E) |

## Common Workflows

### Initial Setup
```bash
cd config-service && cp .env.example .env && make install && make migrate
cd ../config-service-client && npm install && npm run build
cd ../ui && npm install
```

### Daily Development
```bash
# Terminal 1: API server
cd config-service && make run

# Terminal 2: UI dev server
cd ui && npm run dev
```

### After Pulling Changes
```bash
# If dependencies changed
cd config-service && make install
cd config-service-client && npm install && npm run build
cd ui && npm install

# If migrations added
cd config-service && make migrate
```

### Testing
```bash
cd config-service && make test
cd config-service-client && npm run test:coverage
cd ui && npm run test:all
```

## When to Go Off-Script

Use direct commands when you need custom configuration:

**Custom server settings:**
```bash
uv run python -m uvicorn api.main:app --port 8080 --workers 4
```

**Specific tests:**
```bash
uv run python -m pytest api/database_test.py::test_create_application -v
```

**Database inspection:**
```bash
sqlite3 data/config.db "SELECT * FROM applications;"
```

**Custom builds:**
```bash
npx vite build --base=/admin/
npx tsc --watch
```

**Always use scripts first** - only go off-script when you need specific customization not covered by the standard commands.
