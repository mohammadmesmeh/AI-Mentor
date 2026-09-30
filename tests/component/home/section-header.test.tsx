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

  it("fades the title in whole, like the eyebrow and description — no word-by-word split", () => {
    renderIn("en")
    const heading = screen.getByRole("heading", { level: 2 })

    // Same FadeInView as the rest of the text: starts hidden and 8px low.
    expect(heading.style.opacity).toBe("0")
    expect(heading.style.transform).toContain("translateY(8px)")
    expect(heading.textContent).toBe("A learning path that adapts with you")
    expect(heading.querySelector("[data-reveal-word]")).toBeNull()
    expect(heading.querySelector("[aria-hidden='true']")).toBeNull()

    const mark = heading.querySelector("mark")
    // Colour only: nothing paints a box behind the letters.
    expect(mark?.className).toContain("text-secondary-700")
    expect(mark?.className).toContain("bg-transparent")
  })

  it("the eyebrow, title and description all start with the same hidden fade state", () => {
    const { container } = renderIn("ar")
    const heading = screen.getByRole("heading", { level: 2, name: "مسار تعلّم يتكيّف معك" })
    const [eyebrow, description] = container.querySelectorAll("p")
    for (const element of [eyebrow, heading, description]) {
      expect(element.style.opacity).toBe("0")
    }
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
