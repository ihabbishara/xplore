import { PrismaClient } from '@prisma/client'
import { 
  DashboardOverview,
  LocationMetrics,
  AnalyticsFilters,
  ExplorationInsightInput,
  RealtimeAnalyticsUpdate
} from '../types/analytics.types'
import { LocationAnalyticsService } from './locationAnalyticsService'
import { SentimentAnalysisService } from './sentimentAnalysisService'
import { CostIntelligenceService } from './costIntelligenceService'
import { redis } from '../../../lib/redis'
import { logger } from '../../../lib/logger'

interface DashboardCache {
  overview: DashboardOverview
  insights: any[]
  recommendations: any[]
  trends: any[]
  lastUpdated: Date
}

interface TimeSeriesData {
  date: Date
  value: number
  category?: string
}

interface DashboardFilters {
  dateRange?: {
    start: Date
    end: Date
  }
  locations?: string[]
  categories?: string[]
  sentiment?: {
    min: number
    max: number
  }
}

export class DashboardService {
  private readonly CACHE_TTL = 1800 // 30 minutes
  private readonly INSIGHTS_LIMIT = 10
  private readonly TRENDS_PERIOD_DAYS = 30

  constructor(
    private prisma: PrismaClient,
    private locationAnalyticsService: LocationAnalyticsService,
    private sentimentAnalysisService: SentimentAnalysisService,
    private costIntelligenceService: CostIntelligenceService
  ) {}

  /**
   * Get comprehensive dashboard overview
   */
  async getDashboardOverview(
    userId: string,
    filters?: DashboardFilters
  ): Promise<DashboardOverview> {
    try {
      const cacheKey = `dashboard_overview:${userId}:${JSON.stringify(filters || {})}`
      
      // Try cache first
      const cached = await redis.get(cacheKey)
      if (cached) {
        const cachedData = JSON.parse(cached)
        return cachedData
      }

      // Build base query filters
      const dateFilter = filters?.dateRange ? {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      } : undefined

      const locationFilter = filters?.locations?.length ? {
        in: filters.locations
      } : undefined

      // Get basic stats
      const [
        totalLocations,
        totalTrips,
        totalJournalEntries,
        totalTimeSpent,
        recentInsights,
        upcomingTrips
      ] = await Promise.all([
        this.getTotalLocations(userId, locationFilter),
        this.getTotalTrips(userId, dateFilter),
        this.getTotalJournalEntries(userId, dateFilter, locationFilter),
        this.getTotalTimeSpent(userId, dateFilter, locationFilter),
        this.getRecentInsights(userId, this.INSIGHTS_LIMIT),
        this.getUpcomingTrips(userId, 5)
      ])

      // Get top locations
      const topLocations = await this.getTopLocations(userId, locationFilter, 5)

      // Calculate average sentiment
      const averageSentiment = await this.calculateAverageSentiment(
        userId, 
        dateFilter, 
        locationFilter
      )

      // Get cost summary
      const costSummary = await this.getCostSummary(userId, dateFilter, locationFilter)

      // Get preferences
      const [weatherPreferences, activityPreferences] = await Promise.all([
        this.getWeatherPreferences(userId, dateFilter, locationFilter),
        this.getActivityPreferences(userId, dateFilter, locationFilter)
      ])

      const overview: DashboardOverview = {
        totalLocations,
        totalTrips,
        totalJournalEntries,
        totalTimeSpent,
        averageSentiment,
        topLocations,
        recentInsights,
        upcomingTrips,
        costSummary,
        weatherPreferences,
        activityPreferences
      }

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(overview))

      return overview
    } catch (error) {
      logger.error('Error getting dashboard overview:', error)
      throw error
    }
  }

  /**
   * Get dashboard insights
   */
  async getDashboardInsights(
    userId: string,
    filters?: AnalyticsFilters
  ): Promise<{
    insights: Array<{
      id: string
      type: string
      title: string
      content: string
      confidence: number
      actionable: boolean
      createdAt: Date
      relatedLocations?: string[]
    }>
    total: number
    hasMore: boolean
  }> {
    try {
      const where = {
        userId,
        ...(filters?.dateFrom && { createdAt: { gte: filters.dateFrom } }),
        ...(filters?.dateTo && { createdAt: { lte: filters.dateTo } }),
        ...(filters?.categories && { category: { in: filters.categories } })
      }

      const [insights, total] = await Promise.all([
        this.prisma.explorationInsight.findMany({
          where,
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
          take: filters?.limit || 20,
          skip: filters?.offset || 0
        }),
        this.prisma.explorationInsight.count({ where })
      ])

      return {
        insights: insights.map(insight => ({
          id: insight.id,
          type: insight.insightType,
          title: insight.title,
          content: insight.content,
          confidence: insight.confidence,
          actionable: insight.actionable,
          createdAt: insight.createdAt,
          relatedLocations: insight.relatedLocations
        })),
        total,
        hasMore: (filters?.offset || 0) + insights.length < total
      }
    } catch (error) {
      logger.error('Error getting dashboard insights:', error)
      throw error
    }
  }

  /**
   * Get sentiment trends over time
   */
  async getSentimentTrends(
    userId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month',
    locationId?: string
  ): Promise<{
    trends: TimeSeriesData[]
    overall: {
      current: number
      previous: number
      change: number
      changePercent: number
    }
    breakdown: {
      positive: number
      neutral: number
      negative: number
    }
  }> {
    try {
      const periodDays = {
        week: 7,
        month: 30,
        quarter: 90,
        year: 365
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - periodDays[period])

      // Get journal entries for the period
      const journalEntries = await this.prisma.journalEntry.findMany({
        where: {
          userId,
          ...(locationId && { locationId }),
          createdAt: { gte: startDate }
        },
        select: {
          content: true,
          createdAt: true,
          locationId: true
        },
        orderBy: { createdAt: 'asc' }
      })

      // Analyze sentiment for each entry
      const sentimentData = await Promise.all(
        journalEntries.map(async (entry) => {
          const sentiment = await this.sentimentAnalysisService.analyzeSentiment({
            text: entry.content
          })
          return {
            date: entry.createdAt,
            sentiment: sentiment.score,
            label: sentiment.label
          }
        })
      )

      // Group by time periods
      const groupedData = this.groupDataByTimePeriod(sentimentData, period)

      // Calculate trends
      const trends: TimeSeriesData[] = groupedData.map(group => ({
        date: group.date,
        value: group.averageSentiment || 0
      }))

      // Calculate overall metrics
      const currentPeriodData = sentimentData.slice(-Math.floor(sentimentData.length / 2))
      const previousPeriodData = sentimentData.slice(0, Math.floor(sentimentData.length / 2))

      const current = currentPeriodData.reduce((sum, d) => sum + d.sentiment, 0) / currentPeriodData.length || 0
      const previous = previousPeriodData.reduce((sum, d) => sum + d.sentiment, 0) / previousPeriodData.length || 0
      const change = current - previous
      const changePercent = previous !== 0 ? (change / Math.abs(previous)) * 100 : 0

      // Calculate breakdown
      const totalEntries = sentimentData.length
      const breakdown = {
        positive: sentimentData.filter(d => d.label === 'positive').length / totalEntries,
        neutral: sentimentData.filter(d => d.label === 'neutral').length / totalEntries,
        negative: sentimentData.filter(d => d.label === 'negative').length / totalEntries
      }

      return {
        trends,
        overall: {
          current,
          previous,
          change,
          changePercent
        },
        breakdown
      }
    } catch (error) {
      logger.error('Error getting sentiment trends:', error)
      throw error
    }
  }

  /**
   * Get cost trends over time
   */
  async getCostTrends(
    userId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<{
    trends: TimeSeriesData[]
    categories: Record<string, TimeSeriesData[]>
    projections: {
      nextMonth: number
      nextQuarter: number
      confidence: number
    }
  }> {
    try {
      const periodDays = {
        week: 7,
        month: 30,
        quarter: 90,
        year: 365
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - periodDays[period])

      // Get location analytics with cost data
      const locationAnalytics = await this.prisma.locationAnalytics.findMany({
        where: {
          userId,
          lastCalculated: { gte: startDate }
        },
        select: {
          locationId: true,
          costBreakdown: true,
          averageCostRating: true,
          lastCalculated: true,
          location: {
            select: {
              name: true,
              country: true
            }
          }
        },
        orderBy: { lastCalculated: 'asc' }
      })

      // Process cost data
      const costData = locationAnalytics.map(analytics => {
        const breakdown = analytics.costBreakdown as any
        const totalCost = breakdown ? Object.values(breakdown).reduce((sum: number, cost: any) => sum + (cost || 0), 0) : 0
        
        return {
          date: analytics.lastCalculated,
          totalCost,
          breakdown: breakdown || {},
          locationId: analytics.locationId,
          locationName: analytics.location?.name || 'Unknown'
        }
      })

      // Group by time periods
      const groupedData = this.groupCostDataByTimePeriod(costData, period)

      // Calculate trends
      const trends: TimeSeriesData[] = groupedData.map(group => ({
        date: group.date,
        value: group.averageCost || 0
      }))

      // Calculate category trends
      const categories: Record<string, TimeSeriesData[]> = {}
      const costCategories = ['housing', 'food', 'transportation', 'utilities', 'entertainment', 'miscellaneous']
      
      for (const category of costCategories) {
        categories[category] = groupedData.map(group => ({
          date: group.date,
          value: group.categoryAverages[category] || 0
        }))
      }

      // Simple projection (can be enhanced with ML)
      const recentTrends = trends.slice(-6) // Last 6 data points
      const avgGrowth = this.calculateAverageGrowthRate(recentTrends)
      const currentCost = trends[trends.length - 1]?.value || 0

      const projections = {
        nextMonth: currentCost * (1 + avgGrowth),
        nextQuarter: currentCost * Math.pow(1 + avgGrowth, 3),
        confidence: Math.min(0.8, recentTrends.length / 6) // Based on data availability
      }

      return {
        trends,
        categories,
        projections
      }
    } catch (error) {
      logger.error('Error getting cost trends:', error)
      throw error
    }
  }

  /**
   * Get location comparison dashboard
   */
  async getLocationComparison(
    userId: string,
    locationIds: string[],
    criteria: string[] = ['cost', 'climate', 'culture', 'safety', 'transport']
  ): Promise<{
    locations: Record<string, {
      id: string
      name: string
      country: string
      metrics: LocationMetrics
      scores: Record<string, number>
      ranking: number
    }>
    comparison: {
      winner: string
      summary: string
      recommendations: string[]
    }
  }> {
    try {
      // Get location data
      const locations = await this.prisma.location.findMany({
        where: { id: { in: locationIds } },
        select: {
          id: true,
          name: true,
          country: true,
          city: true
        }
      })

      // Get metrics for each location
      const locationData: Record<string, any> = {}
      
      for (const location of locations) {
        const metrics = await this.locationAnalyticsService.calculateLocationMetrics(location.id, userId)
        
        const scores: Record<string, number> = {}
        for (const criterion of criteria) {
          scores[criterion] = this.getScoreForCriterion(metrics, criterion)
        }
        
        locationData[location.id] = {
          id: location.id,
          name: location.name,
          country: location.country,
          metrics,
          scores,
          ranking: 0 // Will be calculated below
        }
      }

      // Calculate rankings
      const sortedLocations = Object.entries(locationData).sort(([, a], [, b]) => {
        const aTotal = Object.values(a.scores).reduce((sum: number, score: number) => sum + score, 0)
        const bTotal = Object.values(b.scores).reduce((sum: number, score: number) => sum + score, 0)
        return bTotal - aTotal
      })

      // Assign rankings
      sortedLocations.forEach(([locationId], index) => {
        locationData[locationId].ranking = index + 1
      })

      const winner = sortedLocations[0][0]
      const winnerData = locationData[winner]

      // Generate summary and recommendations
      const summary = `${winnerData.name} ranks highest with strong performance across multiple criteria`
      const recommendations = [
        `Consider ${winnerData.name} for your next exploration`,
        `${winnerData.name} shows excellent ${Object.entries(winnerData.scores).filter(([, score]) => score > 0.7).map(([criterion]) => criterion).join(', ')}`
      ]

      return {
        locations: locationData,
        comparison: {
          winner,
          summary,
          recommendations
        }
      }
    } catch (error) {
      logger.error('Error getting location comparison:', error)
      throw error
    }
  }

  /**
   * Generate insights for dashboard
   */
  async generateInsights(userId: string): Promise<void> {
    try {
      // Get user's recent activity
      const recentActivity = await this.getUserRecentActivity(userId)
      
      // Generate different types of insights
      const insights = await Promise.all([
        this.generatePatternInsights(userId, recentActivity),
        this.generateRecommendationInsights(userId, recentActivity),
        this.generateWarningInsights(userId, recentActivity),
        this.generatePredictionInsights(userId, recentActivity)
      ])

      // Flatten and save insights
      const allInsights = insights.flat()
      
      for (const insight of allInsights) {
        await this.prisma.explorationInsight.create({
          data: insight
        })
      }

      logger.info(`Generated ${allInsights.length} insights for user ${userId}`)
    } catch (error) {
      logger.error('Error generating insights:', error)
      throw error
    }
  }

  /**
   * Update dashboard cache
   */
  async updateDashboardCache(userId: string): Promise<void> {
    try {
      const overview = await this.getDashboardOverview(userId)
      const insights = await this.getDashboardInsights(userId)
      
      const cacheData: DashboardCache = {
        overview,
        insights: insights.insights,
        recommendations: [], // Will be populated by recommendation service
        trends: [], // Will be populated by trend analysis
        lastUpdated: new Date()
      }

      await this.prisma.dashboardCache.upsert({
        where: { userId },
        update: {
          cacheData: cacheData as any,
          lastUpdated: new Date()
        },
        create: {
          userId,
          cacheData: cacheData as any
        }
      })
    } catch (error) {
      logger.error('Error updating dashboard cache:', error)
      throw error
    }
  }

  // Private helper methods

  private async getTotalLocations(userId: string, locationFilter?: any): Promise<number> {
    return this.prisma.userSavedLocation.count({
      where: {
        userId,
        ...(locationFilter && { locationId: locationFilter })
      }
    })
  }

  private async getTotalTrips(userId: string, dateFilter?: any): Promise<number> {
    return this.prisma.trip.count({
      where: {
        userId,
        ...(dateFilter && { startDate: dateFilter })
      }
    })
  }

  private async getTotalJournalEntries(userId: string, dateFilter?: any, locationFilter?: any): Promise<number> {
    return this.prisma.journalEntry.count({
      where: {
        userId,
        ...(dateFilter && { createdAt: dateFilter }),
        ...(locationFilter && { locationId: locationFilter })
      }
    })
  }

  private async getTotalTimeSpent(userId: string, dateFilter?: any, locationFilter?: any): Promise<number> {
    const trips = await this.prisma.trip.findMany({
      where: {
        userId,
        ...(dateFilter && { startDate: dateFilter })
      },
      include: {
        destinations: {
          where: locationFilter ? { locationId: locationFilter } : undefined
        }
      }
    })

    let totalTime = 0
    for (const trip of trips) {
      for (const destination of trip.destinations) {
        const arrival = new Date(destination.arrivalDate)
        const departure = new Date(destination.departureDate)
        totalTime += (departure.getTime() - arrival.getTime()) / 1000 // Convert to seconds
      }
    }

    return totalTime
  }

  private async getTopLocations(userId: string, locationFilter?: any, limit = 5): Promise<Array<{
    locationId: string
    name: string
    score: number
    visits: number
  }>> {
    const analytics = await this.prisma.locationAnalytics.findMany({
      where: {
        userId,
        ...(locationFilter && { locationId: locationFilter })
      },
      include: {
        location: {
          select: {
            name: true,
            country: true
          }
        }
      },
      orderBy: { comparisonScore: 'desc' },
      take: limit
    })

    return analytics.map(analytic => ({
      locationId: analytic.locationId,
      name: analytic.location?.name || 'Unknown',
      score: analytic.comparisonScore || 0,
      visits: analytic.totalVisits
    }))
  }

  private async calculateAverageSentiment(userId: string, dateFilter?: any, locationFilter?: any): Promise<number> {
    const analytics = await this.prisma.locationAnalytics.findMany({
      where: {
        userId,
        ...(dateFilter && { lastCalculated: dateFilter }),
        ...(locationFilter && { locationId: locationFilter })
      },
      select: {
        averageSentiment: true
      }
    })

    if (analytics.length === 0) return 0

    const totalSentiment = analytics.reduce((sum, analytic) => sum + (analytic.averageSentiment || 0), 0)
    return totalSentiment / analytics.length
  }

  private async getCostSummary(userId: string, dateFilter?: any, locationFilter?: any): Promise<{
    totalSpent: number
    averageDaily: number
    topCategories: Record<string, number>
  }> {
    const analytics = await this.prisma.locationAnalytics.findMany({
      where: {
        userId,
        ...(dateFilter && { lastCalculated: dateFilter }),
        ...(locationFilter && { locationId: locationFilter })
      },
      select: {
        costBreakdown: true,
        totalTimeSpent: true
      }
    })

    let totalSpent = 0
    let totalDays = 0
    const categoryTotals: Record<string, number> = {}

    for (const analytic of analytics) {
      const breakdown = analytic.costBreakdown as any
      if (breakdown) {
        for (const [category, cost] of Object.entries(breakdown)) {
          if (typeof cost === 'number') {
            totalSpent += cost
            categoryTotals[category] = (categoryTotals[category] || 0) + cost
          }
        }
      }
      
      totalDays += Number(analytic.totalTimeSpent) / (24 * 3600) // Convert seconds to days
    }

    return {
      totalSpent,
      averageDaily: totalDays > 0 ? totalSpent / totalDays : 0,
      topCategories: categoryTotals
    }
  }

  private async getWeatherPreferences(userId: string, dateFilter?: any, locationFilter?: any): Promise<Record<string, number>> {
    // This would analyze weather conditions from user's visited locations
    // For now, return default preferences
    return {
      temperature: 22, // Preferred temperature
      humidity: 60,
      precipitation: 0.3,
      sunshine: 0.7
    }
  }

  private async getActivityPreferences(userId: string, dateFilter?: any, locationFilter?: any): Promise<Record<string, number>> {
    const analytics = await this.prisma.locationAnalytics.findMany({
      where: {
        userId,
        ...(dateFilter && { lastCalculated: dateFilter }),
        ...(locationFilter && { locationId: locationFilter })
      },
      select: {
        activityPreferences: true
      }
    })

    if (analytics.length === 0) {
      return {
        outdoor: 0.5,
        cultural: 0.5,
        food: 0.5,
        nightlife: 0.5,
        shopping: 0.5,
        relaxation: 0.5
      }
    }

    const aggregated: Record<string, number> = {}
    let count = 0

    for (const analytic of analytics) {
      const preferences = analytic.activityPreferences as any
      if (preferences) {
        for (const [activity, score] of Object.entries(preferences)) {
          if (typeof score === 'number') {
            aggregated[activity] = (aggregated[activity] || 0) + score
          }
        }
        count++
      }
    }

    // Average the preferences
    for (const activity in aggregated) {
      aggregated[activity] = aggregated[activity] / count
    }

    return aggregated
  }

  private async getRecentInsights(userId: string, limit: number): Promise<Array<{
    id: string
    type: string
    title: string
    confidence: number
    createdAt: Date
  }>> {
    const insights = await this.prisma.explorationInsight.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        insightType: true,
        title: true,
        confidence: true,
        createdAt: true
      }
    })

    return insights.map(insight => ({
      id: insight.id,
      type: insight.insightType,
      title: insight.title,
      confidence: insight.confidence,
      createdAt: insight.createdAt
    }))
  }

  private async getUpcomingTrips(userId: string, limit: number): Promise<Array<{
    id: string
    name: string
    startDate: Date
    destinations: number
  }>> {
    const trips = await this.prisma.trip.findMany({
      where: {
        userId,
        startDate: { gt: new Date() }
      },
      include: {
        destinations: true
      },
      orderBy: { startDate: 'asc' },
      take: limit
    })

    return trips.map(trip => ({
      id: trip.id,
      name: trip.name,
      startDate: trip.startDate,
      destinations: trip.destinations.length
    }))
  }

  private getScoreForCriterion(metrics: LocationMetrics, criterion: string): number {
    switch (criterion) {
      case 'cost':
        return metrics.affordabilityScore || 0.5
      case 'climate':
        return metrics.weatherRating || 0.5
      case 'culture':
        return metrics.cultureRating || 0.5
      case 'safety':
        return metrics.safetyRating || 0.5
      case 'transport':
        return metrics.transportRating || 0.5
      case 'sentiment':
        return Math.max(0, (metrics.averageSentiment || 0 + 1) / 2)
      default:
        return 0.5
    }
  }

  private groupDataByTimePeriod(data: any[], period: string): any[] {
    // Group data by time period (day, week, month)
    const groups: Record<string, any[]> = {}
    
    for (const item of data) {
      const date = new Date(item.date)
      let key: string
      
      switch (period) {
        case 'week':
          key = date.toISOString().split('T')[0] // Daily
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(Math.ceil(date.getDate() / 7)).padStart(2, '0')}` // Weekly
          break
        case 'quarter':
        case 'year':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` // Monthly
          break
        default:
          key = date.toISOString().split('T')[0]
      }
      
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
    }
    
    return Object.entries(groups).map(([key, items]) => ({
      date: new Date(key),
      averageSentiment: items.reduce((sum, item) => sum + item.sentiment, 0) / items.length,
      count: items.length
    }))
  }

  private groupCostDataByTimePeriod(data: any[], period: string): any[] {
    const groups: Record<string, any[]> = {}
    
    for (const item of data) {
      const date = new Date(item.date)
      let key: string
      
      switch (period) {
        case 'week':
          key = date.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(Math.ceil(date.getDate() / 7)).padStart(2, '0')}`
          break
        case 'quarter':
        case 'year':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        default:
          key = date.toISOString().split('T')[0]
      }
      
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
    }
    
    return Object.entries(groups).map(([key, items]) => {
      const averageCost = items.reduce((sum, item) => sum + item.totalCost, 0) / items.length
      
      const categoryAverages: Record<string, number> = {}
      const categories = ['housing', 'food', 'transportation', 'utilities', 'entertainment', 'miscellaneous']
      
      for (const category of categories) {
        const categoryValues = items.map(item => item.breakdown[category] || 0)
        categoryAverages[category] = categoryValues.reduce((sum, val) => sum + val, 0) / categoryValues.length
      }
      
      return {
        date: new Date(key),
        averageCost,
        categoryAverages,
        count: items.length
      }
    })
  }

  private calculateAverageGrowthRate(trends: TimeSeriesData[]): number {
    if (trends.length < 2) return 0
    
    let totalGrowth = 0
    let periods = 0
    
    for (let i = 1; i < trends.length; i++) {
      const current = trends[i].value
      const previous = trends[i - 1].value
      
      if (previous !== 0) {
        totalGrowth += (current - previous) / previous
        periods++
      }
    }
    
    return periods > 0 ? totalGrowth / periods : 0
  }

  private async getUserRecentActivity(userId: string): Promise<any> {
    const [journalEntries, trips, savedLocations] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      this.prisma.trip.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { destinations: true }
      }),
      this.prisma.userSavedLocation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { location: true }
      })
    ])

    return { journalEntries, trips, savedLocations }
  }

  private async generatePatternInsights(userId: string, activity: any): Promise<ExplorationInsightInput[]> {
    const insights: ExplorationInsightInput[] = []
    
    // Analyze travel patterns
    if (activity.trips.length > 3) {
      const avgTripLength = activity.trips.reduce((sum: number, trip: any) => {
        const days = (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)
        return sum + days
      }, 0) / activity.trips.length
      
      insights.push({
        userId,
        insightType: 'pattern',
        category: 'behavior',
        priority: 'medium',
        confidence: 0.8,
        title: 'Travel Pattern Identified',
        content: `You typically take ${avgTripLength.toFixed(1)}-day trips. Consider planning longer explorations for deeper cultural immersion.`,
        actionable: true,
        supportingData: { avgTripLength, tripCount: activity.trips.length }
      })
    }
    
    return insights
  }

  private async generateRecommendationInsights(userId: string, activity: any): Promise<ExplorationInsightInput[]> {
    const insights: ExplorationInsightInput[] = []
    
    // Analyze saved locations for recommendations
    if (activity.savedLocations.length > 0) {
      const countries = activity.savedLocations.map((sl: any) => sl.location.country)
      const countryFreq = countries.reduce((freq: Record<string, number>, country: string) => {
        freq[country] = (freq[country] || 0) + 1
        return freq
      }, {})
      
      const topCountry = Object.entries(countryFreq).sort(([,a], [,b]) => (b as number) - (a as number))[0]
      
      if (topCountry) {
        insights.push({
          userId,
          insightType: 'recommendation',
          category: 'decision',
          priority: 'high',
          confidence: 0.9,
          title: 'Focused Interest Detected',
          content: `You've saved ${topCountry[1]} locations in ${topCountry[0]}. Consider planning a comprehensive exploration of this country.`,
          actionable: true,
          supportingData: { country: topCountry[0], count: topCountry[1] }
        })
      }
    }
    
    return insights
  }

  private async generateWarningInsights(userId: string, activity: any): Promise<ExplorationInsightInput[]> {
    const insights: ExplorationInsightInput[] = []
    
    // Check for potential issues
    const recentTrips = activity.trips.filter((trip: any) => {
      const tripDate = new Date(trip.startDate)
      const monthsAgo = new Date()
      monthsAgo.setMonth(monthsAgo.getMonth() - 6)
      return tripDate > monthsAgo
    })
    
    if (recentTrips.length === 0 && activity.savedLocations.length > 5) {
      insights.push({
        userId,
        insightType: 'warning',
        category: 'behavior',
        priority: 'medium',
        confidence: 0.7,
        title: 'Planning vs Action Gap',
        content: `You have ${activity.savedLocations.length} saved locations but no recent trips. Consider converting your plans into actual explorations.`,
        actionable: true,
        supportingData: { savedCount: activity.savedLocations.length, recentTrips: recentTrips.length }
      })
    }
    
    return insights
  }

  private async generatePredictionInsights(userId: string, activity: any): Promise<ExplorationInsightInput[]> {
    const insights: ExplorationInsightInput[] = []
    
    // Predict next likely destination
    if (activity.trips.length > 2) {
      const destinations = activity.trips.flatMap((trip: any) => 
        trip.destinations.map((dest: any) => dest.location)
      )
      
      // Simple prediction based on patterns
      insights.push({
        userId,
        insightType: 'prediction',
        category: 'decision',
        priority: 'low',
        confidence: 0.6,
        title: 'Next Destination Prediction',
        content: `Based on your travel patterns, you're likely to explore a new European destination in the next 3 months.`,
        actionable: false,
        supportingData: { destinations: destinations.length }
      })
    }
    
    return insights
  }
}