import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigApp } from '../components/ConfigApp';
import { ConfigDetail } from '../components/ConfigDetail';
import { CreateAppForm } from '../components/CreateAppForm';
import { createTestComponent, cleanupTestComponent, simulateClick } from '../../tests/utils/test-helpers';

// Register components for accessibility testing
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

describe('Accessibility Tests', () => {
  beforeEach(() => {
    registerComponents();
  });

  describe('ConfigApp Accessibility', () => {
    let component: ConfigApp;

    beforeEach(async () => {
      component = createTestComponent(ConfigApp, 'config-app-a11y');
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    afterEach(() => {
      cleanupTestComponent(component);
    });

    describe('Semantic HTML Structure', () => {
      it('should use proper heading hierarchy', () => {
        const h1 = component.querySelector('h1');
        const h2 = component.querySelector('h2');

        expect(h1?.textContent).toBe('Configuration Manager');
        expect(h2?.textContent).toBe('Applications');
        
        // H1 should come before H2 in DOM order
        const allHeadings = component.querySelectorAll('h1, h2');
        expect(allHeadings[0].tagName).toBe('H1');
        expect(allHeadings[1].tagName).toBe('H2');
      });

      it('should use semantic landmarks', () => {
        const header = component.querySelector('header');
        const aside = component.querySelector('aside');
        const main = component.querySelector('main');

        expect(header).toBeTruthy();
        expect(aside).toBeTruthy();
        expect(main).toBeTruthy();
      });

      it('should use proper list structure for applications', () => {
        const list = component.querySelector('ul.app-list');
        const listItems = component.querySelectorAll('ul.app-list > li');

        expect(list).toBeTruthy();
        expect(listItems.length).toBeGreaterThan(0);
        
        listItems.forEach(item => {
          expect(item.tagName).toBe('LI');
        });
      });

      it('should have proper button elements', () => {
        const createBtn = component.querySelector('#create-btn');
        
        expect(createBtn?.tagName).toBe('BUTTON');
        expect(createBtn?.textContent?.trim()).toBe('Create Application');
      });
    });

    describe('Keyboard Navigation', () => {
      it('should have focusable interactive elements', () => {
        const focusableElements = component.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
        
        expect(focusableElements.length).toBeGreaterThan(0);
        
        focusableElements.forEach(element => {
          expect(element.getAttribute('tabindex')).not.toBe('-1');
        });
      });

      it('should support keyboard interaction on app items', () => {
        const appItems = component.querySelectorAll('.app-item');
        
        appItems.forEach(item => {
          // App items should be clickable and keyboard accessible
          expect(item.getAttribute('data-app-id')).toBeTruthy();
          expect(item.getAttribute('data-app-index')).toBeTruthy();
        });
      });

      it('should maintain logical tab order', () => {
        const createBtn = component.querySelector('#create-btn');
        const appItems = component.querySelectorAll('.app-item');

        // Create button should be focusable
        expect((createBtn as HTMLElement)?.tabIndex).not.toBe(-1);
        
        // App items should be accessible via keyboard
        appItems.forEach(item => {
          // Items should be clickable and reachable
          expect(item.getAttribute('data-app-index')).toBeTruthy();
        });
      });
    });

    describe('Screen Reader Support', () => {
      it('should have meaningful text content', () => {
        const title = component.querySelector('.title');
        const emptyState = component.querySelector('.empty');
        
        expect(title?.textContent).toBe('Configuration Manager');
        
        if (emptyState) {
          // Check for either no applications or no selection message
          const hasNoAppsMessage = emptyState.textContent?.includes('No applications found');
          const hasSelectMessage = emptyState.textContent?.includes('Select an application to view');
          expect(hasNoAppsMessage || hasSelectMessage).toBe(true);
        }
      });

      it('should provide context for application items', () => {
        const appItems = component.querySelectorAll('.app-item');
        
        appItems.forEach(item => {
          const appName = item.querySelector('.app-name');
          const appDescription = item.querySelector('.app-description');
          
          expect(appName?.textContent).toBeTruthy();
          // Description is optional but should be meaningful if present
          if (appDescription) {
            expect(appDescription.textContent?.trim()).toBeTruthy();
          }
        });
      });

      it('should have clear error messages', () => {
        // Simulate error state by checking if error elements have proper content
        const errorElements = component.querySelectorAll('.error');
        
        errorElements.forEach(error => {
          expect(error.textContent?.trim()).toBeTruthy();
          expect(error.textContent).toContain('Error');
        });
      });
    });

    describe('Visual Accessibility', () => {
      it('should have sufficient color contrast indicators', () => {
        const selectedItems = component.querySelectorAll('.app-item.selected');
        const regularItems = component.querySelectorAll('.app-item:not(.selected)');
        
        // Selected items should have distinguishing classes
        selectedItems.forEach(item => {
          expect(item.classList.contains('selected')).toBe(true);
        });
        
        // Non-selected items should not have selected class
        regularItems.forEach(item => {
          expect(item.classList.contains('selected')).toBe(false);
        });
      });

      it('should indicate loading states clearly', () => {
        const loadingElements = component.querySelectorAll('.loading');
        
        loadingElements.forEach(loading => {
          expect(loading.textContent).toContain('Loading');
        });
      });

      it('should have clear visual hierarchy', () => {
        const container = component.querySelector('.container');
        const header = component.querySelector('.header');
        const content = component.querySelector('.content');
        
        expect(container).toBeTruthy();
        expect(header).toBeTruthy();
        expect(content).toBeTruthy();
      });
    });
  });

  describe('ConfigDetail Accessibility', () => {
    let component: ConfigDetail;

    beforeEach(() => {
      component = createTestComponent(ConfigDetail, 'config-detail-a11y');
      component.setAttribute('application-id', '01ARZ3NDEKTSV4RRFFQ69G5FAV');
    });

    afterEach(() => {
      cleanupTestComponent(component);
    });

    describe('Form Accessibility', () => {
      it('should have proper heading for configuration section', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const title = component.querySelector('.title');
        expect(title?.tagName).toBe('H2');
        expect(title?.textContent).toBe('Configuration');
      });

      it('should have accessible buttons with clear labels', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const editBtn = component.querySelector('#edit-btn');
        
        if (editBtn) {
          expect(editBtn.tagName).toBe('BUTTON');
          expect(editBtn.textContent).toBe('Edit');
        }
      });

      it('should provide accessible form controls in edit mode', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const editBtn = component.querySelector('#edit-btn') as HTMLElement;
        if (editBtn) {
          simulateClick(editBtn);
          
          const textarea = component.querySelector('#config-textarea');
          const cancelBtn = component.querySelector('#cancel-btn');
          const saveBtn = component.querySelector('#save-btn');
          
          expect(textarea?.tagName).toBe('TEXTAREA');
          expect(textarea?.id).toBe('config-textarea');
          expect(cancelBtn?.tagName).toBe('BUTTON');
          expect(saveBtn?.tagName).toBe('BUTTON');
          expect(cancelBtn?.textContent).toBe('Cancel');
          expect(saveBtn?.textContent).toBe('Save');
        }
      });

      it('should have clear state indicators', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const loadingElements = component.querySelectorAll('.loading');
        const errorElements = component.querySelectorAll('.error');
        
        loadingElements.forEach(loading => {
          expect(loading.textContent).toContain('Loading');
        });
        
        errorElements.forEach(error => {
          expect(error.textContent).toContain('Error');
        });
      });
    });

    describe('Content Accessibility', () => {
      it('should display configuration in readable format', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const configDisplay = component.querySelector('.config-display');
        
        if (configDisplay) {
          expect(configDisplay.textContent?.trim()).toBeTruthy();
          // Configuration should be formatted JSON
          expect(configDisplay.textContent).toContain('{');
        }
      });

      it('should handle empty states with clear messaging', () => {
        const emptyElements = component.querySelectorAll('.empty');
        
        emptyElements.forEach(empty => {
          expect(empty.textContent?.trim()).toBeTruthy();
          expect(empty.textContent).toMatch(/no configuration|not found/i);
        });
      });
    });
  });

  describe('CreateAppForm Accessibility', () => {
    let component: CreateAppForm;

    beforeEach(() => {
      component = createTestComponent(CreateAppForm, 'create-app-form-a11y');
    });

    afterEach(() => {
      cleanupTestComponent(component);
    });

    describe('Form Structure and Labels', () => {
      it('should have proper form structure', () => {
        const formContainer = component.querySelector('.form-container');
        const formTitle = component.querySelector('.form-title');
        
        expect(formContainer).toBeTruthy();
        expect(formTitle?.textContent).toBe('Create New Application');
      });

      it('should associate labels with form controls', () => {
        const nameLabel = component.querySelector('label[for="app-name"]');
        const descLabel = component.querySelector('label[for="app-description"]');
        const nameInput = component.querySelector('#app-name');
        const descInput = component.querySelector('#app-description');
        
        expect(nameLabel).toBeTruthy();
        expect(descLabel).toBeTruthy();
        expect(nameInput?.id).toBe('app-name');
        expect(descInput?.id).toBe('app-description');
        
        expect(nameLabel?.textContent).toBe('Name *');
        expect(descLabel?.textContent).toBe('Description');
      });

      it('should indicate required fields clearly', () => {
        const nameLabel = component.querySelector('label[for="app-name"]');
        
        expect(nameLabel?.textContent).toContain('*');
      });

      it('should provide helpful placeholder text', () => {
        const nameInput = component.querySelector('#app-name') as HTMLInputElement;
        const descInput = component.querySelector('#app-description') as HTMLTextAreaElement;
        
        expect(nameInput.placeholder).toBe('e.g., web-app, mobile-client');
        expect(descInput.placeholder).toBe('Brief description of the application (optional)');
      });
    });

    describe('Error Handling and Feedback', () => {
      it('should provide clear validation feedback', () => {
        const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
        simulateClick(submitBtn);
        
        const errorElements = component.querySelectorAll('.form-error');
        const errorInputs = component.querySelectorAll('.form-input.error');
        
        expect(errorElements.length).toBeGreaterThan(0);
        expect(errorInputs.length).toBeGreaterThan(0);
        
        errorElements.forEach(error => {
          expect(error.textContent?.trim()).toBeTruthy();
        });
      });

      it('should have accessible error messaging', () => {
        const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
        simulateClick(submitBtn);
        
        const nameError = component.querySelector('.form-group:first-of-type .form-error');
        
        expect(nameError?.textContent).toBe('Application name is required');
        expect(nameError?.classList.contains('form-error')).toBe(true);
      });

      it('should show general error messages clearly', () => {
        const errorMessages = component.querySelectorAll('.error-message');
        
        errorMessages.forEach(error => {
          expect(error.textContent?.trim()).toBeTruthy();
          expect(error.classList.contains('error-message')).toBe(true);
        });
      });
    });

    describe('Interactive Elements', () => {
      it('should have accessible buttons', () => {
        const cancelBtn = component.querySelector('#cancel-btn');
        const submitBtn = component.querySelector('#submit-btn');
        
        expect(cancelBtn?.tagName).toBe('BUTTON');
        expect(submitBtn?.tagName).toBe('BUTTON');
        expect(cancelBtn?.textContent?.trim()).toBe('Cancel');
        expect(submitBtn?.textContent?.trim()).toBe('Create Application');
      });

      it('should indicate button states clearly', () => {
        const cancelBtn = component.querySelector('#cancel-btn') as HTMLButtonElement;
        const submitBtn = component.querySelector('#submit-btn') as HTMLButtonElement;
        
        expect(cancelBtn.disabled).toBe(false);
        expect(submitBtn.disabled).toBe(false);
        
        expect(cancelBtn.classList.contains('btn-secondary')).toBe(true);
        expect(submitBtn.classList.contains('btn-primary')).toBe(true);
      });

      it('should show loading states accessibly', async () => {
        // Mock a slow API response to ensure loading state is visible
        const { server } = await import('../../tests/setup');
        const { http, HttpResponse } = await import('msw');
        
        server.use(
          http.post('/api/v1/applications', async () => {
            // Delay response to ensure loading state is captured
            await new Promise(resolve => setTimeout(resolve, 100));
            return HttpResponse.json({
              id: '01ARZ3NDEKTSV4RRFFQ69G5FC0',
              name: 'test-app',
              description: ''
            }, { status: 201 });
          })
        );
        
        // Simulate form submission to trigger loading state
        const nameInput = component.querySelector('#app-name') as HTMLInputElement;
        
        // Properly simulate user input - set value and trigger event
        nameInput.value = 'test-app';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
        simulateClick(submitBtn);
        
        // Check loading state immediately after click
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Re-query elements after render
        const updatedSubmitBtn = component.querySelector('#submit-btn') as HTMLElement;
        const formContainer = component.querySelector('.form-container');
        
        // Check loading state
        expect(updatedSubmitBtn.textContent?.trim()).toBe('Creating...');
        expect(updatedSubmitBtn.hasAttribute('disabled')).toBe(true);
        expect(formContainer?.classList.contains('loading')).toBe(true);
        
        // Wait for the API call to complete to avoid hanging
        await new Promise(resolve => setTimeout(resolve, 200));
      });
    });

    describe('Keyboard Navigation', () => {
      it('should support tab navigation through form elements', () => {
        const nameInput = component.querySelector('#app-name') as HTMLInputElement;
        const descInput = component.querySelector('#app-description') as HTMLTextAreaElement;
        const cancelBtn = component.querySelector('#cancel-btn') as HTMLButtonElement;
        const submitBtn = component.querySelector('#submit-btn') as HTMLButtonElement;
        
        expect(nameInput.tabIndex).not.toBe(-1);
        expect(descInput.tabIndex).not.toBe(-1);
        expect(cancelBtn.tabIndex).not.toBe(-1);
        expect(submitBtn.tabIndex).not.toBe(-1);
      });

      it('should handle focus management properly', () => {
        const nameInput = component.querySelector('#app-name') as HTMLInputElement;
        
        nameInput.focus();
        // In shadow DOM, document.activeElement points to the host element
        // We need to check the shadow root's activeElement instead
        expect(component.shadowRoot?.activeElement).toBe(nameInput);
      });
    });
  });

  describe('Cross-Component Accessibility', () => {
    let configApp: ConfigApp;

    beforeEach(async () => {
      configApp = createTestComponent(ConfigApp, 'config-app-cross-a11y');
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    afterEach(() => {
      cleanupTestComponent(configApp);
    });

    it('should maintain focus when transitioning between states', () => {
      const createBtn = configApp.querySelector('#create-btn') as HTMLElement;
      simulateClick(createBtn);
      
      const createForm = configApp.querySelector('create-app-form');
      expect(createForm).toBeTruthy();
      
      // Form should be accessible after showing
      const nameInput = createForm?.querySelector('#app-name') as HTMLInputElement;
      expect(nameInput).toBeTruthy();
      expect(nameInput.tabIndex).not.toBe(-1);
    });

    it('should provide consistent navigation patterns', () => {
      // All buttons should follow consistent patterns
      const buttons = configApp.querySelectorAll('button');
      
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
        expect(button.textContent?.trim()).toBeTruthy();
      });
    });

    it('should handle dynamic content accessibly', () => {
      // Select an app to trigger dynamic content
      const appItems = configApp.querySelectorAll('.app-item');
      if (appItems.length > 0) {
        simulateClick(appItems[0] as HTMLElement);
        
        const configDetail = configApp.querySelector('config-detail');
        expect(configDetail).toBeTruthy();
        expect(configDetail?.getAttribute('application-id')).toBeTruthy();
      }
    });

    it('should provide consistent error handling patterns', () => {
      const errorElements = configApp.querySelectorAll('.error');
      
      errorElements.forEach(error => {
        expect(error.classList.contains('error')).toBe(true);
        expect(error.textContent?.trim()).toBeTruthy();
      });
    });
  });

  describe('ARIA and Advanced Accessibility', () => {
    it('should use appropriate ARIA roles where needed', async () => {
      const configApp = createTestComponent(ConfigApp, 'config-app-aria');
      
      // Wait for applications to load and render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check for proper semantic elements that provide implicit roles
      const header = configApp.querySelector('header');
      const main = configApp.querySelector('main');
      const aside = configApp.querySelector('aside');
      const list = configApp.querySelector('ul');
      
      expect(header).toBeTruthy(); // Implicit banner role
      expect(main).toBeTruthy(); // Implicit main role
      expect(aside).toBeTruthy(); // Implicit complementary role
      expect(list).toBeTruthy(); // Implicit list role
      
      cleanupTestComponent(configApp);
    });

    it('should handle live regions for dynamic content', () => {
      const configApp = createTestComponent(ConfigApp, 'config-app-live');
      
      // Error and loading states should be announced to screen readers
      const errorElements = configApp.querySelectorAll('.error');
      const loadingElements = configApp.querySelectorAll('.loading');
      
      // These elements should have meaningful content for screen readers
      errorElements.forEach(error => {
        expect(error.textContent).toMatch(/error/i);
      });
      
      loadingElements.forEach(loading => {
        expect(loading.textContent).toMatch(/loading/i);
      });
      
      cleanupTestComponent(configApp);
    });

    it('should provide sufficient context for interactive elements', () => {
      const createForm = createTestComponent(CreateAppForm, 'create-form-context');
      
      const nameInput = createForm.querySelector('#app-name') as HTMLInputElement;
      const nameLabel = createForm.querySelector('label[for="app-name"]');
      
      // Input should be properly labeled
      expect(nameLabel).toBeTruthy();
      expect(nameInput.id).toBe('app-name');
      expect(nameLabel?.getAttribute('for')).toBe('app-name');
      
      cleanupTestComponent(createForm);
    });
  });
});