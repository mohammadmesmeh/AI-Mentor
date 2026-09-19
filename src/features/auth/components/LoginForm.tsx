"use client"

import { useId, useState } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { useTranslations } from "next-intl"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/shared/components/ui/Button"
import { useLoginMutation } from "@/lib/api/apiSlice"
import { loginSchema } from "../validation/loginSchema"
import { FormField } from "./FormField"
import { GoogleSignInButton } from "./social/GoogleSignInButton"
import { authErrorKey } from "../lib/authErrorKey"
import type { LoginFormValues, PasswordVisibility } from "../types/auth.types"

interface LoginFormProps {
  onSuccess?: () => void
  onForgotPassword?: () => void
}

const labelClass = "text-sm font-semibold text-primary"
const forgotLinkClass =
  "cursor-pointer rounded-sm text-sm font-medium text-secondary-foreground underline-offset-4 hover:text-secondary-foreground/80 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

function LoginForm({ onSuccess, onForgotPassword }: LoginFormProps) {
  const t = useTranslations("auth")
  const v = useTranslations("validation")
  const [login, { isLoading }] = useLoginMutation()
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [passwordVisibility, setPasswordVisibility] = useState<PasswordVisibility>("mask")
  const passwordId = useId()
  const passwordErrorId = `${passwordId}-error`
  const rememberId = useId()
  const isPasswordRevealed = passwordVisibility === "reveal"

  const togglePasswordVisibility = () => {
    setPasswordVisibility((current) => (current === "reveal" ? "mask" : "reveal"))
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema(v)),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setErrorKey(null)
    try {
      await login({ email: data.email, password: data.password }).unwrap()
      // Session routing to /onboarding or /dashboard happens in the auth page.
      onSuccess?.()
    } catch (error) {
      setErrorKey(authErrorKey(error, "login"))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormField label={t("workEmail")} required error={errors.email?.message}>
        <input
          type="email"
          {...register("email")}
          placeholder={t("workEmailPlaceholder")}
          className="input border-border bg-background"
          autoComplete="email"
        />
      </FormField>

      <div className="space-y-2 text-start">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={passwordId} className={labelClass}>
            {t("password")}
            <span className="text-danger-500"> *</span>
          </label>
          {onForgotPassword && (
            <button type="button" onClick={onForgotPassword} className={forgotLinkClass}>
              {t("forgotPassword")}
            </button>
          )}
        </div>
        <div className="relative">
          <input
            id={passwordId}
            type={isPasswordRevealed ? "text" : "password"}
            {...register("password")}
            placeholder={t("passwordPlaceholder")}
            className="input border-border bg-background pe-10"
            autoComplete="current-password"
            aria-describedby={errors.password ? passwordErrorId : undefined}
            aria-invalid={errors.password ? true : undefined}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            aria-pressed={isPasswordRevealed}
            aria-label={isPasswordRevealed ? t("hidePassword") : t("showPassword")}
            className="absolute end-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {isPasswordRevealed ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <p id={passwordErrorId} className="text-sm text-danger-500">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <input
          id={rememberId}
          type="checkbox"
          defaultChecked
          className="size-4 cursor-pointer rounded border-input accent-primary"
        />
        <label htmlFor={rememberId} className="text-sm text-muted-foreground">
          {t("rememberDevice")}
        </label>
      </div>

      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border/80" aria-hidden="true" />
        {t("orContinueWith")}
        <span className="h-px flex-1 bg-border/80" aria-hidden="true" />
      </div>

      <GoogleSignInButton />

      {errorKey && (
        <p className="text-sm text-danger-500" aria-live="polite">
          {t(`errors.${errorKey}`)}
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary px-6 py-2.5 text-primary-foreground shadow-none hover:bg-primary/80 hover:scale-100 hover:shadow-none"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t("loggingIn")}
          </span>
        ) : (
          t("continue")
        )}
      </Button>
    </form>
  )
}

export { LoginForm }