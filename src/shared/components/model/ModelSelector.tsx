import * as React from "react"
import { Check, ChevronDown, Sparkles, Zap, Crown } from "lucide-react"
import { cn } from "@/shared/utils/cn"
import { Badge } from "@/shared/components/ui/badge"

export type ModelProvider = "openai" | "anthropic" | "google"

export interface ModelOption {
  id: string
  name: string
  provider: ModelProvider
  description: string
  contextWindow: number
  capabilities: string[]
  isDefault?: boolean
  isPremium?: boolean
  isFastest?: boolean
  isSmartset?: boolean
}

// Default available models
export const defaultModels: ModelOption[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Most capable model, best for complex tasks",
    contextWindow: 128000,
    capabilities: ["vision", "function-calling", "json-mode"],
    isDefault: true,
    isSmartset: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Fast and efficient for everyday tasks",
    contextWindow: 128000,
    capabilities: ["vision", "function-calling", "json-mode"],
    isFastest: true,
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Excellent for nuanced analysis and writing",
    contextWindow: 200000,
    capabilities: ["vision", "function-calling"],
    isPremium: true,
  },
  {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    description: "Fast responses with good quality",
    contextWindow: 200000,
    capabilities: ["vision", "function-calling"],
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    description: "Google's latest fast multimodal model",
    contextWindow: 1000000,
    capabilities: ["vision", "function-calling", "grounding"],
    isFastest: true,
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    description: "Long context with excellent reasoning",
    contextWindow: 2000000,
    capabilities: ["vision", "function-calling", "grounding"],
    isPremium: true,
  },
]

const providerConfig: Record<ModelProvider, {
  label: string
  color: string
  bgColor: string
  borderColor: string
}> = {
  openai: {
    label: "OpenAI",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  anthropic: {
    label: "Anthropic",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  google: {
    label: "Google",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
}

interface ModelSelectorProps {
  models?: ModelOption[]
  selectedModelId: string
  onSelectModel: (modelId: string) => void
  disabled?: boolean
  className?: string
  compact?: boolean
}

function ModelSelector({
  models = defaultModels,
  selectedModelId,
  onSelectModel,
  disabled = false,
  className,
  compact = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0]

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Group models by provider
  const groupedModels = React.useMemo(() => {
    const groups: Record<ModelProvider, ModelOption[]> = {
      openai: [],
      anthropic: [],
      google: [],
    }
    models.forEach((model) => {
      groups[model.provider].push(model)
    })
    return groups
  }, [models])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
          "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          disabled && "opacity-50 cursor-not-allowed",
          compact ? "h-8 text-xs px-2" : "h-9"
        )}
      >
        <ProviderIcon provider={selectedModel.provider} className="h-4 w-4" />
        <span className="font-medium">{selectedModel.name}</span>
        {selectedModel.isSmartset && (
          <Crown className="h-3 w-3 text-amber-500" />
        )}
        {selectedModel.isFastest && !selectedModel.isSmartset && (
          <Zap className="h-3 w-3 text-yellow-500" />
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 z-50 mt-1 w-80 rounded-lg border bg-popover shadow-lg",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
          )}
        >
          <div className="p-2 max-h-96 overflow-auto">
            {(Object.keys(groupedModels) as ModelProvider[]).map((provider) => {
              const providerModels = groupedModels[provider]
              if (providerModels.length === 0) return null

              const config = providerConfig[provider]

              return (
                <div key={provider} className="mb-2 last:mb-0">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {config.label}
                  </div>

                  {providerModels.map((model) => (
                    <ModelOptionItem
                      key={model.id}
                      model={model}
                      isSelected={model.id === selectedModelId}
                      onClick={() => {
                        onSelectModel(model.id)
                        setIsOpen(false)
                      }}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ModelOptionItem({
  model,
  isSelected,
  onClick,
}: {
  model: ModelOption
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 rounded-md px-2 py-2.5 text-left transition-colors",
        "hover:bg-muted/50",
        isSelected && "bg-muted"
      )}
    >
      <ProviderIcon provider={model.provider} className="h-5 w-5 mt-0.5 shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{model.name}</span>
          {model.isDefault && (
            <Badge variant="secondary" size="sm">Default</Badge>
          )}
          {model.isSmartset && (
            <Badge variant="default" size="sm" className="bg-amber-100 text-amber-700 border-amber-200">
              <Crown className="h-2.5 w-2.5 mr-1" />
              Smartest
            </Badge>
          )}
          {model.isFastest && !model.isSmartset && (
            <Badge variant="secondary" size="sm">
              <Zap className="h-2.5 w-2.5 mr-1" />
              Fast
            </Badge>
          )}
          {model.isPremium && !model.isSmartset && (
            <Badge variant="outline" size="sm">Premium</Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {model.description}
        </p>

        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-muted-foreground">
            {formatContextWindow(model.contextWindow)} context
          </span>
          {model.capabilities.includes("vision") && (
            <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">vision</span>
          )}
        </div>
      </div>

      {isSelected && (
        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      )}
    </button>
  )
}

function ProviderIcon({ provider, className }: { provider: ModelProvider; className?: string }) {
  // Simple colored circles for each provider
  const colors: Record<ModelProvider, string> = {
    openai: "bg-emerald-500",
    anthropic: "bg-amber-500",
    google: "bg-blue-500",
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center",
        colors[provider],
        className
      )}
    >
      <Sparkles className="h-2.5 w-2.5 text-white" />
    </div>
  )
}

function formatContextWindow(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(tokens % 1000000 === 0 ? 0 : 1)}M`
  }
  return `${(tokens / 1000).toFixed(0)}K`
}

// Compact inline model indicator
interface ModelIndicatorProps {
  model: ModelOption
  className?: string
}

function ModelIndicator({ model, className }: ModelIndicatorProps) {
  const config = providerConfig[model.provider]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
        config.bgColor,
        config.borderColor,
        "border",
        className
      )}
    >
      <ProviderIcon provider={model.provider} className="h-3.5 w-3.5" />
      <span className={cn("font-medium", config.color)}>{model.name}</span>
    </div>
  )
}

export { ModelSelector, ModelIndicator, ProviderIcon, providerConfig }
