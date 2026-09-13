interface GoogleSignInResult {
  status: "not-connected"
}

interface PasswordResetResult {
  status: "not-connected"
}

const authService = {
  signInWithGoogle: async (): Promise<GoogleSignInResult> => ({ status: "not-connected" }),
  requestPasswordReset: async (email: string): Promise<PasswordResetResult> => {
    void email
    return { status: "not-connected" }
  },
}

export { authService }
export type { GoogleSignInResult, PasswordResetResult }