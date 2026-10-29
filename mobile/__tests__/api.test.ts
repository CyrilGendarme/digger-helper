import { apiRequest, buildApiUrl, getAuthHeaders, setAuthToken } from '../src/services/api';
import { store } from '../src/store';
import { login } from '../src/store/slices/authSlice';

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

  it('logs out and clears the token on 401', async () => {
    store.dispatch(login('tok'));
    setAuthToken('tok');
    mockFetch.mockResolvedValue(response(401, 'expired'));

    await expect(apiRequest('/x', 'Thing')).rejects.toThrow('(401)');
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(getAuthHeaders()).toEqual({});
  });

  it('reports a timeout when the request is aborted', async () => {
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    mockFetch.mockRejectedValue(abort);
    await expect(apiRequest('/x', 'Thing')).rejects.toThrow('Thing timed out');
  });
});
