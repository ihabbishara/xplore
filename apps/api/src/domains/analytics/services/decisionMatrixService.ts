import { PrismaClient } from '@prisma/client'
import { 
  DecisionMatrixInput, 
  DecisionMatrixResult,
  LocationMetrics,
  BehaviorPattern
} from '../types/analytics.types'
import { LocationAnalyticsService } from './locationAnalyticsService'
import { redis } from '../../../lib/redis'
import { logger } from '../../../lib/logger'

interface MatrixCriterion {
  weight: number
  scale: 'higher_better' | 'lower_better'
  description?: string
}

interface MatrixAlternative {
  name: string
  data: Record<string, number>
}

interface WeightedScore {
  rawScore: number
  weightedScore: number
  normalizedScore: number
}

interface SensitivityAnalysis {
  criterion: string
  weightChange: number
  rankingChange: boolean
  newWinner?: string
}

interface DecisionRecommendation {
  winner: string
  confidence: number
  reasoning: string[]
  alternatives: string[]
  considerations: string[]
}

export class DecisionMatrixService {
  private readonly CACHE_TTL = 1800 // 30 minutes
  
  constructor(
    private prisma: PrismaClient,
    private locationAnalyticsService: LocationAnalyticsService
  ) {}

  /**
   * Create and analyze a decision matrix
   */
  async createDecisionMatrix(input: DecisionMatrixInput): Promise<DecisionMatrixResult> {
    try {
      // Validate input
      this.validateMatrixInput(input)

      // Calculate scores for all alternatives
      const scores = await this.calculateAlternativeScores(input)

      // Create rankings
      const rankings = this.createRankings(scores)

      // Perform sensitivity analysis
      const sensitivity = await this.performSensitivityAnalysis(input, scores)

      // Generate recommendation
      const recommendation = await this.generateRecommendation(input, scores, rankings, sensitivity)

      // Save to database
      const matrix = await this.saveDecisionMatrix(input, scores, rankings, sensitivity, recommendation)

      return {
        id: matrix.id,
        name: input.name,
        description: input.description,
        matrixType: input.matrixType,
        criteria: input.criteria,
        alternatives: input.alternatives,
        scores,
        rankings,
        sensitivity,
        recommendation: recommendation.reasoning.join('. ')
      }
    } catch (error) {
      logger.error('Error creating decision matrix:', error)
      throw error
    }
  }

  /**
   * Get saved decision matrix
   */
  async getDecisionMatrix(matrixId: string, userId: string): Promise<DecisionMatrixResult> {
    try {
      const matrix = await this.prisma.decisionMatrix.findFirst({
        where: {
          id: matrixId,
          userId
        }
      })

      if (!matrix) {
        throw new Error('Decision matrix not found')
      }

      return {
        id: matrix.id,
        name: matrix.name,
        description: matrix.description || undefined,
        matrixType: matrix.matrixType,
        criteria: matrix.criteria as any,
        alternatives: matrix.alternatives as any,
        scores: matrix.scores as any,
        rankings: matrix.rankings as any,
        sensitivity: matrix.sensitivity as any,
        recommendation: matrix.recommendation || undefined
      }
    } catch (error) {
      logger.error('Error getting decision matrix:', error)
      throw error
    }
  }

  /**
   * List user's decision matrices
   */
  async listDecisionMatrices(
    userId: string,
    matrixType?: string,
    limit = 20,
    offset = 0
  ): Promise<{
    matrices: DecisionMatrixResult[]
    total: number
    hasMore: boolean
  }> {
    try {
      const where = {
        userId,
        ...(matrixType && { matrixType })
      }

      const [matrices, total] = await Promise.all([
        this.prisma.decisionMatrix.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        }),
        this.prisma.decisionMatrix.count({ where })
      ])

      return {
        matrices: matrices.map(matrix => ({
          id: matrix.id,
          name: matrix.name,
          description: matrix.description || undefined,
          matrixType: matrix.matrixType,
          criteria: matrix.criteria as any,
          alternatives: matrix.alternatives as any,
          scores: matrix.scores as any,
          rankings: matrix.rankings as any,
          sensitivity: matrix.sensitivity as any,
          recommendation: matrix.recommendation || undefined
        })),
        total,
        hasMore: offset + matrices.length < total
      }
    } catch (error) {
      logger.error('Error listing decision matrices:', error)
      throw error
    }
  }

  /**
   * Update decision matrix
   */
  async updateDecisionMatrix(
    matrixId: string,
    userId: string,
    updates: Partial<DecisionMatrixInput>
  ): Promise<DecisionMatrixResult> {
    try {
      const existingMatrix = await this.prisma.decisionMatrix.findFirst({
        where: {
          id: matrixId,
          userId
        }
      })

      if (!existingMatrix) {
        throw new Error('Decision matrix not found')
      }

      // Merge updates with existing data
      const updatedInput: DecisionMatrixInput = {
        userId,
        name: updates.name || existingMatrix.name,
        description: updates.description || existingMatrix.description || undefined,
        matrixType: updates.matrixType || existingMatrix.matrixType,
        criteria: updates.criteria || (existingMatrix.criteria as any),
        alternatives: updates.alternatives || (existingMatrix.alternatives as any)
      }

      // Recalculate matrix
      const result = await this.createDecisionMatrix(updatedInput)

      // Update database
      await this.prisma.decisionMatrix.update({
        where: { id: matrixId },
        data: {
          name: result.name,
          description: result.description,
          criteria: result.criteria,
          alternatives: result.alternatives,
          scores: result.scores,
          rankings: result.rankings,
          sensitivity: result.sensitivity,
          recommendation: result.recommendation,
          updatedAt: new Date()
        }
      })

      return { ...result, id: matrixId }
    } catch (error) {
      logger.error('Error updating decision matrix:', error)
      throw error
    }
  }

  /**
   * Delete decision matrix
   */
  async deleteDecisionMatrix(matrixId: string, userId: string): Promise<void> {
    try {
      const deleted = await this.prisma.decisionMatrix.deleteMany({
        where: {
          id: matrixId,
          userId
        }
      })

      if (deleted.count === 0) {
        throw new Error('Decision matrix not found')
      }
    } catch (error) {
      logger.error('Error deleting decision matrix:', error)
      throw error
    }
  }

  /**
   * Create location comparison matrix
   */
  async createLocationComparisonMatrix(
    userId: string,
    locationIds: string[],
    criteria: Record<string, MatrixCriterion>,
    name?: string
  ): Promise<DecisionMatrixResult> {
    try {
      // Get location data
      const locations = await this.prisma.location.findMany({
        where: {
          id: { in: locationIds }
        },
        select: {
          id: true,
          name: true,
          country: true,
          city: true
        }
      })

      // Get analytics for each location
      const locationAnalytics = await Promise.all(
        locationIds.map(async (locationId) => {
          const metrics = await this.locationAnalyticsService.calculateLocationMetrics(locationId, userId)
          return { locationId, metrics }
        })
      )

      // Build alternatives from location data
      const alternatives: Record<string, MatrixAlternative> = {}
      
      locationAnalytics.forEach(({ locationId, metrics }) => {
        const location = locations.find(l => l.id === locationId)
        if (location) {
          alternatives[locationId] = {
            name: `${location.name}, ${location.country}`,
            data: this.extractLocationDataForMatrix(metrics, criteria)
          }
        }
      })

      const input: DecisionMatrixInput = {
        userId,
        name: name || `Location Comparison - ${new Date().toISOString().split('T')[0]}`,
        description: `Comparison of ${locationIds.length} locations`,
        matrixType: 'location',
        criteria,
        alternatives
      }

      return await this.createDecisionMatrix(input)
    } catch (error) {
      logger.error('Error creating location comparison matrix:', error)
      throw error
    }
  }

  /**
   * Create property comparison matrix
   */
  async createPropertyComparisonMatrix(
    userId: string,
    propertyIds: string[],
    criteria: Record<string, MatrixCriterion>,
    name?: string
  ): Promise<DecisionMatrixResult> {
    try {
      // Get property data
      const properties = await this.prisma.property.findMany({
        where: {
          id: { in: propertyIds }
        },
        include: {
          priceHistory: {
            orderBy: { date: 'desc' },
            take: 1
          }
        }
      })

      // Build alternatives from property data
      const alternatives: Record<string, MatrixAlternative> = {}
      
      properties.forEach(property => {
        const currentPrice = property.priceHistory[0]?.price || property.price
        
        alternatives[property.id] = {
          name: property.title,
          data: this.extractPropertyDataForMatrix(property, currentPrice, criteria)
        }
      })

      const input: DecisionMatrixInput = {
        userId,
        name: name || `Property Comparison - ${new Date().toISOString().split('T')[0]}`,
        description: `Comparison of ${propertyIds.length} properties`,
        matrixType: 'property',
        criteria,
        alternatives
      }

      return await this.createDecisionMatrix(input)
    } catch (error) {
      logger.error('Error creating property comparison matrix:', error)
      throw error
    }
  }

  /**
   * Get decision matrix templates
   */
  async getMatrixTemplates(matrixType: string): Promise<{
    templates: Array<{
      name: string
      description: string
      criteria: Record<string, MatrixCriterion>
      category: string
    }>
  }> {
    const templates = {
      location: [
        {
          name: 'Basic Location Comparison',
          description: 'Compare locations based on fundamental factors',
          category: 'general',
          criteria: {
            cost: { weight: 0.25, scale: 'lower_better' as const, description: 'Cost of living' },
            climate: { weight: 0.2, scale: 'higher_better' as const, description: 'Climate quality' },
            culture: { weight: 0.15, scale: 'higher_better' as const, description: 'Cultural fit' },
            safety: { weight: 0.2, scale: 'higher_better' as const, description: 'Safety rating' },
            transport: { weight: 0.2, scale: 'higher_better' as const, description: 'Transportation quality' }
          }
        },
        {
          name: 'Relocation Decision Matrix',
          description: 'Comprehensive analysis for relocation decisions',
          category: 'relocation',
          criteria: {
            cost: { weight: 0.3, scale: 'lower_better' as const, description: 'Affordability' },
            career: { weight: 0.25, scale: 'higher_better' as const, description: 'Career opportunities' },
            climate: { weight: 0.15, scale: 'higher_better' as const, description: 'Climate preference' },
            culture: { weight: 0.1, scale: 'higher_better' as const, description: 'Cultural compatibility' },
            safety: { weight: 0.1, scale: 'higher_better' as const, description: 'Safety level' },
            healthcare: { weight: 0.1, scale: 'higher_better' as const, description: 'Healthcare quality' }
          }
        },
        {
          name: 'Travel Destination Matrix',
          description: 'Choose the best travel destination',
          category: 'travel',
          criteria: {
            cost: { weight: 0.2, scale: 'lower_better' as const, description: 'Travel budget' },
            activities: { weight: 0.25, scale: 'higher_better' as const, description: 'Activities available' },
            climate: { weight: 0.2, scale: 'higher_better' as const, description: 'Weather conditions' },
            culture: { weight: 0.15, scale: 'higher_better' as const, description: 'Cultural interest' },
            accessibility: { weight: 0.2, scale: 'higher_better' as const, description: 'Ease of access' }
          }
        }
      ],
      property: [
        {
          name: 'Property Investment Analysis',
          description: 'Analyze properties for investment potential',
          category: 'investment',
          criteria: {
            price: { weight: 0.3, scale: 'lower_better' as const, description: 'Purchase price' },
            location: { weight: 0.25, scale: 'higher_better' as const, description: 'Location quality' },
            condition: { weight: 0.15, scale: 'higher_better' as const, description: 'Property condition' },
            potential: { weight: 0.2, scale: 'higher_better' as const, description: 'Growth potential' },
            yield: { weight: 0.1, scale: 'higher_better' as const, description: 'Rental yield' }
          }
        },
        {
          name: 'Family Home Selection',
          description: 'Find the perfect family home',
          category: 'family',
          criteria: {
            size: { weight: 0.25, scale: 'higher_better' as const, description: 'Living space' },
            location: { weight: 0.2, scale: 'higher_better' as const, description: 'Neighborhood quality' },
            schools: { weight: 0.2, scale: 'higher_better' as const, description: 'School quality' },
            price: { weight: 0.2, scale: 'lower_better' as const, description: 'Affordability' },
            amenities: { weight: 0.15, scale: 'higher_better' as const, description: 'Local amenities' }
          }
        }
      ]
    }

    return {
      templates: templates[matrixType as keyof typeof templates] || []
    }
  }

  // Private helper methods

  private validateMatrixInput(input: DecisionMatrixInput): void {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Matrix name is required')
    }

    if (!input.criteria || Object.keys(input.criteria).length === 0) {
      throw new Error('At least one criterion is required')
    }

    if (!input.alternatives || Object.keys(input.alternatives).length < 2) {
      throw new Error('At least two alternatives are required')
    }

    // Validate criteria weights sum to 1
    const totalWeight = Object.values(input.criteria).reduce((sum, criterion) => sum + criterion.weight, 0)
    if (Math.abs(totalWeight - 1) > 0.01) {
      throw new Error('Criteria weights must sum to 1.0')
    }

    // Validate alternatives have data for all criteria
    const criteriaKeys = Object.keys(input.criteria)
    for (const [altId, alternative] of Object.entries(input.alternatives)) {
      for (const criterion of criteriaKeys) {
        if (!(criterion in alternative.data)) {
          throw new Error(`Alternative ${altId} missing data for criterion ${criterion}`)
        }
      }
    }
  }

  private async calculateAlternativeScores(
    input: DecisionMatrixInput
  ): Promise<Record<string, Record<string, number>>> {
    const scores: Record<string, Record<string, number>> = {}
    const alternativeIds = Object.keys(input.alternatives)
    const criteriaKeys = Object.keys(input.criteria)

    // Initialize scores
    alternativeIds.forEach(altId => {
      scores[altId] = {}
    })

    // Calculate scores for each criterion
    for (const criterion of criteriaKeys) {
      const criterionData = input.criteria[criterion]
      
      // Get all values for this criterion
      const values = alternativeIds.map(altId => input.alternatives[altId].data[criterion])
      const minValue = Math.min(...values)
      const maxValue = Math.max(...values)
      
      // Normalize scores (0-1 range)
      alternativeIds.forEach(altId => {
        const rawValue = input.alternatives[altId].data[criterion]
        let normalizedScore = 0
        
        if (maxValue !== minValue) {
          if (criterionData.scale === 'higher_better') {
            normalizedScore = (rawValue - minValue) / (maxValue - minValue)
          } else {
            normalizedScore = (maxValue - rawValue) / (maxValue - minValue)
          }
        } else {
          normalizedScore = 1 // All values are the same
        }
        
        // Apply weight
        const weightedScore = normalizedScore * criterionData.weight
        scores[altId][criterion] = weightedScore
      })
    }

    // Calculate total scores
    alternativeIds.forEach(altId => {
      scores[altId].total = Object.values(scores[altId]).reduce((sum, score) => sum + score, 0)
    })

    return scores
  }

  private createRankings(scores: Record<string, Record<string, number>>): Record<string, string> {
    const rankings: Record<string, string> = {}
    
    const sortedAlternatives = Object.entries(scores)
      .sort(([, a], [, b]) => b.total - a.total)
    
    sortedAlternatives.forEach(([altId], index) => {
      rankings[(index + 1).toString()] = altId
    })
    
    return rankings
  }

  private async performSensitivityAnalysis(
    input: DecisionMatrixInput,
    originalScores: Record<string, Record<string, number>>
  ): Promise<Record<string, SensitivityAnalysis>> {
    const sensitivity: Record<string, SensitivityAnalysis> = {}
    const originalWinner = Object.entries(originalScores)
      .sort(([, a], [, b]) => b.total - a.total)[0][0]

    // Test each criterion with ±10% weight change
    for (const criterion of Object.keys(input.criteria)) {
      const originalWeight = input.criteria[criterion].weight
      const weightChange = 0.1
      
      // Adjust weights (redistribute the difference among other criteria)
      const adjustedCriteria = { ...input.criteria }
      adjustedCriteria[criterion] = {
        ...adjustedCriteria[criterion],
        weight: originalWeight + weightChange
      }
      
      // Redistribute weight decrease among other criteria
      const otherCriteria = Object.keys(adjustedCriteria).filter(c => c !== criterion)
      const weightDecrease = weightChange / otherCriteria.length
      
      otherCriteria.forEach(c => {
        adjustedCriteria[c] = {
          ...adjustedCriteria[c],
          weight: adjustedCriteria[c].weight - weightDecrease
        }
      })

      // Recalculate scores
      const adjustedInput = { ...input, criteria: adjustedCriteria }
      const adjustedScores = await this.calculateAlternativeScores(adjustedInput)
      
      const newWinner = Object.entries(adjustedScores)
        .sort(([, a], [, b]) => b.total - a.total)[0][0]
      
      sensitivity[criterion] = {
        criterion,
        weightChange,
        rankingChange: newWinner !== originalWinner,
        newWinner: newWinner !== originalWinner ? newWinner : undefined
      }
    }

    return sensitivity
  }

  private async generateRecommendation(
    input: DecisionMatrixInput,
    scores: Record<string, Record<string, number>>,
    rankings: Record<string, string>,
    sensitivity: Record<string, SensitivityAnalysis>
  ): Promise<DecisionRecommendation> {
    const winner = rankings['1']
    const runnerUp = rankings['2']
    const winnerScore = scores[winner].total
    const runnerUpScore = scores[runnerUp].total
    
    const scoreDifference = winnerScore - runnerUpScore
    const confidence = Math.min(0.95, 0.5 + (scoreDifference * 2))
    
    const reasoning: string[] = []
    const alternatives: string[] = []
    const considerations: string[] = []
    
    // Generate reasoning
    const winnerName = input.alternatives[winner].name
    reasoning.push(`${winnerName} is the recommended choice with a score of ${winnerScore.toFixed(3)}`)
    
    if (scoreDifference > 0.1) {
      reasoning.push(`Clear winner with ${(scoreDifference * 100).toFixed(1)}% higher score than runner-up`)
    } else {
      reasoning.push(`Close decision - consider personal preferences and other factors`)
    }
    
    // Identify winner's strengths
    const winnerStrengths = Object.entries(scores[winner])
      .filter(([criterion, score]) => criterion !== 'total' && score > 0.7)
      .map(([criterion]) => criterion)
    
    if (winnerStrengths.length > 0) {
      reasoning.push(`Strong performance in: ${winnerStrengths.join(', ')}`)
    }
    
    // Check sensitivity
    const sensitiveCriteria = Object.values(sensitivity).filter(s => s.rankingChange)
    if (sensitiveCriteria.length > 0) {
      considerations.push(`Decision sensitive to weight changes in: ${sensitiveCriteria.map(s => s.criterion).join(', ')}`)
    }
    
    // Add alternatives
    if (scoreDifference < 0.1) {
      alternatives.push(`${input.alternatives[runnerUp].name} is a very close second option`)
    }
    
    return {
      winner,
      confidence,
      reasoning,
      alternatives,
      considerations
    }
  }

  private async saveDecisionMatrix(
    input: DecisionMatrixInput,
    scores: Record<string, Record<string, number>>,
    rankings: Record<string, string>,
    sensitivity: Record<string, SensitivityAnalysis>,
    recommendation: DecisionRecommendation
  ): Promise<{ id: string }> {
    return await this.prisma.decisionMatrix.create({
      data: {
        userId: input.userId,
        name: input.name,
        description: input.description,
        matrixType: input.matrixType,
        criteria: input.criteria,
        alternatives: input.alternatives,
        scores,
        rankings,
        sensitivity,
        recommendation: recommendation.reasoning.join('. ')
      }
    })
  }

  private extractLocationDataForMatrix(
    metrics: LocationMetrics,
    criteria: Record<string, MatrixCriterion>
  ): Record<string, number> {
    const data: Record<string, number> = {}
    
    for (const criterion of Object.keys(criteria)) {
      switch (criterion) {
        case 'cost':
          data[criterion] = metrics.affordabilityScore || 0.5
          break
        case 'climate':
          data[criterion] = metrics.weatherRating || 0.5
          break
        case 'culture':
          data[criterion] = metrics.cultureRating || 0.5
          break
        case 'safety':
          data[criterion] = metrics.safetyRating || 0.5
          break
        case 'transport':
          data[criterion] = metrics.transportRating || 0.5
          break
        case 'sentiment':
          data[criterion] = Math.max(0, (metrics.averageSentiment || 0 + 1) / 2)
          break
        case 'visits':
          data[criterion] = Math.min(1, metrics.totalVisits / 10)
          break
        case 'time_spent':
          data[criterion] = Math.min(1, metrics.totalTimeSpent / (30 * 24 * 3600)) // 30 days max
          break
        default:
          data[criterion] = 0.5 // Default neutral value
      }
    }
    
    return data
  }

  private extractPropertyDataForMatrix(
    property: any,
    currentPrice: number,
    criteria: Record<string, MatrixCriterion>
  ): Record<string, number> {
    const data: Record<string, number> = {}
    
    for (const criterion of Object.keys(criteria)) {
      switch (criterion) {
        case 'price':
          // Normalize price (you would need market data for proper normalization)
          data[criterion] = Math.max(0, Math.min(1, (1000000 - currentPrice) / 1000000))
          break
        case 'size':
          data[criterion] = Math.max(0, Math.min(1, (property.size || 100) / 200))
          break
        case 'condition':
          data[criterion] = (property.condition || 0.5) // Assuming 0-1 scale
          break
        case 'location':
          data[criterion] = property.locationScore || 0.5
          break
        case 'potential':
          data[criterion] = property.growthPotential || 0.5
          break
        case 'yield':
          data[criterion] = property.rentalYield || 0.05
          break
        default:
          data[criterion] = 0.5 // Default neutral value
      }
    }
    
    return data
  }
}