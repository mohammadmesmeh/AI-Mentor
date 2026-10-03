import "@testing-library/jest-dom/vitest"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { StepThreeTimeCommitment } from "@/features/onboarding/components/StepThreeTimeCommitment"
import enMessages from "../../../messages/en.json"
import arMessages from "../../../messages/ar.json"

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/onboarding",
}))

const o = enMessages.onboarding

function renderStep(value: number | null, locale: "en" | "ar" = "en") {
  const onChange = vi.fn()
  const onNext = vi.fn()
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? enMessages : arMessages}>
      <StepThreeTimeCommitment value={value} onChange={onChange} onNext={onNext} onBack={vi.fn()} />
    </NextIntlClientProvider>
  )
  return { onChange, onNext }
}

describe("onboarding time step", () => {
  it("offers the six presets and Other, in friendly units (en)", () => {
    renderStep(null)
    for (const label of ["30 minutes", "1 hour", "2 hours", "3 hours", "5 hours", "10 hours", o.timeOther]) {
      expect(screen.getByRole("button", { name: new RegExp(label) })).toBeInTheDocument()
    }
  })

  it("labels the presets in Arabic with Western digits", () => {
    renderStep(null, "ar")
    for (const label of ["30 دقيقة", "ساعة واحدة", "ساعتان", "3 ساعات", "5 ساعات", "10 ساعات"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument()
    }
  })

  it("a preset is sent as minutes", () => {
    const { onChange, onNext } = renderStep(null)
    fireEvent.click(screen.getByRole("button", { name: "2 hours" }))
    expect(onChange).toHaveBeenLastCalledWith(120)
    fireEvent.click(screen.getByRole("button", { name: /continue/i }))
    expect(onNext).toHaveBeenCalled()
  })

  it("Other in hours is converted to minutes", () => {
    const { onChange } = renderStep(null)
    fireEvent.click(screen.getByRole("button", { name: new RegExp(o.timeOther) }))
    fireEvent.change(screen.getByLabelText(o.customTimeLabel), { target: { value: "4" } })
    expect(onChange).toHaveBeenLastCalledWith(240)
  })

  it("an empty Other can't continue, and says why", () => {
    const { onNext } = renderStep(null)
    fireEvent.click(screen.getByRole("button", { name: new RegExp(o.timeOther) }))
    fireEvent.click(screen.getByRole("button", { name: /continue/i }))
    expect(screen.getByText(o.timeErrorRequired)).toBeInTheDocument()
    expect(onNext).not.toHaveBeenCalled()
  })

  it("shows the contract limits next to the field as the learner types", () => {
    const { onChange, onNext } = renderStep(null)
    fireEvent.click(screen.getByRole("button", { name: new RegExp(o.timeOther) }))
    const input = screen.getByLabelText(o.customTimeLabel)
    fireEvent.change(input, { target: { value: "200" } })
    expect(onChange).toHaveBeenLastCalledWith(12_000)
    expect(screen.getByText(o.timeErrorTooHigh)).toBeInTheDocument()
    expect(input).toHaveAttribute("aria-invalid", "true")
    fireEvent.click(screen.getByRole("button", { name: /continue/i }))
    expect(onNext).not.toHaveBeenCalled()
  })

  it("a stored preset value opens with that preset selected", () => {
    renderStep(300)
    expect(screen.getByRole("button", { name: "5 hours" })).toHaveAttribute("aria-pressed", "true")
  })

  it("a stored non-preset value opens as Other in the clearest unit", () => {
    renderStep(45)
    expect(screen.getByRole("button", { name: new RegExp(o.timeOther) })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByLabelText(o.customTimeLabel)).toHaveValue("45")
    expect(screen.getByRole("combobox", { name: o.timeUnitLabel })).toHaveTextContent(o.unitMinutes)
  })
})
