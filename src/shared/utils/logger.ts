/**
 * Centralized Logger Utility
 *
 * Provides consistent logging across the application with Sentry integration.
 * In production, errors are sent to Sentry. In development, logs go to console.
 */

import * as Sentry from '@sentry/react'

interface LogContext {
  [key: string]: unknown
}

const isDev = import.meta.env.DEV

/**
 * Log a debug message (development only)
 */
function debug(message: string, context?: LogContext): void {
  if (isDev) {
    console.debug(`[DEBUG] ${message}`, context ?? '')
  }
}

/**
 * Log an info message (development only)
 */
function info(message: string, context?: LogContext): void {
  if (isDev) {
    console.info(`[INFO] ${message}`, context ?? '')
  }
}

/**
 * Log a warning message
 * In production, adds breadcrumb to Sentry
 */
function warn(message: string, context?: LogContext): void {
  if (isDev) {
    console.warn(`[WARN] ${message}`, context ?? '')
  } else {
    Sentry.addBreadcrumb({
      category: 'warning',
      message,
      level: 'warning',
      data: context,
    })
  }
}

/**
 * Log an error message
 * In production, captures exception in Sentry
 */
function error(message: string, err?: Error | unknown, context?: LogContext): void {
  if (isDev) {
    console.error(`[ERROR] ${message}`, err ?? '', context ?? '')
  } else {
    // Add context as breadcrumb
    Sentry.addBreadcrumb({
      category: 'error',
      message,
      level: 'error',
      data: context,
    })

    // Capture the error
    if (err instanceof Error) {
      Sentry.captureException(err, {
        extra: context,
      })
    } else if (err) {
      Sentry.captureMessage(`${message}: ${String(err)}`, {
        level: 'error',
        extra: context,
      })
    } else {
      Sentry.captureMessage(message, {
        level: 'error',
        extra: context,
      })
    }
  }
}

/**
 * Create a scoped logger with a prefix
 */
function createLogger(scope: string) {
  return {
    debug: (message: string, context?: LogContext) => debug(`[${scope}] ${message}`, context),
    info: (message: string, context?: LogContext) => info(`[${scope}] ${message}`, context),
    warn: (message: string, context?: LogContext) => warn(`[${scope}] ${message}`, context),
    error: (message: string, err?: Error | unknown, context?: LogContext) =>
      error(`[${scope}] ${message}`, err, context),
  }
}

export const logger = {
  debug,
  info,
  warn,
  error,
  createLogger,
}

export default logger
