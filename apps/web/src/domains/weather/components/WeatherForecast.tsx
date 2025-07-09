import React from 'react'
import { weatherService } from '../services/weatherService'
import { WeatherRangeSummary, DailyWeather } from '../types/weather.types'

interface WeatherForecastProps {
  forecast: WeatherRangeSummary
  daysToShow?: number
  unit?: 'C' | 'F'
  className?: string
}

const DayForecast: React.FC<{ day: DailyWeather; unit: 'C' | 'F' }> = ({ day, unit }) => {
  const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })
  const date = new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="flex flex-col items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="text-sm font-medium text-gray-900">{dayName}</div>
      <div className="text-xs text-gray-500">{date}</div>
      
      <img
        src={weatherService.getWeatherIconUrl(day.icon, '2x')}
        alt={day.condition}
        className="w-12 h-12 my-2"
      />
      
      <div className="text-sm font-semibold">
        {weatherService.formatTemperature(day.temp.max, unit)}
      </div>
      <div className="text-sm text-gray-500">
        {weatherService.formatTemperature(day.temp.min, unit)}
      </div>
      
      {day.precipitationProbability !== undefined && day.precipitationProbability > 0 && (
        <div className="text-xs text-blue-600 mt-1">
          {Math.round(day.precipitationProbability)}% 💧
        </div>
      )}
    </div>
  )
}

export const WeatherForecast: React.FC<WeatherForecastProps> = ({
  forecast,
  daysToShow = 7,
  unit = 'C',
  className = ''
}) => {
  const daysToDisplay = forecast.daily.slice(0, daysToShow)

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Weather Forecast</h3>
        <p className="text-sm text-gray-600 mt-1">{forecast.summary}</p>
      </div>

      {forecast.alerts && forecast.alerts.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-semibold text-red-800 mb-1">Weather Alerts</h4>
          {forecast.alerts.map((alert, index) => (
            <div key={alert.id || index} className="text-sm text-red-700">
              <span className="font-medium">{alert.event}</span>
              {alert.severity === 'extreme' && ' ⚠️'}
              {alert.severity === 'severe' && ' ⚠️'}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1">
        {daysToDisplay.map((day, index) => (
          <DayForecast key={index} day={day} unit={unit} />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Avg Temperature</div>
          <div className="font-medium">
            {weatherService.formatTemperature(forecast.averageTemp, unit)}
          </div>
        </div>
        <div>
          <div className="text-gray-500">Rain Chance</div>
          <div className="font-medium">{Math.round(forecast.rainProbability)}%</div>
        </div>
        <div>
          <div className="text-gray-500">Humidity</div>
          <div className="font-medium">{Math.round(forecast.humidity)}%</div>
        </div>
        <div>
          <div className="text-gray-500">UV Index</div>
          <div className="font-medium">{forecast.uvIndex.toFixed(1)}</div>
        </div>
      </div>
    </div>
  )
}