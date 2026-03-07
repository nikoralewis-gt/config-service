import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { server } from '../../tests/setup';
import { http, HttpResponse } from 'msw';
import { resetMockData } from '../../tests/mocks/api-handlers';
import { ConfigApp } from '../components/ConfigApp';
import { ConfigDetail } from '../components/ConfigDetail';
import { CreateAppForm } from '../components/CreateAppForm';
import { createTestComponent, cleanupTestComponent, simulateClick, simulateInput, waitForEvent } from '../../tests/utils/test-helpers';

// Register all components for integration testing
function registerComponents() {
  if (!customElements.get('config-app')) {
    customElements.define('config-app', ConfigApp);
  }
  if (!customElements.get('config-detail')) {
    customElements.define('config-detail', ConfigDetail);
  }
  if (!customElements.get('create-app-form')) {
    customElements.define('create-app-form', CreateAppForm);
  }
}

const RENDER_WAIT_MS = 150;
const FAST_RENDER_WAIT_MS = 50;
const API_RENDER_WAIT_MS = 200;
const API_RENDER_LONG_WAIT_MS = 250;

// Helper to wait for component to render
async function waitForRender(ms = RENDER_WAIT_MS): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

describe('Component Integration Tests', () => {
  beforeEach(() => {
    registerComponents();
  });

  describe('ConfigApp + CreateAppForm Integration', () => {
    let configApp: ConfigApp;

    beforeEach(async () => {
      configApp = createTestComponent(ConfigApp, 'config-app-integration');
      // Wait for initial load and render
      await waitForRender();
    });

    afterEach(() => {
      cleanupTestComponent(configApp);
    });

    it('should show create form when create button is clicked', async () => {
      const createBtn = configApp.querySelector('#create-btn') as HTMLElement;
      expect(createBtn).toBeTruthy();
      simulateClick(createBtn);
      
      await waitForRender();

      const createForm = configApp.querySelector('create-app-form');
      expect(createForm).toBeTruthy();
      expect(createForm?.querySelector('.form-title')?.textContent).toBe('Create New Application');
    });

    it('should hide create form when cancelled', async () => {
      // Show form
      const createBtn = configApp.querySelector('#create-btn') as HTMLElement;
      expect(createBtn).toBeTruthy();
      simulateClick(createBtn);
      
      await waitForRender();

      // Cancel form
      const createForm = configApp.querySelector('create-app-form');
      expect(createForm).toBeTruthy();

      const cancelBtn = createForm?.querySelector('#cancel-btn') as HTMLElement;
      expect(cancelBtn).toBeTruthy();
      simulateClick(cancelBtn);

      await waitForRender();

      // Form should be hidden
      const formAfterCancel = configApp.querySelector('create-app-form');
      expect(formAfterCancel).toBeNull();
    });

    it('should add new application to list when created', async () => {
      // Get initial app count
      const initialApps = configApp.querySelectorAll('.app-item');
      const initialCount = initialApps.length;

      // Show create form
      const createBtn = configApp.querySelector('#create-btn') as HTMLElement;
      expect(createBtn).toBeTruthy();
      simulateClick(createBtn);

      await waitForRender();

      // Fill and submit form
      const createForm = configApp.querySelector('create-app-form');
      const nameInput = createForm?.querySelector('#app-name') as HTMLInputElement;
      const descInput = createForm?.querySelector('#app-description') as HTMLTextAreaElement;
      const submitBtn = createForm?.querySelector('#submit-btn') as HTMLElement;

      expect(nameInput).toBeTruthy();
      expect(submitBtn).toBeTruthy();

      simulateInput(nameInput, 'integration-test-app');
      if (descInput) {
        simulateInput(descInput, 'Created via integration test');
      }
      simulateClick(submitBtn);

      // Wait for API call and re-render
      await waitForRender(API_RENDER_WAIT_MS);

      // Check new app was added
      const finalApps = configApp.querySelectorAll('.app-item');
      expect(finalApps.length).toBe(initialCount + 1);

      // Check new app is selected
      const selectedApp = configApp.querySelector('.app-item.selected');
      expect(selectedApp?.querySelector('.app-name')?.textContent).toBe('integration-test-app');

      // Form should be hidden
      const formAfterCreate = configApp.querySelector('create-app-form');
      expect(formAfterCreate).toBeNull();
    });

    it('should handle form submission errors gracefully', async () => {
      server.use(
        http.post('/api/v1/applications', () => {
          return HttpResponse.json({ detail: 'Creation failed' }, { status: 400 });
        })
      );

      // Show and submit form
      const createBtn = configApp.querySelector('#create-btn') as HTMLElement;
      expect(createBtn).toBeTruthy();
      simulateClick(createBtn);

      await waitForRender();

      const createForm = configApp.querySelector('create-app-form');
      const nameInput = createForm?.querySelector('#app-name') as HTMLInputElement;
      const submitBtn = createForm?.querySelector('#submit-btn') as HTMLElement;

      expect(nameInput).toBeTruthy();
      expect(submitBtn).toBeTruthy();

      simulateInput(nameInput, 'error-test-app');
      simulateClick(submitBtn);

      await waitForRender(API_RENDER_WAIT_MS);

      // Form should still be visible with error
      const formAfterError = configApp.querySelector('create-app-form');
      expect(formAfterError).toBeTruthy();

      const errorMessage = formAfterError?.querySelector('.error-message');
      expect(errorMessage?.textContent).toBe('Creation failed');
    });
  });

  describe('ConfigApp + ConfigDetail Integration', () => {
    let configApp: ConfigApp;

    beforeEach(async () => {
      resetMockData();
      configApp = createTestComponent(ConfigApp, 'config-app-detail-integration');
      await waitForRender();
    });

    afterEach(() => {
      cleanupTestComponent(configApp);
    });

    it('should display config detail when application is selected', async () => {
      const appItems = configApp.querySelectorAll('.app-item');
      const firstApp = appItems[0] as HTMLElement;
      expect(firstApp).toBeTruthy();

      simulateClick(firstApp);
      await waitForRender();

      const configDetail = configApp.querySelector('config-detail');
      expect(configDetail).toBeTruthy();
      expect(configDetail?.getAttribute('application-id')).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    });

    it('should update config detail when different app is selected', async () => {
      const appItems = configApp.querySelectorAll('.app-item');
      const firstApp = appItems[0] as HTMLElement;
      const secondApp = appItems[1] as HTMLElement;

      expect(firstApp).toBeTruthy();
      expect(secondApp).toBeTruthy();

      // Select first app
      simulateClick(firstApp);
      await waitForRender();
      
      let configDetail = configApp.querySelector('config-detail');
      expect(configDetail?.getAttribute('application-id')).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');

      // Select second app
      simulateClick(secondApp);
      await waitForRender();
      
      configDetail = configApp.querySelector('config-detail');
      expect(configDetail?.getAttribute('application-id')).toBe('01ARZ3NDEKTSV4RRFFQ69G5FB0');
    });

    it('should handle config detail loading states', async () => {
      // Mock slow API response to ensure loading state is visible
      const { server } = await import('../../tests/setup');
      const { http, HttpResponse } = await import('msw');
      
      server.use(
        http.get('/api/v1/applications/:id/config', async ({ params }) => {
          await new Promise(resolve => setTimeout(resolve, 200));
          return HttpResponse.json({
            application_id: params.id,
            config: { theme: 'dark', timeout: 30 }
          });
        })
      );

      const appItems = configApp.querySelectorAll('.app-item');
      const firstApp = appItems[0] as HTMLElement;
      expect(firstApp).toBeTruthy();

      simulateClick(firstApp);
      await waitForRender(FAST_RENDER_WAIT_MS);

      const configDetail = configApp.querySelector('config-detail');
      expect(configDetail).toBeTruthy();
      
      // Should initially show loading
      const loading = configDetail?.querySelector('.loading');
      expect(loading?.textContent).toBe('Loading configuration...');

      // Wait for load to complete
      await waitForRender(API_RENDER_LONG_WAIT_MS);
      const configDisplay = configDetail?.querySelector('.config-display');
      expect(configDisplay).toBeTruthy();
    });

    it('should maintain app selection when config detail encounters errors', async () => {
      server.use(
        http.get('/api/v1/applications/:id/config', () => {
          return HttpResponse.json({ detail: 'Config not found' }, { status: 404 });
        })
      );

      const appItems = configApp.querySelectorAll('.app-item');
      const firstApp = appItems[0] as HTMLElement;
      expect(firstApp).toBeTruthy();

      simulateClick(firstApp);

      // Wait for DOM update
      await waitForRender();

      // Re-query element after selection and check it's selected
      const updatedAppItems = configApp.querySelectorAll('.app-item');
      const updatedFirstApp = updatedAppItems[0] as HTMLElement;
      expect(updatedFirstApp.classList.contains('selected')).toBe(true);

      await waitForRender();

      const configDetail = configApp.querySelector('config-detail');
      const error = configDetail?.querySelector('.error');
      expect(error?.textContent).toContain('Config not found');
    });
  });

  describe('Full Workflow Integration', () => {
    let configApp: ConfigApp;

    beforeEach(async () => {
      resetMockData();
      configApp = createTestComponent(ConfigApp, 'config-app-full-workflow');
      await waitForRender();
    });

    afterEach(() => {
      cleanupTestComponent(configApp);
    });

    it('should complete full create-select-edit workflow', async () => {
      // Step 1: Create new application
      const createBtn = configApp.querySelector('#create-btn') as HTMLElement;
      expect(createBtn).toBeTruthy();
      simulateClick(createBtn);

      await waitForRender();

      const createForm = configApp.querySelector('create-app-form');
      const nameInput = createForm?.querySelector('#app-name') as HTMLInputElement;
      const submitBtn = createForm?.querySelector('#submit-btn') as HTMLElement;

      expect(nameInput).toBeTruthy();
      expect(submitBtn).toBeTruthy();

      simulateInput(nameInput, 'workflow-test-app');
      simulateClick(submitBtn);

      await waitForRender(API_RENDER_WAIT_MS);

      // Step 2: Verify app is selected and config detail is shown
      const selectedApp = configApp.querySelector('.app-item.selected');
      expect(selectedApp).toBeTruthy();

      const configDetail = configApp.querySelector('config-detail');
      expect(configDetail).toBeTruthy();

      // Step 3: Wait for config to load and enter edit mode
      await waitForRender(API_RENDER_WAIT_MS);

      const editBtn = configDetail?.querySelector('#edit-btn') as HTMLElement;
      if (editBtn) {
        simulateClick(editBtn);
        await waitForRender();

        const textarea = configDetail?.querySelector('#config-textarea') as HTMLTextAreaElement;
        expect(textarea).toBeTruthy();

        // Step 4: Edit and save configuration
        const newConfig = '{"workflow": "test", "completed": true}';
        simulateInput(textarea, newConfig);

        const saveBtn = configDetail?.querySelector('#save-btn') as HTMLElement;
        expect(saveBtn).toBeTruthy();
        simulateClick(saveBtn);

        await waitForRender(API_RENDER_WAIT_MS);

        // Step 5: Verify changes were saved
        const configDisplay = configDetail?.querySelector('.config-display');
        expect(configDisplay?.textContent).toContain('"workflow": "test"');
        expect(configDisplay?.textContent).toContain('"completed": true');
      }
    });

    it('should handle rapid user interactions gracefully', async () => {
      const createBtn = configApp.querySelector('#create-btn') as HTMLElement;
      const appItems = configApp.querySelectorAll('.app-item');

      expect(createBtn).toBeTruthy();
      expect(appItems.length).toBeGreaterThan(0);

      // Rapid interactions
      simulateClick(createBtn); // Show form
      await waitForRender();
      
      const firstApp = appItems[0] as HTMLElement;
      expect(firstApp).toBeTruthy();
      simulateClick(firstApp); // Select app (should hide form)
      await waitForRender();
      
      simulateClick(createBtn); // Show form again
      await waitForRender();
      
      const createForm = configApp.querySelector('create-app-form');
      const cancelBtn = createForm?.querySelector('#cancel-btn') as HTMLElement;
      expect(cancelBtn).toBeTruthy();
      simulateClick(cancelBtn); // Cancel form

      await waitForRender();

      const secondApp = appItems[1] as HTMLElement;
      expect(secondApp).toBeTruthy();
      simulateClick(secondApp); // Select different app

      await waitForRender();

      // Should handle all interactions without errors
      const selectedApp = configApp.querySelector('.app-item.selected');
      expect(selectedApp).toBeTruthy();
      expect(configApp.querySelector('create-app-form')).toBeNull();
    });
  });

  describe('Error Recovery and Resilience', () => {
    let configApp: ConfigApp;

    beforeEach(async () => {
      resetMockData();
      configApp = createTestComponent(ConfigApp, 'config-app-error-recovery');
      await waitForRender();
    });

    afterEach(() => {
      cleanupTestComponent(configApp);
    });

    it('should recover from network errors', async () => {
      // Simulate network failure
      server.use(
        http.get('/api/v1/applications', () => HttpResponse.error())
      );

      // Create new component to trigger fresh load with error
      cleanupTestComponent(configApp);
      configApp = createTestComponent(ConfigApp, 'config-app-network-error');

      await waitForRender();

      // Should show error state
      let error = configApp.querySelector('.error');
      expect(error).toBeTruthy();

      // Restore network and reload
      server.resetHandlers();
      (configApp as any).loadApplications();

      await waitForRender();

      // Should recover and show applications
      const appItems = configApp.querySelectorAll('.app-item');
      expect(appItems.length).toBeGreaterThan(0);
      error = configApp.querySelector('.error');
      expect(error).toBeNull();
    });

    it('should handle partial failures gracefully', async () => {
      // App list loads but config fails
      server.use(
        http.get('/api/v1/applications/:id/config', () => {
          return HttpResponse.json({ detail: 'Config service down' }, { status: 503 });
        })
      );

      const appItems = configApp.querySelectorAll('.app-item');
      const firstApp = appItems[0] as HTMLElement;
      expect(firstApp).toBeTruthy();
      
      simulateClick(firstApp);

      await waitForRender();

      // App should be selected - re-query after click to avoid stale reference
      const updatedAppItems = configApp.querySelectorAll('.app-item');
      const updatedFirstApp = updatedAppItems[0] as HTMLElement;
      expect(updatedFirstApp.classList.contains('selected')).toBe(true);

      // Config detail should show error
      const configDetail = configApp.querySelector('config-detail');
      await waitForRender();
      
      const configError = configDetail?.querySelector('.error');
      expect(configError?.textContent).toContain('Config service down');

      // User should still be able to interact with other parts
      const createBtn = configApp.querySelector('#create-btn') as HTMLElement;
      expect(createBtn).toBeTruthy();
      simulateClick(createBtn);

      await waitForRender();

      const createForm = configApp.querySelector('create-app-form');
      expect(createForm).toBeTruthy();
    });
  });

  describe('State Management Across Components', () => {
    let configApp: ConfigApp;

    beforeEach(async () => {
      resetMockData();
      configApp = createTestComponent(ConfigApp, 'config-app-state-management');
      await waitForRender();
    });

    afterEach(() => {
      cleanupTestComponent(configApp);
    });

    it('should maintain consistent state when components update', async () => {
      // Select an app
      const appItems = configApp.querySelectorAll('.app-item');
      const firstApp = appItems[0] as HTMLElement;
      expect(firstApp).toBeTruthy();
      
      simulateClick(firstApp);
      await waitForRender();

      const appId = firstApp.getAttribute('data-app-id');

      // Create a new app
      const createBtn = configApp.querySelector('#create-btn') as HTMLElement;
      expect(createBtn).toBeTruthy();
      simulateClick(createBtn);

      await waitForRender();

      const createForm = configApp.querySelector('create-app-form');
      const nameInput = createForm?.querySelector('#app-name') as HTMLInputElement;
      const submitBtn = createForm?.querySelector('#submit-btn') as HTMLElement;

      expect(nameInput).toBeTruthy();
      expect(submitBtn).toBeTruthy();

      simulateInput(nameInput, 'state-test-app');
      simulateClick(submitBtn);

      await waitForRender(API_RENDER_WAIT_MS);

      // New app should be selected
      const selectedApp = configApp.querySelector('.app-item.selected');
      expect(selectedApp).toBeTruthy();
      
      const newAppId = selectedApp?.getAttribute('data-app-id');
      expect(newAppId).not.toBe(appId); // Different from originally selected app

      // Config detail should show new app's ID
      const configDetail = configApp.querySelector('config-detail');
      expect(configDetail?.getAttribute('application-id')).toBe(newAppId);
    });

    it('should handle concurrent state changes', async () => {
      const appItems = configApp.querySelectorAll('.app-item');
      expect(appItems.length).toBeGreaterThan(1);
      
      // Rapid app selections
      simulateClick(appItems[0] as HTMLElement);
      simulateClick(appItems[1] as HTMLElement);
      simulateClick(appItems[0] as HTMLElement);

      // Wait for DOM updates to settle
      await waitForRender();

      // Final state should be consistent
      const selectedApps = configApp.querySelectorAll('.app-item.selected');
      expect(selectedApps.length).toBe(1);
      
      // The selected app should be the first one (by position)
      const updatedAppItems = configApp.querySelectorAll('.app-item');
      expect(selectedApps[0]).toBe(updatedAppItems[0]);

      const configDetail = configApp.querySelector('config-detail');
      const expectedId = updatedAppItems[0].getAttribute('data-app-id');
      expect(configDetail?.getAttribute('application-id')).toBe(expectedId);
    });
  });

  describe('Component Lifecycle Integration', () => {
    it('should properly initialize child components', () => {
      const configApp = createTestComponent(ConfigApp, 'config-app-lifecycle');

      // Child components should be properly defined
      expect(customElements.get('create-app-form')).toBeTruthy();
      expect(customElements.get('config-detail')).toBeTruthy();

      cleanupTestComponent(configApp);
    });

    it('should handle component cleanup properly', async () => {
      const configApp = createTestComponent(ConfigApp, 'config-app-cleanup');
      
      // Trigger some interactions to create internal state
      await waitForRender();
      
      const appItems = configApp.querySelectorAll('.app-item');
      if (appItems.length > 0) {
        simulateClick(appItems[0] as HTMLElement);
        await waitForRender();
      }

      const createBtn = configApp.querySelector('#create-btn') as HTMLElement;
      if (createBtn) {
        simulateClick(createBtn);
        await waitForRender();
      }

      // Cleanup should not throw errors
      expect(() => {
        cleanupTestComponent(configApp);
      }).not.toThrow();
    });
  });
});
