// "use client"

// import { Link, usePathname } from "@/i18n/navigation"
// import { cn } from "@/lib/utils"
// import { motion } from "framer-motion"

// const navLinkStyles = {
//   desktop: {
//     base: "rounded-lg px-4 py-1.5 text-sm font-medium",
//     active: "text-foreground font-semibold",
//     inactive: "text-muted-foreground",
//   },
//   mobile: {
//     base: "rounded-lg px-3 py-2 text-sm font-medium",
//     active: "text-foreground font-semibold",
//     inactive: "text-muted-foreground",
//   },
// } as const

// type NavLink = {
//   href: string
//   label: string
// }

// type NavLinksProps = {
//   mobile?: boolean
//   onClick?: () => void
//   link: NavLink
// }

// const tapConfig = { scale: 0.97 }
// const tapTransition = { type: "spring" as const, stiffness: 400, damping: 17 }

// export const NavLinks = ({
//   mobile = false,
//   onClick,
//   link,
// }: NavLinksProps) => {
//   const pathname = usePathname()
//   const isActive = pathname === link.href

//   const styles = mobile
//     ? navLinkStyles.mobile
//     : navLinkStyles.desktop

//   return (
//     <motion.span
//       className={cn(mobile ? "block" : "inline-block")}
//       whileTap={tapConfig}
//       transition={tapTransition}
//     >
//       <Link
//         href={link.href}
//         onClick={onClick}
//         className={cn(
//           "group relative isolate",
//           styles.base
//         )}
//       >
//         {/*
//           Ambient glow behind the pill, square-cornered edges (rounded-lg)
//           instead of the fully round pill. Hover-only on desktop via
//           [@media(hover:hover)] so it never appears — or gets stuck — on
//           touch devices; group-active covers mobile press instead.
//         */}
//         <span
//           aria-hidden
//           className={cn(
//             "pointer-events-none absolute inset-0 -z-10 rounded-[inherit]",
//             "bg-primary/25 blur-md opacity-0 scale-90",
//             "transition-all duration-500",
//             isActive
//               ? "opacity-100 scale-100"
//               : cn(
//                   "[@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:scale-100",
//                   "group-active:opacity-100 group-active:scale-100"
//                 )
//           )}
//           style={{ transitionTimingFunction: "var(--ease-out-soft)" }}
//         />

//         {/* Background pill — square corners, gradient fill */}
//         <span
//           className={cn(
//             "absolute inset-0 rounded-[inherit] transition-all duration-300",
//             isActive
//               ? "scale-100 bg-gradient-to-b from-primary/14 to-primary/8 opacity-100"
//               : cn(
//                   "scale-[0.85] bg-gradient-to-b from-primary/12 to-primary/6 opacity-0",
//                   "[@media(hover:hover)]:group-hover:scale-100 [@media(hover:hover)]:group-hover:opacity-100",
//                   "group-active:scale-100 group-active:opacity-100"
//                 )
//           )}
//           style={{ transitionTimingFunction: "var(--ease-out-soft)" }}
//         />

//         {/* Text */}
//         <span
//           className={cn(
//             "relative z-10 transition-colors duration-200",
//             isActive
//               ? styles.active
//               : cn(
//                   styles.inactive,
//                   "[@media(hover:hover)]:group-hover:text-foreground",
//                   "group-active:text-foreground"
//                 )
//           )}
//         >
//           {link.label}
//         </span>
//       </Link>
//     </motion.span>
//   )
// }

// "use client"

// import { Link, usePathname } from "@/i18n/navigation"
// import { cn } from "@/lib/utils"
// import { motion } from "framer-motion"

// const navLinkStyles = {
//   desktop: {
//     base: "px-4 py-2 text-sm font-medium rounded-lg",
//     active: "text-foreground font-semibold",
//     inactive: "text-muted-foreground",
//   },
//   mobile: {
//     base: "px-3 py-2.5 text-sm font-medium rounded-lg",
//     active: "text-foreground font-semibold",
//     inactive: "text-muted-foreground",
//   },
// } as const

// type NavLink = {
//   href: string
//   label: string
// }

// type NavLinksProps = {
//   mobile?: boolean
//   onClick?: () => void
//   link: NavLink
// }

// const tapConfig = { scale: 0.96 }

// const tapTransition = {
//   type: "spring" as const,
//   stiffness: 400,
//   damping: 18,
// }


// export const NavLinks = ({
//   mobile = false,
//   onClick,
//   link,
// }: NavLinksProps) => {

//   const pathname = usePathname()
//   const isActive = pathname === link.href

//   const styles = mobile
//     ? navLinkStyles.mobile
//     : navLinkStyles.desktop


//   return (
//     <motion.span
//       className={cn(
//         mobile ? "block" : "inline-flex"
//       )}
//       whileTap={tapConfig}
//       transition={tapTransition}
//     >

//       <Link
//         href={link.href}
//         onClick={onClick}
//         className={cn(
//           "group relative isolate overflow-visible",
//           styles.base
//         )}
//       >

//         {/* Gradient glow border */}
//         <span
//           aria-hidden
//           className={cn(
//             `
//             absolute
//             -inset-[1px]
//             rounded-[inherit]
//             bg-gradient-to-r
//             from-primary-400
//             via-primary-500
//             to-primary-700
//             blur-md
//             opacity-0
//             transition-all
//             duration-500
//             `,
//             isActive
//               ? "opacity-70"
//               : `
//               [@media(hover:hover)]:group-hover:opacity-80
//               group-active:opacity-80
//               `
//           )}
//         />


//         {/* Glass background */}
//         <span
//           aria-hidden
//           className={cn(
//             `
//             absolute
//             inset-0
//             rounded-[inherit]
//             border
//             border-primary/10
//             bg-background/60
//             backdrop-blur-xl
//             transition-all
//             duration-300
//             `,
//             isActive
//               ? `
//               border-primary/30
//               bg-primary/10
//               `
//               :
//               `
//               [@media(hover:hover)]:group-hover:border-primary/30
//               [@media(hover:hover)]:group-hover:bg-primary/5
//               `
//           )}
//         />


//         {/* Inner soft glow */}
//         <span
//           aria-hidden
//           className={cn(
//             `
//             absolute
//             inset-0
//             rounded-[inherit]
//             bg-gradient-to-r
//             from-primary/10
//             to-primary/5
//             opacity-0
//             transition-opacity
//             duration-300
//             `,
//             isActive
//               ? "opacity-100"
//               :
//               `
//               [@media(hover:hover)]:group-hover:opacity-100
//               group-active:opacity-100
//               `
//           )}
//         />


//         {/* Text */}
//         <span
//           className={cn(
//             `
//             relative
//             z-10
//             transition-colors
//             duration-200
//             `,
//             isActive
//               ? styles.active
//               :
//               cn(
//                 styles.inactive,
//                 `
//                 [@media(hover:hover)]:group-hover:text-foreground
//                 group-active:text-foreground
//                 `
//               )
//           )}
//         >
//           {link.label}
//         </span>


//       </Link>

//     </motion.span>
//   )
// }
"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const navLinkStyles = {
  desktop: {
    base: "rounded-full px-4 py-1.5 text-sm font-medium",
    active: "text-foreground font-semibold",
    inactive: "text-muted-foreground",
  },
  mobile: {
    base: "rounded-md px-3 py-2 text-sm font-medium",
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
  onClick?: () => void
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
                  "[@media(hover:hover)]:group-hover:text-foreground",
                  "group-active:text-foreground"
                )
          )}
        >
          {link.label}
        </span>

        {/*
          Active indicator: a slim gradient underline that glides between
          links via a shared layoutId, instead of fading in place — reads
          as a single moving element rather than one popping in per link.
        */}
        {isActive && (
          <motion.span
            layoutId="nav-underline"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="absolute inset-x-3 -bottom-1 h-[2px] rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/40"
          />
        )}

        {/*
          Hover-only underline for inactive links. Grows from the center
          out. Gated to [@media(hover:hover)] so touch devices never show
          a "stuck" hover state; group-active gives touch its own press
          feedback instead.
        */}
        {!isActive && (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-3 -bottom-1 h-[2px] origin-center scale-x-0 rounded-full",
              "bg-gradient-to-r from-primary/30 via-primary to-primary/30",
              "transition-transform duration-300",
              "[@media(hover:hover)]:group-hover:scale-x-100",
              "group-active:scale-x-100"
            )}
            style={{ transitionTimingFunction: "var(--ease-out-soft)" }}
          />
        )}
      </Link>
    </motion.span>
  )
}