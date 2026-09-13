"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/shared/components/ui/Button"
import { authService } from "../../services/authService"
import type { GoogleSignInResult } from "../../services/authService"

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className="h-4 w-4"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84a11 11 0 0 0 9.82 6.06z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06L5.84 9.9A6.54 6.54 0 0 1 12 5.38z"
      />
    </svg>
  )
}

function GoogleSignInButton() {
  const t = useTranslations("auth")
  const [isResolving, setIsResolving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSignIn = async () => {
    setIsResolving(true)
    setMessage(null)
    const result: GoogleSignInResult = await authService.signInWithGoogle()
    setIsResolving(false)
    if (result.status === "not-connected") {
      setMessage(t("googleUnavailable"))
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        disabled={isResolving}
        onClick={handleSignIn}
        className="w-full border border-slate-200 bg-white py-2.5 text-[#12314D] shadow-sm hover:bg-slate-50 hover:scale-100 hover:shadow-sm"
      >
        <GoogleMark />
        {t("signInWithGoogle")}
      </Button>
      {message && <p className="text-sm text-danger-500">{message}</p>}
    </div>
  )
}

export { GoogleSignInButton }