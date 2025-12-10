export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  imageUrl?: string
}

export interface TapestrySegment {
  code: string
  name: string
  householdShare: number
  householdCount: number
  lifeMode?: string
  lifeModeCode?: string
  lifeStage?: string
  urbanization?: string
  description?: string
  medianAge?: number
  medianHouseholdIncome?: number
  medianNetWorth?: number
  homeownershipRate?: number
}

export interface TapestryLookupResult {
  address: string
  latitude: number
  longitude: number
  segments: TapestrySegment[]
  totalHouseholds: number
  dominantLifeMode?: string
  location_info?: {
    city?: string
    state?: string
    zip?: string
    country?: string
  }
}

export interface Store {
  id: string
  name: string
  address?: string
  longitude?: number
  latitude?: number
  segments: TapestrySegment[]
}

export interface KnowledgeDocument {
  id: string
  workspaceId?: string | null
  title: string
  content: string
  metadata: {
    segmentCode?: string
    category?: 'segment' | 'demographic' | 'brand' | 'other'
  }
  createdAt: Date
  updatedAt: Date
}

export interface Workspace {
  id: string
  name: string
  description?: string
  createdAt: Date
}

export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

// Map action types for AI-powered map navigation
export type MapActionType = 'zoom_to' | 'disambiguate'

export interface MapLocation {
  name: string
  longitude: number
  latitude: number
  zoom: number
}

export interface MapAction {
  type: MapActionType
  location?: MapLocation // For zoom_to action
  options?: MapLocation[] // For disambiguate action (multiple matches)
  query?: string // Original query for context
}

export interface SavedReport {
  id: string
  storeName: string
  storeId: string
  goal: string
  reportUrl: string
  savedAt: Date
  type: 'pdf' | 'placestory' | 'image' | 'marketing-post' | 'other'
  thumbnailUrl?: string
}

// Project (Chat Session) types
export interface Project {
  id: string
  name: string
  messages: ChatMessage[]
  stores: Store[]
  selectedStoreId?: string
  reportUrl?: string
  currentGoal?: string
  createdAt: Date
  updatedAt: Date
}

// View mode types
export type ViewMode = 'chat' | 'split' | 'canvas'

// Library item types
export type LibraryCategory = 'all' | 'images' | 'pdf' | 'placestory' | 'marketing-post' | 'other'

export interface LibraryItem extends SavedReport {
  projectId?: string
  projectName?: string
  marketingPostData?: MarketingPost
}

// Marketing post types
export type MarketingPlatform = 'instagram' | 'linkedin' | 'facebook' | 'twitter'

export interface MarketingRecommendation {
  storeId: string
  storeName: string
  headline: string
  body: string
  hashtags: string[]
  suggestedPlatforms: MarketingPlatform[]
  visualConcept: string
  segmentInsights: string
  awaitingApproval: boolean
}

export interface MarketingPost {
  id: string
  storeId: string
  storeName: string
  platform: MarketingPlatform
  headline: string
  body: string
  hashtags: string[]
  imageUrl: string | null
  imagePrompt: string | null
  isGenerating: boolean
  createdAt: Date
}

export type MarketingActionType = 'recommendation' | 'generate_image' | 'none'

export interface MarketingAction {
  type: MarketingActionType
  recommendation?: MarketingRecommendation
  post?: MarketingPost
  platform?: MarketingPlatform
}

// Studio tab types for multi-tab interface
export type StudioTabType = 'report' | 'marketing-post' | 'placestory' | 'presentation'

export interface StudioTab {
  id: string
  type: StudioTabType
  title: string
  isLoading: boolean
  createdAt?: Date
  // Content depends on type
  reportUrl?: string | null
  marketingPost?: MarketingPost | null
  presentation?: Presentation | null
}

// ============== Presentation Types ==============
// Types for PowerPoint slide generation feature

export type PresentationTemplate =
  | 'executive-summary'
  | 'franchise-pitch'
  | 'marketing-strategy'
  | 'quarterly-review'

export interface PresentationTemplateInfo {
  id: PresentationTemplate
  name: string
  description: string
  slideCount: string
  icon: string
}

export interface PresentationSlide {
  id: string
  title: string
  content: string
  notes?: string
  imageUrl?: string
}

export interface Presentation {
  id: string
  storeId: string
  storeName: string
  template: PresentationTemplate
  title: string
  slides: PresentationSlide[]
  downloadUrl: string | null
  isGenerating: boolean
  createdAt: Date
}

export type PresentationActionType = 'generate' | 'preview' | 'download'

export interface PresentationAction {
  type: PresentationActionType
  presentation?: Presentation
  downloadUrl?: string
}

// ============== Folder (Project) Types ==============
// Folders are persistent containers for files and chats (like ChatGPT Projects)

export type FolderFileType = 'xlsx' | 'pdf' | 'csv' | 'txt' | 'json' | 'other'

export interface FolderFile {
  id: string
  folderId: string
  filename: string
  originalFilename: string
  fileType: FolderFileType
  fileSize: number | null
  contentPreview: string | null
  metadata: Record<string, unknown>
  createdAt: Date
}

export interface FolderChatMessage {
  id: string
  chatId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  imageUrl: string | null
  createdAt: Date
}

export interface FolderChat {
  id: string
  folderId: string
  title: string | null
  createdAt: Date
  updatedAt: Date
  messages: FolderChatMessage[]
}

export interface Folder {
  id: string
  userId: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  fileCount: number
  chatCount: number
  files: FolderFile[]
}

// ============== Slides API Types ==============
// Types for PowerPoint slide generation via backend API

export type SlideTheme = 'default' | 'dark' | 'professional' | 'modern'

export interface SlideThemeInfo {
  id: SlideTheme
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
  }
}

export interface SlideGenerationRequest {
  prompt: string
  theme?: SlideTheme
  maxSlides?: number
  storeName?: string
  location?: string
  segments?: TapestrySegment[]
}

export interface TapestrySlideRequest {
  storeName: string
  location: string
  segments: TapestrySegment[]
  theme?: SlideTheme
}

export interface MarketingSlideRequest {
  campaignName: string
  targetAudience: string
  contentIdeas: string[]
  keyMessages: string[]
  channels: string[]
  theme?: SlideTheme
}

export interface SlideGenerationResponse {
  success: boolean
  filename: string
  downloadUrl: string
  slideCount: number
  fileSizeBytes: number
  message: string
}

// ============== Research API Types ==============
// Types for AI-powered research capabilities

export interface ResearchRequest {
  topic: string
  depth?: 'quick' | 'standard' | 'comprehensive'
  focusAreas?: string[]
  maxSources?: number
}

export interface ResearchResult {
  id: string
  topic: string
  summary: string
  findings: ResearchFinding[]
  sources: ResearchSource[]
  createdAt: Date
}

export interface ResearchFinding {
  title: string
  content: string
  relevance: number
  source?: string
}

export interface ResearchSource {
  title: string
  url: string
  snippet: string
}

export interface CompetitorAnalysis {
  industry: string
  competitors: Competitor[]
  marketOverview: string
}

export interface Competitor {
  name: string
  description: string
  strengths: string[]
  website?: string
}

export interface TrendAnalysis {
  topic: string
  trends: Trend[]
  summary: string
}

export interface Trend {
  title: string
  description: string
  relevance: number
}

// ============== Agent/Task API Types ==============
// Types for background tasks and agent workspace

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type TaskType = 'research' | 'report_generation' | 'slide_generation' | 'batch_analysis'

export interface BackgroundTask {
  id: string
  type: TaskType
  status: TaskStatus
  progress: number
  message: string
  result?: unknown
  error?: string
  createdAt: Date
  updatedAt: Date
}

export interface AgentSession {
  id: string
  goal: string
  status: 'active' | 'completed' | 'error'
  currentStep?: string
  steps: AgentStep[]
  createdAt: Date
}

export interface AgentStep {
  id: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'error'
  result?: string
  startedAt?: Date
  completedAt?: Date
}
