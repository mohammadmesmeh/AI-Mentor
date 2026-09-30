"use client"

import { useEffect } from "react"
import { useStore } from "react-redux"
import { restoreSession } from "@/lib/api/auth"
import { clearLocalSession, sessionEstablished, type AuthState } from "@/redux/slices/authSlice"

/**
 * On app load, restores the session from the session route's HttpOnly cookie
 * (contract §3 rule 4): a fresh access token goes into memory and the user into
 * Redux, so a reload keeps the learner signed in. Until it finishes,
 * `auth.restoring` is true and screens show loading, not sign-in.
 *
 * If the backend is temporarily unreachable the cookie is kept (a later reload
 * can still restore) but this load continues signed out.
 *
 * Once per store — in the app, once per page load. The providers live under the
 * `[locale]` layout, so a language switch remounts this component; the store
 * (and the session in it) survives, and restoring again would only rotate the
 * refresh token for nothing. Keyed on the store rather than a plain module flag:
 * a store created later (a dev hot reload re-evaluates `store.ts`) starts with
 * `restoring: true`, and nothing but a restore would ever clear it.
 */
const restoredStores = new WeakSet<object>()

type AuthRoot = { auth: AuthState }

function SessionRestorer() {
  const store = useStore<AuthRoot>()

  useEffect(() => {
    if (restoredStores.has(store) || !store.getState().auth.restoring) return
    restoredStores.add(store)
    // Always report the outcome: the store outlives this component, and a
    // remount mid-restore must not leave `restoring` stuck on true.
    void restoreSession().then((outcome) => {
      if (outcome.ok && outcome.user) store.dispatch(sessionEstablished(outcome.user))
      else store.dispatch(clearLocalSession())
    })
  }, [store])

  return null
}

export { SessionRestorer }
