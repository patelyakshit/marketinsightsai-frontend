import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Folder, FolderFile, FolderChat, FolderChatMessage } from '@/shared/types'
import { useAuth } from './AuthContext'

// API base URL - uses environment variable in production
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token')
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  }
}

// Helper to parse API response dates
function parseDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(item => parseDates(item)) as T
  }

  const result = { ...obj } as Record<string, unknown>
  for (const key in result) {
    const value = result[key]
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      result[key] = new Date(value)
    } else if (typeof value === 'object') {
      result[key] = parseDates(value)
    }
  }
  return result as T
}

interface FoldersContextType {
  folders: Folder[]
  activeFolderId: string | null
  activeFolder: Folder | null
  activeChatId: string | null
  activeChat: FolderChat | null
  isLoading: boolean
  error: string | null
  // Folder operations
  fetchFolders: () => Promise<void>
  createFolder: (name: string, description?: string) => Promise<Folder>
  updateFolder: (id: string, updates: { name?: string; description?: string }) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  setActiveFolder: (id: string | null) => void
  // File operations
  uploadFile: (folderId: string, file: File) => Promise<FolderFile>
  deleteFile: (folderId: string, fileId: string) => Promise<void>
  // Chat operations
  fetchChats: (folderId: string) => Promise<FolderChat[]>
  fetchChat: (folderId: string, chatId: string) => Promise<FolderChat>
  createChat: (folderId: string, title?: string) => Promise<FolderChat>
  deleteChat: (folderId: string, chatId: string) => Promise<void>
  setActiveChat: (chatId: string | null) => void
  addMessage: (folderId: string, chatId: string, message: Omit<FolderChatMessage, 'id' | 'createdAt' | 'chatId'>) => Promise<FolderChatMessage>
}

const FoldersContext = createContext<FoldersContextType | null>(null)

export function useFolders() {
  const context = useContext(FoldersContext)
  if (!context) {
    throw new Error('useFolders must be used within FoldersProvider')
  }
  return context
}

interface FoldersProviderProps {
  children: ReactNode
}

export function FoldersProvider({ children }: FoldersProviderProps) {
  const { isAuthenticated } = useAuth()
  const [folders, setFolders] = useState<Folder[]>([])
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [activeChat, setActiveChat] = useState<FolderChat | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeFolder = folders.find(f => f.id === activeFolderId) || null

  // Fetch all folders
  const fetchFolders = useCallback(async () => {
    if (!isAuthenticated) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/folders`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch folders')
      const data = await response.json()
      setFolders(parseDates(data.folders || []))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch folders')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Create a new folder
  const createFolder = useCallback(async (name: string, description?: string): Promise<Folder> => {
    const response = await fetch(`${API_BASE}/folders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, description }),
    })
    if (!response.ok) throw new Error('Failed to create folder')
    const folder = parseDates<Folder>(await response.json())
    setFolders(prev => [folder, ...prev])
    return folder
  }, [])

  // Update a folder
  const updateFolder = useCallback(async (id: string, updates: { name?: string; description?: string }) => {
    const response = await fetch(`${API_BASE}/folders/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    })
    if (!response.ok) throw new Error('Failed to update folder')
    const updated = parseDates<Folder>(await response.json())
    setFolders(prev => prev.map(f => f.id === id ? updated : f))
  }, [])

  // Delete a folder
  const deleteFolder = useCallback(async (id: string) => {
    const response = await fetch(`${API_BASE}/folders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to delete folder')
    setFolders(prev => prev.filter(f => f.id !== id))
    if (activeFolderId === id) {
      setActiveFolderId(null)
      setActiveChatId(null)
      setActiveChat(null)
    }
  }, [activeFolderId])

  // Set active folder
  const setActiveFolder = useCallback((id: string | null) => {
    setActiveFolderId(id)
    setActiveChatId(null)
    setActiveChat(null)
  }, [])

  // Upload a file to a folder
  const uploadFile = useCallback(async (folderId: string, file: File): Promise<FolderFile> => {
    const formData = new FormData()
    formData.append('file', file)

    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_BASE}/folders/${folderId}/files`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    })
    if (!response.ok) throw new Error('Failed to upload file')
    const uploadedFile = parseDates<FolderFile>(await response.json())

    // Update folder's files list and file count
    setFolders(prev => prev.map(f => {
      if (f.id !== folderId) return f
      return {
        ...f,
        files: [...f.files, uploadedFile],
        fileCount: f.fileCount + 1,
        updatedAt: new Date(),
      }
    }))

    return uploadedFile
  }, [])

  // Delete a file from a folder
  const deleteFile = useCallback(async (folderId: string, fileId: string) => {
    const response = await fetch(`${API_BASE}/folders/${folderId}/files/${fileId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to delete file')

    // Update folder's files list and file count
    setFolders(prev => prev.map(f => {
      if (f.id !== folderId) return f
      return {
        ...f,
        files: f.files.filter(file => file.id !== fileId),
        fileCount: Math.max(0, f.fileCount - 1),
        updatedAt: new Date(),
      }
    }))
  }, [])

  // Fetch chats for a folder
  const fetchChats = useCallback(async (folderId: string): Promise<FolderChat[]> => {
    const response = await fetch(`${API_BASE}/folders/${folderId}/chats`, {
      headers: getAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to fetch chats')
    return parseDates<FolderChat[]>(await response.json())
  }, [])

  // Fetch a single chat with messages
  const fetchChat = useCallback(async (folderId: string, chatId: string): Promise<FolderChat> => {
    const response = await fetch(`${API_BASE}/folders/${folderId}/chats/${chatId}`, {
      headers: getAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to fetch chat')
    const chat = parseDates<FolderChat>(await response.json())
    setActiveChat(chat)
    return chat
  }, [])

  // Create a new chat in a folder
  const createChat = useCallback(async (folderId: string, title?: string): Promise<FolderChat> => {
    const response = await fetch(`${API_BASE}/folders/${folderId}/chats`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title }),
    })
    if (!response.ok) throw new Error('Failed to create chat')
    const chat = parseDates<FolderChat>(await response.json())

    // Update folder's chat count
    setFolders(prev => prev.map(f => {
      if (f.id !== folderId) return f
      return {
        ...f,
        chatCount: f.chatCount + 1,
        updatedAt: new Date(),
      }
    }))

    setActiveChatId(chat.id)
    setActiveChat(chat)
    return chat
  }, [])

  // Delete a chat from a folder
  const deleteChat = useCallback(async (folderId: string, chatId: string) => {
    const response = await fetch(`${API_BASE}/folders/${folderId}/chats/${chatId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to delete chat')

    // Update folder's chat count
    setFolders(prev => prev.map(f => {
      if (f.id !== folderId) return f
      return {
        ...f,
        chatCount: Math.max(0, f.chatCount - 1),
        updatedAt: new Date(),
      }
    }))

    if (activeChatId === chatId) {
      setActiveChatId(null)
      setActiveChat(null)
    }
  }, [activeChatId])

  // Set active chat
  const setActiveChatHandler = useCallback((chatId: string | null) => {
    setActiveChatId(chatId)
    if (!chatId) {
      setActiveChat(null)
    }
  }, [])

  // Add a message to a chat (this will be called by the chat component)
  // Note: The actual API call happens in the chat endpoint, this just updates local state
  const addMessage = useCallback(async (
    folderId: string,
    chatId: string,
    message: Omit<FolderChatMessage, 'id' | 'createdAt' | 'chatId'>
  ): Promise<FolderChatMessage> => {
    // For now, create a local message - the actual API will be called separately
    const newMessage: FolderChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      chatId,
      createdAt: new Date(),
    }

    setActiveChat(prev => {
      if (!prev || prev.id !== chatId) return prev
      return {
        ...prev,
        messages: [...prev.messages, newMessage],
        updatedAt: new Date(),
      }
    })

    return newMessage
  }, [])

  // Fetch folders when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchFolders()
    } else {
      setFolders([])
      setActiveFolderId(null)
      setActiveChatId(null)
      setActiveChat(null)
    }
  }, [isAuthenticated, fetchFolders])

  return (
    <FoldersContext.Provider value={{
      folders,
      activeFolderId,
      activeFolder,
      activeChatId,
      activeChat,
      isLoading,
      error,
      fetchFolders,
      createFolder,
      updateFolder,
      deleteFolder,
      setActiveFolder,
      uploadFile,
      deleteFile,
      fetchChats,
      fetchChat,
      createChat,
      deleteChat,
      setActiveChat: setActiveChatHandler,
      addMessage,
    }}>
      {children}
    </FoldersContext.Provider>
  )
}
