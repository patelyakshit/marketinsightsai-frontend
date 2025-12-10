/**
 * Serialization utilities for localStorage with Date handling
 *
 * These utilities handle proper serialization/deserialization of objects
 * containing Date instances, which are lost when using plain JSON.stringify/parse.
 */

import { logger } from './logger'

const storageLogger = logger.createLogger('Storage')

/**
 * Serialize data to JSON string, preserving Date objects
 */
export function serializeWithDates<T>(data: T): string {
  return JSON.stringify(data, (_key, value) => {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() }
    }
    return value
  })
}

/**
 * Deserialize JSON string, restoring Date objects
 */
export function deserializeWithDates<T>(json: string): T {
  return JSON.parse(json, (_key, value) => {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value)
    }
    return value
  })
}

/**
 * Helper to safely load data from localStorage with Date restoration
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      return deserializeWithDates<T>(stored)
    }
  } catch (error) {
    storageLogger.error(`Failed to load ${key} from localStorage`, error)
  }
  return defaultValue
}

/**
 * Helper to safely save data to localStorage with Date serialization
 */
export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, serializeWithDates(data))
  } catch (error) {
    storageLogger.error(`Failed to save ${key} to localStorage`, error)
  }
}
