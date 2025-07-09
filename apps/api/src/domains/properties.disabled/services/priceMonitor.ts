import { PrismaClient, Property } from '@prisma/client'
import { PropertyScraper } from './propertyScraper'
import { PropertyProcessor } from './propertyProcessor'
import { logger } from '../../../lib/logger'

interface PriceAlert {
  propertyId: string
  userId: string
  alertType: 'price_drop' | 'price_increase' | 'price_threshold'
  threshold?: number
  percentage?: number
  enabled: boolean
}

interface PriceChangeNotification {
  propertyId: string
  oldPrice: number
  newPrice: number
  changePercentage: number
  changeType: 'increase' | 'decrease'
  property: Property
}

export class PriceMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null
  
  constructor(
    private prisma: PrismaClient,
    private scraper: PropertyScraper,
    private processor: PropertyProcessor
  ) {}

  /**
   * Start price monitoring service
   */
  startMonitoring(intervalHours: number = 24): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }
    
    const intervalMs = intervalHours * 60 * 60 * 1000
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.runPriceCheck()
      } catch (error) {
        logger.error('Price monitoring error:', error)
      }
    }, intervalMs)
    
    logger.info(`Price monitoring started with ${intervalHours}h interval`)
  }

  /**
   * Stop price monitoring service
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      logger.info('Price monitoring stopped')
    }
  }

  /**
   * Run price check for all active properties
   */
  async runPriceCheck(): Promise<void> {
    logger.info('Starting price check cycle')
    
    try {
      // Get properties that need price updates
      const properties = await this.getPropertiesForPriceCheck()
      
      logger.info(`Checking prices for ${properties.length} properties`)
      
      // Process properties in batches to avoid overwhelming servers
      const batchSize = 10
      const batches = this.chunkArray(properties, batchSize)
      
      for (const batch of batches) {
        await this.processPriceBatch(batch)
        
        // Wait between batches to be respectful
        await this.delay(5000)
      }
      
      logger.info('Price check cycle completed')
    } catch (error) {
      logger.error('Price check cycle failed:', error)
    }
  }

  /**
   * Check price updates for specific properties
   */
  async checkPriceUpdates(propertyIds: string[]): Promise<PriceChangeNotification[]> {
    const notifications: PriceChangeNotification[] = []
    
    const properties = await this.prisma.property.findMany({
      where: { id: { in: propertyIds } }
    })
    
    for (const property of properties) {
      try {
        const notification = await this.checkSinglePropertyPrice(property)
        if (notification) {
          notifications.push(notification)
        }
      } catch (error) {
        logger.error(`Failed to check price for property ${property.id}:`, error)
      }
    }
    
    return notifications
  }

  /**
   * Analyze market trends for a location
   */
  async analyzeMarketTrends(location: string, propertyType?: string): Promise<any> {
    const where: any = {
      city: { contains: location, mode: 'insensitive' }
    }
    
    if (propertyType) {
      where.propertyType = propertyType
    }
    
    // Get properties with recent price history
    const properties = await this.prisma.property.findMany({
      where,
      include: {
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 10
        }
      }
    })
    
    if (properties.length === 0) {
      return {
        error: 'No properties found for analysis',
        location,
        propertyType
      }
    }
    
    // Calculate market metrics
    const currentPrices = properties.map(p => p.price?.toNumber() || 0).filter(p => p > 0)
    const averagePrice = currentPrices.reduce((sum, price) => sum + price, 0) / currentPrices.length
    
    // Price distribution
    const priceDistribution = this.calculatePriceDistribution(currentPrices)
    
    // Price trends over time
    const priceChanges = this.calculatePriceChanges(properties)
    
    // Market velocity (how fast properties are being updated)
    const marketVelocity = this.calculateMarketVelocity(properties)
    
    return {
      location,
      propertyType,
      totalProperties: properties.length,
      averagePrice,
      priceDistribution,
      priceChanges,
      marketVelocity,
      lastUpdated: new Date()
    }
  }

  /**
   * Get price change statistics
   */
  async getPriceChangeStats(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<any> {
    const timeframeMs = this.getTimeframeMs(timeframe)
    const cutoffDate = new Date(Date.now() - timeframeMs)
    
    const priceHistories = await this.prisma.propertyPriceHistory.findMany({
      where: {
        recordedAt: { gte: cutoffDate }
      },
      include: {
        property: {
          select: {
            id: true,
            city: true,
            country: true,
            propertyType: true
          }
        }
      },
      orderBy: { recordedAt: 'desc' }
    })
    
    // Group by property and calculate changes
    const propertyChanges = new Map<string, any[]>()
    
    priceHistories.forEach(history => {
      const propertyId = history.propertyId
      if (!propertyChanges.has(propertyId)) {
        propertyChanges.set(propertyId, [])
      }
      propertyChanges.get(propertyId)!.push(history)
    })
    
    const stats = {
      totalProperties: propertyChanges.size,
      priceIncreases: 0,
      priceDecreases: 0,
      noChange: 0,
      averageChange: 0,
      biggestIncrease: 0,
      biggestDecrease: 0,
      changesByLocation: new Map<string, any>(),
      changesByType: new Map<string, any>()
    }
    
    let totalChange = 0
    let changeCount = 0
    
    propertyChanges.forEach((histories, propertyId) => {
      if (histories.length < 2) return
      
      const latest = histories[0]
      const previous = histories[histories.length - 1]
      
      const change = latest.price.toNumber() - previous.price.toNumber()
      const changePercentage = (change / previous.price.toNumber()) * 100
      
      if (change > 0) {
        stats.priceIncreases++
        if (changePercentage > stats.biggestIncrease) {
          stats.biggestIncrease = changePercentage
        }
      } else if (change < 0) {
        stats.priceDecreases++
        if (changePercentage < stats.biggestDecrease) {
          stats.biggestDecrease = changePercentage
        }
      } else {
        stats.noChange++
      }
      
      totalChange += changePercentage
      changeCount++
      
      // Group by location
      const location = latest.property.city || 'Unknown'
      this.updateLocationStats(stats.changesByLocation, location, changePercentage)
      
      // Group by type
      const type = latest.property.propertyType || 'Unknown'
      this.updateTypeStats(stats.changesByType, type, changePercentage)
    })
    
    stats.averageChange = changeCount > 0 ? totalChange / changeCount : 0
    
    return {
      timeframe,
      stats,
      generatedAt: new Date()
    }
  }

  /**
   * Set up price alerts for user
   */
  async setupPriceAlert(
    propertyId: string,
    userId: string,
    alertConfig: Partial<PriceAlert>
  ): Promise<void> {
    // Store alert configuration in database
    // This would typically be a separate table
    const alertData = {
      propertyId,
      userId,
      alertType: alertConfig.alertType || 'price_drop',
      threshold: alertConfig.threshold,
      percentage: alertConfig.percentage,
      enabled: alertConfig.enabled !== false
    }
    
    // For now, store in property metadata
    await this.prisma.userSavedProperty.updateMany({
      where: { propertyId, userId },
      data: {
        personalNotes: JSON.stringify({ priceAlert: alertData })
      }
    })
    
    logger.info(`Price alert set up for property ${propertyId} by user ${userId}`)
  }

  // Private helper methods

  private async getPropertiesForPriceCheck(): Promise<Property[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    return this.prisma.property.findMany({
      where: {
        AND: [
          { listingStatus: 'active' },
          {
            OR: [
              { lastPriceCheck: { lte: oneDayAgo } },
              { lastPriceCheck: null }
            ]
          },
          { firstScrapedAt: { gte: oneWeekAgo } }
        ]
      },
      orderBy: { lastPriceCheck: 'asc' }
    })
  }

  private async processPriceBatch(properties: Property[]): Promise<void> {
    const promises = properties.map(property => this.checkSinglePropertyPrice(property))
    await Promise.allSettled(promises)
  }

  private async checkSinglePropertyPrice(property: Property): Promise<PriceChangeNotification | null> {
    try {
      // Re-scrape the property
      const scrapedData = await this.scraper.scrapeProperty(property.sourceUrl)
      
      if (!scrapedData.price) {
        logger.warn(`No price found for property ${property.id}`)
        return null
      }
      
      const newPrice = scrapedData.price
      const oldPrice = property.price?.toNumber() || 0
      
      // Check if price has changed
      if (Math.abs(newPrice - oldPrice) < 0.01) {
        // Update last check time
        await this.prisma.property.update({
          where: { id: property.id },
          data: { lastPriceCheck: new Date() }
        })
        return null
      }
      
      // Calculate change percentage
      const changePercentage = ((newPrice - oldPrice) / oldPrice) * 100
      
      // Update property with new price
      await this.prisma.property.update({
        where: { id: property.id },
        data: {
          price: newPrice,
          lastPriceCheck: new Date()
        }
      })
      
      // Add to price history
      await this.prisma.propertyPriceHistory.create({
        data: {
          propertyId: property.id,
          price: newPrice,
          priceChangePercentage: changePercentage
        }
      })
      
      logger.info(`Price updated for property ${property.id}: ${oldPrice} → ${newPrice} (${changePercentage.toFixed(2)}%)`)
      
      return {
        propertyId: property.id,
        oldPrice,
        newPrice,
        changePercentage,
        changeType: newPrice > oldPrice ? 'increase' : 'decrease',
        property
      }
      
    } catch (error) {
      logger.error(`Price check failed for property ${property.id}:`, error)
      
      // Update last check time even on failure to avoid constant retries
      await this.prisma.property.update({
        where: { id: property.id },
        data: { lastPriceCheck: new Date() }
      })
      
      return null
    }
  }

  private calculatePriceDistribution(prices: number[]): any {
    const sortedPrices = [...prices].sort((a, b) => a - b)
    const length = sortedPrices.length
    
    return {
      min: sortedPrices[0],
      max: sortedPrices[length - 1],
      median: length % 2 === 0 
        ? (sortedPrices[length / 2 - 1] + sortedPrices[length / 2]) / 2
        : sortedPrices[Math.floor(length / 2)],
      q1: sortedPrices[Math.floor(length * 0.25)],
      q3: sortedPrices[Math.floor(length * 0.75)]
    }
  }

  private calculatePriceChanges(properties: Property[]): any {
    const changes: number[] = []
    
    properties.forEach(property => {
      if (property.priceHistory && property.priceHistory.length >= 2) {
        const latest = property.priceHistory[0]
        const previous = property.priceHistory[1]
        
        const change = ((latest.price.toNumber() - previous.price.toNumber()) / previous.price.toNumber()) * 100
        changes.push(change)
      }
    })
    
    if (changes.length === 0) return null
    
    const averageChange = changes.reduce((sum, change) => sum + change, 0) / changes.length
    const positiveChanges = changes.filter(c => c > 0).length
    const negativeChanges = changes.filter(c => c < 0).length
    
    return {
      averageChange,
      positiveChanges,
      negativeChanges,
      totalChanges: changes.length,
      trend: averageChange > 0 ? 'increasing' : averageChange < 0 ? 'decreasing' : 'stable'
    }
  }

  private calculateMarketVelocity(properties: Property[]): any {
    const now = new Date()
    const updates = properties.map(p => {
      const lastUpdate = p.lastPriceCheck || p.firstScrapedAt
      const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60)
      return hoursSinceUpdate
    })
    
    const averageUpdateInterval = updates.reduce((sum, hours) => sum + hours, 0) / updates.length
    
    return {
      averageUpdateInterval,
      freshListings: updates.filter(h => h < 24).length,
      staleListings: updates.filter(h => h > 168).length // 1 week
    }
  }

  private updateLocationStats(locationMap: Map<string, any>, location: string, change: number): void {
    if (!locationMap.has(location)) {
      locationMap.set(location, { count: 0, totalChange: 0, averageChange: 0 })
    }
    
    const stats = locationMap.get(location)!
    stats.count++
    stats.totalChange += change
    stats.averageChange = stats.totalChange / stats.count
  }

  private updateTypeStats(typeMap: Map<string, any>, type: string, change: number): void {
    if (!typeMap.has(type)) {
      typeMap.set(type, { count: 0, totalChange: 0, averageChange: 0 })
    }
    
    const stats = typeMap.get(type)!
    stats.count++
    stats.totalChange += change
    stats.averageChange = stats.totalChange / stats.count
  }

  private getTimeframeMs(timeframe: 'week' | 'month' | 'quarter'): number {
    switch (timeframe) {
      case 'week':
        return 7 * 24 * 60 * 60 * 1000
      case 'month':
        return 30 * 24 * 60 * 60 * 1000
      case 'quarter':
        return 90 * 24 * 60 * 60 * 1000
      default:
        return 30 * 24 * 60 * 60 * 1000
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}