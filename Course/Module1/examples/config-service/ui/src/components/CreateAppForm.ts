import { BaseComponent } from './BaseComponent.js';
import { api } from '@/services/api.js';
import type { ApplicationCreate, LoadingState } from '@/types/api.js';

export class CreateAppForm extends BaseComponent {
  private formData: ApplicationCreate = { name: '', description: '' };
  private loadingState: LoadingState = 'idle';
  private error: string | null = null;
  private validationErrors: { name?: string; description?: string } = {};

  connectedCallback(): void {
    super.connectedCallback();
  }

  private validateForm(): boolean {
    this.validationErrors = {};

    // Name validation
    if (!this.formData.name.trim()) {
      this.validationErrors.name = 'Application name is required';
    } else if (!/^[a-zA-Z0-9_\-]+$/.test(this.formData.name)) {
      this.validationErrors.name = 'Name can only contain letters, numbers, underscores, and hyphens';
    }

    // Description validation (optional but if provided, should not be empty)
    if (this.formData.description && !this.formData.description.trim()) {
      this.validationErrors.description = 'Description cannot be empty if provided';
    }

    return Object.keys(this.validationErrors).length === 0;
  }

  private onInputChange(field: keyof ApplicationCreate, value: string): void {
    this.formData[field] = value;
    // Clear validation error when user starts typing
    if (this.validationErrors[field]) {
      delete this.validationErrors[field];
      this.render();
    }
  }

  private async submitForm(): Promise<void> {
    // Prevent double submission
    if (this.loadingState === 'loading') {
      return;
    }

    if (!this.validateForm()) {
      this.render();
      return;
    }

    this.loadingState = 'loading';
    this.error = null;
    this.render();

    const result = await api.createApplication(this.formData);

    if (result.success) {
      this.loadingState = 'success';
      this.emit('app-created', result.data);
      this.resetForm();
    } else {
      this.loadingState = 'error';
      this.error = result.error;
    }

    this.render();
  }

  private resetForm(): void {
    this.formData = { name: '', description: '' };
    this.validationErrors = {};
    this.error = null;
    this.loadingState = 'idle';
    this.render();
  }

  private cancelForm(): void {
    this.resetForm();
    this.emit('form-cancelled');
  }

  protected render(): void {
    const styles = this.css`
      <style>
        :host {
          display: block;
        }

        .form-container {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .form-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a202c;
          margin: 0 0 1.5rem 0;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .form-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .form-input.error {
          border-color: #e53e3e;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-error {
          color: #e53e3e;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: 1px solid;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
          font-weight: 500;
        }

        .btn-primary {
          background: #3182ce;
          color: white;
          border-color: #3182ce;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2c5aa0;
          border-color: #2c5aa0;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #4a5568;
          border-color: #e2e8f0;
        }

        .btn-secondary:hover {
          background: #cbd5e0;
          border-color: #cbd5e0;
        }

        .error-message {
          padding: 0.75rem;
          background: #fed7d7;
          color: #c53030;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .loading {
          opacity: 0.7;
          pointer-events: none;
        }
      </style>
    `;

    this.setHTML(this.html`
      ${styles}
      <div class="form-container ${this.loadingState === 'loading' ? 'loading' : ''}">
        <h3 class="form-title">Create New Application</h3>
        
        ${this.error ? this.html`
          <div class="error-message">${this.error}</div>
        ` : ''}

        <div class="form-group">
          <label class="form-label" for="app-name">Name *</label>
          <input 
            type="text" 
            id="app-name"
            class="form-input ${this.validationErrors.name ? 'error' : ''}"
            value="${this.formData.name}"
            placeholder="e.g., web-app, mobile-client"
            ${this.loadingState === 'loading' ? 'disabled' : ''}
          />
          ${this.validationErrors.name ? this.html`
            <div class="form-error">${this.validationErrors.name}</div>
          ` : ''}
        </div>

        <div class="form-group">
          <label class="form-label" for="app-description">Description</label>
          <textarea 
            id="app-description"
            class="form-input form-textarea ${this.validationErrors.description ? 'error' : ''}"
            placeholder="Brief description of the application (optional)"
            ${this.loadingState === 'loading' ? 'disabled' : ''}
          >${this.formData.description || ''}</textarea>
          ${this.validationErrors.description ? this.html`
            <div class="form-error">${this.validationErrors.description}</div>
          ` : ''}
        </div>

        <div class="form-actions">
          <button 
            type="button"
            class="btn btn-secondary" 
            id="cancel-btn"
            ${this.loadingState === 'loading' ? 'disabled' : ''}
          >
            Cancel
          </button>
          <button 
            type="button"
            class="btn btn-primary" 
            id="submit-btn"
            ${this.loadingState === 'loading' ? 'disabled' : ''}
          >
            ${this.loadingState === 'loading' ? 'Creating...' : 'Create Application'}
          </button>
        </div>
      </div>
    `);

    // Attach event listeners and sync DOM values
    const nameInput = this.querySelector<HTMLInputElement>('#app-name');
    const descriptionInput = this.querySelector<HTMLTextAreaElement>('#app-description');
    const cancelBtn = this.querySelector('#cancel-btn');
    const submitBtn = this.querySelector('#submit-btn');

    if (nameInput) {
      // Ensure DOM value matches component state
      nameInput.value = this.formData.name;
      nameInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        this.onInputChange('name', target.value);
      });
    }

    if (descriptionInput) {
      // Ensure DOM value matches component state
      descriptionInput.value = this.formData.description || '';
      descriptionInput.addEventListener('input', (e) => {
        const target = e.target as HTMLTextAreaElement;
        this.onInputChange('description', target.value);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.cancelForm());
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.submitForm());
    }
  }
}