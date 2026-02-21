import * as React from "react"
import { cn } from "@/lib/utils"

export interface MinimalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

export const MinimalCard = React.forwardRef<HTMLDivElement, MinimalCardProps>(
  ({ className, hoverable = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[1.25rem] border border-border/40 bg-card p-6 md:p-8 text-card-foreground shadow-sm transition-all duration-300",
          hoverable && "hover:-translate-y-1 hover:shadow-md hover:border-border/60",
          className
        )}
        {...props}
      />
    )
  }
)
MinimalCard.displayName = "MinimalCard"
