import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router'
import {
  Plus,
  Search,
  Library,
  MessageSquare,
  Trash2,
  MoreHorizontal,
  PanelLeft,
  Columns2,
  Maximize2,
  List,
  ChevronsRight,
  ChevronsLeft,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useProjects } from '@/shared/contexts/ProjectsContext'
import { useViewMode } from '@/shared/contexts/ViewModeContext'
import { useSidebar } from '@/app/layout/AppLayout'
import { SearchModal } from '@/shared/components/SearchModal'
import { ProfileDropdown } from '@/shared/components/ProfileDropdown'
import type { ViewMode } from '@/shared/types'
import LogoIcon from '@/assets/logo-icon.svg?react'
import LogoWordmark from '@/assets/logo-wordmark.svg?react'

interface SidebarProps {
  collapsed: boolean
}

const viewModes: { id: ViewMode; icon: typeof PanelLeft; label: string }[] = [
  { id: 'chat', icon: PanelLeft, label: 'Chat' },
  { id: 'split', icon: Columns2, label: 'Split' },
  { id: 'canvas', icon: Maximize2, label: 'Canvas' },
]

export function Sidebar({ collapsed }: SidebarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [isLogoHovered, setIsLogoHovered] = useState(false)
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const { projects, activeProjectId, isNewProject, startNewProject, deleteProject, setActiveProject } = useProjects()
  const { viewMode, setViewMode } = useViewMode()
  const sidebar = useSidebar()

  const handleNewProject = () => {
    startNewProject()
    navigate('/')
  }

  // Check if "New Project" should appear selected (when on landing screen)
  const isNewProjectActive = isNewProject && !activeProjectId && location.pathname === '/'

  const handleSelectProject = (projectId: string) => {
    setActiveProject(projectId)
    navigate('/')
  }

  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation()
    if (confirmDeleteId === projectId) {
      deleteProject(projectId)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(projectId)
      setTimeout(() => setConfirmDeleteId(null), 3000)
    }
  }

  const handleOpenLibrary = () => {
    navigate('/library')
  }

  const handleSearchSelectProject = (projectId: string) => {
    setActiveProject(projectId)
    navigate('/')
  }

  const handleSearchSelectLibraryItem = (itemId: string) => {
    navigate('/library', { state: { selectedItemId: itemId } })
  }

  const isLibraryActive = location.pathname === '/library'

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey

      if (modifier && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        handleNewProject()
      } else if (modifier && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <aside
        className={cn(
          'relative flex h-screen flex-col bg-neutral-50 border-r border-neutral-200 transition-all duration-200',
          collapsed ? 'w-[60px]' : 'w-64'
        )}
      >
        {/* Logo Header - with expand on hover when collapsed */}
        <div
          className={cn(
            "flex items-center border-b border-neutral-200 h-12 transition-colors",
            collapsed ? "justify-center px-2" : "justify-between px-3",
            collapsed && isLogoHovered && "bg-muted/50"
          )}
          onMouseEnter={() => collapsed && setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
        >
          {!collapsed && (
            <>
              <div className="flex items-center gap-2">
                <LogoIcon className="h-6 w-auto text-foreground" />
                <LogoWordmark className="h-5 w-auto text-foreground" />
              </div>
              <button
                onClick={() => sidebar.setCollapsed(true)}
                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Collapse sidebar"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            </>
          )}
          {collapsed && (
            <button
              onClick={() => sidebar.setCollapsed(false)}
              className="flex items-center justify-center transition-colors"
              title="Expand sidebar"
            >
              {isLogoHovered ? (
                <ChevronsRight className="h-4 w-4 text-muted-foreground" />
              ) : (
                <LogoIcon className="h-6 w-auto text-foreground" />
              )}
            </button>
          )}
        </div>

        {/* Top Actions */}
        <div className="p-2 space-y-0.5">
          {/* New Project */}
          <button
            onClick={handleNewProject}
            onMouseEnter={() => setHoveredButton('new-project')}
            onMouseLeave={() => setHoveredButton(null)}
            className={cn(
              'w-full flex items-center gap-2 rounded-md px-2 h-8 text-sm transition-colors',
              isNewProjectActive
                ? 'bg-neutral-200 text-foreground'
                : 'text-muted-foreground hover:bg-neutral-200/80 hover:text-foreground',
              collapsed && 'justify-center px-0'
            )}
          >
            <Plus className="h-4 w-4" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">New project</span>
                {hoveredButton === 'new-project' && (
                  <kbd className="text-[10px] text-muted-foreground bg-neutral-100 px-1 rounded">⌘O</kbd>
                )}
              </>
            )}
          </button>

          {/* Search */}
          <button
            onClick={() => setIsSearchOpen(true)}
            onMouseEnter={() => setHoveredButton('search')}
            onMouseLeave={() => setHoveredButton(null)}
            className={cn(
              'w-full flex items-center gap-2 rounded-md px-2 h-8 text-sm transition-colors',
              'text-muted-foreground hover:bg-neutral-200/80 hover:text-foreground',
              collapsed && 'justify-center px-0'
            )}
          >
            <Search className="h-4 w-4" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Search</span>
                {hoveredButton === 'search' && (
                  <kbd className="text-[10px] text-muted-foreground bg-neutral-100 px-1 rounded">⌘K</kbd>
                )}
              </>
            )}
          </button>

          {/* Library */}
          <button
            onClick={handleOpenLibrary}
            className={cn(
              'w-full flex items-center gap-2 rounded-md px-2 h-8 text-sm transition-colors',
              isLibraryActive
                ? 'bg-neutral-200 text-foreground'
                : 'text-muted-foreground hover:bg-neutral-200/80 hover:text-foreground',
              collapsed && 'justify-center px-0'
            )}
          >
            <Library className="h-4 w-4" />
            {!collapsed && <span className="flex-1 text-left">Library</span>}
          </button>

          {/* Projects List Toggle (collapsed only) */}
          {collapsed && projects.length > 0 && (
            <button
              className="w-full flex items-center justify-center rounded-md px-0 h-8 text-muted-foreground hover:bg-neutral-200/80 hover:text-foreground transition-colors"
              title="Projects"
            >
              <List className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Projects Section */}
        <div className="flex-1 overflow-auto px-2">
          {/* Projects Section - only show when there are projects */}
          {projects.length > 0 && (
            <>
              {!collapsed && (
                <div className="flex items-center px-2 py-1 mt-2">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Chats
                  </span>
                </div>
              )}

              {collapsed && (
                <div className="flex justify-center py-2">
                  <div className="h-px w-6 bg-border" />
                </div>
              )}

              <div className="space-y-0.5">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSelectProject(project.id)}
                    onMouseEnter={() => setHoveredProjectId(project.id)}
                    onMouseLeave={() => {
                      setHoveredProjectId(null)
                      if (confirmDeleteId === project.id) {
                        setConfirmDeleteId(null)
                      }
                    }}
                    title={collapsed ? project.name : undefined}
                    className={cn(
                      'group w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                      activeProjectId === project.id
                        ? 'bg-neutral-200 text-foreground'
                        : 'text-muted-foreground hover:bg-neutral-200/80 hover:text-foreground',
                      collapsed && 'justify-center px-1.5'
                    )}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate text-left text-sm">
                          {project.name}
                        </span>
                        {(hoveredProjectId === project.id || confirmDeleteId === project.id) && (
                          <button
                            onClick={(e) => handleDeleteProject(e, project.id)}
                            className={cn(
                              'p-0.5 rounded transition-colors',
                              confirmDeleteId === project.id
                                ? 'bg-destructive text-destructive-foreground'
                                : 'hover:bg-muted'
                            )}
                          >
                            {confirmDeleteId === project.id ? (
                              <Trash2 className="h-3.5 w-3.5" />
                            ) : (
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* View Mode Tabs */}
        <div className="border-t border-neutral-200 p-2">
          {collapsed ? (
            // Vertical icon-only tabs when collapsed
            <div className="flex flex-col gap-0.5">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  title={mode.label}
                  className={cn(
                    'flex h-8 w-full items-center justify-center rounded-md transition-colors',
                    viewMode === mode.id
                      ? 'bg-neutral-200 text-foreground'
                      : 'text-muted-foreground hover:bg-neutral-200/80 hover:text-foreground'
                  )}
                >
                  <mode.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          ) : (
            // Horizontal tabs with labels when expanded
            <div className="flex rounded-md bg-neutral-100 p-0.5">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 rounded py-1 text-xs transition-colors',
                    viewMode === mode.id
                      ? 'bg-white text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <mode.icon className="h-3.5 w-3.5" />
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div className="border-t border-neutral-200 p-2">
          <ProfileDropdown collapsed={collapsed} />
        </div>
      </aside>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProject={handleSearchSelectProject}
        onSelectLibraryItem={handleSearchSelectLibraryItem}
      />
    </>
  )
}
