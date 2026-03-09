# Config Hub Client Library - Integration Guide

This guide explains how to build and use the Config Hub client library with the Admin UI.

## Overview

The Config Hub client library (`config-service-client/`) is a standalone, reusable TypeScript library that provides a type-safe interface to the Config Hub REST API. The Admin UI (`ui/`) has been updated to consume this library instead of maintaining its own API client code.

## Architecture

```
config-service-client/          # Standalone client library
├── src/
│   ├── index.ts               # Main export
│   ├── client.ts              # ConfigServiceClient class
│   └── types.ts               # Type definitions
├── package.json
└── tsconfig.json

ui/                            # Admin UI (consumer)
├── src/
│   └── services/
│       └── api.ts            # Re-exports client library
└── package.json              # References client as local dependency
```

## Building the Client Library

### Prerequisites

- Node.js and npm installed
- TypeScript compiler

### Build Steps

1. **Navigate to the client library directory:**
   ```bash
   cd config-service-client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the library:**
   ```bash
   npm run build
   ```

   This compiles TypeScript to JavaScript and generates type declarations in the `dist/` folder.

### Build Output

After building, the `dist/` directory will contain:
- `index.js` - Compiled JavaScript
- `index.d.ts` - TypeScript type declarations
- `client.js` / `client.d.ts` - Client class
- `types.js` / `types.d.ts` - Type definitions
- Source maps for debugging

## Using the Client Library in Admin UI

### Installation

The Admin UI's `package.json` already references the client library as a local file dependency:

```json
{
  "dependencies": {
    "@config-hub/client": "file:../config-service-client"
  }
}
```

### Install in UI

```bash
cd ui
npm install
```

This creates a symlink to the local client library in `node_modules/@config-hub/client`.

### Usage in UI Code

The `ui/src/services/api.ts` file now re-exports the client library:

```typescript
import { ConfigServiceClient } from '@config-hub/client';

export const api = new ConfigServiceClient('/api/v1');

export type {
  Application,
  ApplicationCreate,
  // ... other types
} from '@config-hub/client';
```

All existing UI components continue to work without changes because they import from `@/services/api.js`, which now uses the client library internally.

## Development Workflow

### Making Changes to the Client Library

1. Edit files in `config-service-client/src/`
2. Rebuild the library: `cd config-service-client && npm run build`
3. The UI will automatically pick up changes (via the symlink)
4. Restart the UI dev server if needed: `cd ui && npm run dev`

### Testing the Integration

1. **Start the Config Service API:**
   ```bash
   cd config-service
   make run
   ```

2. **Build the client library:**
   ```bash
   cd config-service-client
   npm install
   npm run build
   ```

3. **Start the Admin UI:**
   ```bash
   cd ui
   npm install
   npm run dev
   ```

4. **Verify the UI can communicate with the API** through the client library.

## Benefits of This Architecture

✅ **Separation of Concerns** - Client library is independent of UI framework  
✅ **Reusability** - Any web application can use the client library  
✅ **Type Safety** - Full TypeScript support across the stack  
✅ **Single Source of Truth** - API types defined once in the client library  
✅ **Maintainability** - Changes to API client logic happen in one place  
✅ **Testability** - Client library can be tested independently  

## Publishing (Future)

To make the client library available via npm:

1. Update `package.json` with proper metadata (author, repository, etc.)
2. Build the library: `npm run build`
3. Publish to npm: `npm publish`
4. Update UI's `package.json` to use the published version:
   ```json
   {
     "dependencies": {
       "@config-hub/client": "^0.1.0"
     }
   }
   ```

## Troubleshooting

### TypeScript Errors in UI

If you see "Cannot find module '@config-hub/client'":
1. Ensure the client library is built: `cd config-service-client && npm run build`
2. Ensure UI dependencies are installed: `cd ui && npm install`
3. Restart the TypeScript server in your IDE

### Changes Not Reflected

If changes to the client library aren't appearing in the UI:
1. Rebuild the client library: `cd config-service-client && npm run build`
2. Restart the UI dev server: `cd ui && npm run dev`

### Build Errors

If the client library fails to build:
1. Check TypeScript version: `npx tsc --version` (should be 5.7+)
2. Verify all source files are valid TypeScript
3. Check `tsconfig.json` configuration
