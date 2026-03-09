# ARCHITECTURE

<!--
INSTRUCTIONS FOR THE ASSISTANT

Your task is to populate this ARCHITECTURE.md file using the context provided in the following files:

@/memory/ABOUT.md
@/memory/ARCHITECTURE.md

Process:
1. Read ABOUT.md to understand the project’s purpose, domain, personas, and scope.
2. Read this ARCHITECTURE.md file to understand its structure.
3. Populate each section with clear, concise, high‑level architectural information.
4. Do not invent features or expand scope beyond what ABOUT.md defines.
5. Maintain the existing section headings and fill in content beneath them.
6. Write in a neutral, technical tone suitable for long‑term project documentation.
7. Do not remove these instructions; leave them at the top of the file.

Your output should replace only the placeholder comments within each section.
-->

## Overview
<!-- High-level description of the system's architecture -->

Config Hub is a REST API-based configuration management service built on a three-tier architecture: a FastAPI web layer, a business logic layer, and a SQLite persistence layer. The system exposes versioned HTTP endpoints for managing applications and their configuration settings, enabling runtime configuration retrieval and administrative management through a clean, predictable interface. The architecture prioritizes simplicity, transparency, and reliability over complexity, using direct SQL queries rather than ORM abstractions and ULID-based identifiers for sortable, URL-safe primary keys.

## Core Components
<!-- List and describe the major components (API, storage, admin UI, client library, etc.) -->

**REST API (FastAPI)**  
The primary interface to the system, built with FastAPI and Pydantic for type-safe request/response handling. Exposes versioned endpoints under `/api/v1` for applications and configurations. Includes health check and root endpoints, automatic OpenAPI documentation, and comprehensive validation.

**Database Layer (SQLite)**  
A lightweight, file-based relational database storing applications and configurations. Uses direct SQL queries for transparency and control, avoiding ORM overhead. Managed through a `Database` class that handles connections and query execution.

**Migration System**  
A simple, sequential migration runner that applies SQL schema changes and tracks applied migrations in a dedicated table. Ensures database schema consistency across environments.

**Configuration Management**  
Environment-based configuration using Pydantic Settings, supporting `.env` files and environment variables for database path, logging level, API host, and port.

**Route Handlers**  
Modular route handlers for applications and configurations, organized under `api/routes/`. Each handler manages CRUD operations for its domain entity with proper HTTP status codes and error handling.

**Admin UI (Future/External)**  
An administrative web interface for managing configuration keys and values, intended to integrate with the REST API. Not part of the core service implementation.

## Data Flow
<!-- How data moves through the system, from request to response -->

**Incoming Request**  
HTTP requests arrive at FastAPI endpoints, where Pydantic models validate request bodies and path/query parameters. Invalid requests are rejected with 422 Unprocessable Entity responses.

**Route Handler Processing**  
Validated requests are routed to the appropriate handler in `api/routes/`. Handlers extract the database instance from application state and execute business logic.

**Database Interaction**  
Handlers construct SQL queries and execute them via the `Database` class. The database returns raw rows, which handlers transform into Pydantic response models.

**Response Formation**  
Pydantic models serialize the response data to JSON. FastAPI sets appropriate HTTP status codes (200, 201, 204, 404, etc.) and returns the response to the client.

**Error Handling**  
Exceptions are caught and translated into appropriate HTTP error responses. Database constraint violations, missing resources, and validation errors are handled with clear, actionable error messages.

## Boundaries and Responsibilities
<!-- What each component is responsible for; what it should NOT do -->

**API Layer**  
Responsible for HTTP protocol handling, request validation, response serialization, and routing. Should NOT contain business logic, direct database queries, or data transformation beyond serialization.

**Route Handlers**  
Responsible for orchestrating business operations, executing database queries, and mapping between database rows and API models. Should NOT handle HTTP concerns directly or implement complex business rules beyond CRUD operations.

**Database Layer**  
Responsible for executing SQL queries, managing connections, and ensuring data integrity through constraints. Should NOT contain business logic or API-specific concerns.

**Migration System**  
Responsible for applying schema changes in a controlled, sequential manner. Should NOT modify data beyond schema evolution or handle application-level migrations.

**Configuration Management**  
Responsible for loading and validating environment-specific settings. Should NOT contain runtime state or mutable configuration.

**Out of Scope**  
Config Hub does NOT handle secrets management, encryption, deployment orchestration, feature flagging, user authentication/authorization, or runtime execution of applications. It focuses solely on configuration data storage and retrieval.

## Technology Choices
<!-- Languages, frameworks, storage engines, protocols, and why they were chosen -->

**Python 3.13+**  
Modern Python with full type hint support, enabling static analysis and improved developer experience. Chosen for its ecosystem maturity and FastAPI compatibility.

**FastAPI 0.116+**  
High-performance, modern web framework with automatic OpenAPI documentation, built-in validation via Pydantic, and async support. Chosen for developer productivity and API-first design.

**Pydantic 2.11+**  
Data validation and serialization library providing type-safe models and settings management. Chosen for its integration with FastAPI and runtime validation capabilities.

**SQLite 3**  
Embedded, serverless relational database requiring zero configuration. Chosen for simplicity, reliability, and suitability for single-instance deployments. Supports ACID transactions and foreign key constraints.

**ULID (Universally Unique Lexicographically Sortable Identifier)**  
Sortable, URL-safe identifiers used as primary keys. Chosen over UUIDs for time-based sorting and over auto-increment integers for distributed-friendly generation.

**Direct SQL (No ORM)**  
Raw SQL queries for database operations, providing full transparency and control. Chosen to avoid ORM complexity, improve performance visibility, and maintain explicit data access patterns.

**uv Package Manager**  
Fast, modern Python package installer and resolver. Chosen for improved dependency resolution speed and developer experience.

**pytest + httpx**  
Testing framework with async support and HTTP client for API testing. Chosen for comprehensive test coverage and FastAPI compatibility.

## Deployment Model
<!-- How the system is deployed across environments -->

**Single-Instance Service**  
Config Hub is designed to run as a single-instance service with a local SQLite database. The service is stateless except for the database file, which must be persisted across restarts.

**Environment Configuration**  
Configuration is managed through environment variables or `.env` files, supporting different settings per environment (development, staging, production). Key settings include database path, log level, API host, and port.

**Database Persistence**  
The SQLite database file is stored at a configurable path (default: `data/config.db`). This file must be backed up and persisted in production environments.

**Migration on Startup**  
Database migrations run automatically during application startup via the lifespan manager, ensuring schema consistency before accepting requests.

**Process Management**  
The service runs via `uvicorn` (ASGI server) and can be managed by process supervisors (systemd, supervisord, Docker) for production deployments.

**Horizontal Scaling Considerations**  
SQLite is not designed for concurrent writes from multiple instances. For multi-instance deployments, a client-server database (PostgreSQL, MySQL) would be required, though this is currently out of scope.

## Non-Functional Considerations
<!-- Performance, reliability, scalability, observability, etc. -->

**Performance**  
SQLite provides excellent read performance for single-instance deployments. Database indexes on application names and configuration lookups optimize common query patterns. Direct SQL avoids ORM overhead.

**Reliability**  
SQLite's ACID guarantees ensure data consistency. Foreign key constraints maintain referential integrity. Automatic migrations on startup prevent schema drift.

**Scalability**  
The current architecture supports vertical scaling (more CPU/memory) but not horizontal scaling due to SQLite's single-writer limitation. For high-traffic scenarios, migration to a client-server database would be required.

**Observability**  
Structured logging with configurable log levels provides operational visibility. Health check endpoint enables monitoring and load balancer integration. Future enhancements could include metrics (Prometheus) and distributed tracing.

**Maintainability**  
Co-located tests with `_test.py` suffix, comprehensive type hints, and direct SQL queries improve code clarity. Modular route organization and clear separation of concerns support long-term maintenance.

**Security**  
Input validation via Pydantic prevents injection attacks. SQLite parameterized queries prevent SQL injection. No authentication/authorization is currently implemented—this should be added before production use.

**Testability**  
80%+ test coverage with unit and integration tests. In-memory SQLite databases for test isolation. Async test support via pytest-asyncio.

**Developer Experience**  
Automatic OpenAPI documentation at `/docs` and `/redoc`. Type hints throughout for IDE support. Simple Makefile commands for common tasks. Fast dependency installation via uv.
