import { ConfigApp } from './components/ConfigApp';
import { ConfigDetail } from './components/ConfigDetail';
import { CreateAppForm } from './components/CreateAppForm';

// Re-export the config client for backward compatibility
export { configClient } from './services/config-client';

// Register Web Components
customElements.define('config-app', ConfigApp);
customElements.define('config-detail', ConfigDetail);
customElements.define('create-app-form', CreateAppForm);

console.log('Configuration Manager loaded');
