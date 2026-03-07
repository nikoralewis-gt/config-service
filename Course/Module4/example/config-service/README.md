# Configuration Service

A centralized configuration management service that supports application configurations across the organization.

## Overview

This service (in `svc/`) provides HTTP API endpoints that applications can call to fetch their configuration data at runtime, eliminating the need for manual configuration inclusion in deployments. This project also contains a web UI (in `ui/`) that can be used to create and edit application configuration sets.

## Features

- **Centralized Configuration**: Single source of truth for all application configurations
- **Web UI Admin**: Web UI for centrailised, remote administration
- **Runtime Access**: Applications fetch configuration at startup/runtime
- **Cross-Platform**: HTTP API supports web, desktop, and mobile applications
- **Health Monitoring**: Built-in health check endpoint

## Technology Stack

- **Python**: 3.13.5
- **TypeScript**: 5.9.2
- **Web Framework**: FastAPI 0.116.1
- **Database**: PostgreSQL 17.5
- **Package Managers**: uv & npm
- **Testing**: pytest & vitest
- **Code Quality**: ruff (linting/formatting)
- **Development**: VS Code
- **Browser**: Only WebComponents and fetch (no ui frameworks)

## Quick Start

### Prerequisites

- Make
- VS Code
- Node + npm
- python3 + uv

### Development Setup

1. **Clone and Open** in VS Code:
   ```sh
   git clone <repository-url>
   cd course-overview
   code .
   ```

2. **Install dependencies** for svc and ui
   ```sh
   make install
   ```

   [Install instructions for `uv`](https://docs.astral.sh/uv/getting-started/installation/)

3. **Run tests** for svc and ui:
   ```sh
   make test
   ```

4. **View other scripts**:
   ```sh
   make help
   ```

### Running the Service

```bash
# Start the database
make up

# Start the development service
make run-svc

# Start the UI development server
make run-ui
```

The service will be available at:
- Admin UI: http://localhost:3000
- API: http://localhost:8000
- Health Check: http://localhost:8000/health
- API Documentation: http://localhost:8000/docs

## Environment Variables

See `.env` for a list of key environment variables 

```sh
# Create a .env file from the example
cd svc && cp .env{.example,}
```
