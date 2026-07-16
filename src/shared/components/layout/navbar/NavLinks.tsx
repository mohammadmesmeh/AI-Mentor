import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

type NavLink = {
  href: string
  label: string
}

type NavLinksProps = {
  mobile?: boolean
  onClick?: () => void
  link: NavLink
}

export const NavLinks = ({ 
  mobile = false, 
  onClick, 
  link 
}: NavLinksProps) => {
  const pathname = usePathname()

  return (
    <Link
      key={link.href}
      href={link.href}
      onClick={onClick}
      className={cn(
        mobile
          ? "rounded-md px-3 py-2 text-sm font-medium"
          : "text-sm font-medium",
        pathname === link.href
          ? "text-foreground font-semibold"
          : "text-muted-foreground"
      )}
    >
      {link.label}
    </Link>
  )
}