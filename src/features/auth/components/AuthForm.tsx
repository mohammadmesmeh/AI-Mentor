"use client"

import { useState } from "react"
import { useDispatch } from "react-redux"
import { useTranslations } from "next-intl"
import { clearError } from "@/redux/slices/authSlice"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"
import { RecoveryView } from "./recovery/RecoveryView"
import type { AuthViewMode } from "../types/auth.types"
import type { AppDispatch } from "@/redux/store"

const linkClass =
  "cursor-pointer rounded-sm text-sm font-semibold text-sky-600 underline-offset-4 hover:text-sky-700 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-500/40"

interface ViewHeader {
  title: string
  description?: string
}

function AuthForm() {
  const t = useTranslations("auth")
  const dispatch = useDispatch<AppDispatch>()
  const [viewMode, setViewMode] = useState<AuthViewMode>("sign-in")

  const switchView = (mode: AuthViewMode) => {
    setViewMode(mode)
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
        <h2 className="text-2xl font-bold tracking-tight text-[#12314D] sm:text-3xl">
          {viewHeaders[viewMode].title}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {t("requiredFieldsLead")}{" "}
          <span className="font-bold text-red-600">(*) </span>
          {t("requiredFieldsEnd")}
        </p>
        {viewHeaders[viewMode].description && (
          <p className="mt-2 text-sm text-slate-500">{viewHeaders[viewMode].description}</p>
        )}
      </header>

      <div className="flex-1">
        {viewMode === "sign-in" && <LoginForm onForgotPassword={() => switchView("recovery")} />}
        {viewMode === "create-account" && <RegisterForm />}
        {viewMode === "recovery" && <RecoveryView />}
      </div>

      {viewMode === "sign-in" ? (
        <div className="flex flex-col items-center gap-1 border-t border-slate-200/80 pt-6 text-center text-sm">
          <p className="text-slate-600">{t("noEnterpriseCredentials")}</p>
          <button type="button" onClick={() => switchView("create-account")} className={linkClass}>
            {t("applyEarlyAccess")}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : (
        <div className="flex justify-center border-t border-slate-200/80 pt-6 text-center text-sm">
          <button type="button" onClick={() => switchView("sign-in")} className={linkClass}>
            {t("backToSignIn")}
          </button>
        </div>
      )}
    </div>
  )
}

export { AuthForm }