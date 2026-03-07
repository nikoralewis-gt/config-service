// Response types from API calls

export interface ApplicationResponse {
  id: string; // ULID as string
  name: string;
  description?: string | null;
}

export interface ConfigurationResponse {
  application_id: string; // ULID as string
  config: Record<string, any>;
}

export interface HealthResponse {
  status: string;
  version: string;
}

export interface ErrorResponse {
  detail: string;
}

export interface EmptyResponse {}
