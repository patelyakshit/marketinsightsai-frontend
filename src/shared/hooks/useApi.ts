import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// API base URL - uses environment variable in production, relative path in development
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}/api${endpoint}`
}

// Get full URL for paths that already include /api prefix
export function getFullApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(getApiUrl(endpoint), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `API Error: ${response.status}`)
  }

  return response.json()
}
