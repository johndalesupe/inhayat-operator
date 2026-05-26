import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { OperatorProfile } from "../types";

type AuthState = {
  token: string | null;
  operator: OperatorProfile | null;
  hydrated: boolean;
};

const initialState: AuthState = {
  token: null,
  operator: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuth(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
      state.hydrated = true;
    },
    setSession(
      state,
      action: PayloadAction<{ token: string; operator: OperatorProfile }>,
    ) {
      state.token = action.payload.token;
      state.operator = action.payload.operator;
      state.hydrated = true;
    },
    setOperator(state, action: PayloadAction<OperatorProfile>) {
      state.operator = action.payload;
    },
    clearSession(state) {
      state.token = null;
      state.operator = null;
      state.hydrated = true;
    },
  },
});

export const { clearSession, hydrateAuth, setOperator, setSession } =
  authSlice.actions;
export default authSlice.reducer;
