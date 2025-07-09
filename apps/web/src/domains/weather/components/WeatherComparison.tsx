import React from 'react'
import { weatherService } from '../services/weatherService'
import { WeatherComparison as WeatherComparisonType } from '../types/weather.types'

interface WeatherComparisonProps {
  comparisons: WeatherComparisonType[]
  unit?: 'C' | 'F'
  onLocationClick?: (locationId: string) => void
  className?: string
}

export const WeatherComparison: React.FC<WeatherComparisonProps> = ({
  comparisons,
  unit = 'C',
  onLocationClick,
  className = ''
}) => {
  const sortedComparisons = [...comparisons].sort((a, b) => b.score - a.score)

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Weather Comparison</h3>
        <p className="text-sm text-gray-600 mt-1">
          Locations ranked by weather compatibility
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {sortedComparisons.map((comparison, index) => (
          <div
            key={comparison.locationId}
            className={`p-4 hover:bg-gray-50 transition-colors ${
              onLocationClick ? 'cursor-pointer' : ''
            }`}
            onClick={() => onLocationClick?.(comparison.locationId)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold text-gray-400">
                    #{index + 1}
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {comparison.locationName}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-600">
                        {weatherService.formatTemperature(comparison.currentWeather.temp, unit)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {comparison.currentWeather.condition}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium text-gray-700">Score:</div>
                    <div className={`text-lg font-bold ${
                      comparison.score >= 80 ? 'text-green-600' :
                      comparison.score >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {comparison.score}%
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    Avg: {weatherService.formatTemperature(comparison.forecast.averageTemp, unit)}
                  </div>
                  
                  {comparison.forecast.rainProbability > 0 && (
                    <div className="text-sm text-blue-600">
                      💧 {Math.round(comparison.forecast.rainProbability)}%
                    </div>
                  )}
                </div>

                {comparison.pros.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-green-700">Pros:</div>
                    <div className="text-xs text-green-600">
                      {comparison.pros.slice(0, 2).join(' • ')}
                    </div>
                  </div>
                )}

                {comparison.cons.length > 0 && (
                  <div className="mt-1">
                    <div className="text-xs font-medium text-red-700">Cons:</div>
                    <div className="text-xs text-red-600">
                      {comparison.cons.slice(0, 2).join(' • ')}
                    </div>
                  </div>
                )}
              </div>

              <div className="ml-4 flex-shrink-0">
                <img
                  src={weatherService.getWeatherIconUrl(comparison.currentWeather.icon, '2x')}
                  alt={comparison.currentWeather.condition}
                  className="w-16 h-16"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}