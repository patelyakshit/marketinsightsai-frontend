import { useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { ThinkingIndicator } from '@/shared/components/ui/streaming-message'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  isStreaming: boolean
  streamingContent: string
  thinkingStatus: 'thinking' | 'executing' | 'waiting' | null
  showRightPanel: boolean
  copiedMessageId: string | null
  feedbackGiven: Record<string, 'up' | 'down'>
  onCopy: (messageId: string, content: string) => void
  onFeedback: (messageId: string, feedback: 'up' | 'down') => void
  onRegenerate: (messageId: string) => void
}

export function MessageList({
  messages,
  isLoading,
  isStreaming,
  streamingContent,
  thinkingStatus,
  showRightPanel,
  copiedMessageId,
  feedbackGiven,
  onCopy,
  onFeedback,
  onRegenerate,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-auto">
      <div className={cn(
        'mx-auto py-6 space-y-6',
        showRightPanel ? 'max-w-full px-4' : 'max-w-3xl px-6'
      )}>
        {messages.filter(m => m.role !== 'system').map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex group',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'user' ? (
              <div className="max-w-[85%] rounded-lg bg-primary text-primary-foreground px-4 py-3">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            ) : (
              <div className="max-w-full">
                <div className="prose prose-sm prose-zinc max-w-none text-sm leading-relaxed [&>p]:my-3 [&>ul]:my-3 [&>ol]:my-3 [&>h1]:text-base [&>h1]:font-semibold [&>h1]:mt-6 [&>h1]:mb-3 [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:mt-5 [&>h2]:mb-2 [&>h3]:text-sm [&>h3]:font-medium [&>h3]:mt-4 [&>h3]:mb-2 [&>strong]:font-semibold [&>p]:text-foreground">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {/* Message Actions - show on hover */}
                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onCopy(message.id, message.content)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedMessageId === message.id ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => onFeedback(message.id, 'up')}
                    className={cn(
                      "p-1.5 rounded-md hover:bg-muted transition-colors",
                      feedbackGiven[message.id] === 'up' && "bg-green-50 text-green-600"
                    )}
                    title="Good response"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onFeedback(message.id, 'down')}
                    className={cn(
                      "p-1.5 rounded-md hover:bg-muted transition-colors",
                      feedbackGiven[message.id] === 'down' && "bg-red-50 text-red-600"
                    )}
                    title="Needs improvement"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onRegenerate(message.id)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    title="Regenerate response"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading/Streaming State */}
        {isLoading && (
          <div className="flex justify-start">
            {isStreaming && streamingContent ? (
              // Show streaming content as it comes in
              <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted text-muted-foreground">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{streamingContent}</ReactMarkdown>
                </div>
                <span className="inline-block w-2 h-4 ml-1 bg-primary/50 animate-pulse" />
              </div>
            ) : (
              <ThinkingIndicator
                status={thinkingStatus || 'thinking'}
                message={thinkingStatus === 'executing' ? 'Generating response...' : undefined}
              />
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
