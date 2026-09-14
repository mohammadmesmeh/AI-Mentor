import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface OnboardingData {
  domain: string
  level: string | null
  timeCommitment: string
  timeCustomDescription: string
  successGoal: string
  learningPreferences: string[]
}

export type SubmitStatus = "idle" | "submitting" | "succeeded" | "failed"

interface OnboardingState {
  currentStep: number
  domain: string
  level: string | null
  timeCommitment: string
  timeCustomDescription: string
  successGoal: string
  learningPreferences: string[]
  isComplete: boolean
  roadmap: string[] | null
  submitStatus: SubmitStatus
  submitError: string | null
}

function loadOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem("ai-mentor-onboarding-complete") === "true"
  } catch {
    return false
  }
}

const initialState: OnboardingState = {
  currentStep: 1,
  domain: "",
  level: null,
  timeCommitment: "",
  timeCustomDescription: "",
  successGoal: "",
  learningPreferences: [],
  isComplete: loadOnboardingComplete(),
  roadmap: null,
  submitStatus: "idle",
  submitError: null,
}

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    goToStep(state, action: PayloadAction<number>) {
      state.currentStep = action.payload
    },
    setOnboardingData(
      state,
      action: PayloadAction<
        Partial<
          Pick<
            OnboardingState,
            | "domain"
            | "level"
            | "timeCommitment"
            | "timeCustomDescription"
            | "successGoal"
            | "learningPreferences"
          >
        >
      >
    ) {
      Object.assign(state, action.payload)
    },
    setSubmitStatus(state, action: PayloadAction<SubmitStatus>) {
      state.submitStatus = action.payload
      if (action.payload !== "failed") {
        state.submitError = null
      }
    },
    setSubmitError(state, action: PayloadAction<string | null>) {
      state.submitError = action.payload
    },
    completeOnboarding(state) {
      state.isComplete = true
      try { localStorage.setItem("ai-mentor-onboarding-complete", "true") } catch {}
    },
    setRoadmap(state, action: PayloadAction<string[]>) {
      state.roadmap = action.payload
    },
    resetOnboarding() {
      try { localStorage.removeItem("ai-mentor-onboarding-complete") } catch {}
      return initialState
    },
  },
})

export const {
  goToStep,
  setOnboardingData,
  setSubmitStatus,
  setSubmitError,
  completeOnboarding,
  setRoadmap,
  resetOnboarding,
} = onboardingSlice.actions

export type { OnboardingState }
export default onboardingSlice.reducer