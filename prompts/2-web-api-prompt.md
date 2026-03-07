# Config Service Implementation Plan Prompt

This document contains detailed specifications for creating an implementation plan for a REST Web API Configuration Service. Please review the contents of this file and create a COMPREHENSIVE IMPLEMENTATION PLAN for this service.

The implementation plan should:
- Include a complete list of dependencies with specific version numbers
- Define the file and folder structure for the project
- Specify architectural patterns and design decisions
- Provide step-by-step implementation guidance
- Adhere strictly to ALL details in this document
- NOT add any additional dependencies without explicit approval
- Ask for clarification if any requirements are unclear or ambiguous

## Project Overview

A small backend service that stores a list of applications. Each application should have configuration settings made up of name/value pairs.

## Core Requirements

The service should support the following operations:
- Add, update, delete, and list applications
- Add, update, delete, and list configuration settings for each application

## Tech Stack

| Area                 | Choice     | Version |
|----------------------|------------|---------|
| Language             | Python     | 3.13+   |
| Web framework        | FastAPI    | 0.116+  |
| Validation           | Pydantic   | 2.11+   |
| Service config       | Pydantic Settings | 2.0+    |
| Testing framework    | pytest     | 8.4+    |
| Testing HTTP helper  | httpx      | 0.28+   |
| Database engine      | SQLite     | 3       |
| Python DB adapter    | sqlite3    | (built-in) |

**IMPORTANT:** Use these specific version ranges in the implementation plan.

## Data Models

### Application
- **DB Table:** `applications`
- **Columns:**
  - `id`: Primary key, datatype: string/ULID
  - `name`: Unique, datatype: string(256)
  - `description`: Datatype: string(1024), nullable

### Configuration
- **DB Table:** `configurations`
- **Columns:**
  - `id`: Primary key, datatype: string/ULID
  - `application_id`: Foreign key to applications.id, datatype: string/ULID
  - `name`: Datatype: string(256), should be unique per application
  - `description`: Datatype: string(1024), nullable
  - `settings`: Dictionary with name/value pairs, datatype: JSON

**Primary Key Strategy:**
- Use `pydantic_extra_types.ulid.ULID` for primary keys
- Require `python-ulid>=2.0.0,<3.0.0` wrapped by Pydantic ULID

## API Endpoints

All endpoints should be prefixed with `/api/v1`

### Applications
- `POST /applications` - Create a new application
- `PUT /applications/{id}` - Update an existing application
- `GET /applications/{id}` - Get a single application (include list of related configuration IDs)
- `GET /applications` - List all applications
- `DELETE /applications/{id}` - Delete an application

### Configurations
- `POST /configurations` - Create a new configuration
- `PUT /configurations/{id}` - Update an existing configuration
- `GET /configurations/{id}` - Get a single configuration
- `GET /configurations` - List all configurations (optionally filter by application_id)
- `DELETE /configurations/{id}` - Delete a configuration

## Data Persistence

**Database Approach:**
- This project will NOT use an ORM
- Manage and issue SQL statements directly
- Use SQLite's built-in `sqlite3` module
- Use `sqlite3.Row` as the row_factory for dictionary-like access to results

**Connection Management:**
- Implement a simple connection context manager
- Use FastAPI's lifespan context manager for database initialization

## Data Schema & Migrations

Implement a migration system that includes:
- A `migrations` database table to track applied migrations
  - Columns: `id` (integer primary key), `name` (text), `applied_at` (timestamp)
- A `migrations/` folder to hold `*.sql` migration files
  - Files should be numbered (e.g., `001_initial_schema.sql`, `002_add_indexes.sql`)
- A `migrations.py` file to implement the migration system
  - Function to check and apply pending migrations
  - Run migrations on application startup
- A `migrations_test.py` file to test the migration system

## Automated Testing

**Testing Requirements:**
- ALL code files MUST have an associated unit test (except `__init__.py` files)
- Focus on 80% of the most important scenarios in each file
- ALL unit tests will have a `_test.py` suffix
- Unit tests should be located in the same folder as the code under test
- Use pytest fixtures for common test setup
- Use httpx.AsyncClient for testing FastAPI endpoints

**Test Organization:**
- Keep tests alongside the code they test
- Only create a separate `tests/` folder if needed for integration tests or shared test utilities

## Service Configuration

- Use a `.env` file to store environment variables
  - Database file path
  - Logging level
  - API host and port
- Use `pydantic-settings` (>=2.0.0,<3.0.0) to parse and validate environment variables
- Provide a `.env.example` file with sample values

## Developer Experience

**Dependency Management:**
- Use `uv` for managing virtual environments and dependencies
- Do NOT use `pip` or `uv pip` - only `uv` directly
- Commands: `uv add`, `uv sync`, `uv run`

**Makefile:**
- Create a `Makefile` with targets for common tasks:
  - `test` - Run all tests with coverage
  - `run` - Start the development server
  - `migrate` - Run database migrations
  - `clean` - Remove generated files and caches
- Use the `uv` module calling syntax (e.g., `uv run python -m pytest`)

## Code Quality

- Keep code simple, clean, and well-structured
- Use type hints throughout
- Follow PEP 8 style guidelines
- Include docstrings for modules, classes, and functions
- Use meaningful variable and function names

## Error Handling

- Return appropriate HTTP status codes
- Provide clear error messages in responses
- Handle common errors:
  - 404 for resources not found
  - 400 for invalid input
  - 409 for conflicts (e.g., duplicate names)
  - 500 for server errors

## Project Structure

The implementation plan should define a clear folder structure, such as:
```
config-service/
├── .env.example
├── .gitignore
├── Makefile
├── pyproject.toml
├── README.md
├── api/
│   ├── __init__.py
│   ├── main.py
│   ├── main_test.py
│   ├── config.py
│   ├── config_test.py
│   ├── database.py
│   ├── database_test.py
│   ├── models.py
│   ├── models_test.py
│   └── routes/
│       ├── __init__.py
│       ├── applications.py
│       ├── applications_test.py
│       ├── configurations.py
│       └── configurations_test.py
└── migrations/
    ├── 001_initial_schema.sql
    ├── migrations.py
    └── migrations_test.py
```

## Additional Notes

- Authentication is a future feature - do not implement now
- Use the latest Python documentation for date/time operations
- Ensure all timestamps use UTC
- The service should be production-ready with proper logging and error handling
