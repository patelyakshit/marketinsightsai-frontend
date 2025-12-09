import { useState } from 'react'
import {
  X,
  Presentation,
  Briefcase,
  TrendingUp,
  Target,
  BarChart3,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import type { PresentationTemplate, PresentationTemplateInfo, Store } from '@/shared/types'
import { cn } from '@/shared/utils/cn'

interface PresentationModalProps {
  isOpen: boolean
  onClose: () => void
  stores: Store[]
  selectedStore: Store | null
  onGenerate: (storeId: string, template: PresentationTemplate, customTitle?: string) => void
  isGenerating: boolean
}

const templates: PresentationTemplateInfo[] = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'Quick overview for leadership with key insights and recommendations',
    slideCount: '5-7 slides',
    icon: 'briefcase',
  },
  {
    id: 'franchise-pitch',
    name: 'Franchise Pitch',
    description: 'Location opportunity presentation for franchisees and investors',
    slideCount: '10-12 slides',
    icon: 'target',
  },
  {
    id: 'marketing-strategy',
    name: 'Marketing Strategy',
    description: 'Campaign planning deck with audience insights and channel recommendations',
    slideCount: '8-10 slides',
    icon: 'trending',
  },
  {
    id: 'quarterly-review',
    name: 'Quarterly Review',
    description: 'Comprehensive trend analysis and performance metrics',
    slideCount: '15+ slides',
    icon: 'chart',
  },
]

const TemplateIcon = ({ icon, className }: { icon: string; className?: string }) => {
  switch (icon) {
    case 'briefcase':
      return <Briefcase className={className} />
    case 'target':
      return <Target className={className} />
    case 'trending':
      return <TrendingUp className={className} />
    case 'chart':
      return <BarChart3 className={className} />
    default:
      return <Presentation className={className} />
  }
}

export function PresentationModal({
  isOpen,
  onClose,
  stores,
  selectedStore,
  onGenerate,
  isGenerating,
}: PresentationModalProps) {
  const [step, setStep] = useState<'store' | 'template'>('store')
  const [localSelectedStore, setLocalSelectedStore] = useState<Store | null>(selectedStore)
  const [selectedTemplate, setSelectedTemplate] = useState<PresentationTemplate | null>(null)
  const [customTitle, setCustomTitle] = useState('')

  // Reset state when modal opens
  const handleClose = () => {
    setStep('store')
    setLocalSelectedStore(selectedStore)
    setSelectedTemplate(null)
    setCustomTitle('')
    onClose()
  }

  const handleStoreSelect = (store: Store) => {
    setLocalSelectedStore(store)
    setStep('template')
  }

  const handleTemplateSelect = (template: PresentationTemplate) => {
    setSelectedTemplate(template)
  }

  const handleGenerate = () => {
    if (!localSelectedStore || !selectedTemplate) return
    onGenerate(localSelectedStore.id, selectedTemplate, customTitle || undefined)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Presentation className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Create Presentation</h2>
              <p className="text-sm text-muted-foreground">
                {step === 'store' ? 'Select a store to analyze' : 'Choose a template'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {step === 'store' ? (
            <>
              {stores.length === 0 ? (
                <div className="text-center py-12">
                  <Presentation className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No stores available</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Upload a tapestry file first to analyze store locations and generate presentations.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => handleStoreSelect(store)}
                      className={cn(
                        'w-full flex items-center justify-between p-4 rounded-lg border text-left transition-all',
                        'hover:border-primary hover:bg-primary/5',
                        localSelectedStore?.id === store.id && 'border-primary bg-primary/5'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{store.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {store.segments.length} lifestyle segments
                          {store.address && ` • ${store.address}`}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {/* Selected store indicator */}
              {localSelectedStore && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 mb-6">
                  <span className="text-sm text-muted-foreground">Creating for:</span>
                  <span className="font-medium">{localSelectedStore.name}</span>
                  <button
                    onClick={() => setStep('store')}
                    className="ml-auto text-sm text-primary hover:underline"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Template selection */}
              <div className="grid grid-cols-2 gap-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={cn(
                      'flex flex-col items-start p-4 rounded-xl border text-left transition-all',
                      'hover:border-primary hover:bg-primary/5',
                      selectedTemplate === template.id && 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    )}
                  >
                    <div className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-lg mb-3',
                      selectedTemplate === template.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      <TemplateIcon icon={template.icon} className="h-5 w-5" />
                    </div>
                    <p className="font-medium mb-1">{template.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                    <span className="text-xs font-medium text-primary">{template.slideCount}</span>
                  </button>
                ))}
              </div>

              {/* Custom title input */}
              {selectedTemplate && (
                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2">
                    Custom Title (optional)
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder={`${localSelectedStore?.name} - ${templates.find(t => t.id === selectedTemplate)?.name}`}
                    className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30 shrink-0">
          <div className="text-sm text-muted-foreground">
            {step === 'template' && selectedTemplate && (
              <>
                Selected: <span className="font-medium text-foreground">
                  {templates.find(t => t.id === selectedTemplate)?.name}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === 'template' && (
              <Button
                variant="outline"
                onClick={() => setStep('store')}
              >
                Back
              </Button>
            )}
            <Button
              onClick={step === 'store' ? handleClose : handleGenerate}
              disabled={step === 'template' && (!selectedTemplate || isGenerating)}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : step === 'store' ? (
                'Cancel'
              ) : (
                <>
                  <Presentation className="h-4 w-4 mr-2" />
                  Generate Presentation
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
