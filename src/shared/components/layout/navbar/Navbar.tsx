"use client"

import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { LogOut } from "lucide-react"
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
import { useRouter } from "@/i18n/navigation"
import { logout } from "@/redux/slices/authSlice"
import type { RootState, AppDispatch } from "@/redux/store"

function Navbar() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const { isOpen: mobileOpen, toggle, close } = useMobileMenu()
  const t = useTranslations("nav")
  const tCommon = useTranslations("nav")
  const navLinks = [
    { href: "/", label: t("home") },
  ]

  const handleLogout = () => {
    dispatch(logout())
    router.push("/")
  }
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

          {isAuthenticated ? (
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          ) : (
            <Button variant="primary" size="sm" href="/auth">
              {tCommon("cta")}
            </Button>
          )}
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

          {isAuthenticated ? (
            <Button
              variant="secondary"
              className="mt-2 w-full"
              onClick={() => { close(); handleLogout() }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          ) : (
            <Button
              variant="primary"
              className="mt-2 w-full"
              href="/auth"
              onClick={close}
            >
              {tCommon("cta")}
            </Button>
          )}

        </Container>

      </div>

    </header>
  )
}

export { Navbar }