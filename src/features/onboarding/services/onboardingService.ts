import type { OnboardingData } from "@/redux/slices/onboardingSlice"

interface OnboardingSubmitResult {
  status: "not-connected"
  // Full result shape undefined — defined entirely during the Backend Integration phase
}

interface OnboardingService {
  submitOnboarding(answers: OnboardingData): Promise<OnboardingSubmitResult>
}

const onboardingService: OnboardingService = {
  submitOnboarding: async () => ({ status: "not-connected" }),
}

export { onboardingService }

export type { OnboardingService, OnboardingSubmitResult }