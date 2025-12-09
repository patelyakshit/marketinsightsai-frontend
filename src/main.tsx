import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'

// Initialize Sentry for error monitoring
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance monitoring - capture 20% in production, 100% in dev
    tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.2,
    // Session replay - capture 10% of sessions, 100% on error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Only send errors from your domain
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/marketinsightsai\.vercel\.app/,
      /^https:\/\/marketinsightsai-api\.onrender\.com/,
    ],
  })
  console.log('Sentry initialized for environment:', import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
