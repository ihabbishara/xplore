import { PrismaClient } from '@prisma/client'
import { 
  BehaviorPatternInput, 
  BehaviorPattern,
  LocationMetrics,
  BiasDetectionResult
} from '../types/analytics.types'
import { SentimentAnalysisService } from './sentimentAnalysisService'
import { redis } from '../../../lib/redis'
import { logger } from '../../../shared/utils/logger'

interface PatternAnalysisResult {
  pattern: any
  frequency: number
  confidence: number
  significance: number
  triggers: any[]
  outcomes: any[]
}

interface UserBehaviorProfile {
  userId: string
  preferencePatterns: Record<string, any>
  decisionPatterns: Record<string, any>
  explorationPatterns: Record<string, any>
  biasPatterns: Record<string, any>
  overallReliability: number
  lastAnalyzed: Date
}

export class BehaviorPatternService {
  private readonly CACHE_TTL = 3600 // 1 hour
  private readonly MIN_DATA_POINTS = 3
  private readonly MIN_CONFIDENCE = 0.6

  constructor(
    private prisma: PrismaClient,
    private sentimentAnalysisService: SentimentAnalysisService
  ) {}

  /**
   * Analyze and identify behavior patterns for a user
   */
  async analyzeUserBehaviorPatterns(userId: string): Promise<{
    patterns: BehaviorPattern[]
    profile: UserBehaviorProfile
    recommendations: string[]
  }> {
    try {
      const cacheKey = `behavior_patterns:${userId}`
      
      // Try cache first
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      // Get user's exploration data
      const userData = await this.getUserExplorationData(userId)
      
      // Analyze different types of patterns
      const [
        preferencePatterns,
        decisionPatterns,
        explorationPatterns,
        biasPatterns
      ] = await Promise.all([
        this.analyzePreferencePatterns(userData),
        this.analyzeDecisionPatterns(userData),
        this.analyzeExplorationPatterns(userData),
        this.analyzeBiasPatterns(userData)
      ])

      // Convert to BehaviorPattern objects
      const allPatterns = [
        ...preferencePatterns.map(p => this.createBehaviorPatternFromAnalysis(userId, 'preference', p)),
        ...decisionPatterns.map(p => this.createBehaviorPatternFromAnalysis(userId, 'decision', p)),
        ...explorationPatterns.map(p => this.createBehaviorPatternFromAnalysis(userId, 'exploration', p)),
        ...biasPatterns.map(p => this.createBehaviorPatternFromAnalysis(userId, 'bias', p))
      ]

      // Filter patterns by reliability and significance
      const significantPatterns = allPatterns.filter(p => 
        p.confidence >= this.MIN_CONFIDENCE && 
        p.dataPoints >= this.MIN_DATA_POINTS
      )

      // Create user behavior profile
      const profile: UserBehaviorProfile = {
        userId,
        preferencePatterns: this.aggregatePatterns(preferencePatterns),
        decisionPatterns: this.aggregatePatterns(decisionPatterns),
        explorationPatterns: this.aggregatePatterns(explorationPatterns),
        biasPatterns: this.aggregatePatterns(biasPatterns),
        overallReliability: this.calculateOverallReliability(significantPatterns),
        lastAnalyzed: new Date()
      }

      // Generate recommendations
      const recommendations = await this.generateBehaviorRecommendations(profile, significantPatterns)

      // Save patterns to database
      await this.saveBehaviorPatterns(significantPatterns)

      const result = {
        patterns: significantPatterns,
        profile,
        recommendations
      }

      // Cache the result
      await redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result))

      return result
    } catch (error) {
      logger.error('Error analyzing user behavior patterns:', error)
      throw error
    }
  }

  /**
   * Detect cognitive biases in user decisions
   */
  async detectCognitiveBiases(userId: string): Promise<BiasDetectionResult[]> {
    try {
      const userData = await this.getUserExplorationData(userId)
      const biases: BiasDetectionResult[] = []

      // Anchoring bias - heavy reliance on first piece of information
      const anchoringBias = await this.detectAnchoringBias(userData)
      if (anchoringBias.confidence > 0.5) {
        biases.push(anchoringBias)
      }

      // Recency bias - giving more weight to recent events
      const recencyBias = await this.detectRecencyBias(userData)
      if (recencyBias.confidence > 0.5) {
        biases.push(recencyBias)
      }

      // Confirmation bias - seeking information that confirms existing beliefs
      const confirmationBias = await this.detectConfirmationBias(userData)
      if (confirmationBias.confidence > 0.5) {
        biases.push(confirmationBias)
      }

      // Availability bias - judging probability by how easily examples come to mind
      const availabilityBias = await this.detectAvailabilityBias(userData)
      if (availabilityBias.confidence > 0.5) {
        biases.push(availabilityBias)
      }

      return biases
    } catch (error) {
      logger.error('Error detecting cognitive biases:', error)
      throw error
    }
  }

  /**
   * Get behavior pattern insights for a user
   */
  async getBehaviorInsights(userId: string): Promise<{
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
    riskFactors: string[]
  }> {
    try {
      const { patterns, profile } = await this.analyzeUserBehaviorPatterns(userId)
      
      const strengths: string[] = []
      const weaknesses: string[] = []
      const recommendations: string[] = []
      const riskFactors: string[] = []

      // Analyze preference patterns
      if (profile.preferencePatterns.consistent_climate_preference) {
        strengths.push('Consistent climate preferences help narrow down suitable destinations')
      }

      if (profile.preferencePatterns.diverse_activity_interests) {
        strengths.push('Diverse activity interests provide flexibility in destination choices')
      }

      // Analyze decision patterns
      if (profile.decisionPatterns.impulsive_decisions > 0.7) {
        weaknesses.push('Tendency toward impulsive decisions without thorough analysis')
        recommendations.push('Consider using decision matrices for important choices')
      }

      if (profile.decisionPatterns.over_analysis > 0.7) {
        weaknesses.push('Tendency to over-analyze, potentially missing opportunities')
        recommendations.push('Set decision deadlines to avoid analysis paralysis')
      }

      // Analyze exploration patterns
      if (profile.explorationPatterns.comfort_zone_preference > 0.8) {
        weaknesses.push('Strong preference for comfort zone may limit growth')
        recommendations.push('Gradually introduce new experiences to expand comfort zone')
      }

      // Analyze bias patterns
      const biases = await this.detectCognitiveBiases(userId)
      for (const bias of biases) {
        if (bias.severity === 'high') {
          riskFactors.push(`High ${bias.biasType} bias detected`)
          recommendations.push(...bias.recommendations)
        }
      }

      return {
        strengths,
        weaknesses,
        recommendations,
        riskFactors
      }
    } catch (error) {
      logger.error('Error getting behavior insights:', error)
      throw error
    }
  }

  /**
   * Predict user behavior based on patterns
   */
  async predictUserBehavior(
    userId: string,
    scenario: string,
    context: any
  ): Promise<{
    predictedChoice: string
    confidence: number
    reasoning: string[]
    alternatives: string[]
  }> {
    try {
      const { patterns, profile } = await this.analyzeUserBehaviorPatterns(userId)
      
      // Simple prediction based on historical patterns
      let predictedChoice = 'unknown'
      let confidence = 0.5
      const reasoning: string[] = []
      const alternatives: string[] = []

      // Analyze patterns relevant to the scenario
      if (scenario === 'destination_selection') {
        const climatePreference = profile.preferencePatterns.climate_preference
        const costSensitivity = profile.decisionPatterns.cost_sensitivity
        
        if (climatePreference && climatePreference.warm_climate > 0.7) {
          predictedChoice = 'warm_destination'
          confidence = 0.8
          reasoning.push('Strong preference for warm climates detected')
        }
        
        if (costSensitivity > 0.8) {
          reasoning.push('High cost sensitivity may influence choice')
          alternatives.push('budget_friendly_alternatives')
        }
      }

      return {
        predictedChoice,
        confidence,
        reasoning,
        alternatives
      }
    } catch (error) {
      logger.error('Error predicting user behavior:', error)
      throw error
    }
  }

  /**
   * Create a new behavior pattern
   */
  async createBehaviorPattern(input: BehaviorPatternInput): Promise<BehaviorPattern> {
    try {
      const pattern = await this.prisma.userBehaviorPattern.create({
        data: {
          userId: input.userId,
          patternType: input.patternType,
          category: input.category,
          pattern: input.pattern,
          frequency: input.frequency,
          confidence: input.confidence,
          triggers: input.triggers,
          outcomes: input.outcomes,
          firstObserved: input.firstObserved,
          lastObserved: input.lastObserved,
          dataPoints: input.dataPoints,
          reliability: input.reliability,
          isActive: true
        }
      })

      return {
        id: pattern.id,
        userId: pattern.userId,
        patternType: pattern.patternType,
        category: pattern.category,
        pattern: pattern.pattern,
        frequency: Number(pattern.frequency),
        confidence: Number(pattern.confidence),
        triggers: pattern.triggers,
        outcomes: pattern.outcomes,
        firstObserved: pattern.firstObserved,
        lastObserved: pattern.lastObserved,
        evolution: pattern.evolution,
        dataPoints: pattern.dataPoints,
        reliability: Number(pattern.reliability),
        isActive: pattern.isActive
      }
    } catch (error) {
      logger.error('Error creating behavior pattern:', error)
      throw error
    }
  }

  /**
   * Update existing behavior pattern
   */
  async updateBehaviorPattern(
    patternId: string,
    updates: Partial<BehaviorPatternInput>
  ): Promise<BehaviorPattern> {
    try {
      const pattern = await this.prisma.userBehaviorPattern.update({
        where: { id: patternId },
        data: {
          ...updates,
          lastObserved: new Date()
        }
      })

      return {
        id: pattern.id,
        userId: pattern.userId,
        patternType: pattern.patternType,
        category: pattern.category,
        pattern: pattern.pattern,
        frequency: Number(pattern.frequency),
        confidence: Number(pattern.confidence),
        triggers: pattern.triggers,
        outcomes: pattern.outcomes,
        firstObserved: pattern.firstObserved,
        lastObserved: pattern.lastObserved,
        evolution: pattern.evolution,
        dataPoints: pattern.dataPoints,
        reliability: Number(pattern.reliability),
        isActive: pattern.isActive
      }
    } catch (error) {
      logger.error('Error updating behavior pattern:', error)
      throw error
    }
  }

  /**
   * List user's behavior patterns
   */
  async listBehaviorPatterns(
    userId: string,
    patternType?: string,
    category?: string,
    onlyActive = true
  ): Promise<BehaviorPattern[]> {
    try {
      const patterns = await this.prisma.userBehaviorPattern.findMany({
        where: {
          userId,
          ...(patternType && { patternType }),
          ...(category && { category }),
          ...(onlyActive && { isActive: true })
        },
        orderBy: [
          { confidence: 'desc' },
          { lastObserved: 'desc' }
        ]
      })

      return patterns.map(pattern => ({
        id: pattern.id,
        userId: pattern.userId,
        patternType: pattern.patternType,
        category: pattern.category,
        pattern: pattern.pattern,
        frequency: Number(pattern.frequency),
        confidence: Number(pattern.confidence),
        triggers: pattern.triggers,
        outcomes: pattern.outcomes,
        firstObserved: pattern.firstObserved,
        lastObserved: pattern.lastObserved,
        evolution: pattern.evolution,
        dataPoints: pattern.dataPoints,
        reliability: Number(pattern.reliability),
        isActive: pattern.isActive
      }))
    } catch (error) {
      logger.error('Error listing behavior patterns:', error)
      throw error
    }
  }

  // Private helper methods

  private async getUserExplorationData(userId: string): Promise<any> {
    const [journalEntries, trips, savedLocations, locationAnalytics] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where: { userId },
        include: {
          location: true,
          media: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      this.prisma.trip.findMany({
        where: { creatorId: userId },
        include: {
          destinations: {
            include: {
              location: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      this.prisma.userSavedLocation.findMany({
        where: { userId },
        include: {
          location: true
        },
        orderBy: { savedAt: 'desc' },
        take: 100
      }),
      this.prisma.locationAnalytics.findMany({
        where: { userId },
        include: {
          location: true
        },
        orderBy: { lastCalculated: 'desc' },
        take: 50
      })
    ])

    return {
      journalEntries,
      trips,
      savedLocations,
      locationAnalytics
    }
  }

  private async analyzePreferencePatterns(userData: any): Promise<PatternAnalysisResult[]> {
    const patterns: PatternAnalysisResult[] = []

    // Analyze climate preferences
    const climatePattern = this.analyzeClimatePreferences(userData)
    if (climatePattern.confidence > this.MIN_CONFIDENCE) {
      patterns.push(climatePattern)
    }

    // Analyze cost preferences
    const costPattern = this.analyzeCostPreferences(userData)
    if (costPattern.confidence > this.MIN_CONFIDENCE) {
      patterns.push(costPattern)
    }

    // Analyze activity preferences
    const activityPattern = this.analyzeActivityPreferences(userData)
    if (activityPattern.confidence > this.MIN_CONFIDENCE) {
      patterns.push(activityPattern)
    }

    // Analyze timing preferences
    const timingPattern = this.analyzeTimingPreferences(userData)
    if (timingPattern.confidence > this.MIN_CONFIDENCE) {
      patterns.push(timingPattern)
    }

    return patterns
  }

  private async analyzeDecisionPatterns(userData: any): Promise<PatternAnalysisResult[]> {
    const patterns: PatternAnalysisResult[] = []

    // Analyze decision speed
    const speedPattern = this.analyzeDecisionSpeed(userData)
    if (speedPattern.confidence > this.MIN_CONFIDENCE) {
      patterns.push(speedPattern)
    }

    // Analyze decision factors
    const factorPattern = this.analyzeDecisionFactors(userData)
    if (factorPattern.confidence > this.MIN_CONFIDENCE) {
      patterns.push(factorPattern)
    }

    // Analyze decision consistency
    const consistencyPattern = this.analyzeDecisionConsistency(userData)
    if (consistencyPattern.confidence > this.MIN_CONFIDENCE) {
      patterns.push(consistencyPattern)
    }

    return patterns
  }

  private async analyzeExplorationPatterns(userData: any): Promise<PatternAnalysisResult[]> {
    const patterns: PatternAnalysisResult[] = []

    // Analyze exploration frequency
    const frequencyPattern = this.analyzeExplorationFrequency(userData)
    if (frequencyPattern.confidence > this.MIN_CONFIDENCE) {
      patterns.push(frequencyPattern)
    }

    // Analyze exploration depth
    const depthPattern = this.analyzeExplorationDepth(userData)
    if (depthPattern.confidence > this.MIN_CONFIDENCE) {
      patterns.push(depthPattern)
    }

    // Analyze exploration style
    const stylePattern = this.analyzeExplorationStyle(userData)
    if (stylePattern.confidence > this.MIN_CONFIDENCE) {
      patterns.push(stylePattern)
    }

    return patterns
  }

  private async analyzeBiasPatterns(userData: any): Promise<PatternAnalysisResult[]> {
    const patterns: PatternAnalysisResult[] = []

    // Analyze confirmation bias
    const confirmationPattern = this.analyzeConfirmationBiasPattern(userData)
    if (confirmationPattern.confidence > this.MIN_CONFIDENCE) {
      patterns.push(confirmationPattern)
    }

    // Analyze anchoring bias
    const anchoringPattern = this.analyzeAnchoringBiasPattern(userData)
    if (anchoringPattern.confidence > this.MIN_CONFIDENCE) {
      patterns.push(anchoringPattern)
    }

    return patterns
  }

  private analyzeClimatePreferences(userData: any): PatternAnalysisResult {
    const climateData = userData.locationAnalytics
      .filter((analytics: any) => analytics.weatherRating != null)
      .map((analytics: any) => ({
        rating: analytics.weatherRating,
        location: analytics.location,
        visits: analytics.totalVisits
      }))

    if (climateData.length < this.MIN_DATA_POINTS) {
      return {
        pattern: { type: 'climate_preference', insufficient_data: true },
        frequency: 0,
        confidence: 0,
        significance: 0,
        triggers: [],
        outcomes: []
      }
    }

    const averageRating = climateData.reduce((sum: number, data: any) => sum + data.rating, 0) / climateData.length
    const preference = averageRating > 0.7 ? 'warm' : averageRating < 0.3 ? 'cool' : 'moderate'
    
    return {
      pattern: {
        type: 'climate_preference',
        preference,
        averageRating,
        consistency: this.calculateConsistency(climateData.map((d: any) => d.rating))
      },
      frequency: climateData.length,
      confidence: Math.min(0.9, climateData.length / 10),
      significance: Math.abs(averageRating - 0.5) * 2,
      triggers: ['weather_conditions', 'seasonal_changes'],
      outcomes: ['destination_selection', 'travel_timing']
    }
  }

  private analyzeCostPreferences(userData: any): PatternAnalysisResult {
    const costData = userData.locationAnalytics
      .filter((analytics: any) => analytics.affordabilityScore != null)
      .map((analytics: any) => ({
        score: analytics.affordabilityScore,
        location: analytics.location,
        visits: analytics.totalVisits
      }))

    if (costData.length < this.MIN_DATA_POINTS) {
      return {
        pattern: { type: 'cost_preference', insufficient_data: true },
        frequency: 0,
        confidence: 0,
        significance: 0,
        triggers: [],
        outcomes: []
      }
    }

    const averageScore = costData.reduce((sum: number, data: any) => sum + data.score, 0) / costData.length
    const sensitivity = averageScore > 0.7 ? 'low' : averageScore < 0.3 ? 'high' : 'moderate'
    
    return {
      pattern: {
        type: 'cost_preference',
        sensitivity,
        averageScore,
        consistency: this.calculateConsistency(costData.map((d: any) => d.score))
      },
      frequency: costData.length,
      confidence: Math.min(0.9, costData.length / 10),
      significance: Math.abs(averageScore - 0.5) * 2,
      triggers: ['budget_constraints', 'economic_conditions'],
      outcomes: ['destination_selection', 'trip_duration']
    }
  }

  private analyzeActivityPreferences(userData: any): PatternAnalysisResult {
    const activityData = userData.locationAnalytics
      .filter((analytics: any) => analytics.activityPreferences != null)
      .map((analytics: any) => ({
        preferences: analytics.activityPreferences,
        location: analytics.location
      }))

    if (activityData.length < this.MIN_DATA_POINTS) {
      return {
        pattern: { type: 'activity_preference', insufficient_data: true },
        frequency: 0,
        confidence: 0,
        significance: 0,
        triggers: [],
        outcomes: []
      }
    }

    // Aggregate activity preferences
    const aggregated: Record<string, number> = {}
    const activities = ['outdoor', 'cultural', 'food', 'nightlife', 'shopping', 'relaxation']
    
    activities.forEach(activity => {
      const values = activityData.map((data: any) => data.preferences[activity] || 0)
      aggregated[activity] = values.reduce((sum: number, val: number) => sum + val, 0) / values.length
    })

    const topActivity = Object.entries(aggregated)
      .sort(([, a], [, b]) => b - a)[0]

    return {
      pattern: {
        type: 'activity_preference',
        preferences: aggregated,
        topActivity: topActivity[0],
        topScore: topActivity[1],
        diversity: this.calculateDiversity(Object.values(aggregated))
      },
      frequency: activityData.length,
      confidence: Math.min(0.9, activityData.length / 10),
      significance: topActivity[1],
      triggers: ['mood', 'season', 'companions'],
      outcomes: ['activity_selection', 'location_choice']
    }
  }

  private analyzeTimingPreferences(userData: any): PatternAnalysisResult {
    const trips = userData.trips
    
    if (trips.length < this.MIN_DATA_POINTS) {
      return {
        pattern: { type: 'timing_preference', insufficient_data: true },
        frequency: 0,
        confidence: 0,
        significance: 0,
        triggers: [],
        outcomes: []
      }
    }

    // Analyze seasonal patterns
    const seasonalData = trips.map((trip: any) => {
      const startDate = new Date(trip.startDate)
      const month = startDate.getMonth()
      const season = month < 3 ? 'winter' : month < 6 ? 'spring' : month < 9 ? 'summer' : 'autumn'
      return { season, duration: trip.duration }
    })

    const seasonCounts = seasonalData.reduce((counts: Record<string, number>, data: any) => {
      counts[data.season] = (counts[data.season] || 0) + 1
      return counts
    }, {})

    const preferredSeason = Object.entries(seasonCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0][0]

    return {
      pattern: {
        type: 'timing_preference',
        seasonalDistribution: seasonCounts,
        preferredSeason,
        averageDuration: seasonalData.reduce((sum: number, data: any) => sum + data.duration, 0) / seasonalData.length
      },
      frequency: trips.length,
      confidence: Math.min(0.9, trips.length / 10),
      significance: (seasonCounts[preferredSeason] || 0) / trips.length,
      triggers: ['weather', 'holidays', 'work_schedule'],
      outcomes: ['trip_timing', 'destination_choice']
    }
  }

  private analyzeDecisionSpeed(userData: any): PatternAnalysisResult {
    const decisions = userData.savedLocations
    
    if (decisions.length < this.MIN_DATA_POINTS) {
      return {
        pattern: { type: 'decision_speed', insufficient_data: true },
        frequency: 0,
        confidence: 0,
        significance: 0,
        triggers: [],
        outcomes: []
      }
    }

    // Analyze time between saving location and taking action (e.g., creating trip)
    const speedData = decisions.map((saved: any) => {
      const savedDate = new Date(saved.createdAt)
      const relatedTrips = userData.trips.filter((trip: any) => 
        trip.destinations.some((dest: any) => dest.locationId === saved.locationId)
      )
      
      if (relatedTrips.length > 0) {
        const tripDate = new Date(relatedTrips[0].startDate)
        const decisionTime = (tripDate.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24) // days
        return { decisionTime, acted: true }
      }
      
      return { decisionTime: null, acted: false }
    })

    const actedDecisions = speedData.filter((d: any) => d.acted && d.decisionTime !== null)
    
    if (actedDecisions.length === 0) {
      return {
        pattern: { type: 'decision_speed', insufficient_data: true },
        frequency: 0,
        confidence: 0,
        significance: 0,
        triggers: [],
        outcomes: []
      }
    }

    const averageDecisionTime = actedDecisions.reduce((sum: number, data: any) => sum + data.decisionTime, 0) / actedDecisions.length
    const speed = averageDecisionTime < 7 ? 'fast' : averageDecisionTime > 30 ? 'slow' : 'moderate'
    
    return {
      pattern: {
        type: 'decision_speed',
        speed,
        averageDecisionTime,
        actionRate: actedDecisions.length / decisions.length
      },
      frequency: actedDecisions.length,
      confidence: Math.min(0.9, actedDecisions.length / 5),
      significance: Math.abs(averageDecisionTime - 14) / 14,
      triggers: ['urgency', 'information_availability'],
      outcomes: ['trip_planning', 'opportunity_capture']
    }
  }

  private analyzeDecisionFactors(userData: any): PatternAnalysisResult {
    const analytics = userData.locationAnalytics
    
    if (analytics.length < this.MIN_DATA_POINTS) {
      return {
        pattern: { type: 'decision_factors', insufficient_data: true },
        frequency: 0,
        confidence: 0,
        significance: 0,
        triggers: [],
        outcomes: []
      }
    }

    // Analyze which factors correlate with high visit counts
    const factorData = analytics.map((analytic: any) => ({
      visits: analytic.totalVisits,
      cost: analytic.affordabilityScore || 0.5,
      weather: analytic.weatherRating || 0.5,
      culture: analytic.cultureRating || 0.5,
      safety: analytic.safetyRating || 0.5,
      transport: analytic.transportRating || 0.5
    }))

    const correlations = this.calculateFactorCorrelations(factorData)
    const topFactor = Object.entries(correlations)
      .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))[0]

    return {
      pattern: {
        type: 'decision_factors',
        correlations,
        primaryFactor: topFactor[0],
        primaryCorrelation: topFactor[1],
        factorImportance: this.rankFactorImportance(correlations)
      },
      frequency: analytics.length,
      confidence: Math.min(0.9, analytics.length / 10),
      significance: Math.abs(topFactor[1]),
      triggers: ['information_availability', 'personal_values'],
      outcomes: ['destination_selection', 'satisfaction']
    }
  }

  private analyzeDecisionConsistency(userData: any): PatternAnalysisResult {
    const decisions = userData.savedLocations
    
    if (decisions.length < this.MIN_DATA_POINTS) {
      return {
        pattern: { type: 'decision_consistency', insufficient_data: true },
        frequency: 0,
        confidence: 0,
        significance: 0,
        triggers: [],
        outcomes: []
      }
    }

    // Analyze consistency in location characteristics
    const locationData = decisions.map((saved: any) => ({
      country: saved.location.country,
      climate: saved.location.climate || 'unknown',
      costLevel: saved.location.costLevel || 'unknown'
    }))

    const countryConsistency = this.calculateCategoricalConsistency(locationData.map((d: any) => d.country))
    const climateConsistency = this.calculateCategoricalConsistency(locationData.map((d: any) => d.climate))
    const costConsistency = this.calculateCategoricalConsistency(locationData.map((d: any) => d.costLevel))

    const overallConsistency = (countryConsistency + climateConsistency + costConsistency) / 3
    const consistencyLevel = overallConsistency > 0.7 ? 'high' : overallConsistency < 0.3 ? 'low' : 'moderate'

    return {
      pattern: {
        type: 'decision_consistency',
        level: consistencyLevel,
        overallConsistency,
        countryConsistency,
        climateConsistency,
        costConsistency
      },
      frequency: decisions.length,
      confidence: Math.min(0.9, decisions.length / 10),
      significance: Math.abs(overallConsistency - 0.5) * 2,
      triggers: ['personal_values', 'past_experiences'],
      outcomes: ['predictability', 'satisfaction']
    }
  }

  private analyzeExplorationFrequency(userData: any): PatternAnalysisResult {
    const trips = userData.trips
    
    if (trips.length < this.MIN_DATA_POINTS) {
      return {
        pattern: { type: 'exploration_frequency', insufficient_data: true },
        frequency: 0,
        confidence: 0,
        significance: 0,
        triggers: [],
        outcomes: []
      }
    }

    // Calculate time between trips
    const sortedTrips = trips.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    const intervals = []
    
    for (let i = 1; i < sortedTrips.length; i++) {
      const prevEnd = new Date(sortedTrips[i - 1].endDate)
      const currentStart = new Date(sortedTrips[i].startDate)
      const interval = (currentStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60 * 24) // days
      intervals.push(interval)
    }

    if (intervals.length === 0) {
      return {
        pattern: { type: 'exploration_frequency', insufficient_data: true },
        frequency: 0,
        confidence: 0,
        significance: 0,
        triggers: [],
        outcomes: []
      }
    }

    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    const frequencyLevel = averageInterval < 30 ? 'high' : averageInterval > 90 ? 'low' : 'moderate'

    return {
      pattern: {
        type: 'exploration_frequency',
        level: frequencyLevel,
        averageInterval,
        totalTrips: trips.length,
        consistency: this.calculateConsistency(intervals)
      },
      frequency: trips.length,
      confidence: Math.min(0.9, trips.length / 5),
      significance: Math.abs(averageInterval - 60) / 60,
      triggers: ['schedule', 'budget', 'motivation'],
      outcomes: ['experience_accumulation', 'expertise_development']
    }
  }

  private analyzeExplorationDepth(userData: any): PatternAnalysisResult {
    const trips = userData.trips
    
    if (trips.length < this.MIN_DATA_POINTS) {
      return {
        pattern: { type: 'exploration_depth', insufficient_data: true },
        frequency: 0,
        confidence: 0,
        significance: 0,
        triggers: [],
        outcomes: []
      }
    }

    // Analyze trip durations and destination counts
    const depthData = trips.map((trip: any) => ({
      duration: trip.duration || 7,
      destinationCount: trip.destinations.length,
      journalEntries: userData.journalEntries.filter((entry: any) => 
        trip.destinations.some((dest: any) => dest.locationId === entry.locationId)
      ).length
    }))

    const averageDuration = depthData.reduce((sum: number, data: any) => sum + data.duration, 0) / depthData.length
    const averageDestinations = depthData.reduce((sum: number, data: any) => sum + data.destinationCount, 0) / depthData.length
    const averageJournalEntries = depthData.reduce((sum: number, data: any) => sum + data.journalEntries, 0) / depthData.length

    const depthScore = (averageDuration / 14) * 0.4 + (averageJournalEntries / 10) * 0.6
    const depthLevel = depthScore > 0.7 ? 'deep' : depthScore < 0.3 ? 'shallow' : 'moderate'

    return {
      pattern: {
        type: 'exploration_depth',
        level: depthLevel,
        depthScore,
        averageDuration,
        averageDestinations,
        averageJournalEntries
      },
      frequency: trips.length,
      confidence: Math.min(0.9, trips.length / 5),
      significance: Math.abs(depthScore - 0.5) * 2,
      triggers: ['available_time', 'interests', 'travel_style'],
      outcomes: ['understanding_quality', 'memory_formation']
    }
  }

  private analyzeExplorationStyle(userData: any): PatternAnalysisResult {
    const journalEntries = userData.journalEntries
    
    if (journalEntries.length < this.MIN_DATA_POINTS) {
      return {
        pattern: { type: 'exploration_style', insufficient_data: true },
        frequency: 0,
        confidence: 0,
        significance: 0,
        triggers: [],
        outcomes: []
      }
    }

    // Analyze journal content for style indicators
    const styleIndicators = {
      structured: 0,
      spontaneous: 0,
      social: 0,
      solitary: 0,
      adventurous: 0,
      comfortable: 0
    }

    const keywords = {
      structured: ['planned', 'schedule', 'itinerary', 'organized', 'list'],
      spontaneous: ['spontaneous', 'unexpected', 'random', 'surprise', 'impulse'],
      social: ['friends', 'people', 'group', 'social', 'together'],
      solitary: ['alone', 'solo', 'myself', 'quiet', 'peaceful'],
      adventurous: ['adventure', 'exciting', 'risk', 'new', 'challenging'],
      comfortable: ['comfortable', 'familiar', 'safe', 'easy', 'relaxed']
    }

    for (const entry of journalEntries) {
      const content = entry.content.toLowerCase()
      for (const [style, styleKeywords] of Object.entries(keywords)) {
        const matches = styleKeywords.filter(keyword => content.includes(keyword)).length
        styleIndicators[style as keyof typeof styleIndicators] += matches
      }
    }

    const totalIndicators = Object.values(styleIndicators).reduce((sum, count) => sum + count, 0)
    
    if (totalIndicators === 0) {
      return {
        pattern: { type: 'exploration_style', insufficient_data: true },
        frequency: 0,
        confidence: 0,
        significance: 0,
        triggers: [],
        outcomes: []
      }
    }

    // Normalize scores
    const normalizedScores = Object.fromEntries(
      Object.entries(styleIndicators).map(([style, count]) => [style, count / totalIndicators])
    )

    const dominantStyle = Object.entries(normalizedScores)
      .sort(([, a], [, b]) => b - a)[0]

    return {
      pattern: {
        type: 'exploration_style',
        dominantStyle: dominantStyle[0],
        dominantScore: dominantStyle[1],
        styleProfile: normalizedScores
      },
      frequency: journalEntries.length,
      confidence: Math.min(0.9, journalEntries.length / 20),
      significance: dominantStyle[1],
      triggers: ['personality', 'mood', 'circumstances'],
      outcomes: ['experience_quality', 'satisfaction']
    }
  }

  private analyzeConfirmationBiasPattern(userData: any): PatternAnalysisResult {
    // Analyze if user seeks information that confirms existing beliefs
    const savedLocations = userData.savedLocations
    const journalEntries = userData.journalEntries
    
    if (savedLocations.length < this.MIN_DATA_POINTS) {
      return {
        pattern: { type: 'confirmation_bias', insufficient_data: true },
        frequency: 0,
        confidence: 0,
        significance: 0,
        triggers: [],
        outcomes: []
      }
    }

    // Simple heuristic: check if user consistently saves similar types of locations
    const locationTypes = savedLocations.map((saved: any) => saved.location.country)
    const uniqueTypes = new Set(locationTypes)
    const diversityScore = uniqueTypes.size / locationTypes.length
    
    const biasScore = 1 - diversityScore // Lower diversity = higher bias
    const biasLevel = biasScore > 0.7 ? 'high' : biasScore < 0.3 ? 'low' : 'moderate'

    return {
      pattern: {
        type: 'confirmation_bias',
        level: biasLevel,
        biasScore,
        diversityScore,
        dominantPreference: this.findDominantPreference(locationTypes)
      },
      frequency: savedLocations.length,
      confidence: Math.min(0.8, savedLocations.length / 10),
      significance: biasScore,
      triggers: ['existing_beliefs', 'comfort_seeking'],
      outcomes: ['limited_exploration', 'missed_opportunities']
    }
  }

  private analyzeAnchoringBiasPattern(userData: any): PatternAnalysisResult {
    // Analyze if user is overly influenced by first information received
    const trips = userData.trips
    
    if (trips.length < this.MIN_DATA_POINTS) {
      return {
        pattern: { type: 'anchoring_bias', insufficient_data: true },
        frequency: 0,
        confidence: 0,
        significance: 0,
        triggers: [],
        outcomes: []
      }
    }

    // Simple heuristic: check if first destination in trips influences subsequent choices
    const firstDestinations = trips.map((trip: any) => trip.destinations[0]?.location?.country)
    const firstCountry = firstDestinations[0]
    const sameCountryCount = firstDestinations.filter((country: any) => country === firstCountry).length
    
    const anchoringScore = sameCountryCount / trips.length
    const biasLevel = anchoringScore > 0.7 ? 'high' : anchoringScore < 0.3 ? 'low' : 'moderate'

    return {
      pattern: {
        type: 'anchoring_bias',
        level: biasLevel,
        anchoringScore,
        anchorValue: firstCountry,
        influenceRate: anchoringScore
      },
      frequency: trips.length,
      confidence: Math.min(0.8, trips.length / 10),
      significance: anchoringScore,
      triggers: ['first_information', 'uncertainty'],
      outcomes: ['limited_exploration', 'suboptimal_choices']
    }
  }

  private async detectAnchoringBias(userData: any): Promise<BiasDetectionResult> {
    const pattern = this.analyzeAnchoringBiasPattern(userData)
    
    return {
      biasType: 'anchoring',
      severity: pattern.pattern.level === 'high' ? 'high' : pattern.pattern.level === 'moderate' ? 'medium' : 'low',
      confidence: pattern.confidence,
      description: `User shows ${pattern.pattern.level} anchoring bias, being influenced by initial information about ${pattern.pattern.anchorValue}`,
      evidence: [`${(pattern.pattern.influenceRate * 100).toFixed(1)}% of decisions influenced by initial anchor`],
      recommendations: [
        'Consider multiple options before making decisions',
        'Seek diverse information sources',
        'Use decision matrices to evaluate alternatives objectively'
      ],
      affectedDecisions: ['destination_selection', 'trip_planning']
    }
  }

  private async detectRecencyBias(userData: any): Promise<BiasDetectionResult> {
    const recentTrips = userData.trips.slice(0, 3)
    const olderTrips = userData.trips.slice(3, 6)
    
    if (recentTrips.length === 0 || olderTrips.length === 0) {
      return {
        biasType: 'recency',
        severity: 'low',
        confidence: 0.3,
        description: 'Insufficient data to detect recency bias',
        evidence: [],
        recommendations: [],
        affectedDecisions: []
      }
    }

    // Simple heuristic: check if recent trips are over-represented in saved locations
    const recentDestinations = recentTrips.flatMap((trip: any) => trip.destinations.map((d: any) => d.locationId))
    const savedLocations = userData.savedLocations
    const recentSavedCount = savedLocations.filter((saved: any) => recentDestinations.includes(saved.locationId)).length
    
    const recencyScore = recentSavedCount / savedLocations.length
    const severity = recencyScore > 0.6 ? 'high' : recencyScore > 0.4 ? 'medium' : 'low'

    return {
      biasType: 'recency',
      severity,
      confidence: Math.min(0.8, userData.trips.length / 10),
      description: `User shows ${severity} recency bias, giving more weight to recent experiences`,
      evidence: [`${(recencyScore * 100).toFixed(1)}% of saved locations are from recent trips`],
      recommendations: [
        'Review past experiences when making decisions',
        'Keep a decision journal to track patterns',
        'Consider long-term trends, not just recent events'
      ],
      affectedDecisions: ['location_evaluation', 'future_planning']
    }
  }

  private async detectConfirmationBias(userData: any): Promise<BiasDetectionResult> {
    const pattern = this.analyzeConfirmationBiasPattern(userData)
    
    return {
      biasType: 'confirmation',
      severity: pattern.pattern.level === 'high' ? 'high' : pattern.pattern.level === 'moderate' ? 'medium' : 'low',
      confidence: pattern.confidence,
      description: `User shows ${pattern.pattern.level} confirmation bias, preferring ${pattern.pattern.dominantPreference} locations`,
      evidence: [`${((1 - pattern.pattern.diversityScore) * 100).toFixed(1)}% similarity in location choices`],
      recommendations: [
        'Actively seek diverse perspectives and experiences',
        'Challenge your assumptions about destinations',
        'Explore locations outside your comfort zone'
      ],
      affectedDecisions: ['destination_selection', 'experience_evaluation']
    }
  }

  private async detectAvailabilityBias(userData: any): Promise<BiasDetectionResult> {
    const journalEntries = userData.journalEntries
    const trips = userData.trips
    
    if (journalEntries.length < 5) {
      return {
        biasType: 'availability',
        severity: 'low',
        confidence: 0.3,
        description: 'Insufficient data to detect availability bias',
        evidence: [],
        recommendations: [],
        affectedDecisions: []
      }
    }

    // Check if recent, memorable experiences are over-represented in decisions
    const recentEntries = journalEntries.slice(0, 10)
    const emotionalWords = ['amazing', 'terrible', 'incredible', 'awful', 'fantastic', 'horrible']
    const emotionalEntries = recentEntries.filter((entry: any) => 
      emotionalWords.some(word => entry.content.toLowerCase().includes(word))
    )
    
    const emotionalRatio = emotionalEntries.length / recentEntries.length
    const severity = emotionalRatio > 0.6 ? 'high' : emotionalRatio > 0.4 ? 'medium' : 'low'

    return {
      biasType: 'availability',
      severity,
      confidence: Math.min(0.8, journalEntries.length / 20),
      description: `User shows ${severity} availability bias, being influenced by memorable recent experiences`,
      evidence: [`${(emotionalRatio * 100).toFixed(1)}% of recent entries contain emotional language`],
      recommendations: [
        'Consider statistical data, not just memorable experiences',
        'Keep a balanced record of both positive and negative experiences',
        'Make decisions based on systematic analysis'
      ],
      affectedDecisions: ['risk_assessment', 'expectation_setting']
    }
  }

  private createBehaviorPatternFromAnalysis(
    userId: string,
    patternType: string,
    analysis: PatternAnalysisResult
  ): BehaviorPattern {
    const category = this.getCategoryForPattern(analysis.pattern.type)
    
    return {
      id: '', // Will be set when saved
      userId,
      patternType,
      category,
      pattern: analysis.pattern,
      frequency: analysis.frequency,
      confidence: analysis.confidence,
      triggers: analysis.triggers,
      outcomes: analysis.outcomes,
      firstObserved: new Date(), // Simplified - should track actual first observation
      lastObserved: new Date(),
      dataPoints: analysis.frequency,
      reliability: analysis.confidence,
      isActive: true
    }
  }

  private getCategoryForPattern(patternType: string): string {
    const mapping: Record<string, string> = {
      'climate_preference': 'climate',
      'cost_preference': 'cost',
      'activity_preference': 'culture',
      'timing_preference': 'timing',
      'decision_speed': 'decision',
      'decision_factors': 'decision',
      'decision_consistency': 'decision',
      'exploration_frequency': 'exploration',
      'exploration_depth': 'exploration',
      'exploration_style': 'exploration',
      'confirmation_bias': 'bias',
      'anchoring_bias': 'bias'
    }
    
    return mapping[patternType] || 'general'
  }

  private aggregatePatterns(patterns: PatternAnalysisResult[]): Record<string, any> {
    const aggregated: Record<string, any> = {}
    
    patterns.forEach(pattern => {
      const key = pattern.pattern.type
      aggregated[key] = {
        ...pattern.pattern,
        confidence: pattern.confidence,
        significance: pattern.significance
      }
    })
    
    return aggregated
  }

  private calculateOverallReliability(patterns: BehaviorPattern[]): number {
    if (patterns.length === 0) return 0
    
    const totalReliability = patterns.reduce((sum, pattern) => sum + pattern.reliability, 0)
    return totalReliability / patterns.length
  }

  private async generateBehaviorRecommendations(
    profile: UserBehaviorProfile,
    patterns: BehaviorPattern[]
  ): Promise<string[]> {
    const recommendations: string[] = []
    
    // Analyze patterns for recommendations
    patterns.forEach(pattern => {
      if (pattern.patternType === 'preference' && pattern.confidence > 0.8) {
        recommendations.push(`Your ${pattern.category} preferences are well-established - use them to guide decisions`)
      }
      
      if (pattern.patternType === 'bias' && pattern.confidence > 0.7) {
        recommendations.push(`Be aware of ${pattern.category} bias in your decision-making process`)
      }
    })
    
    // General recommendations based on profile
    if (profile.overallReliability > 0.8) {
      recommendations.push('Your behavior patterns are consistent - trust your instincts')
    } else if (profile.overallReliability < 0.5) {
      recommendations.push('Consider using structured decision-making tools to improve consistency')
    }
    
    return recommendations
  }

  private async saveBehaviorPatterns(patterns: BehaviorPattern[]): Promise<void> {
    for (const pattern of patterns) {
      try {
        // Find existing pattern
        const existingPattern = await this.prisma.userBehaviorPattern.findFirst({
          where: {
            userId: pattern.userId,
            patternType: pattern.patternType,
            category: pattern.category
          }
        })

        if (existingPattern) {
          await this.prisma.userBehaviorPattern.update({
            where: { id: existingPattern.id },
            data: {
              pattern: pattern.pattern,
              frequency: pattern.frequency,
              confidence: pattern.confidence,
              triggers: pattern.triggers,
              outcomes: pattern.outcomes,
              lastObserved: pattern.lastObserved,
              dataPoints: pattern.dataPoints,
              reliability: Number(pattern.reliability),
              isActive: pattern.isActive
            }
          })
        } else {
          await this.prisma.userBehaviorPattern.create({
            data: {
              userId: pattern.userId,
              patternType: pattern.patternType,
              category: pattern.category,
              pattern: pattern.pattern,
              frequency: pattern.frequency,
              confidence: pattern.confidence,
              triggers: pattern.triggers,
              outcomes: pattern.outcomes,
              firstObserved: pattern.firstObserved,
              lastObserved: pattern.lastObserved,
            dataPoints: pattern.dataPoints,
            reliability: Number(pattern.reliability),
            isActive: pattern.isActive
            }
          })
        }
      } catch (error) {
        logger.error(`Error saving behavior pattern: ${error}`)
      }
    }
  }

  private calculateConsistency(values: number[]): number {
    if (values.length < 2) return 0
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    
    return Math.max(0, 1 - (stdDev / mean))
  }

  private calculateDiversity(values: number[]): number {
    if (values.length < 2) return 0
    
    const sorted = values.sort((a, b) => a - b)
    const range = sorted[sorted.length - 1] - sorted[0]
    
    return range / Math.max(...values)
  }

  private calculateFactorCorrelations(data: any[]): Record<string, number> {
    const factors = ['cost', 'weather', 'culture', 'safety', 'transport']
    const correlations: Record<string, number> = {}
    
    factors.forEach(factor => {
      const factorValues = data.map(d => d[factor])
      const visitValues = data.map(d => d.visits)
      
      correlations[factor] = this.calculateCorrelation(factorValues, visitValues)
    })
    
    return correlations
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) return 0
    
    const meanX = x.reduce((sum, val) => sum + val, 0) / x.length
    const meanY = y.reduce((sum, val) => sum + val, 0) / y.length
    
    let numerator = 0
    let sumXSq = 0
    let sumYSq = 0
    
    for (let i = 0; i < x.length; i++) {
      const deltaX = x[i] - meanX
      const deltaY = y[i] - meanY
      
      numerator += deltaX * deltaY
      sumXSq += deltaX * deltaX
      sumYSq += deltaY * deltaY
    }
    
    const denominator = Math.sqrt(sumXSq * sumYSq)
    return denominator === 0 ? 0 : numerator / denominator
  }

  private rankFactorImportance(correlations: Record<string, number>): string[] {
    return Object.entries(correlations)
      .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
      .map(([factor]) => factor)
  }

  private calculateCategoricalConsistency(values: string[]): number {
    if (values.length < 2) return 0
    
    const counts = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const maxCount = Math.max(...Object.values(counts))
    return maxCount / values.length
  }

  private findDominantPreference(values: string[]): string {
    const counts = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown'
  }
}