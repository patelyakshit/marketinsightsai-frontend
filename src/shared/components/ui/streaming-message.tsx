import * as React from "react"
import { cn } from "@/shared/utils/cn"

interface StreamingMessageProps {
  content: string
  isStreaming?: boolean
  className?: string
  typingSpeed?: number // ms per character
  onComplete?: () => void
}

/**
 * StreamingMessage - Renders text with a typing animation effect
 * Used for AI responses to create a more natural chat experience
 */
function StreamingMessage({
  content,
  isStreaming = false,
  className,
  typingSpeed = 10,
  onComplete,
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)
  const contentRef = React.useRef(content)
  const indexRef = React.useRef(0)

  React.useEffect(() => {
    // If content changed significantly, reset
    if (content !== contentRef.current) {
      // If new content is longer (streaming), continue from where we were
      if (content.startsWith(contentRef.current)) {
        contentRef.current = content
      } else {
        // Content changed completely, reset
        contentRef.current = content
        indexRef.current = 0
        setDisplayedContent("")
      }
    }
  }, [content])

  React.useEffect(() => {
    if (!isStreaming && content === displayedContent) {
      return
    }

    if (indexRef.current >= content.length) {
      setIsTyping(false)
      onComplete?.()
      return
    }

    setIsTyping(true)

    const timer = setTimeout(() => {
      // Add characters in chunks for smoother rendering
      const chunkSize = isStreaming ? 1 : 3
      const nextIndex = Math.min(indexRef.current + chunkSize, content.length)
      setDisplayedContent(content.slice(0, nextIndex))
      indexRef.current = nextIndex
    }, typingSpeed)

    return () => clearTimeout(timer)
  }, [content, displayedContent, isStreaming, typingSpeed, onComplete])

  // Instant render for non-streaming content
  React.useEffect(() => {
    if (!isStreaming && displayedContent === "" && content) {
      // Fast-forward to full content for non-streaming messages
      setDisplayedContent(content)
      indexRef.current = content.length
    }
  }, [isStreaming, content, displayedContent])

  return (
    <div className={cn("relative", className)}>
      <span className="whitespace-pre-wrap">{displayedContent}</span>
      {isTyping && isStreaming && (
        <span className="inline-block w-2 h-4 ml-0.5 bg-foreground/70 animate-pulse" />
      )}
    </div>
  )
}

interface StreamingTextProps {
  text: string
  isComplete?: boolean
  className?: string
}

/**
 * StreamingText - Simpler streaming text without cursor
 * For inline text that streams without the typing cursor effect
 */
function StreamingText({ text, isComplete = true, className }: StreamingTextProps) {
  return (
    <span className={cn("transition-opacity", className)}>
      {text}
      {!isComplete && (
        <span className="inline-flex gap-1 ml-1">
          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
      )}
    </span>
  )
}

interface ThinkingIndicatorProps {
  status?: "thinking" | "executing" | "waiting"
  message?: string
  className?: string
}

/**
 * ThinkingIndicator - Shows AI thinking/processing state
 * Used to indicate the AI is working on a response
 */
function ThinkingIndicator({
  status = "thinking",
  message,
  className,
}: ThinkingIndicatorProps) {
  const statusConfig = {
    thinking: {
      color: "bg-agent-thinking",
      label: "Thinking...",
      pulseColor: "bg-violet-400",
    },
    executing: {
      color: "bg-agent-executing",
      label: "Executing...",
      pulseColor: "bg-blue-400",
    },
    waiting: {
      color: "bg-agent-waiting",
      label: "Waiting...",
      pulseColor: "bg-amber-400",
    },
  }

  const config = statusConfig[status]

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex items-center justify-center">
        <span
          className={cn(
            "absolute w-3 h-3 rounded-full animate-ping opacity-75",
            config.pulseColor
          )}
        />
        <span className={cn("relative w-2.5 h-2.5 rounded-full", config.color)} />
      </div>
      <span className="text-sm text-muted-foreground">
        {message || config.label}
      </span>
    </div>
  )
}

interface TypingDotsProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

/**
 * TypingDots - Simple bouncing dots indicator
 * For showing someone is typing
 */
function TypingDots({ className, size = "md" }: TypingDotsProps) {
  const sizeClasses = {
    sm: "w-1 h-1",
    md: "w-1.5 h-1.5",
    lg: "w-2 h-2",
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "rounded-full bg-muted-foreground animate-bounce",
            sizeClasses[size]
          )}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  )
}

export { StreamingMessage, StreamingText, ThinkingIndicator, TypingDots }
