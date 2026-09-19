import "@testing-library/jest-dom/vitest"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { IntlWrapper } from "@tests/helpers/intl"
import { OnboardingIncomplete } from "@/features/onboarding/components/OnboardingIncomplete"

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard",
}))

describe("missing-onboarding-info display (FR-008)", () => {
  it("T024: renders exactly the fields in missingFields", () => {
    render(
      <IntlWrapper>
        <OnboardingIncomplete
          missingFields={[
            "goal",
            "self_assessed_level",
            "available_minutes_per_week",
            "preferred_learning_methods",
          ]}
        />
      </IntlWrapper>
    )

    expect(screen.getByText("Missing information:")).toBeInTheDocument()
    expect(screen.getByText("Goal")).toBeInTheDocument()
    expect(screen.getByText("Current skill level")).toBeInTheDocument()
    expect(screen.getByText("Minutes per week")).toBeInTheDocument()
    expect(screen.getByText("Preferred learning methods")).toBeInTheDocument()

    // Fields NOT in the array must not be listed.
    expect(screen.queryByText("Desired outcome")).not.toBeInTheDocument()
    expect(screen.queryByText("Learning resource language")).not.toBeInTheDocument()
  })

  it("T024b: renders an empty state when missingFields is empty", () => {
    render(
      <IntlWrapper>
        <OnboardingIncomplete missingFields={[]} />
      </IntlWrapper>
    )

    expect(screen.queryByText("Missing information:")).not.toBeInTheDocument()
    expect(screen.queryAllByRole("listitem")).toHaveLength(0)
    expect(
      screen.getByRole("button", { name: "Complete onboarding" })
    ).toBeInTheDocument()
  })
})