import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { LibraryItem, LibraryCategory } from '@/shared/types'
import { loadFromStorage, saveToStorage } from '@/shared/utils/serialization'

const STORAGE_KEY = 'marketinsights_library'

interface LibraryContextType {
  items: LibraryItem[]
  addItem: (item: Omit<LibraryItem, 'id' | 'savedAt'>) => LibraryItem
  removeItem: (id: string) => void
  getItemById: (id: string) => LibraryItem | undefined
  getItemsByCategory: (category: LibraryCategory) => LibraryItem[]
  searchItems: (query: string) => LibraryItem[]
}

const LibraryContext = createContext<LibraryContextType | null>(null)

export function useLibrary() {
  const context = useContext(LibraryContext)
  if (!context) {
    throw new Error('useLibrary must be used within LibraryProvider')
  }
  return context
}

interface LibraryProviderProps {
  children: ReactNode
}

export function LibraryProvider({ children }: LibraryProviderProps) {
  const [items, setItems] = useState<LibraryItem[]>(() => loadFromStorage<LibraryItem[]>(STORAGE_KEY, []))

  // Save items to localStorage whenever they change
  useEffect(() => {
    saveToStorage(STORAGE_KEY, items)
  }, [items])

  const addItem = useCallback((itemData: Omit<LibraryItem, 'id' | 'savedAt'>) => {
    const newItem: LibraryItem = {
      ...itemData,
      id: crypto.randomUUID(),
      savedAt: new Date(),
    }
    setItems(prev => [newItem, ...prev])
    return newItem
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const getItemById = useCallback((id: string) => {
    return items.find(item => item.id === id)
  }, [items])

  const getItemsByCategory = useCallback((category: LibraryCategory) => {
    if (category === 'all') return items
    return items.filter(item => item.type === category)
  }, [items])

  const searchItems = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase()
    return items.filter(item =>
      item.storeName.toLowerCase().includes(lowerQuery) ||
      item.goal.toLowerCase().includes(lowerQuery) ||
      item.projectName?.toLowerCase().includes(lowerQuery)
    )
  }, [items])

  return (
    <LibraryContext.Provider value={{
      items,
      addItem,
      removeItem,
      getItemById,
      getItemsByCategory,
      searchItems,
    }}>
      {children}
    </LibraryContext.Provider>
  )
}
