import { http, HttpResponse } from 'msw';
import type { 
  ApplicationResponse, 
  ApplicationCreate,
  ConfigurationResponse, 
  ConfigurationUpdate,
  HealthResponse,
  ErrorResponse 
} from '@/types/api';

// Mock data
const mockApplications: ApplicationResponse[] = [
  { id: '01ARZ3NDEKTSV4RRFFQ69G5FAV', name: 'Test App 1', description: 'First test application' },
  { id: '01ARZ3NDEKTSV4RRFFQ69G5FB0', name: 'Test App 2', description: 'Second test application' },
];

const mockConfigurations: Record<string, ConfigurationResponse> = {
  '01ARZ3NDEKTSV4RRFFQ69G5FAV': {
    application_id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    config: { theme: 'dark', timeout: 30 }
  },
  '01ARZ3NDEKTSV4RRFFQ69G5FB0': {
    application_id: '01ARZ3NDEKTSV4RRFFQ69G5FB0',
    config: { theme: 'light', timeout: 60 }
  }
};

export const handlers = [
  // Health check
  http.get('/api/v1/health', () => {
    const response: HealthResponse = { status: 'healthy', version: '1.0.0' };
    return HttpResponse.json(response);
  }),

  // Get all applications
  http.get('/api/v1/applications', () => {
    return HttpResponse.json(mockApplications);
  }),

  // Get single application
  http.get('/api/v1/applications/:id', ({ params }) => {
    const app = mockApplications.find(a => a.id === params.id);
    if (!app) {
      const error: ErrorResponse = { detail: 'Application not found' };
      return new HttpResponse(JSON.stringify(error), { status: 404 });
    }
    return HttpResponse.json(app);
  }),

  // Create application
  http.post('/api/v1/applications', async ({ request }) => {
    const data = await request.json() as ApplicationCreate;
    const newApp: ApplicationResponse = {
      id: '01ARZ3NDEKTSV4RRFFQ69G5FC0',
      name: data.name,
      description: data.description
    };
    mockApplications.push(newApp);
    return HttpResponse.json(newApp, { status: 201 });
  }),

  // Delete application
  http.delete('/api/v1/applications/:id', ({ params }) => {
    const index = mockApplications.findIndex(a => a.id === params.id);
    if (index === -1) {
      const error: ErrorResponse = { detail: 'Application not found' };
      return new HttpResponse(JSON.stringify(error), { status: 404 });
    }
    mockApplications.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Get configuration
  http.get('/api/v1/applications/:id/config', ({ params }) => {
    const config = mockConfigurations[params.id as string];
    if (!config) {
      const error: ErrorResponse = { detail: 'Configuration not found' };
      return new HttpResponse(JSON.stringify(error), { status: 404 });
    }
    return HttpResponse.json(config);
  }),

  // Update configuration
  http.put('/api/v1/applications/:id/config', async ({ params, request }) => {
    const data = await request.json() as ConfigurationUpdate;
    const config: ConfigurationResponse = {
      application_id: params.id as string,
      config: data.config
    };
    mockConfigurations[params.id as string] = config;
    return HttpResponse.json(config);
  }),

  // Network error simulation
  http.get('/api/v1/error', () => {
    return HttpResponse.error();
  }),

  // Server error simulation
  http.get('/api/v1/server-error', () => {
    const error: ErrorResponse = { detail: 'Internal server error' };
    return new HttpResponse(JSON.stringify(error), { status: 500 });
  }),
];