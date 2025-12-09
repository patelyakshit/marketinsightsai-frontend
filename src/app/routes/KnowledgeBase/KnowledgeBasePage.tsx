import { useState, useEffect } from 'react'
import { Upload, FileText, Trash2, Search, Loader2, FolderOpen, BookOpen, File } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card'
import type { KnowledgeDocument } from '@/shared/types'
import { cn } from '@/shared/utils/cn'
import { getApiUrl } from '@/shared/hooks/useApi'

export function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(getApiUrl('/kb/documents'))
      if (!response.ok) throw new Error('Failed to fetch documents')
      const data = await response.json()
      setDocuments(data.documents)
    } catch (error) {
      console.error('Error fetching documents:', error)
      setDocuments([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(getApiUrl('/kb/upload'), {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')
      await fetchDocuments()
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (documentId: string) => {
    if (confirmDelete === documentId) {
      try {
        const response = await fetch(getApiUrl(`/kb/documents/${documentId}`), {
          method: 'DELETE',
        })

        if (!response.ok) throw new Error('Delete failed')
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
      } catch (error) {
        console.error('Delete error:', error)
      }
      setConfirmDelete(null)
    } else {
      setConfirmDelete(documentId)
      setTimeout(() => setConfirmDelete(null), 3000)
    }
  }

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getFileIcon = (title: string) => {
    if (title.endsWith('.pdf')) return File
    if (title.endsWith('.md')) return FileText
    return FileText
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border/50 px-6 bg-card">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-md shadow-primary/20">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Knowledge Base</h1>
            <p className="text-xs text-muted-foreground">
              {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
            </p>
          </div>
        </div>
      </div>

      {/* Search and Upload Bar */}
      <div className="border-b border-border/50 px-6 py-4 bg-card">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".md,.pdf,.txt,.docx"
              onChange={handleUpload}
              className="hidden"
              disabled={isUploading}
            />
            <Button disabled={isUploading} className="h-12 px-6 rounded-xl gradient-primary hover:opacity-90 shadow-lg shadow-primary/25 pointer-events-none">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
          </label>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-muted-foreground">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-accent to-background mb-6">
                <FolderOpen className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">No documents yet</h3>
              <p className="mt-3 max-w-md text-muted-foreground">
                Upload documents to build your knowledge base. Supported formats: Markdown, PDF, TXT, and DOCX.
              </p>
              <label className="mt-6 cursor-pointer">
                <input
                  type="file"
                  accept=".md,.pdf,.txt,.docx"
                  onChange={handleUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button className="h-12 px-8 rounded-xl gradient-primary hover:opacity-90 shadow-lg shadow-primary/25 pointer-events-none">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Your First Document
                </Button>
              </label>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">No matching documents</h3>
              <p className="mt-2 text-muted-foreground">Try adjusting your search terms</p>
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
                className="mt-4"
              >
                Clear search
              </Button>
            </div>
          ) : (
            <Card className="overflow-hidden border-border/50 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-accent to-background pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Your Documents</CardTitle>
                    <CardDescription>
                      {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} {searchQuery && 'matching your search'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {filteredDocuments.map((doc) => {
                    const FileIcon = getFileIcon(doc.title)
                    return (
                      <div
                        key={doc.id}
                        className="group flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
                            <FileIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate text-foreground">{doc.title}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                {doc.metadata.category || 'Document'}
                              </span>
                              {doc.metadata.segmentCode && (
                                <span className="text-xs text-muted-foreground">
                                  {doc.metadata.segmentCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={confirmDelete === doc.id ? 'destructive' : 'ghost'}
                          size="icon"
                          onClick={() => handleDelete(doc.id)}
                          title={confirmDelete === doc.id ? 'Click again to confirm' : 'Delete'}
                          className={cn(
                            "rounded-xl shrink-0 ml-4",
                            confirmDelete === doc.id && 'animate-pulse'
                          )}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
