import * as SecureStore from 'expo-secure-store';

import {
  apiRequest,
  buildApiUrl,
  getAuthHeaders,
  restoreSession,
  setAuthToken,
  startSession,
  tokenExpiry,
} from '../src/services/api';
import { store } from '../src/store';
import { login } from '../src/store/slices/authSlice';

jest.mock('expo-secure-store', () => {
  const data: Record<string, string> = {};
  return {
    getItemAsync: jest.fn(async (k: string) => data[k] ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => {
      data[k] = v;
    }),
    deleteItemAsync: jest.fn(async (k: string) => {
      delete data[k];
    }),
  };
});

/** Unsigned JWT with the given exp — the client only reads the payload. */
function fakeJwt(exp: number): string {
  const b64 = (o: object) =>
    btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64({ alg: 'HS256' })}.${b64({ sub: 'user', exp })}.sig`;
}
const nowSec = () => Math.floor(Date.now() / 1000);

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function response(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
  setAuthToken(null);
});

describe('apiRequest', () => {
  it('sends the bearer token and returns parsed JSON', async () => {
    setAuthToken('tok');
    mockFetch.mockResolvedValue(response(200, { ok: 1 }));

    await expect(apiRequest('/x', 'Thing')).resolves.toEqual({ ok: 1 });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(buildApiUrl('/x'));
    expect(init.headers).toEqual({ Authorization: 'Bearer tok' });
  });

  it('throws a labelled error with status and detail', async () => {
    mockFetch.mockResolvedValue(response(500, 'boom'));
    await expect(apiRequest('/x', 'Thing')).rejects.toThrow('Thing failed (500): boom');
  });

  it('logs out and clears the stored token on 401', async () => {
    await startSession('tok');
    mockFetch.mockResolvedValue(response(401, 'expired'));

    await expect(apiRequest('/x', 'Thing')).rejects.toThrow('(401)');
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(getAuthHeaders()).toEqual({});
    expect(await SecureStore.getItemAsync('auth_token')).toBeNull();
  });

  it('reports a timeout when the request is aborted', async () => {
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    mockFetch.mockRejectedValue(abort);
    await expect(apiRequest('/x', 'Thing')).rejects.toThrow('Thing timed out');
  });
});

describe('session persistence', () => {
  it('reads exp from a JWT payload', () => {
    expect(tokenExpiry(fakeJwt(1234567890))).toBe(1234567890);
    expect(tokenExpiry('garbage')).toBeNull();
  });

  it('restores a stored, unexpired token', async () => {
    const token = fakeJwt(nowSec() + 3600);
    await SecureStore.setItemAsync('auth_token', token);
    store.dispatch(login('other'));

    await restoreSession();

    const auth = store.getState().auth;
    expect(auth.restored).toBe(true);
    expect(auth.isAuthenticated).toBe(true);
    expect(getAuthHeaders()).toEqual({ Authorization: `Bearer ${token}` });
  });

  it('discards an expired stored token', async () => {
    await SecureStore.setItemAsync('auth_token', fakeJwt(nowSec() - 10));

    await restoreSession();

    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.restored).toBe(true);
    expect(await SecureStore.getItemAsync('auth_token')).toBeNull();
  });

  it('finishes restoring even if the keychain fails', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('locked'));
    await restoreSession();
    expect(store.getState().auth.restored).toBe(true);
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it('startSession stores the token for next launch', async () => {
    await startSession('abc');
    expect(await SecureStore.getItemAsync('auth_token')).toBe('abc');
    expect(store.getState().auth.isAuthenticated).toBe(true);
  });
});
