import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const navLinkStyles = {
  desktop: {
    base: "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
    active: "text-foreground font-semibold",
    inactive: "text-muted-foreground hover:text-foreground",
  },
  mobile: {
    base: "rounded-md px-3 py-2 text-sm font-medium transition-colors",
    active: "bg-muted text-foreground font-semibold",
    inactive: "text-muted-foreground hover:bg-muted hover:text-foreground",
  },
} as const

type NavLink = {
  href: string
  label: string
}

type NavLinksProps = {
  mobile?: boolean
  onClick?: () => void
  link: NavLink
}

const tapConfig = { scale: 0.95 }
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
        className={cn(
          "group relative overflow-hidden",
          styles.base
        )}
      >
        <span
          className={cn(
            "absolute inset-0 rounded-[inherit] transition-transform duration-300 ease-out",
            mobile ? "origin-center" : "origin-bottom",
            isActive
              ? "scale-100 bg-primary/10"
              : "scale-0 bg-muted group-hover:scale-100"
          )}
        />

        <span
          className={cn(
            "relative z-10 transition-colors duration-200",
            isActive
              ? styles.active
              : styles.inactive
          )}
        >
          {link.label}
        </span>
      </Link>
    </motion.span>
  )
}