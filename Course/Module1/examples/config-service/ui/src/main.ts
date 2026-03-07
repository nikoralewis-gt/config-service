import { ConfigApp } from './components/ConfigApp.js';
import { ConfigDetail } from './components/ConfigDetail.js';
import { CreateAppForm } from './components/CreateAppForm.js';

// Register Web Components
customElements.define('config-app', ConfigApp);
customElements.define('config-detail', ConfigDetail);
customElements.define('create-app-form', CreateAppForm);

console.log('Configuration Manager loaded');