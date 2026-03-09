# Config Hub Client Library

## Overview

The Config Hub Client Library (`@config-hub/client`) is a standalone, reusable TypeScript library that provides a type-safe interface to the Config Hub REST API. It was created to enable clean separation between API client logic and UI implementation, allowing multiple consumers to interact with the Config Hub service.

## Location

```
config-service-client/
├── src/
│   ├── index.ts           # Main export file
│   ├── client.ts          # ConfigServiceClient class
│   └── types.ts           # Type definitions
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript configuration
├── .gitignore
├── build.sh               # Build script
└── README.md              # Library documentation
```

## Architecture

### Design Principles

1. **Zero Dependencies** - Uses native `fetch` API, no external HTTP libraries
2. **Type Safety** - Full TypeScript support with comprehensive type definitions
3. **Framework Agnostic** - Pure TypeScript, works with any framework or vanilla JS
4. **Simple API** - Clean interface matching the REST API structure
5. **Error Handling** - Discriminated union result type for type-safe error handling

### Core Components

**ConfigServiceClient Class**
- Main client class with methods for all API operations
- Configurable base URL (defaults to `/api/v1`)
- Private HTTP methods (get, post, put, delete)
- Comprehensive JSDoc documentation

**Type Definitions**
- `Application`, `ApplicationCreate`, `ApplicationUpdate`
- `Configuration`, `ConfigurationCreate`, `ConfigurationUpdate`
- `ApiResult<T>` - Discriminated union for success/error handling

**Result Pattern**
```typescript
type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; status?: number };
```

## API Surface

### Application Methods
- `getApplications()` - Get all applications
- `getApplication(id)` - Get single application by ID
- `createApplication(data)` - Create new application
- `updateApplication(id, data)` - Update existing application
- `deleteApplication(id)` - Delete application

### Configuration Methods
- `getConfigurations(applicationId?)` - Get configurations, optionally filtered
- `getConfiguration(id)` - Get single configuration by ID
- `createConfiguration(data)` - Create new configuration
- `updateConfiguration(id, data)` - Update existing configuration
- `deleteConfiguration(id)` - Delete configuration

## Integration with Admin UI

The Admin UI has been updated to consume the client library:

**Before:**
- `ui/src/services/api.ts` contained full `ApiService` class implementation
- ~130 lines of API client code in the UI

**After:**
- `ui/src/services/api.ts` imports and re-exports the client library
- ~20 lines of code, delegates to `@config-hub/client`
- UI components unchanged (backward compatible)

**Package Dependency:**
```json
{
  "dependencies": {
    "@config-hub/client": "file:../config-service-client"
  }
}
```

## Build Process

### Prerequisites
- Node.js and npm
- TypeScript compiler

### Build Steps
1. Install dependencies: `npm install`
2. Compile TypeScript: `npm run build`
3. Output generated in `dist/` directory

### Build Output
- `dist/index.js` - Compiled JavaScript (ESM)
- `dist/index.d.ts` - TypeScript type declarations
- `dist/client.js` / `dist/client.d.ts`
- `dist/types.js` / `dist/types.d.ts`
- Source maps for debugging

## Usage Example

```typescript
import { ConfigServiceClient } from '@config-hub/client';

const client = new ConfigServiceClient('http://localhost:8000/api/v1');

// Get all applications
const result = await client.getApplications();

if (result.success) {
  console.log('Applications:', result.data);
} else {
  console.error('Error:', result.error);
}

// Create an application
const createResult = await client.createApplication({
  name: 'my-app',
  description: 'My application'
});
```

## Benefits

### For the Project
- **Single Source of Truth** - API types defined once in the client library
- **Reusability** - Any web application can use the client library
- **Maintainability** - Changes to API client logic happen in one place
- **Testability** - Client library can be tested independently

### For Developers
- **Type Safety** - Full IntelliSense and compile-time checking
- **Documentation** - JSDoc comments provide inline documentation
- **Error Handling** - Discriminated unions make error handling explicit
- **Simplicity** - Clean API matches REST endpoints directly

## Future Enhancements

### Publishing to npm
1. Update `package.json` with proper metadata
2. Build the library
3. Publish: `npm publish`
4. Update consumers to use published version

### Potential Features
- Request/response interceptors
- Retry logic with exponential backoff
- Request cancellation support
- Caching layer
- WebSocket support for real-time updates

## Testing

The client library can be tested independently:

```typescript
// Mock fetch for testing
global.fetch = vi.fn();

const client = new ConfigServiceClient();
const result = await client.getApplications();

expect(fetch).toHaveBeenCalledWith('/api/v1/applications', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
});
```

## Documentation

- **Library README**: `config-service-client/README.md` - Complete usage guide
- **Integration Guide**: `INTEGRATION_GUIDE.md` - Build and integration instructions
- **API Documentation**: JSDoc comments in source code

## Alignment with Architecture

The client library aligns with Config Hub's architectural principles:

✅ **Simplicity** - Minimal abstraction over REST API  
✅ **Type Safety** - Full TypeScript support matches backend Pydantic models  
✅ **Transparency** - Direct mapping to HTTP endpoints  
✅ **Separation of Concerns** - Client logic separate from UI components  
✅ **Developer Experience** - Clean API with comprehensive documentation
