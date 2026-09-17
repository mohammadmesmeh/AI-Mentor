import type { ApiError } from "@/lib/api/errors"

/**
 * Maps an ApiError to an i18n key under `auth.errors.*` — never the raw server
 * `message` (FR-018). Any unrecognized code falls back to a generic message.
 */
export function authErrorKey(error: unknown, context: "login" | "register"): string | null {
  if (!error || typeof error !== "object" || !("data" in error)) {
    return "unexpectedError"
  }
  const payload = (error as { data: unknown }).data as Partial<ApiError>
  if (!payload.category) {
    return "unexpectedError"
  }
  switch (payload.category) {
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