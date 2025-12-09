import { useState } from 'react'
import { Upload, FileText, Download, Eye, Loader2, FileSpreadsheet, MapPin, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card'
import type { Store } from '@/shared/types'
import { getApiUrl, getFullApiUrl } from '@/shared/hooks/useApi'

export function TapestryReportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportUrl, setReportUrl] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setStores([])
      setSelectedStore(null)
      setReportUrl(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(getApiUrl('/reports/tapestry/upload'), {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      setStores(data.stores)
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!selectedStore) return

    setIsGenerating(true)
    setReportUrl(null)

    try {
      const response = await fetch(getApiUrl('/reports/tapestry/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: selectedStore.id }),
      })

      if (!response.ok) throw new Error('Report generation failed')

      const data = await response.json()
      setReportUrl(data.reportUrl)
    } catch (error) {
      console.error('Report generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Calculate current step
  const currentStep = reportUrl ? 3 : selectedStore ? 2 : stores.length > 0 ? 1 : 0

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border/50 px-6 bg-card">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-md shadow-primary/20">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Tapestry Report Generator</h2>
            <p className="text-xs text-muted-foreground">Create beautiful PDF reports from Esri data</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl p-6 space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 py-4">
            {[
              { label: 'Upload', step: 0 },
              { label: 'Select Store', step: 1 },
              { label: 'Generate', step: 2 },
              { label: 'Download', step: 3 }
            ].map((item, index) => (
              <div key={item.label} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                    currentStep > item.step
                      ? 'gradient-primary text-white'
                      : currentStep === item.step
                      ? 'border-2 border-primary text-primary bg-primary/5'
                      : 'border-2 border-border text-muted-foreground'
                  }`}>
                    {currentStep > item.step ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${
                    currentStep >= item.step ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {item.label}
                  </span>
                </div>
                {index < 3 && (
                  <ArrowRight className={`h-4 w-4 mx-3 ${
                    currentStep > item.step ? 'text-primary' : 'text-border'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Upload Card */}
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-accent to-background pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Upload Tapestry Data</CardTitle>
                  <CardDescription>
                    Upload an Esri tapestry XLSX file to get started
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className={`flex items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 transition-all ${
                    file
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border hover:border-primary/30 hover:bg-accent'
                  }`}>
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                      file ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <FileSpreadsheet className={`h-7 w-7 ${file ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="text-left">
                      {file ? (
                        <>
                          <p className="font-semibold text-foreground">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB - Click to change
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-foreground">Drop your file here</p>
                          <p className="text-sm text-muted-foreground">
                            or click to browse (.xlsx, .xls)
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </label>
                <Button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="h-12 px-6 rounded-xl gradient-primary hover:opacity-90 shadow-lg shadow-primary/25"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload File
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Store Selection Card */}
          {stores.length > 0 && (
            <Card className="overflow-hidden border-border/50 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
              <CardHeader className="bg-gradient-to-r from-accent to-background pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Select Store</CardTitle>
                    <CardDescription>
                      Found {stores.length} store{stores.length > 1 ? 's' : ''} in your data
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => setSelectedStore(store)}
                      className={`group flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                        selectedStore?.id === store.id
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                          : 'border-border/50 hover:border-primary/30 hover:bg-accent'
                      }`}
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                        selectedStore?.id === store.id
                          ? 'gradient-primary text-white'
                          : 'bg-muted group-hover:bg-primary/10'
                      }`}>
                        <MapPin className={`h-5 w-5 ${
                          selectedStore?.id === store.id ? 'text-white' : 'text-muted-foreground group-hover:text-primary'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate ${
                          selectedStore?.id === store.id ? 'text-primary' : 'text-foreground'
                        }`}>{store.name}</p>
                        {store.address && (
                          <p className="text-sm text-muted-foreground truncate">{store.address}</p>
                        )}
                      </div>
                      {selectedStore?.id === store.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate Report Card */}
          {selectedStore && (
            <Card className="overflow-hidden border-border/50 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
              <CardHeader className="bg-gradient-to-r from-accent to-background pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Generate Report</CardTitle>
                    <CardDescription>
                      Create a beautiful 3-page PDF report for <span className="font-semibold text-foreground">{selectedStore.name}</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="w-full h-14 rounded-xl text-base font-semibold gradient-primary hover:opacity-90 shadow-lg shadow-primary/25"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating your report...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Report
                    </>
                  )}
                </Button>

                {reportUrl && (
                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">Report Generated Successfully!</p>
                        <p className="text-sm text-green-600">Your report is ready to view and download</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href={reportUrl.startsWith('http') ? reportUrl : getFullApiUrl(reportUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button variant="outline" className="w-full h-11 rounded-xl border-green-300 bg-white hover:bg-green-50 text-green-700">
                          <Eye className="mr-2 h-4 w-4" />
                          Preview Report
                        </Button>
                      </a>
                      <Button
                        className="flex-1 h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          // Use fetch to get PDF blob and trigger download
                          const downloadUrl = reportUrl.startsWith('http')
                            ? `${reportUrl}?download=true`
                            : `${getFullApiUrl(reportUrl)}?download=true`
                          fetch(downloadUrl)
                            .then(res => res.blob())
                            .then(blob => {
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = reportUrl.replace('.html', '.pdf').split('/').pop() || 'report.pdf'
                              document.body.appendChild(a)
                              a.click()
                              window.URL.revokeObjectURL(url)
                              document.body.removeChild(a)
                            })
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
