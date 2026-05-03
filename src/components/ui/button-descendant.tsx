import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

interface ButtonDescendantProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "iconLg"
  onClick?: (e: React.MouseEvent) => void
}

const variants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        xs: "h-6 px-2 py-1 text-[8px]",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        iconLg: "h-8 w-8 [&_svg]:size-5 [&_svg]:shrink-0 p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface Props
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof variants> {
  asChild?: boolean
}

const ButtonDescendant = React.forwardRef<HTMLElement, ButtonDescendantProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "span"

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (onClick) {
        onClick(e)
      }
    }
    return (
      <Comp
        className={cn(variants({ variant, size, className }))}
        ref={ref}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            if (onClick) {
              const mouseEvent = new MouseEvent("click", {
                view: window,
                bubbles: true,
                cancelable: true,
              })
              ;(e.target as HTMLElement).dispatchEvent(mouseEvent)
            }
          }
        }}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
ButtonDescendant.displayName = "ButtonDescendant";

export { ButtonDescendant, variants as buttonVariants }
