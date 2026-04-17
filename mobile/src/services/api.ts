// Base URL — override via environment variable set in app.config.js / .env
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

let _token: string | null = null;

export function setAuthToken(token: string | null): void {
  _token = token;
}

export function getAuthHeaders(): Record<string, string> {
  return _token ? { Authorization: `Bearer ${_token}` } : {};
}
