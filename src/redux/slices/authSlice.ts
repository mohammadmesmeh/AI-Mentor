import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

interface AuthState {
  user: { email: string; name: string } | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

function loadAuth(): { user: AuthState["user"]; isAuthenticated: boolean } {
  if (typeof window === "undefined") return { user: null, isAuthenticated: false }
  try {
    const raw = localStorage.getItem("ai-mentor-auth")
    if (raw) {
      const user = JSON.parse(raw)
      return { user, isAuthenticated: true }
    }
  } catch {}
  return { user: null, isAuthenticated: false }
}

const persisted = loadAuth()

const initialState: AuthState = {
  user: persisted.user,
  isAuthenticated: persisted.isAuthenticated,
  isLoading: false,
  error: null,
}

export const login = createAsyncThunk(
  "auth/login",
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    await new Promise((r) => setTimeout(r, 1000))
    const raw = localStorage.getItem("ai-mentor-auth")
    if (!raw) return rejectWithValue("No account found. Please register first.")
    const user = JSON.parse(raw)
    if (user.email !== payload.email) return rejectWithValue("No account found with this email.")
    return user as { email: string; name: string }
  }
)

export const register = createAsyncThunk(
  "auth/register",
  async (payload: { name: string; email: string; password: string }, { rejectWithValue }) => {
    await new Promise((r) => setTimeout(r, 1000))
    const raw = localStorage.getItem("ai-mentor-auth")
    if (raw) {
      const existing = JSON.parse(raw)
      if (existing.email === payload.email) return rejectWithValue("An account with this email already exists.")
    }
    const user = { email: payload.email, name: payload.name }
    localStorage.setItem("ai-mentor-auth", JSON.stringify(user))
    localStorage.removeItem("ai-mentor-onboarding-complete")
    return user
  }
)

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.isAuthenticated = false
      state.error = null
      localStorage.removeItem("ai-mentor-auth")
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { logout, clearError } = authSlice.actions
export type { AuthState }
export default authSlice.reducer
