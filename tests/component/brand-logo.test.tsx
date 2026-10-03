import "@testing-library/jest-dom/vitest"
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { BrandLogo } from "@/shared/components/ui/BrandLogo"
import enMessages from "../../messages/en.json"
import arMessages from "../../messages/ar.json"

const renderLogo = (locale: "en" | "ar", tone?: "auto" | "onDark") =>
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? enMessages : arMessages}>
      <BrandLogo tone={tone} />
    </NextIntlClientProvider>
  )

describe("BrandLogo", () => {
  it.each(["en", "ar"] as const)("%s: one inline SVG named after the brand, with nothing behind it", (locale) => {
    const { container } = renderLogo(locale)
    const svg = screen.getByRole("img", { name: (locale === "en" ? enMessages : arMessages).nav.brand })
    expect(svg.tagName.toLowerCase()).toBe("svg")
    // No background: no rect, no image, no fill on the svg itself.
    expect(container.querySelector("rect, img, image")).toBeNull()
    expect(svg.getAttribute("fill")).toBeNull()
    expect(svg.getAttribute("class")).not.toMatch(/\bbg-/)
  })

  it("is colored by the theme tokens, never by fixed colors", () => {
    const { container } = renderLogo("en")
    const painted = [...container.querySelectorAll("circle, polyline, path")]
    expect(painted).toHaveLength(5)
    for (const shape of painted) {
      expect(shape.getAttribute("class")).toMatch(/^(fill|stroke)-logo-(ink|accent)$/)
      expect(shape.getAttribute("fill")).toBeNull()
      expect(shape.getAttribute("stroke")).toBeNull()
    }
    expect(container.querySelector(".stroke-logo-accent")).not.toBeNull()
  })

  it("onDark switches the logo itself to the dark tokens; it is never mirrored", () => {
    const { container } = renderLogo("ar", "onDark")
    const svg = container.querySelector("svg")!
    expect(svg.classList.contains("dark")).toBe(true)
    expect(svg.getAttribute("class")).not.toContain("scale-x")
  })
})
