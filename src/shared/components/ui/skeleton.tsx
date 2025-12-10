import { cn } from "@/shared/utils/cn"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "rectangular"
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-none",
        variant === "default" && "rounded-md",
        className
      )}
      {...props}
    />
  )
}

// Pre-built skeleton patterns
function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && "w-4/5" // Last line is shorter
          )}
        />
      ))}
    </div>
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border p-4 space-y-3", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}

function SkeletonMessage({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "rounded-lg p-3 space-y-2",
          isUser ? "bg-primary/10 w-2/3" : "w-3/4"
        )}
      >
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        {!isUser && <Skeleton className="h-4 w-2/3" />}
      </div>
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonMessage }
