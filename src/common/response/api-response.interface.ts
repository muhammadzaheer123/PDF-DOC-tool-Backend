export interface ApiResponse<T> {
  success: boolean;
  error: string | null;
  sessionExpired?: boolean;
  data: T | null;
}

export function ok<T>(data: T): ApiResponse<T> {
  return { success: true, error: null, data };
}

export function fail<T = null>(error: string, sessionExpired = false): ApiResponse<T> {
  return { success: false, error, sessionExpired, data: null };
}
