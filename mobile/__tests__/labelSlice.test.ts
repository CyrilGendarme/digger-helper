/**
 * Unit tests for labelSlice.
 * Pure reducer tests — no React Native runtime needed.
 */
import reducer, {
  initFromBlocks,
  assignFieldType,
  editFieldText,
  removeField,
  addManualField,
  editManualField,
  removeManualField,
  reset,
} from '../src/store/slices/labelSlice';

const initialState = {
  fields: [],
  manualFields: [],
};

describe('labelSlice', () => {
  // ── initial state ──────────────────────────────────────────────────────────

  it('returns initial state when called with undefined', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  // ── initFromBlocks ─────────────────────────────────────────────────────────

  it('initFromBlocks: creates one field per text, typed as record_ref', () => {
    const next = reducer(initialState, initFromBlocks(['NORD008', 'CAT-42']));

    expect(next.fields).toHaveLength(2);
    expect(next.fields[0]).toEqual({ text: 'NORD008', fieldType: 'record_ref' });
    expect(next.fields[1]).toEqual({ text: 'CAT-42', fieldType: 'record_ref' });
  });

  it('initFromBlocks: clears any previous fields and manualFields', () => {
    const dirty = {
      fields: [{ text: 'OLD', fieldType: 'unknown' as const }],
      manualFields: [{ text: 'MANUAL', fieldType: 'artist_name' as const }],
    };

    const next = reducer(dirty, initFromBlocks(['NEW']));

    expect(next.fields).toHaveLength(1);
    expect(next.fields[0].text).toBe('NEW');
    expect(next.manualFields).toHaveLength(0);
  });

  it('initFromBlocks: empty array produces empty fields', () => {
    const next = reducer(initialState, initFromBlocks([]));
    expect(next.fields).toEqual([]);
  });

  // ── assignFieldType ────────────────────────────────────────────────────────

  it('assignFieldType: changes the type of the targeted field', () => {
    const state = reducer(initialState, initFromBlocks(['NORD008']));
    const next = reducer(state, assignFieldType({ index: 0, fieldType: 'artist_name' }));

    expect(next.fields[0].fieldType).toBe('artist_name');
  });

  it('assignFieldType: out-of-range index is a no-op', () => {
    const state = reducer(initialState, initFromBlocks(['NORD008']));
    const next = reducer(state, assignFieldType({ index: 99, fieldType: 'album_name' }));

    expect(next.fields).toHaveLength(1);
    expect(next.fields[0].fieldType).toBe('record_ref');
  });

  // ── editFieldText ──────────────────────────────────────────────────────────

  it('editFieldText: updates the text of the targeted field', () => {
    const state = reducer(initialState, initFromBlocks(['N0RD0O8']));
    const next = reducer(state, editFieldText({ index: 0, text: 'NORD008' }));

    expect(next.fields[0].text).toBe('NORD008');
  });

  // ── removeField ────────────────────────────────────────────────────────────

  it('removeField: removes the field at the given index', () => {
    const state = reducer(initialState, initFromBlocks(['A', 'B', 'C']));
    const next = reducer(state, removeField(1));

    expect(next.fields).toHaveLength(2);
    expect(next.fields.map((f) => f.text)).toEqual(['A', 'C']);
  });

  // ── addManualField ─────────────────────────────────────────────────────────

  it('addManualField: appends a new field to manualFields', () => {
    const next = reducer(
      initialState,
      addManualField({ text: 'Pink Floyd', fieldType: 'artist_name' }),
    );

    expect(next.manualFields).toHaveLength(1);
    expect(next.manualFields[0]).toEqual({ text: 'Pink Floyd', fieldType: 'artist_name' });
  });

  it('addManualField: does not affect OCR fields', () => {
    const state = reducer(initialState, initFromBlocks(['NORD008']));
    const next = reducer(state, addManualField({ text: 'Extra', fieldType: 'unknown' }));

    expect(next.fields).toHaveLength(1);
    expect(next.manualFields).toHaveLength(1);
  });

  // ── editManualField ────────────────────────────────────────────────────────

  it('editManualField: updates text and type of targeted manual field', () => {
    let state = reducer(
      initialState,
      addManualField({ text: 'Old Text', fieldType: 'unknown' }),
    );
    state = reducer(
      state,
      editManualField({ index: 0, text: 'New Text', fieldType: 'album_name' }),
    );

    expect(state.manualFields[0].text).toBe('New Text');
    expect(state.manualFields[0].fieldType).toBe('album_name');
  });

  // ── removeManualField ──────────────────────────────────────────────────────

  it('removeManualField: removes the field at the given index', () => {
    let state = reducer(
      initialState,
      addManualField({ text: 'A', fieldType: 'unknown' }),
    );
    state = reducer(state, addManualField({ text: 'B', fieldType: 'unknown' }));
    state = reducer(state, removeManualField(0));

    expect(state.manualFields).toHaveLength(1);
    expect(state.manualFields[0].text).toBe('B');
  });

  // ── reset ──────────────────────────────────────────────────────────────────

  it('reset: clears all fields and manualFields', () => {
    let state = reducer(initialState, initFromBlocks(['NORD008']));
    state = reducer(state, addManualField({ text: 'Pink Floyd', fieldType: 'artist_name' }));

    expect(reducer(state, reset())).toEqual(initialState);
  });
});
