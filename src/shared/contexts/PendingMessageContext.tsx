// Utility functions for storing pending message in localStorage
// Used when unauthenticated users try to send a message

const STORAGE_KEY = 'marketinsights_pending_message'

interface PendingMessage {
  content: string
}

export function getPendingMessage(): PendingMessage | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load pending message:', error)
  }
  return null
}

export function storePendingMessage(content: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ content }))
  } catch (error) {
    console.error('Failed to save pending message:', error)
  }
}

export function clearStoredPendingMessage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear pending message:', error)
  }
}
