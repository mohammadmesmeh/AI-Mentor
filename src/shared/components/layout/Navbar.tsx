"use client"

import { Brain, Menu, X } from "lucide-react"
import { useMobileMenu } from "@/shared/hooks/useMobileMenu"
import { Link, usePathname } from "@/i18n/navigation"
import { Container } from "@/shared/components/ui/Container"
import { Button } from "@/shared/components/ui/Button"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
]

const navLinkStyles = {
  desktop: {
    base: "text-sm font-medium transition-colors",
    active:
      "text-foreground font-semibold underline underline-offset-4 decoration-2 decoration-primary",
    inactive: "text-muted-foreground hover:text-foreground",
  },
  mobile: {
    base: "rounded-md px-3 py-2 text-sm font-medium transition-colors",
    active: "bg-muted text-foreground font-semibold",
    inactive: "text-muted-foreground hover:bg-muted hover:text-foreground",
  },
} as const

function Navbar() {
  const { isOpen: mobileOpen, toggle, close } = useMobileMenu()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <Container className="flex h-14 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-foreground"
        >
         <Brain></Brain>
          <span>AI Mentor</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                navLinkStyles.desktop.base,
                pathname === link.href
                  ? navLinkStyles.desktop.active
                  : navLinkStyles.desktop.inactive
              )}
            >
              {link.label}
            </Link>
          ))}
          <Button variant="primary" size="sm">
            Get Started
          </Button>
        </nav>

        <button
          type="button"
          onClick={toggle}
          className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out md:hidden",
          mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <Container className="flex flex-col gap-3 pb-4 pt-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className={cn(
                navLinkStyles.mobile.base,
                pathname === link.href
                  ? navLinkStyles.mobile.active
                  : navLinkStyles.mobile.inactive
              )}
            >
              {link.label}
            </Link>
          ))}
          <Button
            variant="primary"
            className="mt-2 w-full"
            onClick={close}
          >
            Get Started
          </Button>
        </Container>
      </div>
    </header>
  )
}

export { Navbar }
