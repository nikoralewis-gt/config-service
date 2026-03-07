/**
 * Application create/edit form component
 */

import { BaseComponent } from './BaseComponent.js';
import { api } from '@/services/api.js';
import type { Application, ApplicationCreate, ApplicationUpdate } from '@/types/api.js';

export class ApplicationForm extends BaseComponent {
  private mode: 'create' | 'edit' = 'create';
  private appId: string | null = null;
  private application: Application | null = null;
  private loading = false;
  private error: string | null = null;
  private validationErrors: Record<string, string> = {};

  static get observedAttributes() {
    return ['mode', 'app-id'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (oldValue === newValue) return;
    
    if (name === 'mode') {
      this.mode = newValue as 'create' | 'edit';
    } else if (name === 'app-id') {
      this.appId = newValue;
      if (newValue && this.mode === 'edit') {
        this.loadApplication();
      }
    }
    
    if (this._isConnected) {
      this.render();
    }
  }

  private async loadApplication(): Promise<void> {
    if (!this.appId) return;
    
    const result = await api.getApplication(this.appId);
    if (result.success) {
      this.application = result.data;
      this.render();
    }
  }

  private validate(name: string, description?: string): boolean {
    this.validationErrors = {};
    
    if (!name || name.trim().length === 0) {
      this.validationErrors.name = 'Name is required';
    } else if (name.length > 256) {
      this.validationErrors.name = 'Name must be 256 characters or less';
    }
    
    if (description && description.length > 1024) {
      this.validationErrors.description = 'Description must be 1024 characters or less';
    }
    
    return Object.keys(this.validationErrors).length === 0;
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string || undefined;
    
    if (!this.validate(name, description)) {
      this.render();
      return;
    }
    
    this.loading = true;
    this.error = null;
    this.render();
    
    const data: ApplicationCreate | ApplicationUpdate = {
      name,
      description
    };
    
    const result = this.mode === 'create'
      ? await api.createApplication(data)
      : await api.updateApplication(this.appId!, data);
    
    this.loading = false;
    
    if (result.success) {
      const eventName = this.mode === 'create' ? 'app-created' : 'app-updated';
      this.emit(eventName, result.data);
    } else {
      this.error = result.error;
      this.render();
    }
  }

  private handleCancel(): void {
    this.emit('form-cancelled');
  }

  protected render(): void {
    const title = this.mode === 'create' ? 'Create Application' : 'Edit Application';
    const submitText = this.mode === 'create' ? 'Create' : 'Update';
    const nameValue = this.application?.name || '';
    const descriptionValue = this.application?.description || '';

    const styles = this.css`
      <style>
        :host {
          display: block;
          margin-bottom: 2rem;
        }
        
        .form-container {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .form-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #2d3748;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #4a5568;
        }
        
        .form-input,
        .form-textarea {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-family: inherit;
          font-size: 0.875rem;
        }
        
        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }
        
        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }
        
        .form-error {
          color: #e53e3e;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
        
        .error-banner {
          padding: 1rem;
          background: #fed7d7;
          color: #c53030;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
        }
        
        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }
        
        .btn {
          padding: 0.5rem 1rem;
          border: 1px solid;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .btn-primary {
          background: #3182ce;
          color: white;
          border-color: #3182ce;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: #2c5aa0;
        }
        
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-secondary {
          background: white;
          color: #4a5568;
          border-color: #e2e8f0;
        }
        
        .btn-secondary:hover {
          background: #f7fafc;
        }
      </style>
    `;

    this.setHTML(`
      ${styles}
      <div class="form-container">
        <h2 class="form-title">${title}</h2>
        ${this.error ? `<div class="error-banner">${this.error}</div>` : ''}
        <form id="app-form">
          <div class="form-group">
            <label class="form-label" for="name">Name *</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              class="form-input"
              value="${nameValue}"
              required
              maxlength="256"
              ${this.loading ? 'disabled' : ''}
            />
            ${this.validationErrors.name ? `<div class="form-error">${this.validationErrors.name}</div>` : ''}
          </div>
          
          <div class="form-group">
            <label class="form-label" for="description">Description</label>
            <textarea 
              id="description" 
              name="description" 
              class="form-textarea"
              maxlength="1024"
              ${this.loading ? 'disabled' : ''}
            >${descriptionValue}</textarea>
            ${this.validationErrors.description ? `<div class="form-error">${this.validationErrors.description}</div>` : ''}
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="cancel-btn" ${this.loading ? 'disabled' : ''}>
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" ${this.loading ? 'disabled' : ''}>
              ${this.loading ? 'Saving...' : submitText}
            </button>
          </div>
        </form>
      </div>
    `);

    // Attach event listeners
    const form = this.querySelector('#app-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    const cancelBtn = this.querySelector('#cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.handleCancel());
    }
  }
}

customElements.define('application-form', ApplicationForm);
