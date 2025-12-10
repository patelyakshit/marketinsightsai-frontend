/**
 * Research API Hook
 *
 * Provides functions to conduct AI-powered market research via the backend API.
 * Uses the Research Agent to search the web, analyze competitors, and identify trends.
 */

import { useState, useCallback } from 'react'
import { getApiUrl } from './useApi'
import { logger } from '../utils/logger'

const researchLogger = logger.createLogger('Research')

// Types
export interface SearchResult {
  title: string
  url: string
  snippet: string
  domain: string
}

export interface ResearchResponse {
  success: boolean
  output: string
  sourcesCount: number
  sources: SearchResult[]
  iterations: number
  toolCallsMade: number
  durationMs: number
}

export interface QuickSearchResponse {
  query: string
  resultsCount: number
  results: SearchResult[]
}

export interface CompetitorAnalysisResponse {
  industry: string
  location: string | null
  analysis: string
  sources: SearchResult[]
}

export interface TrendAnalysisResponse {
  topic: string
  trends: string
  sources: SearchResult[]
}

export interface AsyncResearchResponse {
  taskId: string
  status: string
  message: string
}

interface UseResearchReturn {
  // State
  isResearching: boolean
  error: string | null

  // Actions
  conductResearch: (
    query: string,
    options?: { location?: string; industry?: string; competitors?: string[]; asyncMode?: boolean }
  ) => Promise<ResearchResponse | AsyncResearchResponse | null>
  quickSearch: (query: string, maxResults?: number) => Promise<QuickSearchResponse | null>
  analyzeCompetitors: (industry: string, location?: string) => Promise<CompetitorAnalysisResponse | null>
  researchTrends: (topic: string) => Promise<TrendAnalysisResponse | null>
  clearError: () => void
}

export function useResearch(): UseResearchReturn {
  const [isResearching, setIsResearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }, [])

  const conductResearch = useCallback(
    async (
      query: string,
      options?: { location?: string; industry?: string; competitors?: string[]; asyncMode?: boolean }
    ): Promise<ResearchResponse | AsyncResearchResponse | null> => {
      setIsResearching(true)
      setError(null)

      try {
        const response = await fetch(getApiUrl('/research/research'), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            query,
            location: options?.location,
            industry: options?.industry,
            competitors: options?.competitors,
            async_mode: options?.asyncMode || false,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || `Research failed: ${response.status}`)
        }

        const data = await response.json()

        // Check if async response
        if (data.task_id) {
          researchLogger.info('Research task queued', { taskId: data.task_id })
          return {
            taskId: data.task_id,
            status: data.status,
            message: data.message,
          }
        }

        // Sync response - transform snake_case to camelCase
        const result: ResearchResponse = {
          success: data.success,
          output: data.output,
          sourcesCount: data.sources_count,
          sources: data.sources || [],
          iterations: data.iterations,
          toolCallsMade: data.tool_calls_made,
          durationMs: data.duration_ms,
        }

        researchLogger.info('Research completed', {
          sourcesCount: result.sourcesCount,
          durationMs: result.durationMs,
        })
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Research failed'
        setError(message)
        researchLogger.error('Research failed', err)
        return null
      } finally {
        setIsResearching(false)
      }
    },
    [getAuthHeaders]
  )

  const quickSearch = useCallback(
    async (query: string, maxResults: number = 5): Promise<QuickSearchResponse | null> => {
      setIsResearching(true)
      setError(null)

      try {
        const response = await fetch(getApiUrl('/research/search'), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            query,
            max_results: maxResults,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || `Search failed: ${response.status}`)
        }

        const data = await response.json()
        const result: QuickSearchResponse = {
          query: data.query,
          resultsCount: data.results_count,
          results: data.results || [],
        }

        researchLogger.info('Quick search completed', { resultsCount: result.resultsCount })
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed'
        setError(message)
        researchLogger.error('Quick search failed', err)
        return null
      } finally {
        setIsResearching(false)
      }
    },
    [getAuthHeaders]
  )

  const analyzeCompetitors = useCallback(
    async (industry: string, location?: string): Promise<CompetitorAnalysisResponse | null> => {
      setIsResearching(true)
      setError(null)

      try {
        const url = new URL(getApiUrl(`/research/competitors/${encodeURIComponent(industry)}`))
        if (location) {
          url.searchParams.set('location', location)
        }

        const response = await fetch(url.toString(), {
          headers: getAuthHeaders(),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || `Competitor analysis failed: ${response.status}`)
        }

        const data = await response.json()
        researchLogger.info('Competitor analysis completed', { industry })
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Competitor analysis failed'
        setError(message)
        researchLogger.error('Competitor analysis failed', err)
        return null
      } finally {
        setIsResearching(false)
      }
    },
    [getAuthHeaders]
  )

  const researchTrends = useCallback(
    async (topic: string): Promise<TrendAnalysisResponse | null> => {
      setIsResearching(true)
      setError(null)

      try {
        const response = await fetch(getApiUrl(`/research/trends/${encodeURIComponent(topic)}`), {
          headers: getAuthHeaders(),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || `Trend research failed: ${response.status}`)
        }

        const data = await response.json()
        researchLogger.info('Trend research completed', { topic })
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Trend research failed'
        setError(message)
        researchLogger.error('Trend research failed', err)
        return null
      } finally {
        setIsResearching(false)
      }
    },
    [getAuthHeaders]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isResearching,
    error,
    conductResearch,
    quickSearch,
    analyzeCompetitors,
    researchTrends,
    clearError,
  }
}
