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
 */
function SessionRestorer() {
  const dispatch = useDispatch()

  useEffect(() => {
    let active = true
    void restoreSession().then((outcome) => {
      if (!active) return
      if (outcome.ok && outcome.user) dispatch(sessionEstablished(outcome.user))
      else dispatch(clearLocalSession())
    })
    return () => {
      active = false
    }
  }, [dispatch])

  return null
}

export { SessionRestorer }
