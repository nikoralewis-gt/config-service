// TypeScript interfaces matching Pydantic schemas

export interface ApplicationBase {
  name: string;
  description?: string | null;
}

export interface ApplicationCreate extends ApplicationBase {}

export interface ApplicationResponse extends ApplicationBase {
  id: string; // ULID as string
}

export interface EmptyResponse {
}

export interface ConfigurationUpdate {
  config: Record<string, any>;
}

export interface ConfigurationResponse {
  application_id: string; // ULID as string
  config: Record<string, any>;
}

export interface ErrorResponse {
  detail: string;
}

export interface HealthResponse {
  status: string;
  version: string;
}

// API Response types
export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

// Common types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';