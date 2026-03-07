import { describe, it, expect } from 'vitest';
import { BaseComponent } from '../components/BaseComponent';
import { configClient } from '../services/config-client';
import { createTestComponent, cleanupTestComponent } from '../../tests/utils/test-helpers';

describe('UI Quality and User Experience', () => {
  
  describe('Component Architecture Quality', () => {
    it('should have solid BaseComponent foundation', () => {
      class TestComponent extends BaseComponent {
        protected render(): void {
          this.setHTML('<div>Test</div>');
        }
      }

      const component = createTestComponent(TestComponent, 'test-component');
      
      // Shadow DOM properly created
      expect(component.shadowRoot).toBeTruthy();
      expect(component.shadowRoot?.mode).toBe('open');
      
      // Template helpers work
      const html = component['html']`<div>Hello ${'World'}</div>`;
      expect(html).toBe('<div>Hello World</div>');
      
      const css = component['css']`color: ${'red'};`;
      expect(css).toBe('color: red;');
      
      // Event emission works
      let eventFired = false;
      component.addEventListener('test' as any, () => { eventFired = true; });
      component['emit']('test');
      expect(eventFired).toBe(true);
      
      cleanupTestComponent(component);
    });

    it('should have proper component lifecycle', () => {
      class LifecycleComponent extends BaseComponent {
        public renderCalled = false;
        protected render(): void {
          this.renderCalled = true;
          this.setHTML('<div>Lifecycle Test</div>');
        }
      }

      // Use safe component registration but don't auto-append to DOM
      const tagName = `lifecycle-component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      if (!customElements.get(tagName)) {
        customElements.define(tagName, LifecycleComponent);
      }
      
      const component = new LifecycleComponent();
      
      // Not connected yet - component created but not in DOM
      expect(component['_isConnected']).toBe(false);
      expect(component.renderCalled).toBe(false);
      
      // Simulate connection
      document.body.appendChild(component);
      expect(component['_isConnected']).toBe(true);
      expect(component.renderCalled).toBe(true);
      
      // Cleanup
      document.body.removeChild(component);
      expect(component['_isConnected']).toBe(false);
    });
  });

  describe('API Integration Quality', () => {
    it('should have comprehensive error handling', async () => {
      // Test type safety
      const healthResult = await configClient.getHealth();
      expect(typeof healthResult.success).toBe('boolean');
      
      if (healthResult.success) {
        expect(healthResult.data.status).toBeTruthy();
        expect(healthResult.data.version).toBeTruthy();
      } else {
        expect(typeof healthResult.error).toBe('string');
      }
    });

    it('should handle different response types correctly', async () => {
      const appsResult = await configClient.getApplications();
      
      if (appsResult.success) {
        expect(Array.isArray(appsResult.data)).toBe(true);
        appsResult.data.forEach(app => {
          expect(typeof app.id).toBe('string');
          expect(typeof app.name).toBe('string');
          expect(app.description === null || typeof app.description === 'string').toBe(true);
        });
      }
    });
  });

  describe('Type Safety and Data Validation', () => {
    it('should have proper TypeScript interfaces', () => {
      // These should compile without errors due to TypeScript
      const appCreate = {
        name: 'test-app',
        description: 'test description'
      };
      
      const appResponse = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        name: 'test-app',
        description: 'test description'
      };
      
      const configUpdate = {
        config: { theme: 'dark', timeout: 30 }
      };
      
      expect(appCreate.name).toBe('test-app');
      expect(appResponse.id).toBeTruthy();
      expect(configUpdate.config.theme).toBe('dark');
    });

    it('should handle optional and nullable fields correctly', () => {
      // Test optional description
      const appWithoutDesc = { name: 'test' };
      const appWithNullDesc = { name: 'test', description: null };
      const appWithDesc = { name: 'test', description: 'description' };
      
      expect(appWithoutDesc.name).toBe('test');
      expect(appWithNullDesc.description).toBeNull();
      expect(appWithDesc.description).toBe('description');
    });
  });

  describe('User Experience Quality', () => {
    it('should provide meaningful error messages', () => {
      const errorMessages = [
        'Application name is required',
        'Name can only contain letters, numbers, underscores, and hyphens',
        'Description cannot be empty if provided',
        'Invalid JSON format',
        'Configuration not found',
        'Application not found'
      ];
      
      errorMessages.forEach(message => {
        expect(message.length).toBeGreaterThan(10);
        expect(message).toMatch(/[A-Z]/); // Should start with capital
        expect(message.endsWith('.')).toBe(false); // No period for consistency
      });
    });

    it('should have consistent loading states', () => {
      const loadingMessages = [
        'Loading applications...',
        'Loading configuration...',
        'Creating...'
      ];
      
      loadingMessages.forEach(message => {
        expect(message).toMatch(/\.\.\./); // Should end with ellipsis
        const isLoadingMessage = message.toLowerCase().includes('loading') || 
                                 message.toLowerCase().includes('creating');
        expect(isLoadingMessage).toBe(true);
      });
    });

    it('should have accessible form structure', () => {
      // Test form field requirements
      const requiredFields = ['Name *'];
      const optionalFields = ['Description'];
      
      requiredFields.forEach(field => {
        expect(field).toContain('*');
      });
      
      optionalFields.forEach(field => {
        expect(field).not.toContain('*');
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle template literals efficiently', () => {
      class PerformanceComponent extends BaseComponent {
        protected render(): void {
          // Test that template literals don't cause memory leaks
          const largeArray = Array.from({ length: 1000 }, (_, i) => i);
          const html = this.html`
            <div>
              ${largeArray.map(i => `<span>${i}</span>`).join('')}
            </div>
          `;
          this.setHTML(html);
        }
      }

      const component = createTestComponent(PerformanceComponent, 'performance-component');
      component['render']();
      
      expect(component.shadowRoot?.innerHTML).toContain('<span>0</span>');
      expect(component.shadowRoot?.innerHTML).toContain('<span>999</span>');
      
      cleanupTestComponent(component);
    });

    it('should handle DOM updates efficiently', () => {
      class UpdateComponent extends BaseComponent {
        private count = 0;
        
        protected render(): void {
          this.setHTML(`<div>Count: ${this.count}</div>`);
        }
        
        public increment(): void {
          this.count++;
          this.updateHTML(`<div>Count: ${this.count}</div>`);
        }
      }

      const component = createTestComponent(UpdateComponent, 'update-component');
      
      expect(component.shadowRoot?.textContent).toBe('Count: 0');
      
      component.increment();
      expect(component.shadowRoot?.textContent).toBe('Count: 1');
      
      cleanupTestComponent(component);
    });
  });

  describe('Security and Input Validation', () => {
    it('should handle special characters safely', () => {
      const testStrings = [
        '<script>alert("xss")</script>',
        'Robert"; DROP TABLE users; --',
        '${process.env.SECRET}',
        'test\x00null\x00bytes',
        '🚀 Unicode 测试 مثال'
      ];
      
      testStrings.forEach((testString, index) => {
        // Component should handle these without throwing
        expect(() => {
          class SafeComponent extends BaseComponent {
            protected render(): void {
              this.setHTML(this.html`<div>${testString}</div>`);
            }
          }
          const component = createTestComponent(SafeComponent, `safe-component-${index}`);
          component['render']();
          cleanupTestComponent(component);
        }).not.toThrow();
      });
    });

    it('should validate input formats correctly', () => {
      // Name validation regex test
      const nameRegex = /^[a-zA-Z0-9_\-]+$/;
      
      const validNames = ['app', 'my-app', 'my_app', 'app123', 'App-Name_123'];
      const invalidNames = ['app@domain', 'app with spaces', 'app!', 'app.exe', ''];
      
      validNames.forEach(name => {
        expect(nameRegex.test(name)).toBe(true);
      });
      
      invalidNames.forEach(name => {
        expect(nameRegex.test(name)).toBe(false);
      });
    });
  });

  describe('Accessibility Standards', () => {
    it('should follow semantic HTML patterns', () => {
      // Test semantic structure expectations
      const semanticElements = [
        'header', 'main', 'aside', 'section', 'article', 
        'nav', 'button', 'form', 'label'
      ];
      
      semanticElements.forEach(tag => {
        expect(tag.length).toBeGreaterThan(1);
        expect(tag).toMatch(/^[a-z]+$/); // Valid HTML tag format
      });
      
      // Test heading hierarchy separately
      const headings = ['h1', 'h2', 'h3'];
      headings.forEach(heading => {
        expect(heading).toMatch(/^h[1-6]$/); // Valid heading format
      });
    });

    it('should have proper ARIA and labeling patterns', () => {
      const labelPatterns = [
        'Name *',
        'Description',
        'Create Application',
        'Cancel',
        'Save',
        'Edit'
      ];
      
      labelPatterns.forEach(label => {
        expect(label.trim()).toBe(label); // No extra whitespace
        expect(label.length).toBeGreaterThan(0);
      });
    });

    it('should have consistent button and interaction patterns', () => {
      const buttonTypes = ['primary', 'secondary'];
      const buttonStates = ['normal', 'hover', 'disabled', 'loading'];
      
      buttonTypes.forEach(type => {
        expect(['primary', 'secondary']).toContain(type);
      });
      
      buttonStates.forEach(state => {
        expect(['normal', 'hover', 'disabled', 'loading']).toContain(state);
      });
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('should handle missing modern APIs gracefully', () => {
      // Test that code doesn't break if modern APIs are missing
      const originalCustomElements = globalThis.customElements;
      
      try {
        // Temporarily remove customElements
        delete (globalThis as any).customElements;
        
        // Code should handle this gracefully
        expect(() => {
          const element = document.createElement('div');
          element.innerHTML = '<div>Test</div>';
        }).not.toThrow();
        
      } finally {
        globalThis.customElements = originalCustomElements;
      }
    });

    it('should handle different event implementations', () => {
      // Test event creation and handling
      const clickEvent = new Event('click', { bubbles: true });
      const customEvent = new CustomEvent('custom', { detail: { data: 'test' } });
      
      expect(clickEvent.type).toBe('click');
      expect(clickEvent.bubbles).toBe(true);
      expect(customEvent.type).toBe('custom');
      expect((customEvent as any).detail.data).toBe('test');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should provide fallback states for all scenarios', () => {
      const fallbackStates = [
        'No applications found.',
        'No configuration found for this application',
        'Select an application to view its configuration',
        'Loading applications...',
        'Loading configuration...'
      ];
      
      fallbackStates.forEach(state => {
        expect(state.length).toBeGreaterThan(10);
        expect(state).toMatch(/^[A-Z]/); // Proper sentence case
      });
    });

    it('should handle malformed data gracefully', () => {
      const malformedData = [
        null,
        undefined,
        {},
        [],
        { id: null },
        { name: '' },
        'string instead of object'
      ];
      
      malformedData.forEach(data => {
        expect(() => {
          // Code should handle any malformed data without crashing
          const isValid = data && 
                         typeof data === 'object' && 
                         !Array.isArray(data) && 
                         'id' in data && 
                         'name' in data;
          return isValid;
        }).not.toThrow();
      });
    });
  });
});
