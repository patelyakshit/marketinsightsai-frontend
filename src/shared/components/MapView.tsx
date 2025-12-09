import { useState, useRef, useCallback, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react'
import {
  Maximize2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Layers,
  Lightbulb,
  List,
  Store as StoreIcon,
  Search,
  Plus,
  GripVertical,
  MoreHorizontal,
  SlidersHorizontal,
  Users,
  DollarSign,
  Building,
  TrendingUp,
  PieChart as PieChartIcon,
  X,
  Globe,
  File,
  Link,
  Star,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { Button } from '@/shared/components/ui/button'
import { ArcGISMap, type ArcGISMapRef } from '@/shared/components/ArcGISMap'
import type { Store, MapLocation } from '@/shared/types'

// Expose methods via ref for external control
export interface MapViewRef {
  zoomTo: (location: MapLocation) => void
}

interface MapViewProps {
  stores: Store[]
  selectedStore: Store | null
  onStoreSelect: (store: Store) => void
  onGenerateReport: (storeName: string, customText?: string) => void
  onMapReady?: () => void
  initialToolsExpanded?: boolean
  initialActiveTab?: ToolsTab
}

type ToolsTab = 'layers' | 'insights' | 'list'

// Layer data for the Layers panel
const defaultLayers = [
  { id: 'stores', name: 'Stores', checked: true, icon: StoreIcon },
  { id: 'tapestry', name: 'Tapestry Segmentation', checked: true, expandable: true },
  { id: 'educational', name: 'Educational Structures', checked: false, expandable: true },
  { id: 'lifestyles', name: 'Lifestyles', checked: false, expandable: true },
  { id: 'mortgage', name: 'Mortgage Burden', checked: false },
  { id: 'age', name: 'Age: Median', checked: false },
  { id: 'housing', name: 'Housing Affordability Index', checked: false },
  { id: 'density', name: 'Population Density', checked: false },
]

// Add Data panel tabs
type AddDataTab = 'curated' | 'arcgis' | 'file' | 'web' | 'favourite'

// Curated data items
const curatedDataItems = [
  { id: 'soils', name: 'USA Soils Map Units', category: 'Environment' },
  { id: 'forest', name: 'Canada Forest Cover', category: 'Environment' },
  { id: 'traffic', name: 'Traffic Counts', category: 'Transportation' },
  { id: 'parcels', name: 'USA Parcels', category: 'Boundaries' },
  { id: 'demographics', name: 'USA Demographics', category: 'Demographics' },
  { id: 'spending', name: 'Consumer Spending', category: 'Demographics' },
  { id: 'tapestry', name: 'Tapestry Segmentation', category: 'Demographics' },
  { id: 'crime', name: 'Crime Index', category: 'Demographics' },
]

export const MapView = forwardRef<MapViewRef, MapViewProps>(function MapView({
  stores,
  selectedStore,
  onStoreSelect,
  onGenerateReport,
  onMapReady,
  initialToolsExpanded = false,
  initialActiveTab = 'layers'
}, ref) {
  const arcgisMapRef = useRef<ArcGISMapRef>(null)
  const [toolsExpanded, setToolsExpanded] = useState(initialToolsExpanded)

  // Expose zoomTo method via ref
  useImperativeHandle(ref, () => ({
    zoomTo: (location: MapLocation) => {
      arcgisMapRef.current?.zoomTo(location)
    },
  }), [])
  const [mapExpanded, setMapExpanded] = useState(true)
  const [activeToolsTab, setActiveToolsTab] = useState<ToolsTab>(initialActiveTab)
  const [splitRatio, setSplitRatio] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  const [layers, setLayers] = useState(defaultLayers)
  const [addDataOpen, setAddDataOpen] = useState(false)
  const [addDataTab, setAddDataTab] = useState<AddDataTab>('curated')

  // Update state when props change (for when stores are loaded)
  useEffect(() => {
    if (initialToolsExpanded && !toolsExpanded) {
      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        setToolsExpanded(true)
        setSplitRatio(50)
      })
    }
  }, [initialToolsExpanded, toolsExpanded])

  useEffect(() => {
    if (initialActiveTab !== activeToolsTab) {
      setActiveToolsTab(initialActiveTab)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialActiveTab])

  const containerRef = useRef<HTMLDivElement>(null)

  // Handle resize drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const newRatio = ((e.clientY - rect.top) / rect.height) * 100

      // Handle collapse thresholds
      if (newRatio < 15) {
        // Collapse map, expand tools fully
        setSplitRatio(15)
        setMapExpanded(false)
        setToolsExpanded(true)
      } else if (newRatio > 85) {
        // Collapse tools, expand map fully
        setSplitRatio(85)
        setToolsExpanded(false)
        setMapExpanded(true)
      } else {
        // Both expanded
        setSplitRatio(newRatio)
        if (!toolsExpanded) setToolsExpanded(true)
        if (!mapExpanded) setMapExpanded(true)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, toolsExpanded, mapExpanded])

  const handleToolsToggle = () => {
    if (toolsExpanded) {
      setToolsExpanded(false)
      setMapExpanded(true)
    } else {
      setToolsExpanded(true)
      if (!mapExpanded) {
        setMapExpanded(true)
      }
      setSplitRatio(50)
    }
  }

  const handleMapToggle = () => {
    if (mapExpanded) {
      // Collapse map, expand tools
      setMapExpanded(false)
      setToolsExpanded(true)
      setSplitRatio(15)
    } else {
      // Expand map
      setMapExpanded(true)
      if (!toolsExpanded) {
        setSplitRatio(50)
        setToolsExpanded(true)
      } else {
        setSplitRatio(50)
      }
    }
  }

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, checked: !layer.checked } : layer
    ))
  }

  const toolsTabs = [
    { id: 'layers' as const, icon: Layers, label: 'Layers' },
    { id: 'insights' as const, icon: Lightbulb, label: 'Insights' },
    { id: 'list' as const, icon: List, label: 'List' },
  ]

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-background">
      {/* Map Section Header */}
      <div
        className={cn(
          "flex items-center justify-between h-11 px-3 border-b shrink-0 cursor-pointer hover:bg-muted/30 transition-colors",
          !mapExpanded && "border-b-0"
        )}
        onClick={handleMapToggle}
      >
        <span className="text-sm font-medium">Map</span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
            }}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleMapToggle()
            }}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title={mapExpanded ? "Collapse" : "Expand"}
          >
            {mapExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Map Area */}
      {mapExpanded && (
        <div
          className="relative bg-zinc-200 overflow-hidden"
          style={{
            height: toolsExpanded
              ? `calc(${splitRatio}% - 44px)` // Account for header
              : 'calc(100% - 88px)' // Full height minus both headers
          }}
        >
          {/* ArcGIS Map */}
          <ArcGISMap
            ref={arcgisMapRef}
            stores={stores}
            selectedStore={selectedStore}
            onStoreSelect={onStoreSelect}
            onMapReady={onMapReady}
            showSearch={true}
            showLocate={true}
            showHome={true}
            showMeasurement={true}
            showBasemapGallery={true}
            showScaleBar={true}
            className="absolute inset-0"
          />
        </div>
      )}

      {/* Resize Handle */}
      {mapExpanded && toolsExpanded && (
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            'h-1 bg-border hover:bg-primary cursor-row-resize shrink-0',
            isResizing && 'bg-primary'
          )}
        />
      )}

      {/* Tools & Insights Section */}
      <div
        className={cn(
          'flex flex-col bg-background border-t',
          toolsExpanded ? 'flex-1' : ''
        )}
        style={{
          height: !mapExpanded
            ? 'calc(100% - 44px)' // Full height when map collapsed (minus map header)
            : toolsExpanded
              ? `calc(${100 - splitRatio}%)`
              : '44px'
        }}
      >
        {/* Tools Header */}
        <div
          className={cn(
            'flex items-center justify-between h-11 px-3 cursor-pointer hover:bg-muted/30 transition-colors shrink-0',
            toolsExpanded && 'border-b'
          )}
          onClick={handleToolsToggle}
        >
          <span className="text-sm font-medium">Tools & Insights</span>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
              }}
              className="p-1.5 rounded hover:bg-muted transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleToolsToggle()
              }}
              className="p-1.5 rounded hover:bg-muted transition-colors"
              title={toolsExpanded ? "Collapse" : "Expand"}
            >
              {toolsExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Tools Content */}
        {toolsExpanded && (
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Icon Sidebar */}
            <div className="w-12 border-r bg-muted/20 flex flex-col items-center py-2 gap-1 shrink-0">
              {toolsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveToolsTab(tab.id)}
                  title={tab.label}
                  className={cn(
                    'w-9 h-9 flex items-center justify-center rounded-md transition-colors',
                    activeToolsTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                </button>
              ))}

              {/* Collapse sidebar button at bottom */}
              <div className="flex-1" />
              <button
                className="w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Collapse"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              {activeToolsTab === 'layers' && (
                <div className="flex h-full">
                  {/* Main Layers Content */}
                  <div className={cn(
                    "flex flex-col transition-all duration-200",
                    addDataOpen ? "flex-1 min-w-0" : "flex-1"
                  )}>
                    {/* Layers Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
                      <span className="text-sm font-medium">Layers</span>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded hover:bg-muted transition-colors">
                          <Search className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-muted transition-colors">
                          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => setAddDataOpen(!addDataOpen)}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 text-sm rounded transition-colors",
                            addDataOpen
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          {addDataOpen ? 'Close data' : 'Add data'}
                          <ChevronRight
                            className={cn(
                              "h-3 w-3 transition-transform duration-200",
                              addDataOpen && "rotate-180"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Layers List */}
                    <div className="flex-1 overflow-auto">
                      {layers.map((layer) => (
                        <div
                          key={layer.id}
                          className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/30 transition-colors border-b border-border/50"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
                          <label className="flex items-center gap-2 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={layer.checked}
                              onChange={() => toggleLayer(layer.id)}
                              className="w-4 h-4 rounded border-2 border-muted-foreground/30 text-accent focus:ring-accent"
                            />
                            <span className="text-sm">{layer.name}</span>
                          </label>
                          {layer.expandable && (
                            <button className="p-1 rounded hover:bg-muted">
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )}
                          <button className="p-1 rounded hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Basemap Selector */}
                    <div className="border-t px-4 py-3 shrink-0">
                      <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/30 rounded-md p-2 -mx-2 transition-colors">
                        <div className="w-10 h-10 rounded bg-zinc-300 shrink-0 overflow-hidden">
                          <img
                            src="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/4/6/4"
                            alt="Basemap"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Current Basemap</p>
                          <p className="text-sm font-medium">Light Gray Canvas</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Add Data Panel */}
                  {addDataOpen && (
                    <div className="w-64 border-l flex flex-col bg-background shrink-0">
                      {/* Add Data Header */}
                      <div className="flex items-center justify-between px-3 py-2 border-b">
                        <span className="text-sm font-medium">Add data</span>
                        <button
                          onClick={() => setAddDataOpen(false)}
                          className="p-1 rounded hover:bg-muted transition-colors"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>

                      {/* Add Data Tabs */}
                      <div className="flex border-b px-2 py-1.5 gap-1 overflow-x-auto shrink-0">
                        {[
                          { id: 'curated' as const, icon: Sparkles, label: 'Curated' },
                          { id: 'arcgis' as const, icon: Globe, label: 'ArcGIS' },
                          { id: 'file' as const, icon: File, label: 'File' },
                          { id: 'web' as const, icon: Link, label: 'Web' },
                          { id: 'favourite' as const, icon: Star, label: 'Favourite' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setAddDataTab(tab.id)}
                            className={cn(
                              "flex items-center gap-1.5 px-2 py-1.5 text-xs rounded whitespace-nowrap transition-colors",
                              addDataTab === tab.id
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                          >
                            <tab.icon className="h-3 w-3" />
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Add Data Content */}
                      <div className="flex-1 overflow-auto">
                        {addDataTab === 'curated' && (
                          <div className="p-2 space-y-1">
                            {curatedDataItems.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  // Add to layers if not already present
                                  if (!layers.find(l => l.id === item.id)) {
                                    setLayers(prev => [...prev, {
                                      id: item.id,
                                      name: item.name,
                                      checked: true,
                                      expandable: false
                                    }])
                                  }
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left rounded hover:bg-muted/50 transition-colors group"
                              >
                                <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm truncate">{item.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{item.category}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {addDataTab === 'arcgis' && (
                          <div className="p-4 text-center text-muted-foreground">
                            <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Search ArcGIS Online</p>
                            <p className="text-xs mt-1">Find layers from the Living Atlas</p>
                            <div className="mt-3">
                              <input
                                type="text"
                                placeholder="Search layers..."
                                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                            </div>
                          </div>
                        )}

                        {addDataTab === 'file' && (
                          <div className="p-4 text-center text-muted-foreground">
                            <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Upload a file</p>
                            <p className="text-xs mt-1">CSV, GeoJSON, Shapefile</p>
                            <button className="mt-3 px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors">
                              Browse files
                            </button>
                          </div>
                        )}

                        {addDataTab === 'web' && (
                          <div className="p-4 text-center text-muted-foreground">
                            <Link className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Add from URL</p>
                            <p className="text-xs mt-1">Feature service, WMS, etc.</p>
                            <div className="mt-3">
                              <input
                                type="text"
                                placeholder="Enter URL..."
                                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                            </div>
                          </div>
                        )}

                        {addDataTab === 'favourite' && (
                          <div className="p-4 text-center text-muted-foreground">
                            <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No favourites yet</p>
                            <p className="text-xs mt-1">Star layers to save them here</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeToolsTab === 'insights' && (
                <div className="p-4 overflow-auto">
                  <h3 className="text-sm font-medium mb-3">Market Insights</h3>
                  {stores.length === 0 ? (
                    <div className="text-center py-8">
                      <Lightbulb className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No data available</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload a tapestry file to see insights
                      </p>
                    </div>
                  ) : selectedStore ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-md">
                        <p className="text-xs text-muted-foreground">Selected Store</p>
                        <p className="font-medium">{selectedStore.name}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-md">
                        <p className="text-xs text-muted-foreground">Total Segments</p>
                        <p className="font-medium">{selectedStore.segments.length}</p>
                      </div>
                      {selectedStore.segments[0] && (
                        <div className="p-3 bg-muted/50 rounded-md">
                          <p className="text-xs text-muted-foreground">Top Segment</p>
                          <p className="font-medium">{selectedStore.segments[0].name}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedStore.segments[0].householdShare.toFixed(1)}% of households
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Select a store to view insights
                    </p>
                  )}
                </div>
              )}

              {activeToolsTab === 'list' && (
                <div className="flex h-full overflow-hidden">
                  {stores.length === 0 ? (
                    <div className="flex items-center justify-center flex-1">
                      <div className="text-center p-4">
                        <StoreIcon className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">No stores loaded</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload a tapestry file to see stores
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Stores List - Left Panel */}
                      <div className="w-56 border-r flex flex-col shrink-0 bg-muted/10">
                        {/* Dropdown Header */}
                        <div className="flex items-center justify-between px-3 py-2.5 border-b bg-background">
                          <button className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                            <StoreIcon className="h-4 w-4" />
                            <span>My Stores</span>
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {stores.length}
                          </span>
                        </div>

                        {/* Store List */}
                        <div className="flex-1 overflow-auto">
                          {stores.map((store) => (
                            <button
                              key={store.id}
                              onClick={() => onStoreSelect(store)}
                              className={cn(
                                'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors border-b border-border/50',
                                selectedStore?.id === store.id
                                  ? 'bg-primary/10 text-foreground border-l-2 border-l-primary'
                                  : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                              )}
                            >
                              <div className={cn(
                                'flex h-7 w-7 items-center justify-center rounded shrink-0',
                                selectedStore?.id === store.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                              )}>
                                <StoreIcon className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{store.name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {store.segments.length} segments
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Store Details - Right Panel */}
                      <StoreDetailPanel
                        store={selectedStore}
                        onGenerateReport={onGenerateReport}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

// Pie chart color palette
const SEGMENT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
]

interface StoreDetailPanelProps {
  store: Store | null
  onGenerateReport: (storeName: string, customText?: string) => void
}

// Pie chart constants
const PIE_CHART_SIZE = 160
const PIE_RADIUS = 70
const PIE_CENTER_X = PIE_CHART_SIZE / 2
const PIE_CENTER_Y = PIE_CHART_SIZE / 2

function StoreDetailPanel({ store, onGenerateReport }: StoreDetailPanelProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)

  // Sort segments by household share and calculate pie chart data
  const sortedSegments = useMemo(() => {
    if (!store) return []
    return [...store.segments].sort((a, b) => b.householdShare - a.householdShare)
  }, [store])

  // Calculate stats
  const stats = useMemo(() => {
    if (!store || sortedSegments.length === 0) return null

    const totalHouseholds = sortedSegments.reduce((sum, s) => sum + s.householdCount, 0)
    const avgIncome = sortedSegments.reduce((sum, s) => sum + (s.medianHouseholdIncome || 0), 0) / sortedSegments.length
    const avgAge = sortedSegments.reduce((sum, s) => sum + (s.medianAge || 0), 0) / sortedSegments.length
    const avgHomeownership = sortedSegments.reduce((sum, s) => sum + (s.homeownershipRate || 0), 0) / sortedSegments.length

    return {
      totalHouseholds,
      avgIncome,
      avgAge,
      avgHomeownership,
      topSegment: sortedSegments[0],
    }
  }, [store, sortedSegments])

  // Calculate pie chart paths
  const pieSlices = useMemo(() => {
    if (sortedSegments.length === 0) return []
    let cumulativeAngle = -90 // Start from top
    return sortedSegments.map((segment, index) => {
      const angle = (segment.householdShare / 100) * 360
      const startAngle = cumulativeAngle
      const endAngle = cumulativeAngle + angle
      cumulativeAngle = endAngle

      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180

      const x1 = PIE_CENTER_X + PIE_RADIUS * Math.cos(startRad)
      const y1 = PIE_CENTER_Y + PIE_RADIUS * Math.sin(startRad)
      const x2 = PIE_CENTER_X + PIE_RADIUS * Math.cos(endRad)
      const y2 = PIE_CENTER_Y + PIE_RADIUS * Math.sin(endRad)

      const largeArc = angle > 180 ? 1 : 0

      const pathD = `M ${PIE_CENTER_X} ${PIE_CENTER_Y} L ${x1} ${y1} A ${PIE_RADIUS} ${PIE_RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`

      return {
        segment,
        path: pathD,
        color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
      }
    })
  }, [sortedSegments])

  if (!store) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/5">
        <div className="text-center p-6">
          <PieChartIcon className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Select a store to view details</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click on a store from the list to see segments and statistics
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Store Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div>
          <h3 className="text-sm font-semibold">{store.name}</h3>
          {store.address && (
            <p className="text-xs text-muted-foreground">{store.address}</p>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => onGenerateReport(store.name)}
          className="h-8"
        >
          Generate Report
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Top Section - Pie Chart and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pie Chart Card */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Segment Distribution
            </h4>
            <div className="flex items-center gap-4">
              {/* Pie Chart */}
              <svg
                width={PIE_CHART_SIZE}
                height={PIE_CHART_SIZE}
                className="shrink-0"
              >
                {pieSlices.map((slice) => {
                  const isHovered = hoveredSegment === slice.segment.code
                  return (
                    <path
                      key={slice.segment.code}
                      d={slice.path}
                      fill={slice.color}
                      stroke="white"
                      strokeWidth="2"
                      onMouseEnter={() => setHoveredSegment(slice.segment.code)}
                      onMouseLeave={() => setHoveredSegment(null)}
                      className={cn(
                        'cursor-pointer transition-all',
                        isHovered && 'opacity-80'
                      )}
                      style={{
                        transform: isHovered ? `scale(1.03)` : 'scale(1)',
                        transformOrigin: `${PIE_CENTER_X}px ${PIE_CENTER_Y}px`,
                      }}
                    />
                  )
                })}
                {/* Center circle */}
                <circle cx={PIE_CENTER_X} cy={PIE_CENTER_Y} r="35" fill="white" />
                <text
                  x={PIE_CENTER_X}
                  y={PIE_CENTER_Y - 5}
                  textAnchor="middle"
                  className="text-xs font-medium fill-foreground"
                >
                  {sortedSegments.length}
                </text>
                <text
                  x={PIE_CENTER_X}
                  y={PIE_CENTER_Y + 10}
                  textAnchor="middle"
                  className="text-[10px] fill-muted-foreground"
                >
                  Segments
                </text>
              </svg>

              {/* Legend - Top 5 */}
              <div className="flex-1 space-y-1.5 min-w-0">
                {sortedSegments.slice(0, 5).map((segment, index) => (
                  <div
                    key={segment.code}
                    onMouseEnter={() => setHoveredSegment(segment.code)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    className={cn(
                      'flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors',
                      hoveredSegment === segment.code && 'bg-muted/50'
                    )}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length] }}
                    />
                    <span className="text-xs truncate flex-1">{segment.name}</span>
                    <span className="text-xs font-medium text-muted-foreground shrink-0">
                      {segment.householdShare.toFixed(1)}%
                    </span>
                  </div>
                ))}
                {sortedSegments.length > 5 && (
                  <p className="text-[10px] text-muted-foreground pl-4">
                    +{sortedSegments.length - 5} more segments
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Total Households
                  </span>
                </div>
                <p className="text-lg font-semibold">
                  {stats.totalHouseholds.toLocaleString()}
                </p>
              </div>

              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Avg. Income
                  </span>
                </div>
                <p className="text-lg font-semibold">
                  ${Math.round(stats.avgIncome / 1000)}K
                </p>
              </div>

              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Median Age
                  </span>
                </div>
                <p className="text-lg font-semibold">
                  {Math.round(stats.avgAge)} yrs
                </p>
              </div>

              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Building className="h-3.5 w-3.5 text-violet-500" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Homeownership
                  </span>
                </div>
                <p className="text-lg font-semibold">
                  {Math.round(stats.avgHomeownership)}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Segments Table */}
        <div className="bg-muted/30 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              All Segments
            </h4>
            <span className="text-xs text-muted-foreground">
              {sortedSegments.length} total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Segment</th>
                  <th className="text-right py-2 px-4 text-xs font-medium text-muted-foreground">Share</th>
                  <th className="text-right py-2 px-4 text-xs font-medium text-muted-foreground">Households</th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Life Mode</th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Life Stage</th>
                </tr>
              </thead>
              <tbody>
                {sortedSegments.map((segment, index) => (
                  <tr
                    key={segment.code}
                    onMouseEnter={() => setHoveredSegment(segment.code)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    className={cn(
                      'border-b border-border/30 transition-colors',
                      hoveredSegment === segment.code ? 'bg-muted/50' : 'hover:bg-muted/30'
                    )}
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length] }}
                        />
                        <span className="font-medium">{segment.name}</span>
                        <span className="text-xs text-muted-foreground">({segment.code})</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium">
                      {segment.householdShare.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground">
                      {segment.householdCount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground">
                      {segment.lifeMode || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground">
                      {segment.lifeStage || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Segment Highlight Card */}
        {stats?.topSegment && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-primary font-medium uppercase tracking-wider">
                  Top Segment
                </span>
                <h4 className="text-base font-semibold mt-1">{stats.topSegment.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Code: {stats.topSegment.code} • {stats.topSegment.householdShare.toFixed(1)}% of households
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {stats.topSegment.householdCount.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">households</p>
              </div>
            </div>
            {stats.topSegment.description && (
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                {stats.topSegment.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
