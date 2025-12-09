import { useState } from 'react'
import { FolderOpen, FileText, Plus, X, Loader2 } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { Folder, FolderFile } from '@/shared/types'

interface FolderHeaderProps {
  folder: Folder
  onAddFiles: () => void
  onViewFiles: () => void
}

export function FolderHeader({ folder, onAddFiles, onViewFiles }: FolderHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
      <div className="flex items-center gap-3">
        <FolderOpen className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">{folder.name}</h1>
      </div>
      <button
        onClick={folder.fileCount > 0 ? onViewFiles : onAddFiles}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors text-sm"
      >
        <FileText className="h-4 w-4 text-green-600" />
        <span className="text-muted-foreground">
          {folder.fileCount > 0 ? `${folder.fileCount} file${folder.fileCount > 1 ? 's' : ''}` : 'Add files'}
        </span>
      </button>
    </div>
  )
}

interface FolderFilesModalProps {
  isOpen: boolean
  folder: Folder
  onClose: () => void
  onUploadFile: (file: File) => Promise<void>
  onDeleteFile: (fileId: string) => Promise<void>
}

const FILE_TYPE_ICONS: Record<string, string> = {
  xlsx: 'text-green-600',
  pdf: 'text-red-500',
  csv: 'text-blue-500',
  txt: 'text-gray-500',
  json: 'text-yellow-600',
  other: 'text-gray-400',
}

export function FolderFilesModal({
  isOpen,
  folder,
  onClose,
  onUploadFile,
  onDeleteFile,
}: FolderFilesModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      await onUploadFile(file)
    } catch (error) {
      console.error('Failed to upload file:', error)
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    setDeletingFileId(fileId)
    try {
      await onDeleteFile(fileId)
    } catch (error) {
      console.error('Failed to delete file:', error)
    } finally {
      setDeletingFileId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Folder files</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {folder.files.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">
                Add files for this folder to reference in any chat.
              </p>
              <p className="text-sm text-muted-foreground">
                Excel files will be automatically parsed for store data.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {folder.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className={cn('h-5 w-5 shrink-0', FILE_TYPE_ICONS[file.fileType])} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.originalFilename}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.fileSize ? `${Math.round(file.fileSize / 1024)} KB` : 'Unknown size'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    disabled={deletingFileId === file.id}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  >
                    {deletingFileId === file.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t">
          <label className="w-full">
            <input
              type="file"
              accept=".xlsx,.xls,.pdf,.csv,.txt,.json"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            <div className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
              isUploading
                ? "border-muted bg-muted/50 cursor-not-allowed"
                : "border-muted-foreground/30 hover:border-primary hover:bg-muted/50"
            )}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Add file</span>
                </>
              )}
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
