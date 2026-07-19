"use client"

import { useEffect } from "react"
import { useMobileMenu } from "@/shared/hooks/useMobileMenu"
import { Container } from "@/shared/components/ui/Container"
import { Button } from "@/shared/components/ui/Button"
import { cn } from "@/lib/utils"
import { Logo } from "./Logo"
import { MobileMenuButton } from "./MobileMenuButton"
import { NavLinks } from "./NavLinks"
import { LanguageSwitcher } from "@/shared/components/ui/LanguageSwitcher"
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle"
import { useTranslations } from "next-intl"

function Navbar() {
  const { isOpen: mobileOpen, toggle, close } = useMobileMenu()
  const t = useTranslations("nav")
  const tCommon = useTranslations("hero")
  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/about", label: t("about") },
  ]
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/30 backdrop-blur-lg">
      <Container className="flex h-14 items-center justify-between">

        <Logo />

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((nav) => (
            <NavLinks
              key={nav.href}
              link={nav}
            />
          ))}

          <LanguageSwitcher />

          <ThemeToggle />

          <Button variant="primary" size="sm">
            {tCommon("cta")}
          </Button>
        </nav>


        <MobileMenuButton
          isOpen={mobileOpen}
          toggle={toggle}
        />

      </Container>


      <div
        id="mobile-menu"
        role="region"
        aria-label="Mobile navigation"
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out md:hidden",
          mobileOpen
            ? "max-h-96 opacity-100"
            : "max-h-0 opacity-0"
        )}
      >

        <Container className="flex flex-col gap-3 pb-4 pt-2">

          {navLinks.map((link) => (
            <NavLinks
              key={link.href}
              link={link}
              onClick={close}
              mobile
            />
          ))}

          <LanguageSwitcher mobile />

          <ThemeToggle mobile />

          <Button
            variant="primary"
            className="mt-2 w-full"
            onClick={close}
          >
            {tCommon("cta")}
          </Button>

        </Container>

      </div>

    </header>
  )
}

export { Navbar }