import { useState, useCallback, useRef } from 'react'
import { getApiUrl } from './useApi'

interface UseStreamingChatOptions {
  onChunk?: (chunk: string) => void
  onComplete?: (fullResponse: string, sources: string[]) => void
  onError?: (error: Error) => void
}

interface UseStreamingChatReturn {
  isStreaming: boolean
  streamedContent: string
  sources: string[]
  sendStreamingMessage: (message: string, useKnowledgeBase?: boolean) => Promise<void>
  cancelStream: () => void
}

export function useStreamingChat(options: UseStreamingChatOptions = {}): UseStreamingChatReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedContent, setStreamedContent] = useState('')
  const [sources, setSources] = useState<string[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const sendStreamingMessage = useCallback(async (message: string, useKnowledgeBase = true) => {
    // Cancel any existing stream
    cancelStream()

    setIsStreaming(true)
    setStreamedContent('')
    setSources([])

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch(getApiUrl('/chat/stream'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          use_knowledge_base: useKnowledgeBase,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let fullResponse = ''
      let parsedSources: string[] = []

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              continue
            }

            // Check for sources marker
            if (data.includes('__SOURCES__:')) {
              const sourcesJson = data.split('__SOURCES__:')[1]
              try {
                parsedSources = JSON.parse(sourcesJson)
                setSources(parsedSources)
              } catch {
                // Ignore JSON parse errors for sources
              }
              continue
            }

            // Regular content chunk
            fullResponse += data
            setStreamedContent(fullResponse)
            options.onChunk?.(data)
          }
        }
      }

      options.onComplete?.(fullResponse, parsedSources)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Stream was cancelled, don't treat as error
        return
      }
      const err = error instanceof Error ? error : new Error('Unknown error')
      options.onError?.(err)
      throw err
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [cancelStream, options])

  return {
    isStreaming,
    streamedContent,
    sources,
    sendStreamingMessage,
    cancelStream,
  }
}
