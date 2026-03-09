/**
 * Config Hub Client Library
 * 
 * A lightweight, type-safe TypeScript client for the Config Hub REST API.
 * 
 * @example
 * ```typescript
 * import { ConfigServiceClient } from '@config-hub/client';
 * 
 * const client = new ConfigServiceClient('http://localhost:8000/api/v1');
 * 
 * const result = await client.getApplications();
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */

export { ConfigServiceClient } from './client.js';
export type {
  Application,
  ApplicationCreate,
  ApplicationUpdate,
  Configuration,
  ConfigurationCreate,
  ConfigurationUpdate,
  ApiResult
} from './types.js';
