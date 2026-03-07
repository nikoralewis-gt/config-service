# Configuration Service Architecture

## Service Architecture

### System Overview
The Configuration Service is a centralized, flexible configuration management system designed to provide secure and scalable configuration storage for various application types including mobile, desktop, web applications, cloud services, and microservices.

### Core Components

#### API Layer
- **Framework**: FastAPI
- **API Design**: RESTful HTTP API with versioned endpoints (/api/v1)
- **Documentation**: Automatic OpenAPI documentation via FastAPI
- **Health Monitoring**: Dedicated health check endpoint

#### Database Layer
- **Database**: PostgreSQL with JSONB for flexible configuration storage
- **Connection Management**: 
  - Threaded connection pool using psycopg2
  - Async database operations
  - Transaction support
  - Direct SQL queries (no ORM)

#### Repository Layer
1. **ApplicationRepository**
   - CRUD operations for applications
   - Uses ULID for unique identifiers
   - Validates data using Pydantic schemas
   - Automatically creates default configuration when creating applications

2. **ConfigurationRepository**
   - Configuration management for applications
   - JSON-based configuration storage
   - Supports upsert and retrieval operations

#### Data Validation
- **Schema Validation**: Pydantic models for request/response validation
- **Database Models**: Separate Pydantic models for database record validation
- **Input Sanitization**: Field validators for data cleaning and validation

#### Database Schema
- **applications** table
  - Stores application metadata (id, name, description)
  - ULID-based primary key (stored as VARCHAR(26))
  - Unique name constraint
  - Automatic timestamp tracking via database triggers

- **configurations** table
  - Stores JSON configuration data
  - Foreign key to applications
  - JSONB storage for flexible configuration
  - Automatic timestamp tracking via database triggers

#### Migration System
- Custom SQL-based migration system
- Version tracking in schema_migrations table
- Automatic migration application on startup

### Key Technical Decisions
- **Direct SQL over ORM**: Uses direct SQL queries with psycopg2 instead of SQLAlchemy ORM
- **ULID for IDs**: Uses ULID instead of UUID for sortable, unique identifiers (API uses ULID objects, database stores as strings)
- **Pydantic Validation**: Comprehensive data validation using Pydantic
- **Async Operations**: Async database operations for improved performance
- **JSONB Storage**: Flexible configuration storage using PostgreSQL JSONB
- **Repository Pattern**: Clean separation of data access logic

### API Endpoints
- `GET /api/v1/applications`: List all applications
- `POST /api/v1/applications`: Create a new application
- `GET /api/v1/applications/{id}`: Get application by ID
- `PUT /api/v1/applications/{id}`: Update application by ID
- `DELETE /api/v1/applications/{id}`: Delete an application
- `GET /api/v1/applications/{id}/config`: Get configuration for an application
- `PUT /api/v1/applications/{id}/config`: Update configuration for an application
- `GET /api/v1/config/{name}`: Get configuration by application name (main client endpoint)
- `GET /health`: Health check endpoint (root level, not versioned)

### Error Handling
- Consistent error response format using ErrorResponse schema
- Specific HTTP status codes (400 for bad requests, 404 for not found, 409 for conflicts, 422 for validation errors, 500 for server errors)
- Detailed error messages for troubleshooting
- Structured exception handling with appropriate HTTP status mapping

## UI Architecture

### System Overview
The Configuration Service UI is a web-based administration interface for managing application configurations. It's built using modern web components without a framework dependency.

### Core Components

#### Component Architecture
- **Web Components**: Custom elements using the Web Components standard
- **Shadow DOM**: Encapsulated styling and DOM
- **BaseComponent**: Abstract base class providing common functionality
- **Component Registration**: Components registered as custom elements in main.ts
- **Component Hierarchy**:
  - ConfigApp: Main application component (config-app)
  - ConfigDetail: Configuration details and editor (config-detail)
  - CreateAppForm: Form for creating new applications (create-app-form)

#### State Management
- Component-based state management
- Event-based communication between components
- Custom events for cross-component interaction

#### API Communication
- **ApiService**: Centralized service for API communication
  - Single instance exported as `api` for application-wide use
  - Base URL configuration (`/api/v1` for versioned endpoints)
  - Standardized request method with automatic JSON handling
  - Comprehensive error handling with network error fallbacks
- **Response Handling**: Consistent response and error handling
  - Unified `ApiResponse<T>` type for all API calls
  - Success/error state discrimination
  - Automatic JSON parsing and error extraction
- **Type Safety**: TypeScript interfaces matching backend schemas
  - Request/response types mirror backend Pydantic schemas
  - Compile-time validation of API calls
  - IntelliSense support for API methods

### UI Features
- Application listing and selection
- Configuration viewing and editing
- Application creation
- Error handling and loading states

### Key Technical Decisions
- **Framework-less**: No dependency on React, Angular, or Vue
- **Web Components**: Native browser component model
- **TypeScript**: Type safety and improved developer experience
- **Shadow DOM**: Style encapsulation and DOM isolation
- **Custom Elements**: Reusable, composable components

### Data Flow
1. Components request data from ApiService
2. ApiService communicates with backend API
3. Components update their state based on API responses
4. Components re-render to reflect state changes
5. User interactions trigger events that update state
6. State changes trigger re-renders

### Styling
- Component-scoped CSS using Shadow DOM
- Consistent design language across components
- Responsive design for various screen sizes
