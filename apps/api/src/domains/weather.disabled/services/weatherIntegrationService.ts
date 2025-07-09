import { weatherService } from './weatherService'
import { prisma } from '../../../lib/prisma'
import { WeatherData, WeatherRangeSummary, ClimateData } from '../types/weather.types'

export class WeatherIntegrationService {
  /**
   * Automatically fetch and attach weather data to saved locations
   */
  async attachWeatherToSavedLocations(userId: string): Promise<void> {
    try {
      const savedLocations = await prisma.userSavedLocation.findMany({
        where: { userId },
        include: { location: true }
      })

      const weatherPromises = savedLocations.map(async (savedLocation) => {
        const { latitude, longitude } = savedLocation.location
        
        try {
          // Fetch current weather
          const currentWeather = await weatherService.getCurrentWeather(latitude, longitude)
          
          // Store weather data association
          await prisma.locationWeatherSnapshot.create({
            data: {
              locationId: savedLocation.locationId,
              temperature: currentWeather.temp,
              condition: currentWeather.condition,
              humidity: currentWeather.humidity,
              windSpeed: currentWeather.windSpeed,
              timestamp: new Date()
            }
          })
        } catch (error) {
          console.error(`Failed to fetch weather for location ${savedLocation.locationId}:`, error)
        }
      })

      await Promise.all(weatherPromises)
    } catch (error) {
      console.error('Failed to attach weather to saved locations:', error)
    }
  }

  /**
   * Get weather for trip destinations
   */
  async getTripWeather(tripId: string): Promise<Map<string, WeatherRangeSummary>> {
    const weatherMap = new Map<string, WeatherRangeSummary>()

    try {
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: {
          destinations: {
            include: { location: true }
          }
        }
      })

      if (!trip) {
        throw new Error('Trip not found')
      }

      const weatherPromises = trip.destinations.map(async (destination) => {
        const { latitude, longitude } = destination.location
        const days = Math.ceil(
          (new Date(destination.endDate).getTime() - new Date(destination.startDate).getTime()) / 
          (1000 * 60 * 60 * 24)
        )

        try {
          const forecast = await weatherService.getWeatherForecast(
            latitude, 
            longitude, 
            Math.min(days + 1, 14)
          )
          
          weatherMap.set(destination.id, forecast)

          // Store weather summary for the trip
          await this.storeTripWeatherSummary(tripId, destination.id, forecast)
        } catch (error) {
          console.error(`Failed to fetch weather for destination ${destination.id}:`, error)
        }
      })

      await Promise.all(weatherPromises)
    } catch (error) {
      console.error('Failed to get trip weather:', error)
    }

    return weatherMap
  }

  /**
   * Update trip itinerary based on weather
   */
  async optimizeTripForWeather(tripId: string): Promise<{
    suggestions: string[]
    warnings: string[]
    alternativeDates?: Date[]
  }> {
    const suggestions: string[] = []
    const warnings: string[] = []

    try {
      const weatherMap = await this.getTripWeather(tripId)
      
      weatherMap.forEach((forecast, destinationId) => {
        // Check for severe weather
        if (forecast.alerts && forecast.alerts.length > 0) {
          forecast.alerts.forEach(alert => {
            if (alert.severity === 'severe' || alert.severity === 'extreme') {
              warnings.push(`${alert.event} warning for destination`)
            }
          })
        }

        // Check for rain
        if (forecast.rainProbability > 50) {
          suggestions.push('Pack rain gear - high chance of precipitation')
        }

        // Check for extreme temperatures
        if (forecast.maxTemp > 35) {
          warnings.push('Extreme heat expected - plan indoor activities during midday')
        } else if (forecast.minTemp < 0) {
          warnings.push('Freezing temperatures expected - pack warm clothing')
        }

        // UV warnings
        if (forecast.uvIndex > 8) {
          suggestions.push('High UV levels - pack sunscreen and protective clothing')
        }
      })

      return { suggestions, warnings }
    } catch (error) {
      console.error('Failed to optimize trip for weather:', error)
      return { suggestions, warnings }
    }
  }

  /**
   * Get climate compatibility score for a location
   */
  async getLocationClimateScore(
    locationId: string,
    userId: string
  ): Promise<{
    score: number
    monthlyScores: Array<{ month: number; score: number }>
    bestMonths: number[]
    worstMonths: number[]
  }> {
    try {
      const location = await prisma.location.findUnique({
        where: { id: locationId }
      })

      if (!location) {
        throw new Error('Location not found')
      }

      const [climateData, userPreferences] = await Promise.all([
        weatherService.getHistoricalClimate(location.latitude, location.longitude, locationId),
        weatherService.getUserWeatherPreferences(userId)
      ])

      const monthlyScores = climateData.map(climate => ({
        month: climate.month,
        score: this.calculateMonthlyScore(climate, userPreferences)
      }))

      const sortedScores = [...monthlyScores].sort((a, b) => b.score - a.score)
      const bestMonths = sortedScores.slice(0, 3).map(s => s.month)
      const worstMonths = sortedScores.slice(-3).map(s => s.month)

      const averageScore = monthlyScores.reduce((sum, m) => sum + m.score, 0) / monthlyScores.length

      return {
        score: Math.round(averageScore),
        monthlyScores,
        bestMonths,
        worstMonths
      }
    } catch (error) {
      console.error('Failed to calculate climate score:', error)
      throw error
    }
  }

  /**
   * Send weather alerts for saved locations
   */
  async sendWeatherAlerts(userId: string): Promise<void> {
    try {
      const preferences = await weatherService.getUserWeatherPreferences(userId)
      
      if (!preferences?.alertsEnabled) {
        return
      }

      const savedLocations = await prisma.userSavedLocation.findMany({
        where: { userId },
        include: { location: true }
      })

      for (const savedLocation of savedLocations) {
        const { latitude, longitude } = savedLocation.location
        const alerts = await weatherService.getWeatherAlerts(latitude, longitude)

        const relevantAlerts = alerts.filter(alert => 
          preferences.alertTypes.includes(alert.severity)
        )

        if (relevantAlerts.length > 0) {
          // Send notification (implement notification service)
          console.log(`Sending ${relevantAlerts.length} weather alerts for ${savedLocation.location.name}`)
        }
      }
    } catch (error) {
      console.error('Failed to send weather alerts:', error)
    }
  }

  /**
   * Get weather-based activity recommendations for a location
   */
  async getLocationActivities(
    locationId: string,
    date?: Date
  ): Promise<{
    activities: Array<{
      name: string
      category: string
      suitability: number
      bestTime?: string
    }>
    weatherSummary: string
  }> {
    try {
      const location = await prisma.location.findUnique({
        where: { id: locationId }
      })

      if (!location) {
        throw new Error('Location not found')
      }

      const weather = date
        ? await weatherService.getWeatherForecast(location.latitude, location.longitude, 1)
        : await weatherService.getCurrentWeather(location.latitude, location.longitude)

      const recommendations = await weatherService.getWeatherActivities(weather)

      return {
        activities: recommendations.map(rec => ({
          name: rec.activity,
          category: rec.category,
          suitability: rec.suitability,
          bestTime: rec.bestTime?.toISOString()
        })),
        weatherSummary: 'daily' in weather ? weather.summary : `Current: ${weather.temp}°C, ${weather.condition}`
      }
    } catch (error) {
      console.error('Failed to get location activities:', error)
      throw error
    }
  }

  // Private helper methods

  private calculateMonthlyScore(
    climate: ClimateData,
    preferences: any
  ): number {
    let score = 100

    // Temperature scoring
    if (preferences) {
      if (climate.avgTemp < preferences.idealTempMin) {
        score -= (preferences.idealTempMin - climate.avgTemp) * 2
      } else if (climate.avgTemp > preferences.idealTempMax) {
        score -= (climate.avgTemp - preferences.idealTempMax) * 2
      }

      // Rain penalty
      if (preferences.avoidRain && climate.avgRainyDays > 10) {
        score -= (climate.avgRainyDays - 10) * 2
      }

      // Snow penalty
      if (preferences.avoidSnow && climate.avgSnowyDays > 0) {
        score -= climate.avgSnowyDays * 5
      }

      // Humidity penalty
      if (preferences.avoidHighHumidity && climate.avgHumidity > 70) {
        score -= (climate.avgHumidity - 70) * 0.5
      }

      // Wind penalty
      if (preferences.avoidStrongWind && climate.avgWindSpeed > 20) {
        score -= (climate.avgWindSpeed - 20)
      }

      // Sunny day bonus
      if (preferences.preferSunny) {
        score += (climate.avgSunnyDays / 30) * 20
      }
    }

    return Math.max(0, Math.min(100, score))
  }

  private async storeTripWeatherSummary(
    tripId: string,
    destinationId: string,
    forecast: WeatherRangeSummary
  ): Promise<void> {
    try {
      await prisma.tripWeatherSummary.create({
        data: {
          tripId,
          destinationId,
          summary: forecast.summary,
          avgTemp: forecast.averageTemp,
          minTemp: forecast.minTemp,
          maxTemp: forecast.maxTemp,
          rainProbability: forecast.rainProbability,
          snowProbability: forecast.snowProbability,
          avgHumidity: forecast.humidity,
          avgWindSpeed: forecast.windSpeed,
          avgUvIndex: forecast.uvIndex,
          fetchedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to store trip weather summary:', error)
    }
  }
}

export const weatherIntegrationService = new WeatherIntegrationService()