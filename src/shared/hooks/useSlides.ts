/**
 * Slides API Hook
 *
 * Provides functions to generate PowerPoint presentations via the backend API.
 * Supports multiple presentation types: general, tapestry analysis, and marketing.
 */

import { useState, useCallback } from 'react'
import { getApiUrl } from './useApi'
import { logger } from '../utils/logger'
import type {
  SlideGenerationRequest,
  SlideGenerationResponse,
  TapestrySlideRequest,
  MarketingSlideRequest,
  SlideThemeInfo,
} from '../types'

const slidesLogger = logger.createLogger('Slides')

interface UseSlidesReturn {
  // State
  isGenerating: boolean
  error: string | null
  lastResult: SlideGenerationResponse | null
  themes: SlideThemeInfo[]

  // Actions
  generateSlides: (request: SlideGenerationRequest) => Promise<SlideGenerationResponse | null>
  generateTapestrySlides: (request: TapestrySlideRequest) => Promise<SlideGenerationResponse | null>
  generateMarketingSlides: (request: MarketingSlideRequest) => Promise<SlideGenerationResponse | null>
  downloadSlides: (downloadUrl: string, filename?: string) => Promise<void>
  loadThemes: () => Promise<void>
  clearError: () => void
}

// Transform frontend camelCase to backend snake_case
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    if (Array.isArray(value)) {
      result[snakeKey] = value.map(item =>
        typeof item === 'object' && item !== null ? toSnakeCase(item as Record<string, unknown>) : item
      )
    } else if (typeof value === 'object' && value !== null) {
      result[snakeKey] = toSnakeCase(value as Record<string, unknown>)
    } else {
      result[snakeKey] = value
    }
  }
  return result
}

// Transform backend snake_case to frontend camelCase
function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    if (Array.isArray(value)) {
      result[camelKey] = value.map(item =>
        typeof item === 'object' && item !== null ? toCamelCase(item as Record<string, unknown>) : item
      )
    } else if (typeof value === 'object' && value !== null) {
      result[camelKey] = toCamelCase(value as Record<string, unknown>)
    } else {
      result[camelKey] = value
    }
  }
  return result
}

export function useSlides(): UseSlidesReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<SlideGenerationResponse | null>(null)
  const [themes, setThemes] = useState<SlideThemeInfo[]>([])

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }, [])

  const generateSlides = useCallback(async (request: SlideGenerationRequest): Promise<SlideGenerationResponse | null> => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl('/slides/generate'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(toSnakeCase({
          prompt: request.prompt,
          theme: request.theme || 'default',
          maxSlides: request.maxSlides || 12,
          storeName: request.storeName,
          location: request.location,
          segments: request.segments,
        })),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Failed to generate slides: ${response.status}`)
      }

      const data = await response.json()
      const result = toCamelCase(data) as unknown as SlideGenerationResponse
      setLastResult(result)
      slidesLogger.info('Slides generated successfully', { slideCount: result.slideCount })
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate slides'
      setError(message)
      slidesLogger.error('Failed to generate slides', err)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [getAuthHeaders])

  const generateTapestrySlides = useCallback(async (request: TapestrySlideRequest): Promise<SlideGenerationResponse | null> => {
    setIsGenerating(true)
    setError(null)

    try {
      // Transform segments to snake_case format expected by backend
      const segments = request.segments.map(seg => ({
        code: seg.code,
        name: seg.name,
        household_share: seg.householdShare,
        household_count: seg.householdCount,
        life_mode: seg.lifeMode,
        life_mode_code: seg.lifeModeCode,
        description: seg.description,
        median_age: seg.medianAge,
        median_household_income: seg.medianHouseholdIncome,
      }))

      const response = await fetch(getApiUrl('/slides/tapestry'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          store_name: request.storeName,
          location: request.location,
          segments,
          theme: request.theme || 'default',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Failed to generate Tapestry slides: ${response.status}`)
      }

      const data = await response.json()
      const result = toCamelCase(data) as unknown as SlideGenerationResponse
      setLastResult(result)
      slidesLogger.info('Tapestry slides generated', { storeName: request.storeName, slideCount: result.slideCount })
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate Tapestry slides'
      setError(message)
      slidesLogger.error('Failed to generate Tapestry slides', err)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [getAuthHeaders])

  const generateMarketingSlides = useCallback(async (request: MarketingSlideRequest): Promise<SlideGenerationResponse | null> => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl('/slides/marketing'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          campaign_name: request.campaignName,
          target_audience: request.targetAudience,
          content_ideas: request.contentIdeas,
          key_messages: request.keyMessages,
          channels: request.channels,
          theme: request.theme || 'modern',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Failed to generate marketing slides: ${response.status}`)
      }

      const data = await response.json()
      const result = toCamelCase(data) as unknown as SlideGenerationResponse
      setLastResult(result)
      slidesLogger.info('Marketing slides generated', { campaign: request.campaignName, slideCount: result.slideCount })
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate marketing slides'
      setError(message)
      slidesLogger.error('Failed to generate marketing slides', err)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [getAuthHeaders])

  const downloadSlides = useCallback(async (downloadUrl: string, filename?: string): Promise<void> => {
    try {
      const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : getApiUrl(downloadUrl)

      const response = await fetch(fullUrl, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || downloadUrl.split('/').pop() || 'presentation.pptx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      slidesLogger.info('Slides downloaded', { filename: a.download })
    } catch (err) {
      slidesLogger.error('Failed to download slides', err)
      // Fallback: open in new tab
      window.open(getApiUrl(downloadUrl), '_blank')
    }
  }, [getAuthHeaders])

  const loadThemes = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(getApiUrl('/slides/themes'))

      if (!response.ok) {
        throw new Error(`Failed to load themes: ${response.status}`)
      }

      const data = await response.json()
      setThemes(data.themes || [])
    } catch (err) {
      slidesLogger.error('Failed to load themes', err)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isGenerating,
    error,
    lastResult,
    themes,
    generateSlides,
    generateTapestrySlides,
    generateMarketingSlides,
    downloadSlides,
    loadThemes,
    clearError,
  }
}
