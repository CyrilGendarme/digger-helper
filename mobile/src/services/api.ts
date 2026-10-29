import { store } from '../store';
import { logout } from '../store/slices/authSlice';

const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1';
const REQUEST_TIMEOUT_MS = 60_000;

function normalizeApiBaseUrl(rawValue?: string): string {
  const value = (rawValue ?? '').trim();
  const candidate = value || DEFAULT_API_BASE_URL;
  const withoutTrailingSlash = candidate.replace(/\/+$/, '');

  if (/\/api\/v1$/i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}/api/v1`;
}

export const API_BASE_URL = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

let _token: string | null = null;

export function setAuthToken(token: string | null): void {
  _token = token;
}

export function getAuthHeaders(): Record<string, string> {
  return _token ? { Authorization: `Bearer ${_token}` } : {};
}

/**
 * Authenticated JSON request with a timeout. Throws `${label} failed (status): detail`
 * on non-2xx responses; a 401 also logs the user out so they land back on the
 * passcode screen instead of seeing repeated errors with an expired token.
 */
export async function apiRequest<T>(path: string, label: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(buildApiUrl(path), {
      ...init,
      headers: { ...getAuthHeaders(), ...init.headers },
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 401) {
        setAuthToken(null);
        store.dispatch(logout());
      }
      const detail = await response.text();
      throw new Error(`${label} failed (${response.status}): ${detail}`);
    }
    return (await response.json()) as T;
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(`${label} timed out. Check the backend is reachable.`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
