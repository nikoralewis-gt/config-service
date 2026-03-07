/**
 * Main application component
 */

import { BaseComponent } from './BaseComponent.js';
import { api } from '@/services/api.js';
import type { Application, LoadingState } from '@/types/api.js';

export class ConfigApp extends BaseComponent {
  private applications: Application[] = [];
  private selectedApp: Application | null = null;
  private loadingState: LoadingState = 'idle';
  private error: string | null = null;
  private showCreateAppForm = false;
  private showEditAppForm = false;
  private appToEdit: Application | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.loadApplications();
  }

  private async loadApplications(): Promise<void> {
    this.loadingState = 'loading';
    this.render();

    const result = await api.getApplications();
    
    if (result.success) {
      this.applications = result.data;
      this.loadingState = 'success';
      this.error = null;
    } else {
      this.error = result.error;
      this.loadingState = 'error';
    }
    
    this.render();
  }

  private selectApplication(app: Application): void {
    if (this.selectedApp?.id !== app.id) {
      this.selectedApp = app;
      this.render();
    }
  }

  private showCreateForm(): void {
    this.showCreateAppForm = true;
    this.showEditAppForm = false;
    this.render();
  }

  private showEditForm(app: Application): void {
    this.appToEdit = app;
    this.showEditAppForm = true;
    this.showCreateAppForm = false;
    this.render();
  }

  private hideForm(): void {
    this.showCreateAppForm = false;
    this.showEditAppForm = false;
    this.appToEdit = null;
    this.render();
  }

  private async handleAppCreated(event: CustomEvent): Promise<void> {
    const newApp = event.detail;
    this.applications.push(newApp);
    this.selectedApp = newApp;
    this.hideForm();
    await this.loadApplications(); // Refresh list
  }

  private async handleAppUpdated(event: CustomEvent): Promise<void> {
    const updatedApp = event.detail;
    const index = this.applications.findIndex(a => a.id === updatedApp.id);
    if (index !== -1) {
      this.applications[index] = updatedApp;
    }
    if (this.selectedApp?.id === updatedApp.id) {
      this.selectedApp = updatedApp;
    }
    this.hideForm();
    await this.loadApplications(); // Refresh list
  }

  private async handleAppDeleted(id: string): Promise<void> {
    const result = await api.deleteApplication(id);
    
    if (result.success) {
      this.applications = this.applications.filter(a => a.id !== id);
      if (this.selectedApp?.id === id) {
        this.selectedApp = null;
      }
      this.render();
    } else {
      this.error = result.error;
      this.render();
    }
  }

  protected render(): void {
    const styles = this.css`
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.5;
        }
        
        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .title {
          font-size: 2rem;
          font-weight: 600;
          color: #1a202c;
          margin: 0;
        }
        
        .btn-primary {
          padding: 0.75rem 1.5rem;
          border: none;
          background: #3182ce;
          color: white;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .btn-primary:hover {
          background: #2c5aa0;
        }
        
        .content {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 2rem;
        }
        
        .sidebar {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 1.5rem;
          height: fit-content;
        }
        
        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .sidebar-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #2d3748;
        }
        
        .main {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 1.5rem;
          min-height: 400px;
        }
        
        .app-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .app-item {
          padding: 1rem;
          border-radius: 0.375rem;
          cursor: pointer;
          border: 1px solid transparent;
          margin-bottom: 0.5rem;
          transition: all 0.2s;
        }
        
        .app-item:hover {
          background: #f7fafc;
          border-color: #e2e8f0;
        }
        
        .app-item.selected {
          background: #ebf8ff;
          border-color: #3182ce;
        }
        
        .app-item-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
        }
        
        .app-name {
          font-weight: 500;
          color: #2d3748;
          margin-bottom: 0.25rem;
        }
        
        .app-description {
          font-size: 0.875rem;
          color: #718096;
        }
        
        .app-actions {
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
          transition: all 0.2s;
        }
        
        .btn-small:hover {
          background: #f7fafc;
          border-color: #cbd5e0;
        }
        
        .btn-danger {
          color: #e53e3e;
          border-color: #feb2b2;
        }
        
        .btn-danger:hover {
          background: #fff5f5;
          border-color: #fc8181;
        }
        
        .loading {
          text-align: center;
          padding: 3rem;
          color: #718096;
        }
        
        .error {
          padding: 1rem;
          background: #fed7d7;
          color: #c53030;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
        }
        
        .empty {
          text-align: center;
          padding: 3rem;
          color: #718096;
        }
        
        @media (max-width: 768px) {
          .content {
            grid-template-columns: 1fr;
          }
          
          .container {
            padding: 1rem;
          }
        }
      </style>
    `;

    const content = this.loadingState === 'loading' 
      ? '<div class="loading">Loading applications...</div>'
      : this.loadingState === 'error'
      ? `<div class="error">Error: ${this.error}</div>`
      : this.renderContent();

    this.setHTML(`
      ${styles}
      <div class="container">
        <header class="header">
          <h1 class="title">Configuration Manager</h1>
          <button class="btn-primary" id="create-app-btn">
            Create Application
          </button>
        </header>
        ${this.showCreateAppForm ? '<application-form mode="create"></application-form>' : ''}
        ${this.showEditAppForm && this.appToEdit ? `<application-form mode="edit" app-id="${this.appToEdit.id}"></application-form>` : ''}
        ${content}
      </div>
    `);

    this.attachEventListeners();
  }

  private renderContent(): string {
    if (this.applications.length === 0) {
      return `
        <div class="empty">
          <p>No applications found.</p>
          <p>Create your first application to get started.</p>
        </div>
      `;
    }

    const appListHtml = this.applications.map(app => `
      <li class="app-item ${this.selectedApp?.id === app.id ? 'selected' : ''}" data-app-id="${app.id}">
        <div class="app-item-header">
          <div>
            <div class="app-name">${app.name}</div>
            ${app.description ? `<div class="app-description">${app.description}</div>` : ''}
          </div>
          <div class="app-actions">
            <button class="btn-small" data-action="edit" data-app-id="${app.id}">Edit</button>
            <button class="btn-small btn-danger" data-action="delete" data-app-id="${app.id}">Delete</button>
          </div>
        </div>
      </li>
    `).join('');

    return `
      <div class="content">
        <aside class="sidebar">
          <div class="sidebar-header">
            <h2 class="sidebar-title">Applications</h2>
          </div>
          <ul class="app-list">
            ${appListHtml}
          </ul>
        </aside>
        <main class="main">
          ${this.selectedApp ? `<configuration-list application-id="${this.selectedApp.id}"></configuration-list>` : '<div class="empty">Select an application to view its configurations</div>'}
        </main>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Create button
    const createBtn = this.querySelector('#create-app-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.showCreateForm());
    }

    // App selection
    const appItems = this.querySelectorAll('.app-item');
    appItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        // Don't select if clicking action buttons
        if (target.hasAttribute('data-action')) return;
        
        const appId = item.getAttribute('data-app-id');
        const app = this.applications.find(a => a.id === appId);
        if (app) {
          this.selectApplication(app);
        }
      });
    });

    // Edit/Delete buttons
    const actionButtons = this.querySelectorAll('[data-action]');
    actionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const appId = btn.getAttribute('data-app-id');
        const app = this.applications.find(a => a.id === appId);
        
        if (action === 'edit' && app) {
          this.showEditForm(app);
        } else if (action === 'delete' && appId) {
          if (confirm(`Are you sure you want to delete "${app?.name}"?`)) {
            this.handleAppDeleted(appId);
          }
        }
      });
    });

    // Form events
    const appForm = this.querySelector('application-form');
    if (appForm) {
      appForm.addEventListener('app-created', (e: Event) => this.handleAppCreated(e as CustomEvent));
      appForm.addEventListener('app-updated', (e: Event) => this.handleAppUpdated(e as CustomEvent));
      appForm.addEventListener('form-cancelled', () => this.hideForm());
    }
  }
}

customElements.define('config-app', ConfigApp);
