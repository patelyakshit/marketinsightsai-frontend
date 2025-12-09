import { useState, useEffect, useRef } from 'react'
import { Search, X, MessageSquare, FileText, Clock, Folder } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useProjects } from '@/shared/contexts/ProjectsContext'
import { useLibrary } from '@/shared/contexts/LibraryContext'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectProject: (projectId: string) => void
  onSelectLibraryItem: (itemId: string) => void
}

type SearchTab = 'all' | 'projects' | 'library'

export function SearchModal({ isOpen, onClose, onSelectProject, onSelectLibraryItem }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<SearchTab>('all')
  const inputRef = useRef<HTMLInputElement>(null)

  const { projects } = useProjects()
  const { items: libraryItems, searchItems } = useLibrary()

  useEffect(() => {
    if (isOpen) {
      // Use requestAnimationFrame to avoid synchronous setState
      requestAnimationFrame(() => {
        setQuery('')
        setActiveTab('all')
      })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const lowerQuery = query.toLowerCase()

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(lowerQuery) ||
    project.messages.some(m => m.content.toLowerCase().includes(lowerQuery))
  )

  const filteredLibraryItems = query ? searchItems(query) : libraryItems

  const showProjects = activeTab === 'all' || activeTab === 'projects'
  const showLibrary = activeTab === 'all' || activeTab === 'library'

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-popover rounded-lg shadow-lg border overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-2 px-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects and library..."
            className="flex-1 py-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">esc</kbd>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-2 py-1.5 border-b bg-muted/30">
          {[
            { id: 'all' as const, label: 'All' },
            { id: 'projects' as const, label: 'Projects' },
            { id: 'library' as const, label: 'Library' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded transition-colors',
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-[40vh] overflow-auto p-1.5">
          {/* Projects Section */}
          {showProjects && filteredProjects.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1.5 px-2 py-1">
                <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Projects
                </span>
              </div>
              <div className="space-y-0.5">
                {filteredProjects.slice(0, 5).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      onSelectProject(project.id)
                      onClose()
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-muted transition-colors text-left"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-muted shrink-0">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(project.updatedAt)}</span>
                        <span>•</span>
                        <span>{project.messages.length} messages</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Library Section */}
          {showLibrary && filteredLibraryItems.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Library
                </span>
              </div>
              <div className="space-y-0.5">
                {filteredLibraryItems.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectLibraryItem(item.id)
                      onClose()
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-muted transition-colors text-left"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-accent/10 shrink-0">
                      <FileText className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.storeName}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="capitalize">{item.type}</span>
                        <span>•</span>
                        <span>{item.goal}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredProjects.length === 0 && filteredLibraryItems.length === 0 && (
            <div className="py-8 text-center">
              <Search className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                {query ? 'No results found' : 'Start typing to search...'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t bg-muted/30 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">↵</kbd>
              Open
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
