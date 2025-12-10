import { useState, useEffect, useRef, useCallback } from 'react'
import { getApiUrl } from './useApi'
import { logger } from '../utils/logger'

const wsLogger = logger.createLogger('WebSocket')

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface WSMessage {
  type: string
  timestamp?: string
  data?: Record<string, unknown>
  connection_id?: string
  session_id?: string
}

// Progress event types from backend
export const ProgressEventType = {
  // Agent lifecycle
  AGENT_START: 'agent_start',
  AGENT_COMPLETE: 'agent_complete',
  AGENT_ERROR: 'agent_error',

  // Execution progress
  PLAN_CREATED: 'plan_created',
  STEP_START: 'step_start',
  STEP_COMPLETE: 'step_complete',
  TOOL_CALL: 'tool_call',
  TOOL_RESULT: 'tool_result',

  // Goal tracking
  GOAL_CREATED: 'goal_created',
  GOAL_UPDATED: 'goal_updated',
  GOAL_COMPLETED: 'goal_completed',

  // Content streaming
  TOKEN_STREAM: 'token_stream',
  CONTENT_CHUNK: 'content_chunk',

  // Session
  SESSION_UPDATE: 'session_update',

  // Connection
  CONNECTED: 'connected',
  PONG: 'pong',
  KEEPALIVE: 'keepalive',
} as const

interface UseWebSocketOptions {
  sessionId: string
  token?: string
  onMessage?: (message: WSMessage) => void
  onConnect?: (connectionId: string) => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectInterval?: number
}

interface UseWebSocketReturn {
  status: WebSocketStatus
  connectionId: string | null
  lastMessage: WSMessage | null
  send: (data: Record<string, unknown>) => void
  connect: () => void
  disconnect: () => void
  isConnected: boolean
}

export function useWebSocket({
  sessionId,
  token,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  autoConnect = true,
  reconnectAttempts = 3,
  reconnectInterval = 3000,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected')
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCountRef = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getWebSocketUrl = useCallback(() => {
    const apiUrl = getApiUrl('/ws/stream/' + sessionId)
    // Convert http(s) to ws(s)
    const wsUrl = apiUrl.replace(/^http/, 'ws')
    return token ? `${wsUrl}?token=${token}` : wsUrl
  }, [sessionId, token])

  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
  }, [])

  const disconnect = useCallback(() => {
    clearTimers()
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setStatus('disconnected')
    setConnectionId(null)
    onDisconnect?.()
  }, [clearTimers, onDisconnect])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setStatus('connecting')

    try {
      const ws = new WebSocket(getWebSocketUrl())
      wsRef.current = ws

      ws.onopen = () => {
        setStatus('connected')
        reconnectCountRef.current = 0

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000) // Ping every 30 seconds
      }

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data)
          setLastMessage(message)

          // Handle connection confirmation
          if (message.type === ProgressEventType.CONNECTED && message.connection_id) {
            setConnectionId(message.connection_id)
            onConnect?.(message.connection_id)
          }

          onMessage?.(message)
        } catch (e) {
          wsLogger.error('Failed to parse WebSocket message', e)
        }
      }

      ws.onerror = (event) => {
        setStatus('error')
        onError?.(event)
      }

      ws.onclose = () => {
        clearTimers()
        setStatus('disconnected')

        // Attempt reconnect
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }
    } catch (e) {
      setStatus('error')
      wsLogger.error('Failed to create WebSocket', e)
    }
  }, [
    getWebSocketUrl,
    reconnectAttempts,
    reconnectInterval,
    clearTimers,
    onConnect,
    onMessage,
    onError,
  ])

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      wsLogger.warn('WebSocket not connected, cannot send message')
    }
  }, [])

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && sessionId) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [sessionId, autoConnect]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    status,
    connectionId,
    lastMessage,
    send,
    connect,
    disconnect,
    isConnected: status === 'connected',
  }
}

// Hook for streaming agent events
export interface AgentEvent {
  type: string
  timestamp: string
  data: {
    agent?: string
    task?: string
    success?: boolean
    output_preview?: string
    metrics?: Record<string, number>
    summary?: string
    steps?: Array<{
      id: string
      description: string
      status: string
    }>
    step_count?: number
    step_id?: string
    description?: string
    status?: string
    result?: string
    tool?: string
    parameters?: Record<string, unknown>
    result_preview?: string
    error?: string
    goal_id?: string
    goal_text?: string
    chunk?: string
    is_final?: boolean
  }
}

interface UseAgentEventsOptions {
  sessionId: string
  onAgentStart?: (agent: string, task: string) => void
  onAgentComplete?: (success: boolean, output: string) => void
  onPlanCreated?: (summary: string, steps: AgentEvent['data']['steps']) => void
  onStepProgress?: (stepId: string, status: string, result?: string) => void
  onToolCall?: (tool: string, params: Record<string, unknown>) => void
  onToolResult?: (tool: string, success: boolean, result?: string) => void
  onContentChunk?: (chunk: string, isFinal: boolean) => void
  onGoalUpdate?: (goalId: string, status: string) => void
}

export function useAgentEvents({
  sessionId,
  onAgentStart,
  onAgentComplete,
  onPlanCreated,
  onStepProgress,
  onToolCall,
  onToolResult,
  onContentChunk,
  onGoalUpdate,
}: UseAgentEventsOptions) {
  const [currentAgent, setCurrentAgent] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<AgentEvent['data']['steps'] | null>(null)
  const [streamedContent, setStreamedContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const handleMessage = useCallback((message: WSMessage) => {
    const { type, data } = message as AgentEvent

    switch (type) {
      case ProgressEventType.AGENT_START:
        setCurrentAgent(data.agent || null)
        setStreamedContent('')
        setIsStreaming(true)
        onAgentStart?.(data.agent || '', data.task || '')
        break

      case ProgressEventType.AGENT_COMPLETE:
        setCurrentAgent(null)
        setIsStreaming(false)
        onAgentComplete?.(data.success || false, data.output_preview || '')
        break

      case ProgressEventType.AGENT_ERROR:
        setCurrentAgent(null)
        setIsStreaming(false)
        onAgentComplete?.(false, data.error || 'Unknown error')
        break

      case ProgressEventType.PLAN_CREATED:
        setCurrentPlan(data.steps || null)
        onPlanCreated?.(data.summary || '', data.steps)
        break

      case ProgressEventType.STEP_START:
      case ProgressEventType.STEP_COMPLETE:
        onStepProgress?.(data.step_id || '', data.status || '', data.result)
        break

      case ProgressEventType.TOOL_CALL:
        onToolCall?.(data.tool || '', data.parameters || {})
        break

      case ProgressEventType.TOOL_RESULT:
        onToolResult?.(data.tool || '', data.success || false, data.result_preview)
        break

      case ProgressEventType.CONTENT_CHUNK:
        if (data.chunk) {
          setStreamedContent(prev => prev + data.chunk)
        }
        if (data.is_final) {
          setIsStreaming(false)
        }
        onContentChunk?.(data.chunk || '', data.is_final || false)
        break

      case ProgressEventType.GOAL_UPDATED:
      case ProgressEventType.GOAL_COMPLETED:
        onGoalUpdate?.(data.goal_id || '', data.status || '')
        break
    }
  }, [
    onAgentStart,
    onAgentComplete,
    onPlanCreated,
    onStepProgress,
    onToolCall,
    onToolResult,
    onContentChunk,
    onGoalUpdate,
  ])

  const ws = useWebSocket({
    sessionId,
    onMessage: handleMessage,
    autoConnect: !!sessionId,
  })

  return {
    ...ws,
    currentAgent,
    currentPlan,
    streamedContent,
    isStreaming,
    clearStreamedContent: () => setStreamedContent(''),
  }
}
