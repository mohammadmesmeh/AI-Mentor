"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const navLinkStyles = {
  // Arabic labels run longer than their English counterparts, so the desktop
  // padding stays tight until xl — at lg the bar has ~944px to fit the logo,
  // four links and the action cluster without wrapping or overflowing.
  desktop: {
    base: "font-ui whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium xl:px-4",
    active: "text-foreground font-semibold",
    inactive: "text-muted-foreground",
  },
  mobile: {
    base: "font-ui rounded-md px-3 py-2 text-sm font-medium",
    active: "text-foreground font-semibold",
    inactive: "text-muted-foreground",
  },
  // The home hero's navbar (design: docs/design/hero-light): 15px in
  // primary navy, in the site's UI font; light text in dark mode.
  brand: {
    base: "font-ui whitespace-nowrap rounded-full px-3 py-1.5 text-[0.9375rem] font-medium xl:px-4",
    active: "text-primary font-semibold dark:text-foreground",
    inactive: "text-primary dark:text-foreground",
  },
} as const

type NavLink = {
  href: string
  label: string
}

type NavLinksProps = {
  mobile?: boolean
  /** Desktop links on the home hero. */
  brand?: boolean
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  link: NavLink
}

const tapConfig = { scale: 0.97 }
const tapTransition = { type: "spring" as const, stiffness: 400, damping: 17 }

export const NavLinks = ({
  mobile = false,
  brand = false,
  onClick,
  link,
}: NavLinksProps) => {
  const pathname = usePathname()
  const isActive = pathname === link.href

  const styles = mobile
    ? navLinkStyles.mobile
    : brand
      ? navLinkStyles.brand
      : navLinkStyles.desktop

  return (
    <motion.span
      className={cn(mobile ? "block" : "inline-block")}
      whileTap={tapConfig}
      transition={tapTransition}
    >
      <Link
        href={link.href}
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group relative isolate inline-flex items-center",
          "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          styles.base
        )}
      >
        {/* Text */}
        <span
          className={cn(
            "relative z-10 transition-colors duration-200",
            isActive
              ? styles.active
              : cn(
                  styles.inactive,
                  "[@media(hover:hover)]:group-hover:text-primary",
                  "group-focus-visible:text-primary",
                  "group-active:text-primary"
                )
          )}
        >
          {link.label}
        </span>

        {/*
          Underline indicator. For the active link it stays visible;
          for inactive links it grows from the center on hover/press.
          Gated to [@media(hover:hover)] so touch devices never show
          a "stuck" hover state.
        */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-3 -bottom-1 h-[2px] origin-center rounded-full transition-transform duration-300",
            !mobile && "xl:inset-x-4",
            "bg-gradient-to-r from-primary/30 via-primary to-primary/30",
            isActive
              ? "scale-x-100"
              : "scale-x-0 [@media(hover:hover)]:group-hover:scale-x-100 group-focus-visible:scale-x-100 group-active:scale-x-100"
          )}
          style={{ transitionTimingFunction: "var(--ease-out-soft)" }}
        />
      </Link>
    </motion.span>
  )
}
