import type { 
  ApplicationCreate,
  ApplicationResponse,
  ConfigurationUpdate,
  ConfigurationResponse,
  ErrorResponse,
  HealthResponse,
  EmptyResponse,
  ApiResponse 
} from '@/types';

export interface ConfigClientOptions {
  baseUrl?: string;
  timeout?: number;
}

export class ConfigClient {
  private baseUrl: string;
  private timeout: number;

  constructor(options: ConfigClientOptions = {}) {
    this.baseUrl = options.baseUrl || '/api/v1';
    this.timeout = options.timeout || 30000;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        return { success: false, error: error.detail };
      }

      if (response.status === 204) {
        return { success: true, data: undefined as unknown as T };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      if (error instanceof Error) {
        // Handle different types of errors
        if (error.name === 'AbortError' || error.message.includes('aborted')) {
          return { 
            success: false, 
            error: `Request aborted: ${error.message}`
          };
        }
        return { 
          success: false, 
          error: error.message
        };
      }
      return { 
        success: false, 
        error: 'Network error' 
      };
    }
  }

  // Health check
  async getHealth(): Promise<ApiResponse<HealthResponse>> {
    return this.request<HealthResponse>('/health');
  }

  // Applications
  async getApplications(): Promise<ApiResponse<ApplicationResponse[]>> {
    return this.request<ApplicationResponse[]>('/applications');
  }

  async getApplication(id: string): Promise<ApiResponse<ApplicationResponse>> {
    return this.request<ApplicationResponse>(`/applications/${id}`);
  }

  async createApplication(data: ApplicationCreate): Promise<ApiResponse<ApplicationResponse>> {
    return this.request<ApplicationResponse>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteApplication(id: string): Promise<ApiResponse<EmptyResponse>> {
    return this.request<EmptyResponse>(`/applications/${id}`, {
      method: 'DELETE',
    });
  }

  // Configurations
  async getConfiguration(applicationId: string): Promise<ApiResponse<ConfigurationResponse>> {
    return this.request<ConfigurationResponse>(`/applications/${applicationId}/config`);
  }

  async updateConfiguration(
    applicationId: string, 
    data: ConfigurationUpdate
  ): Promise<ApiResponse<ConfigurationResponse>> {
    return this.request<ConfigurationResponse>(`/applications/${applicationId}/config`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // New method: Get configuration by application name
  async getConfigByName(appName: string): Promise<ApiResponse<ConfigurationResponse>> {
    return this.request<ConfigurationResponse>(`/config/${appName}`);
  }
}
