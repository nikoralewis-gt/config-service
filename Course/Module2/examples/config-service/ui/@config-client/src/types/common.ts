// Common types used across the API
export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
