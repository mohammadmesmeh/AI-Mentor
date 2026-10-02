import "@testing-library/jest-dom/vitest"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { Hero } from "@/features/home/components/hero/Hero"
import enMessages from "../../../messages/en.json"
import arMessages from "../../../messages/ar.json"

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
}))

const renderHero = (locale: "en" | "ar") =>
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? enMessages : arMessages}>
      <Hero />
    </NextIntlClientProvider>
  )

describe("Hero", () => {
  it.each(["en", "ar"] as const)("%s: one h1, the description and a CTA to sign-up, from the translations", (locale) => {
    const m = (locale === "en" ? enMessages : arMessages).hero
    const { container } = renderHero(locale)

    expect(container.querySelectorAll("h1")).toHaveLength(1)
    const heading = screen.getByRole("heading", { level: 1, name: m.title })
    expect(heading).toHaveAttribute("id", "hero-heading")
    expect(container.querySelector("section")).toHaveAttribute("aria-labelledby", "hero-heading")
    expect(screen.getByText(m.description)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: m.cta })).toHaveAttribute("href", "/auth")
  })

  it("stays light in both themes: the section is a .light area", () => {
    const { container } = renderHero("en")
    expect(container.querySelector("section")?.classList.contains("light")).toBe(true)
  })

  it("the CTA arrow and the art mirror in RTL", () => {
    const { container } = renderHero("ar")
    const svgs = [...container.querySelectorAll("svg")]
    const arrow = screen.getByRole("link", { name: arMessages.hero.cta }).querySelector("svg")
    expect(arrow?.getAttribute("class")).toContain("rtl:-scale-x-100")
    // Background art and logo mark, both decorative.
    const art = svgs.filter((svg) => svg.getAttribute("aria-hidden") === "true" && svg.getAttribute("class")?.includes("rtl:-scale-x-100"))
    expect(art.length).toBeGreaterThanOrEqual(3)
  })

  it("the preview strip is labelled Example, uses the sample copy, and is hidden from assistive tech", () => {
    renderHero("en")
    const p = enMessages.hero.preview
    const example = screen.getByText(p.example)
    const strip = example.closest("[aria-hidden='true']")
    expect(strip).not.toBeNull()
    for (const text of [p.continue, p.task, p.taskMeta, p.today, p.progress, p.progressValue]) {
      expect(strip).toHaveTextContent(text)
    }
    // Purple is only on the current-task dot.
    expect(strip?.querySelector(".bg-status-current")).not.toBeNull()
    // Nothing in the hero calls the API: it renders without a store.
  })

  it("en and ar have the same hero keys", () => {
    const keys = (o: object, prefix = ""): string[] =>
      Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]))
    expect(keys(arMessages.hero).sort()).toEqual(keys(enMessages.hero).sort())
  })
})
