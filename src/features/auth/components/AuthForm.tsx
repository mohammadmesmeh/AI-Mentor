"use client"

import { useDispatch } from "react-redux"
import { useTranslations } from "next-intl"
import { clearError } from "@/redux/slices/authSlice"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"
import { RecoveryView } from "./recovery/RecoveryView"
import type { AuthViewMode } from "../types/auth.types"
import type { AppDispatch } from "@/redux/store"

// py-1 takes the touch target from 20px to 28px, clearing the 24px minimum.
const linkClass =
  "cursor-pointer rounded-sm py-1 text-sm font-semibold text-secondary-foreground underline-offset-4 hover:text-secondary-foreground/80 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

interface ViewHeader {
  title: string
  description?: string
}

interface AuthFormProps {
  viewMode: AuthViewMode
  onViewModeChange: (mode: AuthViewMode) => void
}

function AuthForm({ viewMode, onViewModeChange }: AuthFormProps) {
  const t = useTranslations("auth")
  const dispatch = useDispatch<AppDispatch>()

  const switchView = (mode: AuthViewMode) => {
    onViewModeChange(mode)
    dispatch(clearError())
  }

  const viewHeaders: Record<AuthViewMode, ViewHeader> = {
    "sign-in": { title: t("signInWorkspace") },
    "create-account": { title: t("register") },
    recovery: { title: t("recoveryTitle"), description: t("recoveryDescription") },
  }

  return (
    <div className="flex h-full flex-col gap-8 text-start">
      <p aria-live="polite" className="sr-only">
        {viewHeaders[viewMode].title}
      </p>

      <header className="text-start">
        <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          {viewHeaders[viewMode].title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("requiredFieldsLead")}{" "}
          <span className="font-bold text-danger-500">(*) </span>
          {t("requiredFieldsEnd")}
        </p>
        {viewHeaders[viewMode].description && (
          <p className="mt-2 text-sm text-muted-foreground">{viewHeaders[viewMode].description}</p>
        )}
      </header>

      <div className="flex-1">
        {viewMode === "sign-in" && <LoginForm onForgotPassword={() => switchView("recovery")} />}
        {viewMode === "create-account" && <RegisterForm />}
        {viewMode === "recovery" && <RecoveryView />}
      </div>

      {viewMode === "sign-in" ? (
        <div className="flex flex-col items-center gap-1 border-t border-border pt-6 text-center text-sm">
          <p className="text-muted-foreground">{t("noEnterpriseCredentials")}</p>
          <button type="button" onClick={() => switchView("create-account")} className={linkClass}>
            {t("applyEarlyAccess")}
           
          </button>
        </div>
      ) : (
        <div className="flex justify-center border-t border-border pt-6 text-center text-sm">
          <button type="button" onClick={() => switchView("sign-in")} className={linkClass}>
            {t("backToSignIn")}
          </button>
        </div>
      )}
    </div>
  )
}

export { AuthForm }