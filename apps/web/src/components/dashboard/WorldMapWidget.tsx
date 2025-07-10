'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, Text, Badge } from '@/components/ui'

// Mock data for saved locations
const savedLocations = [
  { name: 'Paris, France', lat: 48.8566, lng: 2.3522, type: 'wishlist', color: 'bg-primary-500' },
  { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, type: 'visited', color: 'bg-success-500' },
  { name: 'New York, USA', lat: 40.7128, lng: -74.0060, type: 'planned', color: 'bg-warning' },
  { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093, type: 'wishlist', color: 'bg-primary-500' },
  { name: 'London, UK', lat: 51.5074, lng: -0.1278, type: 'visited', color: 'bg-success-500' },
]

export function WorldMapWidget() {
  return (
    <Card className="h-[400px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your World Map</CardTitle>
            <Text variant="body-small" color="secondary">
              {savedLocations.length} locations saved
            </Text>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="success" size="sm">
              {savedLocations.filter(l => l.type === 'visited').length} Visited
            </Badge>
            <Badge variant="warning" size="sm">
              {savedLocations.filter(l => l.type === 'planned').length} Planned
            </Badge>
            <Badge variant="default" size="sm">
              {savedLocations.filter(l => l.type === 'wishlist').length} Wishlist
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Map Placeholder */}
        <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg overflow-hidden">
          {/* World Map SVG Placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              viewBox="0 0 800 400"
              className="w-full h-full opacity-20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Simplified world map outline */}
              <path
                d="M150 150 L250 120 L350 140 L450 130 L550 150 L650 140 L650 200 L600 250 L500 270 L400 260 L300 250 L200 240 L150 220 Z"
                fill="currentColor"
                className="text-blue-200 dark:text-blue-700"
              />
              <path
                d="M100 200 L180 180 L250 190 L300 200 L350 190 L400 200 L450 190 L500 200 L550 190 L600 200 L650 190 L700 200 L700 300 L650 320 L600 310 L550 320 L500 310 L450 320 L400 310 L350 320 L300 310 L250 320 L200 310 L150 320 L100 310 Z"
                fill="currentColor"
                className="text-blue-200 dark:text-blue-700"
              />
            </svg>
          </div>

          {/* Location Pins */}
          {savedLocations.map((location, index) => (
            <div
              key={location.name}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{
                left: `${((location.lng + 180) / 360) * 100}%`,
                top: `${((90 - location.lat) / 180) * 100}%`,
              }}
            >
              <div className={`w-3 h-3 rounded-full ${location.color} animate-ping`} />
              <div className={`absolute inset-0 w-3 h-3 rounded-full ${location.color}`} />
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {location.name}
              </div>
            </div>
          ))}

          {/* Interactive Controls */}
          <div className="absolute top-4 right-4 space-y-2">
            <button className="w-8 h-8 bg-white dark:bg-gray-800 rounded shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button className="w-8 h-8 bg-white dark:bg-gray-800 rounded shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* View Options */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 transition-colors">
              Satellite
            </button>
            <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors">
              Street
            </button>
          </div>
          <button className="text-sm text-primary hover:text-primary-600 font-medium">
            View Full Map →
          </button>
        </div>
      </CardContent>
    </Card>
  )
}