import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import {
  Plus,
  Loader2,
  FileSpreadsheet,
  X,
  Mic,
  AudioLines,
  Image,
  MapPin,
  FileText,
  Map,
  LayoutGrid,
  Send,
  GripVertical,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { getApiUrl } from '@/shared/hooks/useApi'
import type { Store, MapAction, MarketingAction, StudioTab, MarketingPost, MarketingRecommendation } from '@/shared/types'
import { useSidebar } from '@/app/layout/AppLayout'
import { useLibrary } from '@/shared/contexts/LibraryContext'
import { useProjects } from '@/shared/contexts/ProjectsContext'
import { useFolders } from '@/shared/contexts/FoldersContext'
import { useViewMode } from '@/shared/contexts/ViewModeContext'
import { useAuth } from '@/shared/contexts/AuthContext'
import { storePendingMessage, getPendingMessage, clearStoredPendingMessage } from '@/shared/contexts/PendingMessageContext'
import { MapView, type MapViewRef } from '@/shared/components/MapView'
import { StudioView } from '@/shared/components/StudioView'
import { FolderHeader, FolderFilesModal } from '@/shared/components/FolderHeader'

type RightPanelTab = 'map' | 'studio'

// Quick actions for landing screen
const quickActions = [
  { id: 'marketing', icon: Image, label: 'Create Marketing Post', disabled: false, prompt: 'Create marketing post for ' },
  { id: 'report', icon: FileText, label: 'Create Report', disabled: false, prompt: 'Create report for ' },
  { id: 'placestory', icon: MapPin, label: 'Create Placestory', disabled: true, badge: 'Soon', prompt: '' },
]

// Suggestion cards for landing screen
const suggestions = [
  'Is Uptown Dallas a good area for opening a car wash?',
  'Scan competition within 3 miles of Scottsdale Fashion Square.',
  'Compare Plano, TX and Frisco, TX for a new gym location.',
]

// Type for selected quick action
type SelectedAction = {
  id: string
  label: string
  prompt: string
  icon: typeof Image
} | null

// Landing Content Component - extracted to prevent re-creation on every render
interface LandingContentProps {
  showRightPanel: boolean
  input: string
  setInput: (value: string) => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  pendingFile: File | null
  setPendingFile: (file: File | null) => void
  handleFileSelect: (file: File) => void
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  landingInputRef: React.RefObject<HTMLInputElement | null>
  fileInputRef: React.RefObject<HTMLInputElement | null>
  selectedAction: SelectedAction
  onSelectAction: (action: SelectedAction) => void
}

const LandingContent = memo(function LandingContent({
  showRightPanel,
  input,
  setInput,
  handleKeyDown,
  pendingFile,
  setPendingFile,
  handleFileSelect,
  handleSubmit,
  isLoading,
  landingInputRef,
  fileInputRef,
  selectedAction,
  onSelectAction,
}: LandingContentProps) {
  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Heading */}
        <h1 className={cn(
          "font-semibold text-foreground mb-8 text-center",
          showRightPanel ? "text-xl" : "text-2xl md:text-3xl"
        )}>
          What business decision can I help you with?
        </h1>

        {/* Search Input Box */}
        <div className="w-full max-w-2xl">
          <div className="rounded-lg border bg-background shadow-sm">
            {/* Input Row */}
            <div className="px-4 py-3">
              <input
                ref={landingInputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedAction ? "Type store name or location..." : "Ask anything about a location, building, market, or customer segment..."}
                className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Pending File */}
            {pendingFile && (
              <div className="px-4 pb-2">
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-2.5 py-1.5 text-sm w-fit">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-accent" />
                  <span className="truncate max-w-[200px]">{pendingFile.name}</span>
                  <button
                    onClick={() => setPendingFile(null)}
                    className="rounded p-0.5 hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between px-3 py-2 border-t">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                    e.target.value = ''
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted transition-colors"
                >
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </button>
                {/* Selected Action Chip - next to plus button */}
                {selectedAction && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-orange-200 bg-orange-50 text-orange-700 text-sm">
                    <selectedAction.icon className="h-3.5 w-3.5" />
                    <span>{selectedAction.label}</span>
                    <button
                      type="button"
                      onClick={() => onSelectAction(null)}
                      className="ml-0.5 rounded hover:bg-orange-100 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Mic button - only show when not typing */}
                {!input.trim() && !pendingFile && !selectedAction && (
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted transition-colors"
                  >
                    <Mic className="h-5 w-5 text-muted-foreground" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || (!input.trim() && !pendingFile && !selectedAction)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                    (input.trim() || pendingFile || selectedAction)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (input.trim() || pendingFile || selectedAction) ? (
                    <Send className="h-5 w-5" />
                  ) : (
                    <AudioLines className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons - hide in split view for space, hide selected action */}
          {!showRightPanel && (
            <div className="flex items-center justify-center gap-3 mt-6">
              {quickActions
                .filter(action => action.id !== selectedAction?.id)
                .map((action) => (
                <button
                  key={action.label}
                  disabled={action.disabled}
                  onClick={() => {
                    if (!action.disabled && action.prompt) {
                      onSelectAction({
                        id: action.id,
                        label: action.label,
                        prompt: action.prompt,
                        icon: action.icon,
                      })
                      // Focus the input after selecting action
                      setTimeout(() => {
                        landingInputRef.current?.focus()
                      }, 0)
                    }
                  }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md border bg-background text-sm transition-colors',
                    action.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-muted'
                  )}
                >
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{action.label}</span>
                  {action.badge && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {action.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Suggestion Cards - Bottom (hide in split view) */}
      {!showRightPanel && (
        <div className="px-6 pb-8">
          <p className="text-sm text-muted-foreground text-center mb-4">
            Here are a few ways to get started.
          </p>
          <div className="flex justify-center gap-3">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInput(suggestion)}
                className="flex-1 max-w-xs p-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-left text-sm transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

export function AiChatPage() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('map')
  const [mapReady, setMapReady] = useState(false)
  const [pendingZoomLocation, setPendingZoomLocation] = useState<MapAction['location'] | null>(null)

  // Selected quick action (shown as chip in input)
  const [selectedAction, setSelectedAction] = useState<SelectedAction>(null)

  // Studio tabs for multi-content view
  const [studioTabs, setStudioTabs] = useState<StudioTab[]>([])
  const [activeStudioTabId, setActiveStudioTabId] = useState<string | null>(null)

  // Pending marketing recommendation (for persistence across requests)
  const [pendingMarketing, setPendingMarketing] = useState<MarketingRecommendation | null>(null)

  // Folder files modal state
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false)

  const navigate = useNavigate()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const landingInputRef = useRef<HTMLInputElement>(null)
  const mapViewRef = useRef<MapViewRef>(null)

  const sidebar = useSidebar()
  const library = useLibrary()
  const { isAuthenticated } = useAuth()
  const {
    activeProject,
    activeProjectId,
    isNewProject,
    createProject,
    addMessage,
    setStores: setProjectStores,
    setSelectedStore: setProjectSelectedStore,
    setReportUrl: setProjectReportUrl,
  } = useProjects()
  const {
    activeFolder,
    activeFolderId,
    uploadFile,
    deleteFile,
  } = useFolders()
  const { viewMode, setViewMode } = useViewMode()

  // Get data from active project
  const messages = activeProject?.messages || []
  const stores = activeProject?.stores || []
  const selectedStore = stores.find(s => s.id === activeProject?.selectedStoreId) || null
  const reportUrl = activeProject?.reportUrl || null

  // Show landing screen when no project selected and isNewProject is true (only in chat view)
  const showLandingScreen = isNewProject && !activeProjectId && viewMode === 'chat'

  // Show right panel in split/canvas modes (always show map, even without stores)
  const showRightPanel = viewMode !== 'chat'
  const showChat = viewMode !== 'canvas'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  // State for resizable chat/map split
  const [chatPanelWidth, setChatPanelWidth] = useState(30) // percentage
  const [isResizingPanels, setIsResizingPanels] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle horizontal resize between chat and map panels
  const handlePanelResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingPanels(true)
  }, [])

  useEffect(() => {
    if (!isResizingPanels) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
      // Clamp between 20% and 50%
      setChatPanelWidth(Math.min(50, Math.max(20, newWidth)))
    }

    const handleMouseUp = () => {
      setIsResizingPanels(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingPanels])

  // Track previous view mode to only auto-collapse on mode change
  const prevViewModeRef = useRef(viewMode)

  // Auto-collapse sidebar when switching to split/canvas modes (only on mode change)
  useEffect(() => {
    const prevMode = prevViewModeRef.current
    prevViewModeRef.current = viewMode

    // Only collapse when switching FROM chat TO split/canvas
    if (prevMode === 'chat' && (viewMode === 'split' || viewMode === 'canvas')) {
      sidebar.setCollapsed(true)
    }
  }, [viewMode, sidebar])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    // Guard against empty submissions
    const messageText = input.trim()
    // Allow submission if there's a selected action with input, regular input, or a file
    if (!messageText && !pendingFile && !selectedAction) return
    if (isLoading) return

    // Build the full message with selected action prompt
    const fullMessage = selectedAction
      ? `${selectedAction.prompt}${messageText}`.trim()
      : messageText

    // If not authenticated, store the pending message and redirect to login
    if (!isAuthenticated) {
      storePendingMessage(fullMessage)
      navigate('/login')
      return
    }

    const userMessage = pendingFile
      ? `${fullMessage || 'Analyze this file'}\n\n📎 ${pendingFile.name}`
      : fullMessage

    // Create project if none exists
    let projectId = activeProjectId
    if (!projectId) {
      const newProject = createProject(userMessage)
      projectId = newProject.id
    }

    // Add user message
    addMessage(projectId, { role: 'user', content: userMessage })
    setIsLoading(true)

    // Store values before clearing state
    const fileToSend = pendingFile
    const storesToSend = stores
    const marketingToSend = pendingMarketing
    const messageToSend = fullMessage || 'Please analyze this tapestry file'

    // Clear input state immediately to prevent duplicate submissions
    setInput('')
    setPendingFile(null)
    setSelectedAction(null)

    const formData = new FormData()
    formData.append('message', messageToSend)

    if (fileToSend) {
      formData.append('file', fileToSend)
    }

    // Pass stores to backend for persistence (handles server restart case)
    // Send full store data including segments so backend can restore after restart
    if (storesToSend.length > 0 && !fileToSend) {
      // Only send stores_json if no file is being uploaded (file upload already sends full data)
      const storesJson = JSON.stringify(storesToSend)
      // Only send if under 800KB to leave room for other form data
      if (new Blob([storesJson]).size < 800 * 1024) {
        formData.append('stores_json', storesJson)
      }
    }

    // Pass pending marketing recommendation for approval flow
    if (marketingToSend) {
      formData.append('pending_marketing_json', JSON.stringify(marketingToSend))
    }

    // Pass folder_id if chatting within a folder context
    if (activeFolderId) {
      formData.append('folder_id', activeFolderId)
    }

    try {
      const response = await fetch(getApiUrl('/chat/with-file'), {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.detail || errorData.message || `Server error: ${response.status}`
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (data.stores && data.stores.length > 0) {
        setProjectStores(projectId, data.stores)
        setProjectReportUrl(projectId, null)
        // Auto-switch to split view when stores are detected
        if (viewMode === 'chat') {
          setViewMode('split')
        }
      }

      // Handle report URL (from chat-based report generation)
      if (data.reportUrl) {
        setProjectReportUrl(projectId, data.reportUrl)
        // Switch to split view and studio tab to show the report
        if (viewMode === 'chat') {
          setViewMode('split')
        }
        setRightPanelTab('studio')
      }

      // Handle map actions
      if (data.mapAction) {
        handleMapAction(data.mapAction)
      }

      // Handle marketing actions
      if (data.marketingAction) {
        handleMarketingAction(data.marketingAction)
      }

      addMessage(projectId, { role: 'assistant', content: data.response })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.'
      console.error('Chat error:', error)
      addMessage(projectId, { role: 'assistant', content: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateReport = async (storeName: string, customText?: string) => {
    if (!activeProjectId) return
    if (isGeneratingReport) return // Prevent duplicate requests

    const store = stores.find(s => s.name === storeName)
    if (!store) return

    // Select the store
    setProjectSelectedStore(activeProjectId, store.id)

    // Switch to studio view
    setRightPanelTab('studio')
    setIsGeneratingReport(true)

    // Create the message
    const goal = customText || 'generic'
    const goalMessage = customText
      ? `Generate a report for ${storeName} - ${customText}`
      : `Generate a report for ${storeName}`

    addMessage(activeProjectId, { role: 'user', content: goalMessage })

    const formData = new FormData()
    formData.append('message', goalMessage)
    formData.append('action', 'generate_report')
    formData.append('store_id', store.id)
    formData.append('goal', goal)

    // Send stores data so backend can restore after server restart
    // Include full data for the target store, minimal data for others
    const storesJson = JSON.stringify(stores)
    if (new Blob([storesJson]).size < 800 * 1024) {
      formData.append('stores_json', storesJson)
    }

    // Pass folder_id if generating report within a folder context
    if (activeFolderId) {
      formData.append('folder_id', activeFolderId)
    }

    try {
      const response = await fetch(getApiUrl('/chat/with-file'), {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.detail || errorData.message || `Server error: ${response.status}`
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (data.reportUrl) {
        setProjectReportUrl(activeProjectId, data.reportUrl)

        // Auto-save to library
        library.addItem({
          storeName: store.name,
          storeId: store.id,
          goal: goal,
          reportUrl: data.reportUrl,
          type: 'pdf',
          projectId: activeProjectId,
          projectName: activeProject?.name,
        })

        addMessage(activeProjectId, {
          role: 'assistant',
          content: `${data.response}\n\nThe report has been automatically saved to your library.`
        })
      } else {
        // If no custom text, ask for preference
        if (!customText) {
          addMessage(activeProjectId, {
            role: 'assistant',
            content: `I can generate a report for **${storeName}**. Would you like:\n\n1. **Generic** - General market insights\n2. **Marketing** - Brand positioning strategies\n3. **Advertising** - Ad channels and media consumption\n4. **Promotions** - Discount sensitivity and tactics\n\nOr do you have something specific in mind? Just describe your focus area.`
          })
        } else {
          addMessage(activeProjectId, { role: 'assistant', content: data.response })
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sorry, I encountered an error generating the report. Please try again.'
      console.error('Report generation error:', error)
      addMessage(activeProjectId, { role: 'assistant', content: errorMessage })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      if (activeProjectId) {
        addMessage(activeProjectId, { role: 'assistant', content: 'Please select an Excel file (.xlsx or .xls)' })
      }
      return
    }
    setPendingFile(file)
  }

  const handleStoreSelect = (store: Store) => {
    if (activeProjectId) {
      setProjectSelectedStore(activeProjectId, store.id)
    }
  }

  const handleBackToInfo = () => {
    if (activeProjectId) {
      setProjectReportUrl(activeProjectId, null)
    }
  }

  // Handle map actions from AI response
  const handleMapAction = useCallback((mapAction: MapAction) => {
    if (!mapAction) return

    if (mapAction.type === 'zoom_to' && mapAction.location) {
      // Switch to map tab
      setRightPanelTab('map')

      // If map is already ready, zoom immediately
      if (mapReady && viewMode !== 'chat') {
        mapViewRef.current?.zoomTo(mapAction.location)
      } else {
        // Store the pending location to zoom to once map is ready
        setPendingZoomLocation(mapAction.location)

        // Switch to split view if not already
        if (viewMode === 'chat') {
          setViewMode('split')
        }
      }
    }
  }, [viewMode, setViewMode, mapReady])

  // Handle marketing actions from AI response
  const handleMarketingAction = useCallback((marketingAction: MarketingAction) => {
    if (!marketingAction) return

    // When we get a recommendation, store it for follow-up approval
    if (marketingAction.type === 'recommendation' && marketingAction.recommendation) {
      setPendingMarketing(marketingAction.recommendation)
    }

    if (marketingAction.type === 'generate_image' && marketingAction.post) {
      // Clear pending marketing since we generated the image
      setPendingMarketing(null)

      // Create a new studio tab with the generated marketing post
      const newTab: StudioTab = {
        id: `marketing-${marketingAction.post.id}`,
        type: 'marketing-post',
        title: `${marketingAction.platform?.charAt(0).toUpperCase()}${marketingAction.platform?.slice(1)} - ${marketingAction.post.storeName}`,
        isLoading: false,
        marketingPost: marketingAction.post,
      }

      setStudioTabs(prev => [...prev, newTab])
      setActiveStudioTabId(newTab.id)
      setRightPanelTab('studio')

      // Switch to split view if not already
      if (viewMode === 'chat') {
        setViewMode('split')
      }
    }
  }, [viewMode, setViewMode])

  // Studio tab management
  const handleTabSelect = useCallback((tabId: string) => {
    setActiveStudioTabId(tabId)
  }, [])

  const handleTabClose = useCallback((tabId: string) => {
    setStudioTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId)
      // If closing the active tab, select another one
      if (activeStudioTabId === tabId && newTabs.length > 0) {
        setActiveStudioTabId(newTabs[newTabs.length - 1].id)
      } else if (newTabs.length === 0) {
        setActiveStudioTabId(null)
      }
      return newTabs
    })
  }, [activeStudioTabId])

  const handleSaveToLibrary = useCallback((tab: StudioTab) => {
    if (tab.type === 'marketing-post' && tab.marketingPost) {
      library.addItem({
        storeName: tab.marketingPost.storeName,
        storeId: tab.marketingPost.storeId,
        goal: `${tab.marketingPost.platform} marketing post`,
        reportUrl: tab.marketingPost.imageUrl || '',
        type: 'marketing-post',
        projectId: activeProjectId || undefined,
        projectName: activeProject?.name,
        marketingPostData: tab.marketingPost,
      })
    }
  }, [library, activeProjectId, activeProject?.name])

  const handleRegenerateImage = useCallback(async (post: MarketingPost) => {
    // Mark tab as loading
    setStudioTabs(prev => prev.map(t =>
      t.marketingPost?.id === post.id
        ? { ...t, isLoading: true }
        : t
    ))

    // Send regenerate request
    const formData = new FormData()
    formData.append('message', `Regenerate the ${post.platform} marketing image for ${post.storeName}`)

    // For now, just show loading briefly - actual regeneration requires backend endpoint
    setTimeout(() => {
      setStudioTabs(prev => prev.map(t =>
        t.marketingPost?.id === post.id
          ? { ...t, isLoading: false }
          : t
      ))
    }, 2000)
  }, [])

  // Handle map ready callback - execute pending zoom
  const handleMapReady = useCallback(() => {
    setMapReady(true)
    if (pendingZoomLocation) {
      // Small delay to ensure everything is rendered
      setTimeout(() => {
        mapViewRef.current?.zoomTo(pendingZoomLocation)
        setPendingZoomLocation(null)
      }, 100)
    }
  }, [pendingZoomLocation])

  // Execute pending zoom when map becomes ready
  useEffect(() => {
    if (mapReady && pendingZoomLocation) {
      mapViewRef.current?.zoomTo(pendingZoomLocation)
      setPendingZoomLocation(null)
    }
  }, [mapReady, pendingZoomLocation])

  // Execute pending message after successful authentication
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const pendingMessage = getPendingMessage()
      if (pendingMessage && pendingMessage.content.trim()) {
        // Restore the pending message to input
        setInput(pendingMessage.content)
        // Clear the pending message from storage
        clearStoredPendingMessage()

        // Auto-submit after a small delay to let the UI update
        // Use a small delay to ensure state has updated
        const timeoutId = setTimeout(() => {
          // Create a synthetic event for handleSubmit
          const syntheticEvent = {
            preventDefault: () => {},
          } as React.FormEvent
          handleSubmit(syntheticEvent)
        }, 150)
        
        return () => clearTimeout(timeoutId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading])


  const handleToggleRightPanel = () => {
    // Toggle between chat and split view (expand/collapse)
    if (viewMode === 'split' || viewMode === 'canvas') {
      setViewMode('chat')
    } else {
      setViewMode('split')
    }
  }

  // Calculate chat panel style based on view mode
  const getChatPanelStyle = (): React.CSSProperties => {
    if (viewMode === 'chat') return { width: '100%' }
    if (viewMode === 'canvas') return { display: 'none' }
    // Split view: use resizable width
    return {
      width: `${chatPanelWidth}%`,
      minWidth: '300px',
      maxWidth: '600px',
    }
  }

  // Determine if we're showing the landing state (new project, no messages)
  const isLandingState = isNewProject && !activeProjectId

  // Props for LandingContent component
  const landingContentProps = {
    showRightPanel,
    input,
    setInput,
    handleKeyDown,
    pendingFile,
    setPendingFile,
    handleFileSelect,
    handleSubmit,
    isLoading,
    landingInputRef,
    fileInputRef,
    selectedAction,
    onSelectAction: setSelectedAction,
  }

  // Full-screen Landing (chat view only, no project)
  if (showLandingScreen) {
    return <LandingContent {...landingContentProps} />
  }

  return (
    <div ref={containerRef} className="flex h-full relative">
      {/* Chat Panel */}
      {showChat && (
        <div
          className={cn(
            'flex flex-col bg-muted/20',
            showRightPanel && viewMode === 'split' && 'bg-background',
            !isResizingPanels && 'transition-all duration-200'
          )}
          style={getChatPanelStyle()}
        >
          {/* Folder Header - show when folder is active */}
          {activeFolder && (
            <FolderHeader
              folder={activeFolder}
              onAddFiles={() => setIsFilesModalOpen(true)}
              onViewFiles={() => setIsFilesModalOpen(true)}
            />
          )}

          {/* Show landing content in split view when no messages */}
          {isLandingState && viewMode === 'split' ? (
            <LandingContent {...landingContentProps} />
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-auto">
                <div className={cn(
                  'mx-auto py-6 space-y-6',
                  showRightPanel ? 'max-w-full px-4' : 'max-w-3xl px-6'
                )}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'user' ? (
                        <div className="max-w-[85%] rounded-lg bg-primary text-primary-foreground px-4 py-3">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        </div>
                      ) : (
                        <div className="max-w-full">
                          <div className="prose prose-sm prose-zinc max-w-none text-sm leading-relaxed [&>p]:my-3 [&>ul]:my-3 [&>ol]:my-3 [&>h1]:text-base [&>h1]:font-semibold [&>h1]:mt-6 [&>h1]:mb-3 [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:mt-5 [&>h2]:mb-2 [&>h3]:text-sm [&>h3]:font-medium [&>h3]:mt-4 [&>h3]:mb-2 [&>strong]:font-semibold [&>p]:text-foreground">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-1.5 px-1 py-2">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area */}
              <div className={cn(
                'p-4 shrink-0',
                showRightPanel ? 'px-4' : 'px-6'
              )}>
                <div className={cn(
                  'mx-auto',
                  showRightPanel ? 'max-w-full' : 'max-w-3xl'
                )}>
                  {pendingFile && (
                    <div className="mb-2 flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-sm w-fit">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-accent" />
                      <span className="truncate max-w-[200px]">{pendingFile.name}</span>
                      <button
                        onClick={() => setPendingFile(null)}
                        className="rounded p-0.5 hover:bg-muted"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  )}

                  <div className="rounded-lg border bg-background shadow-sm">
                    {/* Input Row */}
                    <div className="px-4 py-3">
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about a location, building, market, or customer segment..."
                        disabled={isLoading}
                        rows={1}
                        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
                        style={{ maxHeight: '120px' }}
                      />
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-between px-3 py-2 border-t">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileSelect(file)
                          e.target.value = ''
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted transition-colors"
                      >
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </button>
                      <div className="flex items-center gap-1">
                        {/* Mic button - only show when not typing */}
                        {!input.trim() && !pendingFile && (
                          <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted transition-colors"
                          >
                            <Mic className="h-5 w-5 text-muted-foreground" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isLoading || (!input.trim() && !pendingFile)}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                            (input.trim() || pendingFile)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (input.trim() || pendingFile) ? (
                            <Send className="h-5 w-5" />
                          ) : (
                            <AudioLines className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Resize Handle between Chat and Map */}
      {showRightPanel && viewMode === 'split' && (
        <div
          className={cn(
            'w-1 hover:w-1.5 bg-border hover:bg-primary/50 cursor-col-resize shrink-0 transition-all relative group',
            isResizingPanels && 'w-1.5 bg-primary/50'
          )}
          onMouseDown={handlePanelResizeStart}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Right Panel (Map View / Studio View) */}
      {showRightPanel && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Show tabs only when report is generated, generating, or marketing posts exist */}
          {(reportUrl || isGeneratingReport || studioTabs.length > 0) && (
            <div className="flex items-center h-10 border-b bg-background px-1 shrink-0">
              <button
                onClick={() => setRightPanelTab('map')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  rightPanelTab === 'map'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Map className="h-3.5 w-3.5" />
                Map & Tools
              </button>
              <button
                onClick={() => setRightPanelTab('studio')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  rightPanelTab === 'studio'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Studio View
                {studioTabs.length > 0 && (
                  <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5">
                    {studioTabs.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1 min-h-0">
            {rightPanelTab === 'map' ? (
              <MapView
                ref={mapViewRef}
                stores={stores}
                selectedStore={selectedStore}
                onStoreSelect={handleStoreSelect}
                onGenerateReport={handleGenerateReport}
                onMapReady={handleMapReady}
                initialToolsExpanded={stores.length > 0}
                initialActiveTab={stores.length > 0 ? 'list' : 'layers'}
              />
            ) : (
              <StudioView
                stores={stores}
                selectedStore={selectedStore}
                reportUrl={reportUrl}
                isGeneratingReport={isGeneratingReport}
                onStoreSelect={handleStoreSelect}
                onBackToInfo={handleBackToInfo}
                onTogglePanel={handleToggleRightPanel}
                tabs={studioTabs}
                activeTabId={activeStudioTabId}
                onTabSelect={handleTabSelect}
                onTabClose={handleTabClose}
                onSaveToLibrary={handleSaveToLibrary}
                onRegenerateImage={handleRegenerateImage}
              />
            )}
          </div>
        </div>
      )}

      {/* Folder Files Modal */}
      {activeFolder && (
        <FolderFilesModal
          isOpen={isFilesModalOpen}
          folder={activeFolder}
          onClose={() => setIsFilesModalOpen(false)}
          onUploadFile={async (file) => {
            await uploadFile(activeFolder.id, file)
          }}
          onDeleteFile={async (fileId) => {
            await deleteFile(activeFolder.id, fileId)
          }}
        />
      )}
    </div>
  )
}
