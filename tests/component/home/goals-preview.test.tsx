import "@testing-library/jest-dom/vitest"
import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { GoalsPreview } from "@/features/home/components/how-it-works/GoalsPreview"
import enMessages from "../../../messages/en.json"
import arMessages from "../../../messages/ar.json"

// Reduced motion: the preview shows its final state straight away.
vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  useReducedMotion: () => true,
  useInView: () => false,
}))

function renderPreview(locale: "en" | "ar") {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? enMessages : arMessages}>
      <div dir={locale === "ar" ? "rtl" : "ltr"}>
        <GoalsPreview />
      </div>
    </NextIntlClientProvider>
  )
}

const flatKeys = (obj: object, prefix = ""): string[] =>
  Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === "object" ? flatKeys(value, `${prefix}${key}.`) : [`${prefix}${key}`]
  )

describe("How it works — goals preview", () => {
  it("is decorative: aria-hidden with nothing focusable", () => {
    const { container } = renderPreview("en")
    const preview = container.querySelector("[aria-hidden='true']")!
    expect(preview).toBeInTheDocument()
    expect(preview.querySelectorAll("a, button, input, select, textarea, [tabindex]")).toHaveLength(0)
  })

  it("with reduced motion shows the final state: typed goal, Intermediate + 2 h, Ready", () => {
    const { container } = renderPreview("en")
    const preview = container.querySelector("[aria-hidden='true']")!
    const p = enMessages.howItWork.preview
    expect(preview).toHaveTextContent(p.goalText)
    const selected = [...preview.querySelectorAll("span.bg-primary")].map((el) => el.textContent)
    expect(selected).toEqual([p.levels.intermediate, p.times.h2])
    expect(preview.querySelector(".opacity-100")).toHaveTextContent(p.ready)
  })

  it("Arabic shows only Arabic, with Western digits and the same selections", () => {
    const { container } = renderPreview("ar")
    const preview = container.querySelector("[aria-hidden='true']")!
    const p = arMessages.howItWork.preview
    expect(preview.textContent).not.toMatch(/[A-Za-z]/)
    expect(preview.textContent).not.toMatch(/[٠-٩۰-۹]/)
    expect(preview).toHaveTextContent(p.goalText)
    const selected = [...preview.querySelectorAll("span.bg-primary")].map((el) => el.textContent)
    expect(selected).toEqual([p.levels.intermediate, p.times.h2])
  })

  it("English shows no Arabic", () => {
    const { container } = renderPreview("en")
    expect(container.textContent).not.toMatch(/[؀-ۿ]/)
  })

  it("both message files have identical key sets", () => {
    expect(flatKeys(arMessages).sort()).toEqual(flatKeys(enMessages).sort())
  })
})
