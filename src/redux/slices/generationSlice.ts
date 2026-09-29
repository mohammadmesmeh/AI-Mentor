import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { ApiError } from "@/lib/api/errors"
import { clearLocalSession } from "./authSlice"

/**
 * The roadmap-generation request started in this tab. It lives in Redux (not
 * component state) because onboarding starts generation and then navigates to
 * the dashboard, which keeps polling the same request (contract §14/§15).
 *
 * This is a cache of the server's answer — the request id the backend returned
 * — never a client-owned status: the phase always comes from polling.
 */
interface GenerationState {
  /** True while POST /roadmap-generation-requests is in flight (it can take ~20s). */
  requesting: boolean
  requestId: string | null
  startError: ApiError | null
}

const initialState: GenerationState = {
  requesting: false,
  requestId: null,
  startError: null,
}

const generationSlice = createSlice({
  name: "generation",
  initialState,
  reducers: {
    generationRequested(state) {
      state.requesting = true
      state.requestId = null
      state.startError = null
    },
    generationAccepted(state, action: PayloadAction<string>) {
      state.requesting = false
      state.requestId = action.payload
      state.startError = null
    },
    generationRejected(state, action: PayloadAction<ApiError>) {
      state.requesting = false
      state.requestId = null
      state.startError = action.payload
    },
    generationReset() {
      return initialState
    },
  },
  extraReducers: (builder) => {
    // A request belongs to the signed-in learner; never carry it across sessions.
    builder.addCase(clearLocalSession, () => initialState)
  },
})

export const { generationRequested, generationAccepted, generationRejected, generationReset } =
  generationSlice.actions
export type { GenerationState }
export default generationSlice.reducer
