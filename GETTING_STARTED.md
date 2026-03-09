# Getting Started with Config Hub

This guide will help you get the complete Config Hub system up and running on your local machine.

## System Overview

Config Hub consists of three components that work together:

1. **Config Service API** - Python/FastAPI backend that manages applications and configurations
2. **Config Service Client Library** - TypeScript library providing a type-safe API client
3. **Admin UI** - Web-based interface for managing configurations

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.13+** - [Download](https://www.python.org/downloads/)
- **uv** - Fast Python package manager - [Install](https://github.com/astral-sh/uv)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** or **pnpm** - Package manager (comes with Node.js)
- **SQLite 3** - Database (included with Python)

## Quick Start

Follow these steps in order to get the full system running:

### Step 1: Start the Config Service API

The API must be running before the UI can function.

```bash
# Navigate to the config service directory
cd config-service

# Install Python dependencies
uv sync

# Set up environment variables
cp .env.example .env

# Run database migrations
make migrate

# Start the development server
make run
```

**Verify:** The API should now be running at http://localhost:8000

- API Documentation: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

### Step 2: Build the Client Library

The client library must be built before the UI can use it.

```bash
# Navigate to the client library directory
cd config-service-client

# Install dependencies
npm install

# Build the library
npm run build
```

**Verify:** The `dist/` directory should contain compiled JavaScript and TypeScript declarations.

### Step 3: Start the Admin UI

The UI depends on both the API (running) and the client library (built).

```bash
# Navigate to the UI directory
cd ui

# Install dependencies (this links to the client library)
npm install

# Start the development server
npm run dev
```

**Verify:** The UI should now be running at http://localhost:3000

## Component Details

### Config Service API (Port 8000)

**Location:** `config-service/`

**Key Commands:**
- `make run` - Start development server
- `make test` - Run tests with coverage
- `make migrate` - Run database migrations
- `make clean` - Clean generated files

**Configuration:**
- Edit `.env` file to customize settings
- Default database: `data/config.db`
- Default port: 8000

**Endpoints:**
- `/api/v1/applications` - Application management
- `/api/v1/configurations` - Configuration management
- `/docs` - Interactive API documentation
- `/health` - Health check endpoint

### Config Service Client Library

**Location:** `config-service-client/`

**Key Commands:**
- `npm run build` - Build the library
- `npm test` - Run tests

**Important:**
- Must be rebuilt after any changes to source files
- UI automatically picks up changes via symlink
- Restart UI dev server after rebuilding

### Admin UI (Port 3000)

**Location:** `ui/`

**Key Commands:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests

**Configuration:**
- Vite proxy automatically forwards `/api` requests to http://localhost:8000
- Change API URL in `vite.config.ts` if needed

## Startup Checklist

Use this checklist to ensure everything is running correctly:

- [ ] Python 3.13+ installed
- [ ] uv package manager installed
- [ ] Node.js 18+ installed
- [ ] Config Service API running on http://localhost:8000
- [ ] API docs accessible at http://localhost:8000/docs
- [ ] Client library built (dist/ folder exists)
- [ ] Admin UI running on http://localhost:3000
- [ ] UI can load and display applications

## Common Issues

### Port Already in Use

**Problem:** Port 8000 or 3000 is already in use.

**Solution:**
- For API: Edit `.env` and change `API_PORT`
- For UI: Edit `vite.config.ts` and change `server.port`

### API Connection Failed

**Problem:** UI shows "Failed to load applications" or similar errors.

**Solution:**
1. Verify API is running: http://localhost:8000/docs
2. Check browser console for CORS errors
3. Ensure Vite proxy is configured correctly in `vite.config.ts`

### Client Library Not Found

**Problem:** UI shows "Cannot find module '@config-hub/client'"

**Solution:**
1. Build the client library: `cd config-service-client && npm run build`
2. Reinstall UI dependencies: `cd ui && npm install`
3. Restart UI dev server

### Database Errors

**Problem:** API fails to start with database errors.

**Solution:**
1. Ensure migrations have run: `cd config-service && make migrate`
2. Check database file exists: `config-service/data/config.db`
3. Verify database permissions

### Changes Not Reflected

**Problem:** Code changes don't appear in running application.

**Solution:**
- **API:** FastAPI auto-reloads, but check terminal for errors
- **Client Library:** Rebuild with `npm run build`
- **UI:** Vite auto-reloads, but restart if needed

## Development Workflow

### Making Changes to the API

1. Edit files in `config-service/api/`
2. FastAPI automatically reloads
3. Run tests: `make test`
4. Check API docs: http://localhost:8000/docs

### Making Changes to the Client Library

1. Edit files in `config-service-client/src/`
2. Rebuild: `npm run build`
3. UI automatically picks up changes (via symlink)
4. Restart UI dev server if needed

### Making Changes to the UI

1. Edit files in `ui/src/`
2. Vite automatically reloads
3. Run tests: `npm test`
4. Check browser console for errors

## Testing

### API Tests

```bash
cd config-service
make test
```

### Client Library Tests

```bash
cd config-service-client
npm test
```

### UI Tests

```bash
cd ui

# Unit tests
npm test

# End-to-end tests
npm run test:e2e
```

## Production Build

### Build the API

The API doesn't require a build step. Deploy the source code and:

```bash
cd config-service
uv sync
make migrate
make run
```

### Build the Client Library

```bash
cd config-service-client
npm install
npm run build
```

### Build the UI

```bash
cd ui
npm install
npm run build
```

The production files will be in `ui/dist/` and can be served by any static file server.

## Next Steps

- Read the [Integration Guide](INTEGRATION_GUIDE.md) for details on the client library
- Explore the [API Documentation](http://localhost:8000/docs) to understand available endpoints
- Review individual component READMEs for detailed information:
  - [Config Service API](config-service/README.md)
  - [Client Library](config-service-client/README.md)
  - [Admin UI](ui/README.md)

## Getting Help

- Check the component-specific README files for detailed documentation
- Review the API documentation at http://localhost:8000/docs
- Check browser console and terminal output for error messages
- Ensure all prerequisites are installed and up to date

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Admin UI (http://localhost:3000)              │ │
│  │         TypeScript + Web Components                    │ │
│  └────────────────────┬───────────────────────────────────┘ │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        │ Uses
                        ▼
         ┌──────────────────────────────┐
         │   Config Service Client      │
         │   TypeScript Library         │
         │   (@config-hub/client)       │
         └──────────────┬───────────────┘
                        │
                        │ HTTP/JSON
                        ▼
         ┌──────────────────────────────┐
         │   Config Service API         │
         │   http://localhost:8000      │
         │   Python + FastAPI           │
         └──────────────┬───────────────┘
                        │
                        │ SQL
                        ▼
         ┌──────────────────────────────┐
         │   SQLite Database            │
         │   data/config.db             │
         └──────────────────────────────┘
```

## Summary

You now have a complete Config Hub system running locally:

- **API:** http://localhost:8000 (backend service)
- **UI:** http://localhost:3000 (admin interface)
- **Docs:** http://localhost:8000/docs (API documentation)

All three components work together to provide a complete configuration management solution.
