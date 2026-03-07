# Admin Web Interface - Comprehensive Implementation Plan

## Executive Summary

This document provides a detailed implementation plan for an admin web interface for the Config Service API. The interface will be built using native Web Components (no frameworks), TypeScript, and modern browser APIs. The implementation emphasizes simplicity, testability, and adherence to web standards.

## 1. Project Overview

### 1.1 Purpose
Create an admin interface for managing applications and their configuration settings through the Config Service REST API.

### 1.2 Core Features
- **Application Management**: Create, read, update, delete applications
- **Configuration Management**: Create, read, update, delete configuration name/value pairs
- **User Interface**: Clean, responsive design using Web Components
- **Testing**: Comprehensive unit and integration testing

### 1.3 Technology Constraints
- ✅ TypeScript only (no JavaScript)
- ✅ Web Components (no React, Vue, or other frameworks)
- ✅ Native fetch API (no axios or other HTTP libraries)
- ✅ Shadow DOM for styling (no external CSS frameworks)
- ✅ pnpm for package management
- ✅ Vitest for unit testing
- ✅ Playwright for integration/e2e testing

## 2. API Endpoints Reference

### 2.1 Applications API

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| POST | `/api/v1/applications` | Create application | `{name, description?}` | Application (201) |
| GET | `/api/v1/applications` | List all applications | - | Application[] (200) |
| GET | `/api/v1/applications/{id}` | Get single application | - | Application (200) |
| PUT | `/api/v1/applications/{id}` | Update application | `{name, description?}` | Application (200) |
| DELETE | `/api/v1/applications/{id}` | Delete application | - | 204 No Content |

### 2.2 Configurations API

| Method | Endpoint | Purpose | Query Params | Request Body | Response |
|--------|----------|---------|--------------|--------------|----------|
| POST | `/api/v1/configurations` | Create configuration | - | `{application_id, name, description?, settings}` | Configuration (201) |
| GET | `/api/v1/configurations` | List configurations | `application_id?` | - | Configuration[] (200) |
| GET | `/api/v1/configurations/{id}` | Get single configuration | - | - | Configuration (200) |
| PUT | `/api/v1/configurations/{id}` | Update configuration | - | `{name?, description?, settings?}` | Configuration (200) |
| DELETE | `/api/v1/configurations/{id}` | Delete configuration | - | - | 204 No Content |

### 2.3 Data Models

**Application:**
```typescript
{
  id: string;              // ULID
  name: string;            // max 256 chars
  description?: string;    // max 1024 chars, nullable
  created_at: string;      // ISO datetime
  updated_at: string;      // ISO datetime
  configuration_ids: string[]; // Array of ULIDs
}
```

**Configuration:**
```typescript
{
  id: string;              // ULID
  application_id: string;  // ULID
  name: string;            // max 256 chars
  description?: string;    // max 1024 chars, nullable
  settings: Record<string, string>; // Key-value pairs
  created_at: string;      // ISO datetime
  updated_at: string;      // ISO datetime
}
```

## 3. Project Structure

```
ui/
├── index.html                 # Entry point HTML
├── package.json              # pnpm dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build configuration
├── vitest.config.ts          # Vitest test configuration
├── playwright.config.ts      # Playwright e2e configuration
├── .gitignore               # Git ignore patterns
├── README.md                # Project documentation
├── src/
│   ├── main.ts              # Application entry point
│   ├── types/
│   │   ├── api.ts           # API type definitions
│   │   └── api.test.ts      # Type tests
│   ├── services/
│   │   ├── api.ts           # API service layer
│   │   └── api.test.ts      # API service tests
│   ├── components/
│   │   ├── BaseComponent.ts           # Base Web Component class
│   │   ├── BaseComponent.test.ts      # Base component tests
│   │   ├── ConfigApp.ts               # Main application component
│   │   ├── ConfigApp.test.ts          # Main app tests
│   │   ├── ApplicationList.ts         # Application list component
│   │   ├── ApplicationList.test.ts    # Application list tests
│   │   ├── ApplicationForm.ts         # Create/Edit application form
│   │   ├── ApplicationForm.test.ts    # Application form tests
│   │   ├── ConfigurationList.ts       # Configuration list component
│   │   ├── ConfigurationList.test.ts  # Configuration list tests
│   │   ├── ConfigurationForm.ts       # Create/Edit configuration form
│   │   ├── ConfigurationForm.test.ts  # Configuration form tests
│   │   ├── SettingsEditor.ts          # Key-value pair editor
│   │   ├── SettingsEditor.test.ts     # Settings editor tests
│   │   ├── Modal.ts                   # Modal dialog component
│   │   ├── Modal.test.ts              # Modal tests
│   │   ├── ConfirmDialog.ts           # Confirmation dialog
│   │   └── ConfirmDialog.test.ts      # Confirm dialog tests
│   └── utils/
│       ├── validation.ts              # Input validation utilities
│       ├── validation.test.ts         # Validation tests
│       ├── formatting.ts              # Date/text formatting
│       └── formatting.test.ts         # Formatting tests
├── tests/
│   ├── setup.ts                       # Test setup and globals
│   ├── e2e/
│   │   ├── applications.spec.ts       # Application e2e tests
│   │   ├── configurations.spec.ts     # Configuration e2e tests
│   │   └── integration.spec.ts        # Full workflow tests
│   └── mocks/
│       ├── api-handlers.ts            # MSW API mock handlers
│       └── test-data.ts               # Test data fixtures
└── public/
    └── favicon.ico                    # FSavicon
```

## 4. Dependencies

### 4.1 Production Dependencies
**None** - The application uses only browser-native APIs.

### 4.2 Development Dependencies

```json
{
  "devDependencies": {
    "typescript": "^5.9.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0",
    "@vitest/ui": "^3.0.0",
    "@vitest/coverage-v8": "^3.0.0",
    "@playwright/test": "^1.50.0",
    "@types/node": "^24.0.0",
    "jsdom": "^26.0.0",
    "@testing-library/dom": "^10.0.0",
    "msw": "^2.0.0"
  }
}
```

### 4.3 Package Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "pnpm test:run && pnpm test:e2e"
  }
}
```

## 5. Architecture & Design Patterns

### 5.1 Web Components Architecture

**BaseComponent Pattern:**
```typescript
abstract class BaseComponent extends HTMLElement {
  protected shadow: ShadowRoot;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback(): void {
    this.render();
  }
  
  protected abstract render(): void;
  
  protected html(strings: TemplateStringsArray, ...values: any[]): string;
  protected css(strings: TemplateStringsArray, ...values: any[]): string;
  protected setHTML(html: string): void;
  protected emit<T>(eventName: string, detail?: T): void;
}
```

**Component Communication:**
- Parent → Child: Attributes and properties
- Child → Parent: Custom events with `detail` payload
- Sibling → Sibling: Through parent component or shared state

### 5.2 State Management

**Local Component State:**
- Each component manages its own state
- State changes trigger re-renders
- No global state management library needed

**Data Flow:**
1. User interaction → Event handler
2. Event handler → API call (if needed)
3. API response → Update component state
4. State change → Re-render component
5. Emit custom event (if parent needs to know)

### 5.3 API Service Layer

**Service Pattern:**
```typescript
class ApiService {
  private baseUrl: string;
  
  async get<T>(endpoint: string): Promise<ApiResult<T>>;
  async post<T>(endpoint: string, data: any): Promise<ApiResult<T>>;
  async put<T>(endpoint: string, data: any): Promise<ApiResult<T>>;
  async delete(endpoint: string): Promise<ApiResult<void>>;
  
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<ApiResult<T>>;
}
```

**Error Handling:**
```typescript
type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; status?: number };
```

## 6. Component Specifications

### 6.1 ConfigApp (Main Application)

**Purpose:** Root component that orchestrates the entire application.

**Responsibilities:**
- Load and display application list
- Handle application selection
- Show/hide create/edit forms
- Coordinate between child components

**State:**
```typescript
{
  applications: Application[];
  selectedApp: Application | null;
  loadingState: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  showCreateForm: boolean;
}
```

**Events Emitted:** None (root component)

**Events Listened:**
- `app-created` from ApplicationForm
- `app-updated` from ApplicationForm
- `app-deleted` from ApplicationList
- `app-selected` from ApplicationList

### 6.2 ApplicationList

**Purpose:** Display list of applications with actions.

**Responsibilities:**
- Render application list
- Handle application selection
- Trigger edit/delete actions
- Show empty state

**Props:**
```typescript
{
  applications: Application[];
  selectedId: string | null;
}
```

**Events Emitted:**
- `app-selected` - { id: string }
- `app-edit` - { application: Application }
- `app-delete` - { id: string }

**UI Elements:**
- List of application cards
- Edit button per application
- Delete button per application
- Empty state message

### 6.3 ApplicationForm

**Purpose:** Create or edit an application.

**Responsibilities:**
- Validate input fields
- Submit to API
- Handle errors
- Emit success/cancel events

**Props:**
```typescript
{
  application?: Application; // If editing
  mode: 'create' | 'edit';
}
```

**Events Emitted:**
- `app-created` - { application: Application }
- `app-updated` - { application: Application }
- `form-cancelled` - {}

**Validation Rules:**
- Name: Required, 1-256 characters
- Description: Optional, max 1024 characters

### 6.4 ConfigurationList

**Purpose:** Display configurations for selected application.

**Responsibilities:**
- Load configurations for application
- Display configuration cards
- Trigger create/edit/delete actions
- Show empty state

**Props:**
```typescript
{
  applicationId: string;
}
```

**Events Emitted:**
- `config-create` - {}
- `config-edit` - { configuration: Configuration }
- `config-delete` - { id: string }

**UI Elements:**
- List of configuration cards
- Create new button
- Edit/Delete buttons per config
- Settings preview (key-value pairs)

### 6.5 ConfigurationForm

**Purpose:** Create or edit a configuration.

**Responsibilities:**
- Validate input fields
- Manage settings key-value pairs
- Submit to API
- Handle errors

**Props:**
```typescript
{
  applicationId: string;
  configuration?: Configuration; // If editing
  mode: 'create' | 'edit';
}
```

**Events Emitted:**
- `config-created` - { configuration: Configuration }
- `config-updated` - { configuration: Configuration }
- `form-cancelled` - {}

**Validation Rules:**
- Name: Required, 1-256 characters
- Description: Optional, max 1024 characters
- Settings: Valid key-value pairs (keys non-empty)

### 6.6 SettingsEditor

**Purpose:** Edit key-value pairs for configuration settings.

**Responsibilities:**
- Add new key-value pairs
- Edit existing pairs
- Remove pairs
- Validate keys are unique and non-empty

**Props:**
```typescript
{
  settings: Record<string, string>;
}
```

**Events Emitted:**
- `settings-changed` - { settings: Record<string, string> }

**UI Elements:**
- List of key-value input pairs
- Add new pair button
- Remove pair button per row
- Validation error messages

### 6.7 Modal

**Purpose:** Generic modal dialog container.

**Responsibilities:**
- Display content in modal overlay
- Handle close on backdrop click
- Handle ESC key to close
- Trap focus within modal

**Props:**
```typescript
{
  title: string;
  open: boolean;
}
```

**Events Emitted:**
- `modal-close` - {}

**Slots:**
- Default slot for content
- Footer slot for actions

### 6.8 ConfirmDialog

**Purpose:** Confirmation dialog for destructive actions.

**Responsibilities:**
- Display confirmation message
- Handle confirm/cancel actions
- Prevent accidental deletions

**Props:**
```typescript
{
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  open: boolean;
}
```

**Events Emitted:**
- `confirm` - {}
- `cancel` - {}

## 7. Styling Strategy

### 7.1 Design System

**Color Palette:**
```css
:host {
  --color-primary: #3182ce;
  --color-primary-hover: #2c5aa0;
  --color-danger: #e53e3e;
  --color-danger-hover: #c53030;
  --color-success: #38a169;
  --color-text: #1a202c;
  --color-text-muted: #718096;
  --color-border: #e2e8f0;
  --color-bg: #ffffff;
  --color-bg-alt: #f7fafc;
  --color-bg-hover: #edf2f7;
}
```

**Typography:**
```css
:host {
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 2rem;
}
```

**Spacing:**
```css
:host {
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
}
```

**Border Radius:**
```css
:host {
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
}
```

### 7.2 Component Styling

**Shadow DOM Encapsulation:**
- Each component has isolated styles
- No global CSS pollution
- CSS custom properties for theming

**Responsive Design:**
```css
/* Mobile first approach */
.container {
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### 7.3 Accessibility

**ARIA Labels:**
- All interactive elements have labels
- Form inputs have associated labels
- Buttons have descriptive text or aria-label

**Keyboard Navigation:**
- Tab order follows visual order
- Enter/Space activate buttons
- ESC closes modals
- Focus visible on all interactive elements

**Screen Reader Support:**
- Semantic HTML elements
- ARIA roles where needed
- Live regions for dynamic content

## 8. Testing Strategy

### 8.1 Unit Testing with Vitest

**Test Organization:**
- Co-located with source files (*.test.ts)
- One test file per source file
- Descriptive test names

**Test Structure:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApplicationList } from './ApplicationList';

describe('ApplicationList', () => {
  let element: ApplicationList;
  
  beforeEach(() => {
    element = document.createElement('app-list') as ApplicationList;
    document.body.appendChild(element);
  });
  
  it('should render application list', () => {
    // Arrange
    element.applications = mockApplications;
    
    // Act
    element.connectedCallback();
    
    // Assert
    const items = element.querySelectorAll('.app-item');
    expect(items.length).toBe(mockApplications.length);
  });
});
```

**What to Test:**
- Component rendering
- Event handling
- State management
- API service calls (mocked)
- Validation logic
- Error handling
- Edge cases

**Mocking Strategy:**
- Use MSW for API mocking
- Mock fetch globally in tests
- Provide test fixtures for data

### 8.2 Integration Testing with Playwright

**Test Scenarios:**

**Application Management:**
```typescript
test('should create new application', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Create Application")');
  await page.fill('input[name="name"]', 'Test App');
  await page.fill('textarea[name="description"]', 'Test Description');
  await page.click('button:has-text("Save")');
  
  await expect(page.locator('.app-item:has-text("Test App")')).toBeVisible();
});
```

**Configuration Management:**
```typescript
test('should add configuration to application', async ({ page }) => {
  // Select application
  await page.click('.app-item:first-child');
  
  // Create configuration
  await page.click('button:has-text("Add Configuration")');
  await page.fill('input[name="name"]', 'Production Config');
  await page.click('button:has-text("Add Setting")');
  await page.fill('input[name="key-0"]', 'API_URL');
  await page.fill('input[name="value-0"]', 'https://api.example.com');
  await page.click('button:has-text("Save")');
  
  await expect(page.locator('.config-item:has-text("Production Config")')).toBeVisible();
});
```

**Error Handling:**
```typescript
test('should show error for duplicate application name', async ({ page }) => {
  // Create first app
  await createApplication(page, 'Duplicate App');
  
  // Try to create duplicate
  await page.click('button:has-text("Create Application")');
  await page.fill('input[name="name"]', 'Duplicate App');
  await page.click('button:has-text("Save")');
  
  await expect(page.locator('.error:has-text("already exists")')).toBeVisible();
});
```

### 8.3 Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: All critical user flows
- **Edge Cases**: Error states, empty states, validation

## 9. Implementation Phases

### Phase 1: Project Setup (Day 1)
1. Initialize project with pnpm
2. Configure TypeScript, Vite, Vitest
3. Set up project structure
4. Create base HTML file
5. Configure Playwright

**Deliverables:**
- Working dev server
- Test runner configured
- Build process working

### Phase 2: Foundation (Day 1-2)
1. Implement BaseComponent class
2. Create type definitions (api.ts)
3. Implement API service layer
4. Write tests for base components

**Deliverables:**
- BaseComponent with tests
- API types defined
- API service with error handling
- Service layer tests

### Phase 3: Application Management (Day 2-3)
1. Implement ConfigApp (main component)
2. Implement ApplicationList component
3. Implement ApplicationForm component
4. Implement Modal component
5. Write unit tests for all components

**Deliverables:**
- Working application list
- Create/edit application forms
- Delete confirmation
- Full test coverage

### Phase 4: Configuration Management (Day 3-4)
1. Implement ConfigurationList component
2. Implement ConfigurationForm component
3. Implement SettingsEditor component
4. Implement ConfirmDialog component
5. Write unit tests for all components

**Deliverables:**
- Working configuration list
- Create/edit configuration forms
- Settings key-value editor
- Full test coverage

### Phase 5: Polish & Testing (Day 4-5)
1. Implement validation utilities
2. Implement formatting utilities
3. Add loading states
4. Add error handling
5. Write Playwright e2e tests
6. Accessibility audit
7. Responsive design testing

**Deliverables:**
- Complete e2e test suite
- Accessibility compliant
- Responsive on all devices
- Error handling complete

### Phase 6: Documentation (Day 5)
1. Write README.md
2. Add inline code documentation
3. Create user guide
4. Document API integration

**Deliverables:**
- Complete documentation
- Setup instructions
- Usage examples

## 10. Configuration Files

### 10.1 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 10.2 vite.config.ts

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
});
```

### 10.3 vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.config.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
```

### 10.4 playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 11. Development Workflow

### 11.1 Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests in watch mode
pnpm test

# Run e2e tests
pnpm test:e2e
```

### 11.2 Development Process

1. **Create Component**
   - Create TypeScript file in `src/components/`
   - Extend BaseComponent
   - Implement render method
   - Add Shadow DOM styles

2. **Write Tests**
   - Create test file (*.test.ts)
   - Test rendering
   - Test interactions
   - Test edge cases

3. **Register Component**
   - Add to main.ts
   - Use customElements.define()

4. **Integration**
   - Use in parent component
   - Handle events
   - Pass props

### 11.3 Code Quality Checklist

- [ ] TypeScript strict mode passes
- [ ] All tests pass
- [ ] Code coverage > 80%
- [ ] No console errors
- [ ] Accessibility audit passes
- [ ] Responsive on mobile/tablet/desktop
- [ ] Works in Chrome, Firefox, Safari
- [ ] Error states handled
- [ ] Loading states shown
- [ ] Empty states shown

## 12. Error Handling Patterns

### 12.1 API Errors

```typescript
async function handleApiCall<T>(
  apiCall: () => Promise<ApiResult<T>>,
  onSuccess: (data: T) => void,
  onError: (error: string) => void
): Promise<void> {
  const result = await apiCall();
  
  if (result.success) {
    onSuccess(result.data);
  } else {
    onError(result.error);
  }
}
```

### 12.2 Validation Errors

```typescript
interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

function validateApplicationForm(data: {
  name: string;
  description?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (data.name.length > 256) {
    errors.name = 'Name must be 256 characters or less';
  }
  
  if (data.description && data.description.length > 1024) {
    errors.description = 'Description must be 1024 characters or less';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
```

### 12.3 User Feedback

**Success Messages:**
- Show toast/notification
- Auto-dismiss after 3 seconds
- Green color scheme

**Error Messages:**
- Show inline near relevant field
- Persist until user corrects
- Red color scheme
- Clear, actionable text

**Loading States:**
- Show spinner or skeleton
- Disable form during submission
- Prevent double-submission

## 13. Accessibility Requirements

### 13.1 Keyboard Navigation

- All interactive elements focusable
- Logical tab order
- Visible focus indicators
- Keyboard shortcuts documented

### 13.2 Screen Readers

- Semantic HTML elements
- ARIA labels on custom elements
- Live regions for dynamic updates
- Alt text for images (if any)

### 13.3 Color Contrast

- WCAG AA compliance minimum
- 4.5:1 for normal text
- 3:1 for large text
- Don't rely on color alone

## 14. Performance Considerations

### 14.1 Optimization Strategies

- Lazy load components when needed
- Debounce search/filter inputs
- Virtual scrolling for long lists (if needed)
- Minimize re-renders

### 14.2 Bundle Size

- No external dependencies
- Tree-shaking enabled
- Code splitting by route (if needed)
- Minification in production

## 15. Security Considerations

### 15.1 Input Sanitization

- Escape HTML in user input
- Validate all form inputs
- Prevent XSS attacks
- Use textContent, not innerHTML

### 15.2 API Security

- CORS properly configured
- HTTPS in production
- No sensitive data in URLs
- Proper error messages (no stack traces)

## 16. Future Enhancements (Not in Scope)

- Authentication/Authorization
- Real-time updates (WebSockets)
- Bulk operations
- Import/Export configurations
- Search and filtering
- Sorting options
- Pagination for large datasets
- Undo/Redo functionality
- Keyboard shortcuts
- Dark mode
- Internationalization (i18n)

## 17. Success Criteria

The implementation will be considered complete when:

1. ✅ All components implemented and tested
2. ✅ Unit test coverage > 80%
3. ✅ All e2e tests passing
4. ✅ Accessibility audit passes
5. ✅ Works in Chrome, Firefox, Safari
6. ✅ Responsive on mobile, tablet, desktop
7. ✅ No TypeScript errors
8. ✅ No console errors or warnings
9. ✅ Documentation complete
10. ✅ Can perform all CRUD operations
11. ✅ Error handling comprehensive
12. ✅ Loading states implemented
13. ✅ Empty states implemented
14. ✅ Confirmation dialogs for destructive actions

## 18. Conclusion

This implementation plan provides a comprehensive roadmap for building a production-ready admin web interface using modern web standards. The emphasis on Web Components, TypeScript, and comprehensive testing ensures a maintainable, accessible, and robust application that integrates seamlessly with the Config Service API.

By following this plan step-by-step and adhering to the specified constraints (no frameworks, native APIs only), you will create a clean, performant, and well-tested admin interface that demonstrates the power of modern web platform capabilities.
