import "@testing-library/jest-dom/vitest"
import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { Footer } from "@/shared/components/layout/Footer"
import enMessages from "../../../messages/en.json"
import arMessages from "../../../messages/ar.json"

const nav = vi.hoisted(() => ({ pathname: "/" }))

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
  usePathname: () => nav.pathname,
}))

function renderFooter(locale: "en" | "ar", pathname = "/") {
  nav.pathname = pathname
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? enMessages : arMessages}>
      <Footer />
    </NextIntlClientProvider>
  )
}

describe("Footer", () => {
  it.each(["en", "ar"] as const)("%s: translated links in a labelled nav, and this year's copyright", (locale) => {
    const m = locale === "en" ? enMessages : arMessages
    renderFooter(locale)

    const links = within(screen.getByRole("navigation", { name: m.footer.navLabel })).getAllByRole("link")
    expect(links.map((link) => link.textContent)).toEqual([
      m.footer.links.privacy,
      m.footer.links.terms,
      m.footer.links.trust,
      m.footer.links.status,
    ])
    // Ghost links (design.md): a pill that only shows on hover.
    for (const link of links) {
      expect(link.className).toContain("rounded-full")
      expect(link.className).toContain("hover:bg-white/10")
    }

    const year = String(new Date().getFullYear())
    expect(screen.getByText(new RegExp(`© ${year}`))).toBeInTheDocument()
    expect(screen.queryByText(/\{year\}/)).toBeNull()
  })

  it("uses design.md's lateral margins: 16px, 32px, 48px", () => {
    const { container } = renderFooter("en")
    const footer = container.querySelector("footer")
    expect(footer?.className).toMatch(/\bpx-4\b/)
    expect(footer?.className).toContain("md:px-8")
    expect(footer?.className).toContain("lg:px-12")
  })

  it.each(["/auth", "/dashboard", "/tasks", "/settings"])("is not shown on %s", (pathname) => {
    const { container } = renderFooter("en", pathname)
    expect(container.querySelector("footer")).toBeNull()
  })
})
