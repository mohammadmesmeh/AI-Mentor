import { useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { ThunkAction, UnknownAction } from "@reduxjs/toolkit"
import { apiSlice } from "@/lib/api/apiSlice"
import type { AppDispatch } from "@/redux/store"
import { createIdempotencyKey } from "@/lib/api/idempotency"
import { asApiError, type ApiError } from "@/lib/api/errors"
import {
  generationAccepted,
  generationRejected,
  generationRequested,
  generationReset,
  type GenerationState,
} from "@/redux/slices/generationSlice"

export interface GenerateRoadmapState {
  /** True while the POST is in flight — the UI shows "generating" and blocks a second click. */
  requesting: boolean
  requestId: string | null
  startError: ApiError | null
  generate: () => Promise<void>
  reset: () => void
}

type GenerationRoot = { generation: GenerationState }

/** The id of the request already running, from a 409 roadmap_generation_in_progress (contract §14). */
export function inProgressRequestId(error: ApiError): string | null {
  if (error.code !== "roadmap_generation_in_progress") return null
  const details = error.details as Record<string, unknown> | undefined
  const id = details?.generation_request_id ?? details?.generationRequestId
  return typeof id === "string" && id ? id : null
}

/**
 * One POST /roadmap-generation-requests with a fresh Idempotency-Key per user
 * action (contract §14). Mutations never auto-retry. A 409
 * roadmap_generation_in_progress resumes polling the request that is already
 * running instead of reporting a failure.
 *
 * A thunk, not component state, so it survives navigation: onboarding starts
 * it and the dashboard polls the result.
 */
export function startRoadmapGeneration(): ThunkAction<
  Promise<void>,
  GenerationRoot,
  unknown,
  UnknownAction
> {
  return async (dispatch, getState) => {
    if (getState().generation.requesting) return
    // Set before any await, so a second click can't start a second request.
    dispatch(generationRequested())
    // Never POST while an active roadmap exists: the backend accepts a new
    // request and creates a second roadmap (docs/backend-issues.md #2). Always
    // ask the server, not the cache — whatever triggered this call.
    try {
      const active = await dispatch(
        apiSlice.endpoints.getActiveRoadmap.initiate(undefined, { forceRefetch: true, subscribe: false })
      ).unwrap()
      if (active) {
        dispatch(generationReset())
        return
      }
    } catch (error) {
      // Couldn't tell: don't risk a second roadmap — report it, the learner can retry.
      dispatch(generationRejected(asApiError(error)))
      return
    }
    const idempotencyKey = createIdempotencyKey()
    try {
      const result = await dispatch(
        apiSlice.endpoints.requestRoadmapGeneration.initiate({ idempotencyKey })
      ).unwrap()
      dispatch(generationAccepted(result.id))
    } catch (error) {
      const apiError = asApiError(error)
      const existingId = inProgressRequestId(apiError)
      dispatch(existingId ? generationAccepted(existingId) : generationRejected(apiError))
    }
  }
}

export function useGenerateRoadmap(): GenerateRoadmapState {
  const dispatch = useDispatch<AppDispatch>()
  const { requesting, requestId, startError } = useSelector((state: GenerationRoot) => state.generation)

  const generate = useCallback(async () => {
    await dispatch(startRoadmapGeneration())
  }, [dispatch])

  const reset = useCallback(() => {
    dispatch(generationReset())
  }, [dispatch])

  return { requesting, requestId, startError, generate, reset }
}
