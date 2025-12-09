import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import esriConfig from '@arcgis/core/config'
import Graphic from '@arcgis/core/Graphic'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import Point from '@arcgis/core/geometry/Point'
import Search from '@arcgis/core/widgets/Search'
import Locate from '@arcgis/core/widgets/Locate'
import Home from '@arcgis/core/widgets/Home'
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery'
import LayerList from '@arcgis/core/widgets/LayerList'
import Legend from '@arcgis/core/widgets/Legend'
import ScaleBar from '@arcgis/core/widgets/ScaleBar'
import Measurement from '@arcgis/core/widgets/Measurement'
import Expand from '@arcgis/core/widgets/Expand'
import '@arcgis/core/assets/esri/themes/light/main.css'

import type { Store, MapLocation } from '@/shared/types'

// Expose methods via ref for external control
export interface ArcGISMapRef {
  zoomTo: (location: MapLocation) => void
}

// Only set API key if provided - without it, some premium features won't work
// but the map will still function with public layers
const ARCGIS_API_KEY = import.meta.env.VITE_ARCGIS_API_KEY
if (ARCGIS_API_KEY) {
  esriConfig.apiKey = ARCGIS_API_KEY
}

// Custom Tapestry layer URL - set this to your enriched layer from ArcGIS Online
// To create one: Use Map Viewer > Analysis > Enrich Layer with "2025 Dominant Tapestry Segment"
const CUSTOM_TAPESTRY_LAYER_URL = import.meta.env.VITE_TAPESTRY_LAYER_URL || ''

// 2025 Tapestry LifeMode colors (13 groups: A-L plus Unclassified)
const TAPESTRY_LIFEMODE_COLORS: Record<string, [number, number, number]> = {
  'A': [102, 51, 153],    // Urban Threads - Purple
  'B': [255, 127, 0],     // Flourishing Families - Orange
  'C': [0, 128, 128],     // Comfortable Empty Nesters - Teal
  'D': [220, 20, 60],     // Family Foundations - Crimson
  'E': [0, 100, 0],       // Aspiring Homeowners - Dark Green
  'F': [30, 144, 255],    // Uptown Urbanites - Dodger Blue
  'G': [255, 215, 0],     // Golden Years - Gold
  'H': [139, 69, 19],     // Rural Roots - Brown
  'I': [255, 105, 180],   // Youthful Endeavors - Pink
  'J': [70, 130, 180],    // Modest Means - Steel Blue
  'K': [128, 0, 0],       // Striving Singles - Maroon
  'L': [46, 139, 87],     // Settled Suburbia - Sea Green
  'U': [128, 128, 128],   // Unclassified - Gray
}

interface ArcGISMapProps {
  stores?: Store[]
  selectedStore?: Store | null
  onStoreSelect?: (store: Store) => void
  center?: [number, number]
  zoom?: number
  basemap?: string
  showSearch?: boolean
  showLocate?: boolean
  showHome?: boolean
  showMeasurement?: boolean
  showBasemapGallery?: boolean
  showLayerList?: boolean
  showLegend?: boolean
  showScaleBar?: boolean
  showDemographicsLayer?: boolean
  demographicsOpacity?: number
  className?: string
  onMapReady?: () => void
}

export const ArcGISMap = forwardRef<ArcGISMapRef, ArcGISMapProps>(function ArcGISMap({
  stores = [],
  selectedStore,
  onStoreSelect,
  center = [-96.8, 32.78], // Dallas, TX default
  zoom = 10,
  basemap = ARCGIS_API_KEY ? 'arcgis/light-gray' : 'gray-vector', // Use free basemap if no API key
  showSearch = true,
  showLocate = true,
  showHome = true,
  showMeasurement = true,
  showBasemapGallery = true,
  showLayerList = true,
  showLegend = true,
  showScaleBar = true,
  showDemographicsLayer = true,
  demographicsOpacity = 0.6,
  className = '',
  onMapReady,
}, ref) {
  const mapDiv = useRef<HTMLDivElement>(null)
  const viewRef = useRef<MapView | null>(null)
  const storesLayerRef = useRef<GraphicsLayer | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Expose zoomTo method via ref
  useImperativeHandle(ref, () => ({
    zoomTo: (location: MapLocation) => {
      if (!viewRef.current) return

      viewRef.current.goTo(
        {
          center: [location.longitude, location.latitude],
          zoom: location.zoom || 12,
        },
        {
          duration: 1000,
          easing: 'ease-in-out',
        }
      )
    },
  }), [])

  // Initialize map
  useEffect(() => {
    if (!mapDiv.current) return

    const map = new Map({
      basemap: basemap,
    })

    const view = new MapView({
      container: mapDiv.current,
      map: map,
      center: center,
      zoom: zoom,
      constraints: {
        minZoom: 3,
        maxZoom: 20,
      },
      popup: {
        dockEnabled: true,
        dockOptions: {
          buttonEnabled: false,
          breakpoint: false,
          position: 'top-right',
        },
      },
    })

    // Add Tapestry Segmentation Layer (Block Groups with polygon data)
    // This layer shows lifestyle segmentation data at the block group level
    if (showDemographicsLayer) {
      // Create renderer for Tapestry LifeMode groups
      const createTapestryRenderer = () => ({
        type: 'unique-value',
        field: 'TLIFECODE', // LifeMode code field (A, B, C, etc.)
        defaultSymbol: {
          type: 'simple-fill',
          color: [128, 128, 128, 0.6],
          outline: { color: [255, 255, 255, 0.3], width: 0.5 },
        },
        uniqueValueInfos: Object.entries(TAPESTRY_LIFEMODE_COLORS).map(([code, color]) => ({
          value: code,
          symbol: {
            type: 'simple-fill',
            color: [...color, 0.7] as [number, number, number, number],
            outline: { color: [255, 255, 255, 0.5], width: 0.5 },
          },
        })),
      })

      // Option 1: Use custom Tapestry layer URL if provided (from your ArcGIS Online enriched layer)
      if (CUSTOM_TAPESTRY_LAYER_URL) {
        const tapestryLayer = new FeatureLayer({
          url: CUSTOM_TAPESTRY_LAYER_URL,
          title: 'Tapestry Segmentation 2025',
          opacity: demographicsOpacity,
          visible: true,
          outFields: ['*'],
          renderer: createTapestryRenderer() as any,
          popupTemplate: {
            title: 'Block Group: {GEOID}',
            content: `
              <div style="padding: 8px; font-family: system-ui, -apple-system, sans-serif;">
                <div style="margin-bottom: 12px; padding: 8px; background: linear-gradient(135deg, #0079c1 0%, #005a8c 100%); border-radius: 6px;">
                  <p style="margin: 0; color: white; font-size: 16px; font-weight: 600;">{TAPSEGNAM}</p>
                  <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.8); font-size: 12px;">Segment Code: {TSEGCODE}</p>
                </div>
                <div style="margin-bottom: 8px;">
                  <p style="margin: 0; color: #333; font-size: 13px;"><strong>LifeMode Group:</strong> {TLIFENAME}</p>
                  <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">LifeMode Code: {TLIFECODE}</p>
                </div>
                <p style="margin-top: 12px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 8px;">
                  <em>Source: ArcGIS Tapestry Segmentation 2025</em>
                </p>
              </div>
            `,
          },
        })

        tapestryLayer.when(
          () => console.log('Custom Tapestry layer loaded successfully'),
          (error: Error) => {
            console.error('Error loading custom Tapestry layer:', error.message)
            addFallbackLayer(map, demographicsOpacity)
          }
        )

        map.add(tapestryLayer)
      } else {
        // Option 2: Fallback to public demographics layer
        console.info(
          'To display 2025 Tapestry data, set VITE_TAPESTRY_LAYER_URL in .env.\n' +
          'Create an enriched layer in ArcGIS Online:\n' +
          '1. Go to Map Viewer > Analysis > Enrich Layer\n' +
          '2. Select Block Groups as input\n' +
          '3. Search for "2025 Dominant Tapestry Segment" variable\n' +
          '4. Run analysis and share the result\n' +
          '5. Copy the FeatureServer URL to VITE_TAPESTRY_LAYER_URL'
        )
        addFallbackLayer(map, demographicsOpacity)
      }
    }

    // Helper function to add fallback demographics layer
    function addFallbackLayer(map: Map, opacity: number) {
      const fallbackLayer = new FeatureLayer({
        url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_Population_by_Race_and_Hispanic_Origin_Boundaries/FeatureServer/2',
        title: 'Demographics (Census Tracts)',
        opacity: opacity,
        visible: true,
        outFields: ['*'],
        popupTemplate: {
          title: 'Census Tract: {NAME}',
          content: [
            {
              type: 'fields',
              fieldInfos: [
                { fieldName: 'B03002_001E', label: 'Total Population' },
                { fieldName: 'B03002_003E', label: 'White (Non-Hispanic)' },
                { fieldName: 'B03002_004E', label: 'Black or African American' },
                { fieldName: 'B03002_006E', label: 'Asian' },
                { fieldName: 'B03002_012E', label: 'Hispanic or Latino' },
              ],
            },
          ],
        },
      })

      fallbackLayer.when(
        () => console.log('Fallback demographics layer loaded'),
        (err: Error) => console.error('Fallback layer failed:', err.message)
      )

      map.add(fallbackLayer)
    }

    // Create stores graphics layer (on top of Tapestry layer)
    const storesLayer = new GraphicsLayer({
      title: 'Store Locations',
    })
    map.add(storesLayer)
    storesLayerRef.current = storesLayer

    // Add widgets when view is ready
    view.when(() => {
      setIsLoaded(true)
      onMapReady?.()

      // Search widget
      if (showSearch) {
        const searchWidget = new Search({
          view: view,
          popupEnabled: true,
          resultGraphicEnabled: true,
        })
        view.ui.add(searchWidget, 'top-right')
      }

      // Locate widget (current location)
      if (showLocate) {
        const locateWidget = new Locate({
          view: view,
        })
        view.ui.add(locateWidget, 'top-left')
      }

      // Home widget
      if (showHome) {
        const homeWidget = new Home({
          view: view,
        })
        view.ui.add(homeWidget, 'top-left')
      }

      // Measurement widget
      if (showMeasurement) {
        const measurement = new Measurement({
          view: view,
          activeTool: undefined,
        })
        const measurementExpand = new Expand({
          view: view,
          content: measurement,
          expandIcon: 'measure',
          expandTooltip: 'Measurement',
          group: 'top-right',
        })
        view.ui.add(measurementExpand, 'top-left')
      }

      // Basemap gallery
      if (showBasemapGallery) {
        const basemapGallery = new BasemapGallery({
          view: view,
          source: {
            query: {
              title: '"World Basemaps for Developers" AND owner:esri',
            },
          },
        })
        const bgExpand = new Expand({
          view: view,
          content: basemapGallery,
          expandIcon: 'basemap',
          expandTooltip: 'Basemap Gallery',
          group: 'bottom-right',
        })
        view.ui.add(bgExpand, 'bottom-right')
      }

      // Layer list
      if (showLayerList) {
        const layerList = new LayerList({
          view: view,
        })
        const llExpand = new Expand({
          view: view,
          content: layerList,
          expandIcon: 'layers',
          expandTooltip: 'Layer List',
          group: 'bottom-right',
        })
        view.ui.add(llExpand, 'bottom-right')
      }

      // Legend
      if (showLegend) {
        const legend = new Legend({
          view: view,
        })
        const legendExpand = new Expand({
          view: view,
          content: legend,
          expandIcon: 'legend',
          expandTooltip: 'Legend',
          group: 'bottom-right',
        })
        view.ui.add(legendExpand, 'bottom-right')
      }

      // Scale bar
      if (showScaleBar) {
        const scaleBar = new ScaleBar({
          view: view,
          unit: 'dual', // shows both metric and non-metric
        })
        view.ui.add(scaleBar, 'bottom-left')
      }

      viewRef.current = view
    })

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [])

  // Update stores on map when stores prop changes
  useEffect(() => {
    if (!storesLayerRef.current || !viewRef.current) return

    // Clear existing graphics
    storesLayerRef.current.removeAll()

    // Add store markers
    stores.forEach((store) => {
      // Generate pseudo-random coordinates based on store name
      // In production, you'd use actual coordinates from store data
      const seed = store.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
      const lng = center[0] + ((seed % 100) - 50) / 500
      const lat = center[1] + ((seed % 77) - 38) / 500

      const point = new Point({
        longitude: store.longitude || lng,
        latitude: store.latitude || lat,
      })

      const isSelected = selectedStore?.id === store.id

      const markerSymbol = {
        type: 'simple-marker',
        style: 'circle',
        color: isSelected ? [59, 130, 246, 0.9] : [239, 68, 68, 0.9], // blue if selected, red otherwise
        size: isSelected ? '16px' : '12px',
        outline: {
          color: [255, 255, 255],
          width: 2,
        },
      }

      const popupTemplate = {
        title: store.name,
        content: [
          {
            type: 'fields',
            fieldInfos: [
              { fieldName: 'segments', label: 'Segments' },
              { fieldName: 'topSegment', label: 'Top Segment' },
              { fieldName: 'topSegmentShare', label: 'Share' },
            ],
          },
        ],
      }

      const topSegment = store.segments.sort((a, b) => b.householdShare - a.householdShare)[0]

      const graphic = new Graphic({
        geometry: point,
        symbol: markerSymbol as any,
        attributes: {
          id: store.id,
          name: store.name,
          segments: store.segments.length,
          topSegment: topSegment?.name || 'N/A',
          topSegmentShare: topSegment ? `${topSegment.householdShare.toFixed(1)}%` : 'N/A',
        },
        popupTemplate,
      })

      storesLayerRef.current?.add(graphic)
    })

    // Handle click on store markers
    if (onStoreSelect && viewRef.current) {
      viewRef.current.on('click', async (event) => {
        const response = await viewRef.current!.hitTest(event)
        const result = response.results.find(
          (r) => r.type === 'graphic' && r.graphic.layer === storesLayerRef.current
        )
        if (result && result.type === 'graphic') {
          const storeId = result.graphic.attributes?.id
          const store = stores.find((s) => s.id === storeId)
          if (store) {
            onStoreSelect(store)
          }
        }
      })
    }
  }, [stores, selectedStore, center, onStoreSelect])

  // Center on selected store
  useEffect(() => {
    if (!selectedStore || !viewRef.current) return

    const seed = selectedStore.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    const lng = selectedStore.longitude || center[0] + ((seed % 100) - 50) / 500
    const lat = selectedStore.latitude || center[1] + ((seed % 77) - 38) / 500

    viewRef.current.goTo(
      {
        center: [lng, lat],
        zoom: 14,
      },
      {
        duration: 500,
        easing: 'ease-in-out',
      }
    )
  }, [selectedStore, center])

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapDiv} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading map...
          </div>
        </div>
      )}
    </div>
  )
})
