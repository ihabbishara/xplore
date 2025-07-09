import { Request, Response } from 'express'
import { weatherService } from '../services/weatherService'
import { weatherCacheService } from '../services/weatherCacheService'
import { WeatherPreferences } from '../types/weather.types'

export class WeatherController {
  async getCurrentWeather(req: Request, res: Response) {
    try {
      const { latitude, longitude } = req.query

      if (!latitude || !longitude) {
        return res.status(400).json({
          error: 'Latitude and longitude are required'
        })
      }

      const lat = parseFloat(latitude as string)
      const lon = parseFloat(longitude as string)

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({
          error: 'Invalid latitude or longitude'
        })
      }

      const weatherData = await weatherService.getCurrentWeather(lat, lon)

      res.json({
        data: weatherData,
        meta: {
          location: { latitude: lat, longitude: lon },
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Error fetching current weather:', error)
      res.status(500).json({
        error: 'Failed to fetch weather data'
      })
    }
  }

  async getWeatherForecast(req: Request, res: Response) {
    try {
      const { latitude, longitude, days = '14' } = req.query

      if (!latitude || !longitude) {
        return res.status(400).json({
          error: 'Latitude and longitude are required'
        })
      }

      const lat = parseFloat(latitude as string)
      const lon = parseFloat(longitude as string)
      const forecastDays = parseInt(days as string, 10)

      if (isNaN(lat) || isNaN(lon) || isNaN(forecastDays)) {
        return res.status(400).json({
          error: 'Invalid parameters'
        })
      }

      if (forecastDays < 1 || forecastDays > 14) {
        return res.status(400).json({
          error: 'Days must be between 1 and 14'
        })
      }

      const forecast = await weatherService.getWeatherForecast(lat, lon, forecastDays)

      res.json({
        data: forecast,
        meta: {
          location: { latitude: lat, longitude: lon },
          days: forecastDays,
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Error fetching weather forecast:', error)
      res.status(500).json({
        error: 'Failed to fetch weather forecast'
      })
    }
  }

  async getHistoricalClimate(req: Request, res: Response) {
    try {
      const { latitude, longitude, locationId } = req.query

      if (!latitude || !longitude) {
        return res.status(400).json({
          error: 'Latitude and longitude are required'
        })
      }

      const lat = parseFloat(latitude as string)
      const lon = parseFloat(longitude as string)

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({
          error: 'Invalid latitude or longitude'
        })
      }

      const climateData = await weatherService.getHistoricalClimate(
        lat, 
        lon, 
        locationId as string
      )

      res.json({
        data: climateData,
        meta: {
          location: { latitude: lat, longitude: lon },
          locationId,
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Error fetching climate data:', error)
      res.status(500).json({
        error: 'Failed to fetch climate data'
      })
    }
  }

  async compareLocations(req: Request, res: Response) {
    try {
      const { locations, startDate, endDate } = req.body

      if (!locations || !Array.isArray(locations) || locations.length === 0) {
        return res.status(400).json({
          error: 'Locations array is required'
        })
      }

      // Validate each location
      for (const location of locations) {
        if (!location.id || !location.name || 
            typeof location.latitude !== 'number' || 
            typeof location.longitude !== 'number') {
          return res.status(400).json({
            error: 'Each location must have id, name, latitude, and longitude'
          })
        }
      }

      const comparisons = await weatherService.compareWeatherLocations(
        locations,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      )

      res.json({
        data: comparisons,
        meta: {
          locationCount: locations.length,
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Error comparing weather locations:', error)
      res.status(500).json({
        error: 'Failed to compare weather locations'
      })
    }
  }

  async getWeatherActivities(req: Request, res: Response) {
    try {
      const { latitude, longitude, forecastDays } = req.query

      if (!latitude || !longitude) {
        return res.status(400).json({
          error: 'Latitude and longitude are required'
        })
      }

      const lat = parseFloat(latitude as string)
      const lon = parseFloat(longitude as string)

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({
          error: 'Invalid latitude or longitude'
        })
      }

      // Get current weather or forecast based on request
      const weatherData = forecastDays
        ? await weatherService.getWeatherForecast(lat, lon, parseInt(forecastDays as string, 10))
        : await weatherService.getCurrentWeather(lat, lon)

      const activities = await weatherService.getWeatherActivities(weatherData)

      res.json({
        data: activities,
        meta: {
          location: { latitude: lat, longitude: lon },
          basedOn: forecastDays ? 'forecast' : 'current',
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Error getting weather activities:', error)
      res.status(500).json({
        error: 'Failed to get weather activity recommendations'
      })
    }
  }

  async getUserPreferences(req: Request, res: Response) {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          error: 'User authentication required'
        })
      }

      const preferences = await weatherService.getUserWeatherPreferences(userId)

      res.json({
        data: preferences || {
          userId,
          idealTempMin: 18,
          idealTempMax: 26,
          avoidRain: true,
          avoidSnow: true,
          avoidHighHumidity: false,
          avoidStrongWind: false,
          preferSunny: true,
          alertsEnabled: true,
          alertTypes: ['severe', 'extreme']
        }
      })
    } catch (error) {
      console.error('Error fetching user weather preferences:', error)
      res.status(500).json({
        error: 'Failed to fetch weather preferences'
      })
    }
  }

  async updateUserPreferences(req: Request, res: Response) {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          error: 'User authentication required'
        })
      }

      const preferences: Partial<WeatherPreferences> = req.body

      // Validate temperature ranges
      if (preferences.idealTempMin !== undefined && preferences.idealTempMax !== undefined) {
        if (preferences.idealTempMin >= preferences.idealTempMax) {
          return res.status(400).json({
            error: 'Minimum temperature must be less than maximum temperature'
          })
        }
      }

      const updated = await weatherService.updateUserWeatherPreferences(userId, preferences)

      res.json({
        data: updated,
        message: 'Weather preferences updated successfully'
      })
    } catch (error) {
      console.error('Error updating user weather preferences:', error)
      res.status(500).json({
        error: 'Failed to update weather preferences'
      })
    }
  }

  async getWeatherAlerts(req: Request, res: Response) {
    try {
      const { latitude, longitude } = req.query

      if (!latitude || !longitude) {
        return res.status(400).json({
          error: 'Latitude and longitude are required'
        })
      }

      const lat = parseFloat(latitude as string)
      const lon = parseFloat(longitude as string)

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({
          error: 'Invalid latitude or longitude'
        })
      }

      const alerts = await weatherService.getWeatherAlerts(lat, lon)

      res.json({
        data: alerts,
        meta: {
          location: { latitude: lat, longitude: lon },
          count: alerts.length,
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Error fetching weather alerts:', error)
      res.status(500).json({
        error: 'Failed to fetch weather alerts'
      })
    }
  }

  async getCacheMetrics(req: Request, res: Response) {
    try {
      const metrics = await weatherCacheService.getMetrics()

      res.json({
        data: metrics,
        meta: {
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Error fetching cache metrics:', error)
      res.status(500).json({
        error: 'Failed to fetch cache metrics'
      })
    }
  }

  async invalidateCache(req: Request, res: Response) {
    try {
      const { latitude, longitude } = req.body

      if (latitude && longitude) {
        const lat = parseFloat(latitude)
        const lon = parseFloat(longitude)

        if (isNaN(lat) || isNaN(lon)) {
          return res.status(400).json({
            error: 'Invalid latitude or longitude'
          })
        }

        await weatherCacheService.invalidateLocation(lat, lon)
        
        res.json({
          message: 'Cache invalidated for location',
          location: { latitude: lat, longitude: lon }
        })
      } else {
        await weatherCacheService.invalidateAll()
        
        res.json({
          message: 'All weather cache invalidated'
        })
      }
    } catch (error) {
      console.error('Error invalidating cache:', error)
      res.status(500).json({
        error: 'Failed to invalidate cache'
      })
    }
  }
}

export const weatherController = new WeatherController()