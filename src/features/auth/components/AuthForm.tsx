"use client"

import { useState } from "react"
import { useDispatch } from "react-redux"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { clearError } from "@/redux/slices/authSlice"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"
import type { AppDispatch } from "@/redux/store"

function AuthForm() {
  const t = useTranslations("auth")
  const dispatch = useDispatch<AppDispatch>()
  const [mode, setMode] = useState<"login" | "register">("login")
  const isLogin = mode === "login"

  const switchMode = () => {
    setMode(isLogin ? "register" : "login")
    dispatch(clearError())
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-8 flex rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => { if (!isLogin) switchMode() }}
          className={cn(
            "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
            isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t("login")}
        </button>
        <button
          type="button"
          onClick={() => { if (isLogin) switchMode() }}
          className={cn(
            "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
            !isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t("register")}
        </button>
      </div>

      {isLogin ? <LoginForm /> : <RegisterForm />}
    </div>
  )
}

export { AuthForm }
