/**
 * Config Hub API Client
 * 
 * A lightweight, type-safe client for the Config Hub REST API.
 * Uses native fetch API with zero dependencies.
 */

import type {
  Application,
  ApplicationCreate,
  ApplicationUpdate,
  Configuration,
  ConfigurationCreate,
  ConfigurationUpdate,
  ApiResult
} from './types.js';

export class ConfigServiceClient {
  private baseUrl: string;

  /**
   * Create a new Config Hub API client
   * @param baseUrl - Base URL for the API (default: '/api/v1')
   */
  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  // ==================== Applications ====================

  /**
   * Get all applications
   */
  async getApplications(): Promise<ApiResult<Application[]>> {
    return this.get<Application[]>('/applications');
  }

  /**
   * Get a single application by ID
   * @param id - Application ULID
   */
  async getApplication(id: string): Promise<ApiResult<Application>> {
    return this.get<Application>(`/applications/${id}`);
  }

  /**
   * Create a new application
   * @param data - Application creation data
   */
  async createApplication(data: ApplicationCreate): Promise<ApiResult<Application>> {
    return this.post<Application>('/applications', data);
  }

  /**
   * Update an existing application
   * @param id - Application ULID
   * @param data - Application update data
   */
  async updateApplication(id: string, data: ApplicationUpdate): Promise<ApiResult<Application>> {
    return this.put<Application>(`/applications/${id}`, data);
  }

  /**
   * Delete an application
   * @param id - Application ULID
   */
  async deleteApplication(id: string): Promise<ApiResult<void>> {
    return this.delete(`/applications/${id}`);
  }

  // ==================== Configurations ====================

  /**
   * Get configurations, optionally filtered by application
   * @param applicationId - Optional application ULID to filter by
   */
  async getConfigurations(applicationId?: string): Promise<ApiResult<Configuration[]>> {
    const endpoint = applicationId 
      ? `/configurations?application_id=${applicationId}`
      : '/configurations';
    return this.get<Configuration[]>(endpoint);
  }

  /**
   * Get a single configuration by ID
   * @param id - Configuration ULID
   */
  async getConfiguration(id: string): Promise<ApiResult<Configuration>> {
    return this.get<Configuration>(`/configurations/${id}`);
  }

  /**
   * Create a new configuration
   * @param data - Configuration creation data
   */
  async createConfiguration(data: ConfigurationCreate): Promise<ApiResult<Configuration>> {
    return this.post<Configuration>('/configurations', data);
  }

  /**
   * Update an existing configuration
   * @param id - Configuration ULID
   * @param data - Configuration update data
   */
  async updateConfiguration(id: string, data: ConfigurationUpdate): Promise<ApiResult<Configuration>> {
    return this.put<Configuration>(`/configurations/${id}`, data);
  }

  /**
   * Delete a configuration
   * @param id - Configuration ULID
   */
  async deleteConfiguration(id: string): Promise<ApiResult<void>> {
    return this.delete(`/configurations/${id}`);
  }

  // ==================== Private HTTP Methods ====================

  private async get<T>(endpoint: string): Promise<ApiResult<T>> {
    return this.request<T>('GET', endpoint);
  }

  private async post<T>(endpoint: string, data: unknown): Promise<ApiResult<T>> {
    return this.request<T>('POST', endpoint, data);
  }

  private async put<T>(endpoint: string, data: unknown): Promise<ApiResult<T>> {
    return this.request<T>('PUT', endpoint, data);
  }

  private async delete(endpoint: string): Promise<ApiResult<void>> {
    return this.request<void>('DELETE', endpoint);
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown
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
