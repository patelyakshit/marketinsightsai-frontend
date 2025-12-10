import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { API_BASE } from '@/shared/hooks/useApi'

interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url?: string | null
  auth_provider?: string | null
  created_at: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName?: string) => Promise<void>
  googleLogin: (credential: string) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const getStoredTokens = () => {
    const accessToken = localStorage.getItem('access_token')
    const refreshToken = localStorage.getItem('refresh_token')
    return { accessToken, refreshToken }
  }

  const storeTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  }

  const clearTokens = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  const refreshAuth = useCallback(async () => {
    const { refreshToken } = getStoredTokens()
    if (!refreshToken) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      storeTokens(data.access_token, data.refresh_token)
      setUser(data.user)
    } catch {
      clearTokens()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const text = await response.text()
    if (!text) {
      throw new Error('Server returned empty response. Please check if the backend is running.')
    }

    let data
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(`Invalid server response: ${text.substring(0, 100)}`)
    }

    if (!response.ok) {
      throw new Error(data.detail || 'Login failed')
    }

    storeTokens(data.access_token, data.refresh_token)
    setUser(data.user)
  }, [])

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName }),
    })

    const text = await response.text()
    if (!text) {
      throw new Error('Server returned empty response. Please check if the backend is running.')
    }

    let data
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(`Invalid server response: ${text.substring(0, 100)}`)
    }

    if (!response.ok) {
      throw new Error(data.detail || 'Registration failed')
    }

    storeTokens(data.access_token, data.refresh_token)
    setUser(data.user)
  }, [])

  const googleLogin = useCallback(async (credential: string) => {
    const response = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    })

    const text = await response.text()
    if (!text) {
      throw new Error('Server returned empty response. Please check if the backend is running.')
    }

    let data
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(`Invalid server response: ${text.substring(0, 100)}`)
    }

    if (!response.ok) {
      throw new Error(data.detail || 'Google sign-in failed')
    }

    storeTokens(data.access_token, data.refresh_token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  // Check for existing session on mount
  useEffect(() => {
    const { accessToken } = getStoredTokens()
    if (accessToken) {
      // Verify token by fetching user profile
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then(async (response) => {
          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
          } else {
            // Token invalid, try refresh
            await refreshAuth()
          }
        })
        .catch(() => {
          refreshAuth()
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [refreshAuth])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
