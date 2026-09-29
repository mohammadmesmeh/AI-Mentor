import { createApi, type BaseQueryFn, type FetchArgs } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth, endSession, setSession, clearSession, getSession, storeRefreshToken } from "./auth"
import { isRetryableCategory, type ApiError } from "./errors"
import type {
  LearningMethod,
  LearningProfile,
  OnboardingStatus,
  Preferences,
  ResourceLanguage,
  Roadmap,
  RoadmapGenerationRequest,
  SelfAssessedLevel,
  Session,
  TaskDetail,
  UiLocale,
  User,
} from "./types"
import { clearLocalSession, sessionEstablished } from "@/redux/slices/authSlice"

export interface AuthResponseInput {
  user?: User
  session?: Session
}

export interface LoginArg {
  email: string
  password: string
}

export interface RegisterArg {
  name: string
  email: string
  password: string
  passwordConfirmation: string
}

export interface PreferencesPatch {
  uiLocale?: UiLocale
  resourceLanguage?: ResourceLanguage
  timezone?: string
}

export interface LearningProfileInput {
  goal: string
  selfAssessedLevel: SelfAssessedLevel
  desiredOutcome: string
  availableMinutesPerWeek: number
  preferredLearningMethods: LearningMethod[]
}

export interface RoadmapGenerationArg {
  idempotencyKey: string
}

/** What login/register resolve with. No token ever enters Redux (FR-007). */
export interface AuthData {
  user: User
}

function isReadRequest(args: unknown): boolean {
  if (typeof args === "string") {
    return true
  }
  if (args && typeof args === "object" && !("url" in args)) {
    // queryFn passes a URL string; mutations always pass FetchArgs objects.
    return false
  }
  const fetchArgs = args as { method?: string }
  return !fetchArgs.method || fetchArgs.method === "GET"
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Bounded retry for read-only requests only (FR-021). Mutations never
 * auto-retry: an idempotency key cannot make a duplicate-safe write out of a
 * retry, so a failed mutation is surfaced to the caller instead.
 */
const apiBaseQuery: BaseQueryFn<string | FetchArgs, unknown, ApiError> = async (args, api, extraOptions) => {
  let result = await baseQueryWithReauth(args, api, extraOptions)
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const error = result.error
    if (!error || !isReadRequest(args) || !isRetryableCategory(error.category)) {
      break
    }
    await delay(250 * attempt)
    result = await baseQueryWithReauth(args, api, extraOptions)
  }
  return result
}

interface WireAuthResponse {
  tokenType?: string
  accessToken?: string
  expiresIn?: number
  refreshToken?: string
  refreshExpiresIn?: number
  user?: User
}

/**
 * Login/register go from the browser to the backend (so its per-IP limits see
 * the learner's own IP). The access token is kept in memory; the refresh token
 * is handed straight to the session route, which stores it in an HttpOnly
 * cookie so a reload can restore the session (contract §3 rule 4). Neither token
 * is returned into the Redux cache.
 */
const establishSession = async (
  args: FetchArgs,
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2]
): Promise<{ data: AuthData } | { error: ApiError }> => {
  const result = await baseQueryWithReauth(args, api, extraOptions)
  if (result.error) return { error: result.error }
  const data = result.data as WireAuthResponse
  const session: Session = {
    tokenType: data.tokenType ?? "Bearer",
    accessToken: data.accessToken ?? "",
    expiresAt: Date.now() + (data.expiresIn ?? 0) * 1000,
  }
  setSession(session)
  // If the cookie can't be stored, this tab still works; only a reload would
  // sign the learner out.
  if (data.refreshToken) await storeRefreshToken(data.refreshToken, data.refreshExpiresIn)
  const user = data.user ?? ({} as User)
  api.dispatch(sessionEstablished(user))
  return { data: { user } }
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: apiBaseQuery,
  tagTypes: ["Me", "Preferences", "LearningProfile", "OnboardingStatus", "Roadmap", "ActiveRoadmap", "Task"],
  endpoints: (build) => ({
    register: build.mutation<AuthData, RegisterArg>({
      queryFn: (body, api, extraOptions) =>
        establishSession(
          {
            url: "/auth/register",
            method: "POST",
            body: {
              name: body.name,
              email: body.email,
              password: body.password,
              password_confirmation: body.passwordConfirmation,
            },
          },
          api,
          extraOptions
        ),
    }),

    login: build.mutation<AuthData, LoginArg>({
      queryFn: (body, api, extraOptions) =>
        establishSession({ url: "/auth/login", method: "POST", body }, api, extraOptions),
    }),

    logout: build.mutation<null, void>({
      queryFn: async (_arg, api) => {
        // The bearer is captured before the local session is cleared: the
        // backend needs it (plus the cookie's refresh token) to revoke the
        // session (contract §9).
        const current = getSession()
        // FR-006 / contract §3 rule 7: local sign-out never waits on the network.
        clearSession()
        api.dispatch(clearLocalSession())
        // The route revokes on the backend and clears the cookie even if that fails.
        await endSession(current)
        // RTK Query needs a defined `data`, hence null.
        return { data: null }
      },
      // Drop every cached server response once the call has settled —
      // resetting inside queryFn would abort this very mutation.
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        await queryFulfilled.catch(() => undefined)
        dispatch(apiSlice.util.resetApiState())
      },
    }),

    getMe: build.query<User, void>({
      query: () => "/me",
      providesTags: ["Me"],
      transformResponse: (data: unknown) => data as User,
    }),

    getPreferences: build.query<Preferences | null, void>({
      queryFn: async (arg, api, extraOptions) => {
        const result = await apiBaseQuery("/me/preferences", api, extraOptions)
        if (!result.error) {
          return { data: result.data as Preferences }
        }
        if (result.error.code === "user_preferences_not_found") {
          return { data: null }
        }
        return { error: result.error }
      },
      providesTags: ["Preferences"],
    }),

    updatePreferences: build.mutation<Preferences, PreferencesPatch>({
      query: (patch) => ({
        url: "/me/preferences",
        method: "PATCH",
        body: {
          ui_locale: patch.uiLocale,
          resource_language: patch.resourceLanguage,
          timezone: patch.timezone,
        },
      }),
      transformResponse: (data: unknown) => data as Preferences,
      invalidatesTags: ["Preferences", "OnboardingStatus"],
    }),

    getLearningProfile: build.query<LearningProfile | null, void>({
      queryFn: async (arg, api, extraOptions) => {
        const result = await apiBaseQuery("/me/learning-profile", api, extraOptions)
        if (!result.error) {
          return { data: result.data as LearningProfile }
        }
        if (result.error.code === "learning_profile_not_found") {
          return { data: null }
        }
        return { error: result.error }
      },
      providesTags: ["LearningProfile"],
    }),

    putLearningProfile: build.mutation<LearningProfile, LearningProfileInput>({
      query: (input) => ({
        url: "/me/learning-profile",
        method: "PUT",
        body: {
          goal: input.goal,
          self_assessed_level: input.selfAssessedLevel,
          desired_outcome: input.desiredOutcome,
          available_minutes_per_week: input.availableMinutesPerWeek,
          preferred_learning_methods: input.preferredLearningMethods,
        },
      }),
      transformResponse: (data: unknown) => data as LearningProfile,
      invalidatesTags: ["LearningProfile", "OnboardingStatus"],
    }),

    getOnboardingStatus: build.query<OnboardingStatus, void>({
      query: () => "/me/onboarding-status",
      providesTags: ["OnboardingStatus"],
      transformResponse: (data: unknown) => data as OnboardingStatus,
    }),

    requestRoadmapGeneration: build.mutation<RoadmapGenerationRequest, RoadmapGenerationArg>({
      query: ({ idempotencyKey }) => ({
        url: "/roadmap-generation-requests",
        method: "POST",
        body: {},
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      transformResponse: (data: unknown) => data as RoadmapGenerationRequest,
    }),

    getGenerationStatus: build.query<RoadmapGenerationRequest, string>({
      query: (id) => `/roadmap-generation-requests/${id}`,
      transformResponse: (data: unknown) => data as RoadmapGenerationRequest,
    }),

    getRoadmap: build.query<Roadmap, string>({
      query: (id) => `/roadmaps/${id}`,
      providesTags: ["Roadmap"],
      transformResponse: (data: unknown) => data as Roadmap,
    }),

    /**
     * The learner's roadmap that owns the active slot (contract §17). "No active
     * roadmap" (404 active_roadmap_not_found) is a valid empty state, not a
     * failure — including after a roadmap is completed, which clears the slot.
     */
    getActiveRoadmap: build.query<Roadmap | null, void>({
      queryFn: async (arg, api, extraOptions) => {
        const result = await apiBaseQuery("/me/active-roadmap", api, extraOptions)
        if (!result.error) {
          return { data: result.data as Roadmap }
        }
        if (result.error.code === "active_roadmap_not_found") {
          return { data: null }
        }
        return { error: result.error }
      },
      providesTags: ["ActiveRoadmap"],
    }),

    /**
     * Makes a ready/active roadmap the active one (contract §18). Idempotent on
     * the server; 409 roadmap_activation_conflict for other states. No UI uses
     * it yet.
     */
    activateRoadmap: build.mutation<Roadmap, string>({
      query: (id) => ({ url: `/roadmaps/${id}/activate`, method: "POST", body: {} }),
      transformResponse: (data: unknown) => data as Roadmap,
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled
          dispatch(apiSlice.util.upsertQueryData("getRoadmap", data.id, data))
          dispatch(apiSlice.util.upsertQueryData("getActiveRoadmap", undefined, data))
        } catch {
          // Surfaced to the caller through the mutation result.
        }
      },
    }),

    /** Task detail incl. the server's `canComplete` (contract §19). No UI uses it yet. */
    getTask: build.query<TaskDetail, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Task", id }],
      transformResponse: (data: unknown) => data as TaskDetail,
    }),

    /**
     * Completes a task (contract §20). The server owns every state change and
     * returns the updated complete roadmap, which replaces the cached copy —
     * nothing is changed locally before the server confirms. Repeating a
     * successful completion is idempotent server-side; like every mutation here
     * it is never auto-retried.
     */
    completeTask: build.mutation<Roadmap, string>({
      query: (taskId) => ({ url: `/tasks/${taskId}/complete`, method: "POST", body: {} }),
      transformResponse: (data: unknown) => data as Roadmap,
      invalidatesTags: (_result, _error, taskId) => [{ type: "Task", id: taskId }],
      onQueryStarted: async (_taskId, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled
          dispatch(apiSlice.util.upsertQueryData("getRoadmap", data.id, data))
          // A completed roadmap loses the active slot (§17), so the active
          // query must be re-asked rather than handed the completed tree.
          if (data.status === "completed") {
            dispatch(apiSlice.util.invalidateTags(["ActiveRoadmap"]))
          } else {
            dispatch(apiSlice.util.upsertQueryData("getActiveRoadmap", undefined, data))
          }
        } catch {
          // Surfaced to the caller through the mutation result.
        }
      },
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  useGetLearningProfileQuery,
  usePutLearningProfileMutation,
  useGetOnboardingStatusQuery,
  useRequestRoadmapGenerationMutation,
  useGetGenerationStatusQuery,
  useLazyGetGenerationStatusQuery,
  useGetRoadmapQuery,
  useGetActiveRoadmapQuery,
  useActivateRoadmapMutation,
  useGetTaskQuery,
  useCompleteTaskMutation,
} = apiSlice