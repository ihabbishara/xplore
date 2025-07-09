import { apiClient } from '@/lib/api/client'
import {
  WeatherData,
  WeatherRangeSummary,
  ClimateData,
  WeatherComparison,
  WeatherActivityRecommendation,
  WeatherPreferences,
  WeatherAlert
} from '../types/weather.types'

class WeatherService {
  private baseUrl = '/weather'

  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
    const response = await apiClient.get(`${this.baseUrl}/current`, {
      params: { latitude, longitude }
    })
    return response.data.data
  }

  async getWeatherForecast(
    latitude: number,
    longitude: number,
    days: number = 14
  ): Promise<WeatherRangeSummary> {
    const response = await apiClient.get(`${this.baseUrl}/forecast`, {
      params: { latitude, longitude, days }
    })
    return response.data.data
  }

  async getHistoricalClimate(
    latitude: number,
    longitude: number,
    locationId?: string
  ): Promise<ClimateData[]> {
    const response = await apiClient.get(`${this.baseUrl}/climate`, {
      params: { latitude, longitude, locationId }
    })
    return response.data.data
  }

  async compareLocations(
    locations: Array<{ id: string; name: string; latitude: number; longitude: number }>,
    startDate?: Date,
    endDate?: Date
  ): Promise<WeatherComparison[]> {
    const response = await apiClient.post(`${this.baseUrl}/compare`, {
      locations,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    })
    return response.data.data
  }

  async getWeatherActivities(
    latitude: number,
    longitude: number,
    forecastDays?: number
  ): Promise<WeatherActivityRecommendation[]> {
    const response = await apiClient.get(`${this.baseUrl}/activities`, {
      params: { latitude, longitude, forecastDays }
    })
    return response.data.data
  }

  async getWeatherAlerts(latitude: number, longitude: number): Promise<WeatherAlert[]> {
    const response = await apiClient.get(`${this.baseUrl}/alerts`, {
      params: { latitude, longitude }
    })
    return response.data.data
  }

  async getUserPreferences(): Promise<WeatherPreferences> {
    const response = await apiClient.get(`${this.baseUrl}/preferences`)
    return response.data.data
  }

  async updateUserPreferences(preferences: Partial<WeatherPreferences>): Promise<WeatherPreferences> {
    const response = await apiClient.put(`${this.baseUrl}/preferences`, preferences)
    return response.data.data
  }

  async getCacheMetrics(): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/cache/metrics`)
    return response.data.data
  }

  async invalidateCache(latitude?: number, longitude?: number): Promise<void> {
    await apiClient.post(`${this.baseUrl}/cache/invalidate`, {
      latitude,
      longitude
    })
  }

  // Helper methods for common use cases

  async getLocationWeatherSummary(
    locationId: string,
    latitude: number,
    longitude: number
  ): Promise<{
    current: WeatherData
    forecast: WeatherRangeSummary
    climate: ClimateData[]
    activities: WeatherActivityRecommendation[]
  }> {
    const [current, forecast, climate, activities] = await Promise.all([
      this.getCurrentWeather(latitude, longitude),
      this.getWeatherForecast(latitude, longitude, 7),
      this.getHistoricalClimate(latitude, longitude, locationId),
      this.getWeatherActivities(latitude, longitude)
    ])

    return { current, forecast, climate, activities }
  }

  async getTripWeatherForecast(
    destinations: Array<{
      id: string
      name: string
      latitude: number
      longitude: number
      startDate: Date
      endDate: Date
    }>
  ): Promise<Map<string, WeatherRangeSummary>> {
    const weatherMap = new Map<string, WeatherRangeSummary>()

    const promises = destinations.map(async (dest) => {
      const days = Math.ceil(
        (dest.endDate.getTime() - dest.startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      const forecast = await this.getWeatherForecast(
        dest.latitude,
        dest.longitude,
        Math.min(days + 1, 14)
      )
      weatherMap.set(dest.id, forecast)
    })

    await Promise.all(promises)
    return weatherMap
  }

  formatTemperature(temp: number, unit: 'C' | 'F' = 'C'): string {
    if (unit === 'F') {
      return `${Math.round(temp * 9/5 + 32)}°F`
    }
    return `${Math.round(temp)}°C`
  }

  formatWindSpeed(speed: number, unit: 'kmh' | 'mph' = 'kmh'): string {
    if (unit === 'mph') {
      return `${Math.round(speed / 1.60934)} mph`
    }
    return `${Math.round(speed)} km/h`
  }

  getWeatherIconUrl(icon: string, size: '1x' | '2x' | '4x' = '2x'): string {
    // OpenWeatherMap icon format
    if (icon.match(/^\d{2}[dn]$/)) {
      return `https://openweathermap.org/img/wn/${icon}@${size}.png`
    }
    
    // WeatherAPI icon format
    if (icon.startsWith('//cdn.weatherapi.com')) {
      return `https:${icon}`
    }
    
    return icon
  }

  getConditionEmoji(condition: string): string {
    const conditionLower = condition.toLowerCase()
    
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      return '☀️'
    } else if (conditionLower.includes('cloud')) {
      return '☁️'
    } else if (conditionLower.includes('rain')) {
      return '🌧️'
    } else if (conditionLower.includes('snow')) {
      return '❄️'
    } else if (conditionLower.includes('storm') || conditionLower.includes('thunder')) {
      return '⛈️'
    } else if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
      return '🌫️'
    }
    
    return '🌤️'
  }
}

export const weatherService = new WeatherService()