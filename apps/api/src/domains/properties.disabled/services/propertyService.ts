import { PrismaClient, Property, UserSavedProperty, PropertyPriceHistory } from '@prisma/client'
import { PropertyScraper } from './propertyScraper'
import { PropertyProcessor } from './propertyProcessor'
import { PriceMonitor } from './priceMonitor'
import { 
  PropertyCreateInput, 
  PropertyUpdateInput, 
  PropertySearchFilters, 
  PropertyImportInput, 
  PropertyImportResult, 
  PropertyValidationResult,
  PropertyComparison,
  PropertyComparisonCriteria,
  UserSavedPropertyInput,
  UserSavedPropertyUpdateInput,
  BulkImportInput,
  BulkImportResult,
  PropertyAnalytics
} from '../types/property.types'
import { redis } from '../../../lib/redis'
import { logger } from '../../../lib/logger'

export class PropertyService {
  constructor(
    private prisma: PrismaClient,
    private scraper: PropertyScraper,
    private processor: PropertyProcessor,
    private priceMonitor: PriceMonitor
  ) {}

  /**
   * Import a property from URL
   */
  async importProperty(input: PropertyImportInput): Promise<PropertyImportResult> {
    const startTime = Date.now()
    
    try {
      logger.info(`Starting property import from: ${input.url}`)
      
      // Check if property already exists
      const existingProperty = await this.prisma.property.findUnique({
        where: { sourceUrl: input.url }
      })
      
      if (existingProperty) {
        // Update existing property
        const updatedProperty = await this.refreshProperty(existingProperty.id)
        
        // Auto-save if requested
        if (input.autoSave) {
          await this.savePropertyForUser(updatedProperty.id, input.userId, {
            customTags: input.tags,
            personalNotes: input.notes
          })
        }
        
        return {
          success: true,
          property: updatedProperty,
          processingTime: Date.now() - startTime
        }
      }
      
      // Scrape property data
      const scrapedData = await this.scraper.scrapeProperty(input.url)
      
      // Process and normalize data
      const processedData = await this.processor.normalizePropertyData(
        scrapedData, 
        scrapedData.sourcePlatform!
      )
      
      // Enrich with additional data
      const enrichedData = await this.processor.enrichPropertyData(processedData)
      
      // Validate data
      const validation = this.processor.validatePropertyData(enrichedData)
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          processingTime: Date.now() - startTime
        }
      }
      
      // Save to database
      const property = await this.createProperty(enrichedData)
      
      // Auto-save if requested
      if (input.autoSave) {
        await this.savePropertyForUser(property.id, input.userId, {
          customTags: input.tags,
          personalNotes: input.notes
        })
      }
      
      // Cache the property
      await this.cacheProperty(property)
      
      logger.info(`Successfully imported property: ${property.id}`)
      
      return {
        success: true,
        property,
        processingTime: Date.now() - startTime
      }
      
    } catch (error) {
      logger.error(`Property import failed for ${input.url}:`, error)
      
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Bulk import properties
   */
  async bulkImportProperties(input: BulkImportInput): Promise<BulkImportResult> {
    const results: PropertyImportResult[] = []
    const errors: string[] = []
    let successful = 0
    let failed = 0
    
    logger.info(`Starting bulk import of ${input.urls.length} properties`)
    
    // Process properties with concurrency limit
    const concurrencyLimit = 3
    const chunks = this.chunkArray(input.urls, concurrencyLimit)
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(url =>
        this.importProperty({
          url,
          userId: input.userId,
          autoSave: input.autoSave,
          tags: input.tags,
          notes: input.notes
        })
      )
      
      const chunkResults = await Promise.allSettled(chunkPromises)
      
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
          if (result.value.success) {
            successful++
          } else {
            failed++
            errors.push(...(result.value.errors || []))
          }
        } else {
          failed++
          errors.push(`Failed to import ${chunk[index]}: ${result.reason}`)
        }
      })
    }
    
    logger.info(`Bulk import completed: ${successful} successful, ${failed} failed`)
    
    return {
      totalUrls: input.urls.length,
      successful,
      failed,
      results,
      errors
    }
  }

  /**
   * Validate property URL
   */
  async validatePropertyUrl(url: string): Promise<PropertyValidationResult> {
    return this.scraper.validateUrl(url)
  }

  /**
   * Get supported platforms
   */
  async getSupportedPlatforms(): Promise<any[]> {
    return this.scraper.getSupportedPlatforms()
  }

  /**
   * Create property in database
   */
  async createProperty(data: PropertyCreateInput): Promise<Property> {
    const property = await this.prisma.property.create({
      data: {
        sourceUrl: data.sourceUrl,
        sourcePlatform: data.sourcePlatform,
        externalId: data.externalId,
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        transactionType: data.transactionType,
        price: data.price,
        currency: data.currency,
        pricePerSqm: data.pricePerSqm,
        monthlyCharges: data.monthlyCharges,
        sizeSqm: data.sizeSqm,
        rooms: data.rooms,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        floorNumber: data.floorNumber,
        totalFloors: data.totalFloors,
        yearBuilt: data.yearBuilt,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        region: data.region,
        country: data.country,
        coordinates: data.coordinates,
        features: data.features,
        energyRating: data.energyRating,
        photos: data.photos,
        virtualTourUrl: data.virtualTourUrl,
        floorPlanUrl: data.floorPlanUrl,
        agentName: data.agentName,
        agentPhone: data.agentPhone,
        agentEmail: data.agentEmail,
        agencyName: data.agencyName,
        dataQualityScore: data.dataQualityScore,
        scrapingErrors: data.scrapingErrors
      }
    })
    
    // Create initial price history entry
    if (data.price) {
      await this.prisma.propertyPriceHistory.create({
        data: {
          propertyId: property.id,
          price: data.price
        }
      })
    }
    
    return property
  }

  /**
   * Update property
   */
  async updateProperty(id: string, data: PropertyUpdateInput): Promise<Property> {
    const existingProperty = await this.prisma.property.findUnique({
      where: { id }
    })
    
    if (!existingProperty) {
      throw new Error('Property not found')
    }
    
    // Check for price change
    if (data.price && data.price !== existingProperty.price?.toNumber()) {
      await this.prisma.propertyPriceHistory.create({
        data: {
          propertyId: id,
          price: data.price,
          priceChangePercentage: existingProperty.price 
            ? ((data.price - existingProperty.price.toNumber()) / existingProperty.price.toNumber()) * 100
            : undefined
        }
      })
    }
    
    const updatedProperty = await this.prisma.property.update({
      where: { id },
      data: {
        ...data,
        lastPriceCheck: new Date()
      }
    })
    
    // Invalidate cache
    await this.invalidatePropertyCache(id)
    
    return updatedProperty
  }

  /**
   * Get property by ID
   */
  async getProperty(id: string): Promise<Property | null> {
    // Try cache first
    const cached = await this.getCachedProperty(id)
    if (cached) return cached
    
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 10
        }
      }
    })
    
    if (property) {
      await this.cacheProperty(property)
    }
    
    return property
  }

  /**
   * Search properties
   */
  async searchProperties(filters: PropertySearchFilters): Promise<{
    properties: Property[]
    total: number
    hasMore: boolean
  }> {
    const where: any = {}
    
    // Build search filters
    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { address: { contains: filters.query, mode: 'insensitive' } }
      ]
    }
    
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' }
    if (filters.country) where.country = { contains: filters.country, mode: 'insensitive' }
    if (filters.region) where.region = { contains: filters.region, mode: 'insensitive' }
    if (filters.propertyType) where.propertyType = filters.propertyType
    if (filters.transactionType) where.transactionType = filters.transactionType
    
    if (filters.minPrice || filters.maxPrice) {
      where.price = {}
      if (filters.minPrice) where.price.gte = filters.minPrice
      if (filters.maxPrice) where.price.lte = filters.maxPrice
    }
    
    if (filters.minSize || filters.maxSize) {
      where.sizeSqm = {}
      if (filters.minSize) where.sizeSqm.gte = filters.minSize
      if (filters.maxSize) where.sizeSqm.lte = filters.maxSize
    }
    
    if (filters.minRooms) where.rooms = { gte: filters.minRooms }
    if (filters.minBedrooms) where.bedrooms = { gte: filters.minBedrooms }
    
    if (filters.features && filters.features.length > 0) {
      where.features = {
        path: filters.features,
        equals: true
      }
    }
    
    // Handle geospatial search
    if (filters.coordinates && filters.radius) {
      // This would require PostGIS - simplified for now
      where.coordinates = { not: null }
    }
    
    const limit = filters.limit || 20
    const offset = filters.offset || 0
    
    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        orderBy: this.buildOrderBy(filters.sortBy, filters.sortOrder),
        take: limit,
        skip: offset
      }),
      this.prisma.property.count({ where })
    ])
    
    return {
      properties,
      total,
      hasMore: offset + properties.length < total
    }
  }

  /**
   * Save property for user
   */
  async savePropertyForUser(
    propertyId: string, 
    userId: string, 
    input: UserSavedPropertyInput = {}
  ): Promise<UserSavedProperty> {
    const existingSaved = await this.prisma.userSavedProperty.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    })
    
    if (existingSaved) {
      return this.prisma.userSavedProperty.update({
        where: { id: existingSaved.id },
        data: input
      })
    }
    
    return this.prisma.userSavedProperty.create({
      data: {
        userId,
        propertyId,
        ...input
      }
    })
  }

  /**
   * Get user's saved properties
   */
  async getUserSavedProperties(userId: string, filters?: any): Promise<UserSavedProperty[]> {
    const where: any = { userId }
    
    if (filters?.visitStatus) where.visitStatus = filters.visitStatus
    if (filters?.priorityLevel) where.priorityLevel = filters.priorityLevel
    if (filters?.tags) where.customTags = { hasSome: filters.tags }
    
    return this.prisma.userSavedProperty.findMany({
      where,
      include: {
        property: true
      },
      orderBy: { savedAt: 'desc' }
    })
  }

  /**
   * Update saved property
   */
  async updateSavedProperty(
    id: string, 
    userId: string, 
    input: UserSavedPropertyUpdateInput
  ): Promise<UserSavedProperty> {
    const saved = await this.prisma.userSavedProperty.findFirst({
      where: { id, userId }
    })
    
    if (!saved) {
      throw new Error('Saved property not found')
    }
    
    return this.prisma.userSavedProperty.update({
      where: { id },
      data: input
    })
  }

  /**
   * Remove saved property
   */
  async removeSavedProperty(id: string, userId: string): Promise<void> {
    const saved = await this.prisma.userSavedProperty.findFirst({
      where: { id, userId }
    })
    
    if (!saved) {
      throw new Error('Saved property not found')
    }
    
    await this.prisma.userSavedProperty.delete({
      where: { id }
    })
  }

  /**
   * Compare properties
   */
  async compareProperties(
    propertyIds: string[], 
    criteria: PropertyComparisonCriteria = {}
  ): Promise<PropertyComparison> {
    const properties = await this.prisma.property.findMany({
      where: { id: { in: propertyIds } }
    })
    
    if (properties.length < 2) {
      throw new Error('At least 2 properties are required for comparison')
    }
    
    // Default criteria weights
    const defaultCriteria = {
      priceWeight: 0.3,
      sizeWeight: 0.2,
      locationWeight: 0.2,
      featuresWeight: 0.2,
      conditionWeight: 0.1
    }
    
    const finalCriteria = { ...defaultCriteria, ...criteria }
    
    // Calculate scores for each property
    const scores: any = {}
    let winner: string | undefined
    let highestScore = 0
    
    properties.forEach(property => {
      const score = this.calculatePropertyScore(property, properties, finalCriteria)
      scores[property.id] = score
      
      if (score.total > highestScore) {
        highestScore = score.total
        winner = property.id
      }
    })
    
    return {
      properties,
      criteria: finalCriteria,
      scores,
      winner
    }
  }

  /**
   * Get property price history
   */
  async getPropertyPriceHistory(propertyId: string): Promise<PropertyPriceHistory[]> {
    return this.prisma.propertyPriceHistory.findMany({
      where: { propertyId },
      orderBy: { recordedAt: 'desc' }
    })
  }

  /**
   * Get property analytics
   */
  async getPropertyAnalytics(filters: any = {}): Promise<PropertyAnalytics> {
    const where: any = {}
    
    if (filters.city) where.city = filters.city
    if (filters.country) where.country = filters.country
    if (filters.propertyType) where.propertyType = filters.propertyType
    
    const [avgPrice, totalListings, priceRange] = await Promise.all([
      this.prisma.property.aggregate({
        where,
        _avg: { price: true, pricePerSqm: true }
      }),
      this.prisma.property.count({ where }),
      this.prisma.property.aggregate({
        where,
        _min: { price: true },
        _max: { price: true }
      })
    ])
    
    return {
      averagePrice: avgPrice._avg.price?.toNumber() || 0,
      pricePerSqm: avgPrice._avg.pricePerSqm?.toNumber() || 0,
      totalListings,
      priceRange: {
        min: priceRange._min.price?.toNumber() || 0,
        max: priceRange._max.price?.toNumber() || 0
      },
      popularFeatures: await this.getPopularFeatures(where),
      marketTrends: await this.getMarketTrends(where)
    }
  }

  /**
   * Refresh property data
   */
  async refreshProperty(id: string): Promise<Property> {
    const property = await this.prisma.property.findUnique({
      where: { id }
    })
    
    if (!property) {
      throw new Error('Property not found')
    }
    
    try {
      // Re-scrape the property
      const scrapedData = await this.scraper.scrapeProperty(property.sourceUrl)
      
      // Process and update
      const processedData = await this.processor.normalizePropertyData(
        scrapedData,
        property.sourcePlatform!
      )
      
      const enrichedData = await this.processor.enrichPropertyData(processedData)
      
      return this.updateProperty(id, enrichedData)
    } catch (error) {
      logger.error(`Failed to refresh property ${id}:`, error)
      throw error
    }
  }

  // Private helper methods

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  private buildOrderBy(sortBy?: string, sortOrder?: 'asc' | 'desc'): any {
    const order = sortOrder || 'desc'
    
    switch (sortBy) {
      case 'price':
        return { price: order }
      case 'size':
        return { sizeSqm: order }
      case 'created_at':
        return { createdAt: order }
      case 'updated_at':
        return { updatedAt: order }
      default:
        return { createdAt: order }
    }
  }

  private calculatePropertyScore(
    property: Property, 
    allProperties: Property[], 
    criteria: PropertyComparisonCriteria
  ): any {
    const scores = {
      price: 0,
      size: 0,
      location: 0,
      features: 0,
      condition: 0,
      total: 0
    }
    
    // Price score (lower is better)
    if (property.price) {
      const prices = allProperties.map(p => p.price?.toNumber() || 0).filter(p => p > 0)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      scores.price = maxPrice > minPrice ? (maxPrice - property.price.toNumber()) / (maxPrice - minPrice) * 100 : 50
    }
    
    // Size score (higher is better)
    if (property.sizeSqm) {
      const sizes = allProperties.map(p => p.sizeSqm?.toNumber() || 0).filter(s => s > 0)
      const minSize = Math.min(...sizes)
      const maxSize = Math.max(...sizes)
      scores.size = maxSize > minSize ? (property.sizeSqm.toNumber() - minSize) / (maxSize - minSize) * 100 : 50
    }
    
    // Location score (placeholder)
    scores.location = 75
    
    // Features score
    const features = property.features as any
    if (features) {
      const featureCount = Object.values(features).filter(Boolean).length
      scores.features = Math.min(featureCount * 15, 100)
    }
    
    // Condition score (based on data quality)
    scores.condition = (property.dataQualityScore?.toNumber() || 0) * 100
    
    // Calculate total weighted score
    scores.total = 
      scores.price * criteria.priceWeight! +
      scores.size * criteria.sizeWeight! +
      scores.location * criteria.locationWeight! +
      scores.features * criteria.featuresWeight! +
      scores.condition * criteria.conditionWeight!
    
    return scores
  }

  private async getPopularFeatures(where: any): Promise<{ [key: string]: number }> {
    // Simplified feature analysis
    return {
      'parking': 75,
      'balcony': 60,
      'elevator': 45,
      'terrace': 30
    }
  }

  private async getMarketTrends(where: any): Promise<any> {
    // Simplified market trends
    return {
      priceChange: 2.5,
      period: '6 months'
    }
  }

  private async cacheProperty(property: Property): Promise<void> {
    const cacheKey = `property:${property.id}`
    await redis.setEx(cacheKey, 3600, JSON.stringify(property))
  }

  private async getCachedProperty(id: string): Promise<Property | null> {
    const cacheKey = `property:${id}`
    const cached = await redis.get(cacheKey)
    return cached ? JSON.parse(cached) : null
  }

  private async invalidatePropertyCache(id: string): Promise<void> {
    const cacheKey = `property:${id}`
    await redis.del(cacheKey)
  }
}