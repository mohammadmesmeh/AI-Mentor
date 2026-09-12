"use client"

import { usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

const authSurface =
  "relative flex flex-1 flex-col bg-[radial-gradient(85%_65%_at_50%_100%,#BFE7FC_0%,#D8F0FE_45%,#F0F8FF_75%,#FFFFFF_100%)]"

interface ShellBackgroundProps {
  children: React.ReactNode
  decor?: React.ReactNode
}

function ShellBackground({ children, decor }: ShellBackgroundProps) {
  const pathname = usePathname()
  const isAuth = typeof pathname === "string" && pathname.startsWith("/auth")

  return (
    <div className={cn("flex flex-1 flex-col", isAuth && authSurface)}>
      {isAuth && decor}
      {children}
    </div>
  )
}

export { ShellBackground }