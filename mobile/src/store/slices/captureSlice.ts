import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TextBlock } from '../../types/ocr';

interface CaptureState {
  imageUri: string | null;
  blocks: TextBlock[];
  raw_text: string;
  loading: boolean;
  error: string | null;
}

const initialState: CaptureState = {
  imageUri: null,
  blocks: [],
  raw_text: '',
  loading: false,
  error: null,
};

const captureSlice = createSlice({
  name: 'capture',
  initialState,
  reducers: {
    setImageUri(state, action: PayloadAction<string>) {
      state.imageUri = action.payload;
      state.blocks = [];
      state.raw_text = '';
      state.error = null;
    },
    ocrStart(state) {
      state.loading = true;
      state.error = null;
    },
    ocrSuccess(state, action: PayloadAction<{ blocks: TextBlock[]; raw_text: string }>) {
      state.loading = false;
      state.blocks = action.payload.blocks;
      state.raw_text = action.payload.raw_text;
    },
    ocrFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    reset: () => initialState,
  },
});

export const { setImageUri, ocrStart, ocrSuccess, ocrFailure, reset } = captureSlice.actions;
export default captureSlice.reducer;
