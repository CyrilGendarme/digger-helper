/**
 * Unit tests for recordSlice.
 * Pure reducer tests — no React Native runtime needed.
 */
import reducer, {
  discogsStart,
  discogsSuccess,
  discogsFailure,
  mediaStart,
  mediaSuccess,
  mediaFailure,
  reset,
} from '../src/store/slices/recordSlice';
import type { DiscogsResult } from '../src/types/record';
import type { MediaLink } from '../src/types/search';

const initialState = {
  discogsLoading: false,
  discogsError: null,
  discogsResults: [],
  mediaLoading: false,
  mediaError: null,
  mediaLinks: [],
};

// ── fixtures ──────────────────────────────────────────────────────────────────

const mockDiscogsResult: DiscogsResult = {
  id: 1,
  title: 'OK Computer',
  artist: 'Radiohead',
  year: '1997',
  label: 'Parlophone',
  catno: 'NODATA01',
  format: 'LP',
  cover_image: undefined,
  resource_url: 'https://www.discogs.com/release/1',
  tracklist: [],
  price_stats: undefined,
};

const mockYouTubeLink: MediaLink = {
  platform: 'youtube',
  title: 'Karma Police',
  url: 'https://www.youtube.com/watch?v=1lyu1KKwC74',
};

const mockBandcampLink: MediaLink = {
  platform: 'bandcamp',
  title: 'OK Computer — Radiohead',
  url: 'https://radiohead.bandcamp.com/album/ok-computer',
  price: '€9.00',
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe('recordSlice', () => {
  it('returns initial state when called with undefined', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  // ── Discogs ─────────────────────────────────────────────────────────────────

  it('discogsStart: sets discogsLoading=true and clears error', () => {
    const state = { ...initialState, discogsError: 'old error' };
    const next = reducer(state, discogsStart());

    expect(next.discogsLoading).toBe(true);
    expect(next.discogsError).toBeNull();
  });

  it('discogsSuccess: stores results and clears loading', () => {
    const state = { ...initialState, discogsLoading: true };
    const next = reducer(state, discogsSuccess([mockDiscogsResult]));

    expect(next.discogsLoading).toBe(false);
    expect(next.discogsResults).toHaveLength(1);
    expect(next.discogsResults[0].title).toBe('OK Computer');
  });

  it('discogsSuccess: replaces previous results', () => {
    const state = { ...initialState, discogsResults: [mockDiscogsResult] };
    const next = reducer(state, discogsSuccess([]));

    expect(next.discogsResults).toHaveLength(0);
  });

  it('discogsFailure: stores error and clears loading', () => {
    const state = { ...initialState, discogsLoading: true };
    const next = reducer(state, discogsFailure('Discogs 503'));

    expect(next.discogsLoading).toBe(false);
    expect(next.discogsError).toBe('Discogs 503');
  });

  // ── Media ────────────────────────────────────────────────────────────────────

  it('mediaStart: sets mediaLoading=true and clears error', () => {
    const state = { ...initialState, mediaError: 'stale error' };
    const next = reducer(state, mediaStart());

    expect(next.mediaLoading).toBe(true);
    expect(next.mediaError).toBeNull();
  });

  it('mediaSuccess: stores links (YouTube + Bandcamp) and clears loading', () => {
    const state = { ...initialState, mediaLoading: true };
    const next = reducer(state, mediaSuccess([mockYouTubeLink, mockBandcampLink]));

    expect(next.mediaLoading).toBe(false);
    expect(next.mediaLinks).toHaveLength(2);
    expect(next.mediaLinks[0].platform).toBe('youtube');
    expect(next.mediaLinks[1].platform).toBe('bandcamp');
  });

  it('mediaSuccess: Bandcamp link preserves price field', () => {
    const state = { ...initialState, mediaLoading: true };
    const next = reducer(state, mediaSuccess([mockBandcampLink]));

    expect(next.mediaLinks[0].price).toBe('€9.00');
  });

  it('mediaSuccess: replaces previous links', () => {
    const state = { ...initialState, mediaLinks: [mockYouTubeLink] };
    const next = reducer(state, mediaSuccess([]));

    expect(next.mediaLinks).toHaveLength(0);
  });

  it('mediaFailure: stores error and clears loading', () => {
    const state = { ...initialState, mediaLoading: true };
    const next = reducer(state, mediaFailure('All media services failed'));

    expect(next.mediaLoading).toBe(false);
    expect(next.mediaError).toBe('All media services failed');
  });

  // ── Discogs and media are independent ─────────────────────────────────────

  it('discogsFailure does not touch media state', () => {
    const state = { ...initialState, mediaLinks: [mockYouTubeLink], mediaLoading: false };
    const next = reducer(state, discogsFailure('error'));

    expect(next.mediaLinks).toHaveLength(1);
    expect(next.mediaLoading).toBe(false);
  });

  it('mediaSuccess does not touch discogs state', () => {
    const state = {
      ...initialState,
      discogsResults: [mockDiscogsResult],
      discogsLoading: false,
    };
    const next = reducer(state, mediaSuccess([mockYouTubeLink]));

    expect(next.discogsResults).toHaveLength(1);
    expect(next.discogsLoading).toBe(false);
  });

  // ── reset ──────────────────────────────────────────────────────────────────

  it('reset: returns to initial state', () => {
    const dirty = {
      discogsLoading: true,
      discogsError: 'err',
      discogsResults: [mockDiscogsResult],
      mediaLoading: true,
      mediaError: 'err',
      mediaLinks: [mockYouTubeLink],
    };

    expect(reducer(dirty, reset())).toEqual(initialState);
  });
});
