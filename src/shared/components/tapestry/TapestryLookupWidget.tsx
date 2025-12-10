import * as React from "react"
import {
  Search,
  MapPin,
  Users,
  Home,
  TrendingUp,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react"
import { cn } from "@/shared/utils/cn"
import { Badge } from "@/shared/components/ui/badge"
import { Progress } from "@/shared/components/ui/progress"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { SimpleTooltip } from "@/shared/components/ui/tooltip"
import type { TapestrySegment, TapestryLookupResult } from "@/shared/types"

// Re-export for backward compatibility
export type { TapestrySegment, TapestryLookupResult }

interface TapestryLookupWidgetProps {
  onLookup?: (address: string) => Promise<TapestryLookupResult>
  onSelectSegment?: (segment: TapestrySegment) => void
  initialAddress?: string
  isLoading?: boolean
  result?: TapestryLookupResult | null
  error?: string | null
  className?: string
  compact?: boolean
}

// LifeMode color mapping
const lifeModeColors: Record<string, { bg: string; text: string; border: string }> = {
  "Affluent Estates": { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
  "Uptown Individuals": { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  "Metro Renters": { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200" },
  "Family Landscapes": { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  "GenXurban": { bg: "bg-lime-100", text: "text-lime-700", border: "border-lime-200" },
  "Cozy Country Living": { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  "Ethnic Enclaves": { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  "Middle Ground": { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  "Senior Styles": { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200" },
  "Rustic Outposts": { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  "Midtown Singles": { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
  "Hometown": { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200" },
  "Next Wave": { bg: "bg-fuchsia-100", text: "text-fuchsia-700", border: "border-fuchsia-200" },
  "Scholars & Patriots": { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
}

function getLifeModeColor(lifeMode?: string) {
  if (!lifeMode) return { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" }
  return lifeModeColors[lifeMode] || { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" }
}

function TapestryLookupWidget({
  onLookup,
  onSelectSegment,
  initialAddress = "",
  isLoading = false,
  result: externalResult,
  error: externalError,
  className,
  compact = false,
}: TapestryLookupWidgetProps) {
  const [address, setAddress] = React.useState(initialAddress)
  const [internalLoading, setInternalLoading] = React.useState(false)
  const [internalResult, setInternalResult] = React.useState<TapestryLookupResult | null>(null)
  const [internalError, setInternalError] = React.useState<string | null>(null)
  const [isExpanded, setIsExpanded] = React.useState(true)

  const loading = isLoading || internalLoading
  const result = externalResult !== undefined ? externalResult : internalResult
  const error = externalError !== undefined ? externalError : internalError

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim() || !onLookup) return

    setInternalLoading(true)
    setInternalError(null)

    try {
      const data = await onLookup(address)
      setInternalResult(data)
    } catch (err) {
      setInternalError(err instanceof Error ? err.message : "Failed to lookup address")
    } finally {
      setInternalLoading(false)
    }
  }

  const clearResult = () => {
    setInternalResult(null)
    setInternalError(null)
    setAddress("")
  }

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-sm">Tapestry Lookup</h3>
        </div>
        {result && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address or location..."
              className="pl-9"
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading || !address.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Lookup"
            )}
          </Button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Location info */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{result.address}</p>
              <p className="text-xs text-muted-foreground">
                {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearResult}
              className="h-6 w-6 p-0 shrink-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/30 rounded-md">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Home className="h-3.5 w-3.5" />
                <span className="text-xs">Total Households</span>
              </div>
              <p className="text-lg font-semibold">
                {result.totalHouseholds.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-md">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs">Top Segments</span>
              </div>
              <p className="text-lg font-semibold">{result.segments.length}</p>
            </div>
          </div>

          {/* Dominant LifeMode */}
          {result.dominantLifeMode && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Dominant:</span>
              <Badge
                variant="secondary"
                className={cn(
                  getLifeModeColor(result.dominantLifeMode).bg,
                  getLifeModeColor(result.dominantLifeMode).text,
                  getLifeModeColor(result.dominantLifeMode).border
                )}
              >
                {result.dominantLifeMode}
              </Badge>
            </div>
          )}

          {/* Segments list */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Consumer Segments
            </h4>
            {result.segments.map((segment, idx) => (
              <SegmentItem
                key={segment.code}
                segment={segment}
                rank={idx + 1}
                onSelect={onSelectSegment}
                compact={compact}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface SegmentItemProps {
  segment: TapestrySegment
  rank: number
  onSelect?: (segment: TapestrySegment) => void
  compact?: boolean
}

function SegmentItem({ segment, rank, onSelect, compact }: SegmentItemProps) {
  const lifeModeColor = getLifeModeColor(segment.lifeMode)

  return (
    <button
      onClick={() => onSelect?.(segment)}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-md border transition-colors",
        "hover:bg-muted/50 hover:border-border/80",
        onSelect ? "cursor-pointer" : "cursor-default"
      )}
    >
      {/* Rank */}
      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
        <span className="text-xs font-medium">{rank}</span>
      </div>

      {/* Segment info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{segment.name}</span>
          <span className="text-xs text-muted-foreground">({segment.code})</span>
        </div>
        {segment.lifeMode && (
          <Badge
            variant="secondary"
            size="sm"
            className={cn("mt-1", lifeModeColor.bg, lifeModeColor.text, lifeModeColor.border)}
          >
            {segment.lifeMode}
          </Badge>
        )}
      </div>

      {/* Share */}
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold">{segment.householdShare.toFixed(1)}%</p>
        <p className="text-xs text-muted-foreground">
          {segment.householdCount.toLocaleString()} HH
        </p>
      </div>

      {/* Progress bar */}
      {!compact && (
        <div className="w-16 shrink-0">
          <Progress value={segment.householdShare} size="sm" />
        </div>
      )}

      {/* Info tooltip */}
      {segment.description && (
        <SimpleTooltip content={<p className="text-xs">{segment.description}</p>} side="left" className="max-w-xs">
          <button className="p-1 hover:bg-muted rounded shrink-0">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </SimpleTooltip>
      )}
    </button>
  )
}

// Compact inline segment badge for use elsewhere
interface TapestrySegmentBadgeProps {
  segment: TapestrySegment
  showShare?: boolean
  className?: string
}

function TapestrySegmentBadge({ segment, showShare = true, className }: TapestrySegmentBadgeProps) {
  const lifeModeColor = getLifeModeColor(segment.lifeMode)

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2 py-1 rounded-md border",
        lifeModeColor.bg,
        lifeModeColor.border,
        className
      )}
    >
      <span className={cn("text-xs font-medium", lifeModeColor.text)}>
        {segment.name}
      </span>
      {showShare && (
        <span className="text-xs text-muted-foreground">
          {segment.householdShare.toFixed(1)}%
        </span>
      )}
    </div>
  )
}

export { TapestryLookupWidget, TapestrySegmentBadge, getLifeModeColor, lifeModeColors }
