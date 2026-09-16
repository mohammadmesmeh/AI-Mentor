import { cva, type VariantProps } from "class-variance-authority"
import { motion, type MotionProps } from "framer-motion"

import { cn } from "@/lib/utils"
import { Link } from "@/i18n/navigation"

const buttonVariants = cva(
  "font-ui inline-flex shrink-0 items-center cursor-pointer justify-center gap-2 rounded-md text-sm font-medium text-center leading-tight transition-colors duration-200 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/80 shadow-xs hover:shadow-md hover:shadow-primary/20 hover:scale-[1.02]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-md hover:scale-[1.02]",
      },
      size: {
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 px-3 py-1.5 text-xs",
        lg: "min-h-10 px-6 py-2.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

interface ButtonProps
  extends VariantProps<typeof buttonVariants>,
    Omit<React.ComponentPropsWithoutRef<"button">, "onClick" | keyof MotionProps> {
  children: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>
  href?: string
  className?: string
}

const tapConfig = { scale: 0.92 }
const tapTransition = { type: "spring" as const, stiffness: 400, damping: 17 }

const Button = ({
  variant,
  size,
  children,
  href,
  className,
  onClick,
  ...props
}: ButtonProps) => {
  if (href) {
    return (
      <motion.span
        className="inline-flex"
        whileTap={tapConfig}
        transition={tapTransition}
      >
        <Link
          href={href}
          onClick={onClick}
          className={cn(buttonVariants({ variant, size, className }))}
        >
          {children}
        </Link>
      </motion.span>
    )
  }

  return (
    <motion.button
      {...props}
      onClick={onClick}
      className={cn(buttonVariants({ variant, size, className }))}
      whileTap={tapConfig}
      transition={tapTransition}
    >
      {children}
    </motion.button>
  )
}

export { Button, buttonVariants }
