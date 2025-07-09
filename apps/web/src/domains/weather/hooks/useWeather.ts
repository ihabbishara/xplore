import { useState, useEffect, useCallback } from 'react'
import { weatherService } from '../services/weatherService'
import { WeatherData, WeatherRangeSummary, ClimateData, WeatherAlert } from '../types/weather.types'
import { useDebounce } from '@/hooks/useDebounce'

interface UseWeatherOptions {
  autoFetch?: boolean
  cacheTime?: number
}

export function useCurrentWeather(
  latitude?: number,
  longitude?: number,
  options: UseWeatherOptions = {}
) {
  const { autoFetch = true } = options
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWeather = useCallback(async () => {
    if (!latitude || !longitude) return

    setLoading(true)
    setError(null)

    try {
      const weather = await weatherService.getCurrentWeather(latitude, longitude)
      setData(weather)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather')
      console.error('Error fetching weather:', err)
    } finally {
      setLoading(false)
    }
  }, [latitude, longitude])

  useEffect(() => {
    if (autoFetch && latitude && longitude) {
      fetchWeather()
    }
  }, [autoFetch, latitude, longitude, fetchWeather])

  return {
    data,
    loading,
    error,
    refetch: fetchWeather
  }
}

export function useWeatherForecast(
  latitude?: number,
  longitude?: number,
  days: number = 14,
  options: UseWeatherOptions = {}
) {
  const { autoFetch = true } = options
  const [data, setData] = useState<WeatherRangeSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchForecast = useCallback(async () => {
    if (!latitude || !longitude) return

    setLoading(true)
    setError(null)

    try {
      const forecast = await weatherService.getWeatherForecast(latitude, longitude, days)
      setData(forecast)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch forecast')
      console.error('Error fetching forecast:', err)
    } finally {
      setLoading(false)
    }
  }, [latitude, longitude, days])

  useEffect(() => {
    if (autoFetch && latitude && longitude) {
      fetchForecast()
    }
  }, [autoFetch, latitude, longitude, days, fetchForecast])

  return {
    data,
    loading,
    error,
    refetch: fetchForecast
  }
}

export function useClimateData(
  latitude?: number,
  longitude?: number,
  locationId?: string
) {
  const [data, setData] = useState<ClimateData[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClimate = useCallback(async () => {
    if (!latitude || !longitude) return

    setLoading(true)
    setError(null)

    try {
      const climate = await weatherService.getHistoricalClimate(latitude, longitude, locationId)
      setData(climate)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch climate data')
      console.error('Error fetching climate:', err)
    } finally {
      setLoading(false)
    }
  }, [latitude, longitude, locationId])

  useEffect(() => {
    if (latitude && longitude) {
      fetchClimate()
    }
  }, [latitude, longitude, locationId, fetchClimate])

  return {
    data,
    loading,
    error,
    refetch: fetchClimate
  }
}

export function useWeatherAlerts(
  latitude?: number,
  longitude?: number,
  refreshInterval?: number
) {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    if (!latitude || !longitude) return

    setLoading(true)
    setError(null)

    try {
      const alertData = await weatherService.getWeatherAlerts(latitude, longitude)
      setAlerts(alertData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
      console.error('Error fetching alerts:', err)
    } finally {
      setLoading(false)
    }
  }, [latitude, longitude])

  useEffect(() => {
    if (latitude && longitude) {
      fetchAlerts()

      if (refreshInterval) {
        const interval = setInterval(fetchAlerts, refreshInterval)
        return () => clearInterval(interval)
      }
    }
  }, [latitude, longitude, refreshInterval, fetchAlerts])

  return {
    alerts,
    loading,
    error,
    refetch: fetchAlerts
  }
}

export function useWeatherActivities(
  latitude?: number,
  longitude?: number,
  forecastDays?: number
) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    if (!latitude || !longitude) return

    setLoading(true)
    setError(null)

    try {
      const data = await weatherService.getWeatherActivities(latitude, longitude, forecastDays)
      setActivities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities')
      console.error('Error fetching activities:', err)
    } finally {
      setLoading(false)
    }
  }, [latitude, longitude, forecastDays])

  useEffect(() => {
    if (latitude && longitude) {
      fetchActivities()
    }
  }, [latitude, longitude, forecastDays, fetchActivities])

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities
  }
}

export function useWeatherComparison() {
  const [comparisons, setComparisons] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const compareLocations = useCallback(async (
    locations: Array<{ id: string; name: string; latitude: number; longitude: number }>,
    startDate?: Date,
    endDate?: Date
  ) => {
    setLoading(true)
    setError(null)

    try {
      const data = await weatherService.compareLocations(locations, startDate, endDate)
      setComparisons(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare locations')
      console.error('Error comparing locations:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    comparisons,
    loading,
    error,
    compareLocations
  }
}

export function useWeatherPreferences() {
  const [preferences, setPreferences] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPreferences = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await weatherService.getUserPreferences()
      setPreferences(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences')
      console.error('Error fetching preferences:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePreferences = useCallback(async (updates: any) => {
    setLoading(true)
    setError(null)

    try {
      const data = await weatherService.updateUserPreferences(updates)
      setPreferences(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences')
      console.error('Error updating preferences:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refetch: fetchPreferences
  }
}

// Composite hook for location weather summary
export function useLocationWeather(
  locationId: string,
  latitude: number,
  longitude: number
) {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    if (!locationId || !latitude || !longitude) return

    setLoading(true)
    setError(null)

    try {
      const data = await weatherService.getLocationWeatherSummary(
        locationId,
        latitude,
        longitude
      )
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather summary')
      console.error('Error fetching weather summary:', err)
    } finally {
      setLoading(false)
    }
  }, [locationId, latitude, longitude])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary
  }
}