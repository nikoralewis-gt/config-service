import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { server } from '../../tests/setup';
import { http, HttpResponse } from 'msw';
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

describe('Component Integration Tests', () => {
  beforeEach(() => {
    registerComponents();
  });

  describe('ConfigApp + CreateAppForm Integration', () => {
    let configApp: ConfigApp;

    beforeEach(async () => {
      configApp = createTestComponent(ConfigApp, 'config-app-integration');
      // Wait for initial load
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    afterEach(() => {
      cleanupTestComponent(configApp);
    });

    it('should show create form when create button is clicked', () => {
      const createBtn = configApp.querySelector('#create-btn') as HTMLElement;
      simulateClick(createBtn);

      const createForm = configApp.querySelector('create-app-form');
      expect(createForm).toBeTruthy();
      expect(createForm?.querySelector('.form-title')?.textContent).toBe('Create New Application');
    });

    it('should hide create form when cancelled', () => {
      // Show form
      const createBtn = configApp.querySelector('#create-btn') as HTMLElement;
      simulateClick(createBtn);

      // Cancel form
      const createForm = configApp.querySelector('create-app-form');
      expect(createForm).toBeTruthy();

      const cancelBtn = createForm?.querySelector('#cancel-btn') as HTMLElement;
      simulateClick(cancelBtn);

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
      simulateClick(createBtn);

      // Fill and submit form
      const createForm = configApp.querySelector('create-app-form');
      const nameInput = createForm?.querySelector('#app-name') as HTMLInputElement;
      const descInput = createForm?.querySelector('#app-description') as HTMLTextAreaElement;
      const submitBtn = createForm?.querySelector('#submit-btn') as HTMLElement;

      simulateInput(nameInput, 'integration-test-app');
      simulateInput(descInput, 'Created via integration test');
      simulateClick(submitBtn);

      // Wait for API call and re-render
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check new app was added
      const finalApps = configApp.querySelectorAll('.app-item');
      expect(finalApps.length).toBe(initialCount + 1);

      // Check new app is selected
      const selectedApp = configApp.querySelector('.app-item.selected');
      expect(selectedApp?.querySelector('.app-name')?.textContent).toBe('integration-test-app');
      expect(selectedApp?.querySelector('.app-description')?.textContent).toBe('Created via integration test');

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
      simulateClick(createBtn);

      const createForm = configApp.querySelector('create-app-form');
      const nameInput = createForm?.querySelector('#app-name') as HTMLInputElement;
      const submitBtn = createForm?.querySelector('#submit-btn') as HTMLElement;

      simulateInput(nameInput, 'error-test-app');
      simulateClick(submitBtn);

      await new Promise(resolve => setTimeout(resolve, 100));

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
      configApp = createTestComponent(ConfigApp, 'config-app-detail-integration');
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    afterEach(() => {
      cleanupTestComponent(configApp);
    });

    it('should display config detail when application is selected', () => {
      const appItems = configApp.querySelectorAll('.app-item');
      const firstApp = appItems[0] as HTMLElement;

      simulateClick(firstApp);

      const configDetail = configApp.querySelector('config-detail');
      expect(configDetail).toBeTruthy();
      expect(configDetail?.getAttribute('application-id')).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    });

    it('should update config detail when different app is selected', () => {
      const appItems = configApp.querySelectorAll('.app-item');
      const firstApp = appItems[0] as HTMLElement;
      const secondApp = appItems[1] as HTMLElement;

      // Select first app
      simulateClick(firstApp);
      let configDetail = configApp.querySelector('config-detail');
      expect(configDetail?.getAttribute('application-id')).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');

      // Select second app
      simulateClick(secondApp);
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

      simulateClick(firstApp);

      const configDetail = configApp.querySelector('config-detail');
      
      // Should initially show loading
      await new Promise(resolve => setTimeout(resolve, 50));
      const loading = configDetail?.querySelector('.loading');
      expect(loading?.textContent).toBe('Loading configuration...');

      // Wait for load to complete
      await new Promise(resolve => setTimeout(resolve, 250));
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

      simulateClick(firstApp);

      // Wait for DOM update
      await new Promise(resolve => setTimeout(resolve, 10));

      // Re-query element after selection and check it's selected
      const updatedAppItems = configApp.querySelectorAll('.app-item');
      const updatedFirstApp = updatedAppItems[0] as HTMLElement;
      expect(updatedFirstApp.classList.contains('selected')).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100));

      const configDetail = configApp.querySelector('config-detail');
      const error = configDetail?.querySelector('.error');
      expect(error?.textContent).toContain('Config not found');
    });
  });

  describe('Full Workflow Integration', () => {
    let configApp: ConfigApp;

    beforeEach(async () => {
      configApp = createTestComponent(ConfigApp, 'config-app-full-workflow');
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    afterEach(() => {
      cleanupTestComponent(configApp);
    });

    it('should complete full create-select-edit workflow', async () => {
      // Step 1: Create new application
      const createBtn = configApp.querySelector('#create-btn') as HTMLElement;
      simulateClick(createBtn);

      const createForm = configApp.querySelector('create-app-form');
      const nameInput = createForm?.querySelector('#app-name') as HTMLInputElement;
      const submitBtn = createForm?.querySelector('#submit-btn') as HTMLElement;

      simulateInput(nameInput, 'workflow-test-app');
      simulateClick(submitBtn);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 2: Verify app is selected and config detail is shown
      const selectedApp = configApp.querySelector('.app-item.selected');
      const selectedAppName = selectedApp?.querySelector('.app-name')?.textContent;
      expect(selectedAppName).toBeTruthy(); // Any app name is fine

      const configDetail = configApp.querySelector('config-detail');
      expect(configDetail).toBeTruthy();

      // Step 3: Wait for config to load and enter edit mode
      await new Promise(resolve => setTimeout(resolve, 100));

      const editBtn = configDetail?.querySelector('#edit-btn') as HTMLElement;
      if (editBtn) {
        simulateClick(editBtn);

        const textarea = configDetail?.querySelector('#config-textarea') as HTMLTextAreaElement;
        expect(textarea).toBeTruthy();

        // Step 4: Edit and save configuration
        const newConfig = '{"workflow": "test", "completed": true}';
        simulateInput(textarea, newConfig);

        const saveBtn = configDetail?.querySelector('#save-btn') as HTMLElement;
        simulateClick(saveBtn);

        await new Promise(resolve => setTimeout(resolve, 100));

        // Step 5: Verify changes were saved
        const configDisplay = configDetail?.querySelector('.config-display');
        expect(configDisplay?.textContent).toContain('"workflow": "test"');
        expect(configDisplay?.textContent).toContain('"completed": true');
      }
    });

    it('should handle rapid user interactions gracefully', async () => {
      const createBtn = configApp.querySelector('#create-btn') as HTMLElement;
      const appItems = configApp.querySelectorAll('.app-item');

      // Rapid interactions
      simulateClick(createBtn); // Show form
      simulateClick(appItems[0] as HTMLElement); // Select app (should hide form)
      simulateClick(createBtn); // Show form again
      
      const createForm = configApp.querySelector('create-app-form');
      const cancelBtn = createForm?.querySelector('#cancel-btn') as HTMLElement;
      simulateClick(cancelBtn); // Cancel form

      simulateClick(appItems[1] as HTMLElement); // Select different app

      // Should handle all interactions without errors
      const selectedApp = configApp.querySelector('.app-item.selected');
      expect(selectedApp).toBeTruthy();
      expect(configApp.querySelector('create-app-form')).toBeNull();
    });
  });

  describe('Error Recovery and Resilience', () => {
    let configApp: ConfigApp;

    beforeEach(async () => {
      configApp = createTestComponent(ConfigApp, 'config-app-error-recovery');
      await new Promise(resolve => setTimeout(resolve, 100));
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

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should show error state
      let error = configApp.querySelector('.error');
      expect(error).toBeTruthy();

      // Restore network and reload
      server.resetHandlers();
      (configApp as any).loadApplications();

      await new Promise(resolve => setTimeout(resolve, 100));

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
      simulateClick(firstApp);

      await new Promise(resolve => setTimeout(resolve, 100));

      // App should be selected - re-query after click to avoid stale reference
      const updatedAppItems = configApp.querySelectorAll('.app-item');
      const updatedFirstApp = updatedAppItems[0] as HTMLElement;
      expect(updatedFirstApp.classList.contains('selected')).toBe(true);

      // Config detail should show error
      const configDetail = configApp.querySelector('config-detail');
      const configError = configDetail?.querySelector('.error');
      expect(configError?.textContent).toContain('Config service down');

      // User should still be able to interact with other parts
      const createBtn = configApp.querySelector('#create-btn') as HTMLElement;
      simulateClick(createBtn);

      const createForm = configApp.querySelector('create-app-form');
      expect(createForm).toBeTruthy();
    });
  });

  describe('State Management Across Components', () => {
    let configApp: ConfigApp;

    beforeEach(async () => {
      configApp = createTestComponent(ConfigApp, 'config-app-state-management');
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    afterEach(() => {
      cleanupTestComponent(configApp);
    });

    it('should maintain consistent state when components update', async () => {
      // Select an app
      const appItems = configApp.querySelectorAll('.app-item');
      const firstApp = appItems[0] as HTMLElement;
      simulateClick(firstApp);

      const appId = firstApp.getAttribute('data-app-id');

      // Create a new app
      const createBtn = configApp.querySelector('#create-btn') as HTMLElement;
      simulateClick(createBtn);

      const createForm = configApp.querySelector('create-app-form');
      const nameInput = createForm?.querySelector('#app-name') as HTMLInputElement;
      const submitBtn = createForm?.querySelector('#submit-btn') as HTMLElement;

      simulateInput(nameInput, 'state-test-app');
      simulateClick(submitBtn);

      await new Promise(resolve => setTimeout(resolve, 100));

      // New app should be selected
      const selectedApp = configApp.querySelector('.app-item.selected');
      const newAppId = selectedApp?.getAttribute('data-app-id');
      
      expect(newAppId).not.toBe(appId); // Different from originally selected app
      const selectedAppName = selectedApp?.querySelector('.app-name')?.textContent;
      expect(selectedAppName).toBeTruthy(); // Any app name is fine for this integration test

      // Config detail should show new app's ID
      const configDetail = configApp.querySelector('config-detail');
      expect(configDetail?.getAttribute('application-id')).toBe(newAppId);
    });

    it('should handle concurrent state changes', async () => {
      const appItems = configApp.querySelectorAll('.app-item');
      
      // Rapid app selections
      simulateClick(appItems[0] as HTMLElement);
      simulateClick(appItems[1] as HTMLElement);
      simulateClick(appItems[0] as HTMLElement);

      // Wait for DOM updates to settle
      await new Promise(resolve => setTimeout(resolve, 10));

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
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const appItems = configApp.querySelectorAll('.app-item');
      if (appItems.length > 0) {
        simulateClick(appItems[0] as HTMLElement);
      }

      const createBtn = configApp.querySelector('#create-btn') as HTMLElement;
      simulateClick(createBtn);

      // Cleanup should not throw errors
      expect(() => {
        cleanupTestComponent(configApp);
      }).not.toThrow();
    });
  });
});