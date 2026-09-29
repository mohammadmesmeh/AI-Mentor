import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { User } from "@/lib/api/types"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  /**
   * True from app load until the cookie session has been checked
   * (SessionRestorer). Screens show loading meanwhile, never the sign-in state.
   */
  restoring: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  restoring: true,
  error: null,
}

/**
 * The access token lives only in the module-level store in
 * `src/lib/api/auth.ts` (FR-007) and the refresh token only in the session
 * route's HttpOnly cookie — never here, never in localStorage.
 * This slice holds only the non-secret identity data derived from the API.
 */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionEstablished(state, action: PayloadAction<User>) {
      state.user = action.payload
      state.isAuthenticated = true
      state.restoring = false
    },
    clearLocalSession(state) {
      state.user = null
      state.isAuthenticated = false
      state.restoring = false
    },
    clearError(state) {
      state.error = null
    },
  },
})

export const { sessionEstablished, clearLocalSession, clearError } = authSlice.actions
export type { AuthState }
export default authSlice.reducer