# Config Service API

A REST API Configuration Service built with Python and FastAPI for managing applications and their configuration settings.

## Features

- **Application Management**: Create, read, update, and delete applications
- **Configuration Management**: Manage configuration settings for each application with name/value pairs
- **RESTful API**: Clean REST endpoints with proper HTTP status codes
- **Type Safety**: Full type hints and Pydantic validation
- **Comprehensive Testing**: Unit tests with 80%+ coverage
- **No ORM**: Direct SQL for transparency and control
- **ULID Primary Keys**: Sortable, URL-safe identifiers

## Requirements

- Python 3.13+
- [uv](https://github.com/astral-sh/uv) - Fast Python package installer and resolver

## Installation

1. Clone the repository:
```bash
cd config-service
```

2. Install dependencies:
```bash
uv sync
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Run database migrations:
```bash
make migrate
```

## Configuration

The service uses environment variables for configuration. See `.env.example` for available options:

- `DATABASE_PATH`: Path to SQLite database file (default: `data/config.db`)
- `LOG_LEVEL`: Logging level (default: `INFO`)
- `API_HOST`: API server host (default: `0.0.0.0`)
- `API_PORT`: API server port (default: `8000`)

## Usage

### Start the Development Server

```bash
make run
```

The API will be available at `http://localhost:8000`

### Run Tests

```bash
make test
```

### Clean Generated Files

```bash
make clean
```

## API Documentation

Once the server is running, visit:

- **Interactive API Docs (Swagger UI)**: http://localhost:8000/docs
- **Alternative API Docs (ReDoc)**: http://localhost:8000/redoc

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Applications

- `POST /api/v1/applications` - Create a new application
- `GET /api/v1/applications` - List all applications
- `GET /api/v1/applications/{id}` - Get a single application
- `PUT /api/v1/applications/{id}` - Update an application
- `DELETE /api/v1/applications/{id}` - Delete an application

### Configurations

- `POST /api/v1/configurations` - Create a new configuration
- `GET /api/v1/configurations` - List all configurations (optional filter by `application_id`)
- `GET /api/v1/configurations/{id}` - Get a single configuration
- `PUT /api/v1/configurations/{id}` - Update a configuration
- `DELETE /api/v1/configurations/{id}` - Delete a configuration

## Development

### Project Structure

```
config-service/
├── api/                    # API application code
│   ├── config.py          # Configuration management
│   ├── database.py        # Database connection manager
│   ├── main.py            # FastAPI application
│   ├── models.py          # Pydantic models
│   └── routes/            # API route handlers
│       ├── applications.py
│       └── configurations.py
├── migrations/            # Database migrations
│   ├── 001_initial_schema.sql
│   └── migrations.py
├── .env.example          # Example environment variables
├── .gitignore           # Git ignore patterns
├── Makefile             # Common development tasks
├── pyproject.toml       # Project dependencies
└── README.md            # This file
```

### Running Tests

All code files have corresponding test files with the `_test.py` suffix. Tests are co-located with the code they test.

```bash
# Run all tests with coverage
make test

# Run specific test file
uv run python -m pytest api/database_test.py
```

### Code Quality

- Follow PEP 8 style guidelines
- Use type hints throughout
- Include docstrings for modules, classes, and functions
- Write tests for all new code

## Technology Stack

- **Language**: Python 3.13+
- **Web Framework**: FastAPI 0.116+
- **Validation**: Pydantic 2.11+
- **Database**: SQLite 3
- **Testing**: pytest 8.4+, httpx 0.28+
- **Package Manager**: uv

## License

This project is provided as-is for educational purposes.
