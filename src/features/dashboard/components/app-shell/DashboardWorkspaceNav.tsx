"use client"

import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { LogOut, Menu, X } from "lucide-react"

import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { apiSlice, useLogoutMutation } from "@/lib/api/apiSlice"
import { WORKSPACE_ROUTES } from "@/lib/workspaceRoutes"
import { useT } from "@/shared/hooks/useT"
import { LanguageSwitcher } from "@/shared/components/ui/LanguageSwitcher"
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle"
import { Avatar } from "@/shared/components/ui/Avatar"
import { BrandLogo } from "@/shared/components/ui/BrandLogo"
import { cn } from "@/lib/utils"
import type { RootState } from "@/redux/store"
import { WORKSPACE_NAV, isActive, type NavItem } from "./navItems"

// Read from the cache only: the sidebar never requests the roadmap itself.
const selectActiveRoadmap = apiSlice.endpoints.getActiveRoadmap.select()

const itemClass = (active: boolean) =>
  cn(
    "flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm no-underline transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    active
      ? "bg-primary-900 font-semibold text-white dark:bg-secondary-300/15 dark:text-ink"
      : "font-medium text-ink hover:bg-segment"
  )

function WorkspaceLink({ item, active, label, badge }: { item: NavItem; active: boolean; label: string; badge?: number }) {
  const Icon = item.icon
  return (
    <Link href={item.href} aria-current={active ? "page" : undefined} className={itemClass(active)}>
      <Icon
        className={cn("size-[1.125rem] shrink-0", active ? "text-secondary-100" : "text-status-neutral")}
        aria-hidden="true"
      />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className={cn("text-[0.8125rem] font-semibold tabular-nums", active ? "text-white/75" : "text-status-neutral")}>
          {badge}
        </span>
      )}
    </Link>
  )
}

/** The brand: the Khatwa logo, linking home (light/dark version follows the theme). */
function WorkspaceBrand() {
  const t = useT("nav")
  return (
    <Link
      href="/"
      title={t("brand", "Khatwa")}
      className="flex min-h-11 items-center rounded-md px-2 no-underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span dir="ltr">
        <BrandLogo className="h-10" />
      </span>
    </Link>
  )
}

function NavSections({ pathname }: { pathname: string }) {
  const t = useT("workspace")
  const roadmap = useSelector((state: RootState) => selectActiveRoadmap(state).data)
  const taskCount = roadmap?.progress?.totalTasks
  return (
    <div className="flex flex-col gap-6">
      {WORKSPACE_NAV.map((group) => (
        <div key={group.labelKey}>
          <p className="m-0 px-3 pb-1.5 text-xs font-bold text-muted-foreground">{t(group.labelKey)}</p>
          <ul className="m-0 list-none space-y-1 p-0">
            {group.items.map((item) => (
              <li key={item.href}>
                <WorkspaceLink
                  item={item}
                  active={isActive(pathname, item.href)}
                  label={t(item.labelKey)}
                  badge={item.href === WORKSPACE_ROUTES.tasks ? taskCount : undefined}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

/**
 * The learner card and sign-out. The site navbar is hidden in the workspace,
 * so sign-out lives here. The local session ends at once (contract §3 rule 7);
 * the revoke call runs in the background.
 */
function AccountFooter() {
  const t = useT("nav")
  const router = useRouter()
  const [logout] = useLogoutMutation()
  const user = useSelector((state: RootState) => state.auth.user)
  const authenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  if (!authenticated) return null
  return (
    <div className="flex flex-col gap-2">
      {user && (
        <div className="flex items-center gap-3 rounded-icon border border-line p-3">
          <Avatar name={user.name} className="size-9 text-[0.9375rem]" />
          <div className="min-w-0">
            <p dir="auto" className="m-0 truncate text-sm font-semibold text-ink">
              {user.name}
            </p>
            <p dir="ltr" className="m-0 truncate text-start text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          void logout()
          router.push("/")
        }}
        className={cn(itemClass(false), "cursor-pointer")}
      >
        <LogOut className="size-[1.125rem] shrink-0 text-status-neutral rtl:-scale-x-100" aria-hidden="true" />
        <span>{t("logout", "Log Out")}</span>
      </button>
    </div>
  )
}

function DashboardWorkspaceNav() {
  const t = useT("dashboard")
  const pathname = usePathname() ?? ""
  const [open, setOpen] = useState(false)
  const learnerName = useSelector((state: RootState) => state.auth.user?.name)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  // Close the drawer when a link navigates (state adjusted during render).
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    // Move focus into the drawer; Escape closes it and returns focus to the toggle.
    drawerRef.current?.querySelector<HTMLElement>("[role=dialog] a, [role=dialog] button")?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open])

  const navLabel = t("navLabel", "Learning workspace navigation")
  const close = () => {
    setOpen(false)
    toggleRef.current?.focus()
  }

  return (
    <>
      <aside className="glass-bar fixed inset-y-0 start-0 z-40 hidden w-66 flex-col gap-7 overflow-y-auto border-e px-4 py-5 lg:flex">
        <WorkspaceBrand />
        <nav aria-label={navLabel}>
          <NavSections pathname={pathname} />
        </nav>
        <div className="mt-auto">
          <AccountFooter />
        </div>
      </aside>

      <header className="glass-bar sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls="dashboard-nav-drawer"
            aria-label={open ? t("navMenuCloseAria", "Close navigation") : t("navMenuOpenAria", "Open navigation")}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-md border border-line bg-glass-strong text-ink transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
          <WorkspaceBrand />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          {learnerName && <Avatar name={learnerName} className="size-9" />}
        </div>
      </header>

      <div
        id="dashboard-nav-drawer"
        ref={drawerRef}
        // Out of the tab order and the accessibility tree while closed.
        inert={!open}
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300 motion-reduce:transition-none lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="absolute inset-0 bg-primary-950/40" onClick={close} aria-hidden="true" />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={navLabel}
          className={cn(
            "absolute inset-y-0 start-0 flex w-72 max-w-[85%] flex-col gap-6 overflow-y-auto border-e border-line bg-background px-4 py-4 shadow-lg transition-transform duration-300 motion-reduce:transition-none",
            open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
          )}
        >
          <div className="flex items-center justify-between">
            <WorkspaceBrand />
            <button
              type="button"
              aria-label={t("navMenuCloseAria", "Close navigation")}
              onClick={close}
              className="inline-flex size-11 cursor-pointer items-center justify-center rounded-md text-status-neutral transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label={navLabel}>
            <NavSections pathname={pathname} />
          </nav>
          <div className="mt-auto flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <LanguageSwitcher mobile />
              <ThemeToggle mobile />
            </div>
            <AccountFooter />
          </div>
        </div>
      </div>
    </>
  )
}

export { DashboardWorkspaceNav }
