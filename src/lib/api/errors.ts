export type ApiErrorCategory =
  | "invalid_input"
  | "access_denied"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "unavailable"
  | "unexpected"

export interface ApiError {
  /** Stable server error code, e.g. "validation_failed", "onboarding_incomplete". */
  code: string
  /** Raw server message — never shown to users directly (FR-018). */
  message: string
  details?: Record<string, unknown>
  /** From meta.request_id — retained for support (FR-019). */
  requestId: string
  category: ApiErrorCategory
}

interface ServerErrorEnvelope {
  error?: {
    code?: string
    message?: string
    details?: Record<string, unknown>
  }
  meta?: {
    request_id?: string
  }
}

const GENERIC_MESSAGE = "An unexpected error occurred."

function categoryFromCode(code: string): ApiErrorCategory {
  switch (code) {
    case "validation_failed":
      return "invalid_input"
    case "unauthenticated":
    case "forbidden":
      return "access_denied"
    case "not_found":
    case "user_preferences_not_found":
    case "learning_profile_not_found":
    case "roadmap_generation_request_not_found":
    case "roadmap_not_found":
      return "not_found"
    case "onboarding_incomplete":
    case "roadmap_generation_in_progress":
      return "conflict"
    case "too_many_requests":
      return "rate_limited"
    case "authentication_service_unavailable":
      return "unavailable"
    default:
      return "unexpected"
  }
}

/**
 * Maps a non-JSON/network-level failure (fetch timeout, serialization, abort)
 * to an ApiError with a generic category.
 */
function networkError(status: string, message: string, requestId: string): ApiError {
  return {
    code: status,
    message: message || GENERIC_MESSAGE,
    requestId,
    category: "unexpected",
  }
}

/**
 * Builds an ApiError from the wire error envelope. The envelope is optional —
 * some servers respond with a non-JSON body; fetch errors carry an error string
 * instead. Falls back to a generic error so no failure path can dead-end (FR-023).
 */
export function toApiError(
  body: unknown,
  fallbackMeta?: { headers?: Headers },
  status?: string | number
): ApiError {
  const headers = fallbackMeta?.headers
  const requestId =
    (typeof body === "object" && body !== null && "meta" in body
      ? (body as ServerErrorEnvelope).meta?.request_id
      : undefined) ??
    headers?.get("X-Request-ID") ??
    "unknown-request"

  if (typeof body === "string" || !body) {
    return networkError(
      typeof status === "string" ? status : "FETCH_ERROR",
      typeof body === "string" ? body : "",
      requestId
    )
  }

  const envelope = body as ServerErrorEnvelope
  const code = envelope.error?.code ?? "internal_error"
  return {
    code,
    message: envelope.error?.message ?? GENERIC_MESSAGE,
    details: envelope.error?.details,
    requestId,
    category: categoryFromCode(code),
  }
}

/**
 * Recognized roadmap-generation failure codes → friendly explanation keys.
 * The list is small because the current backend ships only these two values;
 * anything unrecognized falls back to "generationFailedGeneric" (FR-023).
 */
export function generationFailureKey(failureCode: string | null): string {
  switch (failureCode) {
    case "invalid_generated_roadmap":
      return "generationFailedValidation"
    case "roadmap_generation_failed":
      return "generationFailedInternal"
    default:
      return "generationFailedGeneric"
  }
}

/** True when a request with this error is safe to retry by re-running the same request. */
export function isRetryableCategory(category: ApiErrorCategory): boolean {
  return category === "unavailable" || category === "rate_limited" || category === "unexpected"
}