import { useCallback, useState } from "react"
import { useRequestRoadmapGenerationMutation } from "@/lib/api/apiSlice"
import { createIdempotencyKey } from "@/lib/api/idempotency"
import { toApiError, type ApiError } from "@/lib/api/errors"

export interface GenerateRoadmapState {
  requestId: string | null
  startError: ApiError | null
  generate: () => Promise<void>
  reset: () => void
}

/**
 * Kicks off roadmap generation via a single POST to the
 * roadmap-generation-requests endpoint with a fresh Idempotency-Key per click
 * (contract §15 / T035: a new key for every new attempt; automatic retries of
 * the same attempt reuse the request that already exists).
 */
export function useGenerateRoadmap(): GenerateRoadmapState {
  const [requestGeneration] = useRequestRoadmapGenerationMutation()
  const [requestId, setRequestId] = useState<string | null>(null)
  const [startError, setStartError] = useState<ApiError | null>(null)

  const generate = useCallback(async () => {
    setStartError(null)
    const idempotencyKey = createIdempotencyKey()
    try {
      const result = await requestGeneration({ idempotencyKey }).unwrap()
      setRequestId(result.id)
    } catch (error) {
      const apiError = toApiError(error)
      // A second device/browser already has a generation in flight
      // (409 roadmap_generation_in_progress). Resume polling that existing
      // request via its generation_request_id instead of erroring out (T038).
      if (apiError.code === "roadmap_generation_in_progress") {
        const details = apiError.details as Record<string, unknown> | undefined
        const existingId =
          (details?.generation_request_id as string | undefined) ??
          (details?.request_id as string | undefined)
        if (existingId) {
          setRequestId(existingId)
          return
        }
      }
      setRequestId(null)
      setStartError(apiError)
    }
  }, [requestGeneration])

  const reset = useCallback(() => {
    setRequestId(null)
    setStartError(null)
  }, [])

  return { requestId, startError, generate, reset }
}