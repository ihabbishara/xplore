import { weatherService } from '../services/weatherService'
import { WeatherUtils } from '../utils/weatherUtils'
import axios from 'axios'
import { redis } from '../../../lib/redis'

// Mock dependencies
jest.mock('axios')
jest.mock('../../../lib/redis')
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    weatherData: { create: jest.fn() },
    historicalClimateData: { findMany: jest.fn(), createMany: jest.fn() },
    userWeatherPreferences: { findUnique: jest.fn(), upsert: jest.fn() }
  }
}))

const mockedAxios = axios as jest.Mocked<typeof axios>

describe('WeatherService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(redis.get as jest.Mock).mockResolvedValue(null)
    ;(redis.setEx as jest.Mock).mockResolvedValue('OK')
  })

  describe('getCurrentWeather', () => {
    it('should fetch current weather from OpenWeather API', async () => {
      const mockWeatherData = {
        main: {
          temp: 25,
          feels_like: 27,
          temp_min: 23,
          temp_max: 28,
          humidity: 60,
          pressure: 1013
        },
        wind: { speed: 3.5, deg: 180 },
        visibility: 10000,
        clouds: { all: 20 },
        weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
        rain: { '1h': 0 }
      }

      mockedAxios.get.mockResolvedValueOnce({ data: mockWeatherData })

      const result = await weatherService.getCurrentWeather(48.8566, 2.3522)

      expect(result).toEqual({
        temp: 25,
        feelsLike: 27,
        tempMin: 23,
        tempMax: 28,
        humidity: 60,
        windSpeed: 12.6, // 3.5 m/s converted to km/h
        windDirection: 180,
        pressure: 1013,
        visibility: 10000,
        clouds: 20,
        condition: 'Clear',
        conditionDescription: 'clear sky',
        icon: '01d',
        precipitation: 0,
        snow: 0,
        timestamp: expect.any(Date),
        provider: 'openweather'
      })

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.openweathermap.org/data/2.5/weather',
        expect.objectContaining({
          params: {
            lat: 48.8566,
            lon: 2.3522,
            appid: expect.any(String),
            units: 'metric'
          }
        })
      )
    })

    it('should return cached weather data if available', async () => {
      const cachedData = {
        temp: 20,
        feelsLike: 22,
        condition: 'Cloudy'
      }

      ;(redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await weatherService.getCurrentWeather(48.8566, 2.3522)

      expect(result).toEqual(cachedData)
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('should try fallback providers if primary fails', async () => {
      mockedAxios.get
        .mockRejectedValueOnce(new Error('OpenWeather API failed'))
        .mockResolvedValueOnce({
          data: {
            current: {
              temp_c: 25,
              feelslike_c: 27,
              humidity: 60,
              wind_kph: 12.6,
              wind_degree: 180,
              pressure_mb: 1013,
              vis_km: 10,
              cloud: 20,
              condition: { text: 'Clear', icon: '//cdn.weatherapi.com/weather/64x64/day/113.png' },
              uv: 6,
              precip_mm: 0
            }
          }
        })

      const result = await weatherService.getCurrentWeather(48.8566, 2.3522)

      expect(result.provider).toBe('weatherapi')
      expect(result.temp).toBe(25)
    })
  })

  describe('getWeatherForecast', () => {
    it('should fetch and parse weather forecast', async () => {
      const mockForecast = {
        daily: [
          {
            dt: Date.now() / 1000,
            sunrise: Date.now() / 1000,
            sunset: (Date.now() + 43200000) / 1000,
            moon_phase: 0.5,
            temp: { min: 15, max: 25, day: 22, night: 18, eve: 20, morn: 17 },
            feels_like: { day: 23, night: 19, eve: 21, morn: 18 },
            humidity: 60,
            wind_speed: 3.5,
            wind_deg: 180,
            pressure: 1013,
            clouds: 20,
            pop: 0.2,
            uvi: 6,
            weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }]
          }
        ],
        hourly: []
      }

      mockedAxios.get.mockResolvedValueOnce({ data: mockForecast })

      const result = await weatherService.getWeatherForecast(48.8566, 2.3522, 1)

      expect(result.daily).toHaveLength(1)
      expect(result.averageTemp).toBe(22)
      expect(result.minTemp).toBe(15)
      expect(result.maxTemp).toBe(25)
      expect(result.rainProbability).toBe(0)
    })
  })

  describe('compareWeatherLocations', () => {
    it('should compare weather for multiple locations', async () => {
      const locations = [
        { id: '1', name: 'Paris', latitude: 48.8566, longitude: 2.3522 },
        { id: '2', name: 'London', latitude: 51.5074, longitude: -0.1278 }
      ]

      mockedAxios.get.mockResolvedValue({
        data: {
          main: { temp: 20, humidity: 60, pressure: 1013 },
          wind: { speed: 3.5, deg: 180 },
          weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
          visibility: 10000,
          clouds: { all: 20 }
        }
      })

      const comparisons = await weatherService.compareWeatherLocations(locations)

      expect(comparisons).toHaveLength(2)
      expect(comparisons[0].locationName).toBe('Paris')
      expect(comparisons[1].locationName).toBe('London')
      expect(comparisons[0].score).toBeGreaterThan(0)
    })
  })

  describe('getWeatherActivities', () => {
    it('should recommend outdoor activities for good weather', async () => {
      const goodWeather = {
        temp: 22,
        feelsLike: 24,
        tempMin: 20,
        tempMax: 25,
        humidity: 50,
        windSpeed: 10,
        windDirection: 180,
        pressure: 1013,
        visibility: 10000,
        clouds: 10,
        condition: 'Clear',
        conditionDescription: 'clear sky',
        icon: '01d',
        precipitation: 0
      }

      const activities = await weatherService.getWeatherActivities(goodWeather)

      expect(activities).toContainEqual(
        expect.objectContaining({
          activity: 'Hiking',
          category: 'outdoor',
          suitability: expect.any(Number)
        })
      )
    })

    it('should recommend indoor activities for bad weather', async () => {
      const badWeather = {
        temp: 5,
        feelsLike: 2,
        tempMin: 3,
        tempMax: 7,
        humidity: 90,
        windSpeed: 30,
        windDirection: 180,
        pressure: 1013,
        visibility: 5000,
        clouds: 100,
        condition: 'Rain',
        conditionDescription: 'heavy rain',
        icon: '10d',
        precipitation: 20
      }

      const activities = await weatherService.getWeatherActivities(badWeather)

      expect(activities).toContainEqual(
        expect.objectContaining({
          activity: 'Museum Visit',
          category: 'indoor',
          suitability: 100
        })
      )
    })
  })
})

describe('WeatherUtils', () => {
  describe('temperature conversion', () => {
    it('should convert Celsius to Fahrenheit', () => {
      expect(WeatherUtils.convertTemperature(0, 'C', 'F')).toBe(32)
      expect(WeatherUtils.convertTemperature(100, 'C', 'F')).toBe(212)
      expect(WeatherUtils.convertTemperature(25, 'C', 'F')).toBeCloseTo(77, 0)
    })

    it('should convert Fahrenheit to Celsius', () => {
      expect(WeatherUtils.convertTemperature(32, 'F', 'C')).toBe(0)
      expect(WeatherUtils.convertTemperature(212, 'F', 'C')).toBe(100)
      expect(WeatherUtils.convertTemperature(77, 'F', 'C')).toBeCloseTo(25, 0)
    })
  })

  describe('wind speed conversion', () => {
    it('should convert between wind speed units', () => {
      expect(WeatherUtils.convertWindSpeed(36, 'kmh', 'ms')).toBe(10)
      expect(WeatherUtils.convertWindSpeed(10, 'ms', 'kmh')).toBe(36)
      expect(WeatherUtils.convertWindSpeed(60, 'mph', 'kmh')).toBeCloseTo(96.56, 1)
    })
  })

  describe('weather categorization', () => {
    it('should categorize weather conditions', () => {
      expect(WeatherUtils.getWeatherCategory('Clear sky')).toBe('clear')
      expect(WeatherUtils.getWeatherCategory('Partly cloudy')).toBe('cloudy')
      expect(WeatherUtils.getWeatherCategory('Light rain')).toBe('rain')
      expect(WeatherUtils.getWeatherCategory('Heavy snow')).toBe('snow')
      expect(WeatherUtils.getWeatherCategory('Thunderstorm')).toBe('storm')
    })
  })

  describe('UV index categorization', () => {
    it('should categorize UV index levels', () => {
      expect(WeatherUtils.getUVCategory(2).level).toBe('Low')
      expect(WeatherUtils.getUVCategory(5).level).toBe('Moderate')
      expect(WeatherUtils.getUVCategory(7).level).toBe('High')
      expect(WeatherUtils.getUVCategory(9).level).toBe('Very High')
      expect(WeatherUtils.getUVCategory(12).level).toBe('Extreme')
    })
  })

  describe('clothing recommendations', () => {
    it('should recommend appropriate clothing', () => {
      const coldWeather = { temp: -5, windSpeed: 20 } as any
      const coldRecs = WeatherUtils.getClothingRecommendations(coldWeather)
      expect(coldRecs).toContain('Heavy winter coat')
      expect(coldRecs).toContain('Gloves')

      const warmWeather = { temp: 28, windSpeed: 5, uvIndex: 8 } as any
      const warmRecs = WeatherUtils.getClothingRecommendations(warmWeather)
      expect(warmRecs).toContain('T-shirt')
      expect(warmRecs).toContain('Sunglasses')
      expect(warmRecs).toContain('Sunscreen SPF 30+')
    })
  })
})