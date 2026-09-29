import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type {
  LearningMethod,
  LearningProfile,
  OnboardingStatus,
  Preferences,
  ResourceLanguage,
  ResourceSource,
  SelfAssessedLevel,
  UiLocale,
} from "@/lib/api/types"
import type { LearningProfileField } from "@/lib/api/validation"

export type SubmitStatus = "idle" | "submitting" | "succeeded" | "failed"

export interface OnboardingFormState {
  goal: string
  selfAssessedLevel: SelfAssessedLevel | null
  availableMinutesPerWeek: number | null
  desiredOutcome: string
  preferredLearningMethods: LearningMethod[]
  /** Priority order (contract §12). */
  preferredResourceSources: ResourceSource[]
  preferences: {
    uiLocale: UiLocale
    resourceLanguage: ResourceLanguage
    timezone: string
  }
}

export const defaultPreferences = {
  uiLocale: "en" as UiLocale,
  resourceLanguage: "both" as ResourceLanguage,
  timezone: "UTC",
}

export const initialForm = (): OnboardingFormState => ({
  goal: "",
  selfAssessedLevel: null,
  availableMinutesPerWeek: null,
  desiredOutcome: "",
  preferredLearningMethods: [],
  preferredResourceSources: [],
  preferences: { ...defaultPreferences },
})

/**
 * Reshaped from the old mock shape (domain/level/timeCommitment/…).
 * Holds the real learning-profile schema plus the server-authoritative
 * entities the onboarding screens surface (data-model.md "State ownership").
 */
interface OnboardingState {
  currentStep: number
  form: OnboardingFormState
  preferences: Preferences | null
  learningProfile: LearningProfile | null
  onboardingStatus: OnboardingStatus | null
  submitStatus: SubmitStatus
  submitError: string | null
  /** Fields the server rejected with a 422, shown next to their review rows. */
  submitFieldErrors: LearningProfileField[]
}

const initialState: OnboardingState = {
  currentStep: 1,
  form: initialForm(),
  preferences: null,
  learningProfile: null,
  onboardingStatus: null,
  submitStatus: "idle",
  submitError: null,
  submitFieldErrors: [],
}

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    goToStep(state, action: PayloadAction<number>) {
      state.currentStep = action.payload
    },
    updateForm(state, action: PayloadAction<Partial<Omit<OnboardingFormState, "preferences">>>) {
      state.form = { ...state.form, ...action.payload }
    },
    updatePreferences(
      state,
      action: PayloadAction<Partial<Pick<Preferences, "uiLocale" | "resourceLanguage" | "timezone">>>
    ) {
      const patch = action.payload
      if (patch.uiLocale) state.form.preferences.uiLocale = patch.uiLocale
      if (patch.resourceLanguage) state.form.preferences.resourceLanguage = patch.resourceLanguage
      if (patch.timezone) state.form.preferences.timezone = patch.timezone
    },
    hydrate(
      state,
      action: PayloadAction<{
        preferences?: Preferences | null
        learningProfile?: LearningProfile | null
        onboardingStatus?: OnboardingStatus | null
      }>
    ) {
      const { preferences, learningProfile, onboardingStatus } = action.payload
      if (preferences !== undefined) state.preferences = preferences
      if (learningProfile !== undefined) state.learningProfile = learningProfile
      if (onboardingStatus !== undefined) state.onboardingStatus = onboardingStatus
      if (learningProfile) {
        state.form = {
          goal: learningProfile.goal ?? "",
          selfAssessedLevel: learningProfile.selfAssessedLevel ?? null,
          availableMinutesPerWeek: learningProfile.availableMinutesPerWeek ?? null,
          desiredOutcome: learningProfile.desiredOutcome ?? "",
          preferredLearningMethods: learningProfile.preferredLearningMethods ?? [],
          // null on legacy profiles: the learner picks them now.
          preferredResourceSources: learningProfile.preferredResourceSources ?? [],
          preferences: { ...state.form.preferences },
        }
      }
      if (preferences) {
        state.form.preferences = {
          uiLocale: preferences.uiLocale,
          resourceLanguage: preferences.resourceLanguage,
          timezone: preferences.timezone,
        }
      }
    },
    setSubmitStatus(state, action: PayloadAction<SubmitStatus>) {
      state.submitStatus = action.payload
      if (action.payload !== "failed") {
        state.submitError = null
        state.submitFieldErrors = []
      }
    },
    setSubmitError(state, action: PayloadAction<string | null>) {
      state.submitError = action.payload
    },
    setSubmitFieldErrors(state, action: PayloadAction<LearningProfileField[]>) {
      state.submitFieldErrors = action.payload
    },
  },
})

export const {
  goToStep,
  updateForm,
  updatePreferences,
  hydrate,
  setSubmitStatus,
  setSubmitError,
  setSubmitFieldErrors,
} = onboardingSlice.actions

export type { OnboardingState }
export default onboardingSlice.reducer