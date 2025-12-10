/**
 * Background Tasks API Hook
 *
 * Provides functions to manage and monitor background tasks via the backend API.
 * Supports polling for task status updates and task cancellation.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { getApiUrl } from './useApi'
import { logger } from '../utils/logger'
import type { BackgroundTask, TaskStatus, TaskType } from '../types'

const tasksLogger = logger.createLogger('Tasks')

interface UseTasksReturn {
  // State
  tasks: BackgroundTask[]
  activeTask: BackgroundTask | null
  isLoading: boolean
  error: string | null

  // Actions
  getTask: (taskId: string) => Promise<BackgroundTask | null>
  listTasks: (status?: TaskStatus, taskType?: TaskType) => Promise<BackgroundTask[]>
  cancelTask: (taskId: string) => Promise<boolean>
  pollTask: (taskId: string, onUpdate?: (task: BackgroundTask) => void) => void
  stopPolling: () => void
  clearError: () => void
}

// Transform snake_case to camelCase for task responses
function transformTask(data: Record<string, unknown>): BackgroundTask {
  return {
    id: data.id as string,
    type: data.type as TaskType,
    status: data.status as TaskStatus,
    progress: (data.progress as number) || 0,
    message: (data.message as string) || '',
    result: data.result,
    error: data.error as string | undefined,
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  }
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<BackgroundTask[]>([])
  const [activeTask, setActiveTask] = useState<BackgroundTask | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }, [])

  const getTask = useCallback(
    async (taskId: string): Promise<BackgroundTask | null> => {
      try {
        const response = await fetch(getApiUrl(`/tasks/${taskId}`), {
          headers: getAuthHeaders(),
        })

        if (!response.ok) {
          if (response.status === 404) {
            return null
          }
          throw new Error(`Failed to get task: ${response.status}`)
        }

        const data = await response.json()
        const task = transformTask(data)
        setActiveTask(task)
        return task
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get task'
        setError(message)
        tasksLogger.error('Failed to get task', err)
        return null
      }
    },
    [getAuthHeaders]
  )

  const listTasks = useCallback(
    async (status?: TaskStatus, taskType?: TaskType): Promise<BackgroundTask[]> => {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (status) params.set('status', status)
        if (taskType) params.set('type', taskType)

        const url = params.toString()
          ? `${getApiUrl('/tasks')}?${params.toString()}`
          : getApiUrl('/tasks')

        const response = await fetch(url, {
          headers: getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Failed to list tasks: ${response.status}`)
        }

        const data = await response.json()
        const taskList = (data.tasks || data || []).map(transformTask)
        setTasks(taskList)
        return taskList
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to list tasks'
        setError(message)
        tasksLogger.error('Failed to list tasks', err)
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [getAuthHeaders]
  )

  const cancelTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      try {
        const response = await fetch(getApiUrl(`/tasks/${taskId}/cancel`), {
          method: 'POST',
          headers: getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Failed to cancel task: ${response.status}`)
        }

        // Update local state
        setTasks(prev =>
          prev.map(t => (t.id === taskId ? { ...t, status: 'cancelled' as TaskStatus } : t))
        )
        if (activeTask?.id === taskId) {
          setActiveTask(prev => (prev ? { ...prev, status: 'cancelled' as TaskStatus } : null))
        }

        tasksLogger.info('Task cancelled', { taskId })
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to cancel task'
        setError(message)
        tasksLogger.error('Failed to cancel task', err)
        return false
      }
    },
    [getAuthHeaders, activeTask?.id]
  )

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const pollTask = useCallback(
    (taskId: string, onUpdate?: (task: BackgroundTask) => void) => {
      // Stop any existing polling
      stopPolling()

      const poll = async () => {
        const task = await getTask(taskId)
        if (task) {
          onUpdate?.(task)

          // Stop polling if task is complete
          if (['completed', 'failed', 'cancelled'].includes(task.status)) {
            stopPolling()
            tasksLogger.info('Task polling complete', { taskId, status: task.status })
          }
        }
      }

      // Poll immediately, then every 2 seconds
      poll()
      pollingRef.current = setInterval(poll, 2000)
    },
    [getTask, stopPolling]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    tasks,
    activeTask,
    isLoading,
    error,
    getTask,
    listTasks,
    cancelTask,
    pollTask,
    stopPolling,
    clearError,
  }
}
