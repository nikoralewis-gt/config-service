import { describe, it, expect } from 'vitest';
import { ConfigClient } from '@/client';
import { server } from './setup';
import { http, HttpResponse } from 'msw';

describe('ConfigClient Integration Tests', () => {
  const client = new ConfigClient();

  describe('Full application lifecycle', () => {
    it('should create, retrieve, update, and delete an application', async () => {
      // Create application
      const createResult = await client.createApplication({
        name: 'Integration Test App',
        description: 'Test application for integration testing'
      });

      expect(createResult.success).toBe(true);
      if (!createResult.success) return;

      const appId = createResult.data.id;

      // Get the created application
      const getResult = await client.getApplication(appId);
      expect(getResult.success).toBe(true);
      if (getResult.success) {
        expect(getResult.data.name).toBe('Integration Test App');
        expect(getResult.data.description).toBe('Test application for integration testing');
      }

      // Delete the application
      const deleteResult = await client.deleteApplication(appId);
      expect(deleteResult.success).toBe(true);
    });

    it('should handle configuration operations', async () => {
      const appId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

      // Get initial configuration
      const getResult = await client.getConfiguration(appId);
      expect(getResult.success).toBe(true);
      if (getResult.success) {
        expect(getResult.data.application_id).toBe(appId);
        expect(getResult.data.config).toEqual({ theme: 'dark', timeout: 30 });
      }

      // Update configuration
      const updateResult = await client.updateConfiguration(appId, {
        config: { theme: 'light', timeout: 60, newFeature: true }
      });
      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        expect(updateResult.data.config).toEqual({ theme: 'light', timeout: 60, newFeature: true });
      }
    });
  });

  describe('Error scenarios', () => {
    it('should handle cascading failures gracefully', async () => {
      // Simulate server being down
      server.use(
        http.get('/api/v1/applications', () => {
          return HttpResponse.json(
            { detail: 'Service temporarily unavailable' },
            { status: 503 }
          );
        })
      );

      const result = await client.getApplications();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Service temporarily unavailable');
      }
    });

    it('should handle malformed server responses', async () => {
      server.use(
        http.get('/api/v1/applications', () => {
          return new HttpResponse('Not JSON', {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );

      const result = await client.getApplications();
      expect(result.success).toBe(false);
    });

    it('should handle network timeouts', async () => {
      const timeoutClient = new ConfigClient({ timeout: 50 });

      server.use(
        http.get('/api/v1/applications', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json([]);
        })
      );

      const result = await timeoutClient.getApplications();
      expect(result.success).toBe(false);
      if (!result.success) {
        // Timeout should result in some kind of error
        expect(result.error).toBeTruthy();
      }
    });
  });

  describe('Configuration by name endpoint', () => {
    it('should retrieve configuration by application name', async () => {
      const result = await client.getConfigByName('test-app');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.application_id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
        expect(result.data.config).toEqual({ theme: 'dark', timeout: 30 });
      }
    });

    it('should handle non-existent application names', async () => {
      const result = await client.getConfigByName('non-existent-app');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Configuration not found');
      }
    });
  });

  describe('Client configuration options', () => {
    it('should work with custom base URL', async () => {
      const customClient = new ConfigClient({ 
        baseUrl: '/custom/api/v1',
        timeout: 5000
      });

      server.use(
        http.get('/custom/api/v1/applications', () => {
          return HttpResponse.json([
            { id: 'custom-1', name: 'Custom App', description: null }
          ]);
        })
      );

      const result = await customClient.getApplications();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].name).toBe('Custom App');
      }
    });

    it('should handle different timeout values', async () => {
      const fastClient = new ConfigClient({ timeout: 1000 });
      const slowClient = new ConfigClient({ timeout: 10000 });

      // Both should work with normal responses
      const fastResult = await fastClient.getApplications();
      const slowResult = await slowClient.getApplications();

      expect(fastResult.success).toBe(true);
      expect(slowResult.success).toBe(true);
    });
  });
});
