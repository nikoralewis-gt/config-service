import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { server } from '../../tests/setup';
import { http, HttpResponse } from 'msw';
import { CreateAppForm } from './CreateAppForm';
import { createTestComponent, cleanupTestComponent, simulateClick, simulateInput, waitForEvent } from '../../tests/utils/test-helpers';

describe('CreateAppForm', () => {
  let component: CreateAppForm;

  beforeEach(() => {
    component = createTestComponent(CreateAppForm, 'create-app-form');
  });

  afterEach(() => {
    cleanupTestComponent(component);
  });

  describe('Initial rendering', () => {
    it('should render form with all required fields', () => {
      const title = component.querySelector('.form-title');
      const nameInput = component.querySelector('#app-name');
      const descriptionInput = component.querySelector('#app-description');
      const cancelBtn = component.querySelector('#cancel-btn');
      const submitBtn = component.querySelector('#submit-btn');

      expect(title?.textContent).toBe('Create New Application');
      expect(nameInput?.getAttribute('placeholder')).toBe('e.g., web-app, mobile-client');
      expect(descriptionInput?.getAttribute('placeholder')).toBe('Brief description of the application (optional)');
      expect(cancelBtn?.textContent?.trim()).toBe('Cancel');
      expect(submitBtn?.textContent?.trim()).toBe('Create Application');
    });

    it('should have proper form labels and accessibility', () => {
      const nameLabel = component.querySelector('label[for="app-name"]');
      const descriptionLabel = component.querySelector('label[for="app-description"]');
      const nameInput = component.querySelector('#app-name');
      const descriptionInput = component.querySelector('#app-description');

      expect(nameLabel?.textContent).toBe('Name *');
      expect(descriptionLabel?.textContent).toBe('Description');
      expect(nameInput?.tagName).toBe('INPUT');
      expect(descriptionInput?.tagName).toBe('TEXTAREA');
    });

    it('should have proper input types and attributes', () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      const descriptionInput = component.querySelector('#app-description') as HTMLTextAreaElement;

      expect(nameInput.type).toBe('text');
      expect(nameInput.value).toBe('');
      expect(descriptionInput.value).toBe('');
      expect(nameInput.hasAttribute('disabled')).toBe(false);
      expect(descriptionInput.hasAttribute('disabled')).toBe(false);
    });
  });

  describe('Form validation', () => {
    it('should show validation error for empty name', () => {
      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      const nameError = component.querySelector('.form-group:first-of-type .form-error');
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      
      expect(nameError?.textContent).toBe('Application name is required');
      expect(nameInput.classList.contains('error')).toBe(true);
    });

    it('should show validation error for invalid name format', () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      simulateInput(nameInput, 'invalid@name!');

      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      const nameError = component.querySelector('.form-group:first-of-type .form-error');
      expect(nameError?.textContent).toBe('Name can only contain letters, numbers, underscores, and hyphens');
    });

    it('should accept valid name formats', () => {
      const validNames = ['web-app', 'mobile_client', 'app123', 'MyApp', 'test-app_v2'];
      
      validNames.forEach(name => {
        const nameInput = component.querySelector('#app-name') as HTMLInputElement;
        simulateInput(nameInput, name);

        const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
        simulateClick(submitBtn);

        // Should not show name validation error for valid names
        const nameError = component.querySelector('.form-group:first-of-type .form-error');
        expect(nameError).toBeNull();
        
        // Reset for next test
        simulateInput(nameInput, '');
      });
    });

    it('should validate empty description when provided', async () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      const descriptionInput = component.querySelector('#app-description') as HTMLTextAreaElement;
      
      simulateInput(nameInput, 'valid-app');
      simulateInput(descriptionInput, '   '); // Only whitespace

      // Allow time for input handlers to process
      await new Promise(resolve => setTimeout(resolve, 10));

      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      // Allow time for validation and render
      await new Promise(resolve => setTimeout(resolve, 10));

      // Find the description error specifically - look for the error in the description field's form group
      const descError = component.querySelector('#app-description')?.parentElement?.querySelector('.form-error');
      expect(descError?.textContent).toBe('Description cannot be empty if provided');
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

      const nameErrorAfterTyping = component.querySelector('.form-group:first-of-type .form-error');
      expect(nameErrorAfterTyping).toBeNull();
    });
  });

  describe('Form submission', () => {
    it('should submit valid form successfully', async () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      const descriptionInput = component.querySelector('#app-description') as HTMLTextAreaElement;
      
      simulateInput(nameInput, 'test-app');
      simulateInput(descriptionInput, 'A test application');

      const eventPromise = waitForEvent(component, 'app-created');
      
      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      const event = await eventPromise;
      expect(event.detail.name).toBe('test-app');
      expect(event.detail.description).toBe('A test application');
      expect(event.detail.id).toBeTruthy();
    });

    it('should submit form with only name (no description)', async () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      simulateInput(nameInput, 'minimal-app');

      const eventPromise = waitForEvent(component, 'app-created');
      
      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      const event = await eventPromise;
      expect(event.detail.name).toBe('minimal-app');
      expect(event.detail.description).toBe('');
    });

    it('should show loading state during submission', async () => {
      // Mock a slow API response to ensure loading state is visible
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

      // Re-query elements after render
      const updatedSubmitBtn = component.querySelector('#submit-btn') as HTMLElement;
      const cancelBtn = component.querySelector('#cancel-btn') as HTMLElement;
      const formContainer = component.querySelector('.form-container');

      // Check loading state
      expect(updatedSubmitBtn.textContent?.trim()).toBe('Creating...');
      expect(updatedSubmitBtn.hasAttribute('disabled')).toBe(true);
      expect(cancelBtn.hasAttribute('disabled')).toBe(true);
      expect(formContainer?.classList.contains('loading')).toBe(true);

      // Wait for API call to complete
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    it('should handle API errors gracefully', async () => {
      server.use(
        http.post('/api/v1/applications', () => {
          return HttpResponse.json({ detail: 'Server error' }, { status: 500 });
        })
      );

      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      simulateInput(nameInput, 'error-test');

      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      await new Promise(resolve => setTimeout(resolve, 100));

      const errorMessage = component.querySelector('.error-message');
      expect(errorMessage?.textContent).toBe('Server error');
      
      // Form should not be in loading state after error
      expect(submitBtn.textContent?.trim()).toBe('Create Application');
      expect(submitBtn.hasAttribute('disabled')).toBe(false);
    });

    it('should reset form after successful submission', async () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      const descriptionInput = component.querySelector('#app-description') as HTMLTextAreaElement;
      
      simulateInput(nameInput, 'reset-test');
      simulateInput(descriptionInput, 'Test description');

      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Re-query elements after reset and re-render
      const resetNameInput = component.querySelector('#app-name') as HTMLInputElement;
      const resetDescInput = component.querySelector('#app-description') as HTMLTextAreaElement;

      // Form should be reset
      expect(resetNameInput.value).toBe('');
      expect(resetDescInput.value).toBe('');
      expect(component.querySelector('.error-message')).toBeNull();
    });
  });

  describe('Form cancellation', () => {
    it('should emit cancel event when cancel button is clicked', async () => {
      const eventPromise = waitForEvent(component, 'form-cancelled');
      
      const cancelBtn = component.querySelector('#cancel-btn') as HTMLElement;
      simulateClick(cancelBtn);

      await eventPromise;
      // If we reach here, the event was emitted successfully
      expect(true).toBe(true);
    });

    it('should reset form when cancelled', () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      const descriptionInput = component.querySelector('#app-description') as HTMLTextAreaElement;
      
      // Fill form
      simulateInput(nameInput, 'cancel-test');
      simulateInput(descriptionInput, 'Will be cancelled');

      // Trigger validation error
      simulateInput(nameInput, '');
      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      // Cancel form
      const cancelBtn = component.querySelector('#cancel-btn') as HTMLElement;
      simulateClick(cancelBtn);

      // Re-query elements after reset and re-render
      const resetNameInput = component.querySelector('#app-name') as HTMLInputElement;
      const resetDescInput = component.querySelector('#app-description') as HTMLTextAreaElement;

      // Check form is reset
      expect(resetNameInput.value).toBe('');
      expect(resetDescInput.value).toBe('');
      expect(component.querySelector('.form-error')).toBeNull();
      expect(component.querySelector('.error-message')).toBeNull();
    });
  });

  describe('UI states and styling', () => {
    it('should apply error styling to invalid fields', () => {
      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      expect(nameInput.classList.contains('error')).toBe(true);
    });

    it('should remove error styling when field becomes valid', async () => {
      // Trigger error
      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      expect(nameInput.classList.contains('error')).toBe(true);

      // Make field valid
      simulateInput(nameInput, 'valid-name');
      
      // Allow time for re-render
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Re-query element after re-render
      const updatedNameInput = component.querySelector('#app-name') as HTMLInputElement;
      expect(updatedNameInput.classList.contains('error')).toBe(false);
    });

    it('should disable form elements during loading', () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      simulateInput(nameInput, 'loading-test');

      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      const allInputs = component.querySelectorAll('input, textarea, button');
      allInputs.forEach(input => {
        expect(input.hasAttribute('disabled')).toBe(true);
      });
    });

    it('should show proper button states', () => {
      const cancelBtn = component.querySelector('#cancel-btn') as HTMLElement;
      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;

      expect(cancelBtn.classList.contains('btn-secondary')).toBe(true);
      expect(submitBtn.classList.contains('btn-primary')).toBe(true);
    });
  });

  describe('Accessibility features', () => {
    it('should have proper form structure', () => {
      const form = component.querySelector('.form-container');
      const labels = component.querySelectorAll('.form-label');
      const inputs = component.querySelectorAll('input, textarea');

      expect(form).toBeTruthy();
      expect(labels.length).toBe(2);
      expect(inputs.length).toBe(2);
    });

    it('should associate labels with inputs', () => {
      const nameLabel = component.querySelector('label[for="app-name"]');
      const descLabel = component.querySelector('label[for="app-description"]');
      const nameInput = component.querySelector('#app-name');
      const descInput = component.querySelector('#app-description');

      expect(nameLabel).toBeTruthy();
      expect(descLabel).toBeTruthy();
      expect(nameInput?.id).toBe('app-name');
      expect(descInput?.id).toBe('app-description');
    });

    it('should have required field indicators', () => {
      const nameLabel = component.querySelector('label[for="app-name"]');
      expect(nameLabel?.textContent).toContain('*');
    });

    it('should provide helpful placeholder text', () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      const descInput = component.querySelector('#app-description') as HTMLTextAreaElement;

      expect(nameInput.placeholder).toBe('e.g., web-app, mobile-client');
      expect(descInput.placeholder).toBe('Brief description of the application (optional)');
    });

    it('should maintain focus management', () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      nameInput.focus();
      // In shadow DOM, check the shadow root's activeElement instead
      expect(component.shadowRoot?.activeElement).toBe(nameInput);
    });
  });

  describe('Input handling and real-time feedback', () => {
    it('should update form data as user types', () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      const descInput = component.querySelector('#app-description') as HTMLTextAreaElement;

      simulateInput(nameInput, 'dynamic-app');
      simulateInput(descInput, 'Dynamic description');

      // Values should be reflected in the form
      expect(nameInput.value).toBe('dynamic-app');
      expect(descInput.value).toBe('Dynamic description');
    });

    it('should handle special characters in input', () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      const descInput = component.querySelector('#app-description') as HTMLTextAreaElement;

      simulateInput(nameInput, 'app-with_special123');
      simulateInput(descInput, 'Description with special chars: @#$%^&*()');

      expect(nameInput.value).toBe('app-with_special123');
      expect(descInput.value).toBe('Description with special chars: @#$%^&*()');
    });

    it('should handle copy/paste operations', () => {
      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      
      // Simulate pasting content
      nameInput.value = 'pasted-content';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      expect(nameInput.value).toBe('pasted-content');
    });
  });

  describe('Edge cases and error scenarios', () => {
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

    it('should handle unicode characters', () => {
      const unicodeName = 'app-测试-مثال-🚀';
      const unicodeDesc = 'Unicode description: 测试 مثال 🚀 emoji';

      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      const descInput = component.querySelector('#app-description') as HTMLTextAreaElement;

      simulateInput(nameInput, unicodeName);
      simulateInput(descInput, unicodeDesc);

      expect(nameInput.value).toBe(unicodeName);
      expect(descInput.value).toBe(unicodeDesc);
    });

    it('should handle network timeouts gracefully', async () => {
      server.use(
        http.post('/api/v1/applications', () => {
          // Simulate timeout by not responding
          return new Promise(() => {});
        })
      );

      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      simulateInput(nameInput, 'timeout-test');

      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      // Wait for DOM update after state change
      await new Promise(resolve => setTimeout(resolve, 10));

      // Re-query element after render
      const updatedSubmitBtn = component.querySelector('#submit-btn') as HTMLElement;
      
      // Should be in loading state
      expect(updatedSubmitBtn.textContent?.trim()).toBe('Creating...');
      expect(updatedSubmitBtn.hasAttribute('disabled')).toBe(true);
    });

    it('should prevent double submission', async () => {
      // Mock a slow API response to simulate actual conditions
      server.use(
        http.post('/api/v1/applications', async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return HttpResponse.json({
            id: '01ARZ3NDEKTSV4RRFFQ69G5FC0',
            name: 'double-submit-test',
            description: ''
          }, { status: 201 });
        })
      );

      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      simulateInput(nameInput, 'double-submit-test');

      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      
      // Rapid clicks
      simulateClick(submitBtn);
      simulateClick(submitBtn);
      simulateClick(submitBtn);

      // Wait for DOM update after state change
      await new Promise(resolve => setTimeout(resolve, 10));

      // Re-query element after render
      const updatedSubmitBtn = component.querySelector('#submit-btn') as HTMLElement;

      // Should only process one submission and be disabled
      expect(updatedSubmitBtn.hasAttribute('disabled')).toBe(true);
      
      // Wait for API call to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should handle malformed API responses', async () => {
      server.use(
        http.post('/api/v1/applications', () => {
          return new HttpResponse('invalid json', { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );

      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      simulateInput(nameInput, 'malformed-test');

      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should handle gracefully and show error
      const errorMessage = component.querySelector('.error-message');
      expect(errorMessage).toBeTruthy();
    });
  });

  describe('Performance considerations', () => {
    it('should not re-render unnecessarily on input changes', () => {
      const renderSpy = vi.spyOn(component as any, 'render');
      renderSpy.mockClear();

      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      
      // Multiple rapid inputs
      simulateInput(nameInput, 'a');
      simulateInput(nameInput, 'ab');
      simulateInput(nameInput, 'abc');

      // Should only render when validation errors change
      const renderCount = renderSpy.mock.calls.length;
      expect(renderCount).toBeLessThanOrEqual(3); // At most one per input if clearing errors
    });

    it('should debounce validation to avoid excessive rendering', () => {
      const renderSpy = vi.spyOn(component as any, 'render');
      
      // Trigger validation error
      const submitBtn = component.querySelector('#submit-btn') as HTMLElement;
      simulateClick(submitBtn);
      
      renderSpy.mockClear();

      const nameInput = component.querySelector('#app-name') as HTMLInputElement;
      
      // Rapid typing should not cause excessive renders
      for (let i = 0; i < 10; i++) {
        simulateInput(nameInput, `test${i}`);
      }

      // Should have minimal renders for clearing the error
      expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(2);
    });
  });
});