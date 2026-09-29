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

  return (
    <footer className="border-t border-white/10 bg-midnight px-6 py-12">
      <div className="mx-auto flex max-w-(--container-content) flex-col items-center gap-8 md:flex-row md:items-center md:justify-between">
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

        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {footerLinks.map((link) => (
              <li key={link.key}>
                {/* inline-block + py-1 lifts the touch target from 18px to
                    26px, clearing the 24px minimum on phones. The row's
                    existing gap-y-4 absorbs the extra height. */}
                <Link
                  href={link.href}
                  className="inline-block rounded-sm py-1 text-sm text-slate-300 transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/30"
                >
                  {t(`links.${link.key}`, link.key)}
                  {link.key === "status" && (
                    <span
                      className="ms-1.5 inline-block h-2 w-2 rounded-full bg-success-green align-middle"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-sm text-white/50">
          {t(
            "copyright",
            "© 2025 Khatwa Inc. Learn with clarity. Grow with confidence."
          )}
        </p>
      </div>
    </footer>
  )
}

export { Footer }