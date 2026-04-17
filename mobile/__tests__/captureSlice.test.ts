/**
 * Unit tests for captureSlice.
 * Pure reducer tests — no React Native runtime needed.
 */
import reducer, {
  setImageUri,
  ocrStart,
  ocrSuccess,
  ocrFailure,
  reset,
} from '../src/store/slices/captureSlice';

const initialState = {
  imageUri: null,
  blocks: [],
  raw_text: '',
  loading: false,
  error: null,
};

describe('captureSlice', () => {
  // ── initial state ──────────────────────────────────────────────────────────

  it('returns the initial state when called with undefined', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  // ── setImageUri ────────────────────────────────────────────────────────────

  it('setImageUri: stores the URI and resets OCR state', () => {
    const dirtyState = {
      imageUri: 'file://old.jpg',
      blocks: [{ text: 'OLD', confidence: 0.9 }],
      raw_text: 'OLD',
      loading: false,
      error: 'previous error',
    };

    const next = reducer(dirtyState, setImageUri('file://new.jpg'));

    expect(next.imageUri).toBe('file://new.jpg');
    expect(next.blocks).toEqual([]);
    expect(next.raw_text).toBe('');
    expect(next.error).toBeNull();
  });

  // ── ocrStart ───────────────────────────────────────────────────────────────

  it('ocrStart: sets loading=true and clears error', () => {
    const state = { ...initialState, error: 'old error' };
    const next = reducer(state, ocrStart());

    expect(next.loading).toBe(true);
    expect(next.error).toBeNull();
  });

  // ── ocrSuccess ─────────────────────────────────────────────────────────────

  it('ocrSuccess: stores blocks and raw_text, clears loading', () => {
    const state = { ...initialState, loading: true };
    const payload = {
      blocks: [{ text: 'NORD008', confidence: 0.97 }],
      raw_text: 'NORD008',
    };

    const next = reducer(state, ocrSuccess(payload));

    expect(next.loading).toBe(false);
    expect(next.blocks).toEqual(payload.blocks);
    expect(next.raw_text).toBe('NORD008');
  });

  it('ocrSuccess: replaces previous blocks entirely', () => {
    const state = {
      ...initialState,
      loading: true,
      blocks: [{ text: 'OLD', confidence: 0.5 }],
      raw_text: 'OLD',
    };
    const payload = { blocks: [{ text: 'NEW', confidence: 0.99 }], raw_text: 'NEW' };

    const next = reducer(state, ocrSuccess(payload));

    expect(next.blocks).toHaveLength(1);
    expect(next.blocks[0].text).toBe('NEW');
  });

  // ── ocrFailure ─────────────────────────────────────────────────────────────

  it('ocrFailure: stores error message, clears loading', () => {
    const state = { ...initialState, loading: true };
    const next = reducer(state, ocrFailure('OCR timed out'));

    expect(next.loading).toBe(false);
    expect(next.error).toBe('OCR timed out');
  });

  // ── reset ──────────────────────────────────────────────────────────────────

  it('reset: returns to initial state', () => {
    const dirty = {
      imageUri: 'file://img.jpg',
      blocks: [{ text: 'X', confidence: 0.8 }],
      raw_text: 'X',
      loading: true,
      error: 'something',
    };

    expect(reducer(dirty, reset())).toEqual(initialState);
  });
});
