import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { ocrStart, ocrSuccess, ocrFailure } from '../store/slices/captureSlice';
import { extractTextFromImage } from '../services/ocrApi';

export function useOcr() {
  const dispatch = useDispatch<AppDispatch>();
  const { blocks, raw_text, loading, error } = useSelector(
    (state: RootState) => state.capture,
  );

  const runOcr = useCallback(
    async (imageUri: string) => {
      dispatch(ocrStart());
      try {
        const result = await extractTextFromImage(imageUri);
        dispatch(ocrSuccess(result));
      } catch (e: unknown) {
        dispatch(ocrFailure(e instanceof Error ? e.message : 'Unknown OCR error'));
      }
    },
    [dispatch],
  );

  return { blocks, raw_text, loading, error, runOcr };
}
