import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers, resetMockData } from './mocks/api-handlers';

// Setup MSW server
export const server = setupServer(...handlers);

// Mock global fetch if not available
globalThis.fetch = globalThis.fetch || (() => Promise.reject(new Error('fetch not available')));

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });

  // Fix AbortSignal compatibility between Node.js and jsdom AFTER MSW hooks in
  // jsdom's fetch doesn't recognize Node.js AbortSignal instances, causing
  // "Expected signal to be an instance of AbortSignal" errors
  const mswFetch = globalThis.fetch;
  if (!mswFetch) {
    return;
  }
  globalThis.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (init?.signal) {
      const { signal, ...restInit } = init;
      return mswFetch.call(globalThis, input, restInit);
    }
    return mswFetch.call(globalThis, input, init);
  } as typeof fetch;
});

// Reset any request handlers that are declared as a part of our tests
afterEach(() => {
  resetMockData();
  server.resetHandlers();
  // Clean up DOM
  document.body.innerHTML = '';
});

// Clean up after the tests are finished
afterAll(() => {
  server.close();
});

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