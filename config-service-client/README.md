# Config Hub Client

A lightweight, type-safe TypeScript client library for the Config Hub REST API.

## Features

- ✅ **Zero Dependencies** - Uses native `fetch` API
- ✅ **Type-Safe** - Full TypeScript support with comprehensive type definitions
- ✅ **Framework Agnostic** - Works with any JavaScript framework or vanilla JS
- ✅ **Simple API** - Clean, intuitive interface matching the REST API
- ✅ **Error Handling** - Discriminated union result type for type-safe error handling

## Installation

```bash
npm install @config-hub/client
```

## Usage

### Basic Example

```typescript
import { ConfigServiceClient } from '@config-hub/client';

// Create a client instance
const client = new ConfigServiceClient('http://localhost:8000/api/v1');

// Get all applications
const result = await client.getApplications();

if (result.success) {
  console.log('Applications:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Creating an Application

```typescript
const result = await client.createApplication({
  name: 'my-app',
  description: 'My application'
});

if (result.success) {
  console.log('Created application:', result.data);
}
```

### Managing Configurations

```typescript
// Create a configuration
const configResult = await client.createConfiguration({
  application_id: 'app-ulid-here',
  name: 'production',
  description: 'Production configuration',
  settings: {
    'database.host': 'prod-db.example.com',
    'database.port': '5432'
  }
});

// Get configurations for an application
const configs = await client.getConfigurations('app-ulid-here');

// Update a configuration
const updated = await client.updateConfiguration('config-ulid-here', {
  settings: {
    'database.host': 'new-db.example.com',
    'database.port': '5432'
  }
});
```

## API Reference

### ConfigServiceClient

#### Constructor

```typescript
new ConfigServiceClient(baseUrl?: string)
```

- `baseUrl` - Base URL for the API (default: `/api/v1`)

#### Application Methods

- `getApplications()` - Get all applications
- `getApplication(id: string)` - Get a single application by ID
- `createApplication(data: ApplicationCreate)` - Create a new application
- `updateApplication(id: string, data: ApplicationUpdate)` - Update an application
- `deleteApplication(id: string)` - Delete an application

#### Configuration Methods

- `getConfigurations(applicationId?: string)` - Get configurations, optionally filtered by application
- `getConfiguration(id: string)` - Get a single configuration by ID
- `createConfiguration(data: ConfigurationCreate)` - Create a new configuration
- `updateConfiguration(id: string, data: ConfigurationUpdate)` - Update a configuration
- `deleteConfiguration(id: string)` - Delete a configuration

### Types

All API types are exported for use in your application:

```typescript
import type {
  Application,
  ApplicationCreate,
  ApplicationUpdate,
  Configuration,
  ConfigurationCreate,
  ConfigurationUpdate,
  ApiResult
} from '@config-hub/client';
```

### Result Type

All methods return an `ApiResult<T>` which is a discriminated union:

```typescript
type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; status?: number };
```

This allows for type-safe error handling:

```typescript
const result = await client.getApplication('some-id');

if (result.success) {
  // TypeScript knows result.data is available
  console.log(result.data.name);
} else {
  // TypeScript knows result.error is available
  console.error(result.error, result.status);
}
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

## License

MIT
