import { useRef, useEffect } from 'react'
import {
  Plus,
  Loader2,
  FileSpreadsheet,
  X,
  Mic,
  AudioLines,
  Send,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  pendingFile: File | null
  setPendingFile: (file: File | null) => void
  isLoading: boolean
  isListening: boolean
  showRightPanel: boolean
  onSubmit: (e?: React.FormEvent) => void
  onFileSelect: (file: File) => void
  onMicClick: () => void
}

export function ChatInput({
  input,
  setInput,
  pendingFile,
  setPendingFile,
  isLoading,
  isListening,
  showRightPanel,
  onSubmit,
  onFileSelect,
  onMicClick,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e)
    }
  }

  return (
    <div className={cn(
      'p-4 shrink-0',
      showRightPanel ? 'px-4' : 'px-6'
    )}>
      <div className={cn(
        'mx-auto',
        showRightPanel ? 'max-w-full' : 'max-w-3xl'
      )}>
        {/* Pending File Chip */}
        {pendingFile && (
          <div className="mb-2 flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-sm w-fit">
            <FileSpreadsheet className="h-3.5 w-3.5 text-accent" />
            <span className="truncate max-w-[200px]">{pendingFile.name}</span>
            <button
              onClick={() => setPendingFile(null)}
              className="rounded p-0.5 hover:bg-muted"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}

        <div className="rounded-lg border bg-background shadow-sm">
          {/* Input Row */}
          <div className="px-4 py-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about a location, building, market, or customer segment..."
              disabled={isLoading}
              rows={1}
              className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
              style={{ maxHeight: '120px' }}
            />
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between px-3 py-2 border-t">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onFileSelect(file)
                  e.target.value = ''
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted transition-colors"
                title="Upload Excel file"
              >
                <Plus className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              {/* Mic button - show when not typing or when listening */}
              {(!input.trim() && !pendingFile) || isListening ? (
                <button
                  type="button"
                  onClick={onMicClick}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                    isListening
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "hover:bg-muted"
                  )}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  <Mic className={cn(
                    "h-5 w-5",
                    isListening ? "animate-pulse" : "text-muted-foreground"
                  )} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onSubmit()}
                disabled={isLoading || (!input.trim() && !pendingFile)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                  (input.trim() || pendingFile)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
                title="Send message"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (input.trim() || pendingFile) ? (
                  <Send className="h-5 w-5" />
                ) : (
                  <AudioLines className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
