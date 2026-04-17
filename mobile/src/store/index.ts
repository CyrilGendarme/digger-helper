import { configureStore } from '@reduxjs/toolkit';
import captureReducer from './slices/captureSlice';
import labelReducer from './slices/labelSlice';
import recordReducer from './slices/recordSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    capture: captureReducer,
    label: labelReducer,
    record: recordReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
