import { server } from '../setup';
import { http, HttpResponse } from 'msw';

/**
 * Test helper utilities for UI testing
 */

/**
 * Creates a test component instance and appends it to the DOM
 * @param ComponentClass - The component class to instantiate
 * @param tagName - The custom element tag name (will be made unique)
 * @returns The component instance
 */
export function createTestComponent<T extends HTMLElement>(
  ComponentClass: new () => T,
  tagName: string
): T {
  // Generate unique tag name to avoid conflicts
  const uniqueTagName = `${tagName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Use our safe component registration
  safeDefineComponent(uniqueTagName, ComponentClass);
  
  const component = new ComponentClass();
  document.body.appendChild(component);
  return component;
}

/**
 * Safely defines a custom element, avoiding registration conflicts
 * @param name - The element name
 * @param constructor - The constructor function
 */
export function safeDefineComponent(name: string, constructor: CustomElementConstructor): void {
  if (!customElements.get(name)) {
    try {
      customElements.define(name, constructor);
    } catch (error) {
      // Silently ignore registration conflicts
      console.warn(`Component ${name} already registered, skipping`);
    }
  }
}

/**
 * Cleans up a test component from the DOM
 * @param component - The component to clean up
 */
export function cleanupTestComponent(component: HTMLElement): void {
  if (component.parentNode) {
    component.parentNode.removeChild(component);
  }
}

/**
 * Waits for a custom event to be dispatched
 * @param element - The element to listen on
 * @param eventName - The event name to wait for
 * @param timeout - Timeout in milliseconds (default: 1000)
 * @returns Promise that resolves with the event
 */
export function waitForEvent<T = any>(
  element: EventTarget,
  eventName: string,
  timeout = 1000
): Promise<CustomEvent<T>> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      element.removeEventListener(eventName, handler);
      reject(new Error(`Event '${eventName}' not fired within ${timeout}ms`));
    }, timeout);

    const handler = (event: Event) => {
      clearTimeout(timeoutId);
      element.removeEventListener(eventName, handler);
      resolve(event as CustomEvent<T>);
    };

    element.addEventListener(eventName, handler);
  });
}

/**
 * Waits for the next animation frame
 * @returns Promise that resolves after the next animation frame
 */
export function waitForAnimationFrame(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => resolve());
  });
}

/**
 * Waits for a specified number of milliseconds
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a mock API error response
 * @param endpoint - The API endpoint to mock
 * @param status - HTTP status code
 * @param message - Error message
 */
export function mockApiError(endpoint: string, status: number, message: string): void {
  server.use(
    http.get(endpoint, () => {
      return HttpResponse.json({ detail: message }, { status });
    }),
    http.post(endpoint, () => {
      return HttpResponse.json({ detail: message }, { status });
    }),
    http.put(endpoint, () => {
      return HttpResponse.json({ detail: message }, { status });
    }),
    http.delete(endpoint, () => {
      return HttpResponse.json({ detail: message }, { status });
    })
  );
}

/**
 * Creates a mock network error for testing
 * @param endpoint - The API endpoint to mock
 */
export function mockNetworkError(endpoint: string): void {
  server.use(
    http.get(endpoint, () => HttpResponse.error()),
    http.post(endpoint, () => HttpResponse.error()),
    http.put(endpoint, () => HttpResponse.error()),
    http.delete(endpoint, () => HttpResponse.error())
  );
}

/**
 * Simulates user input on an element
 * @param element - The input or textarea element
 * @param value - The value to input
 */
export function simulateInput(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Simulates a click event on an element
 * @param element - The element to click
 */
export function simulateClick(element: HTMLElement): void {
  element.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    cancelable: true
  }));
}

/**
 * Gets the computed style of an element
 * @param element - The element to get styles for
 * @param property - The CSS property to get
 * @returns The computed style value
 */
export function getComputedStyleProperty(element: HTMLElement, property: string): string {
  return getComputedStyle(element).getPropertyValue(property);
}

/**
 * Checks if an element is visible in the DOM
 * @param element - The element to check
 * @returns True if the element is visible
 */
export function isElementVisible(element: HTMLElement): boolean {
  const style = getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0';
}

/**
 * Creates a shadow DOM test helper for Web Components
 * @param component - The component with shadow DOM
 * @returns Helper object with query methods
 */
export function createShadowDOMHelper(component: Element) {
  const shadowRoot = component.shadowRoot;
  
  if (!shadowRoot) {
    throw new Error('Component does not have shadow DOM');
  }
  
  return {
    querySelector: <T extends Element>(selector: string): T | null => {
      return shadowRoot.querySelector<T>(selector);
    },
    querySelectorAll: <T extends Element>(selector: string): NodeListOf<T> => {
      return shadowRoot.querySelectorAll<T>(selector);
    },
    innerHTML: shadowRoot.innerHTML,
    textContent: shadowRoot.textContent
  };
}

/**
 * Mock ULID generator for consistent testing
 * @returns A mock ULID string
 */
export function mockULID(): string {
  return '01ARZ3NDEKTSV4RRFFQ69G5FAV';
}

/**
 * Creates a mock application response for testing
 * @param overrides - Optional property overrides
 * @returns Mock application response
 */
export function createMockApplication(overrides: Partial<{
  id: string;
  name: string;
  description: string | null;
}> = {}) {
  return {
    id: mockULID(),
    name: 'Test Application',
    description: 'Test application description',
    ...overrides
  };
}

/**
 * Creates a mock configuration response for testing
 * @param applicationId - The application ID
 * @param config - The configuration object
 * @returns Mock configuration response
 */
export function createMockConfiguration(
  applicationId: string = mockULID(),
  config: Record<string, any> = { theme: 'dark', timeout: 30 }
) {
  return {
    application_id: applicationId,
    config
  };
}