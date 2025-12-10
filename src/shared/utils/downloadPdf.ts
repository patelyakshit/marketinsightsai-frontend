import { logger } from './logger'

const downloadLogger = logger.createLogger('Download')

/**
 * Downloads a PDF file from a report URL.
 * Handles the conversion from HTML to PDF on the backend.
 *
 * @param reportUrl - The URL to the report (can be relative or absolute)
 * @param filename - Optional filename for the downloaded file
 */
export async function downloadPdf(reportUrl: string, filename?: string): Promise<void> {
  // Build the full download URL
  const baseUrl = import.meta.env.VITE_API_URL || ''
  const downloadUrl = reportUrl.startsWith('http')
    ? `${reportUrl}?download=true`
    : `${baseUrl}${reportUrl}?download=true`

  try {
    const response = await fetch(downloadUrl)

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`)
    }

    const blob = await response.blob()

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || reportUrl.replace('.html', '.pdf').split('/').pop() || 'report.pdf'
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
