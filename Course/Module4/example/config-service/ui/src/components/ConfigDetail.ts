import { BaseComponent } from './BaseComponent';
import { configClient } from '../services/config-client';
import type { ConfigurationResponse, LoadingState } from 'config-client';

export class ConfigDetail extends BaseComponent {
  private configuration: ConfigurationResponse | null = null;
  private loadingState: LoadingState = 'idle';
  private error: string | null = null;
  private isEditing = false;
  private editingConfig = '';

  static get observedAttributes(): string[] {
    return ['application-id'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (name === 'application-id' && oldValue !== newValue) {
      this.loadConfiguration();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    const appId = this.getAttribute('application-id');
    if (appId) {
      this.loadConfiguration();
    }
  }

  private async loadConfiguration(): Promise<void> {
    const appId = this.getAttribute('application-id');
    if (!appId) return;

    this.loadingState = 'loading';
    this.error = null;
    this.render();

    const result = await configClient.getConfiguration(appId);
    
    if (result.success) {
      this.configuration = result.data;
      this.loadingState = 'success';
    } else {
      this.error = result.error;
      this.loadingState = 'error';
    }
    
    this.render();
  }

  private startEditing(): void {
    if (this.configuration) {
      this.isEditing = true;
      this.editingConfig = JSON.stringify(this.configuration.config, null, 2);
      this.render();
    }
  }

  private cancelEditing(): void {
    this.isEditing = false;
    this.editingConfig = '';
    this.render();
  }

  private async saveConfiguration(): Promise<void> {
    const appId = this.getAttribute('application-id');
    if (!appId) return;

    try {
      const config = JSON.parse(this.editingConfig);
      const result = await configClient.updateConfiguration(appId, { config });
      
      if (result.success) {
        this.configuration = result.data;
        this.isEditing = false;
        this.editingConfig = '';
        this.render();
      } else {
        this.error = result.error;
        this.render();
      }
    } catch (error) {
      this.error = 'Invalid JSON format';
      this.render();
    }
  }

  private onConfigChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.editingConfig = target.value;
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
          font-size: 1.25rem;
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
          margin-left: 0.5rem;
        }
        
        .btn:hover {
          background: #2c5aa0;
        }
        
        .btn-secondary {
          background: #e2e8f0;
          color: #4a5568;
          border-color: #e2e8f0;
        }
        
        .btn-secondary:hover {
          background: #cbd5e0;
        }
        
        .config-display {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          padding: 1rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
          white-space: pre-wrap;
          overflow-x: auto;
        }
        
        .config-editor {
          width: 100%;
          min-height: 300px;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
          resize: vertical;
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
        
        .actions {
          margin-top: 1rem;
        }
      </style>
    `;

    if (this.loadingState === 'loading') {
      this.setHTML(this.html`
        ${styles}
        <div class="loading">Loading configuration...</div>
      `);
      return;
    }

    if (this.loadingState === 'error' || this.error) {
      this.setHTML(this.html`
        ${styles}
        <div class="error">Error: ${this.error}</div>
      `);
      return;
    }

    if (!this.configuration) {
      this.setHTML(this.html`
        ${styles}
        <div class="empty">No configuration found for this application</div>
      `);
      return;
    }

    this.setHTML(this.html`
      ${styles}
      <div class="header">
        <h2 class="title">Configuration</h2>
        <div>
          ${this.isEditing ? this.html`
            <button class="btn-secondary btn" id="cancel-btn">Cancel</button>
            <button class="btn" id="save-btn">Save</button>
          ` : this.html`
            <button class="btn" id="edit-btn">Edit</button>
          `}
        </div>
      </div>
      
      ${this.isEditing ? this.html`
        <textarea 
          class="config-editor" 
          id="config-textarea"
        >${this.editingConfig}</textarea>
      ` : this.html`
        <div class="config-display">${JSON.stringify(this.configuration.config, null, 2)}</div>
      `}
    `);

    // Attach event listeners after rendering
    const editBtn = this.querySelector('#edit-btn');
    const cancelBtn = this.querySelector('#cancel-btn');
    const saveBtn = this.querySelector('#save-btn');
    const textarea = this.querySelector<HTMLTextAreaElement>('#config-textarea');

    if (editBtn) {
      editBtn.addEventListener('click', () => this.startEditing());
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.cancelEditing());
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveConfiguration());
    }
    if (textarea) {
      textarea.addEventListener('input', (e) => this.onConfigChange(e));
    }
  }
}
