/**
 * Shared Hooks - Export all custom hooks from a single entry point
 */

// API & Data Fetching
export { getApiUrl } from './useApi'
export { useTapestry } from './useTapestry'
export { useModels } from './useModels'
export { useSlides } from './useSlides'
export { useResearch } from './useResearch'
export { useTasks } from './useTasks'

// Real-time & WebSocket
export {
  useWebSocket,
  useAgentEvents,
  ProgressEventType,
  type WebSocketStatus,
  type WSMessage,
  type AgentEvent,
} from './useWebSocket'
export { useAgentWorkspace } from './useAgentWorkspace'

// Chat & Streaming
export { useStreamingChat } from './useStreamingChat'

// Input
export { useSpeechRecognition } from './useSpeechRecognition'

// Re-export types from hooks
export type {
  SearchResult,
  ResearchResponse,
  QuickSearchResponse,
  CompetitorAnalysisResponse,
  TrendAnalysisResponse,
  AsyncResearchResponse,
} from './useResearch'
