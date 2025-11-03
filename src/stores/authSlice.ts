import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: number;
  name: string;
  sap_code: string;
  avatar: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  token: string | null;
  user: User | null;
}

// ✅ Load from localStorage on app start
const storedToken = localStorage.getItem("auth_token");
const storedUser = localStorage.getItem("auth_user");

const initialState: AuthState = {
  token: storedToken || null,
  user: storedUser ? JSON.parse(storedUser) : null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // ✅ Set token + user (on login)
    setAuth: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;

      // persist in localStorage
      localStorage.setItem("auth_token", action.payload.token);
      localStorage.setItem("auth_user", JSON.stringify(action.payload.user));
    },

    // ✅ Clear token + user (on logout)
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    },
  },
});

export const { setAuth, logout } = authSlice.actions;
export default authSlice.reducer;
