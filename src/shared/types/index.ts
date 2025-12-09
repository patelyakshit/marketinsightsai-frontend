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
  lifeMode: string
  lifeStage: string
  description?: string
  medianAge?: number
  medianHouseholdIncome?: number
  medianNetWorth?: number
  homeownershipRate?: number
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
