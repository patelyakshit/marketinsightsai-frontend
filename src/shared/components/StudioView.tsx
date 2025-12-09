import { useState } from 'react'
import {
  Download,
  Share2,
  FileText,
  TrendingUp,
  Users,
  ChevronLeft,
  Loader2,
  Maximize2,
  PanelLeftClose,
  X,
  Image,
  Instagram,
  Linkedin,
  Facebook,
  Twitter,
  RefreshCw,
  Save,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import type { Store, StudioTab, MarketingPost } from '@/shared/types'

interface StudioViewProps {
  stores: Store[]
  selectedStore: Store | null
  reportUrl: string | null
  isGeneratingReport: boolean
  onStoreSelect: (store: Store) => void
  onBackToInfo: () => void
  onTogglePanel: () => void
  // New props for tabs
  tabs?: StudioTab[]
  activeTabId?: string | null
  onTabSelect?: (tabId: string) => void
  onTabClose?: (tabId: string) => void
  onSaveToLibrary?: (tab: StudioTab) => void
  onRegenerateImage?: (post: MarketingPost) => void
}

// Platform icon mapping
const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'instagram':
      return <Instagram className="h-4 w-4" />
    case 'linkedin':
      return <Linkedin className="h-4 w-4" />
    case 'facebook':
      return <Facebook className="h-4 w-4" />
    case 'twitter':
      return <Twitter className="h-4 w-4" />
    default:
      return <Image className="h-4 w-4" />
  }
}

export function StudioView({
  selectedStore,
  reportUrl,
  isGeneratingReport,
  onBackToInfo,
  onTogglePanel,
  tabs = [],
  activeTabId,
  onTabSelect,
  onTabClose,
  onSaveToLibrary,
  onRegenerateImage,
}: StudioViewProps) {
  const [showShareMenu, setShowShareMenu] = useState(false)

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number | undefined) => {
    if (!value) return 'N/A'
    return `${value.toFixed(1)}%`
  }

  const handleShare = (type: 'copy' | 'email' | 'download') => {
    if (!reportUrl) return

    switch (type) {
      case 'copy':
        navigator.clipboard.writeText(window.location.origin + reportUrl)
        break
      case 'email':
        window.open(`mailto:?subject=Tapestry Report&body=View the report: ${window.location.origin + reportUrl}`)
        break
      case 'download':
        window.open(`${reportUrl}?download=true`, '_blank')
        break
    }
    setShowShareMenu(false)
  }

  const activeTab = tabs.find(t => t.id === activeTabId)
  const hasTabs = tabs.length > 0

  // Determine what content to show
  const showTabContent = hasTabs && activeTab
  const showReportPreview = !showTabContent && reportUrl
  const showStoreInfo = !showTabContent && !reportUrl && selectedStore
  const showEmptyState = !showTabContent && !reportUrl && !selectedStore

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Tab Bar - Browser-like tabs */}
      {hasTabs && (
        <div className="flex items-center h-10 border-b bg-muted/30 px-1 shrink-0 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`
                flex items-center gap-2 px-3 py-1.5 min-w-[120px] max-w-[200px]
                text-sm cursor-pointer rounded-t-md border-b-2 transition-colors
                ${tab.id === activeTabId
                  ? 'bg-background border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
              onClick={() => onTabSelect?.(tab.id)}
            >
              {tab.type === 'report' ? (
                <FileText className="h-3.5 w-3.5 shrink-0" />
              ) : tab.type === 'marketing-post' && tab.marketingPost ? (
                <PlatformIcon platform={tab.marketingPost.platform} />
              ) : (
                <Image className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate flex-1">{tab.title}</span>
              {tab.isLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTabClose?.(tab.id)
                }}
                className="p-0.5 rounded hover:bg-muted shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between h-12 px-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          {(showReportPreview || showStoreInfo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToInfo}
              className="h-7 gap-1 -ml-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          )}
          {showTabContent && activeTab?.type === 'marketing-post' && activeTab.marketingPost && (
            <>
              <PlatformIcon platform={activeTab.marketingPost.platform} />
              <span className="text-sm font-medium">
                {activeTab.marketingPost.platform.charAt(0).toUpperCase() + activeTab.marketingPost.platform.slice(1)} Post
              </span>
            </>
          )}
          {showReportPreview && (
            <>
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Report Preview</span>
            </>
          )}
          {showStoreInfo && (
            <>
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Store Analysis</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Marketing post actions */}
          {showTabContent && activeTab?.type === 'marketing-post' && activeTab.marketingPost && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5"
                onClick={() => onRegenerateImage?.(activeTab.marketingPost!)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5"
                onClick={() => onSaveToLibrary?.(activeTab)}
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5"
                onClick={() => {
                  if (activeTab.marketingPost?.imageUrl) {
                    window.open(activeTab.marketingPost.imageUrl, '_blank')
                  }
                }}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </>
          )}
          {/* Report actions */}
          {showReportPreview && (
            <>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5"
                  onClick={() => setShowShareMenu(!showShareMenu)}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </Button>
                {showShareMenu && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-popover border rounded-md shadow-lg z-10 py-1">
                    <button
                      className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted"
                      onClick={() => handleShare('copy')}
                    >
                      Copy link
                    </button>
                    <button
                      className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted"
                      onClick={() => handleShare('email')}
                    >
                      Email
                    </button>
                    <button
                      className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted"
                      onClick={() => handleShare('download')}
                    >
                      Download PDF
                    </button>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5"
                onClick={() => window.open(`${reportUrl}?download=true`, '_blank')}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onTogglePanel}
            title="Collapse panel"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto">
          {/* Marketing Post Canvas */}
          {showTabContent && activeTab?.type === 'marketing-post' && (
            <MarketingPostCanvas
              post={activeTab.marketingPost}
              isLoading={activeTab.isLoading}
            />
          )}

          {/* Report Tab Content */}
          {showTabContent && activeTab?.type === 'report' && activeTab.reportUrl && (
            <div className="h-full p-3">
              <iframe
                src={activeTab.reportUrl}
                className="h-full w-full rounded border bg-white"
                title="Report Preview"
              />
            </div>
          )}

          {/* Legacy: Generating Report */}
          {!showTabContent && isGeneratingReport && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-3">Generating report...</p>
              </div>
            </div>
          )}

          {/* Legacy: Report Preview (no tabs) */}
          {showReportPreview && (
            <div className="h-full p-3">
              <iframe
                src={reportUrl}
                className="h-full w-full rounded border bg-white"
                title="Report Preview"
              />
            </div>
          )}

          {/* Store Info */}
          {showStoreInfo && (
            <div className="p-4">
              {/* Store Header */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{selectedStore.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedStore.segments.length} lifestyle segments
                </p>
              </div>

              {/* Top 5 Segments */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-accent" />
                  Top 5 Segments
                </h4>
                <div className="space-y-2">
                  {selectedStore.segments
                    .sort((a, b) => b.householdShare - a.householdShare)
                    .slice(0, 5)
                    .map((segment, index) => (
                      <div
                        key={segment.code}
                        className="flex items-center gap-3 p-2.5 rounded-md border bg-card"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-muted text-xs font-semibold">
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary text-primary-foreground">
                              {segment.code}
                            </span>
                            <span className="text-sm font-medium truncate">{segment.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {segment.lifeMode} • {segment.lifeStage}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-accent">
                            {segment.householdShare.toFixed(1)}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {segment.householdCount.toLocaleString()} HH
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Demographics */}
              {selectedStore.segments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-accent" />
                    Top Segment Demographics
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(() => {
                      const topSegment = selectedStore.segments
                        .sort((a, b) => b.householdShare - a.householdShare)[0]
                      return (
                        <>
                          <div className="p-3 rounded-md border bg-card">
                            <p className="text-[10px] text-muted-foreground">Median Age</p>
                            <p className="text-lg font-semibold">
                              {topSegment.medianAge?.toFixed(0) || 'N/A'}
                            </p>
                          </div>
                          <div className="p-3 rounded-md border bg-card">
                            <p className="text-[10px] text-muted-foreground">Median Income</p>
                            <p className="text-lg font-semibold">
                              {formatCurrency(topSegment.medianHouseholdIncome)}
                            </p>
                          </div>
                          <div className="p-3 rounded-md border bg-card">
                            <p className="text-[10px] text-muted-foreground">Homeownership</p>
                            <p className="text-lg font-semibold">
                              {formatPercent(topSegment.homeownershipRate)}
                            </p>
                          </div>
                          <div className="p-3 rounded-md border bg-card">
                            <p className="text-[10px] text-muted-foreground">Net Worth</p>
                            <p className="text-lg font-semibold">
                              {formatCurrency(topSegment.medianNetWorth)}
                            </p>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {showEmptyState && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Select a store to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Marketing Post Canvas Component - Lovart-style layout
function MarketingPostCanvas({
  post,
  isLoading,
}: {
  post: MarketingPost | null | undefined
  isLoading: boolean
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="relative w-64 h-64 mx-auto mb-4">
            {/* Shimmer effect for image placeholder */}
            <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted rounded-lg animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Generating your marketing image...</p>
          <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No marketing post to display</p>
      </div>
    )
  }

  const platformColors = {
    instagram: 'from-purple-500 to-pink-500',
    linkedin: 'from-blue-600 to-blue-700',
    facebook: 'from-blue-500 to-blue-600',
    twitter: 'from-gray-800 to-black',
  }

  return (
    <div className="h-full overflow-auto">
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Left: Image Preview */}
        <div className="lg:w-1/2 flex flex-col">
          {/* Platform selector dropdown */}
          <div className="flex items-center justify-between mb-4">
            <div className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              bg-gradient-to-r ${platformColors[post.platform]} text-white
            `}>
              <PlatformIcon platform={post.platform} />
              {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)} Post
            </div>
            <span className="text-sm text-muted-foreground">{post.storeName}</span>
          </div>

          {/* Image Container */}
          <div className="relative rounded-xl overflow-hidden border-2 border-border shadow-xl bg-black">
            {post.imageUrl ? (
              <img
                src={post.imageUrl}
                alt={post.headline}
                className="w-full aspect-square object-cover animate-fadeIn"
              />
            ) : (
              <div className="w-full aspect-square bg-muted flex items-center justify-center">
                <Image className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Image Actions */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                if (post.imageUrl) {
                  const link = document.createElement('a')
                  link.href = post.imageUrl
                  link.download = `${post.storeName}-${post.platform}-post.png`
                  link.click()
                }
              }}
            >
              <Download className="h-4 w-4" />
              Download Image
            </Button>
          </div>
        </div>

        {/* Right: Content & Captions */}
        <div className="lg:w-1/2 flex flex-col gap-4">
          {/* Headline */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Headline
              </label>
              <button
                onClick={() => copyToClipboard(post.headline, 'headline')}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {copiedField === 'headline' ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-lg font-bold text-foreground">{post.headline}</p>
          </div>

          {/* Caption */}
          <div className="rounded-xl border bg-card p-4 flex-1">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Caption
              </label>
              <button
                onClick={() => copyToClipboard(post.body, 'caption')}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {copiedField === 'caption' ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {post.body}
            </p>
          </div>

          {/* Hashtags */}
          {post.hashtags.length > 0 && (
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Hashtags
                </label>
                <button
                  onClick={() => copyToClipboard(post.hashtags.join(' '), 'hashtags')}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {copiedField === 'hashtags' ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy All
                    </>
                  )}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    onClick={() => copyToClipboard(tag, `tag-${index}`)}
                    className="text-sm text-primary bg-primary/10 px-2 py-1 rounded-md hover:bg-primary/20 cursor-pointer transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Copy All Content */}
          <Button
            variant="default"
            className="w-full gap-2"
            onClick={() => {
              const fullContent = `${post.headline}\n\n${post.body}\n\n${post.hashtags.join(' ')}`
              copyToClipboard(fullContent, 'all')
            }}
          >
            {copiedField === 'all' ? (
              <>
                <Check className="h-4 w-4" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy All Content
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
