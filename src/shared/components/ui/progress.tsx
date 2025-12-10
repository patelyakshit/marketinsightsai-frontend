import * as React from "react"
import { cn } from "@/shared/utils/cn"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
  variant?: "default" | "success" | "warning" | "destructive"
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, showLabel = false, size = "md", variant = "default", ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))

    const sizeClasses = {
      sm: "h-1",
      md: "h-2",
      lg: "h-3",
    }

    const variantClasses = {
      default: "bg-primary",
      success: "bg-success",
      warning: "bg-warning",
      destructive: "bg-destructive",
    }

    return (
      <div className={cn("w-full", className)} ref={ref} {...props}>
        <div
          className={cn(
            "w-full overflow-hidden rounded-full bg-primary/20",
            sizeClasses[size]
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300 ease-in-out",
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <div className="mt-1 text-xs text-muted-foreground text-right">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    )
  }
)
Progress.displayName = "Progress"

// Indeterminate progress for unknown duration
const IndeterminateProgress = React.forwardRef<
  HTMLDivElement,
  Omit<ProgressProps, "value" | "max" | "showLabel">
>(({ className, size = "md", variant = "default", ...props }, ref) => {
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  }

  const variantClasses = {
    default: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
  }

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-primary/20",
        sizeClasses[size],
        className
      )}
      ref={ref}
      {...props}
    >
      <div
        className={cn(
          "h-full w-1/3 rounded-full animate-indeterminate",
          variantClasses[variant]
        )}
      />
    </div>
  )
})
IndeterminateProgress.displayName = "IndeterminateProgress"

export { Progress, IndeterminateProgress }
