'use client'

import React, { useRef, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, Text, Button, Badge } from '@/components/ui'
import { Map, Layers, Navigation, Eye, MapPin } from 'lucide-react'
import { DEFAULT_MAP_CONFIG, WILDLIFE_MAP_STYLES, MAP_OPTIONS, WILDLIFE_LAYERS } from '@/lib/mapbox'
import { useWildlifeStore } from '@/domains/wildlife/hooks/useWildlifeStore'

let mapboxgl: any;
if (typeof window !== 'undefined') {
  mapboxgl = require('mapbox-gl');
}

export function MapboxMapWidget() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [activeLayer, setActiveLayer] = useState<'sightings' | 'heatmap' | 'migration'>('sightings')
  
  const { sightings, loadSightings } = useWildlifeStore()
  
  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxgl) return
    
    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      ...DEFAULT_MAP_CONFIG,
      ...MAP_OPTIONS
    })
    
    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    
    // Handle map load
    map.current.on('load', () => {
      setMapLoaded(true)
      loadSightings()
      
      // Add wildlife sightings source
      map.current!.addSource('wildlife-sightings', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      })
      
      // Add sightings layer
      map.current!.addLayer({
        ...WILDLIFE_LAYERS.sightings,
        source: 'wildlife-sightings'
      })
    })
    
    return () => {
      map.current?.remove()
    }
  }, [loadSightings])
  
  // Update sightings data
  useEffect(() => {
    if (!map.current || !mapLoaded || !sightings.length) return
    
    const features = sightings.map(sighting => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [sighting.location.lng, sighting.location.lat]
      },
      properties: {
        id: sighting.id,
        species: sighting.species,
        timestamp: sighting.timestamp,
        verified: sighting.verificationStatus === 'verified' || sighting.verificationStatus === 'expert_verified'
      }
    }))
    
    const source = map.current.getSource('wildlife-sightings')
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features
      })
    }
  }, [sightings, mapLoaded])
  
  const toggleLayer = (layer: 'sightings' | 'heatmap' | 'migration') => {
    if (!map.current) return
    
    // Hide all layers
    ['wildlife-sightings', 'wildlife-heatmap', 'wildlife-migration'].forEach(layerId => {
      if (map.current!.getLayer(layerId)) {
        map.current!.setLayoutProperty(layerId, 'visibility', 'none')
      }
    })
    
    // Show selected layer
    const layerMap = {
      sightings: 'wildlife-sightings',
      heatmap: 'wildlife-heatmap',
      migration: 'wildlife-migration'
    }
    
    if (map.current.getLayer(layerMap[layer])) {
      map.current.setLayoutProperty(layerMap[layer], 'visibility', 'visible')
    }
    
    setActiveLayer(layer)
  }
  
  const flyToUserLocation = () => {
    if (!map.current) return
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.current!.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 12,
          duration: 2000
        })
        
        // Add user marker
        new (mapboxgl as any).Marker({ color: '#3b82f6' })
          .setLngLat([position.coords.longitude, position.coords.latitude])
          .addTo(map.current!)
      },
      (error) => {
        console.error('Error getting location:', error)
      }
    )
  }
  
  return (
    <Card className="h-full">
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Map className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <Text variant="h5">Wildlife Map</Text>
              <Text variant="body-small" color="secondary">
                {sightings.length} recent sightings
              </Text>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={flyToUserLocation}
              className="gap-2"
            >
              <Navigation className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <Layers className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Layer Toggle */}
        <div className="flex gap-2 mb-4">
          <Badge
            variant={activeLayer === 'sightings' ? 'secondary' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleLayer('sightings')}
          >
            <Eye className="h-3 w-3 mr-1" />
            Sightings
          </Badge>
          <Badge
            variant={activeLayer === 'heatmap' ? 'secondary' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleLayer('heatmap')}
          >
            <MapPin className="h-3 w-3 mr-1" />
            Density
          </Badge>
          <Badge
            variant={activeLayer === 'migration' ? 'secondary' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleLayer('migration')}
          >
            <Navigation className="h-3 w-3 mr-1" />
            Migration
          </Badge>
        </div>
        
        {/* Map Container */}
        <div className="flex-1 rounded-lg overflow-hidden relative">
          <div ref={mapContainer} className="w-full h-full min-h-[400px]" />
          
          {!mapLoaded && (
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <Text className="text-sm text-gray-600">Loading map...</Text>
              </div>
            </div>
          )}
        </div>
        
        {/* Map Legend */}
        <div className="mt-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <Text className="text-gray-600">Verified</Text>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <Text className="text-gray-600">Pending</Text>
            </div>
          </div>
          <Text className="text-gray-500">
            Click markers for details
          </Text>
        </div>
      </div>
    </Card>
  )
}