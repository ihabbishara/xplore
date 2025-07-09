import axios from 'axios'
import { LocationEnrichment } from '../types/journal.types'
import { WeatherService } from '../../weather/services/weatherService'

export class LocationIntelligenceService {
  private weatherService: WeatherService
  private mapboxToken: string
  
  constructor() {
    this.weatherService = new WeatherService()
    this.mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || ''
  }

  async enrichLocation(coordinates: { lat: number; lng: number }): Promise<LocationEnrichment> {
    try {
      // Parallel fetch all location data
      const [address, timezone, weather, nearbyPOIs] = await Promise.all([
        this.reverseGeocode(coordinates),
        this.detectTimezone(coordinates),
        this.weatherService.getCurrentWeather(coordinates.lat, coordinates.lng),
        this.findNearbyPOIs(coordinates)
      ])
      
      return {
        coordinates,
        address,
        timezone,
        weather,
        nearbyPOIs
      }
    } catch (error) {
      console.error('Location enrichment error:', error)
      // Return minimal data on error
      return {
        coordinates,
        address: '',
        timezone: 'UTC',
        weather: null,
        nearbyPOIs: []
      }
    }
  }

  private async reverseGeocode(coordinates: { lat: number; lng: number }): Promise<string> {
    if (!this.mapboxToken) {
      return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
    }
    
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.lng},${coordinates.lat}.json`,
        {
          params: {
            access_token: this.mapboxToken,
            types: 'address,place,locality',
            limit: 1
          }
        }
      )
      
      if (response.data.features && response.data.features.length > 0) {
        return response.data.features[0].place_name
      }
      
      return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
    }
  }

  private async detectTimezone(coordinates: { lat: number; lng: number }): Promise<string> {
    try {
      // Using timezone API or library
      // For now, using a simple approximation based on longitude
      const offset = Math.round(coordinates.lng / 15)
      return `UTC${offset >= 0 ? '+' : ''}${offset}`
    } catch (error) {
      return 'UTC'
    }
  }

  private async findNearbyPOIs(coordinates: { lat: number; lng: number }): Promise<any[]> {
    if (!this.mapboxToken) {
      return []
    }
    
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.lng},${coordinates.lat}.json`,
        {
          params: {
            access_token: this.mapboxToken,
            types: 'poi',
            limit: 10,
            radius: 1000 // 1km radius
          }
        }
      )
      
      if (response.data.features) {
        return response.data.features.map((feature: any) => ({
          id: feature.id,
          name: feature.text,
          category: feature.properties?.category,
          distance: feature.properties?.distance,
          address: feature.place_name
        }))
      }
      
      return []
    } catch (error) {
      console.error('POI search error:', error)
      return []
    }
  }

  async suggestTags(location: any, content: string): Promise<string[]> {
    const tags = new Set<string>()
    
    // Location-based tags
    if (location.nearbyPOIs) {
      location.nearbyPOIs.forEach((poi: any) => {
        if (poi.category) {
          const categoryTags = this.categoryToTags(poi.category)
          categoryTags.forEach(tag => tags.add(tag))
        }
      })
    }
    
    // Weather-based tags
    if (location.weather) {
      const weatherTags = this.weatherToTags(location.weather)
      weatherTags.forEach(tag => tags.add(tag))
    }
    
    // Content-based tags (simple keyword extraction)
    const contentTags = this.extractKeywords(content)
    contentTags.forEach(tag => tags.add(tag))
    
    // Time-based tags
    const timeTags = this.getTimeTags(new Date())
    timeTags.forEach(tag => tags.add(tag))
    
    return Array.from(tags).slice(0, 10) // Return max 10 tags
  }

  private categoryToTags(category: string): string[] {
    const categoryMap: Record<string, string[]> = {
      'restaurant': ['food', 'dining'],
      'cafe': ['coffee', 'cafe'],
      'hotel': ['accommodation', 'hotel'],
      'attraction': ['sightseeing', 'tourist'],
      'park': ['nature', 'outdoor'],
      'museum': ['culture', 'museum'],
      'beach': ['beach', 'ocean'],
      'mountain': ['hiking', 'mountain'],
      'shopping': ['shopping', 'retail'],
      'nightlife': ['nightlife', 'entertainment']
    }
    
    return categoryMap[category.toLowerCase()] || []
  }

  private weatherToTags(weather: any): string[] {
    const tags = []
    
    if (weather.condition) {
      const condition = weather.condition.toLowerCase()
      if (condition.includes('rain')) tags.push('rainy')
      if (condition.includes('sun') || condition.includes('clear')) tags.push('sunny')
      if (condition.includes('cloud')) tags.push('cloudy')
      if (condition.includes('snow')) tags.push('snowy')
    }
    
    if (weather.temp) {
      if (weather.temp > 30) tags.push('hot')
      else if (weather.temp > 20) tags.push('warm')
      else if (weather.temp > 10) tags.push('cool')
      else tags.push('cold')
    }
    
    return tags
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'under', 'over'
    ])
    
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word))
    
    // Count word frequency
    const wordFreq = new Map<string, number>()
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
    })
    
    // Return top frequent words
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
  }

  private getTimeTags(date: Date): string[] {
    const tags = []
    const hour = date.getHours()
    
    if (hour >= 5 && hour < 12) tags.push('morning')
    else if (hour >= 12 && hour < 17) tags.push('afternoon')
    else if (hour >= 17 && hour < 21) tags.push('evening')
    else tags.push('night')
    
    const dayOfWeek = date.toLocaleDateString('en', { weekday: 'long' }).toLowerCase()
    if (['saturday', 'sunday'].includes(dayOfWeek)) {
      tags.push('weekend')
    }
    
    return tags
  }
}