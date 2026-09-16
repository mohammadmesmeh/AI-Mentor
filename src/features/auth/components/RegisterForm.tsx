"use client"

import { useId, useState } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { useDispatch, useSelector } from "react-redux"
import { useTranslations } from "next-intl"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/shared/components/ui/Button"
import { register as registerThunk } from "@/redux/slices/authSlice"
import { registerSchema } from "../validation/registerSchema"
import { FormField } from "./FormField"
import type { PasswordVisibility, RegisterFormValues } from "../types/auth.types"
import type { AppDispatch, RootState } from "@/redux/store"

interface RegisterFormProps {
  onSuccess?: () => void
}

const labelClass = "text-sm font-semibold text-primary"
const passwordToggleClass =
  "absolute end-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

function RegisterForm({ onSuccess }: RegisterFormProps) {
  const t = useTranslations("auth")
  const v = useTranslations("validation")
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading } = useSelector((state: RootState) => state.auth)
  const { error } = useSelector((state: RootState) => state.auth)
  const [passwordVisibility, setPasswordVisibility] = useState<PasswordVisibility>("mask")
  const [confirmPasswordVisibility, setConfirmPasswordVisibility] = useState<PasswordVisibility>("mask")
  const passwordId = useId()
  const passwordErrorId = `${passwordId}-error`
  const confirmPasswordId = useId()
  const confirmPasswordErrorId = `${confirmPasswordId}-error`
  const isPasswordRevealed = passwordVisibility === "reveal"
  const isConfirmPasswordRevealed = confirmPasswordVisibility === "reveal"

  const togglePasswordVisibility = () => {
    setPasswordVisibility((current) => (current === "reveal" ? "mask" : "reveal"))
  }

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisibility((current) => (current === "reveal" ? "mask" : "reveal"))
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: yupResolver(registerSchema(v)),
  })

  const onSubmit = async (data: RegisterFormValues) => {
    const result = await dispatch(registerThunk({ name: data.name, email: data.email, password: data.password }))
    if (registerThunk.fulfilled.match(result)) onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormField label={t("name")} required error={errors.name?.message}>
        <input
          type="text"
          {...register("name")}
          placeholder={t("namePlaceholder")}
          className="input border-border bg-background"
          autoComplete="name"
        />
      </FormField>

      <FormField label={t("email")} required error={errors.email?.message}>
        <input
          type="email"
          {...register("email")}
          placeholder={t("emailPlaceholder")}
          className="input border-border bg-background"
          autoComplete="email"
        />
      </FormField>

      <div className="space-y-2 text-start">
        <label htmlFor={passwordId} className={labelClass}>
          {t("password")}
          <span className="text-danger-500"> *</span>
        </label>
        <div className="relative">
          <input
            id={passwordId}
            type={isPasswordRevealed ? "text" : "password"}
            {...register("password")}
            placeholder={t("passwordPlaceholderShort")}
            className="input border-border bg-background pe-10"
            autoComplete="new-password"
            aria-describedby={errors.password ? passwordErrorId : undefined}
            aria-invalid={errors.password ? true : undefined}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            aria-pressed={isPasswordRevealed}
            aria-label={isPasswordRevealed ? t("hidePassword") : t("showPassword")}
            className={passwordToggleClass}
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

      <div className="space-y-2 text-start">
        <label htmlFor={confirmPasswordId} className={labelClass}>
          {t("confirmPassword")}
          <span className="text-danger-500"> *</span>
        </label>
        <div className="relative">
          <input
            id={confirmPasswordId}
            type={isConfirmPasswordRevealed ? "text" : "password"}
            {...register("confirmPassword")}
            placeholder={t("confirmPasswordPlaceholder")}
            className="input border-border bg-background pe-10"
            autoComplete="new-password"
            aria-describedby={errors.confirmPassword ? confirmPasswordErrorId : undefined}
            aria-invalid={errors.confirmPassword ? true : undefined}
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            aria-pressed={isConfirmPasswordRevealed}
            aria-label={isConfirmPasswordRevealed ? t("hidePassword") : t("showPassword")}
            className={passwordToggleClass}
          >
            {isConfirmPasswordRevealed ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id={confirmPasswordErrorId} className="text-sm text-danger-500">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-danger-500" aria-live="polite">
          {t(`errors.${error}`)}
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
            {t("registering")}
          </span>
        ) : (
          t("register")
        )}
      </Button>
    </form>
  )
}

export { RegisterForm }