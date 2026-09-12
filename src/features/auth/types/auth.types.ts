interface LoginFormValues {
  email: string
  password: string
}

interface RegisterFormValues {
  name: string
  email: string
  password: string
  confirmPassword: string
}

type AuthViewMode = "sign-in" | "create-account" | "recovery"

type PasswordVisibility = "mask" | "reveal"

export type { AuthViewMode, LoginFormValues, PasswordVisibility, RegisterFormValues }
