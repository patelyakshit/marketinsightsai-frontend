import { useState, useCallback } from 'react'
import { getApiUrl } from './useApi'
import type { TapestrySegment, TapestryLookupResult } from '@/shared/types'

// Re-export for backward compatibility
export type { TapestrySegment, TapestryLookupResult }

export interface TapestrySegmentDetail {
  code: string
  name: string
  lifeMode: string
  lifeModeCode: string
  urbanization: string
  description: string
  demographics: {
    medianAge: number
    medianHouseholdIncome: number
    averageHouseholdSize: number
    homeownershipRate: number
    diversityIndex: number
  }
  lifestyle: {
    traits: string[]
    interests: string[]
    mediaPreferences: string[]
  }
  marketingTips: string[]
}

interface UseTapestryReturn {
  // Lookup by address
  lookup: (address: string) => Promise<TapestryLookupResult>
  lookupResult: TapestryLookupResult | null
  isLookingUp: boolean
  lookupError: string | null

  // Get segment detail
  getSegmentDetail: (code: string) => Promise<TapestrySegmentDetail>
  segmentDetail: TapestrySegmentDetail | null
  isLoadingSegment: boolean

  // Compare addresses
  compare: (addresses: string[]) => Promise<TapestryLookupResult[]>
  compareResults: TapestryLookupResult[] | null
  isComparing: boolean

  // All segments
  getAllSegments: () => Promise<TapestrySegment[]>
  allSegments: TapestrySegment[] | null

  // Clear state
  clearResults: () => void
}

export function useTapestry(): UseTapestryReturn {
  const [lookupResult, setLookupResult] = useState<TapestryLookupResult | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const [segmentDetail, setSegmentDetail] = useState<TapestrySegmentDetail | null>(null)
  const [isLoadingSegment, setIsLoadingSegment] = useState(false)

  const [compareResults, setCompareResults] = useState<TapestryLookupResult[] | null>(null)
  const [isComparing, setIsComparing] = useState(false)

  const [allSegments, setAllSegments] = useState<TapestrySegment[] | null>(null)

  // Lookup tapestry data by address
  const lookup = useCallback(async (address: string): Promise<TapestryLookupResult> => {
    setIsLookingUp(true)
    setLookupError(null)

    try {
      const response = await fetch(getApiUrl('/tapestry/lookup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to lookup address')
      }

      const data = await response.json()

      // Transform backend response to frontend format
      const result: TapestryLookupResult = {
        address: data.address || address,
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        segments: (data.segments || []).map((seg: Record<string, unknown>) => ({
          code: seg.code as string,
          name: seg.name as string,
          lifeMode: seg.life_mode as string || seg.lifeMode as string,
          lifeModeCode: seg.life_mode_code as string || seg.lifeModeCode as string,
          householdShare: (seg.household_share as number) || (seg.householdShare as number) || 0,
          householdCount: (seg.household_count as number) || (seg.householdCount as number) || 0,
          description: seg.description as string,
        })),
        totalHouseholds: data.total_households || data.totalHouseholds || 0,
        dominantLifeMode: data.dominant_life_mode || data.dominantLifeMode,
        location_info: data.location_info,
      }

      setLookupResult(result)
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setLookupError(message)
      throw error
    } finally {
      setIsLookingUp(false)
    }
  }, [])

  // Get detailed info for a segment
  const getSegmentDetail = useCallback(async (code: string): Promise<TapestrySegmentDetail> => {
    setIsLoadingSegment(true)

    try {
      const response = await fetch(getApiUrl(`/tapestry/segment/${code}`))

      if (!response.ok) {
        throw new Error('Failed to get segment details')
      }

      const data = await response.json()
      setSegmentDetail(data)
      return data
    } finally {
      setIsLoadingSegment(false)
    }
  }, [])

  // Compare multiple addresses
  const compare = useCallback(async (addresses: string[]): Promise<TapestryLookupResult[]> => {
    setIsComparing(true)

    try {
      const response = await fetch(getApiUrl('/tapestry/compare'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses }),
      })

      if (!response.ok) {
        throw new Error('Failed to compare addresses')
      }

      const data = await response.json()
      setCompareResults(data.results || data)
      return data.results || data
    } finally {
      setIsComparing(false)
    }
  }, [])

  // Get all available segments
  const getAllSegments = useCallback(async (): Promise<TapestrySegment[]> => {
    if (allSegments) return allSegments

    const response = await fetch(getApiUrl('/tapestry/segments'))

    if (!response.ok) {
      throw new Error('Failed to get segments')
    }

    const data = await response.json()
    setAllSegments(data.segments || data)
    return data.segments || data
  }, [allSegments])

  // Clear all results
  const clearResults = useCallback(() => {
    setLookupResult(null)
    setLookupError(null)
    setSegmentDetail(null)
    setCompareResults(null)
  }, [])

  return {
    lookup,
    lookupResult,
    isLookingUp,
    lookupError,
    getSegmentDetail,
    segmentDetail,
    isLoadingSegment,
    compare,
    compareResults,
    isComparing,
    getAllSegments,
    allSegments,
    clearResults,
  }
}

// Simple hook for inline tapestry lookup in chat
export function useTapestryLookup() {
  const [result, setResult] = useState<TapestryLookupResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lookup = useCallback(async (address: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl('/tapestry/lookup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Lookup failed')
      }

      const data = await response.json()
      setResult(data)
      return data
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { result, isLoading, error, lookup, clear: () => setResult(null) }
}
