import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/api-handlers';

// Setup MSW server
export const server = setupServer(...handlers);

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset any request handlers that are declared as a part of our tests
afterEach(() => {
  server.resetHandlers();
  // Clean up DOM
  document.body.innerHTML = '';
});

// Clean up after the tests are finished
afterAll(() => {
  server.close();
});

// Mock global fetch if not available
global.fetch = global.fetch || (() => Promise.reject(new Error('fetch not available')));

// Track registered components to avoid conflicts across tests
const registeredComponents = new Set<string>();

// Store original customElements methods
const originalCustomElements = globalThis.customElements;
const originalDefine = originalCustomElements?.define?.bind(originalCustomElements);
const originalGet = originalCustomElements?.get?.bind(originalCustomElements);

// Override customElements.define to prevent re-registration errors
if (globalThis.customElements) {
  globalThis.customElements.define = function(name: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
    // If already registered, silently ignore to prevent test conflicts
    if (registeredComponents.has(name) || (originalGet && originalGet(name))) {
      return;
    }
    
    registeredComponents.add(name);
    if (originalDefine) {
      return originalDefine(name, constructor, options);
    }
  };
} else {
  // Fallback if customElements is not available
  globalThis.customElements = {
    define: (name: string) => { registeredComponents.add(name); },
    get: () => undefined,
    upgrade: () => {},
    whenDefined: () => Promise.resolve(),
  } as any;
}

// Setup window.location for tests
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  },
  writable: true,
});

// Fix MouseEvent constructor for jsdom
Object.defineProperty(window, 'MouseEvent', {
  value: class MouseEvent extends Event {
    public button: number;
    public buttons: number;
    public clientX: number;
    public clientY: number;
    public ctrlKey: boolean;
    public shiftKey: boolean;
    public altKey: boolean;
    public metaKey: boolean;
    public detail: number;

    constructor(type: string, options: MouseEventInit = {}) {
      super(type, options);
      
      this.button = options.button || 0;
      this.buttons = options.buttons || 0;
      this.clientX = options.clientX || 0;
      this.clientY = options.clientY || 0;
      this.ctrlKey = options.ctrlKey || false;
      this.shiftKey = options.shiftKey || false;
      this.altKey = options.altKey || false;
      this.metaKey = options.metaKey || false;
      this.detail = options.detail || 0;
    }
  },
  writable: true,
});