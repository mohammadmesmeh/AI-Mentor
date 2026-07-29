"use client"

import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { useDispatch, useSelector } from "react-redux"
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
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading } = useSelector((state: RootState) => state.auth)
  const { error } = useSelector((state: RootState) => state.auth)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    const result = await dispatch(login({ email: data.email, password: data.password }))
    if (login.fulfilled.match(result)) onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Email" error={errors.email?.message}>
        <input
          type="email"
          {...register("email")}
          placeholder="you@example.com"
          className="input"
          autoComplete="email"
        />
      </FormField>

      <FormField label="Password" error={errors.password?.message}>
        <input
          type="password"
          {...register("password")}
          placeholder="Your password"
          className="input"
          autoComplete="current-password"
        />
      </FormField>

      {error && <p className="text-sm text-danger-500">{error}</p>}

      <Button variant="primary" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Logging in...
          </span>
        ) : (
          "Login"
        )}
      </Button>
    </form>
  )
}

export { LoginForm }
