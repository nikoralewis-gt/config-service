# Configuration Service Testing Strategy

## Testing Philosophy

### Core Principles
- **High Coverage**: Target 80%+ test coverage for backend code
- **Co-located Tests**: Tests live alongside source files for easy discovery and maintenance
- **Fast Feedback**: Tests run quickly using in-memory databases
- **Comprehensive**: Cover unit, integration, and edge cases
- **Type Safety**: Leverage Python type hints and async support

### Testing Goals
- Verify business logic correctness
- Ensure API contract compliance
- Validate data integrity and constraints
- Catch regressions early
- Document expected behavior through tests

## Test Organization

### File Structure
- **Naming Convention**: Test files use `_test.py` suffix (e.g., `models_test.py`, `database_test.py`)
- **Co-location**: Tests live in the same directory as the code they test
- **Discovery**: pytest automatically finds all `*_test.py` files
- **Separation**: Each module has its own test file

### Test File Organization
```
config-service/
├── api/
│   ├── models.py
│   ├── models_test.py          # Tests for Pydantic models
│   ├── database.py
│   ├── database_test.py        # Tests for database operations
│   ├── main.py
│   ├── main_test.py            # Tests for FastAPI app setup
│   └── routes/
│       ├── applications.py
│       ├── applications_test.py    # Tests for application endpoints
│       ├── configurations.py
│       └── configurations_test.py  # Tests for configuration endpoints
└── migrations/
    ├── migrations.py
    └── migrations_test.py      # Tests for migration system
```

## Test Types

### Unit Tests
- **Purpose**: Test individual functions, classes, and methods in isolation
- **Scope**: Single function or class behavior
- **Examples**: 
  - Pydantic model validation
  - Database connection management
  - ULID generation
  - Utility functions

### Integration Tests
- **Purpose**: Test interactions between components
- **Scope**: Multiple components working together
- **Examples**:
  - API endpoint tests (request → route handler → database → response)
  - Database migration application
  - Full CRUD workflows

### Edge Case Tests
- **Purpose**: Test boundary conditions and error scenarios
- **Scope**: Invalid inputs, constraint violations, missing data
- **Examples**:
  - Duplicate name handling (409 Conflict)
  - Missing resources (404 Not Found)
  - Invalid data (422 Unprocessable Entity)
  - Foreign key constraint violations

## Testing Patterns

### In-Memory Database Pattern
- Use SQLite `:memory:` databases for test isolation
- Each test gets a fresh database instance
- No cleanup required (database disappears after test)
- Fast execution with no file I/O

### Fixture Pattern
- pytest fixtures provide reusable test setup
- Common fixtures: database instance, test client, sample data
- Fixtures handle setup and teardown automatically
- Scope control (function, module, session)

### Async Testing Pattern
- Use `pytest-asyncio` for async test functions
- Mark async tests with `@pytest.mark.asyncio`
- Test async route handlers and database operations
- Maintain async/await consistency

### Test Client Pattern
- Use FastAPI `TestClient` for endpoint testing
- Simulates HTTP requests without running a server
- Provides full request/response cycle testing
- Supports all HTTP methods and status code validation

## Running Tests

### Commands
```bash
# Run all tests with coverage
make test

# Run specific test file
uv run python -m pytest api/database_test.py

# Run with verbose output
uv run python -m pytest -v

# Run with coverage report
uv run python -m pytest --cov=api --cov-report=term-missing
```

### Coverage Expectations
- **Target**: 80%+ overall coverage
- **Exclusions**: Test files themselves, `__init__.py` files
- **Focus**: Business logic, route handlers, database operations
- **Reports**: Terminal output and HTML reports for detailed analysis

## Testing Conventions

### Test Naming
- Test functions start with `test_` prefix
- Names describe what is being tested: `test_create_application_success`
- Use descriptive names for edge cases: `test_create_application_duplicate_name_returns_409`

### Assertion Style
- Use clear, specific assertions
- One logical assertion per test (when possible)
- Use pytest's rich assertion introspection
- Validate both success and error cases

### Test Data
- Use realistic but minimal test data
- Avoid hardcoded IDs (generate ULIDs as needed)
- Create helper functions for common test data patterns
- Keep test data close to the test that uses it

### Error Testing
- Test expected error conditions explicitly
- Validate HTTP status codes for API tests
- Check error message content when relevant
- Use `pytest.raises` for exception testing

## Test Categories

### Model Tests (`models_test.py`)
- Pydantic model validation
- Field constraints (min/max length, required fields)
- Type validation
- Default values and optional fields

### Database Tests (`database_test.py`)
- Connection management
- Query execution
- Transaction handling
- Foreign key constraints
- Unique constraints

### Route Tests (`applications_test.py`, `configurations_test.py`)
- HTTP method handling (GET, POST, PUT, DELETE)
- Request validation
- Response format and status codes
- Error handling (404, 409, 422)
- CRUD operations end-to-end

### Migration Tests (`migrations_test.py`)
- Schema creation
- Migration tracking
- Idempotency (running migrations multiple times)
- Migration order

## Frontend Testing

### Component Tests
- Use Vitest for TypeScript/JavaScript testing
- Test individual Web Components
- Validate component rendering
- Test user interactions
- Check state management

### Test Organization
- Tests in `tests/` directory or co-located with components
- Use `.test.ts` or `.spec.ts` suffix
- Follow similar patterns to backend testing

## Continuous Integration

### CI/CD Integration
- Tests run automatically on every commit/PR
- Coverage reports generated and tracked
- Build fails if tests fail or coverage drops below threshold
- Fast feedback loop for developers

### Pre-commit Checks
- Run tests locally before committing
- Use `make test` for quick validation
- Ensure all tests pass before pushing

## Testing Anti-Patterns to Avoid

### Don't
- Test implementation details (test behavior, not internals)
- Create brittle tests that break with minor refactoring
- Use shared mutable state between tests
- Skip error case testing
- Write tests that depend on execution order
- Use production databases for testing
- Ignore failing tests or lower coverage standards

### Do
- Test public interfaces and contracts
- Write resilient tests that focus on behavior
- Isolate tests with fixtures and in-memory databases
- Test both happy path and error scenarios
- Ensure tests can run in any order
- Use test-specific databases (in-memory)
- Maintain high coverage and fix failing tests immediately
