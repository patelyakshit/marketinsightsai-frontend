import { useState, useEffect, useCallback } from 'react'
import { getApiUrl } from './useApi'

export type ModelProvider = 'openai' | 'anthropic' | 'google'

export interface AIModel {
  id: string
  name: string
  provider: ModelProvider
  description: string
  contextWindow: number
  maxOutputTokens: number
  capabilities: string[]
  pricing?: {
    inputPer1k: number
    outputPer1k: number
  }
  isDefault?: boolean
  isAvailable: boolean
}

export interface ModelRecommendation {
  recommendedModel: string
  reason: string
  alternatives: Array<{
    modelId: string
    reason: string
  }>
}

interface UseModelsReturn {
  // Available models
  models: AIModel[]
  isLoading: boolean
  error: string | null

  // Selected model
  selectedModelId: string
  selectedModel: AIModel | null
  setSelectedModel: (modelId: string) => void

  // Model recommendations
  getRecommendation: (taskType: string) => Promise<ModelRecommendation>
  recommendation: ModelRecommendation | null
  isGettingRecommendation: boolean

  // Chat with specific model
  chatWithModel: (message: string, modelId?: string) => Promise<string>
  isChatting: boolean

  // Compare models
  compareModels: (prompt: string, modelIds: string[]) => Promise<Record<string, string>>
  isComparing: boolean
  compareResults: Record<string, string> | null

  // Refresh models list
  refreshModels: () => Promise<void>
}

const DEFAULT_MODEL_ID = 'gpt-4o'

// Storage key for persisting selected model
const SELECTED_MODEL_KEY = 'marketinsights_selected_model'

export function useModels(): UseModelsReturn {
  const [models, setModels] = useState<AIModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SELECTED_MODEL_KEY) || DEFAULT_MODEL_ID
    }
    return DEFAULT_MODEL_ID
  })

  const [recommendation, setRecommendation] = useState<ModelRecommendation | null>(null)
  const [isGettingRecommendation, setIsGettingRecommendation] = useState(false)

  const [isChatting, setIsChatting] = useState(false)

  const [compareResults, setCompareResults] = useState<Record<string, string> | null>(null)
  const [isComparing, setIsComparing] = useState(false)

  // Fetch available models
  const fetchModels = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl('/models/'))

      if (!response.ok) {
        throw new Error('Failed to fetch models')
      }

      const data = await response.json()
      const modelList: AIModel[] = (data.models || data || []).map((m: Record<string, unknown>) => ({
        id: m.id as string,
        name: m.name as string,
        provider: (m.provider as ModelProvider) || 'openai',
        description: (m.description as string) || '',
        contextWindow: (m.context_window as number) || (m.contextWindow as number) || 128000,
        maxOutputTokens: (m.max_output_tokens as number) || (m.maxOutputTokens as number) || 4096,
        capabilities: (m.capabilities as string[]) || [],
        pricing: m.pricing as AIModel['pricing'],
        isDefault: m.is_default as boolean || m.isDefault as boolean,
        isAvailable: m.is_available as boolean ?? m.isAvailable as boolean ?? true,
      }))

      setModels(modelList)

      // If selected model is not available, switch to default
      const selectedExists = modelList.some(m => m.id === selectedModelId && m.isAvailable)
      if (!selectedExists) {
        const defaultModel = modelList.find(m => m.isDefault) || modelList[0]
        if (defaultModel) {
          setSelectedModelId(defaultModel.id)
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      setError(message)

      // Set fallback models
      setModels([
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          provider: 'openai',
          description: 'Most capable model for complex tasks',
          contextWindow: 128000,
          maxOutputTokens: 4096,
          capabilities: ['vision', 'function-calling', 'json-mode'],
          isDefault: true,
          isAvailable: true,
        },
        {
          id: 'gpt-4o-mini',
          name: 'GPT-4o Mini',
          provider: 'openai',
          description: 'Fast and efficient for everyday tasks',
          contextWindow: 128000,
          maxOutputTokens: 4096,
          capabilities: ['vision', 'function-calling'],
          isAvailable: true,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [selectedModelId])

  // Set selected model and persist
  const setSelectedModel = useCallback((modelId: string) => {
    setSelectedModelId(modelId)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SELECTED_MODEL_KEY, modelId)
    }
  }, [])

  // Get model recommendation for a task type
  const getRecommendation = useCallback(async (taskType: string): Promise<ModelRecommendation> => {
    setIsGettingRecommendation(true)

    try {
      const response = await fetch(getApiUrl(`/models/recommend/${taskType}`))

      if (!response.ok) {
        throw new Error('Failed to get recommendation')
      }

      const data = await response.json()
      const rec: ModelRecommendation = {
        recommendedModel: data.recommended_model || data.recommendedModel,
        reason: data.reason,
        alternatives: data.alternatives || [],
      }

      setRecommendation(rec)
      return rec
    } finally {
      setIsGettingRecommendation(false)
    }
  }, [])

  // Chat with a specific model
  const chatWithModel = useCallback(async (message: string, modelId?: string): Promise<string> => {
    setIsChatting(true)

    try {
      const response = await fetch(getApiUrl('/models/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          model_id: modelId || selectedModelId,
        }),
      })

      if (!response.ok) {
        throw new Error('Chat request failed')
      }

      const data = await response.json()
      return data.response || data.content || ''
    } finally {
      setIsChatting(false)
    }
  }, [selectedModelId])

  // Compare responses from multiple models
  const compareModels = useCallback(async (
    prompt: string,
    modelIds: string[]
  ): Promise<Record<string, string>> => {
    setIsComparing(true)
    setCompareResults(null)

    try {
      const response = await fetch(getApiUrl('/models/compare'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model_ids: modelIds,
        }),
      })

      if (!response.ok) {
        throw new Error('Comparison failed')
      }

      const data = await response.json()
      setCompareResults(data.responses || data)
      return data.responses || data
    } finally {
      setIsComparing(false)
    }
  }, [])

  // Load models on mount
  useEffect(() => {
    fetchModels()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Get currently selected model object
  const selectedModel = models.find(m => m.id === selectedModelId) || null

  return {
    models,
    isLoading,
    error,
    selectedModelId,
    selectedModel,
    setSelectedModel,
    getRecommendation,
    recommendation,
    isGettingRecommendation,
    chatWithModel,
    isChatting,
    compareModels,
    isComparing,
    compareResults,
    refreshModels: fetchModels,
  }
}

// Simple hook for just model selection
export function useModelSelector() {
  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SELECTED_MODEL_KEY) || DEFAULT_MODEL_ID
    }
    return DEFAULT_MODEL_ID
  })

  const setModel = useCallback((modelId: string) => {
    setSelectedModelId(modelId)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SELECTED_MODEL_KEY, modelId)
    }
  }, [])

  return {
    selectedModelId,
    setSelectedModel: setModel,
  }
}
