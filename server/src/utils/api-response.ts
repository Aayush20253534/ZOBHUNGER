export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorOptions {
  code?: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: ApiErrorOptions;
}

export function apiSuccessResponse<T>(message: string, data: T): ApiSuccessResponse<T> {
  return { success: true, message, data };
}

export function apiErrorResponse(message: string, error?: ApiErrorOptions): ApiErrorResponse {
  return {
    success: false,
    message,
    ...(error ? { error } : {}),
  };
}
