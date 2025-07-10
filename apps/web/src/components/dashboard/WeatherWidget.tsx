'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Text, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

interface WeatherData {
  location: string
  temperature: number
  condition: string
  icon: string
  humidity: number
  windSpeed: number
  forecast: {
    day: string
    high: number
    low: number
    condition: string
    icon: string
  }[]
}

// Mock weather data
const weatherData: WeatherData = {
  location: 'New York, NY',
  temperature: 22,
  condition: 'Partly Cloudy',
  icon: '⛅',
  humidity: 65,
  windSpeed: 12,
  forecast: [
    { day: 'Today', high: 24, low: 18, condition: 'Partly Cloudy', icon: '⛅' },
    { day: 'Tomorrow', high: 26, low: 20, condition: 'Sunny', icon: '☀️' },
    { day: 'Wednesday', high: 23, low: 17, condition: 'Rainy', icon: '🌧️' },
    { day: 'Thursday', high: 25, low: 19, condition: 'Sunny', icon: '☀️' },
    { day: 'Friday', high: 27, low: 21, condition: 'Partly Cloudy', icon: '⛅' },
  ]
}

const watchedLocations = [
  'New York, NY',
  'Paris, France',
  'Tokyo, Japan',
  'Sydney, Australia'
]

export function WeatherWidget() {
  const [selectedLocation, setSelectedLocation] = useState(watchedLocations[0])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weather</CardTitle>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="text-sm border border-border rounded-md px-2 py-1 bg-background"
          >
            {watchedLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Weather */}
        <div className="flex items-center space-x-4">
          <div className="text-6xl">{weatherData.icon}</div>
          <div className="flex-1">
            <Text variant="h2" className="mb-1">
              {weatherData.temperature}°C
            </Text>
            <Text variant="body" color="secondary" className="mb-2">
              {weatherData.condition}
            </Text>
            <Text variant="body-small" color="secondary">
              {weatherData.location}
            </Text>
          </div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 11.172V5l-1-1z" />
            </svg>
            <div>
              <Text variant="body-small" color="secondary">Humidity</Text>
              <Text variant="body-small" weight="medium">{weatherData.humidity}%</Text>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4H5a1 1 0 00-1 1v10a1 1 0 001 1h14a1 1 0 001-1V5a1 1 0 00-1-1h-2M7 8h10" />
            </svg>
            <div>
              <Text variant="body-small" color="secondary">Wind</Text>
              <Text variant="body-small" weight="medium">{weatherData.windSpeed} km/h</Text>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div>
          <Text variant="h6" className="mb-3">5-Day Forecast</Text>
          <div className="space-y-2">
            {weatherData.forecast.map((day, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{day.icon}</span>
                  <div>
                    <Text variant="body-small" weight="medium">{day.day}</Text>
                    <Text variant="caption" color="secondary">{day.condition}</Text>
                  </div>
                </div>
                <div className="text-right">
                  <Text variant="body-small" weight="medium">{day.high}°</Text>
                  <Text variant="caption" color="secondary">{day.low}°</Text>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Alerts */}
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <Text variant="body-small" className="text-amber-800 dark:text-amber-200">
              Rain expected Wednesday afternoon
            </Text>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}