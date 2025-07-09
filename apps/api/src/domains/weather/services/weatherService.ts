import axios from 'axios'
import { redis } from '../../../lib/redis'
import { prisma } from '../../../lib/prisma'
import {
  WeatherData,
  DailyWeather,
  HourlyWeather,
  WeatherRangeSummary,
  WeatherAlert,
  ClimateData,
  WeatherPreferences,
  WeatherComparison,
  WeatherActivityRecommendation,
  WeatherProvider
} from '../types/weather.types'

export class WeatherService {
  private providers: WeatherProvider[] = [
    {
      name: 'openweather',
      enabled: !!process.env.OPENWEATHER_API_KEY,
      apiKey: process.env.OPENWEATHER_API_KEY,
      priority: 1,
      rateLimit: { requests: 60, windowMs: 60000 },
      failureCount: 0
    },
    {
      name: 'accuweather',
      enabled: !!process.env.ACCUWEATHER_API_KEY,
      apiKey: process.env.ACCUWEATHER_API_KEY,
      priority: 2,
      rateLimit: { requests: 50, windowMs: 86400000 },
      failureCount: 0
    },
    {
      name: 'weatherapi',
      enabled: !!process.env.WEATHERAPI_KEY,
      apiKey: process.env.WEATHERAPI_KEY,
      priority: 3,
      rateLimit: { requests: 1000000, windowMs: 2592000000 },
      failureCount: 0
    }
  ]

  private readonly CACHE_TTL = {
    current: 900, // 15 minutes
    forecast: 3600, // 1 hour
    climate: 86400, // 24 hours
    alerts: 300 // 5 minutes
  }

  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
    const cacheKey = `weather:current:${latitude.toFixed(4)}:${longitude.toFixed(4)}`
    
    // Check cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    let weatherData: WeatherData | null = null
    let lastError: Error | null = null

    // Try each provider in order of priority
    for (const provider of this.getActiveProviders()) {
      try {
        weatherData = await this.fetchCurrentWeather(provider, latitude, longitude)
        
        if (weatherData) {
          // Cache the result
          await redis.setEx(cacheKey, this.CACHE_TTL.current, JSON.stringify(weatherData))
          
          // Store in database for analytics
          await this.storeWeatherData(latitude, longitude, weatherData, provider.name)
          
          // Reset failure count on success
          provider.failureCount = 0
          
          break
        }
      } catch (error) {
        console.error(`Weather provider ${provider.name} failed:`, error)
        lastError = error as Error
        provider.failureCount++
        provider.lastUsed = new Date()
      }
    }

    if (!weatherData) {
      throw lastError || new Error('All weather providers failed')
    }

    return weatherData
  }

  async getWeatherForecast(
    latitude: number,
    longitude: number,
    days: number = 14
  ): Promise<WeatherRangeSummary> {
    const cacheKey = `weather:forecast:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${days}`
    
    // Check cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    let forecast: WeatherRangeSummary | null = null
    let lastError: Error | null = null

    // Try each provider
    for (const provider of this.getActiveProviders()) {
      try {
        forecast = await this.fetchWeatherForecast(provider, latitude, longitude, days)
        
        if (forecast) {
          // Get weather alerts
          const alerts = await this.fetchWeatherAlerts(provider, latitude, longitude)
          if (alerts.length > 0) {
            forecast.alerts = alerts
          }

          // Cache the result
          await redis.setEx(cacheKey, this.CACHE_TTL.forecast, JSON.stringify(forecast))
          
          // Store forecast summary
          await this.storeForecastData(latitude, longitude, forecast, provider.name)
          
          provider.failureCount = 0
          break
        }
      } catch (error) {
        console.error(`Weather forecast from ${provider.name} failed:`, error)
        lastError = error as Error
        provider.failureCount++
      }
    }

    if (!forecast) {
      throw lastError || new Error('All weather providers failed')
    }

    return forecast
  }

  async getHistoricalClimate(
    latitude: number,
    longitude: number,
    locationId?: string
  ): Promise<ClimateData[]> {
    const cacheKey = `weather:climate:${latitude.toFixed(4)}:${longitude.toFixed(4)}`
    
    // Check cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    // Check database for stored climate data
    if (locationId) {
      const storedClimate = await prisma.historicalClimateData.findMany({
        where: { locationId },
        orderBy: { month: 'asc' }
      })

      if (storedClimate.length === 12) {
        const climateData = storedClimate.map(this.mapDbClimateToType)
        await redis.setEx(cacheKey, this.CACHE_TTL.climate, JSON.stringify(climateData))
        return climateData
      }
    }

    // Fetch from weather provider or use synthetic data
    const climateData = await this.generateClimateData(latitude, longitude, locationId)
    
    // Cache the result
    await redis.setEx(cacheKey, this.CACHE_TTL.climate, JSON.stringify(climateData))
    
    return climateData
  }

  async compareWeatherLocations(
    locations: Array<{ id: string; name: string; latitude: number; longitude: number }>,
    startDate?: Date,
    endDate?: Date
  ): Promise<WeatherComparison[]> {
    const comparisons: WeatherComparison[] = []

    // Fetch weather data for all locations in parallel
    const weatherPromises = locations.map(async (location) => {
      try {
        const [currentWeather, forecast, climateData] = await Promise.all([
          this.getCurrentWeather(location.latitude, location.longitude),
          this.getWeatherForecast(location.latitude, location.longitude, 14),
          this.getHistoricalClimate(location.latitude, location.longitude, location.id)
        ])

        const score = await this.calculateWeatherScore(forecast, climateData)
        const analysis = this.analyzeWeather(currentWeather, forecast, climateData)

        return {
          locationId: location.id,
          locationName: location.name,
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude
          },
          currentWeather,
          forecast,
          climateData,
          score,
          pros: analysis.pros,
          cons: analysis.cons
        }
      } catch (error) {
        console.error(`Failed to get weather for ${location.name}:`, error)
        return null
      }
    })

    const results = await Promise.all(weatherPromises)
    return results.filter((r): r is WeatherComparison => r !== null)
  }

  async getWeatherActivities(
    weatherData: WeatherData | WeatherRangeSummary
  ): Promise<WeatherActivityRecommendation[]> {
    const recommendations: WeatherActivityRecommendation[] = []

    // Analyze current or average conditions
    const conditions = 'daily' in weatherData 
      ? this.getAverageConditions(weatherData)
      : weatherData

    // Outdoor activities
    if (conditions.temp >= 15 && conditions.temp <= 28 && 
        conditions.precipitation === 0 && conditions.windSpeed < 20) {
      recommendations.push({
        activity: 'Hiking',
        category: 'outdoor',
        suitability: 95,
        reason: 'Perfect weather for outdoor exploration',
        alternativeActivities: ['Walking', 'Cycling', 'Photography']
      })
    }

    if (conditions.temp >= 22 && conditions.temp <= 32 && 
        conditions.precipitation === 0) {
      recommendations.push({
        activity: 'Beach Visit',
        category: 'outdoor',
        suitability: 90,
        reason: 'Warm and sunny, ideal for beach activities',
        alternativeActivities: ['Swimming', 'Sunbathing', 'Beach Sports']
      })
    }

    // Indoor activities for poor weather
    if (conditions.precipitation && conditions.precipitation > 5 || 
        conditions.temp < 5 || conditions.temp > 35) {
      recommendations.push({
        activity: 'Museum Visit',
        category: 'indoor',
        suitability: 100,
        reason: 'Stay comfortable indoors while exploring culture',
        alternativeActivities: ['Gallery', 'Theater', 'Shopping']
      })
    }

    // Sports activities
    if (conditions.temp >= 10 && conditions.temp <= 20 && 
        conditions.windSpeed < 15 && !conditions.precipitation) {
      recommendations.push({
        activity: 'Running',
        category: 'sports',
        suitability: 95,
        reason: 'Cool temperature perfect for cardio activities',
        alternativeActivities: ['Jogging', 'Outdoor Gym', 'Sports']
      })
    }

    return recommendations.sort((a, b) => b.suitability - a.suitability)
  }

  async getUserWeatherPreferences(userId: string): Promise<WeatherPreferences | null> {
    const preferences = await prisma.userWeatherPreferences.findUnique({
      where: { userId }
    })

    if (!preferences) return null

    return {
      userId: preferences.userId,
      idealTempMin: preferences.idealTempMin,
      idealTempMax: preferences.idealTempMax,
      avoidRain: preferences.avoidRain,
      avoidSnow: preferences.avoidSnow,
      avoidHighHumidity: preferences.avoidHighHumidity,
      avoidStrongWind: preferences.avoidStrongWind,
      preferSunny: preferences.preferSunny,
      alertsEnabled: preferences.alertsEnabled,
      alertTypes: preferences.alertTypes || []
    }
  }

  async updateUserWeatherPreferences(
    userId: string,
    preferences: Partial<WeatherPreferences>
  ): Promise<WeatherPreferences> {
    const updated = await prisma.userWeatherPreferences.upsert({
      where: { userId },
      update: preferences,
      create: {
        userId,
        idealTempMin: preferences.idealTempMin ?? 18,
        idealTempMax: preferences.idealTempMax ?? 26,
        avoidRain: preferences.avoidRain ?? true,
        avoidSnow: preferences.avoidSnow ?? true,
        avoidHighHumidity: preferences.avoidHighHumidity ?? false,
        avoidStrongWind: preferences.avoidStrongWind ?? false,
        preferSunny: preferences.preferSunny ?? true,
        alertsEnabled: preferences.alertsEnabled ?? true,
        alertTypes: preferences.alertTypes ?? ['severe', 'extreme']
      }
    })

    return this.mapDbPreferencesToType(updated)
  }

  async getWeatherAlerts(latitude: number, longitude: number): Promise<WeatherAlert[]> {
    const cacheKey = `weather:alerts:${latitude.toFixed(4)}:${longitude.toFixed(4)}`
    
    // Check cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    let alerts: WeatherAlert[] = []

    // Try to fetch alerts from providers
    for (const provider of this.getActiveProviders()) {
      try {
        alerts = await this.fetchWeatherAlerts(provider, latitude, longitude)
        if (alerts.length > 0) {
          await redis.setEx(cacheKey, this.CACHE_TTL.alerts, JSON.stringify(alerts))
          break
        }
      } catch (error) {
        console.error(`Failed to fetch alerts from ${provider.name}:`, error)
      }
    }

    return alerts
  }

  // Private helper methods

  private getActiveProviders(): WeatherProvider[] {
    return this.providers
      .filter(p => p.enabled && p.failureCount < 5)
      .sort((a, b) => a.priority - b.priority)
  }

  private async fetchCurrentWeather(
    provider: WeatherProvider,
    latitude: number,
    longitude: number
  ): Promise<WeatherData | null> {
    switch (provider.name) {
      case 'openweather':
        return this.fetchOpenWeatherCurrent(provider.apiKey!, latitude, longitude)
      case 'accuweather':
        return this.fetchAccuWeatherCurrent(provider.apiKey!, latitude, longitude)
      case 'weatherapi':
        return this.fetchWeatherAPICurrent(provider.apiKey!, latitude, longitude)
      default:
        return null
    }
  }

  private async fetchWeatherForecast(
    provider: WeatherProvider,
    latitude: number,
    longitude: number,
    days: number
  ): Promise<WeatherRangeSummary | null> {
    switch (provider.name) {
      case 'openweather':
        return this.fetchOpenWeatherForecast(provider.apiKey!, latitude, longitude, days)
      case 'accuweather':
        return this.fetchAccuWeatherForecast(provider.apiKey!, latitude, longitude, days)
      case 'weatherapi':
        return this.fetchWeatherAPIForecast(provider.apiKey!, latitude, longitude, days)
      default:
        return null
    }
  }

  private async fetchWeatherAlerts(
    provider: WeatherProvider,
    latitude: number,
    longitude: number
  ): Promise<WeatherAlert[]> {
    switch (provider.name) {
      case 'openweather':
        return this.fetchOpenWeatherAlerts(provider.apiKey!, latitude, longitude)
      case 'weatherapi':
        return this.fetchWeatherAPIAlerts(provider.apiKey!, latitude, longitude)
      default:
        return []
    }
  }

  // OpenWeather implementation
  private async fetchOpenWeatherCurrent(
    apiKey: string,
    latitude: number,
    longitude: number
  ): Promise<WeatherData> {
    const response = await axios.get(
      'https://api.openweathermap.org/data/2.5/weather',
      {
        params: {
          lat: latitude,
          lon: longitude,
          appid: apiKey,
          units: 'metric'
        }
      }
    )

    return {
      temp: response.data.main.temp,
      feelsLike: response.data.main.feels_like,
      tempMin: response.data.main.temp_min,
      tempMax: response.data.main.temp_max,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed * 3.6, // Convert m/s to km/h
      windDirection: response.data.wind.deg,
      pressure: response.data.main.pressure,
      visibility: response.data.visibility,
      clouds: response.data.clouds.all,
      condition: response.data.weather[0].main,
      conditionDescription: response.data.weather[0].description,
      icon: response.data.weather[0].icon,
      precipitation: response.data.rain?.['1h'] || 0,
      snow: response.data.snow?.['1h'] || 0,
      timestamp: new Date(),
      provider: 'openweather'
    }
  }

  private async fetchOpenWeatherForecast(
    apiKey: string,
    latitude: number,
    longitude: number,
    days: number
  ): Promise<WeatherRangeSummary> {
    const response = await axios.get(
      'https://api.openweathermap.org/data/3.0/onecall',
      {
        params: {
          lat: latitude,
          lon: longitude,
          appid: apiKey,
          units: 'metric',
          exclude: 'minutely'
        }
      }
    )

    const dailyData = response.data.daily.slice(0, Math.min(days, 8))
    const daily: DailyWeather[] = dailyData.map((day: any) => ({
      date: new Date(day.dt * 1000),
      sunrise: new Date(day.sunrise * 1000),
      sunset: new Date(day.sunset * 1000),
      moonPhase: day.moon_phase,
      temp: {
        min: day.temp.min,
        max: day.temp.max,
        day: day.temp.day,
        night: day.temp.night,
        eve: day.temp.eve,
        morn: day.temp.morn
      },
      feelsLike: day.feels_like,
      humidity: day.humidity,
      windSpeed: day.wind_speed * 3.6,
      windDirection: day.wind_deg,
      pressure: day.pressure,
      clouds: day.clouds,
      precipitation: day.rain || 0,
      precipitationProbability: day.pop * 100,
      snow: day.snow || 0,
      uvIndex: day.uvi,
      condition: day.weather[0].main,
      conditionDescription: day.weather[0].description,
      icon: day.weather[0].icon
    }))

    const hourly: HourlyWeather[] = response.data.hourly.slice(0, 48).map((hour: any) => ({
      hour: new Date(hour.dt * 1000),
      temp: hour.temp,
      feelsLike: hour.feels_like,
      tempMin: hour.temp,
      tempMax: hour.temp,
      humidity: hour.humidity,
      windSpeed: hour.wind_speed * 3.6,
      windDirection: hour.wind_deg,
      pressure: hour.pressure,
      visibility: hour.visibility || 10000,
      clouds: hour.clouds,
      condition: hour.weather[0].main,
      conditionDescription: hour.weather[0].description,
      icon: hour.weather[0].icon,
      uvIndex: hour.uvi,
      precipitation: hour.rain?.['1h'] || 0,
      precipitationProbability: hour.pop * 100,
      snow: hour.snow?.['1h'] || 0
    }))

    return this.calculateWeatherSummary(daily, hourly)
  }

  private async fetchOpenWeatherAlerts(
    apiKey: string,
    latitude: number,
    longitude: number
  ): Promise<WeatherAlert[]> {
    try {
      const response = await axios.get(
        'https://api.openweathermap.org/data/3.0/onecall',
        {
          params: {
            lat: latitude,
            lon: longitude,
            appid: apiKey,
            exclude: 'current,minutely,hourly,daily'
          }
        }
      )

      if (!response.data.alerts) return []

      return response.data.alerts.map((alert: any) => ({
        id: `ow-${alert.start}-${alert.event}`,
        sender: alert.sender_name,
        event: alert.event,
        start: new Date(alert.start * 1000),
        end: new Date(alert.end * 1000),
        description: alert.description,
        severity: this.mapAlertSeverity(alert.tags)
      }))
    } catch (error) {
      console.error('Failed to fetch OpenWeather alerts:', error)
      return []
    }
  }

  // WeatherAPI implementation
  private async fetchWeatherAPICurrent(
    apiKey: string,
    latitude: number,
    longitude: number
  ): Promise<WeatherData> {
    const response = await axios.get(
      'https://api.weatherapi.com/v1/current.json',
      {
        params: {
          key: apiKey,
          q: `${latitude},${longitude}`,
          aqi: 'yes'
        }
      }
    )

    const current = response.data.current
    return {
      temp: current.temp_c,
      feelsLike: current.feelslike_c,
      tempMin: current.temp_c - 2, // Approximate
      tempMax: current.temp_c + 2, // Approximate
      humidity: current.humidity,
      windSpeed: current.wind_kph,
      windDirection: current.wind_degree,
      pressure: current.pressure_mb,
      visibility: current.vis_km * 1000,
      clouds: current.cloud,
      condition: current.condition.text,
      conditionDescription: current.condition.text,
      icon: current.condition.icon,
      uvIndex: current.uv,
      precipitation: current.precip_mm,
      timestamp: new Date(),
      provider: 'weatherapi'
    }
  }

  private async fetchWeatherAPIForecast(
    apiKey: string,
    latitude: number,
    longitude: number,
    days: number
  ): Promise<WeatherRangeSummary> {
    const response = await axios.get(
      'https://api.weatherapi.com/v1/forecast.json',
      {
        params: {
          key: apiKey,
          q: `${latitude},${longitude}`,
          days: Math.min(days, 14),
          aqi: 'yes',
          alerts: 'yes'
        }
      }
    )

    const forecastDays = response.data.forecast.forecastday
    const daily: DailyWeather[] = forecastDays.map((day: any) => ({
      date: new Date(day.date),
      sunrise: new Date(day.astro.sunrise),
      sunset: new Date(day.astro.sunset),
      moonPhase: day.astro.moon_phase === 'New Moon' ? 0 : 
                 day.astro.moon_phase === 'Full Moon' ? 0.5 : 0.25,
      temp: {
        min: day.day.mintemp_c,
        max: day.day.maxtemp_c,
        day: day.day.avgtemp_c,
        night: day.day.mintemp_c + 2,
        eve: day.day.avgtemp_c - 2,
        morn: day.day.mintemp_c + 3
      },
      feelsLike: {
        day: day.day.avgtemp_c + 2,
        night: day.day.mintemp_c,
        eve: day.day.avgtemp_c,
        morn: day.day.mintemp_c + 2
      },
      humidity: day.day.avghumidity,
      windSpeed: day.day.maxwind_kph,
      windDirection: 0, // Not provided
      pressure: 1013, // Not provided in forecast
      clouds: 50, // Approximate based on condition
      precipitation: day.day.totalprecip_mm,
      precipitationProbability: day.day.daily_chance_of_rain,
      snow: day.day.totalsnow_cm * 10, // Convert cm to mm
      uvIndex: day.day.uv,
      condition: day.day.condition.text,
      conditionDescription: day.day.condition.text,
      icon: day.day.condition.icon
    }))

    // Extract hourly data from the first 2 days
    const hourly: HourlyWeather[] = []
    forecastDays.slice(0, 2).forEach((day: any) => {
      day.hour.forEach((hour: any) => {
        hourly.push({
          hour: new Date(hour.time),
          temp: hour.temp_c,
          feelsLike: hour.feelslike_c,
          tempMin: hour.temp_c,
          tempMax: hour.temp_c,
          humidity: hour.humidity,
          windSpeed: hour.wind_kph,
          windDirection: hour.wind_degree,
          pressure: hour.pressure_mb,
          visibility: hour.vis_km * 1000,
          clouds: hour.cloud,
          condition: hour.condition.text,
          conditionDescription: hour.condition.text,
          icon: hour.condition.icon,
          uvIndex: hour.uv,
          precipitation: hour.precip_mm,
          precipitationProbability: hour.chance_of_rain,
          snow: hour.snow_cm * 10
        })
      })
    })

    return this.calculateWeatherSummary(daily, hourly)
  }

  private async fetchWeatherAPIAlerts(
    apiKey: string,
    latitude: number,
    longitude: number
  ): Promise<WeatherAlert[]> {
    try {
      const response = await axios.get(
        'https://api.weatherapi.com/v1/forecast.json',
        {
          params: {
            key: apiKey,
            q: `${latitude},${longitude}`,
            days: 1,
            alerts: 'yes'
          }
        }
      )

      if (!response.data.alerts?.alert) return []

      return response.data.alerts.alert.map((alert: any) => ({
        id: `wa-${alert.effective}-${alert.event}`,
        sender: alert.headline,
        event: alert.event,
        start: new Date(alert.effective),
        end: new Date(alert.expires),
        description: alert.desc,
        severity: this.mapAlertSeverity([alert.severity])
      }))
    } catch (error) {
      console.error('Failed to fetch WeatherAPI alerts:', error)
      return []
    }
  }

  // AccuWeather implementation (placeholder)
  private async fetchAccuWeatherCurrent(
    apiKey: string,
    latitude: number,
    longitude: number
  ): Promise<WeatherData | null> {
    // AccuWeather implementation would go here
    // Requires location key lookup first
    return null
  }

  private async fetchAccuWeatherForecast(
    apiKey: string,
    latitude: number,
    longitude: number,
    days: number
  ): Promise<WeatherRangeSummary | null> {
    // AccuWeather implementation would go here
    return null
  }

  // Helper methods
  private calculateWeatherSummary(
    daily: DailyWeather[],
    hourly?: HourlyWeather[]
  ): WeatherRangeSummary {
    const temps = daily.flatMap(d => [d.temp.min, d.temp.max])
    const rainDays = daily.filter(d => (d.precipitation || 0) > 0).length
    const snowDays = daily.filter(d => (d.snow || 0) > 0).length
    
    const conditions = daily.map(d => d.condition)
    const mostCommon = this.getMostCommonElement(conditions)
    
    const avgTemp = daily.reduce((a, d) => a + d.temp.day, 0) / daily.length
    
    let summary = `Mostly ${mostCommon.toLowerCase()} with average temperature of ${Math.round(avgTemp)}°C`
    
    if (rainDays > 0) {
      summary += ` and ${rainDays} day${rainDays > 1 ? 's' : ''} of rain`
    }
    
    if (snowDays > 0) {
      summary += ` and ${snowDays} day${snowDays > 1 ? 's' : ''} of snow`
    }
    
    return {
      summary,
      averageTemp: avgTemp,
      minTemp: Math.min(...temps),
      maxTemp: Math.max(...temps),
      rainProbability: (rainDays / daily.length) * 100,
      snowProbability: (snowDays / daily.length) * 100,
      humidity: daily.reduce((a, d) => a + d.humidity, 0) / daily.length,
      windSpeed: daily.reduce((a, d) => a + d.windSpeed, 0) / daily.length,
      uvIndex: daily.reduce((a, d) => a + (d.uvIndex || 0), 0) / daily.length,
      daily,
      hourly
    }
  }

  private getMostCommonElement(arr: string[]): string {
    const counts = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.keys(counts).reduce((a, b) => 
      counts[a] > counts[b] ? a : b
    )
  }

  private async calculateWeatherScore(
    forecast: WeatherRangeSummary,
    climateData: ClimateData[],
    preferences?: WeatherPreferences
  ): Promise<number> {
    let score = 100
    const prefs = preferences || {
      userId: '',
      idealTempMin: 18,
      idealTempMax: 26,
      avoidRain: true,
      avoidSnow: true,
      avoidHighHumidity: false,
      avoidStrongWind: false,
      preferSunny: true,
      alertsEnabled: true,
      alertTypes: []
    }

    // Temperature scoring
    if (forecast.averageTemp < prefs.idealTempMin) {
      score -= (prefs.idealTempMin - forecast.averageTemp) * 2
    } else if (forecast.averageTemp > prefs.idealTempMax) {
      score -= (forecast.averageTemp - prefs.idealTempMax) * 2
    }

    // Rain penalty
    if (prefs.avoidRain && forecast.rainProbability > 0) {
      score -= forecast.rainProbability * 0.5
    }

    // Snow penalty
    if (prefs.avoidSnow && forecast.snowProbability > 0) {
      score -= forecast.snowProbability * 0.7
    }

    // Humidity penalty
    if (prefs.avoidHighHumidity && forecast.humidity > 70) {
      score -= (forecast.humidity - 70) * 0.3
    }

    // Wind penalty
    if (prefs.avoidStrongWind && forecast.windSpeed > 20) {
      score -= (forecast.windSpeed - 20) * 0.5
    }

    // Sunny bonus
    if (prefs.preferSunny) {
      const sunnyDays = forecast.daily.filter(d => 
        d.condition.toLowerCase().includes('clear') || 
        d.condition.toLowerCase().includes('sunny')
      ).length
      const sunnyRatio = sunnyDays / forecast.daily.length
      score += sunnyRatio * 10
    }

    // Climate consistency bonus
    if (climateData.length > 0) {
      const avgComfort = climateData.reduce((a, c) => a + c.comfortScore, 0) / climateData.length
      score = (score * 0.7) + (avgComfort * 0.3)
    }

    return Math.max(0, Math.min(100, score))
  }

  private analyzeWeather(
    current: WeatherData,
    forecast: WeatherRangeSummary,
    climateData: ClimateData[]
  ): { pros: string[]; cons: string[] } {
    const pros: string[] = []
    const cons: string[] = []

    // Temperature analysis
    if (forecast.averageTemp >= 18 && forecast.averageTemp <= 26) {
      pros.push('Comfortable average temperature')
    } else if (forecast.averageTemp < 10) {
      cons.push('Very cold temperatures')
    } else if (forecast.averageTemp > 30) {
      cons.push('Very hot temperatures')
    }

    // Rain analysis
    if (forecast.rainProbability < 20) {
      pros.push('Low chance of rain')
    } else if (forecast.rainProbability > 50) {
      cons.push('High chance of rain')
    }

    // UV analysis
    if (forecast.uvIndex < 3) {
      pros.push('Low UV index - safe for extended outdoor activities')
    } else if (forecast.uvIndex > 8) {
      cons.push('Very high UV index - sun protection essential')
    }

    // Wind analysis
    if (forecast.windSpeed < 10) {
      pros.push('Calm wind conditions')
    } else if (forecast.windSpeed > 30) {
      cons.push('Strong winds expected')
    }

    // Climate analysis
    if (climateData.length > 0) {
      const avgComfort = climateData.reduce((a, c) => a + c.comfortScore, 0) / climateData.length
      if (avgComfort > 80) {
        pros.push('Excellent year-round climate')
      } else if (avgComfort < 50) {
        cons.push('Challenging climate conditions')
      }
    }

    return { pros, cons }
  }

  private getAverageConditions(forecast: WeatherRangeSummary): WeatherData {
    const avgDay = forecast.daily[0] // Use first day as representative
    return {
      temp: forecast.averageTemp,
      feelsLike: forecast.averageTemp,
      tempMin: forecast.minTemp,
      tempMax: forecast.maxTemp,
      humidity: forecast.humidity,
      windSpeed: forecast.windSpeed,
      windDirection: avgDay.windDirection,
      pressure: avgDay.pressure,
      visibility: 10000,
      clouds: avgDay.clouds,
      condition: avgDay.condition,
      conditionDescription: avgDay.conditionDescription,
      icon: avgDay.icon,
      uvIndex: forecast.uvIndex,
      precipitation: forecast.daily.reduce((a, d) => a + (d.precipitation || 0), 0) / forecast.daily.length
    }
  }

  private async generateClimateData(
    latitude: number,
    longitude: number,
    locationId?: string
  ): Promise<ClimateData[]> {
    // Generate synthetic climate data based on latitude
    const climateData: ClimateData[] = []
    const isNorthernHemisphere = latitude > 0
    const abslat = Math.abs(latitude)
    
    for (let month = 1; month <= 12; month++) {
      // Temperature calculation based on latitude and month
      let baseTemp = 25 - (abslat / 90) * 20 // Warmer at equator
      const monthOffset = isNorthernHemisphere ? month : (month + 6) % 12
      const seasonalVariation = Math.sin((monthOffset - 3) * Math.PI / 6) * (abslat / 90) * 15
      
      const avgTemp = baseTemp + seasonalVariation
      const comfort = this.calculateClimateComfort(avgTemp, 60, 5, 10)
      
      climateData.push({
        locationId: locationId || `${latitude},${longitude}`,
        month,
        avgTemp: Math.round(avgTemp * 10) / 10,
        avgMinTemp: Math.round((avgTemp - 5) * 10) / 10,
        avgMaxTemp: Math.round((avgTemp + 5) * 10) / 10,
        avgPrecipitation: 50 + Math.random() * 100,
        avgHumidity: 50 + Math.random() * 30,
        avgWindSpeed: 5 + Math.random() * 15,
        avgSunnyDays: 15 + Math.random() * 10,
        avgRainyDays: 5 + Math.random() * 10,
        avgSnowyDays: avgTemp < 5 ? Math.random() * 5 : 0,
        avgUvIndex: 3 + (1 - abslat / 90) * 7,
        comfortScore: comfort
      })
    }
    
    // Store in database if locationId provided
    if (locationId) {
      await this.storeClimateData(locationId, climateData)
    }
    
    return climateData
  }

  private calculateClimateComfort(
    temp: number,
    humidity: number,
    rainyDays: number,
    windSpeed: number
  ): number {
    let score = 100
    
    // Temperature comfort (ideal: 20-25°C)
    if (temp < 20) score -= (20 - temp) * 2
    else if (temp > 25) score -= (temp - 25) * 2
    
    // Humidity comfort (ideal: 40-60%)
    if (humidity < 40) score -= (40 - humidity) * 0.5
    else if (humidity > 60) score -= (humidity - 60) * 0.5
    
    // Rain penalty
    score -= rainyDays * 2
    
    // Wind penalty (above 20 km/h)
    if (windSpeed > 20) score -= (windSpeed - 20) * 0.5
    
    return Math.max(0, Math.min(100, score))
  }

  private mapAlertSeverity(tags: string[]): 'minor' | 'moderate' | 'severe' | 'extreme' {
    if (tags.some(t => t.toLowerCase().includes('extreme'))) return 'extreme'
    if (tags.some(t => t.toLowerCase().includes('severe'))) return 'severe'
    if (tags.some(t => t.toLowerCase().includes('moderate'))) return 'moderate'
    return 'minor'
  }

  private async storeWeatherData(
    latitude: number,
    longitude: number,
    data: WeatherData,
    provider: string
  ): Promise<void> {
    try {
      await prisma.weatherData.create({
        data: {
          latitude,
          longitude,
          provider,
          temperature: data.temp,
          feelsLike: data.feelsLike,
          humidity: data.humidity,
          windSpeed: data.windSpeed,
          windDirection: data.windDirection,
          pressure: data.pressure,
          visibility: data.visibility,
          clouds: data.clouds,
          condition: data.condition,
          conditionDescription: data.conditionDescription,
          icon: data.icon,
          uvIndex: data.uvIndex || null,
          precipitation: data.precipitation || null,
          snow: data.snow || null,
          timestamp: data.timestamp || new Date()
        }
      })
    } catch (error) {
      console.error('Failed to store weather data:', error)
    }
  }

  private async storeForecastData(
    latitude: number,
    longitude: number,
    forecast: WeatherRangeSummary,
    provider: string
  ): Promise<void> {
    // Store forecast summary in database
    // This would be implemented based on your database schema
  }

  private async storeClimateData(
    locationId: string,
    climateData: ClimateData[]
  ): Promise<void> {
    try {
      await prisma.historicalClimateData.createMany({
        data: climateData.map(data => ({
          locationId,
          month: data.month,
          avgTemp: data.avgTemp,
          avgMinTemp: data.avgMinTemp,
          avgMaxTemp: data.avgMaxTemp,
          avgPrecipitation: data.avgPrecipitation,
          avgHumidity: data.avgHumidity,
          avgWindSpeed: data.avgWindSpeed,
          avgSunnyDays: Math.round(data.avgSunnyDays),
          avgRainyDays: Math.round(data.avgRainyDays),
          avgSnowyDays: Math.round(data.avgSnowyDays),
          avgUvIndex: data.avgUvIndex,
          comfortScore: data.comfortScore
        })),
        skipDuplicates: true
      })
    } catch (error) {
      console.error('Failed to store climate data:', error)
    }
  }

  private mapDbClimateToType(data: any): ClimateData {
    return {
      locationId: data.locationId,
      month: data.month,
      avgTemp: data.avgTemp,
      avgMinTemp: data.avgMinTemp,
      avgMaxTemp: data.avgMaxTemp,
      avgPrecipitation: data.avgPrecipitation,
      avgHumidity: data.avgHumidity,
      avgWindSpeed: data.avgWindSpeed,
      avgSunnyDays: data.avgSunnyDays,
      avgRainyDays: data.avgRainyDays,
      avgSnowyDays: data.avgSnowyDays,
      avgUvIndex: data.avgUvIndex,
      comfortScore: data.comfortScore
    }
  }

  private mapDbPreferencesToType(data: any): WeatherPreferences {
    return {
      userId: data.userId,
      idealTempMin: data.idealTempMin,
      idealTempMax: data.idealTempMax,
      avoidRain: data.avoidRain,
      avoidSnow: data.avoidSnow,
      avoidHighHumidity: data.avoidHighHumidity,
      avoidStrongWind: data.avoidStrongWind,
      preferSunny: data.preferSunny,
      alertsEnabled: data.alertsEnabled,
      alertTypes: data.alertTypes || []
    }
  }
}

// Export singleton instance
export const weatherService = new WeatherService()