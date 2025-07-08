import axios from 'axios'
import { PropertyCreateInput, PropertyUpdateInput, PropertyCoordinates, PropertyFeatures } from '../types/property.types'
import { WeatherService } from '../../weather/services/weatherService'
import { logger } from '../../../lib/logger'

interface LocationEnrichment {
  coordinates?: PropertyCoordinates
  neighborhood?: string
  nearbyAmenities?: {
    schools: any[]
    hospitals: any[]
    transport: any[]
    shopping: any[]
    restaurants: any[]
  }
  commuteData?: {
    [destination: string]: {
      driving: number
      publicTransport: number
      walking: number
    }
  }
  demographics?: {
    population: number
    averageAge: number
    incomeLevel: string
  }
}

interface PropertyEnrichment {
  marketValue?: {
    estimated: number
    confidence: number
    comparable: any[]
  }
  neighborhood?: {
    name: string
    rating: number
    description: string
    demographics: any
  }
  amenities?: {
    nearby: any[]
    walkScore: number
    transitScore: number
  }
  investment?: {
    rentalYield: number
    appreciation: number
    riskLevel: string
  }
}

export class PropertyProcessor {
  private weatherService: WeatherService
  private mapboxToken: string
  private googleApiKey: string

  constructor() {
    this.weatherService = new WeatherService()
    this.mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || ''
    this.googleApiKey = process.env.GOOGLE_PLACES_API_KEY || ''
  }

  /**
   * Normalize property data across different platforms
   */
  async normalizePropertyData(
    rawData: Partial<PropertyCreateInput>, 
    platform: string
  ): Promise<PropertyCreateInput> {
    const normalized: PropertyCreateInput = {
      sourceUrl: rawData.sourceUrl!,
      sourcePlatform: platform,
      ...rawData
    }

    try {
      // Normalize property type
      normalized.propertyType = this.normalizePropertyType(rawData.propertyType, platform)
      
      // Normalize transaction type
      normalized.transactionType = this.normalizeTransactionType(rawData.transactionType, platform)
      
      // Normalize size units (convert to sqm if needed)
      normalized.sizeSqm = this.normalizeSize(rawData.sizeSqm, platform)
      
      // Normalize price (ensure consistent currency)
      if (rawData.price && rawData.currency) {
        normalized.price = await this.normalizePrice(rawData.price, rawData.currency, platform)
        normalized.currency = this.getTargetCurrency(platform)
      }
      
      // Clean and validate address
      normalized.address = this.cleanAddress(rawData.address)
      
      // Normalize features
      normalized.features = this.normalizeFeatures(rawData.features, platform)
      
      // Extract and validate coordinates
      if (rawData.coordinates) {
        normalized.coordinates = this.validateCoordinates(rawData.coordinates)
      } else if (rawData.address) {
        normalized.coordinates = await this.geocodeAddress(rawData.address)
      }
      
      // Calculate price per sqm
      if (normalized.price && normalized.sizeSqm) {
        normalized.pricePerSqm = normalized.price / normalized.sizeSqm
      }
      
      // Normalize energy rating
      normalized.energyRating = this.normalizeEnergyRating(rawData.energyRating, platform)
      
      // Clean and validate photos
      normalized.photos = this.validatePhotos(rawData.photos)
      
      // Determine property region from city/country
      if (normalized.city && normalized.country) {
        normalized.region = await this.determineRegion(normalized.city, normalized.country)
      }
      
      logger.info(`Normalized property data for ${platform}`)
      
    } catch (error) {
      logger.error('Error normalizing property data:', error)
      // Continue with partial normalization
    }

    return normalized
  }

  /**
   * Enrich property data with additional information
   */
  async enrichPropertyData(property: PropertyCreateInput): Promise<PropertyCreateInput> {
    const enriched = { ...property }

    try {
      // Enrich location data
      if (property.coordinates) {
        const locationEnrichment = await this.enrichLocationData(property.coordinates)
        
        if (locationEnrichment.neighborhood) {
          enriched.address = `${enriched.address}, ${locationEnrichment.neighborhood}`
        }
        
        // Add nearby amenities to features
        if (locationEnrichment.nearbyAmenities) {
          enriched.features = {
            ...enriched.features,
            nearbySchools: locationEnrichment.nearbyAmenities.schools.length > 0,
            nearbyTransport: locationEnrichment.nearbyAmenities.transport.length > 0,
            nearbyShops: locationEnrichment.nearbyAmenities.shopping.length > 0
          }
        }
      }
      
      // Enrich with market data
      const marketEnrichment = await this.enrichWithMarketData(enriched)
      if (marketEnrichment.marketValue) {
        // Add market insights to description
        const marketInsight = `Market estimate: ${marketEnrichment.marketValue.estimated.toLocaleString()} ${enriched.currency}`
        enriched.description = enriched.description 
          ? `${enriched.description}\n\n${marketInsight}`
          : marketInsight
      }
      
      // Enrich with weather data
      if (enriched.coordinates) {
        const weatherData = await this.weatherService.getCurrentWeather(
          enriched.coordinates.lat,
          enriched.coordinates.lng
        )
        
        // Add seasonal insights
        if (weatherData) {
          const seasonalInsight = await this.generateSeasonalInsight(weatherData, enriched)
          if (seasonalInsight) {
            enriched.description = enriched.description 
              ? `${enriched.description}\n\n${seasonalInsight}`
              : seasonalInsight
          }
        }
      }
      
      // Enhance data quality score
      enriched.dataQualityScore = this.calculateEnhancedQualityScore(enriched)
      
      logger.info('Successfully enriched property data')
      
    } catch (error) {
      logger.error('Error enriching property data:', error)
      // Continue with basic data
    }

    return enriched
  }

  /**
   * Normalize property type across platforms
   */
  private normalizePropertyType(type?: string, platform?: string): string | undefined {
    if (!type) return undefined
    
    const normalized = type.toLowerCase()
    
    // Common mappings
    const typeMap: { [key: string]: string } = {
      'appartement': 'apartment',
      'maison': 'house',
      'villa': 'villa',
      'studio': 'studio',
      'duplex': 'duplex',
      'loft': 'loft',
      'château': 'castle',
      'ferme': 'farm',
      'terrain': 'land',
      'garage': 'garage',
      'parking': 'parking',
      'bureau': 'office',
      'local commercial': 'commercial'
    }
    
    return typeMap[normalized] || normalized
  }

  /**
   * Normalize transaction type
   */
  private normalizeTransactionType(type?: string, platform?: string): string | undefined {
    if (!type) return undefined
    
    const normalized = type.toLowerCase()
    
    if (normalized.includes('vente') || normalized.includes('sale') || normalized.includes('buy')) {
      return 'sale'
    } else if (normalized.includes('location') || normalized.includes('rent') || normalized.includes('rental')) {
      return 'rent'
    }
    
    return normalized
  }

  /**
   * Normalize size to square meters
   */
  private normalizeSize(size?: number, platform?: string): number | undefined {
    if (!size) return undefined
    
    // Platform-specific size normalization
    switch (platform) {
      case 'rightmove':
        // UK properties might be in square feet
        return size * 0.092903 // Convert sq ft to sq m
      default:
        return size
    }
  }

  /**
   * Normalize price to target currency
   */
  private async normalizePrice(
    price: number, 
    currency: string, 
    platform: string
  ): Promise<number> {
    const targetCurrency = this.getTargetCurrency(platform)
    
    if (currency === targetCurrency) {
      return price
    }
    
    // Convert currency using exchange rate API
    try {
      const rate = await this.getExchangeRate(currency, targetCurrency)
      return price * rate
    } catch (error) {
      logger.warn(`Failed to convert ${currency} to ${targetCurrency}`, error)
      return price
    }
  }

  /**
   * Get target currency for platform
   */
  private getTargetCurrency(platform: string): string {
    const currencyMap: { [key: string]: string } = {
      'seloger': 'EUR',
      'leboncoin': 'EUR',
      'pap': 'EUR',
      'rightmove': 'GBP',
      'zoopla': 'GBP',
      'immobilienscout24': 'EUR',
      'idealista': 'EUR'
    }
    
    return currencyMap[platform] || 'EUR'
  }

  /**
   * Get exchange rate between currencies
   */
  private async getExchangeRate(from: string, to: string): Promise<number> {
    try {
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${from}`
      )
      return response.data.rates[to] || 1
    } catch (error) {
      logger.error('Failed to fetch exchange rate:', error)
      return 1
    }
  }

  /**
   * Clean and standardize address
   */
  private cleanAddress(address?: string): string | undefined {
    if (!address) return undefined
    
    return address
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^,\s*/, '')
      .replace(/\s*,$/, '')
  }

  /**
   * Normalize features across platforms
   */
  private normalizeFeatures(features?: PropertyFeatures, platform?: string): PropertyFeatures | undefined {
    if (!features) return undefined
    
    const normalized: PropertyFeatures = { ...features }
    
    // Platform-specific feature normalization
    switch (platform) {
      case 'rightmove':
        // UK-specific features
        if (features.parking) {
          normalized.parking = true
        }
        break
      case 'seloger':
        // French-specific features
        if (features.balcony) {
          normalized.balcony = true
        }
        break
    }
    
    return normalized
  }

  /**
   * Validate coordinates
   */
  private validateCoordinates(coords?: PropertyCoordinates): PropertyCoordinates | undefined {
    if (!coords) return undefined
    
    const { lat, lng } = coords
    
    // Basic validation
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng }
    }
    
    return undefined
  }

  /**
   * Geocode address to coordinates
   */
  private async geocodeAddress(address: string): Promise<PropertyCoordinates | undefined> {
    if (!this.mapboxToken) return undefined
    
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
        {
          params: {
            access_token: this.mapboxToken,
            limit: 1
          }
        }
      )
      
      if (response.data.features && response.data.features.length > 0) {
        const [lng, lat] = response.data.features[0].center
        return { lat, lng }
      }
    } catch (error) {
      logger.error('Geocoding failed:', error)
    }
    
    return undefined
  }

  /**
   * Determine region from city and country
   */
  private async determineRegion(city: string, country: string): Promise<string | undefined> {
    // Simple region mapping - in production, use a proper service
    const regionMap: { [key: string]: { [key: string]: string } } = {
      'France': {
        'Paris': 'Île-de-France',
        'Lyon': 'Auvergne-Rhône-Alpes',
        'Marseille': 'Provence-Alpes-Côte d\'Azur',
        'Toulouse': 'Occitanie',
        'Nice': 'Provence-Alpes-Côte d\'Azur',
        'Nantes': 'Pays de la Loire',
        'Strasbourg': 'Grand Est',
        'Montpellier': 'Occitanie',
        'Bordeaux': 'Nouvelle-Aquitaine',
        'Lille': 'Hauts-de-France'
      },
      'United Kingdom': {
        'London': 'Greater London',
        'Manchester': 'Greater Manchester',
        'Birmingham': 'West Midlands',
        'Leeds': 'West Yorkshire',
        'Glasgow': 'Scotland',
        'Edinburgh': 'Scotland',
        'Liverpool': 'Merseyside',
        'Bristol': 'South West England',
        'Cardiff': 'Wales',
        'Belfast': 'Northern Ireland'
      }
    }
    
    return regionMap[country]?.[city]
  }

  /**
   * Normalize energy rating
   */
  private normalizeEnergyRating(rating?: string, platform?: string): string | undefined {
    if (!rating) return undefined
    
    const normalized = rating.toUpperCase().trim()
    
    // Validate energy rating format
    if (/^[A-G]$/.test(normalized)) {
      return normalized
    }
    
    return undefined
  }

  /**
   * Validate and clean photos
   */
  private validatePhotos(photos?: any[]): any[] | undefined {
    if (!photos || photos.length === 0) return undefined
    
    const validPhotos = photos.filter(photo => {
      if (typeof photo === 'string') {
        return this.isValidUrl(photo)
      } else if (typeof photo === 'object' && photo.url) {
        return this.isValidUrl(photo.url)
      }
      return false
    })
    
    return validPhotos.length > 0 ? validPhotos : undefined
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Enrich location data with nearby amenities
   */
  private async enrichLocationData(coordinates: PropertyCoordinates): Promise<LocationEnrichment> {
    const enrichment: LocationEnrichment = {}
    
    try {
      // Get nearby amenities using Google Places API
      if (this.googleApiKey) {
        const amenities = await this.getNearbyAmenities(coordinates)
        enrichment.nearbyAmenities = amenities
      }
      
      // Get neighborhood information
      const neighborhood = await this.getNeighborhoodInfo(coordinates)
      enrichment.neighborhood = neighborhood
      
      // Calculate commute times to major cities
      const commuteData = await this.getCommuteData(coordinates)
      enrichment.commuteData = commuteData
      
    } catch (error) {
      logger.error('Error enriching location data:', error)
    }
    
    return enrichment
  }

  /**
   * Get nearby amenities using Google Places API
   */
  private async getNearbyAmenities(coordinates: PropertyCoordinates): Promise<any> {
    const amenities = {
      schools: [],
      hospitals: [],
      transport: [],
      shopping: [],
      restaurants: []
    }
    
    try {
      const types = ['school', 'hospital', 'subway_station', 'shopping_mall', 'restaurant']
      
      for (const type of types) {
        const response = await axios.get(
          'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
          {
            params: {
              location: `${coordinates.lat},${coordinates.lng}`,
              radius: 1000,
              type,
              key: this.googleApiKey
            }
          }
        )
        
        if (response.data.results) {
          const category = type === 'school' ? 'schools' :
                          type === 'hospital' ? 'hospitals' :
                          type === 'subway_station' ? 'transport' :
                          type === 'shopping_mall' ? 'shopping' :
                          'restaurants'
          
          amenities[category as keyof typeof amenities] = response.data.results.slice(0, 5)
        }
      }
    } catch (error) {
      logger.error('Error fetching nearby amenities:', error)
    }
    
    return amenities
  }

  /**
   * Get neighborhood information
   */
  private async getNeighborhoodInfo(coordinates: PropertyCoordinates): Promise<string | undefined> {
    if (!this.mapboxToken) return undefined
    
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.lng},${coordinates.lat}.json`,
        {
          params: {
            access_token: this.mapboxToken,
            types: 'neighborhood'
          }
        }
      )
      
      if (response.data.features && response.data.features.length > 0) {
        return response.data.features[0].text
      }
    } catch (error) {
      logger.error('Error fetching neighborhood info:', error)
    }
    
    return undefined
  }

  /**
   * Get commute data to major cities
   */
  private async getCommuteData(coordinates: PropertyCoordinates): Promise<any> {
    // Placeholder for commute data calculation
    // In production, you'd use routing APIs to calculate commute times
    return {}
  }

  /**
   * Enrich with market data
   */
  private async enrichWithMarketData(property: PropertyCreateInput): Promise<PropertyEnrichment> {
    const enrichment: PropertyEnrichment = {}
    
    try {
      // Calculate estimated market value
      if (property.price && property.sizeSqm && property.city) {
        const marketValue = await this.estimateMarketValue(property)
        enrichment.marketValue = marketValue
      }
      
      // Get neighborhood rating
      if (property.coordinates) {
        const neighborhood = await this.getNeighborhoodRating(property.coordinates)
        enrichment.neighborhood = neighborhood
      }
      
      // Calculate investment potential
      if (property.price && property.transactionType === 'sale') {
        const investment = await this.calculateInvestmentPotential(property)
        enrichment.investment = investment
      }
      
    } catch (error) {
      logger.error('Error enriching with market data:', error)
    }
    
    return enrichment
  }

  /**
   * Estimate market value
   */
  private async estimateMarketValue(property: PropertyCreateInput): Promise<any> {
    // Placeholder for market value estimation
    // In production, you'd use comparable sales data
    return {
      estimated: property.price! * 1.02, // Simple 2% markup
      confidence: 0.7,
      comparable: []
    }
  }

  /**
   * Get neighborhood rating
   */
  private async getNeighborhoodRating(coordinates: PropertyCoordinates): Promise<any> {
    // Placeholder for neighborhood rating
    return {
      name: 'Unknown',
      rating: 3.5,
      description: 'Mixed residential area',
      demographics: {}
    }
  }

  /**
   * Calculate investment potential
   */
  private async calculateInvestmentPotential(property: PropertyCreateInput): Promise<any> {
    // Placeholder for investment calculation
    return {
      rentalYield: 4.5,
      appreciation: 2.8,
      riskLevel: 'medium'
    }
  }

  /**
   * Generate seasonal insight
   */
  private async generateSeasonalInsight(weatherData: any, property: PropertyCreateInput): Promise<string | undefined> {
    if (!weatherData || !property.coordinates) return undefined
    
    // Generate basic seasonal insight
    const season = this.getCurrentSeason(new Date())
    const climate = this.analyzeClimate(weatherData)
    
    return `${season} climate: ${climate.description}. Average temperature: ${climate.avgTemp}°C`
  }

  /**
   * Get current season
   */
  private getCurrentSeason(date: Date): string {
    const month = date.getMonth()
    
    if (month >= 2 && month <= 4) return 'Spring'
    if (month >= 5 && month <= 7) return 'Summer'
    if (month >= 8 && month <= 10) return 'Autumn'
    return 'Winter'
  }

  /**
   * Analyze climate
   */
  private analyzeClimate(weatherData: any): { description: string; avgTemp: number } {
    const temp = weatherData.temp || 15
    
    let description = 'Mild'
    if (temp > 25) description = 'Warm'
    else if (temp > 15) description = 'Pleasant'
    else if (temp < 5) description = 'Cold'
    
    return {
      description,
      avgTemp: temp
    }
  }

  /**
   * Calculate enhanced quality score
   */
  private calculateEnhancedQualityScore(property: PropertyCreateInput): number {
    let score = 0
    let maxScore = 0
    
    // Basic information (30%)
    const basicFields = ['title', 'description', 'price', 'address']
    basicFields.forEach(field => {
      if (property[field as keyof PropertyCreateInput]) score += 7.5
      maxScore += 7.5
    })
    
    // Property details (25%)
    const detailFields = ['sizeSqm', 'rooms', 'bedrooms', 'bathrooms', 'propertyType']
    detailFields.forEach(field => {
      if (property[field as keyof PropertyCreateInput]) score += 5
      maxScore += 5
    })
    
    // Location data (20%)
    if (property.coordinates) score += 10
    if (property.city) score += 5
    if (property.region) score += 5
    maxScore += 20
    
    // Media (15%)
    if (property.photos && property.photos.length > 0) score += 10
    if (property.virtualTourUrl) score += 5
    maxScore += 15
    
    // Features and extras (10%)
    if (property.features && Object.keys(property.features).length > 0) score += 5
    if (property.energyRating) score += 3
    if (property.agentName) score += 2
    maxScore += 10
    
    return Math.round((score / maxScore) * 100) / 100
  }

  /**
   * Validate property data completeness
   */
  validatePropertyData(data: PropertyCreateInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!data.sourceUrl) errors.push('Source URL is required')
    if (!data.title) errors.push('Title is required')
    if (!data.price) errors.push('Price is required')
    if (!data.address) errors.push('Address is required')
    
    if (data.price && data.price <= 0) errors.push('Price must be greater than 0')
    if (data.sizeSqm && data.sizeSqm <= 0) errors.push('Size must be greater than 0')
    if (data.rooms && data.rooms <= 0) errors.push('Number of rooms must be greater than 0')
    
    if (data.coordinates) {
      const { lat, lng } = data.coordinates
      if (lat < -90 || lat > 90) errors.push('Invalid latitude')
      if (lng < -180 || lng > 180) errors.push('Invalid longitude')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}