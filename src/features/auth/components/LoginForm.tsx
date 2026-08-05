"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { useDispatch, useSelector } from "react-redux"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/shared/components/ui/Button"
import { login } from "@/redux/slices/authSlice"
import { loginSchema } from "../validation/loginSchema"
import { FormField } from "./FormField"
import type { LoginFormValues } from "../types/auth.types"
import type { AppDispatch, RootState } from "@/redux/store"

interface LoginFormProps {
  onSuccess?: () => void
}

function LoginForm({ onSuccess }: LoginFormProps) {
  const t = useTranslations("auth")
  const v = useTranslations("validation")
  const locale = useLocale()
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading } = useSelector((state: RootState) => state.auth)
  const { error } = useSelector((state: RootState) => state.auth)

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema(v)),
  })

  useEffect(() => { trigger() }, [locale, trigger])

  const onSubmit = async (data: LoginFormValues) => {
    const result = await dispatch(login({ email: data.email, password: data.password }))
    if (login.fulfilled.match(result)) onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label={t("email")} error={errors.email?.message}>
        <input
          type="email"
          {...register("email")}
          placeholder={t("emailPlaceholder")}
          className="input"
          autoComplete="email"
        />
      </FormField>

      <FormField label={t("password")} error={errors.password?.message}>
        <input
          type="password"
          {...register("password")}
          placeholder={t("passwordPlaceholder")}
          className="input"
          autoComplete="current-password"
        />
      </FormField>

      {error && <p className="text-sm text-danger-500">{t(`errors.${error}`)}</p>}

      <Button variant="primary" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t("loggingIn")}
          </span>
        ) : (
          t("login")
        )}
      </Button>
    </form>
  )
}

export { LoginForm }
