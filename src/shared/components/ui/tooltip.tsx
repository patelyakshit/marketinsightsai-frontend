import * as React from "react"
import { cn } from "@/shared/utils/cn"

// Context for tooltip state
interface TooltipContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null)

function useTooltipContext() {
  const context = React.useContext(TooltipContext)
  if (!context) {
    throw new Error("Tooltip components must be used within a TooltipProvider")
  }
  return context
}

// Provider component
interface TooltipProviderProps {
  children: React.ReactNode
  delayDuration?: number
}

function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>
}

// Root tooltip component
interface TooltipProps {
  children: React.ReactNode
  delayDuration?: number
}

function Tooltip({ children, delayDuration = 200 }: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleOpen = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setIsOpen(true), delayDuration)
  }, [delayDuration])

  const handleClose = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(false)
  }, [])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Attach event listeners to trigger
  React.useEffect(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    trigger.addEventListener("mouseenter", handleOpen)
    trigger.addEventListener("mouseleave", handleClose)
    trigger.addEventListener("focus", handleOpen)
    trigger.addEventListener("blur", handleClose)

    return () => {
      trigger.removeEventListener("mouseenter", handleOpen)
      trigger.removeEventListener("mouseleave", handleClose)
      trigger.removeEventListener("focus", handleOpen)
      trigger.removeEventListener("blur", handleClose)
    }
  }, [handleOpen, handleClose])

  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen, triggerRef, contentRef }}>
      {children}
    </TooltipContext.Provider>
  )
}

// Trigger component
interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

function TooltipTrigger({ children, asChild }: TooltipTriggerProps) {
  const { triggerRef } = useTooltipContext()

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>, {
      ref: triggerRef as React.Ref<HTMLElement>,
    })
  }

  return (
    <span ref={triggerRef as React.RefObject<HTMLSpanElement>} className="inline-block">
      {children}
    </span>
  )
}

// Content component
interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  sideOffset?: number
}

function TooltipContent({
  children,
  side = "top",
  align = "center",
  sideOffset = 8,
  className,
  ...props
}: TooltipContentProps) {
  const { isOpen, triggerRef, contentRef } = useTooltipContext()
  const [position, setPosition] = React.useState({ top: 0, left: 0 })

  React.useEffect(() => {
    if (!isOpen || !triggerRef.current || !contentRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const contentRect = contentRef.current.getBoundingClientRect()

    let top = 0
    let left = 0

    switch (side) {
      case "top":
        top = triggerRect.top - contentRect.height - sideOffset
        break
      case "bottom":
        top = triggerRect.bottom + sideOffset
        break
      case "left":
        left = triggerRect.left - contentRect.width - sideOffset
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2
        break
      case "right":
        left = triggerRect.right + sideOffset
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2
        break
    }

    if (side === "top" || side === "bottom") {
      switch (align) {
        case "start":
          left = triggerRect.left
          break
        case "center":
          left = triggerRect.left + (triggerRect.width - contentRect.width) / 2
          break
        case "end":
          left = triggerRect.right - contentRect.width
          break
      }
    }

    setPosition({ top, left })
  }, [isOpen, side, align, sideOffset, triggerRef, contentRef])

  if (!isOpen) return null

  return (
    <div
      ref={contentRef}
      className={cn(
        "fixed z-50 px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
      style={{
        top: position.top,
        left: position.left,
      }}
      role="tooltip"
      {...props}
    >
      {children}
      {/* Arrow */}
      <div
        className={cn(
          "absolute w-2 h-2 bg-primary rotate-45",
          side === "top" && "bottom-[-4px] left-1/2 -translate-x-1/2",
          side === "bottom" && "top-[-4px] left-1/2 -translate-x-1/2",
          side === "left" && "right-[-4px] top-1/2 -translate-y-1/2",
          side === "right" && "left-[-4px] top-1/2 -translate-y-1/2"
        )}
      />
    </div>
  )
}

// Simple all-in-one tooltip for convenience
interface SimpleTooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  delayDuration?: number
  className?: string
}

function SimpleTooltip({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 200,
  className,
}: SimpleTooltipProps) {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align} className={className}>
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, SimpleTooltip }
