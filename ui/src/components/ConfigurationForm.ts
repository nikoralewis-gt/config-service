/**
 * Configuration create/edit form component
 */

import { BaseComponent } from './BaseComponent.js';
import { api } from '@/services/api.js';
import type { Configuration, ConfigurationCreate, ConfigurationUpdate } from '@/types/api.js';

export class ConfigurationForm extends BaseComponent {
  private mode: 'create' | 'edit' = 'create';
  private configId: string | null = null;
  private applicationId: string | null = null;
  private configuration: Configuration | null = null;
  private loading = false;
  private error: string | null = null;
  private validationErrors: Record<string, string> = {};
  private settings: Record<string, string> = {};

  static get observedAttributes() {
    return ['mode', 'config-id', 'application-id'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (oldValue === newValue) return;
    
    if (name === 'mode') {
      this.mode = newValue as 'create' | 'edit';
    } else if (name === 'config-id') {
      this.configId = newValue;
      if (newValue && this.mode === 'edit') {
        this.loadConfiguration();
      }
    } else if (name === 'application-id') {
      this.applicationId = newValue;
    }
    
    if (this._isConnected) {
      this.render();
    }
  }

  private async loadConfiguration(): Promise<void> {
    if (!this.configId) return;
    
    const result = await api.getConfiguration(this.configId);
    if (result.success) {
      this.configuration = result.data;
      this.settings = { ...result.data.settings };
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

  private addSetting(): void {
    const key = `key_${Date.now()}`;
    this.settings[key] = '';
    this.render();
  }

  private removeSetting(key: string): void {
    delete this.settings[key];
    this.render();
  }

  private updateSetting(oldKey: string, newKey: string, value: string): void {
    if (oldKey !== newKey) {
      delete this.settings[oldKey];
    }
    if (newKey.trim()) {
      this.settings[newKey] = value;
    }
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string || undefined;
    
    // Collect settings from form
    const finalSettings: Record<string, string> = {};
    const settingKeys = Array.from(formData.keys()).filter(k => k.startsWith('setting-key-'));
    
    settingKeys.forEach(keyField => {
      const index = keyField.replace('setting-key-', '');
      const key = formData.get(keyField) as string;
      const value = formData.get(`setting-value-${index}`) as string;
      
      if (key && key.trim()) {
        finalSettings[key.trim()] = value || '';
      }
    });
    
    if (!this.validate(name, description)) {
      this.render();
      return;
    }
    
    this.loading = true;
    this.error = null;
    this.render();
    
    let result;
    
    if (this.mode === 'create') {
      const data: ConfigurationCreate = {
        application_id: this.applicationId!,
        name,
        description,
        settings: finalSettings
      };
      result = await api.createConfiguration(data);
    } else {
      const data: ConfigurationUpdate = {
        name,
        description,
        settings: finalSettings
      };
      result = await api.updateConfiguration(this.configId!, data);
    }
    
    this.loading = false;
    
    if (result.success) {
      const eventName = this.mode === 'create' ? 'config-created' : 'config-updated';
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
    const title = this.mode === 'create' ? 'Create Configuration' : 'Edit Configuration';
    const submitText = this.mode === 'create' ? 'Create' : 'Update';
    const nameValue = this.configuration?.name || '';
    const descriptionValue = this.configuration?.description || '';
    
    const settingsEntries = Object.entries(this.settings);

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
          min-height: 60px;
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
        
        .settings-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }
        
        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .settings-title {
          font-weight: 600;
          color: #2d3748;
        }
        
        .btn-add {
          padding: 0.375rem 0.75rem;
          background: #38a169;
          color: white;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .btn-add:hover {
          background: #2f855a;
        }
        
        .setting-row {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .btn-remove {
          padding: 0.5rem;
          background: #e53e3e;
          color: white;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
        }
        
        .btn-remove:hover {
          background: #c53030;
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

    const settingsHtml = settingsEntries.map(([key, value], index) => `
      <div class="setting-row">
        <input 
          type="text" 
          name="setting-key-${index}" 
          class="form-input" 
          placeholder="Key"
          value="${key}"
          ${this.loading ? 'disabled' : ''}
        />
        <input 
          type="text" 
          name="setting-value-${index}" 
          class="form-input" 
          placeholder="Value"
          value="${value}"
          ${this.loading ? 'disabled' : ''}
        />
        <button 
          type="button" 
          class="btn-remove" 
          data-remove-key="${key}"
          ${this.loading ? 'disabled' : ''}
        >×</button>
      </div>
    `).join('');

    this.setHTML(`
      ${styles}
      <div class="form-container">
        <h2 class="form-title">${title}</h2>
        ${this.error ? `<div class="error-banner">${this.error}</div>` : ''}
        <form id="config-form">
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
          
          <div class="settings-section">
            <div class="settings-header">
              <div class="settings-title">Settings (Key-Value Pairs)</div>
              <button type="button" class="btn-add" id="add-setting-btn" ${this.loading ? 'disabled' : ''}>
                + Add Setting
              </button>
            </div>
            ${settingsHtml || '<div style="color: #718096; font-size: 0.875rem;">No settings added yet</div>'}
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

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const form = this.querySelector('#config-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    const cancelBtn = this.querySelector('#cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.handleCancel());
    }

    const addBtn = this.querySelector('#add-setting-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addSetting());
    }

    const removeButtons = this.querySelectorAll('[data-remove-key]');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-remove-key');
        if (key) {
          this.removeSetting(key);
        }
      });
    });
  }
}

customElements.define('configuration-form', ConfigurationForm);
