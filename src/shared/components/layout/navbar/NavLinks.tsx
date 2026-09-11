"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const navLinkStyles = {
  desktop: {
    base: "font-ui rounded-full px-4 py-1.5 text-sm font-medium",
    active: "text-foreground font-semibold",
    inactive: "text-muted-foreground",
  },
  mobile: {
    base: "font-ui rounded-md px-3 py-2 text-sm font-medium",
    active: "text-foreground font-semibold",
    inactive: "text-muted-foreground",
  },
} as const

type NavLink = {
  href: string
  label: string
}

type NavLinksProps = {
  mobile?: boolean
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  link: NavLink
}

const tapConfig = { scale: 0.97 }
const tapTransition = { type: "spring" as const, stiffness: 400, damping: 17 }

export const NavLinks = ({
  mobile = false,
  onClick,
  link,
}: NavLinksProps) => {
  const pathname = usePathname()
  const isActive = pathname === link.href

  const styles = mobile
    ? navLinkStyles.mobile
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
            "bg-gradient-to-r from-primary/30 via-primary to-primary/30",
            isActive
              ? "scale-x-100"
              : "scale-x-0 [@media(hover:hover)]:group-hover:scale-x-100 group-active:scale-x-100"
          )}
          style={{ transitionTimingFunction: "var(--ease-out-soft)" }}
        />
      </Link>
    </motion.span>
  )
}
