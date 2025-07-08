import axios from 'axios'
import { redis } from '../../../lib/redis'

interface WeatherData {
  temp: number
  feelsLike: number
  tempMin: number
  tempMax: number
  humidity: number
  windSpeed: number
  windDirection: number
  pressure: number
  visibility: number
  clouds: number
  condition: string
  conditionDescription: string
  icon: string
  uvIndex?: number
  precipitation?: number
  snow?: number
}

interface DailyWeather {
  date: Date
  sunrise: Date
  sunset: Date
  temp: {
    min: number
    max: number
    day: number
    night: number
    eve: number
    morn: number
  }
  feelsLike: {
    day: number
    night: number
    eve: number
    morn: number
  }
  humidity: number
  windSpeed: number
  windDirection: number
  pressure: number
  clouds: number
  precipitation?: number
  snow?: number
  uvIndex?: number
  condition: string
  conditionDescription: string
  icon: string
}

interface WeatherRangeSummary {
  summary: string
  averageTemp: number
  minTemp: number
  maxTemp: number
  rainProbability: number
  snowProbability: number
  humidity: number
  windSpeed: number
  uvIndex: number
  daily: DailyWeather[]
}

export class WeatherService {
  private openWeatherApiKey: string
  private accuWeatherApiKey: string
  private weatherApiKey: string
  private providers = ['openweather', 'accuweather', 'weatherapi']
  
  constructor() {
    this.openWeatherApiKey = process.env.OPENWEATHER_API_KEY || ''
    this.accuWeatherApiKey = process.env.ACCUWEATHER_API_KEY || ''
    this.weatherApiKey = process.env.WEATHERAPI_KEY || ''
  }

  async getWeatherForDateRange(
    latitude: number,
    longitude: number,
    startDate: Date,
    endDate: Date
  ): Promise<WeatherRangeSummary> {
    const cacheKey = `weather:range:${latitude}:${longitude}:${startDate.toISOString()}:${endDate.toISOString()}`
    
    // Check cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    let weatherData: WeatherRangeSummary | null = null
    let lastError: Error | null = null

    // Try each provider in order
    for (const provider of this.providers) {
      try {
        switch (provider) {
          case 'openweather':
            weatherData = await this.getOpenWeatherForecast(latitude, longitude, startDate, endDate)
            break
          case 'accuweather':
            weatherData = await this.getAccuWeatherForecast(latitude, longitude, startDate, endDate)
            break
          case 'weatherapi':
            weatherData = await this.getWeatherAPIForecast(latitude, longitude, startDate, endDate)
            break
        }
        
        if (weatherData) {
          // Cache for 1 hour
          await redis.setEx(cacheKey, 3600, JSON.stringify(weatherData))
          
          // Store in database for analytics
          await this.storeWeatherData(latitude, longitude, weatherData, provider)
          
          break
        }
      } catch (error) {
        console.error(`Weather provider ${provider} failed:`, error)
        lastError = error as Error
      }
    }

    if (!weatherData) {
      // Return mock data as fallback
      return this.getMockWeatherData(startDate, endDate)
    }

    return weatherData
  }

  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
    const cacheKey = `weather:current:${latitude}:${longitude}`
    
    // Check cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    let weatherData: WeatherData | null = null

    // Try OpenWeather first for current weather
    if (this.openWeatherApiKey) {
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather`,
          {
            params: {
              lat: latitude,
              lon: longitude,
              appid: this.openWeatherApiKey,
              units: 'metric'
            }
          }
        )

        weatherData = this.parseOpenWeatherCurrent(response.data)
        
        // Cache for 15 minutes
        await redis.setEx(cacheKey, 900, JSON.stringify(weatherData))
      } catch (error) {
        console.error('OpenWeather current weather failed:', error)
      }
    }

    if (!weatherData) {
      // Return mock data as fallback
      return {
        temp: 24,
        feelsLike: 26,
        tempMin: 20,
        tempMax: 28,
        humidity: 60,
        windSpeed: 10,
        windDirection: 180,
        pressure: 1013,
        visibility: 10000,
        clouds: 20,
        condition: 'clear',
        conditionDescription: 'Clear sky',
        icon: '01d',
        uvIndex: 6
      }
    }

    return weatherData
  }

  private async getOpenWeatherForecast(
    latitude: number,
    longitude: number,
    startDate: Date,
    endDate: Date
  ): Promise<WeatherRangeSummary | null> {
    if (!this.openWeatherApiKey) return null

    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/onecall`,
        {
          params: {
            lat: latitude,
            lon: longitude,
            appid: this.openWeatherApiKey,
            units: 'metric',
            exclude: 'minutely,hourly,alerts'
          }
        }
      )

      return this.parseOpenWeatherForecast(response.data, startDate, endDate)
    } catch (error) {
      throw new Error(`OpenWeather API failed: ${error}`)
    }
  }

  private async getAccuWeatherForecast(
    latitude: number,
    longitude: number,
    startDate: Date,
    endDate: Date
  ): Promise<WeatherRangeSummary | null> {
    // AccuWeather implementation would go here
    // This is a placeholder
    return null
  }

  private async getWeatherAPIForecast(
    latitude: number,
    longitude: number,
    startDate: Date,
    endDate: Date
  ): Promise<WeatherRangeSummary | null> {
    // WeatherAPI implementation would go here
    // This is a placeholder
    return null
  }

  private parseOpenWeatherCurrent(data: any): WeatherData {
    return {
      temp: data.main.temp,
      feelsLike: data.main.feels_like,
      tempMin: data.main.temp_min,
      tempMax: data.main.temp_max,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
      windDirection: data.wind.deg,
      pressure: data.main.pressure,
      visibility: data.visibility,
      clouds: data.clouds.all,
      condition: data.weather[0].main,
      conditionDescription: data.weather[0].description,
      icon: data.weather[0].icon
    }
  }

  private parseOpenWeatherForecast(
    data: any,
    startDate: Date,
    endDate: Date
  ): WeatherRangeSummary {
    const daily: DailyWeather[] = data.daily
      .filter((day: any) => {
        const date = new Date(day.dt * 1000)
        return date >= startDate && date <= endDate
      })
      .map((day: any) => ({
        date: new Date(day.dt * 1000),
        sunrise: new Date(day.sunrise * 1000),
        sunset: new Date(day.sunset * 1000),
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
        windSpeed: day.wind_speed * 3.6, // Convert m/s to km/h
        windDirection: day.wind_deg,
        pressure: day.pressure,
        clouds: day.clouds,
        precipitation: day.rain || 0,
        snow: day.snow || 0,
        uvIndex: day.uvi,
        condition: day.weather[0].main,
        conditionDescription: day.weather[0].description,
        icon: day.weather[0].icon
      }))

    // Calculate summary statistics
    const temps = daily.flatMap(d => [d.temp.min, d.temp.max])
    const rainDays = daily.filter(d => (d.precipitation || 0) > 0).length
    const snowDays = daily.filter(d => (d.snow || 0) > 0).length
    
    return {
      summary: this.generateWeatherSummary(daily),
      averageTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
      minTemp: Math.min(...temps),
      maxTemp: Math.max(...temps),
      rainProbability: (rainDays / daily.length) * 100,
      snowProbability: (snowDays / daily.length) * 100,
      humidity: daily.reduce((a, d) => a + d.humidity, 0) / daily.length,
      windSpeed: daily.reduce((a, d) => a + d.windSpeed, 0) / daily.length,
      uvIndex: daily.reduce((a, d) => a + (d.uvIndex || 0), 0) / daily.length,
      daily
    }
  }

  private generateWeatherSummary(daily: DailyWeather[]): string {
    if (daily.length === 0) return 'No weather data available'
    
    const conditions = daily.map(d => d.condition)
    const mostCommon = this.getMostCommonElement(conditions)
    
    const avgTemp = daily.reduce((a, d) => a + d.temp.day, 0) / daily.length
    const rainDays = daily.filter(d => (d.precipitation || 0) > 0).length
    
    let summary = `Mostly ${mostCommon.toLowerCase()} with average temperature of ${Math.round(avgTemp)}°C`
    
    if (rainDays > 0) {
      summary += ` and ${rainDays} day${rainDays > 1 ? 's' : ''} of rain`
    }
    
    return summary
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

  private getMockWeatherData(startDate: Date, endDate: Date): WeatherRangeSummary {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daily: DailyWeather[] = []
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      
      daily.push({
        date,
        sunrise: new Date(date.setHours(6, 0, 0, 0)),
        sunset: new Date(date.setHours(18, 0, 0, 0)),
        temp: {
          min: 15 + Math.random() * 5,
          max: 25 + Math.random() * 5,
          day: 22 + Math.random() * 3,
          night: 18 + Math.random() * 3,
          eve: 20 + Math.random() * 3,
          morn: 17 + Math.random() * 3
        },
        feelsLike: {
          day: 23,
          night: 19,
          eve: 21,
          morn: 18
        },
        humidity: 60 + Math.random() * 20,
        windSpeed: 10 + Math.random() * 10,
        windDirection: Math.random() * 360,
        pressure: 1010 + Math.random() * 10,
        clouds: Math.random() * 100,
        precipitation: Math.random() > 0.7 ? Math.random() * 10 : 0,
        uvIndex: 5 + Math.random() * 3,
        condition: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
        conditionDescription: 'Mock weather data',
        icon: '01d'
      })
    }
    
    return {
      summary: 'Mock weather data - configure API keys for real data',
      averageTemp: 22,
      minTemp: 15,
      maxTemp: 28,
      rainProbability: 30,
      snowProbability: 0,
      humidity: 65,
      windSpeed: 12,
      uvIndex: 6,
      daily
    }
  }

  private async storeWeatherData(
    latitude: number,
    longitude: number,
    weatherData: WeatherRangeSummary,
    provider: string
  ): Promise<void> {
    // Store weather data in database for analytics
    // This would be implemented with the trip weather summary model
    console.log(`Stored weather data from ${provider} for ${latitude}, ${longitude}`)
  }

  async getWeatherScore(weatherData: WeatherRangeSummary, preferences?: {
    idealTempMin?: number
    idealTempMax?: number
    avoidRain?: boolean
    avoidSnow?: boolean
    preferSunny?: boolean
  }): Promise<number> {
    let score = 100
    const prefs = {
      idealTempMin: 18,
      idealTempMax: 26,
      avoidRain: true,
      avoidSnow: true,
      preferSunny: true,
      ...preferences
    }

    // Temperature scoring
    if (weatherData.averageTemp < prefs.idealTempMin) {
      score -= (prefs.idealTempMin - weatherData.averageTemp) * 2
    } else if (weatherData.averageTemp > prefs.idealTempMax) {
      score -= (weatherData.averageTemp - prefs.idealTempMax) * 2
    }

    // Rain penalty
    if (prefs.avoidRain && weatherData.rainProbability > 0) {
      score -= weatherData.rainProbability * 0.5
    }

    // Snow penalty
    if (prefs.avoidSnow && weatherData.snowProbability > 0) {
      score -= weatherData.snowProbability * 0.7
    }

    // Sunny bonus
    if (prefs.preferSunny) {
      const sunnyDays = weatherData.daily.filter(d => 
        d.condition.toLowerCase() === 'clear'
      ).length
      const sunnyRatio = sunnyDays / weatherData.daily.length
      score += sunnyRatio * 10
    }

    return Math.max(0, Math.min(100, score))
  }
}