import * as React from "react"
import { ToastContainer, type Toast } from "@/shared/components/ui/toast"

interface ToastContextValue {
  toast: (options: Omit<Toast, "id">) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  dismiss: (id: string) => void
  dismissAll: () => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
  defaultDuration?: number
  maxToasts?: number
}

export function ToastProvider({
  children,
  position = "bottom-right",
  defaultDuration = 5000,
  maxToasts = 5,
}: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const timersRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = React.useCallback((id: string) => {
    // Clear any existing timer
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    // Remove toast
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const dismissAll = React.useCallback(() => {
    // Clear all timers
    timersRef.current.forEach((timer) => clearTimeout(timer))
    timersRef.current.clear()
    // Remove all toasts
    setToasts([])
  }, [])

  const toast = React.useCallback(
    (options: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const duration = options.duration ?? defaultDuration

      // Add toast
      setToasts((prev) => {
        const newToasts = [...prev, { ...options, id }]
        // Limit number of toasts
        if (newToasts.length > maxToasts) {
          const removed = newToasts.shift()
          if (removed) {
            const timer = timersRef.current.get(removed.id)
            if (timer) {
              clearTimeout(timer)
              timersRef.current.delete(removed.id)
            }
          }
        }
        return newToasts
      })

      // Auto-dismiss after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          dismiss(id)
        }, duration)
        timersRef.current.set(id, timer)
      }

      return id
    },
    [defaultDuration, maxToasts, dismiss]
  )

  const success = React.useCallback(
    (title: string, description?: string) => {
      toast({ type: "success", title, description })
    },
    [toast]
  )

  const error = React.useCallback(
    (title: string, description?: string) => {
      toast({ type: "error", title, description, duration: 8000 }) // Longer for errors
    },
    [toast]
  )

  const warning = React.useCallback(
    (title: string, description?: string) => {
      toast({ type: "warning", title, description })
    },
    [toast]
  )

  const info = React.useCallback(
    (title: string, description?: string) => {
      toast({ type: "info", title, description })
    },
    [toast]
  )

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const value = React.useMemo(
    () => ({
      toast,
      success,
      error,
      warning,
      info,
      dismiss,
      dismissAll,
    }),
    [toast, success, error, warning, info, dismiss, dismissAll]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} position={position} />
    </ToastContext.Provider>
  )
}
