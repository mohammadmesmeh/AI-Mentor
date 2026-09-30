import "@testing-library/jest-dom/vitest"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { NextIntlClientProvider, useTranslations } from "next-intl"
import { SectionHeader, sectionHighlight } from "@/shared/components/ui/SectionHeader"
import enMessages from "../../../messages/en.json"
import arMessages from "../../../messages/ar.json"

function HowItWorksHeader() {
  const t = useTranslations("howItWork")
  return (
    <SectionHeader
      headingId="how-it-works-heading"
      eyebrow={t("badge")}
      title={t.rich("title", { mark: sectionHighlight })}
      description={t("subtitle")}
    />
  )
}

const renderIn = (locale: "en" | "ar") =>
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? enMessages : arMessages}>
      <HowItWorksHeader />
    </NextIntlClientProvider>
  )

// jsdom has no IntersectionObserver; the header's fade-in (whileInView) needs one.
beforeAll(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
})

describe("SectionHeader", () => {
  it.each([
    ["en", "A learning path that adapts with you", "adapts with you"],
    ["ar", "مسار تعلّم يتكيّف معك", "يتكيّف معك"],
  ] as const)("%s: one h2 whose key phrase is a real <mark> chosen by the translation", (locale, title, phrase) => {
    const { container } = renderIn(locale)
    const heading = screen.getByRole("heading", { level: 2, name: title })
    expect(heading).toHaveAttribute("id", "how-it-works-heading")
    const marks = heading.querySelectorAll("mark")
    expect(marks).toHaveLength(1)
    expect(marks[0]).toHaveTextContent(phrase)
    // Eyebrow text is plain (no uppercase/letter-spacing classes that break Arabic joining).
    const eyebrow = container.querySelector("p")
    expect(eyebrow).toHaveTextContent(locale === "en" ? enMessages.howItWork.badge : arMessages.howItWork.badge)
    expect(eyebrow?.className).not.toMatch(/uppercase|tracking-/)
  })

  it("the brand mark is decorative and mirrors in RTL", () => {
    const { container } = renderIn("ar")
    const svg = container.querySelector("svg")
    expect(svg).toHaveAttribute("aria-hidden", "true")
    expect(svg?.getAttribute("class")).toContain("rtl:-scale-x-100")
  })

  it("every landing title marks exactly one phrase in both languages", () => {
    const titles = (m: typeof enMessages) => [
      m.howItWork.title,
      m.features.heading,
      m.home.domains.title,
      m.pricing.heading,
      m.faq.heading,
      m.cta.title,
    ]
    for (const title of [...titles(enMessages), ...titles(arMessages as typeof enMessages)]) {
      expect(title.match(/<mark>/g)).toHaveLength(1)
      expect(title.match(/<\/mark>/g)).toHaveLength(1)
    }
  })
})
