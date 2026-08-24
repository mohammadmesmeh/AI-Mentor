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

export type { LoginFormValues, RegisterFormValues }
