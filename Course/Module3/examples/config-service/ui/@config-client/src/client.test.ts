import { describe, it, expect } from 'vitest';
import { server } from '../tests/setup';
import { http, HttpResponse } from 'msw';
import { ConfigClient } from './client';
import type { ApplicationCreate, ConfigurationUpdate } from '@/types';

describe('ConfigClient', () => {
  const client = new ConfigClient();

  describe('Health endpoint', () => {
    it('should get health status successfully', async () => {
      const result = await client.getHealth();
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('healthy');
        expect(result.data.version).toBe('1.0.0');
      }
    });

    it('should handle health endpoint errors', async () => {
      server.use(
        http.get('/api/v1/health', () => {
          return new HttpResponse('Server Error', { status: 500 });
        })
      );

      const result = await client.getHealth();
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }
    });
  });

  describe('Applications endpoints', () => {
    it('should get all applications successfully', async () => {
      const result = await client.getApplications();
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBe(2);
        expect(result.data[0]).toHaveProperty('id');
        expect(result.data[0]).toHaveProperty('name');
      }
    });

    it('should get single application successfully', async () => {
      const result = await client.getApplication('01ARZ3NDEKTSV4RRFFQ69G5FAV');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
        expect(result.data.name).toBe('Test App 1');
      }
    });

    it('should handle application not found', async () => {
      const result = await client.getApplication('non-existent-id');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Application not found');
      }
    });

    it('should create application successfully', async () => {
      const applicationData: ApplicationCreate = {
        name: 'New Test App',
        description: 'A new test application'
      };

      const result = await client.createApplication(applicationData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('New Test App');
        expect(result.data.description).toBe('A new test application');
        expect(result.data.id).toBeTruthy();
      }
    });

    it('should delete application successfully', async () => {
      const result = await client.deleteApplication('01ARZ3NDEKTSV4RRFFQ69G5FAV');
      
      expect(result.success).toBe(true);
      // @ts-ignore this is intentionally undefined
      expect(result.data).toBeUndefined();
    });

    it('should handle delete application not found', async () => {
      const result = await client.deleteApplication('non-existent-id');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Application not found');
      }
    });
  });

  describe('Configuration endpoints', () => {
    it('should get configuration successfully', async () => {
      const result = await client.getConfiguration('01ARZ3NDEKTSV4RRFFQ69G5FAV');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.application_id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
        expect(result.data.config).toEqual({ theme: 'dark', timeout: 30 });
      }
    });

    it('should handle configuration not found', async () => {
      const result = await client.getConfiguration('non-existent-id');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Configuration not found');
      }
    });

    it('should update configuration successfully', async () => {
      const configData: ConfigurationUpdate = {
        config: { theme: 'blue', timeout: 45, newSetting: true }
      };

      const result = await client.updateConfiguration('01ARZ3NDEKTSV4RRFFQ69G5FAV', configData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.application_id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
        expect(result.data.config).toEqual(configData.config);
      }
    });
  });

  describe('Config by name endpoint', () => {
    it('should get configuration by name successfully', async () => {
      const result = await client.getConfigByName('test-app');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.application_id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
        expect(result.data.config).toEqual({ theme: 'dark', timeout: 30 });
      }
    });

    it('should handle config by name not found', async () => {
      const result = await client.getConfigByName('non-existent-app');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Configuration not found');
      }
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      // Mock a network error by overriding the handler
      server.use(
        http.get('/api/v1/health', () => {
          return HttpResponse.error();
        })
      );

      const result = await client.getHealth();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Failed to fetch');
      }
    });

    it('should handle malformed JSON responses', async () => {
      server.use(
        http.get('/api/v1/health', () => {
          return new HttpResponse('invalid json', { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );

      const result = await client.getHealth();
      expect(result.success).toBe(false);
    });

    it('should handle server errors with error details', async () => {
      server.use(
        http.get('/api/v1/applications/error-test', () => {
          return HttpResponse.json(
            { detail: 'Custom server error' },
            { status: 500 }
          );
        })
      );

      const result = await client.getApplication('error-test');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Custom server error');
      }
    });
  });

  describe('Request headers and options', () => {
    it('should send correct Content-Type header', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.post('/api/v1/applications', ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ id: 'test', name: 'test', description: null });
        })
      );

      await client.createApplication({ name: 'Test App' });
      
      expect(capturedHeaders?.get('Content-Type')).toBe('application/json');
    });

    it('should send request body as JSON', async () => {
      let capturedBody: any;

      server.use(
        http.post('/api/v1/applications', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({ id: 'test', name: 'test', description: null });
        })
      );

      const appData = { name: 'Test App', description: 'Test Description' };
      await client.createApplication(appData);
      
      expect(capturedBody).toEqual(appData);
    });
  });

  describe('Client configuration', () => {
    it('should use custom base URL', async () => {
      const customClient = new ConfigClient({ baseUrl: '/custom/api/v1' });
      
      server.use(
        http.get('/custom/api/v1/health', () => {
          return HttpResponse.json({ status: 'healthy', version: '1.0.0' });
        })
      );

      const result = await customClient.getHealth();
      expect(result.success).toBe(true);
    });

    it('should handle timeout', async () => {
      const timeoutClient = new ConfigClient({ timeout: 100 });
      
      server.use(
        http.get('/api/v1/health', async () => {
          // Delay longer than timeout
          await new Promise(resolve => setTimeout(resolve, 200));
          return HttpResponse.json({ status: 'healthy', version: '1.0.0' });
        })
      );

      const result = await timeoutClient.getHealth();
      expect(result.success).toBe(false);
      if (!result.success) {
        // Timeout should result in some kind of error
        expect(result.error).toBeTruthy();
      }
    });
  });
});
