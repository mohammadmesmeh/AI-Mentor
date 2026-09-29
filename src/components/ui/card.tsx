import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva("text-card-foreground", {
  variants: {
    variant: {
      default: "rounded-xl border bg-card shadow-card",
      /** Workspace surface: translucent, blurred, 16px radius. */
      glass: "glass rounded-lg",
      /** A placeholder for something that isn't available yet ("coming soon"). */
      dashed: "rounded-lg border border-dashed border-status-neutral/40 bg-glass-strong/50",
    },
  },
  defaultVariants: { variant: "default" },
})

type CardProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof cardVariants> & {
    /** A landmark card (`section`, labelled by its title) or a plain `div`. */
    as?: "div" | "section" | "article" | "li"
  }

const Card = React.forwardRef<HTMLElement, CardProps>(
  ({ className, variant, as: Tag = "div", ...props }, ref) => (
    <Tag
      ref={ref as React.Ref<never>}
      data-slot="card"
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-header"
    className={cn("flex flex-col gap-1 p-5 sm:p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

/** Card titles use the body font, semibold (only page h1s use the display font). */
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { as?: "h2" | "h3" }
>(({ className, as: Tag = "h3", ...props }, ref) => (
  <Tag
    ref={ref}
    data-slot="card-title"
    className={cn("m-0 font-sans text-base font-semibold text-ink sm:text-[1.0625rem]", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="card-description"
    className={cn("m-0 text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="card-content" className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-footer"
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
