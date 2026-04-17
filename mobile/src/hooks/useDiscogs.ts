import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  discogsStart, discogsSuccess, discogsFailure,
  mediaStart, mediaSuccess, mediaFailure,
} from '../store/slices/recordSlice';
import { searchDiscogs } from '../services/discogsApi';
import { searchMedia } from '../services/searchApi';
import { RecordInfo } from '../types/record';

export function useDiscogs() {
  const dispatch = useDispatch<AppDispatch>();
  const { discogsLoading, discogsError, discogsResults, mediaLoading, mediaError, mediaLinks } =
    useSelector((state: RootState) => state.record);

  /**
   * 1. Fetch Discogs results.
   * 2. Build the media query from the first result's artist + title.
   *    Falls back to raw input fields if Discogs returns nothing.
   * 3. Fetch YouTube / SoundCloud with that query.
   */
  const fetchAll = useCallback(
    async (info: RecordInfo) => {
      // ── Step 1: Discogs ──────────────────────────────────────────────────
      dispatch(discogsStart());
      let firstArtist: string | undefined;
      let firstTitle: string | undefined;
      try {
        const res = await searchDiscogs({
          artist: info.artist_name,
          album: info.album_name,
          catno: info.record_ref,
        });
        dispatch(discogsSuccess(res.results));
        firstArtist = res.results[0]?.artist ?? undefined;
        firstTitle  = res.results[0]?.title  ?? undefined;
      } catch (e: unknown) {
        dispatch(discogsFailure(e instanceof Error ? e.message : 'Discogs error'));
      }

      // ── Step 2: build media query ────────────────────────────────────────
      // Prefer Discogs first-result metadata; fall back to raw input.
      const fromDiscogs = [firstArtist, firstTitle].filter(Boolean).join(' ');
      const fromInput   = [info.artist_name, info.album_name].filter(Boolean).join(' ')
        || info.record_ref
        || '';
      const q = fromDiscogs || fromInput;
      if (!q) return;

      // ── Step 3: media search ─────────────────────────────────────────────
      dispatch(mediaStart());
      try {
        const res = await searchMedia(q);
        dispatch(mediaSuccess(res.links));
      } catch (e: unknown) {
        dispatch(mediaFailure(e instanceof Error ? e.message : 'Media search error'));
      }
    },
    [dispatch],
  );

  return {
    discogsLoading, discogsError, discogsResults,
    mediaLoading, mediaError, mediaLinks,
    fetchAll,
  };
}
