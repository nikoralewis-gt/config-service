# Config Service Admin UI

A modern admin web interface for the Config Service API, built with native Web Components, TypeScript, and zero external runtime dependencies.

## Features

- ✅ **Application Management**: Create, read, update, and delete applications
- ✅ **Configuration Management**: Manage configuration settings with key-value pairs
- ✅ **Web Components**: Built with native browser APIs, no frameworks
- ✅ **TypeScript**: Fully typed for better developer experience
- ✅ **Shadow DOM**: Encapsulated styles, no CSS conflicts
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile
- ✅ **Zero Runtime Dependencies**: Only browser-native APIs

## Tech Stack

- **Language**: TypeScript 5.9+
- **Build Tool**: Vite 6.0+
- **Testing**: Vitest 3.0+ (unit tests), Playwright 1.50+ (e2e tests)
- **Package Manager**: pnpm
- **Architecture**: Web Components with Shadow DOM

## Prerequisites

- Node.js 18+ or 20+
- pnpm 8+
- Config Service API running on `http://localhost:8000`

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### 3. Build for Production

```bash
pnpm build
```

The built files will be in the `dist/` directory.

### 4. Preview Production Build

```bash
pnpm preview
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm test` | Run unit tests in watch mode |
| `pnpm test:run` | Run unit tests once |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm test:ui` | Run tests with Vitest UI |
| `pnpm test:e2e` | Run Playwright e2e tests |
| `pnpm test:e2e:ui` | Run e2e tests with Playwright UI |
| `pnpm test:all` | Run all tests (unit + e2e) |

## Project Structure

```
ui/
├── index.html                 # Entry point HTML
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build configuration
├── vitest.config.ts          # Vitest test configuration
├── playwright.config.ts      # Playwright e2e configuration
├── src/
│   ├── main.ts              # Application entry point
│   ├── types/
│   │   └── api.ts           # API type definitions
│   ├── services/
│   │   └── api.ts           # API service layer
│   └── components/
│       ├── BaseComponent.ts           # Base Web Component class
│       ├── ConfigApp.ts               # Main application component
│       ├── ApplicationForm.ts         # Create/Edit application form
│       ├── ConfigurationList.ts       # Configuration list component
│       └── ConfigurationForm.ts       # Create/Edit configuration form
└── tests/
    ├── setup.ts             # Test setup
    ├── e2e/                 # End-to-end tests
    └── mocks/               # Test mocks and fixtures
```

## Architecture

### Web Components

The application is built using native Web Components with the following architecture:

1. **BaseComponent**: Abstract base class providing common functionality
   - Shadow DOM management
   - Template rendering
   - Event emission
   - HTML escaping for XSS prevention

2. **ConfigApp**: Root component orchestrating the application
   - Manages application list
   - Handles application selection
   - Coordinates child components

3. **ApplicationForm**: Create/edit application form
   - Form validation
   - API integration
   - Error handling

4. **ConfigurationList**: Displays configurations for selected application
   - Loads configurations via API
   - Manages create/edit/delete actions
   - Shows settings preview

5. **ConfigurationForm**: Create/edit configuration form
   - Dynamic key-value pair editor
   - Form validation
   - Settings management

### Component Communication

- **Parent → Child**: Attributes and properties
- **Child → Parent**: Custom events with detail payload
- **State Management**: Local component state, no global store

### API Integration

The `api.ts` service provides a clean interface to the Config Service REST API:

```typescript
// Applications
await api.getApplications()
await api.getApplication(id)
await api.createApplication(data)
await api.updateApplication(id, data)
await api.deleteApplication(id)

// Configurations
await api.getConfigurations(applicationId?)
await api.getConfiguration(id)
await api.createConfiguration(data)
await api.updateConfiguration(id, data)
await api.deleteConfiguration(id)
```

All API methods return a typed `ApiResult<T>`:

```typescript
type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; status?: number };
```

## Development

### Adding a New Component

1. Create a new TypeScript file in `src/components/`
2. Extend `BaseComponent`
3. Implement the `render()` method
4. Register with `customElements.define()`
5. Import in `main.ts`

Example:

```typescript
import { BaseComponent } from './BaseComponent.js';

export class MyComponent extends BaseComponent {
  protected render(): void {
    const styles = this.css`
      <style>
        :host {
          display: block;
        }
      </style>
    `;

    this.setHTML(`
      ${styles}
      <div>My Component</div>
    `);
  }
}

customElements.define('my-component', MyComponent);
```

### Styling

Each component has encapsulated styles using Shadow DOM:

- Styles are scoped to the component
- No global CSS pollution
- Use CSS custom properties for theming
- Mobile-first responsive design

### Type Safety

All code is fully typed with TypeScript:

- Strict mode enabled
- No implicit any
- Comprehensive type definitions for API models
- Type-safe event handling

## Testing

### Unit Tests

Unit tests are co-located with source files using the `*.test.ts` naming convention:

```bash
pnpm test              # Watch mode
pnpm test:run          # Run once
pnpm test:coverage     # With coverage
```

### E2E Tests

End-to-end tests use Playwright:

```bash
pnpm test:e2e          # Run e2e tests
pnpm test:e2e:ui       # With Playwright UI
```

## API Configuration

The UI expects the Config Service API to be running at `http://localhost:8000`.

To change the API URL, update the proxy configuration in `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://your-api-url:port',
      changeOrigin: true
    }
  }
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires support for:
- Web Components (Custom Elements v1)
- Shadow DOM v1
- ES2020
- Fetch API

## Security

- **XSS Prevention**: All user input is escaped before rendering
- **CORS**: Configured via Vite proxy
- **No innerHTML**: Uses `textContent` for user data
- **Input Validation**: Client-side and server-side validation

## Performance

- **Zero Runtime Dependencies**: Minimal bundle size
- **Code Splitting**: Automatic via Vite
- **Tree Shaking**: Removes unused code
- **Lazy Loading**: Components loaded on demand
- **Shadow DOM**: Efficient style encapsulation

## Accessibility

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus management
- Screen reader friendly

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, modify `vite.config.ts`:

```typescript
server: {
  port: 3001, // Change to available port
}
```

### API Connection Issues

1. Ensure Config Service API is running on `http://localhost:8000`
2. Check browser console for CORS errors
3. Verify API endpoints are accessible

### TypeScript Errors

Run type checking:

```bash
pnpm type-check
```

### Build Errors

Clear cache and reinstall:

```bash
rm -rf node_modules .vite dist
pnpm install
pnpm build
```

## Contributing

1. Follow TypeScript strict mode
2. Add tests for new features
3. Use meaningful commit messages
4. Ensure all tests pass before committing

## License

ISC

## Related

- [Config Service API](../config-service/README.md)
- [Implementation Plan](../prompts/5-admin-ui-plan.md)
