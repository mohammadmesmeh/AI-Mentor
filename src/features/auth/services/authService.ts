interface PasswordResetResult {
  status: "not-connected"
}

const authService = {
  requestPasswordReset: async (email: string): Promise<PasswordResetResult> => {
    void email
    return { status: "not-connected" }
  },
}

export { authService }
export type { PasswordResetResult }