/**
 * Type definitions for Config Hub API
 */

export interface Application {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  configuration_ids: string[];
}

export interface ApplicationCreate {
  name: string;
  description?: string;
}

export interface ApplicationUpdate {
  name: string;
  description?: string;
}

export interface Configuration {
  id: string;
  application_id: string;
  name: string;
  description?: string;
  settings: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface ConfigurationCreate {
  application_id: string;
  name: string;
  description?: string;
  settings: Record<string, string>;
}

export interface ConfigurationUpdate {
  name?: string;
  description?: string;
  settings?: Record<string, string>;
}

/**
 * Result type for API operations
 * Uses discriminated union for type-safe error handling
 */
export type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; status?: number };
