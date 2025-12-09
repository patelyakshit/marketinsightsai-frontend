import { useState, useEffect } from 'react'
import { useLocation } from 'react-router'
import {
  FileText,
  Download,
  Trash2,
  Library,
  Search,
  Calendar,
  Store as StoreIcon,
  Eye,
  FolderOpen,
  Image,
  Map,
  FileQuestion,
  LayoutGrid,
  Instagram,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useLibrary } from '@/shared/contexts/LibraryContext'
import { cn } from '@/shared/utils/cn'
import { downloadPdf } from '@/shared/utils/downloadPdf'
import type { LibraryCategory } from '@/shared/types'

const categories: { id: LibraryCategory; label: string; icon: typeof FileText }[] = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'marketing-post', label: 'Marketing', icon: Instagram },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'placestory', label: 'Placestory', icon: Map },
  { id: 'other', label: 'Other', icon: FileQuestion },
]

export function LibraryPage() {
  const { items, removeItem, getItemsByCategory } = useLibrary()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<LibraryCategory>('all')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const location = useLocation()

  // Handle deep link to specific item
  useEffect(() => {
    const state = location.state as { selectedItemId?: string } | null
    if (state?.selectedItemId) {
      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        setSelectedItemId(state.selectedItemId!)
        window.history.replaceState({}, '')
      })
    }
  }, [location.state])

  const categoryItems = getItemsByCategory(activeCategory)
  const filteredItems = categoryItems.filter(item =>
    item.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.projectName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      removeItem(id)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
      setTimeout(() => setConfirmDelete(null), 3000)
    }
  }

  const getCategoryCount = (category: LibraryCategory) => {
    if (category === 'all') return items.length
    return items.filter(item => item.type === category).length
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return FileText
      case 'image':
        return Image
      case 'placestory':
        return Map
      case 'marketing-post':
        return Instagram
      default:
        return FileQuestion
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border/50 px-6 bg-card">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-md shadow-primary/20">
            <Library className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Library</h1>
            <p className="text-xs text-muted-foreground">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Category Tabs & Search */}
      <div className="border-b border-border/50 px-6 py-4 bg-card space-y-4">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((cat) => {
            const count = getCategoryCount(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-xs',
                  activeCategory === cat.id
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-background text-muted-foreground'
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by store name, goal, or project..."
            className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-accent to-background mb-6">
              <FolderOpen className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">No saved items yet</h3>
            <p className="mt-3 max-w-md text-muted-foreground">
              Reports are automatically saved to your library when generated. Start by uploading a tapestry file and generating a report.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No matching items</h3>
            <p className="mt-2 text-muted-foreground">Try adjusting your search or category</p>
            <div className="flex gap-2 mt-4">
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </Button>
              )}
              {activeCategory !== 'all' && (
                <Button
                  variant="outline"
                  onClick={() => setActiveCategory('all')}
                >
                  Show all
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => {
              const TypeIcon = getTypeIcon(item.type)
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group flex flex-col rounded-2xl border border-border/50 bg-card p-5 transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30",
                    selectedItemId === item.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedItemId(item.id === selectedItemId ? null : item.id)}
                >
                  {/* Report Icon & Store Name */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
                      <TypeIcon className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="font-bold truncate text-foreground">{item.storeName}</h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
                          <StoreIcon className="h-3 w-3" />
                          {item.goal}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium uppercase">
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Project Name */}
                  {item.projectName && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 px-1">
                      <span className="truncate">From: {item.projectName}</span>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5 px-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Saved {new Date(item.savedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-border/50 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(item.reportUrl, '_blank')
                      }}
                      className="flex-1 gap-2 rounded-xl"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadPdf(item.reportUrl)
                      }}
                      title="Download PDF"
                      className="rounded-xl"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={confirmDelete === item.id ? 'destructive' : 'outline'}
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(item.id)
                      }}
                      title={confirmDelete === item.id ? 'Click again to confirm' : 'Delete'}
                      className={cn(
                        "rounded-xl",
                        confirmDelete === item.id && 'animate-pulse'
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
