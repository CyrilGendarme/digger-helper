import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DiscogsResult } from '../../types/record';
import { MediaLink } from '../../types/search';

interface RecordState {
  discogsLoading: boolean;
  discogsError: string | null;
  discogsResults: DiscogsResult[];

  mediaLoading: boolean;
  mediaError: string | null;
  mediaLinks: MediaLink[];
}

const initialState: RecordState = {
  discogsLoading: false,
  discogsError: null,
  discogsResults: [],
  mediaLoading: false,
  mediaError: null,
  mediaLinks: [],
};

const recordSlice = createSlice({
  name: 'record',
  initialState,
  reducers: {
    discogsStart(state) {
      state.discogsLoading = true;
      state.discogsError = null;
    },
    discogsSuccess(state, action: PayloadAction<DiscogsResult[]>) {
      state.discogsLoading = false;
      state.discogsResults = action.payload;
    },
    discogsFailure(state, action: PayloadAction<string>) {
      state.discogsLoading = false;
      state.discogsError = action.payload;
    },
    mediaStart(state) {
      state.mediaLoading = true;
      state.mediaError = null;
    },
    mediaSuccess(state, action: PayloadAction<MediaLink[]>) {
      state.mediaLoading = false;
      state.mediaLinks = action.payload;
    },
    mediaFailure(state, action: PayloadAction<string>) {
      state.mediaLoading = false;
      state.mediaError = action.payload;
    },
    reset: () => initialState,
  },
});

export const {
  discogsStart,
  discogsSuccess,
  discogsFailure,
  mediaStart,
  mediaSuccess,
  mediaFailure,
  reset,
} = recordSlice.actions;

export default recordSlice.reducer;

