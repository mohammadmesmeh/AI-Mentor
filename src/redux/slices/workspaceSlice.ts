import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { clearLocalSession } from "./authSlice"

/**
 * The roadmap to keep showing when GET /me/active-roadmap no longer returns it:
 * finishing the last required task completes the roadmap and clears its active
 * slot (contract §17, §20), and without a list endpoint (§23) its id would be
 * lost. Shared by every workspace page; a cache of the id the server returned.
 */
interface WorkspaceState {
  pinnedRoadmapId: string | null
}

const initialState: WorkspaceState = { pinnedRoadmapId: null }

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    roadmapPinned(state, action: PayloadAction<string>) {
      state.pinnedRoadmapId = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearLocalSession, () => initialState)
  },
})

export const { roadmapPinned } = workspaceSlice.actions
export type { WorkspaceState }
export default workspaceSlice.reducer
