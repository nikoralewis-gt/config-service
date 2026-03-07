import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CreateAppForm } from './CreateAppForm';
import { createTestComponent, cleanupTestComponent, simulateClick, simulateInput, waitForEvent } from '../../tests/utils/test-helpers';

describe('CreateAppForm - Core Functionality', () => {
  let component: CreateAppForm;

  beforeEach(() => {
    component = createTestComponent(CreateAppForm, 'create-app-form');
  });

  afterEach(() => {
    cleanupTestComponent(component);
  });

  describe('Form Structure', () => {
    it('should render form with all required elements', () => {
      const title = component.querySelector('.form-title');
      const nameInput = component.querySelector('#app-name');
      const descInput = component.querySelector('#app-description');
      const cancelBtn = component.querySelector('#cancel-btn');
      const submitBtn = component.querySelector('#submit-btn');

      expect(title?.textContent).toBe('Create New Application');
      expect(nameInput?.tagName).toBe('INPUT');
      expect(descInput?.tagName).toBe('TEXTAREA');
      expect(cancelBtn?.tagName).toBe('BUTTON');
      expect(submitBtn?.tagName).toBe('BUTTON');
    });

    it('should have proper labels and accessibility', () => {
      const nameLabel = component.querySelector('label[for="app-name"]');
      const descLabel = component.querySelector('label[for="app-description"]');
      
      expect(nameLabel?.textContent).toBe('Name *');
      expect(descLabel?.textContent).toBe('Description');
    });

    it('should have helpful placeholder text', () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      const descInput = component.querySelector('#app-description') as HTMLTextAreaElement;
      
      expect(nameInput.placeholder).toBe('e.g., web-app, mobile-client');
      expect(descInput.placeholder).toBe('Brief description of the application (optional)');
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty name', () => {
      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      const nameError = component.querySelector('.form-group:first-of-type .form-error');
      expect(nameError?.textContent).toBe('Application name is required');
    });

    it('should validate name format', () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      simulateInput(nameInput, 'invalid@name!');

      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      const nameError = component.querySelector('.form-group:first-of-type .form-error');
      expect(nameError?.textContent).toBe('Name can only contain letters, numbers, underscores, and hyphens');
    });

    it('should accept valid name formats', () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      simulateInput(nameInput, 'valid-app_name123');

      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      // Should not show name validation error for valid names
      const nameError = component.querySelector('.form-group:first-of-type .form-error');
      expect(nameError).toBeNull();
    });

    it('should validate description when provided', () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      const descInput = component.querySelector('#app-description') as HTMLTextAreaElement;
      
      simulateInput(nameInput, 'valid-app');
      simulateInput(descInput, '   '); // Only whitespace

      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      // Find the description error specifically - look for the error in the description field's form group
      const descError = component.querySelector('#app-description')?.parentElement?.querySelector('.form-error');
      expect(descError?.textContent).toBe('Description cannot be empty if provided');
    });
  });

  describe('Form Interaction', () => {
    it('should update input values when user types', () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      const descInput = component.querySelector('#app-description') as HTMLTextAreaElement;

      simulateInput(nameInput, 'test-app');
      simulateInput(descInput, 'Test description');

      expect(nameInput.value).toBe('test-app');
      expect(descInput.value).toBe('Test description');
    });

    it('should clear validation errors when user starts typing', () => {
      // Trigger validation error
      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      const nameError = component.querySelector('.form-group:first-of-type .form-error');
      expect(nameError).toBeTruthy();

      // Start typing to clear error
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      simulateInput(nameInput, 'v');

      const nameErrorAfter = component.querySelector('.form-group:first-of-type .form-error');
      expect(nameErrorAfter).toBeNull();
    });

    it('should emit cancel event when cancel button is clicked', async () => {
      const eventPromise = waitForEvent(component, 'form-cancelled');
      
      const cancelBtn = component.querySelector('#cancel-btn') as HTMLElement;
      simulateClick(cancelBtn);

      await eventPromise;
      // If we reach here, the event was emitted successfully
      expect(true).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should emit app-created event on successful submission', async () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      simulateInput(nameInput, 'test-app');

      const eventPromise = waitForEvent(component, 'app-created');
      
      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      const event = await eventPromise;
      expect(event.detail.name).toBe('test-app');
      expect(event.detail.id).toBeTruthy();
    });

    it('should show loading state during submission', async () => {
      // Mock a slow API response to ensure loading state is visible
      const { server } = await import('../../tests/setup');
      const { http, HttpResponse } = await import('msw');
      
      server.use(
        http.post('/api/v1/applications', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({
            id: '01ARZ3NDEKTSV4RRFFQ69G5FC0',
            name: 'loading-test',
            description: ''
          }, { status: 201 });
        })
      );

      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      simulateInput(nameInput, 'loading-test');

      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      // Wait for DOM update after state change
      await new Promise(resolve => setTimeout(resolve, 10));

      // Re-query element after render
      const updatedSubmitBtn = component.querySelector('#submit-btn') as HTMLElement;

      // Check loading state
      expect(updatedSubmitBtn.textContent?.trim()).toBe('Creating...');
      expect(updatedSubmitBtn.hasAttribute('disabled')).toBe(true);

      // Wait for API call to complete
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    it('should reset form after successful submission', async () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      const descInput = component.querySelector('#app-description') as HTMLTextAreaElement;
      
      simulateInput(nameInput, 'reset-test');
      simulateInput(descInput, 'Test description');

      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Re-query elements after reset and re-render
      const resetNameInput = component.querySelector('#app-name') as HTMLInputElement;
      const resetDescInput = component.querySelector('#app-description') as HTMLTextAreaElement;

      // Form should be reset
      expect(resetNameInput.value).toBe('');
      expect(resetDescInput.value).toBe('');
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper button types and states', () => {
      const cancelBtn = component.querySelector('#cancel-btn') as HTMLButtonElement;
      const submitBtn = component.querySelector('#submit-btn') as HTMLButtonElement;

      expect(cancelBtn.type).toBe('button');
      expect(submitBtn.type).toBe('button');
      expect(cancelBtn.disabled).toBe(false);
      expect(submitBtn.disabled).toBe(false);
    });

    it('should indicate loading state accessibly', async () => {
      // Mock a slow API response to ensure loading state is visible
      const { server } = await import('../../tests/setup');
      const { http, HttpResponse } = await import('msw');
      
      server.use(
        http.post('/api/v1/applications', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({
            id: '01ARZ3NDEKTSV4RRFFQ69G5FC0',
            name: 'accessibility-test',
            description: ''
          }, { status: 201 });
        })
      );

      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      simulateInput(nameInput, 'accessibility-test');

      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      // Wait for DOM update after state change
      await new Promise(resolve => setTimeout(resolve, 10));

      // Re-query elements after render
      const updatedSubmitBtn = component.querySelector('#submit-btn') as HTMLElement;
      const formContainer = component.querySelector('.form-container');

      // Loading state should be clear
      expect(updatedSubmitBtn.textContent?.trim()).toBe('Creating...');
      expect(formContainer?.classList.contains('loading')).toBe(true);

      // Wait for API call to complete
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    it('should maintain focus management', () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      
      nameInput.focus();
      // In shadow DOM, check the shadow root's activeElement instead
      expect(component.shadowRoot?.activeElement).toBe(nameInput);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long input values', () => {
      const longName = 'a'.repeat(1000);
      const longDesc = 'b'.repeat(5000);

      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      const descInput = component.querySelector('#app-description') as HTMLTextAreaElement;

      simulateInput(nameInput, longName);
      simulateInput(descInput, longDesc);

      expect(nameInput.value).toBe(longName);
      expect(descInput.value).toBe(longDesc);
    });

    it('should handle special characters safely', () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      const descInput = component.querySelector('#app-description') as HTMLTextAreaElement;

      const unicodeText = '测试应用程序 🚀 مثال';
      simulateInput(nameInput, 'test-app');
      simulateInput(descInput, unicodeText);

      expect(descInput.value).toBe(unicodeText);
    });

    it('should handle whitespace-only inputs properly', () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      simulateInput(nameInput, '   \t\n   ');

      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      const nameError = component.querySelector('.form-group:first-of-type .form-error');
      expect(nameError?.textContent).toBe('Application name is required');
    });
  });
});