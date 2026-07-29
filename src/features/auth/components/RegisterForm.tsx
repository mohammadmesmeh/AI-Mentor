"use client"

import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { useDispatch, useSelector } from "react-redux"
import { Button } from "@/shared/components/ui/Button"
import { register as registerThunk } from "@/redux/slices/authSlice"
import { registerSchema } from "../validation/registerSchema"
import { FormField } from "./FormField"
import type { RegisterFormValues } from "../types/auth.types"
import type { AppDispatch, RootState } from "@/redux/store"

interface RegisterFormProps {
  onSuccess?: () => void
}

function RegisterForm({ onSuccess }: RegisterFormProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading } = useSelector((state: RootState) => state.auth)
  const { error } = useSelector((state: RootState) => state.auth)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: yupResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormValues) => {
    const result = await dispatch(registerThunk({ name: data.name, email: data.email, password: data.password }))
    if (registerThunk.fulfilled.match(result)) onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Name" error={errors.name?.message}>
        <input
          type="text"
          {...register("name")}
          placeholder="Your name"
          className="input"
          autoComplete="name"
        />
      </FormField>

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
          placeholder="At least 6 characters"
          className="input"
          autoComplete="new-password"
        />
      </FormField>

      <FormField label="Confirm Password" error={errors.confirmPassword?.message}>
        <input
          type="password"
          {...register("confirmPassword")}
          placeholder="Repeat your password"
          className="input"
          autoComplete="new-password"
        />
      </FormField>

      {error && <p className="text-sm text-danger-500">{error}</p>}

      <Button variant="primary" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Registering...
          </span>
        ) : (
          "Register"
        )}
      </Button>
    </form>
  )
}

export { RegisterForm }
