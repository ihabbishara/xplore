import { PrismaClient } from '@prisma/client'
import { 
  CostAnalysis, 
  CostBreakdown, 
  LocationMetrics,
  AnalyticsFilters 
} from '../types/analytics.types'
import { redis } from '../../../lib/redis'
import { logger } from '../../../lib/logger'
import axios from 'axios'

interface CostDataSource {
  housing: number
  food: number
  transportation: number
  utilities: number
  entertainment: number
  miscellaneous: number
}

interface AffordabilityProfile {
  income: number
  savings: number
  monthlyBudget: number
  riskTolerance: 'low' | 'medium' | 'high'
  preferences: {
    housingMaxPercent: number
    foodMaxPercent: number
    transportMaxPercent: number
  }
}

interface CostTrendData {
  period: string
  direction: 'increasing' | 'decreasing' | 'stable'
  percentage: number
  factors: string[]
}

interface CostPrediction {
  timeframe: string
  expectedChange: number
  confidence: number
  factors: string[]
}

export class CostIntelligenceService {
  private readonly CACHE_TTL = 3600 // 1 hour in seconds
  private readonly COST_CATEGORIES = [
    'housing', 'food', 'transportation', 'utilities', 'entertainment', 'miscellaneous'
  ]

  constructor(private prisma: PrismaClient) {}

  /**
   * Get comprehensive cost analysis for a location
   */
  async getLocationCostAnalysis(
    locationId: string, 
    userId?: string,
    customProfile?: AffordabilityProfile
  ): Promise<CostAnalysis> {
    try {
      const cacheKey = `cost_analysis:${locationId}:${userId || 'global'}`
      
      // Try to get from cache first
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      // Get location data
      const location = await this.prisma.location.findUnique({
        where: { id: locationId },
        include: {
          journalEntries: {
            where: userId ? { userId } : undefined,
            select: {
              content: true,
              createdAt: true,
              metadata: true
            }
          },
          tripDestinations: {
            include: {
              trip: true
            }
          }
        }
      })

      if (!location) {
        throw new Error('Location not found')
      }

      // Get cost data from multiple sources
      const costData = await this.aggregateCostData(location.latitude, location.longitude, location.country)
      
      // Calculate affordability score
      const affordabilityProfile = customProfile || await this.getUserAffordabilityProfile(userId)
      const affordabilityScore = this.calculateAffordabilityScore(costData, affordabilityProfile)

      // Get cost trends
      const trends = await this.getCostTrends(locationId, location.country)

      // Extract cost mentions from journal entries
      const journalCostInsights = await this.extractCostInsightsFromJournals(location.journalEntries)

      // Calculate comparison to regional average
      const comparisonToAverage = await this.calculateComparisonToAverage(costData, location.country)

      // Generate recommendations
      const recommendations = await this.generateCostRecommendations(
        costData, 
        affordabilityScore, 
        trends,
        journalCostInsights
      )

      const analysis: CostAnalysis = {
        locationId,
        totalCost: Object.values(costData).reduce((sum, cost) => sum + cost, 0),
        costBreakdown: {
          ...costData,
          total: Object.values(costData).reduce((sum, cost) => sum + cost, 0)
        },
        affordabilityScore,
        comparisonToAverage,
        recommendations,
        trends
      }

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(analysis))

      return analysis
    } catch (error) {
      logger.error(`Error getting cost analysis for location ${locationId}:`, error)
      throw error
    }
  }

  /**
   * Compare costs between multiple locations
   */
  async compareLocationCosts(
    locationIds: string[], 
    userId?: string,
    customProfile?: AffordabilityProfile
  ): Promise<{
    locations: Record<string, CostAnalysis>
    comparison: {
      cheapest: string
      mostExpensive: string
      averageCost: number
      costDifference: number
      recommendations: string[]
    }
  }> {
    try {
      // Get cost analysis for each location
      const analyses = await Promise.all(
        locationIds.map(async (locationId) => {
          const analysis = await this.getLocationCostAnalysis(locationId, userId, customProfile)
          return [locationId, analysis] as [string, CostAnalysis]
        })
      )

      const locations = Object.fromEntries(analyses)

      // Find cheapest and most expensive
      const costs = analyses.map(([id, analysis]) => ({ id, cost: analysis.totalCost }))
      const sortedCosts = costs.sort((a, b) => a.cost - b.cost)
      
      const cheapest = sortedCosts[0].id
      const mostExpensive = sortedCosts[sortedCosts.length - 1].id
      const averageCost = costs.reduce((sum, { cost }) => sum + cost, 0) / costs.length
      const costDifference = sortedCosts[sortedCosts.length - 1].cost - sortedCosts[0].cost

      // Generate comparison recommendations
      const recommendations = this.generateComparisonRecommendations(locations, cheapest, mostExpensive)

      return {
        locations,
        comparison: {
          cheapest,
          mostExpensive,
          averageCost,
          costDifference,
          recommendations
        }
      }
    } catch (error) {
      logger.error('Error comparing location costs:', error)
      throw error
    }
  }

  /**
   * Get cost trends for a location
   */
  async getCostTrends(locationId: string, country: string): Promise<CostTrendData> {
    try {
      // Get historical cost data from database
      const historicalData = await this.prisma.locationAnalytics.findMany({
        where: { locationId },
        select: {
          costBreakdown: true,
          lastCalculated: true
        },
        orderBy: {
          lastCalculated: 'desc'
        },
        take: 12 // Last 12 calculations
      })

      if (historicalData.length < 2) {
        return {
          period: '6 months',
          direction: 'stable',
          percentage: 0,
          factors: ['Insufficient historical data']
        }
      }

      // Calculate trend
      const recent = historicalData.slice(0, 6)
      const older = historicalData.slice(6, 12)

      const recentAvg = this.calculateAverageTotalCost(recent)
      const olderAvg = this.calculateAverageTotalCost(older)

      const percentageChange = ((recentAvg - olderAvg) / olderAvg) * 100

      let direction: 'increasing' | 'decreasing' | 'stable'
      if (percentageChange > 2) direction = 'increasing'
      else if (percentageChange < -2) direction = 'decreasing'
      else direction = 'stable'

      // Get external trend factors
      const factors = await this.getExternalTrendFactors(country)

      return {
        period: '6 months',
        direction,
        percentage: Math.abs(percentageChange),
        factors
      }
    } catch (error) {
      logger.error('Error getting cost trends:', error)
      return {
        period: '6 months',
        direction: 'stable',
        percentage: 0,
        factors: ['Unable to calculate trends']
      }
    }
  }

  /**
   * Predict future costs for a location
   */
  async predictFutureCosts(
    locationId: string, 
    timeframe: '3_months' | '6_months' | '1_year',
    userId?: string
  ): Promise<CostPrediction> {
    try {
      // Get current cost analysis
      const currentAnalysis = await this.getLocationCostAnalysis(locationId, userId)
      
      // Get historical trends
      const location = await this.prisma.location.findUnique({
        where: { id: locationId },
        select: { country: true }
      })

      if (!location) {
        throw new Error('Location not found')
      }

      const trends = await this.getCostTrends(locationId, location.country)

      // Simple prediction based on trends
      let timeframeFactor = 1
      switch (timeframe) {
        case '3_months':
          timeframeFactor = 0.25
          break
        case '6_months':
          timeframeFactor = 0.5
          break
        case '1_year':
          timeframeFactor = 1
          break
      }

      const expectedChange = trends.direction === 'increasing' 
        ? trends.percentage * timeframeFactor
        : trends.direction === 'decreasing' 
          ? -trends.percentage * timeframeFactor
          : 0

      // Calculate confidence based on data quality
      const confidence = this.calculatePredictionConfidence(trends)

      return {
        timeframe,
        expectedChange,
        confidence,
        factors: trends.factors
      }
    } catch (error) {
      logger.error('Error predicting future costs:', error)
      throw error
    }
  }

  /**
   * Calculate living cost index for a location
   */
  async calculateLivingCostIndex(
    locationId: string,
    referenceLocationId?: string
  ): Promise<{
    index: number
    referenceLocation: string
    breakdown: Record<string, number>
    interpretation: string
  }> {
    try {
      // Get cost analysis for target location
      const targetAnalysis = await this.getLocationCostAnalysis(locationId)

      // Get reference location (default to global average or specific location)
      let referenceAnalysis: CostAnalysis
      let referenceLocation: string

      if (referenceLocationId) {
        referenceAnalysis = await this.getLocationCostAnalysis(referenceLocationId)
        const refLocation = await this.prisma.location.findUnique({
          where: { id: referenceLocationId },
          select: { name: true }
        })
        referenceLocation = refLocation?.name || 'Unknown'
      } else {
        // Use global average as reference
        referenceAnalysis = await this.getGlobalAverageCosts()
        referenceLocation = 'Global Average'
      }

      // Calculate index (target / reference * 100)
      const index = (targetAnalysis.totalCost / referenceAnalysis.totalCost) * 100

      // Calculate breakdown by category
      const breakdown: Record<string, number> = {}
      for (const category of this.COST_CATEGORIES) {
        const targetCost = targetAnalysis.costBreakdown[category as keyof CostBreakdown] || 0
        const referenceCost = referenceAnalysis.costBreakdown[category as keyof CostBreakdown] || 0
        
        if (referenceCost > 0) {
          breakdown[category] = (targetCost / referenceCost) * 100
        }
      }

      // Generate interpretation
      const interpretation = this.generateCostIndexInterpretation(index, breakdown)

      return {
        index,
        referenceLocation,
        breakdown,
        interpretation
      }
    } catch (error) {
      logger.error('Error calculating living cost index:', error)
      throw error
    }
  }

  /**
   * Get budget recommendations for a location
   */
  async getBudgetRecommendations(
    locationId: string,
    monthlyIncome: number,
    userId?: string
  ): Promise<{
    recommended: CostBreakdown
    minimum: CostBreakdown
    comfortable: CostBreakdown
    savingsRate: number
    riskAssessment: string
    tips: string[]
  }> {
    try {
      const costAnalysis = await this.getLocationCostAnalysis(locationId, userId)
      const actualCosts = costAnalysis.costBreakdown

      // Calculate different budget scenarios
      const recommended = this.calculateRecommendedBudget(actualCosts, monthlyIncome, 'moderate')
      const minimum = this.calculateRecommendedBudget(actualCosts, monthlyIncome, 'tight')
      const comfortable = this.calculateRecommendedBudget(actualCosts, monthlyIncome, 'comfortable')

      // Calculate savings rate
      const savingsRate = Math.max(0, (monthlyIncome - recommended.total) / monthlyIncome)

      // Risk assessment
      const riskAssessment = this.assessBudgetRisk(actualCosts, monthlyIncome)

      // Generate tips
      const tips = this.generateBudgetTips(actualCosts, monthlyIncome, costAnalysis)

      return {
        recommended,
        minimum,
        comfortable,
        savingsRate,
        riskAssessment,
        tips
      }
    } catch (error) {
      logger.error('Error getting budget recommendations:', error)
      throw error
    }
  }

  // Private helper methods

  private async aggregateCostData(lat: number, lng: number, country: string): Promise<CostDataSource> {
    // This would integrate with multiple cost data sources
    // For now, using default values based on country
    const defaultCosts = this.getDefaultCostsByCountry(country)
    
    // TODO: Integrate with real cost data APIs like:
    // - Numbeo API
    // - Expatistan API
    // - Cost of Living API
    
    return defaultCosts
  }

  private getDefaultCostsByCountry(country: string): CostDataSource {
    // Simplified country-based cost estimates
    const costMap: Record<string, CostDataSource> = {
      'France': {
        housing: 1200,
        food: 400,
        transportation: 100,
        utilities: 150,
        entertainment: 200,
        miscellaneous: 150
      },
      'Germany': {
        housing: 1000,
        food: 350,
        transportation: 120,
        utilities: 140,
        entertainment: 180,
        miscellaneous: 130
      },
      'Spain': {
        housing: 800,
        food: 300,
        transportation: 80,
        utilities: 120,
        entertainment: 150,
        miscellaneous: 100
      },
      'United Kingdom': {
        housing: 1500,
        food: 450,
        transportation: 150,
        utilities: 180,
        entertainment: 250,
        miscellaneous: 200
      }
    }

    return costMap[country] || {
      housing: 1000,
      food: 400,
      transportation: 100,
      utilities: 150,
      entertainment: 200,
      miscellaneous: 150
    }
  }

  private async getUserAffordabilityProfile(userId?: string): Promise<AffordabilityProfile> {
    // Default profile if no user data
    const defaultProfile: AffordabilityProfile = {
      income: 3000,
      savings: 10000,
      monthlyBudget: 2500,
      riskTolerance: 'medium',
      preferences: {
        housingMaxPercent: 40,
        foodMaxPercent: 20,
        transportMaxPercent: 15
      }
    }

    if (!userId) return defaultProfile

    // Try to get user profile data
    try {
      const userProfile = await this.prisma.userProfile.findUnique({
        where: { userId },
        select: {
          interests: true
        }
      })

      // Extract financial preferences from user interests if available
      if (userProfile?.interests) {
        const interests = userProfile.interests as any
        if (interests.financial) {
          return {
            ...defaultProfile,
            ...interests.financial
          }
        }
      }

      return defaultProfile
    } catch (error) {
      logger.error('Error getting user affordability profile:', error)
      return defaultProfile
    }
  }

  private calculateAffordabilityScore(
    costData: CostDataSource, 
    profile: AffordabilityProfile
  ): number {
    const totalCost = Object.values(costData).reduce((sum, cost) => sum + cost, 0)
    
    // Calculate affordability as percentage of income that would be spent
    const affordabilityRatio = totalCost / profile.monthlyBudget
    
    // Score from 0 to 1, where 1 is very affordable
    let score = 1 - Math.min(affordabilityRatio, 2) / 2
    
    // Adjust based on savings and risk tolerance
    if (profile.savings > totalCost * 6) { // 6 months emergency fund
      score += 0.1
    }
    
    if (profile.riskTolerance === 'high') {
      score += 0.05
    } else if (profile.riskTolerance === 'low') {
      score -= 0.05
    }
    
    return Math.max(0, Math.min(1, score))
  }

  private async calculateComparisonToAverage(
    costData: CostDataSource,
    country: string
  ): Promise<number> {
    // Get regional average costs
    const regionAverage = await this.getRegionalAverageCosts(country)
    const totalCost = Object.values(costData).reduce((sum, cost) => sum + cost, 0)
    const averageCost = Object.values(regionAverage).reduce((sum, cost) => sum + cost, 0)
    
    // Return percentage difference from average
    return (totalCost - averageCost) / averageCost
  }

  private async getRegionalAverageCosts(country: string): Promise<CostDataSource> {
    // This would query actual regional data
    // For now, using default values
    return this.getDefaultCostsByCountry(country)
  }

  private async extractCostInsightsFromJournals(journalEntries: any[]): Promise<{
    mentions: number
    sentiment: 'positive' | 'negative' | 'neutral'
    insights: string[]
  }> {
    const costKeywords = ['expensive', 'cheap', 'affordable', 'cost', 'price', 'budget', 'money']
    let mentions = 0
    const insights: string[] = []

    journalEntries.forEach(entry => {
      const content = entry.content.toLowerCase()
      const costMentions = costKeywords.filter(keyword => content.includes(keyword))
      
      if (costMentions.length > 0) {
        mentions++
        
        // Extract insights based on keywords
        if (content.includes('expensive') || content.includes('overpriced')) {
          insights.push('Location perceived as expensive based on journal entries')
        }
        if (content.includes('cheap') || content.includes('affordable')) {
          insights.push('Location perceived as affordable based on journal entries')
        }
        if (content.includes('good value') || content.includes('worth it')) {
          insights.push('Location perceived as good value based on journal entries')
        }
      }
    })

    // Determine overall sentiment
    const positiveKeywords = ['cheap', 'affordable', 'good value', 'worth it']
    const negativeKeywords = ['expensive', 'overpriced', 'costly']
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
    const positiveCount = positiveKeywords.reduce((count, keyword) => {
      return count + journalEntries.filter(entry => 
        entry.content.toLowerCase().includes(keyword)
      ).length
    }, 0)
    
    const negativeCount = negativeKeywords.reduce((count, keyword) => {
      return count + journalEntries.filter(entry => 
        entry.content.toLowerCase().includes(keyword)
      ).length
    }, 0)

    if (positiveCount > negativeCount) sentiment = 'positive'
    else if (negativeCount > positiveCount) sentiment = 'negative'

    return { mentions, sentiment, insights }
  }

  private async generateCostRecommendations(
    costData: CostDataSource,
    affordabilityScore: number,
    trends: CostTrendData,
    journalInsights: any
  ): Promise<string[]> {
    const recommendations: string[] = []

    // Affordability-based recommendations
    if (affordabilityScore < 0.5) {
      recommendations.push('Consider areas outside city center for lower housing costs')
      recommendations.push('Look for shared accommodation to reduce housing expenses')
    }

    // Category-specific recommendations
    const totalCost = Object.values(costData).reduce((sum, cost) => sum + cost, 0)
    const housingPercent = costData.housing / totalCost

    if (housingPercent > 0.5) {
      recommendations.push('Housing costs are high - consider suburbs or shared living')
    }

    if (costData.food > 500) {
      recommendations.push('Food costs are high - consider cooking at home more often')
    }

    if (costData.transportation > 150) {
      recommendations.push('Transportation costs are high - consider public transport or cycling')
    }

    // Trend-based recommendations
    if (trends.direction === 'increasing' && trends.percentage > 5) {
      recommendations.push('Costs are rising - consider visiting sooner rather than later')
    }

    // Journal-based recommendations
    if (journalInsights.sentiment === 'negative') {
      recommendations.push('Previous visitors found costs high - budget accordingly')
    }

    return recommendations
  }

  private calculateAverageTotalCost(analyticsData: any[]): number {
    if (analyticsData.length === 0) return 0
    
    const totalCosts = analyticsData.map(data => {
      const breakdown = data.costBreakdown as any
      return Object.values(breakdown).reduce((sum: number, cost: any) => sum + (cost || 0), 0)
    })

    return totalCosts.reduce((sum, cost) => sum + cost, 0) / totalCosts.length
  }

  private async getExternalTrendFactors(country: string): Promise<string[]> {
    // This would integrate with economic data APIs
    // For now, return default factors
    return [
      'General inflation trends',
      'Tourism seasonal patterns',
      'Economic conditions'
    ]
  }

  private calculatePredictionConfidence(trends: CostTrendData): number {
    // Simple confidence calculation based on trend stability
    if (trends.direction === 'stable') return 0.9
    if (trends.percentage < 5) return 0.8
    if (trends.percentage < 10) return 0.7
    return 0.6
  }

  private async getGlobalAverageCosts(): Promise<CostAnalysis> {
    // Return global average cost analysis
    const globalAverage: CostDataSource = {
      housing: 1000,
      food: 400,
      transportation: 120,
      utilities: 150,
      entertainment: 180,
      miscellaneous: 150
    }

    return {
      locationId: 'global',
      totalCost: Object.values(globalAverage).reduce((sum, cost) => sum + cost, 0),
      costBreakdown: {
        ...globalAverage,
        total: Object.values(globalAverage).reduce((sum, cost) => sum + cost, 0)
      },
      affordabilityScore: 0.5,
      comparisonToAverage: 0,
      recommendations: [],
      trends: {
        direction: 'stable',
        percentage: 2,
        period: '1 year'
      }
    }
  }

  private generateComparisonRecommendations(
    locations: Record<string, CostAnalysis>,
    cheapest: string,
    mostExpensive: string
  ): string[] {
    const recommendations: string[] = []
    
    recommendations.push(`${cheapest} offers the best value for money`)
    recommendations.push(`${mostExpensive} is the most expensive option`)
    
    // Add category-specific recommendations
    const cheapestAnalysis = locations[cheapest]
    const expensiveAnalysis = locations[mostExpensive]
    
    if (cheapestAnalysis.affordabilityScore > 0.7) {
      recommendations.push(`${cheapest} is highly affordable for most budgets`)
    }
    
    if (expensiveAnalysis.affordabilityScore < 0.3) {
      recommendations.push(`${mostExpensive} may require a higher budget`)
    }

    return recommendations
  }

  private generateCostIndexInterpretation(
    index: number,
    breakdown: Record<string, number>
  ): string {
    if (index < 80) {
      return 'Significantly below average - very affordable'
    } else if (index < 90) {
      return 'Below average - affordable'
    } else if (index < 110) {
      return 'Around average - moderate cost'
    } else if (index < 130) {
      return 'Above average - expensive'
    } else {
      return 'Significantly above average - very expensive'
    }
  }

  private calculateRecommendedBudget(
    actualCosts: CostBreakdown,
    monthlyIncome: number,
    scenario: 'tight' | 'moderate' | 'comfortable'
  ): CostBreakdown {
    const multipliers = {
      tight: 0.8,
      moderate: 1.0,
      comfortable: 1.2
    }

    const multiplier = multipliers[scenario]
    const budgetLimit = monthlyIncome * (scenario === 'tight' ? 0.8 : scenario === 'moderate' ? 0.75 : 0.7)

    // Scale costs proportionally to fit budget
    const actualTotal = actualCosts.total || Object.values(actualCosts).reduce((sum, cost) => sum + (cost || 0), 0)
    const scaleFactor = Math.min(1, (budgetLimit / actualTotal) * multiplier)

    return {
      housing: Math.round((actualCosts.housing || 0) * scaleFactor),
      food: Math.round((actualCosts.food || 0) * scaleFactor),
      transportation: Math.round((actualCosts.transportation || 0) * scaleFactor),
      utilities: Math.round((actualCosts.utilities || 0) * scaleFactor),
      entertainment: Math.round((actualCosts.entertainment || 0) * scaleFactor),
      miscellaneous: Math.round((actualCosts.miscellaneous || 0) * scaleFactor),
      total: Math.round(actualTotal * scaleFactor)
    }
  }

  private assessBudgetRisk(costs: CostBreakdown, monthlyIncome: number): string {
    const totalCost = costs.total || Object.values(costs).reduce((sum, cost) => sum + (cost || 0), 0)
    const ratio = totalCost / monthlyIncome

    if (ratio > 0.8) return 'High risk - costs exceed 80% of income'
    if (ratio > 0.6) return 'Medium risk - costs are 60-80% of income'
    if (ratio > 0.4) return 'Low risk - costs are 40-60% of income'
    return 'Very low risk - costs are less than 40% of income'
  }

  private generateBudgetTips(
    costs: CostBreakdown,
    monthlyIncome: number,
    costAnalysis: CostAnalysis
  ): string[] {
    const tips: string[] = []
    const totalCost = costs.total || Object.values(costs).reduce((sum, cost) => sum + (cost || 0), 0)

    // Income-based tips
    if (totalCost > monthlyIncome * 0.7) {
      tips.push('Consider increasing income before relocating')
    }

    // Category-specific tips
    const housingPercent = (costs.housing || 0) / totalCost
    if (housingPercent > 0.5) {
      tips.push('Look for shared housing or consider suburbs')
    }

    const foodPercent = (costs.food || 0) / totalCost
    if (foodPercent > 0.25) {
      tips.push('Plan to cook at home to reduce food expenses')
    }

    // Use cost analysis recommendations
    tips.push(...costAnalysis.recommendations.slice(0, 3))

    return tips
  }
}