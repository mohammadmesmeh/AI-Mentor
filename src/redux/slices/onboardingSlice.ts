import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface OnboardingData {
  learningGoal: string
  skillLevel: string
  learningPreferences: string[]
  timeCommitment: string
  timeCustomDescription: string
  successGoal: string
}

interface OnboardingState {
  currentStep: number
  learningGoal: string
  skillLevel: string | null
  learningPreferences: string[]
  timeCommitment: string
  timeCustomDescription: string
  successGoal: string
  isComplete: boolean
  isGenerating: boolean
  roadmap: string[] | null
  onboardingData: OnboardingData | null
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
  learningGoal: "",
  skillLevel: null,
  learningPreferences: [],
  timeCommitment: "",
  timeCustomDescription: "",
  successGoal: "",
  isComplete: loadOnboardingComplete(),
  isGenerating: false,
  roadmap: null,
  onboardingData: null,
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
            | "learningGoal"
            | "skillLevel"
            | "learningPreferences"
            | "timeCommitment"
            | "timeCustomDescription"
            | "successGoal"
          >
        >
      >
    ) {
      Object.assign(state, action.payload)
    },
    setIsGenerating(state, action: PayloadAction<boolean>) {
      state.isGenerating = action.payload
    },
    completeOnboarding(state) {
      state.isComplete = true
      state.isGenerating = false
      try { localStorage.setItem("ai-mentor-onboarding-complete", "true") } catch {}
    },
    setRoadmap(state, action: PayloadAction<string[]>) {
      state.roadmap = action.payload
    },
    saveOnboardingData(state, action: PayloadAction<OnboardingData>) {
      state.onboardingData = action.payload
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
  setIsGenerating,
  completeOnboarding,
  setRoadmap,
  saveOnboardingData,
  resetOnboarding,
} = onboardingSlice.actions

export type { OnboardingState }
export default onboardingSlice.reducer
