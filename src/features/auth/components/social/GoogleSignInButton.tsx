"use client"

import { useEffect, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/shared/components/ui/Button"
import { useTheme } from "@/shared/components/providers/ThemeProvider"
import { useGoogleAuthMutation } from "@/lib/api/apiSlice"
import { googleClientId, loadGoogleIdentity } from "../../lib/googleIdentity"
import { googleAuthErrorKey } from "../../lib/authErrorKey"

function GoogleMark() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84a11 11 0 0 0 9.82 6.06z"
      />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06L5.84 9.9A6.54 6.54 0 0 1 12 5.38z"
      />
    </svg>
  )
}

/** GIS buttons are 200–400px wide. */
const clampWidth = (width: number) => Math.round(Math.min(400, Math.max(200, width)))

type ButtonState = "loading" | "ready" | "unavailable"

/**
 * "Continue with Google" for both sign-in and registration (contract §7,
 * POST /auth/google): the same button in both forms, since the backend
 * creates the account on first use and signs in afterwards.
 *
 * Google's own button (Google Identity Services) supplies the ID token; it is
 * sent once to the backend through `googleAuth` — the same session handling as
 * login — and never kept. On success the auth page routes to onboarding or the
 * dashboard, like after a password sign-in.
 *
 * Without a configured Client ID, or if Google's script can't load, a
 * look-alike button explains that Google sign-in isn't available.
 */
function GoogleSignInButton() {
  const t = useTranslations("auth")
  const locale = useLocale()
  const { theme } = useTheme()
  const [googleAuth, { isLoading }] = useGoogleAuthMutation()
  const [state, setState] = useState<ButtonState>(() => (googleClientId() ? "loading" : "unavailable"))
  const [errorKey, setErrorKey] = useState<string | null>(null)
  /** Without Google, the message appears only once the learner tries the button. */
  const [triedUnavailable, setTriedUnavailable] = useState(false)
  const slotRef = useRef<HTMLDivElement>(null)
  // The latest exchange, so Google's callback never calls a stale mutation.
  const exchangeRef = useRef<(credential: string) => void>(() => {})

  useEffect(() => {
    exchangeRef.current = (credential: string) => {
      setErrorKey(null)
      googleAuth({ idToken: credential })
        .unwrap()
        .catch((error: unknown) => setErrorKey(googleAuthErrorKey(error)))
    }
  }, [googleAuth])

  useEffect(() => {
    const clientId = googleClientId()
    const slot = slotRef.current
    if (!clientId || !slot) return
    let cancelled = false
    let observer: ResizeObserver | undefined

    loadGoogleIdentity()
      .then((gis) => {
        if (cancelled) return
        gis.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) exchangeRef.current(response.credential)
            else setErrorKey("googleFailed")
          },
          ux_mode: "popup",
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
        })
        const render = () => {
          slot.replaceChildren()
          gis.renderButton(slot, {
            type: "standard",
            theme: theme === "dark" ? "filled_black" : "outline",
            size: "large",
            text: "continue_with",
            shape: "pill",
            logo_alignment: "center",
            width: clampWidth(slot.parentElement?.clientWidth ?? 400),
            locale,
          })
        }
        render()
        setState("ready")
        if (typeof ResizeObserver !== "undefined" && slot.parentElement) {
          let lastWidth = slot.parentElement.clientWidth
          observer = new ResizeObserver(([entry]) => {
            const width = entry.contentRect.width
            if (Math.abs(width - lastWidth) < 8) return
            lastWidth = width
            render()
          })
          observer.observe(slot.parentElement)
        }
      })
      .catch(() => {
        if (!cancelled) setState("unavailable")
      })

    return () => {
      cancelled = true
      observer?.disconnect()
    }
  }, [locale, theme])

  const message =
    state === "unavailable" ? (triedUnavailable ? "googleUnavailable" : null) : errorKey ? `errors.${errorKey}` : null

  return (
    <div className="space-y-2">
      <div className="relative flex min-h-11 w-full justify-center">
        {/* Google renders its button here. */}
        <div ref={slotRef} className={state === "ready" ? "flex w-full justify-center" : "hidden"} data-testid="google-button-slot" />
        {state !== "ready" && (
          <Button
            type="button"
            variant="secondary"
            disabled={state === "loading"}
            aria-disabled={state === "unavailable" || undefined}
            onClick={() => setTriedUnavailable(true)}
            className="w-full rounded-full border border-border bg-card py-2.5 text-primary shadow-sm hover:scale-100 hover:bg-muted hover:shadow-sm"
          >
            <GoogleMark />
            {t("signInWithGoogle")}
          </Button>
        )}
        {isLoading && (
          <div
            role="status"
            className="absolute inset-0 flex items-center justify-center gap-2 rounded-full bg-card/90 text-sm font-medium text-primary"
          >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            {t("googleSigningIn")}
          </div>
        )}
      </div>
      {message && (
        <p className="text-sm text-danger-500" aria-live="polite">
          {t(message)}
        </p>
      )}
    </div>
  )
}

export { GoogleSignInButton }
