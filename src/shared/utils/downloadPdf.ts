import { logger } from './logger'

const downloadLogger = logger.createLogger('Download')

// Get API base URL
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // In development, backend runs on port 8000
  if (import.meta.env.DEV) {
    return 'http://localhost:8000'
  }
  // In production, API is on same domain
  return ''
}

/**
 * Downloads a PDF file from a report URL.
 * Handles the conversion from HTML to PDF on the backend.
 *
 * For Supabase Storage URLs, uses the backend's /api/reports/convert-to-pdf endpoint.
 * For local backend URLs, uses the ?download=true parameter.
 *
 * @param reportUrl - The URL to the report (can be relative or absolute)
 * @param filename - Optional filename for the downloaded file
 */
export async function downloadPdf(reportUrl: string, filename?: string): Promise<void> {
  const baseUrl = getApiBaseUrl()

  // Check if this is a Supabase Storage URL (or any external URL)
  const isExternalUrl = reportUrl.startsWith('http') && !reportUrl.includes('/api/reports/')

  let downloadUrl: string

  if (isExternalUrl) {
    // For Supabase/external URLs, use the backend's conversion endpoint
    downloadUrl = `${baseUrl}/api/reports/convert-to-pdf?url=${encodeURIComponent(reportUrl)}`
  } else {
    // For local backend URLs, use ?download=true
    downloadUrl = reportUrl.startsWith('http')
      ? `${reportUrl}?download=true`
      : `${baseUrl}${reportUrl}?download=true`
  }

  try {
    const response = await fetch(downloadUrl)

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`)
    }

    const blob = await response.blob()

    // Determine filename
    let finalFilename = filename
    if (!finalFilename) {
      // Extract filename from URL and change extension to .pdf
      const urlParts = reportUrl.split('/').pop()?.split('?')[0] || 'report.html'
      finalFilename = urlParts.replace('.html', '.pdf')
    }

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = finalFilename
    document.body.appendChild(a)
    a.click()

    // Cleanup
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    downloadLogger.error('PDF download failed', error)
    // Fallback: open in new tab
    window.open(downloadUrl, '_blank')
  }
}
