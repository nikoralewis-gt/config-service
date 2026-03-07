// Request types for API calls

export interface ApplicationBase {
  name: string;
  description?: string | null;
}

export interface ApplicationCreate extends ApplicationBase {}

export interface ConfigurationUpdate {
  config: Record<string, any>;
}
