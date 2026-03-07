import { BaseComponent } from './BaseComponent';
import { configClient } from '../services/config-client';
import type { ApplicationResponse, LoadingState } from 'config-client';

export class ConfigApp extends BaseComponent {
  private applications: ApplicationResponse[] = [];
  private selectedApp: ApplicationResponse | null = null;
  private loadingState: LoadingState = 'idle';
  private error: string | null = null;
  private showCreateForm = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.loadApplications();
  }

  private async loadApplications(): Promise<void> {
    this.loadingState = 'loading';
    this.render();

    const result = await configClient.getApplications();
    
    if (result.success) {
      this.applications = result.data;
      this.loadingState = 'success';
    } else {
      this.error = result.error;
      this.loadingState = 'error';
    }
    
    this.render();
  }

  private selectApplication(app: ApplicationResponse): void {
    // Only re-render if selecting a different app
    if (this.selectedApp?.id !== app.id) {
      this.selectedApp = app;
      this.render();
    }
  }

  private showCreateFormModal(): void {
    this.showCreateForm = true;
    this.render();
  }

  private hideCreateForm(): void {
    this.showCreateForm = false;
    this.render();
  }

  private onAppCreated(event: CustomEvent): void {
    const newApp = event.detail;
    this.applications.push(newApp);
    this.selectedApp = newApp;
    this.showCreateForm = false;
    this.render();
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
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .title {
          font-size: 2rem;
          font-weight: 600;
          color: #1a202c;
          margin: 0;
        }
        
        .btn {
          padding: 0.5rem 1rem;
          border: 1px solid #3182ce;
          background: #3182ce;
          color: white;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background-color 0.2s;
        }
        
        .btn:hover {
          background: #2c5aa0;
        }
        
        .content {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 2rem;
        }
        
        .sidebar {
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 1rem;
        }
        
        .main {
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 1rem;
        }
        
        .app-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .app-item {
          padding: 0.75rem;
          border-radius: 0.375rem;
          cursor: pointer;
          border: 1px solid transparent;
          margin-bottom: 0.5rem;
        }
        
        .app-item:hover {
          background: #f7fafc;
          border-color: #e2e8f0;
        }
        
        .app-item.selected {
          background: #ebf8ff;
          border-color: #3182ce;
        }
        
        .app-name {
          font-weight: 500;
          color: #2d3748;
        }
        
        .app-description {
          font-size: 0.875rem;
          color: #718096;
          margin-top: 0.25rem;
        }
        
        .loading {
          text-align: center;
          padding: 2rem;
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
      </style>
    `;

    const content = this.loadingState === 'loading' 
      ? this.html`<div class="loading">Loading applications...</div>`
      : this.loadingState === 'error'
      ? this.html`<div class="error">Error: ${this.error}</div>`
      : this.renderContent();

    this.setHTML(this.html`
      ${styles}
      <div class="container">
        <header class="header">
          <h1 class="title">Configuration Manager</h1>
          <button class="btn" id="create-btn">
            Create Application
          </button>
        </header>
        ${this.showCreateForm ? this.html`
          <create-app-form></create-app-form>
        ` : ''}
        ${content}
      </div>
    `);

    // Attach event listeners after DOM is updated
    const createBtn = this.querySelector('#create-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.showCreateFormModal());
    }

    // Attach app selection listeners
    const appItems = this.querySelectorAll('.app-item');
    appItems.forEach(item => {
      item.addEventListener('click', () => {
        const appId = item.getAttribute('data-app-id');
        const app = this.applications.find(a => a && a.id === appId);
        if (app) {
          this.selectApplication(app);
        }
      });
    });

    // Attach form event listeners
    const createForm = this.querySelector('create-app-form');
    if (createForm) {
      createForm.addEventListener('app-created', (e: Event) => this.onAppCreated(e as CustomEvent));
      createForm.addEventListener('form-cancelled', () => this.hideCreateForm());
    }
  }

  private renderContent(): string {
    if (this.applications.length === 0) {
      return this.html`
        <div class="empty">
          <p>No applications found.</p>
          <p>Create your first application to get started.</p>
        </div>
      `;
    }

    return this.html`
      <div class="content">
        <aside class="sidebar">
          <h2>Applications</h2>
          <ul class="app-list">
            ${this.applications.filter(app => app && app.id && app.name).map((app, index) => this.html`
              <li class="app-item ${this.selectedApp?.id === app.id ? 'selected' : ''}"
                  data-app-id="${app.id}" data-app-index="${index}">
                <div class="app-name">${app.name}</div>
                ${app.description ? this.html`
                  <div class="app-description">${app.description}</div>
                ` : ''}
              </li>
            `).join('')}
          </ul>
        </aside>
        <main class="main">
          ${this.selectedApp ? this.html`
            <config-detail application-id="${this.selectedApp.id}"></config-detail>
          ` : this.html`
            <div class="empty">Select an application to view its configuration</div>
          `}
        </main>
      </div>
    `;
  }
}
