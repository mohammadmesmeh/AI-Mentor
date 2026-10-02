"use client"

import { useCallback, useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import { Home, LayoutDashboard, LogOut } from "lucide-react"
import { useMobileMenu } from "@/shared/hooks/useMobileMenu"
import { useScrolledPast } from "@/shared/hooks/useScrolledPast"
import { useBodyScrollLock } from "@/shared/hooks/useBodyScrollLock"
import { Container } from "@/shared/components/ui/Container"
import { Button } from "@/shared/components/ui/Button"
import { cn, scrollToElement } from "@/lib/utils"
import { Logo } from "./Logo"
import { MobileMenuButton } from "./MobileMenuButton"
import { NavLinks } from "./NavLinks"
import { LanguageSwitcher } from "@/shared/components/ui/LanguageSwitcher"
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle"
import { useT } from "@/shared/hooks/useT"
import { usePathname, useRouter } from "@/i18n/navigation"
import { useLogoutMutation } from "@/lib/api/apiSlice"
import type { RootState } from "@/redux/store"
import { isWorkspacePath } from "@/lib/workspaceRoutes"

import { useSurfaceTheme, type SurfaceTheme } from "@/shared/components/layout/ShellBackground"

const MOBILE_MENU_BUTTON_ID = "mobile-menu-button"

type NavLink = {
  href: string
  label: string
}

interface NavbarProps {
  navbarTheme?: SurfaceTheme
}

function Navbar({ navbarTheme }: NavbarProps = {}) {
  const router = useRouter()
  const [logout] = useLogoutMutation()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const { isOpen: mobileOpen, toggle, close } = useMobileMenu()
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const t = useT("nav")
  const pathname = usePathname()
  // Routes that run a focused, single-task flow. They drop the marketing links
  // and CTAs and keep only the chrome needed to get back out (Home) plus the
  // locale/theme controls, which stay reachable mid-flow.
  const isAuth = typeof pathname === "string" && pathname.startsWith("/auth")
  const isOnboarding =
    typeof pathname === "string" && pathname.startsWith("/onboarding")
  const isFocused = isAuth || isOnboarding
  const surfaceTheme = useSurfaceTheme()
  const activeSurfaceTheme = navbarTheme ?? surfaceTheme
  const isScrolled = useScrolledPast(20)

  // Mirrors the section order actually rendered by the home page
  // (features/home/components/pages/home.tsx). Hrefs are page-qualified so the
  // links still resolve from /onboarding, where the sections are absent.
  const navLinks: NavLink[] = [
    { href: "/#how-it-works", label: t("howItWorks", "How It Works") },
    { href: "/#features", label: t("features", "Features") },
    { href: "/#pricing", label: t("pricing", "Plans") },
    { href: "/#faq", label: t("faq", "FAQ") },
  ]

  const handleLogout = () => {
    // Local session is cleared synchronously inside the mutation's
    // onQueryStarted (FR-006); navigating away must not wait on the network.
    logout()
    router.push("/")
  }

  useBodyScrollLock(mobileOpen)

  // Escape listens on the document, not on the header's onKeyDown: once focus
  // leaves the header subtree (tapping the page behind the open panel blurs to
  // <body>) a bubbled handler never sees the key. Closing also returns focus to
  // the toggle so keyboard users aren't dropped at the top of the document.
  useEffect(() => {
    if (!mobileOpen) {
      return
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") {
        return
      }
      e.preventDefault()
      close()
      document.getElementById(MOBILE_MENU_BUTTON_ID)?.focus()
    }
    document.addEventListener("keydown", onEscape)
    return () => document.removeEventListener("keydown", onEscape)
  }, [mobileOpen, close])

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (mobileOpen) {
      close()
    }
    const hashIndex = href.indexOf("#")
    if (hashIndex === -1) {
      return
    }
    const hash = href.slice(hashIndex)
    if (hash === "#") {
      return
    }
    // Only hijack the click when the section exists on the current page. On
    // routes that don't render it, the Link navigates to /#<id> and the browser
    // resolves the anchor natively — no extra client logic needed.
    const target = document.querySelector(hash)
    if (!target) {
      return
    }
    e.preventDefault()
    scrollToElement(target)
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!mobileOpen) {
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
    [mobileOpen]
  )

  if (isWorkspacePath(pathname)) {
    return null
  }

  const topTransparent = !isScrolled && !mobileOpen
  const isDarkTop = topTransparent && activeSurfaceTheme === "dark"
  // On the home hero (light in both themes) the bar is a light area while it
  // sits transparent over the hero, so it reads the same in dark mode.
  const isHome = activeSurfaceTheme === "brand-light"
  const isLightTop = topTransparent && isHome
  // The hero's buttons: pill, 40px, Space Grotesk 15px semibold.
  const homeButton = isHome ? "min-h-10 rounded-full px-5 font-body text-[0.9375rem] font-semibold" : undefined

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
            // `relative` makes this the containing block for the mobile panel,
            // which is absolutely positioned so opening it cannot change the
            // header's height (see the panel below).
            "relative border rounded-2xl mx-3 sm:mx-0 transition-all duration-300 ease-out motion-reduce:transition-none",
            isScrolled || mobileOpen
              ? cn(
                  "border-light-blue-bg/60 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(18,49,77,0.15)]",
                  mobileOpen ? "bg-surface-elevated/95" : "bg-surface-elevated/75"
                )
              : "border-transparent bg-transparent shadow-none backdrop-blur-0"
          )}
        >
          <div
            className={cn(
              "flex h-14 items-center justify-between gap-3 px-4 sm:px-5",
              isDarkTop && "dark",
              isLightTop && "light"
            )}
          >
            <Logo />

            {!isFocused && (
              <nav
                aria-label={t("mainNavigation", "Main navigation")}
                className="hidden items-center gap-1 lg:flex"
              >
                {navLinks.map((link) => (
                  <NavLinks
                    key={link.href}
                    link={link}
                    brand={isHome}
                    onClick={(e) => handleNavClick(e, link.href)}
                  />
                ))}
              </nav>
            )}

            <div className="hidden items-center gap-2 lg:flex">
              <LanguageSwitcher />
              <ThemeToggle />
              {isFocused && (
                <Button variant="secondary" size="sm" href="/">
                  <Home className="h-4 w-4" aria-hidden="true" />
                  {t("home", "Home")}
                </Button>
              )}
              {!isFocused &&
                (isAuthenticated ? (
                  <>
                    <Button variant="primary" size="sm" href="/dashboard" className={homeButton}>
                      <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                      {t("dashboard", "Dashboard")}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleLogout} className={homeButton}>
                      <LogOut
                        className="h-4 w-4 rtl:-scale-x-100"
                        aria-hidden="true"
                      />
                      {t("logout", "Logout")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" size="sm" href="/auth" className={homeButton}>
                      {t("signIn", "Sign In")}
                    </Button>
                    <Button variant="primary" size="sm" href="/auth" className={homeButton}>
                      {t("startLearning", "Start Learning")}
                    </Button>
                  </>
                ))}
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              {!isFocused && !isAuthenticated && (
                <Button variant="primary" size="sm" href="/auth" className={homeButton}>
                  {t("start", "Start")}
                </Button>
              )}
              <MobileMenuButton
                id={MOBILE_MENU_BUTTON_ID}
                isOpen={mobileOpen}
                toggle={toggle}
              />
            </div>
          </div>

          <nav
            ref={mobileMenuRef}
            id="mobile-menu"
            aria-label={t("mobileNavigation", "Mobile navigation")}
            className={cn(
              // Absolute, not in flow. The header is `sticky`, which — unlike
              // `fixed` — keeps its box in normal flow and reserves its space,
              // so an in-flow panel grew the header and pushed the entire
              // document down by the panel's own height (~308px) on open.
              // Anchored with inset-x-0/top-full so it tracks the bar's width
              // and sits directly beneath it in both LTR and RTL.
              "absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border transition-all duration-300 ease-out motion-reduce:transition-none lg:hidden",
              // `invisible` (not just opacity-0) keeps the collapsed panel out
              // of the tab order and the accessibility tree.
              // Fully opaque: as a real overlay the panel now has page content
              // behind it, so the bar's translucent surface let the hero
              // heading read straight through the menu.
              mobileOpen
                ? "max-h-[32rem] border-light-blue-bg/60 bg-surface-elevated opacity-100 shadow-[0_8px_32px_-8px_rgba(18,49,77,0.15)]"
                : "invisible max-h-0 border-transparent opacity-0"
            )}
          >
            <div className="flex flex-col gap-3 p-4">
              {!isFocused &&
                navLinks.map((link) => (
                  <NavLinks
                    key={link.href}
                    link={link}
                    onClick={(e) => handleNavClick(e, link.href)}
                    mobile
                  />
                ))}

              {isFocused && (
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

              {!isFocused &&
                (isAuthenticated ? (
                  <>
                    <Button
                      variant="primary"
                      className="w-full"
                      href="/dashboard"
                      onClick={close}
                    >
                      <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                      {t("dashboard", "Dashboard")}
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => {
                        close()
                        handleLogout()
                      }}
                    >
                      <LogOut
                        className="h-4 w-4 rtl:-scale-x-100"
                        aria-hidden="true"
                      />
                      {t("logout", "Logout")}
                    </Button>
                  </>
                ) : (
                  // The compact "Get Started" CTA already sits in the mobile
                  // header bar, so the panel carries Sign In — otherwise
                  // returning users have no way to reach it on small screens.
                  <Button
                    variant="secondary"
                    className="w-full"
                    href="/auth"
                    onClick={close}
                  >
                    {t("signIn", "Sign In")}
                  </Button>
                ))}
            </div>
          </nav>
        </div>
      </Container>
    </header>
  )
}

export { Navbar }