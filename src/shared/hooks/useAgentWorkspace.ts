/**
 * Agent Workspace Hook
 *
 * Bridges WebSocket agent events with the AgentWorkspacePanel UI component.
 * Transforms backend events into the UI-friendly AgentTask/AgentStep format.
 */

import { useState, useCallback, useMemo } from 'react'
import { useAgentEvents, type AgentEvent } from './useWebSocket'
import type {
  AgentTask,
  AgentStep,
  AgentStepStatus,
} from '../components/agent/AgentWorkspacePanel'

type StepType = 'plan' | 'search' | 'analyze' | 'generate' | 'verify' | 'execute'

interface UseAgentWorkspaceOptions {
  sessionId: string
}

interface UseAgentWorkspaceReturn {
  // Connection state
  isConnected: boolean
  connectionId: string | null

  // Task state
  currentTask: AgentTask | null
  isTaskRunning: boolean

  // Actions
  connect: () => void
  disconnect: () => void
  clearTask: () => void
}

// Map tool names to step types
function getStepTypeFromTool(tool: string): StepType {
  const toolLower = tool.toLowerCase()
  if (toolLower.includes('search') || toolLower.includes('web')) return 'search'
  if (toolLower.includes('analyze') || toolLower.includes('analysis')) return 'analyze'
  if (toolLower.includes('generate') || toolLower.includes('create')) return 'generate'
  if (toolLower.includes('verify') || toolLower.includes('check')) return 'verify'
  return 'execute'
}

// Map backend status to UI status
function mapStatus(status: string): AgentStepStatus {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'pending'
    case 'running':
    case 'in_progress':
      return 'executing'
    case 'thinking':
      return 'thinking'
    case 'completed':
    case 'done':
      return 'completed'
    case 'failed':
    case 'error':
      return 'error'
    default:
      return 'pending'
  }
}

export function useAgentWorkspace({
  sessionId,
}: UseAgentWorkspaceOptions): UseAgentWorkspaceReturn {
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null)

  // Handle agent start
  const handleAgentStart = useCallback((agent: string, task: string) => {
    const newTask: AgentTask = {
      id: `task-${Date.now()}`,
      title: task || `${agent} task`,
      status: 'thinking',
      steps: [],
      totalProgress: 0,
      currentStepIndex: 0,
    }
    setCurrentTask(newTask)
  }, [])

  // Handle agent completion
  const handleAgentComplete = useCallback((success: boolean, output: string) => {
    setCurrentTask(prev => {
      if (!prev) return null
      return {
        ...prev,
        status: success ? 'completed' : 'error',
        totalProgress: 100,
        steps: prev.steps.map(step => ({
          ...step,
          status: step.status === 'executing' || step.status === 'thinking'
            ? (success ? 'completed' : 'error')
            : step.status,
          output: step.status === 'executing' ? output : step.output,
        })),
      }
    })
  }, [])

  // Handle plan creation
  const handlePlanCreated = useCallback(
    (summary: string, steps: AgentEvent['data']['steps']) => {
      setCurrentTask(prev => {
        if (!prev) return null

        const newSteps: AgentStep[] = (steps || []).map((step, index) => ({
          id: step.id || `step-${index}`,
          type: 'plan' as StepType,
          title: step.description,
          status: index === 0 ? 'thinking' : 'pending',
          startTime: index === 0 ? Date.now() : undefined,
        }))

        // Add summary as first planning step if we have steps
        if (newSteps.length > 0 && summary) {
          newSteps[0].description = summary
        }

        return {
          ...prev,
          status: 'executing',
          steps: newSteps,
        }
      })
    },
    []
  )

  // Handle step progress
  const handleStepProgress = useCallback(
    (stepId: string, status: string, result?: string) => {
      setCurrentTask(prev => {
        if (!prev) return null

        const stepIndex = prev.steps.findIndex(s => s.id === stepId)
        if (stepIndex === -1) return prev

        const mappedStatus = mapStatus(status)
        const now = Date.now()

        const updatedSteps = prev.steps.map((step, index) => {
          if (step.id === stepId) {
            return {
              ...step,
              status: mappedStatus,
              output: result || step.output,
              startTime: step.startTime || (mappedStatus !== 'pending' ? now : undefined),
              endTime: mappedStatus === 'completed' || mappedStatus === 'error' ? now : undefined,
            }
          }
          // Start next step if current step completed
          if (index === stepIndex + 1 && mappedStatus === 'completed' && step.status === 'pending') {
            return {
              ...step,
              status: 'thinking' as AgentStepStatus,
              startTime: now,
            }
          }
          return step
        })

        // Calculate progress
        const completedSteps = updatedSteps.filter(s => s.status === 'completed').length
        const totalProgress =
          updatedSteps.length > 0 ? Math.round((completedSteps / updatedSteps.length) * 100) : 0

        // Determine current step index
        const currentStepIndex = updatedSteps.findIndex(
          s => s.status === 'executing' || s.status === 'thinking'
        )

        return {
          ...prev,
          steps: updatedSteps,
          totalProgress,
          currentStepIndex: currentStepIndex >= 0 ? currentStepIndex : prev.currentStepIndex,
        }
      })
    },
    []
  )

  // Handle tool calls
  const handleToolCall = useCallback((tool: string, params: Record<string, unknown>) => {
    setCurrentTask(prev => {
      if (!prev) return null

      // Add a new step for the tool call
      const newStep: AgentStep = {
        id: `tool-${Date.now()}`,
        type: getStepTypeFromTool(tool),
        title: `Running ${tool}`,
        status: 'executing',
        startTime: Date.now(),
        details: Object.entries(params)
          .slice(0, 3)
          .map(([key, value]) => `${key}: ${String(value).substring(0, 50)}`),
      }

      // Update existing executing step or add new one
      const hasExecutingStep = prev.steps.some(s => s.status === 'executing')
      if (hasExecutingStep) {
        return {
          ...prev,
          steps: prev.steps.map(step =>
            step.status === 'executing'
              ? { ...step, details: [...(step.details || []), `Calling ${tool}...`] }
              : step
          ),
        }
      }

      return {
        ...prev,
        steps: [...prev.steps, newStep],
      }
    })
  }, [])

  // Handle tool results
  const handleToolResult = useCallback(
    (tool: string, success: boolean, result?: string) => {
      setCurrentTask(prev => {
        if (!prev) return null

        return {
          ...prev,
          steps: prev.steps.map(step => {
            if (step.status === 'executing' && step.title.includes(tool)) {
              return {
                ...step,
                status: success ? 'completed' : 'error',
                output: result,
                endTime: Date.now(),
              }
            }
            return step
          }),
        }
      })
    },
    []
  )

  // Use the agent events hook
  const agentEvents = useAgentEvents({
    sessionId,
    onAgentStart: handleAgentStart,
    onAgentComplete: handleAgentComplete,
    onPlanCreated: handlePlanCreated,
    onStepProgress: handleStepProgress,
    onToolCall: handleToolCall,
    onToolResult: handleToolResult,
  })

  const isTaskRunning = useMemo(() => {
    if (!currentTask) return false
    return currentTask.status === 'thinking' || currentTask.status === 'executing'
  }, [currentTask])

  const clearTask = useCallback(() => {
    setCurrentTask(null)
  }, [])

  return {
    isConnected: agentEvents.isConnected,
    connectionId: agentEvents.connectionId,
    currentTask,
    isTaskRunning,
    connect: agentEvents.connect,
    disconnect: agentEvents.disconnect,
    clearTask,
  }
}
