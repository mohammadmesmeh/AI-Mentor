"use client"

import { useCallback } from "react"
import { useSelector } from "react-redux"
import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { useUpdatePreferencesMutation } from "@/lib/api/apiSlice"
import type { UiLocale } from "@/lib/api/types"
import type { RootState } from "@/redux/store"

/**
 * Switches the interface language. A client-side route change: the Redux store,
 * the in-memory session and the RTK Query cache all survive, so only text and
 * direction change — nothing is refetched and roadmap generation is never
 * involved. When signed in, the choice is also saved as `ui_locale`
 * (PATCH /me/preferences, contract §11). Returns that save, so a caller can
 * report its outcome.
 */
export function useSwitchLocale() {
  const router = useRouter()
  const pathname = usePathname()
  const current = useLocale()
  const authenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const [updatePreferences] = useUpdatePreferencesMutation()

  return useCallback(
    (next: UiLocale): Promise<boolean> => {
      if (next === current) return Promise.resolve(true)
      // Keep the #hash and query out of it: only the locale segment changes.
      router.replace(pathname, { locale: next })
      if (!authenticated) return Promise.resolve(true)
      return updatePreferences({ uiLocale: next })
        .unwrap()
        .then(() => true)
        .catch(() => false)
    },
    [router, pathname, current, authenticated, updatePreferences]
  )
}
