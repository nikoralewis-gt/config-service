/**
 * Configuration list component
 */

import { BaseComponent } from './BaseComponent.js';
import { api } from '@/services/api.js';
import type { Configuration, LoadingState } from '@/types/api.js';

export class ConfigurationList extends BaseComponent {
  private configurations: Configuration[] = [];
  private loadingState: LoadingState = 'idle';
  private error: string | null = null;
  private applicationId: string | null = null;
  private showCreateForm = false;
  private showEditForm = false;
  private configToEdit: Configuration | null = null;

  static get observedAttributes() {
    return ['application-id'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (oldValue === newValue) return;
    
    if (name === 'application-id') {
      this.applicationId = newValue;
      if (newValue) {
        this.loadConfigurations();
      }
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this.applicationId) {
      this.loadConfigurations();
    }
  }

  private async loadConfigurations(): Promise<void> {
    if (!this.applicationId) return;
    
    this.loadingState = 'loading';
    this.render();

    const result = await api.getConfigurations(this.applicationId);
    
    if (result.success) {
      this.configurations = result.data;
      this.loadingState = 'success';
      this.error = null;
    } else {
      this.error = result.error;
      this.loadingState = 'error';
    }
    
    this.render();
  }

  private showCreate(): void {
    this.showCreateForm = true;
    this.showEditForm = false;
    this.render();
  }

  private showEdit(config: Configuration): void {
    this.configToEdit = config;
    this.showEditForm = true;
    this.showCreateForm = false;
    this.render();
  }

  private hideForm(): void {
    this.showCreateForm = false;
    this.showEditForm = false;
    this.configToEdit = null;
    this.render();
  }

  private async handleDelete(id: string): Promise<void> {
    const config = this.configurations.find(c => c.id === id);
    if (!confirm(`Are you sure you want to delete "${config?.name}"?`)) {
      return;
    }

    const result = await api.deleteConfiguration(id);
    
    if (result.success) {
      await this.loadConfigurations();
    } else {
      this.error = result.error;
      this.render();
    }
  }

  private async handleConfigCreated(): Promise<void> {
    this.hideForm();
    await this.loadConfigurations();
  }

  private async handleConfigUpdated(): Promise<void> {
    this.hideForm();
    await this.loadConfigurations();
  }

  protected render(): void {
    const styles = this.css`
      <style>
        :host {
          display: block;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2d3748;
        }
        
        .btn-primary {
          padding: 0.5rem 1rem;
          border: none;
          background: #3182ce;
          color: white;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .btn-primary:hover {
          background: #2c5aa0;
        }
        
        .config-list {
          display: grid;
          gap: 1rem;
        }
        
        .config-card {
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          padding: 1rem;
          background: #f7fafc;
        }
        
        .config-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 0.5rem;
        }
        
        .config-name {
          font-weight: 500;
          color: #2d3748;
        }
        
        .config-description {
          font-size: 0.875rem;
          color: #718096;
          margin-bottom: 0.5rem;
        }
        
        .config-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .btn-small {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          border: 1px solid #e2e8f0;
          background: white;
          color: #4a5568;
          border-radius: 0.25rem;
          cursor: pointer;
        }
        
        .btn-small:hover {
          background: #f7fafc;
        }
        
        .btn-danger {
          color: #e53e3e;
          border-color: #feb2b2;
        }
        
        .btn-danger:hover {
          background: #fff5f5;
        }
        
        .settings {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: white;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }
        
        .settings-title {
          font-weight: 500;
          margin-bottom: 0.25rem;
          color: #4a5568;
        }
        
        .setting-item {
          display: flex;
          gap: 0.5rem;
          padding: 0.25rem 0;
          font-family: monospace;
          font-size: 0.8125rem;
        }
        
        .setting-key {
          color: #805ad5;
        }
        
        .setting-value {
          color: #38a169;
        }
        
        .loading, .empty, .error {
          text-align: center;
          padding: 2rem;
          color: #718096;
        }
        
        .error {
          color: #c53030;
          background: #fed7d7;
          border-radius: 0.375rem;
        }
      </style>
    `;

    let content = '';
    
    if (this.loadingState === 'loading') {
      content = '<div class="loading">Loading configurations...</div>';
    } else if (this.loadingState === 'error') {
      content = `<div class="error">Error: ${this.error}</div>`;
    } else if (this.configurations.length === 0) {
      content = '<div class="empty">No configurations found. Create one to get started.</div>';
    } else {
      content = this.renderConfigurations();
    }

    this.setHTML(`
      ${styles}
      <div>
        <div class="header">
          <h2 class="title">Configurations</h2>
          <button class="btn-primary" id="create-config-btn">
            Add Configuration
          </button>
        </div>
        ${this.showCreateForm ? `<configuration-form mode="create" application-id="${this.applicationId}"></configuration-form>` : ''}
        ${this.showEditForm && this.configToEdit ? `<configuration-form mode="edit" config-id="${this.configToEdit.id}"></configuration-form>` : ''}
        ${content}
      </div>
    `);

    this.attachEventListeners();
  }

  private renderConfigurations(): string {
    const cards = this.configurations.map(config => {
      const settingsEntries = Object.entries(config.settings);
      const settingsHtml = settingsEntries.length > 0
        ? `
          <div class="settings">
            <div class="settings-title">Settings:</div>
            ${settingsEntries.map(([key, value]) => `
              <div class="setting-item">
                <span class="setting-key">${key}:</span>
                <span class="setting-value">${value}</span>
              </div>
            `).join('')}
          </div>
        `
        : '<div class="settings"><div class="settings-title">No settings defined</div></div>';

      return `
        <div class="config-card">
          <div class="config-header">
            <div>
              <div class="config-name">${config.name}</div>
              ${config.description ? `<div class="config-description">${config.description}</div>` : ''}
            </div>
            <div class="config-actions">
              <button class="btn-small" data-action="edit" data-config-id="${config.id}">Edit</button>
              <button class="btn-small btn-danger" data-action="delete" data-config-id="${config.id}">Delete</button>
            </div>
          </div>
          ${settingsHtml}
        </div>
      `;
    }).join('');

    return `<div class="config-list">${cards}</div>`;
  }

  private attachEventListeners(): void {
    const createBtn = this.querySelector('#create-config-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.showCreate());
    }

    const actionButtons = this.querySelectorAll('[data-action]');
    actionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const configId = btn.getAttribute('data-config-id');
        const config = this.configurations.find(c => c.id === configId);
        
        if (action === 'edit' && config) {
          this.showEdit(config);
        } else if (action === 'delete' && configId) {
          this.handleDelete(configId);
        }
      });
    });

    const configForm = this.querySelector('configuration-form');
    if (configForm) {
      configForm.addEventListener('config-created', () => this.handleConfigCreated());
      configForm.addEventListener('config-updated', () => this.handleConfigUpdated());
      configForm.addEventListener('form-cancelled', () => this.hideForm());
    }
  }
}

customElements.define('configuration-list', ConfigurationList);
