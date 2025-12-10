import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/shared/utils/cn"

export type ToastType = "default" | "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastProps extends Toast {
  onDismiss: (id: string) => void
}

const icons = {
  default: null,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const variantStyles = {
  default: "bg-background border",
  success: "bg-success/10 border-success/20 text-success-foreground",
  error: "bg-destructive/10 border-destructive/20 text-destructive",
  warning: "bg-warning/10 border-warning/20 text-warning-foreground",
  info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100",
}

const iconStyles = {
  default: "text-foreground",
  success: "text-success",
  error: "text-destructive",
  warning: "text-warning",
  info: "text-blue-500",
}

function ToastItem({ id, type, title, description, action, onDismiss }: ToastProps) {
  const Icon = icons[type]

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm rounded-lg border shadow-lg",
        "animate-in slide-in-from-right-full fade-in-0 duration-300",
        variantStyles[type]
      )}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        {Icon && (
          <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", iconStyles[type])} />
        )}
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="text-sm font-medium text-primary hover:underline mt-2"
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onDismiss(id)}
          className="shrink-0 rounded-md p-1 hover:bg-muted/50 transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}

// Toast Container
interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
}

function ToastContainer({
  toasts,
  onDismiss,
  position = "bottom-right",
}: ToastContainerProps) {
  const positionStyles = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  }

  return (
    <div
      className={cn(
        "fixed z-[100] flex flex-col gap-2 pointer-events-none",
        positionStyles[position]
      )}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

export { ToastItem, ToastContainer }
