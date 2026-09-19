import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { User } from "@/lib/api/types"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  error: null,
}

/**
 * Auth session tokens live only in the module-level store in
 * `src/lib/api/auth.ts` (FR-007) — never here, never in localStorage.
 * This slice holds only the non-secret identity data derived from the API.
 */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionEstablished(state, action: PayloadAction<User>) {
      state.user = action.payload
      state.isAuthenticated = true
    },
    clearLocalSession(state) {
      state.user = null
      state.isAuthenticated = false
    },
    clearError(state) {
      state.error = null
    },
  },
})

export const { sessionEstablished, clearLocalSession, clearError } = authSlice.actions
export type { AuthState }
export default authSlice.reducer