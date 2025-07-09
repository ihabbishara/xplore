import { redis } from '../../../lib/redis'
import { WeatherData, WeatherRangeSummary, ClimateData, WeatherAlert } from '../types/weather.types'

interface CacheMetrics {
  hits: number
  misses: number
  evictions: number
  size: number
}

export class WeatherCacheService {
  private readonly PREFIX = 'weather:'
  private readonly METRICS_KEY = 'weather:cache:metrics'
  
  private readonly TTL = {
    current: 900,      // 15 minutes
    forecast: 3600,    // 1 hour
    climate: 86400,    // 24 hours
    alerts: 300,       // 5 minutes
    comparison: 1800,  // 30 minutes
    activities: 7200   // 2 hours
  }

  async getCurrent(latitude: number, longitude: number): Promise<WeatherData | null> {
    const key = this.getCurrentKey(latitude, longitude)
    return this.get<WeatherData>(key)
  }

  async setCurrent(
    latitude: number, 
    longitude: number, 
    data: WeatherData
  ): Promise<void> {
    const key = this.getCurrentKey(latitude, longitude)
    await this.set(key, data, this.TTL.current)
  }

  async getForecast(
    latitude: number, 
    longitude: number, 
    days: number
  ): Promise<WeatherRangeSummary | null> {
    const key = this.getForecastKey(latitude, longitude, days)
    return this.get<WeatherRangeSummary>(key)
  }

  async setForecast(
    latitude: number, 
    longitude: number, 
    days: number,
    data: WeatherRangeSummary
  ): Promise<void> {
    const key = this.getForecastKey(latitude, longitude, days)
    await this.set(key, data, this.TTL.forecast)
  }

  async getClimate(
    latitude: number, 
    longitude: number
  ): Promise<ClimateData[] | null> {
    const key = this.getClimateKey(latitude, longitude)
    return this.get<ClimateData[]>(key)
  }

  async setClimate(
    latitude: number, 
    longitude: number, 
    data: ClimateData[]
  ): Promise<void> {
    const key = this.getClimateKey(latitude, longitude)
    await this.set(key, data, this.TTL.climate)
  }

  async getAlerts(
    latitude: number, 
    longitude: number
  ): Promise<WeatherAlert[] | null> {
    const key = this.getAlertsKey(latitude, longitude)
    return this.get<WeatherAlert[]>(key)
  }

  async setAlerts(
    latitude: number, 
    longitude: number, 
    data: WeatherAlert[]
  ): Promise<void> {
    const key = this.getAlertsKey(latitude, longitude)
    await this.set(key, data, this.TTL.alerts)
  }

  async invalidateLocation(latitude: number, longitude: number): Promise<void> {
    const pattern = `${this.PREFIX}*:${latitude.toFixed(4)}:${longitude.toFixed(4)}*`
    const keys = await this.getKeysByPattern(pattern)
    
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }

  async invalidateAll(): Promise<void> {
    const pattern = `${this.PREFIX}*`
    const keys = await this.getKeysByPattern(pattern)
    
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }

  async getMetrics(): Promise<CacheMetrics> {
    const metricsStr = await redis.get(this.METRICS_KEY)
    if (!metricsStr) {
      return { hits: 0, misses: 0, evictions: 0, size: 0 }
    }
    return JSON.parse(metricsStr)
  }

  async warmupCache(locations: Array<{ latitude: number; longitude: number }>): Promise<void> {
    // This method can be called periodically to pre-warm the cache
    // for frequently accessed locations
    console.log(`Warming up cache for ${locations.length} locations`)
  }

  // Private helper methods

  private async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key)
      if (data) {
        await this.incrementHits()
        return JSON.parse(data)
      }
      await this.incrementMisses()
      return null
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  private async set(key: string, data: any, ttl: number): Promise<void> {
    try {
      await redis.setEx(key, ttl, JSON.stringify(data))
      await this.updateSize()
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
    }
  }

  private async getKeysByPattern(pattern: string): Promise<string[]> {
    const keys: string[] = []
    let cursor = '0'
    
    do {
      const result = await redis.scan(cursor, {
        MATCH: pattern,
        COUNT: 100
      })
      cursor = result.cursor
      keys.push(...result.keys)
    } while (cursor !== '0')
    
    return keys
  }

  private getCurrentKey(latitude: number, longitude: number): string {
    return `${this.PREFIX}current:${latitude.toFixed(4)}:${longitude.toFixed(4)}`
  }

  private getForecastKey(latitude: number, longitude: number, days: number): string {
    return `${this.PREFIX}forecast:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${days}`
  }

  private getClimateKey(latitude: number, longitude: number): string {
    return `${this.PREFIX}climate:${latitude.toFixed(4)}:${longitude.toFixed(4)}`
  }

  private getAlertsKey(latitude: number, longitude: number): string {
    return `${this.PREFIX}alerts:${latitude.toFixed(4)}:${longitude.toFixed(4)}`
  }

  private async incrementHits(): Promise<void> {
    await this.updateMetrics('hits', 1)
  }

  private async incrementMisses(): Promise<void> {
    await this.updateMetrics('misses', 1)
  }

  private async updateSize(): Promise<void> {
    const pattern = `${this.PREFIX}*`
    const keys = await this.getKeysByPattern(pattern)
    await this.updateMetrics('size', keys.length, true)
  }

  private async updateMetrics(
    field: keyof CacheMetrics, 
    value: number, 
    absolute = false
  ): Promise<void> {
    const metrics = await this.getMetrics()
    
    if (absolute) {
      metrics[field] = value
    } else {
      metrics[field] = (metrics[field] || 0) + value
    }
    
    await redis.set(this.METRICS_KEY, JSON.stringify(metrics))
  }
}

export const weatherCacheService = new WeatherCacheService()