/**
 * API service layer for Config Service
 * 
 * This module re-exports the Config Hub client library for use in the Admin UI.
 */

import { ConfigServiceClient } from '@config-hub/client';

// Create and export a singleton instance
export const api = new ConfigServiceClient('/api/v1');

// Re-export types from the client library for convenience
export type {
  Application,
  ApplicationCreate,
  ApplicationUpdate,
  Configuration,
  ConfigurationCreate,
  ConfigurationUpdate,
  ApiResult
} from '@config-hub/client';
