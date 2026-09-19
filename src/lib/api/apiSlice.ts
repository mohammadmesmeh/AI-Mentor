import { createApi, type BaseQueryFn, type FetchArgs } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth, setSession, clearSession, getSession } from "./auth"
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

export interface AuthData {
  user: User
  session: Session
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

function toAuthData(data: {
  tokenType?: string
  expiresIn?: number
  refreshExpiresIn?: number
  user?: User
  accessToken?: string
  refreshToken?: string
}): AuthData {
  const now = Date.now()
  const session: Session = {
    tokenType: data.tokenType ?? "Bearer",
    accessToken: data.accessToken ?? "",
    expiresAt: now + (data.expiresIn ?? 0) * 1000,
    refreshToken: data.refreshToken ?? "",
    refreshExpiresAt: now + (data.refreshExpiresIn ?? 0) * 1000,
  }
  return { user: data.user ?? ({} as User), session }
}

export interface AuthData {
  user: User
  session: Session
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OnStartedHandler = (arg: any, api: { dispatch: any; queryFulfilled: any }) => Promise<void>

function authPersistHandler(
  _arg: unknown,
  { dispatch, queryFulfilled }: { dispatch: (action: unknown) => unknown; queryFulfilled: Promise<{ data: AuthData }> }
): Promise<void> {
  return queryFulfilled
    .then(({ data }) => {
      setSession(data.session)
      dispatch(sessionEstablished(data.user))
    })
    .catch(() => {})
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: apiBaseQuery,
  tagTypes: ["Me", "Preferences", "LearningProfile", "OnboardingStatus", "Roadmap"],
  endpoints: (build) => ({
    register: build.mutation<AuthData, RegisterArg>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body: {
          name: body.name,
          email: body.email,
          password: body.password,
          password_confirmation: body.passwordConfirmation,
        },
      }),
      transformResponse: (data: unknown) => toAuthData(data as Parameters<typeof toAuthData>[0]),
      onQueryStarted: authPersistHandler as unknown as OnStartedHandler,
    }),

    login: build.mutation<AuthData, LoginArg>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      transformResponse: (data: unknown) => toAuthData(data as Parameters<typeof toAuthData>[0]),
      onQueryStarted: authPersistHandler as unknown as OnStartedHandler,
    }),

    logout: build.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
        body: { refresh_token: getSession()?.refreshToken ?? null },
      }),
      onQueryStarted: async (
        _arg: void,
        { dispatch, queryFulfilled }: {
          dispatch: (action: unknown) => unknown
          queryFulfilled: Promise<unknown>
        }
      ) => {
        // FR-006: clear local session state before awaiting the response, and
        // again on failure — never conditional on network success.
        clearSession()
        dispatch(clearLocalSession())
        try {
          await queryFulfilled
        } catch {
          dispatch(clearLocalSession())
        } finally {
          dispatch(apiSlice.util.resetApiState())
        }
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
} = apiSlice