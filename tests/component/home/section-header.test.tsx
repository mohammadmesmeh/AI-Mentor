import "@testing-library/jest-dom/vitest"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { NextIntlClientProvider, useTranslations } from "next-intl"
import { SectionHeader, sectionHighlight } from "@/shared/components/ui/SectionHeader"
import { HeadingReveal } from "@/shared/components/animations/HeadingReveal"
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

  it("defaults to start-aligned on a themed surface; center + inverse is the CTA's exception", () => {
    const { container, rerender } = render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <SectionHeader eyebrow="Eyebrow" title={<>A {sectionHighlight("phrase")}</>} description="Text" />
      </NextIntlClientProvider>
    )
    const block = () => container.firstElementChild as HTMLElement
    expect(block().className).toContain("items-start")
    expect(block().className).not.toContain("dark")
    expect(screen.getByRole("heading", { level: 2 }).className).toContain("text-ink")

    rerender(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <SectionHeader
          align="center"
          tone="inverse"
          eyebrow="Eyebrow"
          title={<>A {sectionHighlight("phrase")}</>}
          description="Text"
        />
      </NextIntlClientProvider>
    )
    expect(block().className).toContain("items-center")
    expect(block().className).toContain("text-center")
    // `dark` is what puts the mark on its lighter step, so the phrase is
    // coloured by the CTA's own navy surface rather than by the app theme.
    expect(block().className).toContain("dark")
    expect(screen.getByRole("heading", { level: 2 }).className).toContain("text-white")
    expect(container.querySelector("mark")).toHaveTextContent("phrase")
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

  it("reveals the title word by word without losing the spaces between them", () => {
    const { container } = renderIn("en")
    const heading = screen.getByRole("heading", { level: 2 })

    // The words are split for the animation, so what they add up to still has
    // to be the title — spaces included, or it wraps and copies out wrong.
    const words = container.querySelector("h2 [aria-hidden='true']")
    expect(words?.textContent).toBe("A learning path that adapts with you")
    expect(words?.querySelectorAll("[data-reveal-word]")).toHaveLength(7)

    const mark = heading.querySelector("mark")
    // Colour only: nothing paints a box behind the letters.
    expect(mark?.className).toContain("text-secondary-700")
    expect(mark?.className).toContain("bg-transparent")
  })

  it("reads the title out once, as plain text, however it was marked", () => {
    renderIn("ar")
    const heading = screen.getByRole("heading", { level: 2 })
    expect(heading.querySelector(".sr-only")?.textContent).toBe("مسار تعلّم يتكيّف معك")
    // The animated words are hidden from assistive tech so they are not
    // announced on top of that one copy.
    expect(heading.querySelectorAll("[aria-hidden='true']")).toHaveLength(1)
  })

  it("reveals a plain-string heading too, and never renders an empty mark", () => {
    render(
      <HeadingReveal as="h1" className="text-ink">
        {"Build a learning plan"}
      </HeadingReveal>
    )
    const heading = screen.getByRole("heading", { level: 1, name: "Build a learning plan" })
    expect(heading.querySelectorAll("mark")).toHaveLength(0)
    expect(heading.querySelector("[aria-hidden='true']")?.textContent).toBe("Build a learning plan")
  })
})
