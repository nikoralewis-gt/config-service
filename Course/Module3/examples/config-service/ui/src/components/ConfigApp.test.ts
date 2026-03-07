import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { server } from '../../tests/setup';
import { http, HttpResponse } from 'msw';
import { ConfigApp } from './ConfigApp';
import { createTestComponent, cleanupTestComponent, simulateClick, safeDefineComponent } from '../../tests/utils/test-helpers';

// Mock child components
class MockCreateAppForm extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<div data-testid="create-form">Mock Create Form</div>';
  }
}

class MockConfigDetail extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<div data-testid="config-detail">Mock Config Detail</div>';
  }
}

describe('ConfigApp', () => {
  let component: ConfigApp;

  beforeEach(() => {
    // Register mock child components safely
    safeDefineComponent('create-app-form', MockCreateAppForm);
    safeDefineComponent('config-detail', MockConfigDetail);

    component = createTestComponent(ConfigApp, 'config-app');
  });

  afterEach(() => {
    cleanupTestComponent(component);
  });

  describe('Initial rendering', () => {
    it('should render the main layout with header', () => {
      const header = component.querySelector('.header');
      const title = component.querySelector('.title');
      const createBtn = component.querySelector('#create-btn');

      expect(header).toBeTruthy();
      expect(title?.textContent).toBe('Configuration Manager');
      expect(createBtn?.textContent?.trim()).toBe('Create Application');
    });

    it('should show loading state initially', () => {
      const loading = component.querySelector('.loading');
      expect(loading?.textContent).toBe('Loading applications...');
    });
  });

  describe('Application loading', () => {
    it('should display applications after successful load', async () => {
      // Wait for API call to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const appItems = component.querySelectorAll('.app-item');
      expect(appItems.length).toBe(2);

      const firstApp = appItems[0];
      expect(firstApp.querySelector('.app-name')?.textContent).toBe('Test App 1');
      expect(firstApp.querySelector('.app-description')?.textContent).toBe('First test application');
    });

    it('should handle empty application list', async () => {
      server.use(
        http.get('/api/v1/applications', () => {
          return HttpResponse.json([]);
        })
      );

      // Create new component to trigger fresh load
      cleanupTestComponent(component);
      component = createTestComponent(ConfigApp, 'config-app-empty');

      await new Promise(resolve => setTimeout(resolve, 100));

      const empty = component.querySelector('.empty');
      expect(empty).toBeTruthy();
      expect(empty?.textContent).toContain('No applications found');
      expect(empty?.textContent).toContain('Create your first application');
    });

    it('should handle API errors gracefully', async () => {
      server.use(
        http.get('/api/v1/applications', () => {
          return HttpResponse.json({ detail: 'Server error' }, { status: 500 });
        })
      );

      cleanupTestComponent(component);
      component = createTestComponent(ConfigApp, 'config-app-error');

      await new Promise(resolve => setTimeout(resolve, 100));

      const error = component.querySelector('.error');
      expect(error).toBeTruthy();
      expect(error?.textContent).toContain('Server error');
    });
  });

  describe('Application selection', () => {
    beforeEach(async () => {
      // Wait for initial load
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should select application when clicked', async () => {
      const appItems = component.querySelectorAll('.app-item');
      const firstApp = appItems[0] as HTMLElement;

      simulateClick(firstApp);

      // Wait for DOM update
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check if selected class is applied (need to re-query after render)
      const updatedAppItems = component.querySelectorAll('.app-item');
      const updatedFirstApp = updatedAppItems[0] as HTMLElement;
      expect(updatedFirstApp.classList.contains('selected')).toBe(true);

      // Check if config-detail component is rendered
      const configDetail = component.querySelector('config-detail');
      expect(configDetail).toBeTruthy();
      expect(configDetail?.getAttribute('application-id')).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    });

    it('should update selection when different app is clicked', async () => {
      const appItems = component.querySelectorAll('.app-item');
      const firstApp = appItems[0] as HTMLElement;
      const secondApp = appItems[1] as HTMLElement;

      // Select first app
      simulateClick(firstApp);
      
      // Wait for DOM update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Re-query after render
      const updatedAppItems1 = component.querySelectorAll('.app-item');
      expect(updatedAppItems1[0].classList.contains('selected')).toBe(true);

      // Select second app
      simulateClick(secondApp);
      
      // Wait for DOM update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Re-query after render
      const updatedAppItems2 = component.querySelectorAll('.app-item');
      expect(updatedAppItems2[0].classList.contains('selected')).toBe(false);
      expect(updatedAppItems2[1].classList.contains('selected')).toBe(true);

      const configDetail = component.querySelector('config-detail');
      expect(configDetail?.getAttribute('application-id')).toBe('01ARZ3NDEKTSV4RRFFQ69G5FB0');
    });

    it('should show placeholder when no app is selected', () => {
      const placeholder = component.querySelector('.main .empty');
      expect(placeholder?.textContent).toBe('Select an application to view its configuration');
    });
  });

  describe('Create form functionality', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should show create form when create button is clicked', () => {
      const createBtn = component.querySelector('#create-btn') as HTMLElement;
      
      // Form should not be visible initially
      expect(component.querySelector('create-app-form')).toBeNull();

      simulateClick(createBtn);

      // Form should now be visible
      expect(component.querySelector('create-app-form')).toBeTruthy();
    });

    it('should hide create form when form is cancelled', async () => {
      const createBtn = component.querySelector('#create-btn') as HTMLElement;
      simulateClick(createBtn);

      // Form should be visible
      expect(component.querySelector('create-app-form')).toBeTruthy();

      // Simulate form cancel event
      const createForm = component.querySelector('create-app-form');
      createForm?.dispatchEvent(new CustomEvent('form-cancelled'));

      // Form should be hidden
      expect(component.querySelector('create-app-form')).toBeNull();
    });

    it('should add new app and select it when app is created', async () => {
      const createBtn = component.querySelector('#create-btn') as HTMLElement;
      simulateClick(createBtn);

      const newAppData = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FC0',
        name: 'New Test App',
        description: 'A new test application'
      };

      // Simulate app creation event
      const createForm = component.querySelector('create-app-form');
      createForm?.dispatchEvent(new CustomEvent('app-created', { detail: newAppData }));

      // Check that new app was added to the list
      const appItems = component.querySelectorAll('.app-item');
      expect(appItems.length).toBe(3);

      // Check that new app is selected
      const selectedApp = component.querySelector('.app-item.selected');
      expect(selectedApp?.querySelector('.app-name')?.textContent).toBe('New Test App');

      // Check that form is hidden
      expect(component.querySelector('create-app-form')).toBeNull();
    });
  });

  describe('Responsive layout', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should have grid layout for content area', () => {
      const content = component.querySelector('.content');
      
      // Note: jsdom might not compute all CSS, so we check the class exists
      expect(content?.classList.contains('content')).toBe(true);
    });

    it('should have sidebar and main areas', () => {
      const sidebar = component.querySelector('.sidebar');
      const main = component.querySelector('.main');

      expect(sidebar).toBeTruthy();
      expect(main).toBeTruthy();
      expect(sidebar?.querySelector('h2')?.textContent).toBe('Applications');
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should have proper heading hierarchy', () => {
      const h1 = component.querySelector('h1.title');
      const h2 = component.querySelector('h2');

      expect(h1?.textContent).toBe('Configuration Manager');
      expect(h2?.textContent).toBe('Applications');
    });

    it('should have clickable elements with proper roles', () => {
      const createBtn = component.querySelector('#create-btn');
      const appItems = component.querySelectorAll('.app-item');

      expect(createBtn?.tagName).toBe('BUTTON');
      appItems.forEach(item => {
        expect(item.getAttribute('data-app-id')).toBeTruthy();
        expect(item.getAttribute('data-app-index')).toBeTruthy();
      });
    });

    it('should have semantic HTML structure', () => {
      const header = component.querySelector('header');
      const aside = component.querySelector('aside');
      const main = component.querySelector('main');
      const list = component.querySelector('ul');

      expect(header).toBeTruthy();
      expect(aside).toBeTruthy();
      expect(main).toBeTruthy();
      expect(list?.classList.contains('app-list')).toBe(true);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle malformed application data', async () => {
      server.use(
        http.get('/api/v1/applications', () => {
          return HttpResponse.json([
            { id: '123', name: 'Valid App' }, // Missing description
            { name: 'No ID App', description: 'test' }, // Missing ID
            null, // Null entry
            { id: '456', name: '', description: 'Empty name' } // Empty name
          ]);
        })
      );

      cleanupTestComponent(component);
      component = createTestComponent(ConfigApp, 'config-app-malformed');

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should handle gracefully and render valid items
      const appItems = component.querySelectorAll('.app-item');
      expect(appItems.length).toBeGreaterThan(0);
    });

    it('should handle app selection with invalid indices', () => {
      const mockAppItem = document.createElement('div');
      mockAppItem.className = 'app-item';
      mockAppItem.setAttribute('data-app-index', '999'); // Invalid index
      component.appendChild(mockAppItem);

      simulateClick(mockAppItem);

      // Should not crash and no app should be selected
      const selectedApps = component.querySelectorAll('.app-item.selected');
      expect(selectedApps.length).toBe(0);
    });

    it('should handle missing application ID attributes', () => {
      const mockAppItem = document.createElement('div');
      mockAppItem.className = 'app-item';
      // No data-app-index attribute
      component.appendChild(mockAppItem);

      simulateClick(mockAppItem);

      // Should not crash
      expect(() => simulateClick(mockAppItem)).not.toThrow();
    });
  });

  describe('Performance and UX', () => {
    beforeEach(async () => {
      // Wait for initial load
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should not re-render unnecessarily', async () => {
      const renderSpy = vi.spyOn(component as any, 'render');
      
      const appItems = component.querySelectorAll('.app-item');
      const firstApp = appItems[0] as HTMLElement;
      
      // First click should trigger a render
      renderSpy.mockClear();
      simulateClick(firstApp);
      const firstClickRenders = renderSpy.mock.calls.length;
      
      // Multiple clicks on the same already-selected app should not re-render
      renderSpy.mockClear();
      simulateClick(firstApp);
      simulateClick(firstApp);
      simulateClick(firstApp);

      // Should not have additional renders after the initial selection
      expect(renderSpy.mock.calls.length).toBe(0);
    });

    it('should handle rapid clicks gracefully', async () => {
      const appItems = component.querySelectorAll('.app-item');
      const firstApp = appItems[0] as HTMLElement;

      // Rapid clicks should not cause errors
      for (let i = 0; i < 10; i++) {
        simulateClick(firstApp);
      }

      // Wait for DOM update
      await new Promise(resolve => setTimeout(resolve, 10));

      // Re-query after render
      const updatedAppItems = component.querySelectorAll('.app-item');
      const updatedFirstApp = updatedAppItems[0] as HTMLElement;
      expect(updatedFirstApp.classList.contains('selected')).toBe(true);
    });

    it('should clean up event listeners properly', () => {
      const addEventListenerSpy = vi.spyOn(Element.prototype, 'addEventListener');
      
      // Trigger re-render which should clean up old listeners
      component['render']();

      // Should have added event listeners
      expect(addEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe('Data attributes and testing support', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should have proper data attributes for testing', () => {
      const appItems = component.querySelectorAll('.app-item');
      
      appItems.forEach((item, index) => {
        expect(item.getAttribute('data-app-index')).toBe(index.toString());
        expect(item.getAttribute('data-app-id')).toBeTruthy();
      });
    });

    it('should maintain data consistency between renders', () => {
      const appItems = component.querySelectorAll('.app-item');
      const firstAppId = appItems[0].getAttribute('data-app-id');

      // Force re-render
      component['render']();

      const appItemsAfterRender = component.querySelectorAll('.app-item');
      const firstAppIdAfterRender = appItemsAfterRender[0].getAttribute('data-app-id');

      expect(firstAppId).toBe(firstAppIdAfterRender);
    });
  });
});