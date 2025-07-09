import React from 'react'
import { weatherService } from '../services/weatherService'
import { WeatherData } from '../types/weather.types'

interface WeatherWidgetProps {
  weather: WeatherData
  size?: 'small' | 'medium' | 'large'
  showDetails?: boolean
  unit?: 'C' | 'F'
  className?: string
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  weather,
  size = 'medium',
  showDetails = false,
  unit = 'C',
  className = ''
}) => {
  const sizeClasses = {
    small: 'p-2 text-sm',
    medium: 'p-4',
    large: 'p-6 text-lg'
  }

  const iconSizes = {
    small: '1x',
    medium: '2x',
    large: '4x'
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${sizeClasses[size]} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={weatherService.getWeatherIconUrl(weather.icon, iconSizes[size] as any)}
            alt={weather.condition}
            className={size === 'small' ? 'w-10 h-10' : size === 'large' ? 'w-20 h-20' : 'w-16 h-16'}
          />
          <div>
            <div className={`font-semibold ${size === 'large' ? 'text-3xl' : size === 'small' ? 'text-lg' : 'text-2xl'}`}>
              {weatherService.formatTemperature(weather.temp, unit)}
            </div>
            <div className={`text-gray-600 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
              {weather.condition}
            </div>
          </div>
        </div>
        
        {showDetails && size !== 'small' && (
          <div className="text-right space-y-1">
            <div className="text-sm text-gray-600">
              Feels like {weatherService.formatTemperature(weather.feelsLike, unit)}
            </div>
            <div className="text-sm text-gray-600">
              Wind: {weatherService.formatWindSpeed(weather.windSpeed)}
            </div>
            <div className="text-sm text-gray-600">
              Humidity: {weather.humidity}%
            </div>
          </div>
        )}
      </div>

      {showDetails && size === 'large' && (
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Min/Max</div>
            <div className="font-medium">
              {weatherService.formatTemperature(weather.tempMin, unit)} / {weatherService.formatTemperature(weather.tempMax, unit)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">UV Index</div>
            <div className="font-medium">{weather.uvIndex || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Pressure</div>
            <div className="font-medium">{weather.pressure} hPa</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Visibility</div>
            <div className="font-medium">{(weather.visibility / 1000).toFixed(1)} km</div>
          </div>
        </div>
      )}
    </div>
  )
}