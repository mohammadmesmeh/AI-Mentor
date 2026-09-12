"use client"

import { useId, useState } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { useDispatch, useSelector } from "react-redux"
import { useTranslations } from "next-intl"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/shared/components/ui/Button"
import { login } from "@/redux/slices/authSlice"
import { loginSchema } from "../validation/loginSchema"
import { FormField } from "./FormField"
import { GoogleSignInButton } from "./social/GoogleSignInButton"
import type { LoginFormValues, PasswordVisibility } from "../types/auth.types"
import type { AppDispatch, RootState } from "@/redux/store"

interface LoginFormProps {
  onSuccess?: () => void
  onForgotPassword?: () => void
}

const labelClass = "text-sm font-semibold text-[#12314D]"
const forgotLinkClass =
  "cursor-pointer rounded-sm text-sm font-medium text-sky-600 underline-offset-4 hover:text-sky-700 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-500/40"

function LoginForm({ onSuccess, onForgotPassword }: LoginFormProps) {
  const t = useTranslations("auth")
  const v = useTranslations("validation")
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading } = useSelector((state: RootState) => state.auth)
  const { error } = useSelector((state: RootState) => state.auth)
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
    const result = await dispatch(login({ email: data.email, password: data.password }))
    if (login.fulfilled.match(result)) onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormField label={t("workEmail")} required error={errors.email?.message}>
        <input
          type="email"
          {...register("email")}
          placeholder={t("workEmailPlaceholder")}
          className="input border-[#E2E8F0] bg-[#F8FAFC]"
          autoComplete="email"
        />
      </FormField>

      <div className="space-y-2 text-start">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={passwordId} className={labelClass}>
            {t("password")}
            <span className="text-red-600"> *</span>
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
            className="input border-[#E2E8F0] bg-[#F8FAFC] pe-10"
            autoComplete="current-password"
            aria-describedby={errors.password ? passwordErrorId : undefined}
            aria-invalid={errors.password ? true : undefined}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            aria-pressed={isPasswordRevealed}
            aria-label={isPasswordRevealed ? t("hidePassword") : t("showPassword")}
            className="absolute end-2.5 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-sm text-[#64748B] hover:text-[#12314D] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-500/40"
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
          className="size-4 cursor-pointer rounded border-slate-300 accent-sky-500"
        />
        <label htmlFor={rememberId} className="text-sm text-slate-600">
          {t("rememberDevice")}
        </label>
      </div>

      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        <span className="h-px flex-1 bg-slate-200/80" aria-hidden="true" />
        {t("orContinueWith")}
        <span className="h-px flex-1 bg-slate-200/80" aria-hidden="true" />
      </div>

      <GoogleSignInButton />

      {error && <p className="text-sm text-danger-500">{t(`errors.${error}`)}</p>}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#617D94] px-6 py-2.5 text-white shadow-none hover:bg-[#4E677C] hover:scale-100 hover:shadow-none"
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