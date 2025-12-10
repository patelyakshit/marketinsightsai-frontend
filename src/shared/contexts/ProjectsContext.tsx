import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Project, ChatMessage, Store } from '@/shared/types'
import { loadFromStorage, saveToStorage } from '@/shared/utils/serialization'

const STORAGE_KEY = 'marketinsights_projects'

interface ProjectsContextType {
  projects: Project[]
  activeProjectId: string | null
  activeProject: Project | null
  isNewProject: boolean  // True when user clicked "New Project" but hasn't typed yet
  createProject: (firstMessage?: string) => Project
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => void
  deleteProject: (id: string) => void
  setActiveProject: (id: string | null) => void
  startNewProject: () => void  // Just shows the landing screen, doesn't create until user types
  addMessage: (projectId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage
  setStores: (projectId: string, stores: Store[]) => void
  setSelectedStore: (projectId: string, storeId: string | null) => void
  setReportUrl: (projectId: string, url: string | null) => void
  getProjectById: (id: string) => Project | undefined
}

const ProjectsContext = createContext<ProjectsContextType | null>(null)

export function useProjects() {
  const context = useContext(ProjectsContext)
  if (!context) {
    throw new Error('useProjects must be used within ProjectsProvider')
  }
  return context
}

// Generate a name from the first message
function generateProjectName(message: string): string {
  // Remove file attachments and clean up
  const cleaned = message
    .replace(/📎.*$/m, '')
    .replace(/\n/g, ' ')
    .trim()

  if (!cleaned) return 'New Project'

  // Truncate to first 40 chars and find word boundary
  if (cleaned.length <= 40) return cleaned

  const truncated = cleaned.slice(0, 40)
  const lastSpace = truncated.lastIndexOf(' ')

  return lastSpace > 20 ? truncated.slice(0, lastSpace) + '...' : truncated + '...'
}

interface ProjectsProviderProps {
  children: ReactNode
}

export function ProjectsProvider({ children }: ProjectsProviderProps) {
  const [projects, setProjects] = useState<Project[]>(() => loadFromStorage<Project[]>(STORAGE_KEY, []))
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [isNewProject, setIsNewProject] = useState(true)  // Start with landing screen

  // Save projects to localStorage whenever they change
  useEffect(() => {
    saveToStorage(STORAGE_KEY, projects)
  }, [projects])

  const activeProject = projects.find(p => p.id === activeProjectId) || null

  const createProject = useCallback((firstMessage?: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: firstMessage ? generateProjectName(firstMessage) : 'New Project',
      messages: [],
      stores: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setProjects(prev => [newProject, ...prev])
    setActiveProjectId(newProject.id)
    setIsNewProject(false)  // No longer in new project state
    return newProject
  }, [])

  const startNewProject = useCallback(() => {
    // If already on new project screen (no active project and isNewProject), do nothing
    if (!activeProjectId && isNewProject) return

    // Clear active project and show landing screen
    setActiveProjectId(null)
    setIsNewProject(true)
  }, [activeProjectId, isNewProject])

  const updateProject = useCallback((id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
    setProjects(prev => prev.map(project =>
      project.id === id
        ? { ...project, ...updates, updatedAt: new Date() }
        : project
    ))
  }, [])

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id))
    if (activeProjectId === id) {
      setActiveProjectId(null)
    }
  }, [activeProjectId])

  const setActiveProject = useCallback((id: string | null) => {
    setActiveProjectId(id)
    setIsNewProject(false)  // When selecting an existing project, exit new project mode
  }, [])

  const addMessage = useCallback((projectId: string, messageData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...messageData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }

    setProjects(prev => prev.map(project => {
      if (project.id !== projectId) return project

      // Update project name if this is the first user message
      const isFirstUserMessage =
        messageData.role === 'user' &&
        !project.messages.some(m => m.role === 'user')

      return {
        ...project,
        messages: [...project.messages, newMessage],
        name: isFirstUserMessage ? generateProjectName(messageData.content) : project.name,
        updatedAt: new Date(),
      }
    }))

    return newMessage
  }, [])

  const setStores = useCallback((projectId: string, stores: Store[]) => {
    setProjects(prev => prev.map(project =>
      project.id === projectId
        ? {
            ...project,
            stores,
            selectedStoreId: stores.length > 0 ? stores[0].id : undefined,
            updatedAt: new Date()
          }
        : project
    ))
  }, [])

  const setSelectedStore = useCallback((projectId: string, storeId: string | null) => {
    setProjects(prev => prev.map(project =>
      project.id === projectId
        ? { ...project, selectedStoreId: storeId || undefined, updatedAt: new Date() }
        : project
    ))
  }, [])

  const setReportUrl = useCallback((projectId: string, url: string | null) => {
    setProjects(prev => prev.map(project =>
      project.id === projectId
        ? { ...project, reportUrl: url || undefined, updatedAt: new Date() }
        : project
    ))
  }, [])

  const getProjectById = useCallback((id: string) => {
    return projects.find(project => project.id === id)
  }, [projects])

  return (
    <ProjectsContext.Provider value={{
      projects,
      activeProjectId,
      activeProject,
      isNewProject,
      createProject,
      updateProject,
      deleteProject,
      setActiveProject,
      startNewProject,
      addMessage,
      setStores,
      setSelectedStore,
      setReportUrl,
      getProjectById,
    }}>
      {children}
    </ProjectsContext.Provider>
  )
}
