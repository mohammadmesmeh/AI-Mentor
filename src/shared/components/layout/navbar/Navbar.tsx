"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Home, LogOut } from "lucide-react"
import { useMobileMenu } from "@/shared/hooks/useMobileMenu"
import { Container } from "@/shared/components/ui/Container"
import { Button } from "@/shared/components/ui/Button"
import { cn } from "@/lib/utils"
import { Logo } from "./Logo"
import { MobileMenuButton } from "./MobileMenuButton"
import { NavLinks } from "./NavLinks"
import { LanguageSwitcher } from "@/shared/components/ui/LanguageSwitcher"
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle"
import { useT } from "@/shared/hooks/useT"
import { usePathname, useRouter } from "@/i18n/navigation"
import { logout } from "@/redux/slices/authSlice"
import type { RootState, AppDispatch } from "@/redux/store"

import { useSurfaceTheme, type SurfaceTheme } from "@/shared/components/layout/ShellBackground"

const SCROLL_OFFSET = 88

type NavLink = {
  href: string
  label: string
}

interface NavbarProps {
  navbarTheme?: SurfaceTheme
}

function Navbar({ navbarTheme }: NavbarProps = {}) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const { isOpen: mobileOpen, toggle, close } = useMobileMenu()
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const t = useT("nav")
  const pathname = usePathname()
  const isAuth = typeof pathname === "string" && pathname.startsWith("/auth")
  const [isScrolled, setIsScrolled] = useState(false)
  const surfaceTheme = useSurfaceTheme()
  const activeSurfaceTheme = navbarTheme ?? surfaceTheme

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks: NavLink[] = [
    { href: "/", label: t("home", "Home") },
    { href: "#features", label: t("features", "Features") },
    { href: "#how-it-works", label: t("howItWorks", "How It Works") },
    { href: "#", label: t("curriculum", "Curriculum") },
    { href: "#", label: t("pricing", "Pricing") },
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

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (mobileOpen) {
      close()
    }
    if (!href.startsWith("#")) {
      return
    }
    e.preventDefault()
    if (href === "#") {
      return
    }
    const target = document.querySelector(href)
    if (!target) {
      return
    }
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    const y = target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET
    window.scrollTo({ top: Math.max(y, 0), behavior: reduceMotion ? "auto" : "smooth" })
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!mobileOpen) {
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== "Tab") {
        return
      }
      const container = mobileMenuRef.current
      if (!container) {
        return
      }
      const focusable = container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) {
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [mobileOpen, close]
  )

  if (typeof pathname === "string" && pathname.startsWith("/dashboard")) {
    return null
  }

  const topTransparent = !isScrolled && !mobileOpen
  const isDarkTop = topTransparent && activeSurfaceTheme === "dark"

  return (
    <header
      className="sticky top-0 z-50 w-full pt-2.5 pb-1 sm:pt-3"
      onKeyDown={handleKeyDown}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
      >
        {t("skipToContent", "Skip to main content")}
      </a>

      <Container className="p-0 sm:px-5">
        <div
          className={cn(
            "border rounded-2xl mx-3 sm:mx-0 transition-all duration-300 ease-out motion-reduce:transition-none",
            isScrolled || mobileOpen
              ? cn(
                  "border-light-blue-bg/60 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(18,49,77,0.15)] dark:border-white/10",
                  mobileOpen ? "bg-white/95 dark:bg-slate-900/95" : "bg-white/75 dark:bg-slate-900/75"
                )
              : "border-transparent bg-transparent shadow-none backdrop-blur-0"
          )}
        >
          <div
            className={cn(
              "flex h-14 items-center justify-between gap-3 px-4 sm:px-5",
              isDarkTop && "dark"
            )}
          >
            <Logo />

            {!isAuth && (
              <nav
                aria-label={t("mainNavigation", "Main navigation")}
                className="hidden items-center gap-1 sm:flex"
              >
                {navLinks.map((link) => (
                  <NavLinks
                    key={link.label}
                    link={link}
                    onClick={(e) => handleNavClick(e, link.href)}
                  />
                ))}
              </nav>
            )}

            <div className="hidden items-center gap-2 sm:flex">
              <LanguageSwitcher />
              <ThemeToggle />
              {isAuth && (
                <Button variant="secondary" size="sm" href="/">
                  <Home className="h-4 w-4" aria-hidden="true" />
                  {t("home", "Home")}
                </Button>
              )}
              {!isAuth &&
                (isAuthenticated ? (
                  <Button variant="secondary" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    {t("logout", "Logout")}
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" size="sm" href="/auth">
                      {t("signIn", "Sign In")}
                    </Button>
                    <Button variant="primary" size="sm" href="/auth">
                      {t("startLearning", "Start Learning")}
                    </Button>
                  </>
                ))}
            </div>

            <div className="flex items-center gap-2 sm:hidden">
              {!isAuth && !isAuthenticated && (
                <Button variant="primary" size="sm" href="/auth">
                  {t("start", "Start")}
                </Button>
              )}
              <MobileMenuButton isOpen={mobileOpen} toggle={toggle} />
            </div>
          </div>

          <div
            ref={mobileMenuRef}
            id="mobile-menu"
            role="region"
            aria-label={t("mobileNavigation", "Mobile navigation")}
            className={cn(
              "overflow-hidden transition-all duration-300 ease-out sm:hidden",
              mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
              {!isAuth &&
                navLinks.map((link) => (
                  <NavLinks
                    key={link.label}
                    link={link}
                    onClick={(e) => handleNavClick(e, link.href)}
                    mobile
                  />
                ))}

              {isAuth && (
                <Button
                  variant="secondary"
                  className="w-full"
                  href="/"
                  onClick={close}
                >
                  <Home className="h-4 w-4" aria-hidden="true" />
                  {t("home", "Home")}
                </Button>
              )}

              <div className="mt-2 flex items-center gap-2">
                <LanguageSwitcher mobile />
                <ThemeToggle mobile />
              </div>

              {!isAuth &&
                (isAuthenticated ? (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      close()
                      handleLogout()
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    {t("logout", "Logout")}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full"
                    href="/auth"
                    onClick={close}
                  >
                    {t("startLearning", "Start Learning")}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      </Container>
    </header>
  )
}

export { Navbar }