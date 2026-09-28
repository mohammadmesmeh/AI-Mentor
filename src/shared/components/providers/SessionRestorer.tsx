"use client"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { restoreSession } from "@/lib/api/auth"
import { clearLocalSession, sessionEstablished } from "@/redux/slices/authSlice"

/**
 * On app load, restores the session from the session route's HttpOnly cookie
 * (contract §3 rule 4): a fresh access token goes into memory and the user into
 * Redux, so a reload keeps the learner signed in. Until it finishes,
 * `auth.restoring` is true and screens show loading, not sign-in.
 *
 * If the backend is temporarily unreachable the cookie is kept (a later reload
 * can still restore) but this load continues signed out.
 *
 * Once per page load. The providers live under the `[locale]` layout, so a
 * language switch remounts this component; the store (and the session in it)
 * survives, and restoring again would only rotate the refresh token for nothing.
 */
let restoreStarted = false

/** Tests only: allow a fresh "page load". */
export function resetSessionRestorerForTests() {
  restoreStarted = false
}

function SessionRestorer() {
  const dispatch = useDispatch()

  useEffect(() => {
    if (restoreStarted) return
    restoreStarted = true
    // Always report the outcome: the store outlives this component, and a
    // remount mid-restore must not leave `restoring` stuck on true.
    void restoreSession().then((outcome) => {
      if (outcome.ok && outcome.user) dispatch(sessionEstablished(outcome.user))
      else dispatch(clearLocalSession())
    })
  }, [dispatch])

  return null
}

export { SessionRestorer }
