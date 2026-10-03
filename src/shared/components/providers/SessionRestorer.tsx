"use client"

import { useEffect } from "react"
import { useStore } from "react-redux"
import { restoreSession } from "@/lib/api/auth"
import {
  clearLocalSession,
  sessionEstablished,
  sessionRestoreStarted,
  sessionUnavailable,
  type AuthState,
} from "@/redux/slices/authSlice"

/**
 * On app load, restores the session from the session route's HttpOnly cookie
 * (contract §3 rule 4): a fresh access token goes into memory and the user into
 * Redux, so a reload keeps the learner signed in. Until it finishes,
 * `auth.restoring` is true and screens show loading, not sign-in.
 *
 * Only a credential failure (no cookie, or a 401/422 refresh) signs out. A
 * temporary one — the backend waking up, a rate limit, the network — is retried
 * a few times while still loading, and if it keeps failing the store is marked
 * `unavailable`: the cookie is kept and screens offer a retry, not sign-in.
 *
 * Once per store — in the app, once per page load. The providers live under the
 * `[locale]` layout, so a language switch remounts this component; the store
 * (and the session in it) survives, and restoring again would only rotate the
 * refresh token for nothing. Keyed on the store rather than a plain module flag:
 * a store created later (a dev hot reload re-evaluates `store.ts`) starts with
 * `restoring: true`, and nothing but a restore would ever clear it.
 */
const restoredStores = new WeakSet<object>()

/** Waits before each retry of a temporary failure (the first attempt runs at once). */
const RETRY_DELAYS_MS = [2000, 5000]
/**
 * A rate-limited refresh (429) is different: the backend allows 10 refreshes
 * per minute per IP (contract §25), and retrying on our own schedule would only
 * add to the count. Wait for its Retry-After and try once more — the last
 * attempt either way.
 */

type AuthRoot = { auth: AuthState }
type AuthStore = ReturnType<typeof useStore<AuthRoot>>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Checks the cookie session and always reports the outcome: the store outlives
 * any component, and a remount mid-restore must not leave `restoring` stuck.
 */
async function runRestore(store: AuthStore): Promise<void> {
  let lastAttempt = false
  for (let attempt = 0; ; attempt += 1) {
    const outcome = await restoreSession()
    if (outcome.ok && outcome.user) {
      store.dispatch(sessionEstablished(outcome.user))
      return
    }
    if (outcome.signOut || (outcome.ok && !outcome.user)) {
      store.dispatch(clearLocalSession())
      return
    }
    // Still temporary: the cookie is kept and screens show loading meanwhile.
    if (lastAttempt || (outcome.retryAfterMs === undefined && attempt >= RETRY_DELAYS_MS.length)) {
      store.dispatch(sessionUnavailable())
      return
    }
    if (outcome.retryAfterMs !== undefined) {
      lastAttempt = true
      await wait(outcome.retryAfterMs)
    } else {
      await wait(RETRY_DELAYS_MS[attempt])
    }
  }
}

/** For the "couldn't reach the server" screen: check the cookie session again. */
function retrySessionRestore(store: AuthStore): void {
  if (store.getState().auth.restoring) return
  store.dispatch(sessionRestoreStarted())
  void runRestore(store)
}

function SessionRestorer() {
  const store = useStore<AuthRoot>()

  useEffect(() => {
    if (restoredStores.has(store) || !store.getState().auth.restoring) return
    restoredStores.add(store)
    void runRestore(store)
  }, [store])

  return null
}

export { SessionRestorer, retrySessionRestore }
