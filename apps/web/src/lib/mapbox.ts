import mapboxgl from 'mapbox-gl'

// Set your Mapbox access token here
// In production, this should come from environment variables
export const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'your-mapbox-access-token'

// Initialize Mapbox
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

// Default map configuration
export const DEFAULT_MAP_CONFIG = {
  style: 'mapbox://styles/mapbox/outdoors-v12',
  center: [0, 0] as [number, number],
  zoom: 2,
  pitch: 0,
  bearing: 0
}

// Wildlife-specific map styles
export const WILDLIFE_MAP_STYLES = {
  default: 'mapbox://styles/mapbox/outdoors-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  terrain: 'mapbox://styles/mapbox/outdoors-v12',
  dark: 'mapbox://styles/mapbox/dark-v11'
}

// Common map options
export const MAP_OPTIONS = {
  attributionControl: false,
  logoPosition: 'bottom-left' as const,
  maxZoom: 18,
  minZoom: 2
}

// Wildlife layer configurations
export const WILDLIFE_LAYERS = {
  sightings: {
    id: 'wildlife-sightings',
    type: 'circle' as const,
    paint: {
      'circle-radius': 8,
      'circle-color': '#22c55e',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  },
  heatmap: {
    id: 'wildlife-heatmap',
    type: 'heatmap' as const,
    paint: {
      'heatmap-weight': 1,
      'heatmap-intensity': 1,
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(236,222,239,0)',
        0.2, 'rgb(208,209,230)',
        0.4, 'rgb(166,189,219)',
        0.6, 'rgb(103,169,207)',
        0.8, 'rgb(54,144,192)',
        1, 'rgb(2,129,138)'
      ],
      'heatmap-radius': 30,
      'heatmap-opacity': 0.7
    }
  },
  migration: {
    id: 'wildlife-migration',
    type: 'line' as const,
    paint: {
      'line-color': '#3b82f6',
      'line-width': 3,
      'line-opacity': 0.8,
      'line-dasharray': [2, 1]
    }
  }
}

export default mapboxgl