"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { useT } from "@/shared/hooks/useT"
import { BrandLogo } from "@/shared/components/ui/BrandLogo"
import { isWorkspacePath } from "@/lib/workspaceRoutes"

const footerLinks = [
  { key: "privacy", href: "#" },
  { key: "terms", href: "#" },
  { key: "trust", href: "#" },
  { key: "status", href: "#" },
] as const

/**
 * The site footer, per design.md:
 * - Deep midnight navy (#0A1930) structural anchoring, in both themes.
 * - Lateral margins 16px / 32px / 48px (mobile / tablet / desktop), 8pt rhythm.
 * - Body type: 15px on a 24px line.
 * - Links are tertiary/ghost buttons: text with a soft pill behind it on hover.
 * - Framed on the horizontal axis only: a fine rule above the footer and one
 *   between the brand row and the copyright line.
 */
function Footer() {
  const t = useT("footer")
  const tn = useT("nav")
  const pathname = usePathname()

  if (
    typeof pathname === "string" &&
    (pathname.startsWith("/auth") || isWorkspacePath(pathname))
  ) {
    return null
  }

  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 bg-midnight px-4 py-12 md:px-8 lg:px-12">
      <div className="mx-auto max-w-(--container-content)">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
          <Link
            href="/"
            title={tn("brand", "Khatwa")}
            className="group flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/30"
          >
            {/* The footer is navy in both themes: always the on-dark logo. */}
            <span className="transition-transform duration-300 group-hover:scale-[1.03]" dir="ltr">
              <BrandLogo tone="onDark" className="h-12" />
            </span>
          </Link>

          <nav aria-label={t("navLabel", "Footer navigation")}>
            <ul className="flex flex-wrap items-center justify-center gap-2">
              {footerLinks.map((link) => (
                <li key={link.key}>
                  {/* 24px line + 8px above and below: a 40px touch target. */}
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.9375rem] leading-6 text-slate-300 transition-colors duration-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/30"
                  >
                    {t(`links.${link.key}`, link.key)}
                    {link.key === "status" && (
                      <span className="size-2 rounded-full bg-success-green" aria-hidden="true" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* The rule sits on a div: paragraphs are capped at 72ch globally. */}
        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="mx-auto text-center text-[0.9375rem] leading-6 text-white/60 lg:mx-0 lg:text-start">
            {t("copyright", `© ${year} Khatwa Inc. Learn with clarity. Grow with confidence.`, { year })}
          </p>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
