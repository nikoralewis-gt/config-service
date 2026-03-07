# Configuration Service Client Library

A TypeScript client library for the Configuration Service API, providing a simple and type-safe way to interact with the configuration management system.

## Installation

```bash
npm install config-client
```

## Usage

### Basic Setup

```typescript
import { ConfigClient } from 'config-client';

// Create a client instance
const client = new ConfigClient();

// Or with custom options
const client = new ConfigClient({
  baseUrl: '/api/v1',  // Default: '/api/v1'
  timeout: 30000       // Default: 30000ms
});
```

### API Methods

#### Applications

```typescript
// Get all applications
const result = await client.getApplications();
if (result.success) {
  console.log('Applications:', result.data);
} else {
  console.error('Error:', result.error);
}

// Get a specific application
const app = await client.getApplication('app-id');

// Create a new application
const newApp = await client.createApplication({
  name: 'my-app',
  description: 'My application'
});

// Delete an application
await client.deleteApplication('app-id');
```

#### Configurations

```typescript
// Get configuration for an application
const config = await client.getConfiguration('app-id');

// Update configuration
await client.updateConfiguration('app-id', {
  config: {
    theme: 'dark',
    timeout: 30,
    features: {
      notifications: true
    }
  }
});

// Get configuration by application name
const config = await client.getConfigByName('my-app');
```

### Response Format

All API methods return a consistent response format:

```typescript
type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};
```

### Error Handling

```typescript
const result = await client.getApplications();

if (result.success) {
  // Handle successful response
  const applications = result.data;
} else {
  // Handle error
  console.error('API Error:', result.error);
}
```

### TypeScript Support

The library is fully typed with TypeScript. All request and response types are exported:

```typescript
import { 
  ConfigClient,
  ApplicationCreate,
  ApplicationResponse,
  ConfigurationUpdate,
  ConfigurationResponse,
  ApiResponse
} from 'config-client';
```

## Available Types

- `ApplicationCreate` - Data for creating a new application
- `ApplicationResponse` - Application data from the API
- `ConfigurationUpdate` - Data for updating configuration
- `ConfigurationResponse` - Configuration data from the API
- `HealthResponse` - Health check response
- `LoadingState` - Loading state type ('idle' | 'loading' | 'success' | 'error')
- `ApiResponse<T>` - Generic API response wrapper

## Configuration Options

```typescript
interface ConfigClientOptions {
  baseUrl?: string;    // API base URL (default: '/api/v1')
  timeout?: number;    // Request timeout in milliseconds (default: 30000)
}
```

## Error Types

The library includes custom error classes for better error handling:

```typescript
import { 
  ConfigError,
  NetworkError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ServerError
} from 'config-client';
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

## License

MIT
