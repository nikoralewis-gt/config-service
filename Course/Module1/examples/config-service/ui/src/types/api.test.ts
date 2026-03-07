import { describe, it, expect } from 'vitest';
import type { 
  ApplicationCreate,
  ApplicationResponse,
  ConfigurationUpdate,
  ConfigurationResponse,
  ErrorResponse,
  HealthResponse,
  ApiResponse,
  LoadingState
} from './api';

describe('API Types', () => {
  describe('ApplicationCreate', () => {
    it('should accept valid application creation data', () => {
      const validData: ApplicationCreate = {
        name: 'Test App',
        description: 'Test Description'
      };
      expect(validData.name).toBe('Test App');
      expect(validData.description).toBe('Test Description');
    });

    it('should accept optional description', () => {
      const validData: ApplicationCreate = {
        name: 'Test App'
      };
      expect(validData.name).toBe('Test App');
      expect(validData.description).toBeUndefined();
    });

    it('should accept null description', () => {
      const validData: ApplicationCreate = {
        name: 'Test App',
        description: null
      };
      expect(validData.name).toBe('Test App');
      expect(validData.description).toBeNull();
    });
  });

  describe('ApplicationResponse', () => {
    it('should include id field with ULID format', () => {
      const response: ApplicationResponse = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        name: 'Test App',
        description: 'Test Description'
      };
      
      expect(response.id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
      expect(response.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/); // ULID format
    });

    it('should inherit from ApplicationBase', () => {
      const response: ApplicationResponse = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        name: 'Test App',
        description: null
      };
      
      expect(response.name).toBeTruthy();
      expect(response.description).toBeNull();
    });
  });

  describe('ConfigurationUpdate', () => {
    it('should accept any configuration object', () => {
      const config: ConfigurationUpdate = {
        config: {
          theme: 'dark',
          timeout: 30,
          features: ['feature1', 'feature2'],
          nested: {
            setting: 'value'
          }
        }
      };
      
      expect(config.config.theme).toBe('dark');
      expect(config.config.timeout).toBe(30);
      expect(Array.isArray(config.config.features)).toBe(true);
      expect(config.config.nested.setting).toBe('value');
    });

    it('should accept empty configuration', () => {
      const config: ConfigurationUpdate = {
        config: {}
      };
      
      expect(Object.keys(config.config)).toHaveLength(0);
    });
  });

  describe('ConfigurationResponse', () => {
    it('should include application_id and config', () => {
      const response: ConfigurationResponse = {
        application_id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        config: { theme: 'dark' }
      };
      
      expect(response.application_id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
      expect(response.config.theme).toBe('dark');
    });
  });

  describe('ErrorResponse', () => {
    it('should have detail field', () => {
      const error: ErrorResponse = {
        detail: 'Something went wrong'
      };
      
      expect(error.detail).toBe('Something went wrong');
    });
  });

  describe('HealthResponse', () => {
    it('should have status and version fields', () => {
      const health: HealthResponse = {
        status: 'healthy',
        version: '1.0.0'
      };
      
      expect(health.status).toBe('healthy');
      expect(health.version).toBe('1.0.0');
    });
  });

  describe('ApiResponse', () => {
    it('should handle success response', () => {
      const successResponse: ApiResponse<string> = {
        success: true,
        data: 'test data'
      };
      
      expect(successResponse.success).toBe(true);
      if (successResponse.success) {
        expect(successResponse.data).toBe('test data');
      }
    });

    it('should handle error response', () => {
      const errorResponse: ApiResponse<string> = {
        success: false,
        error: 'Something went wrong'
      };
      
      expect(errorResponse.success).toBe(false);
      if (!errorResponse.success) {
        expect(errorResponse.error).toBe('Something went wrong');
      }
    });

    it('should be type-safe with discriminated union', () => {
      function handleResponse(response: ApiResponse<ApplicationResponse>) {
        if (response.success) {
          // TypeScript should know data exists
          expect(response.data.id).toBeDefined();
          expect(response.data.name).toBeDefined();
        } else {
          // TypeScript should know error exists
          expect(response.error).toBeDefined();
        }
      }

      const successResponse: ApiResponse<ApplicationResponse> = {
        success: true,
        data: { id: '01ARZ3NDEKTSV4RRFFQ69G5FAV', name: 'Test', description: null }
      };

      const errorResponse: ApiResponse<ApplicationResponse> = {
        success: false,
        error: 'Error message'
      };

      handleResponse(successResponse);
      handleResponse(errorResponse);
    });
  });

  describe('LoadingState', () => {
    it('should accept all valid loading states', () => {
      const states: LoadingState[] = ['idle', 'loading', 'success', 'error'];
      
      states.forEach(state => {
        const loadingState: LoadingState = state;
        expect(['idle', 'loading', 'success', 'error']).toContain(loadingState);
      });
    });

    it('should be usable in state management', () => {
      interface ComponentState {
        loading: LoadingState;
        data: any;
      }

      const initialState: ComponentState = {
        loading: 'idle',
        data: null
      };

      const loadingState: ComponentState = {
        loading: 'loading',
        data: null
      };

      const successState: ComponentState = {
        loading: 'success',
        data: { id: '123' }
      };

      const errorState: ComponentState = {
        loading: 'error',
        data: null
      };

      expect(initialState.loading).toBe('idle');
      expect(loadingState.loading).toBe('loading');
      expect(successState.loading).toBe('success');
      expect(errorState.loading).toBe('error');
    });
  });

  describe('Type compatibility', () => {
    it('should ensure ApplicationCreate extends ApplicationBase', () => {
      const base = { name: 'Test', description: 'Desc' };
      const create: ApplicationCreate = base;
      
      expect(create.name).toBe('Test');
      expect(create.description).toBe('Desc');
    });

    it('should ensure ApplicationResponse extends ApplicationBase', () => {
      const response: ApplicationResponse = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        name: 'Test',
        description: 'Desc'
      };
      
      // Should be assignable to ApplicationBase
      const base: { name: string; description?: string | null } = response;
      expect(base.name).toBe('Test');
    });

    it('should handle Record<string, any> properly in configurations', () => {
      const complexConfig: Record<string, any> = {
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
        arrayValue: [1, 2, 3],
        objectValue: { nested: 'value' },
        nullValue: null,
        undefinedValue: undefined
      };

      const configUpdate: ConfigurationUpdate = {
        config: complexConfig
      };

      expect(configUpdate.config.stringValue).toBe('test');
      expect(configUpdate.config.numberValue).toBe(42);
      expect(configUpdate.config.booleanValue).toBe(true);
    });
  });
});