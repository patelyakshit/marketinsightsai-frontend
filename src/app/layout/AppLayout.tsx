import { useState, createContext, useContext, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { PublicHeader } from './PublicHeader'
import { ProjectsProvider } from '@/shared/contexts/ProjectsContext'
import { ViewModeProvider } from '@/shared/contexts/ViewModeContext'
import { useAuth } from '@/shared/contexts/AuthContext'

interface SidebarContextType {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within AppLayout')
  }
  return context
}

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { isAuthenticated, isLoading } = useAuth()

  const toggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  const contextValue: SidebarContextType = {
    collapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
    toggle,
  }

  return (
    <SidebarContext.Provider value={contextValue}>
      <ProjectsProvider>
        <ViewModeProvider>
          {/* Show loading state while checking authentication */}
          {isLoading ? (
            <div className="flex h-screen items-center justify-center bg-background">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="flex flex-col h-screen overflow-hidden bg-background">
              {/* Show public header for unauthenticated users */}
              {!isAuthenticated && <PublicHeader />}

              <div className="flex flex-1 overflow-hidden">
                {/* Only show sidebar for authenticated users */}
                {isAuthenticated && <Sidebar collapsed={sidebarCollapsed} />}

                <main className="flex-1 overflow-hidden h-full">
                  <Outlet />
                </main>
              </div>
            </div>
          )}
        </ViewModeProvider>
      </ProjectsProvider>
    </SidebarContext.Provider>
  )
}
