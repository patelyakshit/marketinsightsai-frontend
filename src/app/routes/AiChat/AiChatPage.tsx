import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { useNavigate } from 'react-router'
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
  Presentation as PresentationIcon,
} from 'lucide-react'
import { ChatInput, MessageList } from './components'
import { cn } from '@/shared/utils/cn'
import { getApiUrl } from '@/shared/hooks/useApi'
import type { Store, MapAction, MarketingAction, StudioTab, MarketingPost, MarketingRecommendation, PresentationTemplate, Presentation, PresentationAction } from '@/shared/types'
import { useSidebar } from '@/app/layout/AppLayout'
import { useLibrary } from '@/shared/contexts/LibraryContext'
import { useProjects } from '@/shared/contexts/ProjectsContext'
import { useFolders } from '@/shared/contexts/FoldersContext'
import { useViewMode } from '@/shared/contexts/ViewModeContext'
import { useAuth } from '@/shared/contexts/AuthContext'
import { useToast } from '@/shared/contexts/ToastContext'
import { storePendingMessage, getPendingMessage, clearStoredPendingMessage } from '@/shared/contexts/PendingMessageContext'
import { MapView, type MapViewRef } from '@/shared/components/MapView'
import { StudioView } from '@/shared/components/StudioView'
import { FolderHeader, FolderFilesModal } from '@/shared/components/FolderHeader'
import { PresentationModal } from '@/shared/components/PresentationModal'
import { useSlides } from '@/shared/hooks/useSlides'
import { useStreamingChat } from '@/shared/hooks/useStreamingChat'
import { useSpeechRecognition } from '@/shared/hooks/useSpeechRecognition'
import { logger } from '@/shared/utils/logger'

const chatLogger = logger.createLogger('AiChat')

type RightPanelTab = 'map' | 'studio'

// Quick actions for landing screen
const quickActions = [
  { id: 'marketing', icon: Image, label: 'Create Marketing Post', disabled: false, prompt: 'Create marketing post for ' },
  { id: 'report', icon: FileText, label: 'Create Report', disabled: false, prompt: 'Create report for ' },
  { id: 'presentation', icon: PresentationIcon, label: 'Create Presentation', disabled: false, prompt: '' },
  { id: 'placestory', icon: MapPin, label: 'Create Placestory', disabled: true, badge: 'Soon', prompt: '' },
]

// Default suggestion cards for landing screen (shown when no context)
const defaultSuggestions = [
  'Is Uptown Dallas a good area for opening a car wash?',
  'Scan competition within 3 miles of Scottsdale Fashion Square.',
  'Compare Plano, TX and Frisco, TX for a new gym location.',
]

// Suggestions when stores are loaded
const getStoreBasedSuggestions = (stores: Store[]) => {
  if (stores.length === 0) return defaultSuggestions
  const firstStore = stores[0]
  const storeName = firstStore.name
  const topSegment = firstStore.segments.sort((a, b) => b.householdShare - a.householdShare)[0]

  return [
    `Generate a marketing report for ${storeName}`,
    `What are the key demographics for ${storeName}?`,
    topSegment ? `Tell me about the ${topSegment.name} segment` : `Compare all my stores`,
  ]
}

// Suggestions after file upload (no stores yet)
const uploadSuggestions = [
  'Analyze the top customer segments',
  'Generate a report for all stores',
  'Which store has the best demographics?',
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
  onOpenPresentationModal: () => void
  suggestions: string[]
  isListening: boolean
  onMicClick: () => void
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
  onOpenPresentationModal,
  suggestions,
  isListening,
  onMicClick,
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
                {/* Mic button - show when not typing or when listening */}
                {(!input.trim() && !pendingFile && !selectedAction) || isListening ? (
                  <button
                    type="button"
                    onClick={onMicClick}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                      isListening
                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                        : "hover:bg-muted"
                    )}
                    title={isListening ? "Stop listening" : "Start voice input"}
                  >
                    <Mic className={cn(
                      "h-5 w-5",
                      isListening ? "animate-pulse" : "text-muted-foreground"
                    )} />
                  </button>
                ) : null}
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
                    if (!action.disabled) {
                      // Handle presentation action specially - opens modal instead of setting prompt
                      if (action.id === 'presentation') {
                        onOpenPresentationModal()
                        return
                      }
                      if (action.prompt) {
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

  // Presentation modal state
  const [isPresentationModalOpen, setIsPresentationModalOpen] = useState(false)
  const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false)

  // Thinking status for loading states
  const [thinkingStatus, setThinkingStatus] = useState<'thinking' | 'executing' | 'waiting' | null>(null)

  // Message actions state (for copy feedback)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({})

  const navigate = useNavigate()
  const toast = useToast()

  // Slides API hook
  const slides = useSlides()

  // Speech recognition hook
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: isSpeechSupported,
    error: speechError,
  } = useSpeechRecognition()

  // Ref to store current projectId for streaming callbacks
  const streamingProjectIdRef = useRef<string | null>(null)

  // Streaming chat hook - used for simple messages without file uploads
  const {
    isStreaming,
    streamedContent,
    sendStreamingMessage,
    cancelStream: _cancelStream,
  } = useStreamingChat({
    onComplete: (fullResponse) => {
      // Add message when streaming completes
      if (streamingProjectIdRef.current) {
        addMessage(streamingProjectIdRef.current, { role: 'assistant', content: fullResponse })
      }
      setIsLoading(false)
      setThinkingStatus(null)
    },
    onError: (error) => {
      // Handle streaming error
      if (streamingProjectIdRef.current) {
        addMessage(streamingProjectIdRef.current, {
          role: 'assistant',
          content: error.message || 'Sorry, I encountered an error. Please try again.'
        })
      }
      setIsLoading(false)
      setThinkingStatus(null)
    }
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
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

  // Update input when speech transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript)
    }
  }, [transcript])

  // Show speech error as toast
  useEffect(() => {
    if (speechError) {
      toast.error(speechError)
    }
  }, [speechError, toast])

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

  // Toggle speech recognition
  const handleMicClick = useCallback(() => {
    if (!isSpeechSupported) {
      toast.error('Speech recognition is not supported in your browser')
      return
    }
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isSpeechSupported, isListening, startListening, stopListening, toast])

  // Regenerate last AI response
  const handleRegenerate = useCallback(async (messageId: string) => {
    // Find the message to regenerate
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return

    // Find the user message that prompted this response
    const userMessage = messages.slice(0, messageIndex).reverse().find(m => m.role === 'user')
    if (!userMessage) return

    // Set the input to the original user message and submit
    setInput(userMessage.content)
    // Note: The actual regeneration will happen when the user submits
    // For now, we'll show a toast to indicate the message is ready to regenerate
    toast.success('Message copied to input. Press Send to regenerate.')
  }, [messages, toast])

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

    // Determine if we can use streaming (simple messages without file/special actions)
    const canUseStreaming = !fileToSend && !marketingToSend && !selectedAction && storesToSend.length === 0 && !activeFolderId

    if (canUseStreaming) {
      // Use streaming hook for simple messages
      // Store projectId in ref for the onComplete/onError callbacks
      streamingProjectIdRef.current = projectId
      setThinkingStatus('executing')
      // Fire and forget - callbacks handle completion/error
      sendStreamingMessage(messageToSend, true).catch(() => {
        // Error already handled by onError callback
      })
      return
    }

    // Use regular API for file uploads and complex actions
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
      setThinkingStatus('thinking')
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
      chatLogger.error('Chat request failed', error)
      addMessage(projectId, { role: 'assistant', content: errorMessage })
    } finally {
      setIsLoading(false)
      setThinkingStatus(null)
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
      chatLogger.error('Report generation failed', error)
      addMessage(activeProjectId, { role: 'assistant', content: errorMessage })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleGeneratePresentation = async (storeId: string, template: PresentationTemplate, customTitle?: string) => {
    if (!activeProjectId) return
    if (isGeneratingPresentation) return

    const store = stores.find(s => s.id === storeId)
    if (!store) return

    // Select the store
    setProjectSelectedStore(activeProjectId, store.id)

    // Close modal and switch to studio view
    setIsPresentationModalOpen(false)
    setRightPanelTab('studio')
    setIsGeneratingPresentation(true)

    // Create a loading tab
    const tabId = `presentation-${Date.now()}`
    const templateName = template.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    const title = customTitle || `${store.name} - ${templateName}`

    const loadingTab: StudioTab = {
      id: tabId,
      type: 'presentation',
      title,
      isLoading: true,
      presentation: null,
    }

    setStudioTabs(prev => [...prev, loadingTab])
    setActiveStudioTabId(tabId)

    // Create the message
    const messageText = `Generate a ${templateName} presentation for ${store.name}`
    addMessage(activeProjectId, { role: 'user', content: messageText })

    // Switch to split view if not already
    if (viewMode === 'chat') {
      setViewMode('split')
    }

    const formData = new FormData()
    formData.append('message', messageText)
    formData.append('action', 'generate_presentation')
    formData.append('store_id', store.id)
    formData.append('template', template)
    if (customTitle) {
      formData.append('custom_title', customTitle)
    }

    // Send stores data so backend can restore after server restart
    const storesJson = JSON.stringify(stores)
    if (new Blob([storesJson]).size < 800 * 1024) {
      formData.append('stores_json', storesJson)
    }

    // Pass folder_id if generating within a folder context
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

      // Handle presentation action from API
      if (data.presentationAction) {
        handlePresentationAction(data.presentationAction, tabId)
      } else {
        // If no presentation action, create a mock presentation for demo purposes
        // This allows the UI to work while the backend is being implemented
        const mockPresentation: Presentation = {
          id: tabId,
          storeId: store.id,
          storeName: store.name,
          template,
          title,
          slides: generateMockSlides(store, template),
          downloadUrl: null,
          isGenerating: false,
          createdAt: new Date(),
        }

        setStudioTabs(prev => prev.map(t =>
          t.id === tabId
            ? { ...t, isLoading: false, presentation: mockPresentation }
            : t
        ))

        addMessage(activeProjectId, {
          role: 'assistant',
          content: data.response || `I've generated a ${templateName} presentation for **${store.name}**. You can preview it in the Studio tab and download it when ready.`
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sorry, I encountered an error generating the presentation. Please try again.'
      chatLogger.error('Presentation generation failed', error)
      addMessage(activeProjectId, { role: 'assistant', content: errorMessage })

      // Remove the loading tab on error
      setStudioTabs(prev => prev.filter(t => t.id !== tabId))
    } finally {
      setIsGeneratingPresentation(false)
    }
  }

  // Helper function to generate mock slides for demo
  const generateMockSlides = (store: Store, template: PresentationTemplate) => {
    const topSegments = store.segments
      .sort((a, b) => b.householdShare - a.householdShare)
      .slice(0, 3)

    const baseSlides = [
      {
        id: '1',
        title: 'Executive Overview',
        content: `Market analysis for ${store.name}\n\nThis presentation provides insights into the demographic composition and lifestyle segments of your target market.`,
        notes: 'Welcome the audience and set the context for the presentation.',
      },
      {
        id: '2',
        title: 'Top Customer Segments',
        content: topSegments.map((seg, i) =>
          `${i + 1}. ${seg.name} (${seg.code})\n   • ${seg.householdShare.toFixed(1)}% of households\n   • ${seg.lifeMode} - ${seg.lifeStage}`
        ).join('\n\n'),
        notes: 'Discuss each segment and their key characteristics.',
      },
      {
        id: '3',
        title: 'Demographic Insights',
        content: topSegments[0]
          ? `Primary Segment: ${topSegments[0].name}\n\n• Median Age: ${topSegments[0].medianAge || 'N/A'}\n• Median Income: $${topSegments[0].medianHouseholdIncome?.toLocaleString() || 'N/A'}\n• Homeownership: ${topSegments[0].homeownershipRate?.toFixed(1) || 'N/A'}%`
          : 'No segment data available',
        notes: 'Highlight the key demographics that drive purchasing decisions.',
      },
    ]

    if (template === 'executive-summary') {
      return [
        ...baseSlides,
        {
          id: '4',
          title: 'Key Recommendations',
          content: '• Focus marketing efforts on the top 3 segments\n• Tailor messaging to lifestyle preferences\n• Consider location-specific promotions\n• Leverage digital channels preferred by target demographics',
          notes: 'Summarize actionable next steps.',
        },
        {
          id: '5',
          title: 'Next Steps',
          content: '1. Review detailed segment profiles\n2. Develop targeted marketing campaigns\n3. Schedule follow-up analysis in 90 days\n4. Monitor campaign performance metrics',
          notes: 'Outline the path forward and timeline.',
        },
      ]
    }

    if (template === 'franchise-pitch') {
      return [
        ...baseSlides,
        {
          id: '4',
          title: 'Market Opportunity',
          content: `Total addressable market in this location:\n\n• ${store.segments.reduce((sum, s) => sum + s.householdCount, 0).toLocaleString()} households\n• Strong presence of high-value segments\n• Growing demographic trends`,
          notes: 'Emphasize the size and quality of the opportunity.',
        },
        {
          id: '5',
          title: 'Competitive Landscape',
          content: '• Limited direct competition in immediate area\n• Underserved customer segments\n• First-mover advantage potential',
          notes: 'Discuss competitive positioning.',
        },
        {
          id: '6',
          title: 'Investment Highlights',
          content: '• Strong demographic alignment\n• Proven market demand\n• Favorable location characteristics\n• Projected ROI within 18-24 months',
          notes: 'Focus on the financial opportunity.',
        },
      ]
    }

    return baseSlides
  }

  // Handle presentation actions from API response
  const handlePresentationAction = useCallback((action: PresentationAction, tabId: string) => {
    if (!action) return

    if (action.type === 'generate' && action.presentation) {
      setStudioTabs(prev => prev.map(t =>
        t.id === tabId
          ? { ...t, isLoading: false, presentation: action.presentation }
          : t
      ))
    }

    if (action.type === 'download' && action.downloadUrl) {
      window.open(action.downloadUrl, '_blank')
    }
  }, [])

  // Handle presentation download via Slides API
  const handleDownloadPresentation = useCallback(async (presentation: Presentation) => {
    if (!presentation) return

    // If we already have a download URL, use it
    if (presentation.downloadUrl) {
      await slides.downloadSlides(presentation.downloadUrl, `${presentation.storeName}-presentation.pptx`)
      return
    }

    // Otherwise, try to generate and download via the slides API
    const store = stores.find(s => s.id === presentation.storeId)
    if (!store) {
      toast.error('Store not found for presentation download')
      return
    }

    toast.info('Generating presentation file...')

    // Use the tapestry slides endpoint with store data
    const result = await slides.generateTapestrySlides({
      storeName: store.name,
      location: store.address || '',
      segments: store.segments,
      theme: 'default',
    })

    if (result?.success && result.downloadUrl) {
      await slides.downloadSlides(result.downloadUrl, result.filename)
      toast.success('Presentation downloaded!')
    } else {
      toast.error('Failed to generate presentation. Please try again.')
    }
  }, [slides, stores, toast])

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


  // Message action handlers
  const handleCopyMessage = useCallback((messageId: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedMessageId(messageId)
    toast.success('Copied to clipboard')
    // Reset after 2 seconds
    setTimeout(() => setCopiedMessageId(null), 2000)
  }, [toast])

  const handleMessageFeedback = useCallback((messageId: string, feedback: 'up' | 'down') => {
    setFeedbackGiven(prev => ({ ...prev, [messageId]: feedback }))
    toast.success(feedback === 'up' ? 'Thanks for the feedback!' : 'Thanks, we\'ll improve')
    // TODO: Send feedback to backend
  }, [toast])

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

  // Get dynamic suggestions based on context
  const getDynamicSuggestions = () => {
    if (stores.length > 0) {
      return getStoreBasedSuggestions(stores)
    }
    if (pendingFile) {
      return uploadSuggestions
    }
    return defaultSuggestions
  }

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
    onOpenPresentationModal: () => setIsPresentationModalOpen(true),
    suggestions: getDynamicSuggestions(),
    isListening,
    onMicClick: handleMicClick,
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
              <MessageList
                messages={messages}
                isLoading={isLoading}
                isStreaming={isStreaming}
                streamingContent={streamedContent}
                thinkingStatus={thinkingStatus}
                showRightPanel={showRightPanel}
                copiedMessageId={copiedMessageId}
                feedbackGiven={feedbackGiven}
                onCopy={handleCopyMessage}
                onFeedback={handleMessageFeedback}
                onRegenerate={handleRegenerate}
              />

              {/* Input Area */}
              <ChatInput
                input={input}
                setInput={setInput}
                pendingFile={pendingFile}
                setPendingFile={setPendingFile}
                isLoading={isLoading}
                isListening={isListening}
                showRightPanel={showRightPanel}
                onSubmit={handleSubmit}
                onFileSelect={handleFileSelect}
                onMicClick={handleMicClick}
              />
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
                selectedStore={selectedStore}
                reportUrl={reportUrl}
                isGeneratingReport={isGeneratingReport}
                onBackToInfo={handleBackToInfo}
                onTogglePanel={handleToggleRightPanel}
                tabs={studioTabs}
                activeTabId={activeStudioTabId}
                onTabSelect={handleTabSelect}
                onTabClose={handleTabClose}
                onSaveToLibrary={handleSaveToLibrary}
                onDownloadPresentation={handleDownloadPresentation}
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

      {/* Presentation Modal */}
      <PresentationModal
        isOpen={isPresentationModalOpen}
        onClose={() => setIsPresentationModalOpen(false)}
        stores={stores}
        selectedStore={selectedStore}
        onGenerate={handleGeneratePresentation}
        isGenerating={isGeneratingPresentation}
      />

    </div>
  )
}
