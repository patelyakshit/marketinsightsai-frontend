// UI Primitives
export { Button, type ButtonProps } from "./ui/button"
export { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card"
export { Input } from "./ui/input"
export { Badge, badgeVariants } from "./ui/badge"
export { Progress, IndeterminateProgress } from "./ui/progress"
export { Skeleton, SkeletonText, SkeletonCard, SkeletonMessage } from "./ui/skeleton"
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, SimpleTooltip } from "./ui/tooltip"
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"
export { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "./ui/dialog"
export { ToastItem, ToastContainer } from "./ui/toast"
export type { Toast, ToastType } from "./ui/toast"

// Streaming / Animation Components
export { StreamingMessage, StreamingText, ThinkingIndicator, TypingDots } from "./ui/streaming-message"

// Agent Components
export { AgentWorkspacePanel } from "./agent"
export type { AgentStep, AgentTask, AgentStepStatus } from "./agent"
export { TaskProgressCard, TaskProgressList } from "./agent"
export type { TaskInfo, TaskOutput, TaskStatus } from "./agent"

// Model Selection Components
export { ModelSelector, ModelIndicator, ProviderIcon, providerConfig, defaultModels } from "./model"
export type { ModelOption, ModelProvider } from "./model"

// Tapestry Components
export { TapestryLookupWidget, TapestrySegmentBadge, getLifeModeColor, lifeModeColors } from "./tapestry"
export type { TapestrySegment, TapestryLookupResult } from "./tapestry"

// Existing Components
export { ProtectedRoute } from "./ProtectedRoute"
export { MapView } from "./MapView"
export { ArcGISMap } from "./ArcGISMap"
export { StudioView } from "./StudioView"
export { SearchModal } from "./SearchModal"
export { PresentationModal } from "./PresentationModal"
export { ProfileDropdown } from "./ProfileDropdown"
export { FolderHeader } from "./FolderHeader"
