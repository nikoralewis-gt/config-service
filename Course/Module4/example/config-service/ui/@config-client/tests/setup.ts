import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock API handlers
const handlers = [
  // Health endpoint
  http.get('/api/v1/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      version: '1.0.0'
    });
  }),

  // Applications endpoints
  http.get('/api/v1/applications', () => {
    return HttpResponse.json([
      {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        name: 'Test App 1',
        description: 'First test application'
      },
      {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FB0',
        name: 'Test App 2',
        description: null
      }
    ]);
  }),

  http.get('/api/v1/applications/:id', ({ params }) => {
    const { id } = params;
    
    if (id === '01ARZ3NDEKTSV4RRFFQ69G5FAV') {
      return HttpResponse.json({
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        name: 'Test App 1',
        description: 'First test application'
      });
    }
    
    // Handle dynamically created app IDs (from createApplication)
    if (id === '01ARZ3NDEKTSV4RRFFQ69G5FC1') {
      return HttpResponse.json({
        id: '01ARZ3NDEKTSV4RRFFQ69G5FC1',
        name: 'Integration Test App',
        description: 'Test application for integration testing'
      });
    }
    
    return HttpResponse.json(
      { detail: 'Application not found' },
      { status: 404 }
    );
  }),

  http.post('/api/v1/applications', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      id: '01ARZ3NDEKTSV4RRFFQ69G5FC1',
      name: body.name,
      description: body.description || null
    });
  }),

  http.delete('/api/v1/applications/:id', ({ params }) => {
    const { id } = params;
    
    if (id === '01ARZ3NDEKTSV4RRFFQ69G5FAV' || id === '01ARZ3NDEKTSV4RRFFQ69G5FC1') {
      return new HttpResponse(null, { status: 204 });
    }
    
    return HttpResponse.json(
      { detail: 'Application not found' },
      { status: 404 }
    );
  }),

  // Configuration endpoints
  http.get('/api/v1/applications/:id/config', ({ params }) => {
    const { id } = params;
    
    if (id === '01ARZ3NDEKTSV4RRFFQ69G5FAV') {
      return HttpResponse.json({
        application_id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        config: { theme: 'dark', timeout: 30 }
      });
    }
    
    return HttpResponse.json(
      { detail: 'Configuration not found' },
      { status: 404 }
    );
  }),

  http.put('/api/v1/applications/:id/config', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as any;
    
    return HttpResponse.json({
      application_id: id,
      config: body.config
    });
  }),

  // Config by name endpoint
  http.get('/api/v1/config/:name', ({ params }) => {
    const { name } = params;
    
    if (name === 'test-app') {
      return HttpResponse.json({
        application_id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        config: { theme: 'dark', timeout: 30 }
      });
    }
    
    return HttpResponse.json(
      { detail: 'Configuration not found' },
      { status: 404 }
    );
  })
];

export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
