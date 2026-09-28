import { asApiError } from "@/lib/api/errors"

/**
 * Maps an ApiError to an i18n key under `auth.errors.*` — never the raw server
 * `message` (FR-018). Any unrecognized code falls back to a generic message.
 */
export function authErrorKey(error: unknown, context: "login" | "register"): string | null {
  // unwrap() rejects with the ApiError itself, not `{ data }` — reading
  // `.data` made every failure (even a wrong password) "unexpectedError".
  // Contract §7: invalid credentials are a generic 422 validation_failed.
  switch (asApiError(error).category) {
    case "invalid_input":
      return context === "login" ? "invalidCredentials" : "registrationFailed"
    case "rate_limited":
      return "tooManyRequests"
    case "unavailable":
      return "serviceUnavailable"
    case "access_denied":
      return context === "login" ? "invalidCredentials" : "registrationFailed"
    default:
      return "unexpectedError"
  }
}