import { Link } from "@/i18n/navigation"
import { Terminal } from "lucide-react"
import { useT } from "@/shared/hooks/useT"

const footerLinks = [
  { key: "privacy", href: "#" },
  { key: "terms", href: "#" },
  { key: "trust", href: "#" },
  { key: "status", href: "#" },
] as const

function Footer() {
  const t = useT("footer")

  return (
    <footer className="border-t border-white/10 bg-midnight px-6 py-12">
      <div className="mx-auto flex max-w-(--container-content) flex-col items-center gap-8 md:flex-row md:items-center md:justify-between">
        <Link
          href="/"
          aria-label="AI Mentor"
          title="AI Mentor"
          className="group flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/30"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform duration-300 group-hover:scale-110">
            <Terminal className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-display text-xl font-extrabold text-white">
            AI Mentor
          </span>
        </Link>

        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {footerLinks.map((link) => (
              <li key={link.key}>
                <Link
                  href={link.href}
                  className="rounded-sm text-sm text-slate-300 transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/30"
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
            "© 2025 AI Mentor Inc. Precision intelligence for human mastery."
          )}
        </p>
      </div>
    </footer>
  )
}

export { Footer }