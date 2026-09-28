import { configureStore } from "@reduxjs/toolkit"
import authReducer, { clearLocalSession, sessionEstablished } from "@/redux/slices/authSlice"
import generationReducer from "@/redux/slices/generationSlice"
import workspaceReducer from "@/redux/slices/workspaceSlice"
import onboardingReducer from "@/redux/slices/onboardingSlice"
import { apiSlice } from "@/lib/api/apiSlice"
import { setSession } from "@/lib/api/auth"
import type { User } from "@/lib/api/types"

/** A store shaped like the app's. */
export function makeTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      generation: generationReducer,
      workspace: workspaceReducer,
      onboarding: onboardingReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (gdm) => gdm().concat(apiSlice.middleware),
  })
}

export type TestStore = ReturnType<typeof makeTestStore>

export const TEST_LEARNER = { id: "u1", name: "Learner", email: "l@example.com" } as User

/** Signed in: an access token in memory and the user in Redux. */
export function signedInStore() {
  const store = makeTestStore()
  setSession({ tokenType: "Bearer", accessToken: "acc", expiresAt: Date.now() + 900_000 })
  store.dispatch(sessionEstablished(TEST_LEARNER))
  return store
}

/** App load finished and found no session. */
export function signedOutStore() {
  const store = makeTestStore()
  store.dispatch(clearLocalSession())
  return store
}
