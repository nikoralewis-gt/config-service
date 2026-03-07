/**
 * API service layer for Config Service
 */

import type {
  Application,
  ApplicationCreate,
  ApplicationUpdate,
  Configuration,
  ConfigurationCreate,
  ConfigurationUpdate,
  ApiResult
} from '@/types/api.js';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  // Applications
  async getApplications(): Promise<ApiResult<Application[]>> {
    return this.get<Application[]>('/applications');
  }

  async getApplication(id: string): Promise<ApiResult<Application>> {
    return this.get<Application>(`/applications/${id}`);
  }

  async createApplication(data: ApplicationCreate): Promise<ApiResult<Application>> {
    return this.post<Application>('/applications', data);
  }

  async updateApplication(id: string, data: ApplicationUpdate): Promise<ApiResult<Application>> {
    return this.put<Application>(`/applications/${id}`, data);
  }

  async deleteApplication(id: string): Promise<ApiResult<void>> {
    return this.delete(`/applications/${id}`);
  }

  // Configurations
  async getConfigurations(applicationId?: string): Promise<ApiResult<Configuration[]>> {
    const endpoint = applicationId 
      ? `/configurations?application_id=${applicationId}`
      : '/configurations';
    return this.get<Configuration[]>(endpoint);
  }

  async getConfiguration(id: string): Promise<ApiResult<Configuration>> {
    return this.get<Configuration>(`/configurations/${id}`);
  }

  async createConfiguration(data: ConfigurationCreate): Promise<ApiResult<Configuration>> {
    return this.post<Configuration>('/configurations', data);
  }

  async updateConfiguration(id: string, data: ConfigurationUpdate): Promise<ApiResult<Configuration>> {
    return this.put<Configuration>(`/configurations/${id}`, data);
  }

  async deleteConfiguration(id: string): Promise<ApiResult<void>> {
    return this.delete(`/configurations/${id}`);
  }

  // Generic HTTP methods
  private async get<T>(endpoint: string): Promise<ApiResult<T>> {
    return this.request<T>('GET', endpoint);
  }

  private async post<T>(endpoint: string, data: any): Promise<ApiResult<T>> {
    return this.request<T>('POST', endpoint, data);
  }

  private async put<T>(endpoint: string, data: any): Promise<ApiResult<T>> {
    return this.request<T>('PUT', endpoint, data);
  }

  private async delete(endpoint: string): Promise<ApiResult<void>> {
    return this.request<void>('DELETE', endpoint);
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<ApiResult<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);

      // Handle 204 No Content
      if (response.status === 204) {
        return { success: true, data: undefined as T };
      }

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: responseData.detail || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        };
      }

      return { success: true, data: responseData };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }
}

export const api = new ApiService();
