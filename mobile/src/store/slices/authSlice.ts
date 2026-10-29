import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  /** False until the stored session (if any) has been checked at startup. */
  restored: boolean;
  isAuthenticated: boolean;
  token: string | null;
}

const initialState: AuthState = {
  restored: false,
  isAuthenticated: false,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    restored(state, action: PayloadAction<string | null>) {
      state.restored = true;
      state.isAuthenticated = action.payload !== null;
      state.token = action.payload;
    },
    login(state, action: PayloadAction<string>) {
      state.isAuthenticated = true;
      state.token = action.payload;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.token = null;
    },
  },
});

export const { restored, login, logout } = authSlice.actions;
export default authSlice.reducer;
