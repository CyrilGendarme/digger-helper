import * as SecureStore from 'expo-secure-store';

import { store } from '../store';
import { login, logout, restored } from '../store/slices/authSlice';

const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1';
const REQUEST_TIMEOUT_MS = 60_000;
const TOKEN_STORAGE_KEY = 'auth_token';

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

/** Seconds-since-epoch `exp` claim of a JWT, or null if it can't be read. */
export function tokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const exp = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '='))).exp;
    return typeof exp === 'number' ? exp : null;
  } catch {
    return null;
  }
}

// ── Session: in-memory token + device keychain + Redux auth state ───────────

/** Called after a successful login: remember the token across app launches. */
export async function startSession(token: string): Promise<void> {
  setAuthToken(token);
  store.dispatch(login(token));
  try {
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
  } catch {
    // Persisting is best-effort; the session still works until the app closes.
  }
}

export async function endSession(): Promise<void> {
  setAuthToken(null);
  store.dispatch(logout());
  try {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
  } catch {
    // Nothing else to do — the in-memory session is already cleared.
  }
}

/** At startup: reuse a stored token unless it has expired. */
export async function restoreSession(): Promise<void> {
  let token: string | null = null;
  try {
    token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
  } catch {
    token = null;
  }
  const exp = token ? tokenExpiry(token) : null;
  if (token && exp !== null && exp * 1000 > Date.now()) {
    setAuthToken(token);
    store.dispatch(restored(token));
    return;
  }
  store.dispatch(restored(null));
  if (token) {
    try {
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    } catch {
      // Expired token left behind is harmless — it is re-checked on next launch.
    }
  }
}

/**
 * Authenticated JSON request with a timeout. Throws `${label} failed (status): detail`
 * on non-2xx responses; a 401 also ends the session so the user lands back on the
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
        await endSession();
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
