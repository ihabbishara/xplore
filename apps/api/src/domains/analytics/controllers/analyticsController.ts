import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { LocationAnalyticsService } from '../services/locationAnalyticsService'
import { SentimentAnalysisService } from '../services/sentimentAnalysisService'
import { CostIntelligenceService } from '../services/costIntelligenceService'
import { DecisionMatrixService } from '../services/decisionMatrixService'
import { DashboardService } from '../services/dashboardService'
import { BehaviorPatternService } from '../services/behaviorPatternService'
import { RealtimeAnalyticsService } from '../services/realtimeAnalyticsService'
import { ExportReportingService } from '../services/exportReportingService'
// import { WeatherService } from '../../weather/services/weatherService'
import { validationResult } from 'express-validator'
import { logger } from '../../../shared/utils/logger'

// Type-safe request with user
interface AuthRequest extends Request {
  user?: {
    id: string
    email?: string
  }
}

export class AnalyticsController {
  private locationAnalyticsService: LocationAnalyticsService
  private sentimentAnalysisService: SentimentAnalysisService
  private costIntelligenceService: CostIntelligenceService
  private decisionMatrixService: DecisionMatrixService
  private dashboardService: DashboardService
  private behaviorPatternService: BehaviorPatternService
  private realtimeAnalyticsService?: RealtimeAnalyticsService
  private exportReportingService: ExportReportingService

  constructor(private prisma: PrismaClient, realtimeService?: RealtimeAnalyticsService) {
    this.sentimentAnalysisService = new SentimentAnalysisService()
    // const weatherService = new WeatherService()
    this.locationAnalyticsService = new LocationAnalyticsService(
      prisma,
      this.sentimentAnalysisService
    )
    this.costIntelligenceService = new CostIntelligenceService(prisma)
    this.decisionMatrixService = new DecisionMatrixService(prisma, this.locationAnalyticsService)
    this.behaviorPatternService = new BehaviorPatternService(prisma, this.sentimentAnalysisService)
    this.dashboardService = new DashboardService(
      prisma,
      this.locationAnalyticsService,
      this.sentimentAnalysisService,
      this.costIntelligenceService
    )
    this.exportReportingService = new ExportReportingService(
      prisma,
      this.locationAnalyticsService,
      this.dashboardService,
      this.behaviorPatternService
    )
    this.realtimeAnalyticsService = realtimeService
  }

  /**
   * GET /api/analytics/location/:locationId/metrics
   * Get comprehensive location metrics
   */
  async getLocationMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { locationId } = req.params
      const userId = req.user?.id

      const metrics = await this.locationAnalyticsService.calculateLocationMetrics(locationId, userId)

      res.json({
        success: true,
        data: metrics
      })
    } catch (error) {
      logger.error('Error getting location metrics:', error)
      res.status(500).json({ 
        error: 'Failed to get location metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/locations/compare
   * Compare multiple locations
   */
  async compareLocations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { locationIds, criteria, comparisonName } = req.body
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const comparisonInput = {
        userId,
        locationIds,
        criteria,
        comparisonName
      }

      const comparison = await this.locationAnalyticsService.compareLocations(comparisonInput)

      res.json({
        success: true,
        data: comparison
      })
    } catch (error) {
      logger.error('Error comparing locations:', error)
      res.status(500).json({ 
        error: 'Failed to compare locations',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/location/:locationId/analysis
   * Get complete location analysis
   */
  async getCompleteLocationAnalysis(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { locationId } = req.params
      const userId = req.user?.id

      const analysis = await this.locationAnalyticsService.getCompleteLocationAnalysis(locationId, userId)

      res.json({
        success: true,
        data: analysis
      })
    } catch (error) {
      logger.error('Error getting complete location analysis:', error)
      res.status(500).json({ 
        error: 'Failed to get location analysis',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/sentiment/analyze
   * Analyze sentiment of text
   */
  async analyzeSentiment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { text, language, context } = req.body

      const sentiment = await this.sentimentAnalysisService.analyzeSentiment({
        text,
        language,
        context
      })

      res.json({
        success: true,
        data: sentiment
      })
    } catch (error) {
      logger.error('Error analyzing sentiment:', error)
      res.status(500).json({ 
        error: 'Failed to analyze sentiment',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/sentiment/batch
   * Analyze sentiment of multiple texts
   */
  async batchAnalyzeSentiment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { texts } = req.body

      const results = await this.sentimentAnalysisService.batchAnalyzeSentiment(texts)

      res.json({
        success: true,
        data: results
      })
    } catch (error) {
      logger.error('Error batch analyzing sentiment:', error)
      res.status(500).json({ 
        error: 'Failed to analyze sentiment',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/location/:locationId/cost
   * Get cost analysis for a location
   */
  async getLocationCostAnalysis(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { locationId } = req.params
      const userId = req.user?.id

      const costAnalysis = await this.costIntelligenceService.getLocationCostAnalysis(locationId, userId)

      res.json({
        success: true,
        data: costAnalysis
      })
    } catch (error) {
      logger.error('Error getting location cost analysis:', error)
      res.status(500).json({ 
        error: 'Failed to get cost analysis',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/locations/cost/compare
   * Compare costs between multiple locations
   */
  async compareLocationCosts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { locationIds } = req.body
      const userId = req.user?.id

      const comparison = await this.costIntelligenceService.compareLocationCosts(locationIds, userId)

      res.json({
        success: true,
        data: comparison
      })
    } catch (error) {
      logger.error('Error comparing location costs:', error)
      res.status(500).json({ 
        error: 'Failed to compare location costs',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/location/:locationId/cost/trends
   * Get cost trends for a location
   */
  async getCostTrends(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { locationId } = req.params
      
      const location = await this.prisma.location.findUnique({
        where: { id: locationId },
        select: { country: true }
      })

      if (!location) {
        res.status(404).json({ error: 'Location not found' })
        return
      }

      const trends = await this.costIntelligenceService.getCostTrends(locationId, location.country || 'Unknown')

      res.json({
        success: true,
        data: trends
      })
    } catch (error) {
      logger.error('Error getting cost trends:', error)
      res.status(500).json({ 
        error: 'Failed to get cost trends',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/location/:locationId/cost/predictions
   * Get cost predictions for a location
   */
  async getCostPredictions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { locationId } = req.params
      const { timeframe } = req.query as { timeframe: '3_months' | '6_months' | '1_year' }
      const userId = req.user?.id

      const predictions = await this.costIntelligenceService.predictFutureCosts(
        locationId,
        timeframe || '6_months',
        userId
      )

      res.json({
        success: true,
        data: predictions
      })
    } catch (error) {
      logger.error('Error getting cost predictions:', error)
      res.status(500).json({ 
        error: 'Failed to get cost predictions',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/location/:locationId/cost/index
   * Get living cost index for a location
   */
  async getLivingCostIndex(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { locationId } = req.params
      const { referenceLocationId } = req.query as { referenceLocationId?: string }

      const costIndex = await this.costIntelligenceService.calculateLivingCostIndex(
        locationId,
        referenceLocationId
      )

      res.json({
        success: true,
        data: costIndex
      })
    } catch (error) {
      logger.error('Error getting living cost index:', error)
      res.status(500).json({ 
        error: 'Failed to get living cost index',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/location/:locationId/budget
   * Get budget recommendations for a location
   */
  async getBudgetRecommendations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { locationId } = req.params
      const { monthlyIncome } = req.body
      const userId = req.user?.id

      const recommendations = await this.costIntelligenceService.getBudgetRecommendations(
        locationId,
        monthlyIncome,
        userId
      )

      res.json({
        success: true,
        data: recommendations
      })
    } catch (error) {
      logger.error('Error getting budget recommendations:', error)
      res.status(500).json({ 
        error: 'Failed to get budget recommendations',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/sentiment/emotions
   * Get emotion analysis for text
   */
  async analyzeEmotions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { text, language } = req.query as { text: string; language?: string }

      const emotions = await this.sentimentAnalysisService.analyzeEmotions({
        text,
        language
      })

      res.json({
        success: true,
        data: emotions
      })
    } catch (error) {
      logger.error('Error analyzing emotions:', error)
      res.status(500).json({ 
        error: 'Failed to analyze emotions',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/sentiment/trends
   * Get sentiment trends over time
   */
  async getSentimentTrends(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { locationId } = req.query as { locationId?: string }
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      // Get journal entries for sentiment trend analysis
      const journalEntries = await this.prisma.journalEntry.findMany({
        where: {
          userId,
          ...(locationId && { locationId })
        },
        select: {
          content: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      })

      const textsWithTimestamps = journalEntries.map(entry => ({
        text: entry.content,
        timestamp: entry.createdAt
      }))

      const trends = await this.sentimentAnalysisService.analyzeSentimentTrend(textsWithTimestamps)

      res.json({
        success: true,
        data: trends
      })
    } catch (error) {
      logger.error('Error getting sentiment trends:', error)
      res.status(500).json({ 
        error: 'Failed to get sentiment trends',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/sentiment/category
   * Analyze sentiment by category
   */
  async analyzeSentimentByCategory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { text, categories, language } = req.body

      const sentimentByCategory = await this.sentimentAnalysisService.analyzeSentimentByCategory(
        { text, language },
        categories
      )

      res.json({
        success: true,
        data: sentimentByCategory
      })
    } catch (error) {
      logger.error('Error analyzing sentiment by category:', error)
      res.status(500).json({ 
        error: 'Failed to analyze sentiment by category',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/decision-matrix
   * Create a decision matrix
   */
  async createDecisionMatrix(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { name, description, matrixType, criteria, alternatives } = req.body
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const matrix = await this.decisionMatrixService.createDecisionMatrix({
        userId,
        name,
        description,
        matrixType,
        criteria,
        alternatives
      })

      res.json({
        success: true,
        data: matrix
      })
    } catch (error) {
      logger.error('Error creating decision matrix:', error)
      res.status(500).json({ 
        error: 'Failed to create decision matrix',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/decision-matrix/:matrixId
   * Get a decision matrix
   */
  async getDecisionMatrix(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { matrixId } = req.params
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const matrix = await this.decisionMatrixService.getDecisionMatrix(matrixId, userId)

      res.json({
        success: true,
        data: matrix
      })
    } catch (error) {
      logger.error('Error getting decision matrix:', error)
      res.status(500).json({ 
        error: 'Failed to get decision matrix',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/decision-matrices
   * List user's decision matrices
   */
  async listDecisionMatrices(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { matrixType, limit = 20, offset = 0 } = req.query as {
        matrixType?: string
        limit?: number
        offset?: number
      }
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const result = await this.decisionMatrixService.listDecisionMatrices(
        userId,
        matrixType,
        Number(limit),
        Number(offset)
      )

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error('Error listing decision matrices:', error)
      res.status(500).json({ 
        error: 'Failed to list decision matrices',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * PUT /api/analytics/decision-matrix/:matrixId
   * Update a decision matrix
   */
  async updateDecisionMatrix(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { matrixId } = req.params
      const updates = req.body
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const matrix = await this.decisionMatrixService.updateDecisionMatrix(matrixId, userId, updates)

      res.json({
        success: true,
        data: matrix
      })
    } catch (error) {
      logger.error('Error updating decision matrix:', error)
      res.status(500).json({ 
        error: 'Failed to update decision matrix',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * DELETE /api/analytics/decision-matrix/:matrixId
   * Delete a decision matrix
   */
  async deleteDecisionMatrix(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { matrixId } = req.params
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      await this.decisionMatrixService.deleteDecisionMatrix(matrixId, userId)

      res.json({
        success: true,
        message: 'Decision matrix deleted successfully'
      })
    } catch (error) {
      logger.error('Error deleting decision matrix:', error)
      res.status(500).json({ 
        error: 'Failed to delete decision matrix',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/decision-matrix/location-comparison
   * Create location comparison matrix
   */
  async createLocationComparisonMatrix(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { locationIds, criteria, name } = req.body
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const matrix = await this.decisionMatrixService.createLocationComparisonMatrix(
        userId,
        locationIds,
        criteria,
        name
      )

      res.json({
        success: true,
        data: matrix
      })
    } catch (error) {
      logger.error('Error creating location comparison matrix:', error)
      res.status(500).json({ 
        error: 'Failed to create location comparison matrix',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/decision-matrix/property-comparison
   * Create property comparison matrix
   */
  async createPropertyComparisonMatrix(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { propertyIds, criteria, name } = req.body
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const matrix = await this.decisionMatrixService.createPropertyComparisonMatrix(
        userId,
        propertyIds,
        criteria,
        name
      )

      res.json({
        success: true,
        data: matrix
      })
    } catch (error) {
      logger.error('Error creating property comparison matrix:', error)
      res.status(500).json({ 
        error: 'Failed to create property comparison matrix',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/decision-matrix/templates
   * Get decision matrix templates
   */
  async getMatrixTemplates(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { matrixType } = req.query as { matrixType: string }

      const templates = await this.decisionMatrixService.getMatrixTemplates(matrixType)

      res.json({
        success: true,
        data: templates
      })
    } catch (error) {
      logger.error('Error getting matrix templates:', error)
      res.status(500).json({ 
        error: 'Failed to get matrix templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/dashboard/overview
   * Get dashboard overview
   */
  async getDashboardOverview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const { dateFrom, dateTo, locations, categories } = req.query as {
        dateFrom?: string
        dateTo?: string
        locations?: string
        categories?: string
      }

      const filters = {
        ...(dateFrom && dateTo && {
          dateRange: {
            start: new Date(dateFrom),
            end: new Date(dateTo)
          }
        }),
        ...(locations && { locations: locations.split(',') }),
        ...(categories && { categories: categories.split(',') })
      }

      const overview = await this.dashboardService.getDashboardOverview(userId, filters)

      res.json({
        success: true,
        data: overview
      })
    } catch (error) {
      logger.error('Error getting dashboard overview:', error)
      res.status(500).json({ 
        error: 'Failed to get dashboard overview',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/dashboard/insights
   * Get dashboard insights
   */
  async getDashboardInsights(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const { dateFrom, dateTo, categories, limit = 20, offset = 0 } = req.query as {
        dateFrom?: string
        dateTo?: string
        categories?: string
        limit?: number
        offset?: number
      }

      const filters = {
        userId,
        ...(dateFrom && { dateFrom: new Date(dateFrom) }),
        ...(dateTo && { dateTo: new Date(dateTo) }),
        ...(categories && { categories: categories.split(',') }),
        limit: Number(limit),
        offset: Number(offset)
      }

      const insights = await this.dashboardService.getDashboardInsights(userId, filters)

      res.json({
        success: true,
        data: insights
      })
    } catch (error) {
      logger.error('Error getting dashboard insights:', error)
      res.status(500).json({ 
        error: 'Failed to get dashboard insights',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/dashboard/sentiment/trends
   * Get sentiment trends
   */
  async getDashboardSentimentTrends(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const { period = 'month', locationId } = req.query as {
        period?: 'week' | 'month' | 'quarter' | 'year'
        locationId?: string
      }

      const trends = await this.dashboardService.getSentimentTrends(userId, period, locationId)

      res.json({
        success: true,
        data: trends
      })
    } catch (error) {
      logger.error('Error getting sentiment trends:', error)
      res.status(500).json({ 
        error: 'Failed to get sentiment trends',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/dashboard/cost/trends
   * Get cost trends
   */
  async getDashboardCostTrends(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const { period = 'month' } = req.query as {
        period?: 'week' | 'month' | 'quarter' | 'year'
      }

      const trends = await this.dashboardService.getCostTrends(userId, period)

      res.json({
        success: true,
        data: trends
      })
    } catch (error) {
      logger.error('Error getting cost trends:', error)
      res.status(500).json({ 
        error: 'Failed to get cost trends',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/dashboard/location/compare
   * Get location comparison for dashboard
   */
  async getDashboardLocationComparison(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const { locationIds, criteria } = req.body

      const comparison = await this.dashboardService.getLocationComparison(
        userId,
        locationIds,
        criteria
      )

      res.json({
        success: true,
        data: comparison
      })
    } catch (error) {
      logger.error('Error getting location comparison:', error)
      res.status(500).json({ 
        error: 'Failed to get location comparison',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/dashboard/insights/generate
   * Generate insights for dashboard
   */
  async generateDashboardInsights(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      await this.dashboardService.generateInsights(userId)

      res.json({
        success: true,
        message: 'Insights generated successfully'
      })
    } catch (error) {
      logger.error('Error generating insights:', error)
      res.status(500).json({ 
        error: 'Failed to generate insights',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/dashboard/cache/refresh
   * Refresh dashboard cache
   */
  async refreshDashboardCache(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      await this.dashboardService.updateDashboardCache(userId)

      res.json({
        success: true,
        message: 'Dashboard cache refreshed successfully'
      })
    } catch (error) {
      logger.error('Error refreshing dashboard cache:', error)
      res.status(500).json({ 
        error: 'Failed to refresh dashboard cache',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/behavior/analyze
   * Analyze user behavior patterns
   */
  async analyzeBehaviorPatterns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const result = await this.behaviorPatternService.analyzeUserBehaviorPatterns(userId)

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error('Error analyzing behavior patterns:', error)
      res.status(500).json({ 
        error: 'Failed to analyze behavior patterns',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/behavior/biases
   * Detect cognitive biases
   */
  async detectCognitiveBiases(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const biases = await this.behaviorPatternService.detectCognitiveBiases(userId)

      res.json({
        success: true,
        data: biases
      })
    } catch (error) {
      logger.error('Error detecting cognitive biases:', error)
      res.status(500).json({ 
        error: 'Failed to detect cognitive biases',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/behavior/insights
   * Get behavior insights
   */
  async getBehaviorInsights(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const insights = await this.behaviorPatternService.getBehaviorInsights(userId)

      res.json({
        success: true,
        data: insights
      })
    } catch (error) {
      logger.error('Error getting behavior insights:', error)
      res.status(500).json({ 
        error: 'Failed to get behavior insights',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/behavior/predict
   * Predict user behavior
   */
  async predictBehavior(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const { scenario, context } = req.body

      const prediction = await this.behaviorPatternService.predictUserBehavior(userId, scenario, context)

      res.json({
        success: true,
        data: prediction
      })
    } catch (error) {
      logger.error('Error predicting behavior:', error)
      res.status(500).json({ 
        error: 'Failed to predict behavior',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/behavior/patterns
   * List behavior patterns
   */
  async listBehaviorPatterns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const { patternType, category, onlyActive = true } = req.query as {
        patternType?: string
        category?: string
        onlyActive?: boolean
      }

      const patterns = await this.behaviorPatternService.listBehaviorPatterns(
        userId,
        patternType,
        category,
        Boolean(onlyActive)
      )

      res.json({
        success: true,
        data: patterns
      })
    } catch (error) {
      logger.error('Error listing behavior patterns:', error)
      res.status(500).json({ 
        error: 'Failed to list behavior patterns',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/realtime/queue-job
   * Queue a real-time processing job
   */
  async queueRealtimeJob(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      if (!this.realtimeAnalyticsService) {
        res.status(503).json({ error: 'Real-time analytics service not available' })
        return
      }

      const { jobType, data, priority = 'medium' } = req.body

      const jobId = await this.realtimeAnalyticsService.queueProcessingJob(userId, jobType, data, priority)

      res.json({
        success: true,
        data: { jobId }
      })
    } catch (error) {
      logger.error('Error queuing real-time job:', error)
      res.status(500).json({ 
        error: 'Failed to queue real-time job',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/realtime/job/:jobId
   * Get job status
   */
  async getJobStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const { jobId } = req.params

      if (!this.realtimeAnalyticsService) {
        res.status(503).json({ error: 'Real-time analytics service not available' })
        return
      }

      const status = await this.realtimeAnalyticsService.getJobStatus(jobId)

      if (!status) {
        res.status(404).json({ error: 'Job not found' })
        return
      }

      res.json({
        success: true,
        data: status
      })
    } catch (error) {
      logger.error('Error getting job status:', error)
      res.status(500).json({ 
        error: 'Failed to get job status',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/realtime/metrics
   * Get real-time metrics
   */
  async getRealtimeMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      if (!this.realtimeAnalyticsService) {
        res.status(503).json({ error: 'Real-time analytics service not available' })
        return
      }

      const metrics = this.realtimeAnalyticsService.getRealtimeMetrics()

      res.json({
        success: true,
        data: metrics
      })
    } catch (error) {
      logger.error('Error getting real-time metrics:', error)
      res.status(500).json({ 
        error: 'Failed to get real-time metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/realtime/process-update
   * Process real-time analytics update
   */
  async processRealtimeUpdate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      if (!this.realtimeAnalyticsService) {
        res.status(503).json({ error: 'Real-time analytics service not available' })
        return
      }

      const { type, data, locationId } = req.body

      const update = {
        type,
        data,
        timestamp: new Date(),
        userId,
        locationId
      }

      await this.realtimeAnalyticsService.processRealtimeUpdate(update)

      res.json({
        success: true,
        message: 'Real-time update processed successfully'
      })
    } catch (error) {
      logger.error('Error processing real-time update:', error)
      res.status(500).json({ 
        error: 'Failed to process real-time update',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Export and Reporting Endpoints

  /**
   * POST /api/analytics/export
   * Export analytics data in specified format
   */
  async exportAnalyticsData(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const exportOptions = req.body

      const result = await this.exportReportingService.exportData(userId, exportOptions)

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error('Error exporting analytics data:', error)
      res.status(500).json({ 
        error: 'Failed to export analytics data',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/export/templates
   * Get available export templates
   */
  async getExportTemplates(req: AuthRequest, res: Response): Promise<void> {
    try {
      const templates = await this.exportReportingService.getExportTemplates()

      res.json({
        success: true,
        data: templates
      })
    } catch (error) {
      logger.error('Error getting export templates:', error)
      res.status(500).json({ 
        error: 'Failed to get export templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/export/template/:templateId
   * Generate report from template
   */
  async generateReportFromTemplate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const { templateId } = req.params
      const customOptions = req.body

      const result = await this.exportReportingService.generateFromTemplate(
        userId,
        templateId,
        customOptions
      )

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error('Error generating report from template:', error)
      res.status(500).json({ 
        error: 'Failed to generate report from template',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * POST /api/analytics/export/schedule
   * Schedule recurring export
   */
  async scheduleRecurringExport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() })
        return
      }

      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const { options, frequency } = req.body

      const result = await this.exportReportingService.scheduleRecurringExport(
        userId,
        options,
        frequency
      )

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error('Error scheduling recurring export:', error)
      res.status(500).json({ 
        error: 'Failed to schedule recurring export',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/export/history
   * Get export history for user
   */
  async getExportHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const { limit = 20, offset = 0 } = req.query as {
        limit?: number
        offset?: number
      }

      const result = await this.exportReportingService.getExportHistory(
        userId,
        Number(limit),
        Number(offset)
      )

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error('Error getting export history:', error)
      res.status(500).json({ 
        error: 'Failed to get export history',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * GET /api/analytics/export/summary
   * Generate summary report
   */
  async generateSummaryReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const { start, end } = req.query as {
        start?: string
        end?: string
      }

      const dateRange = start && end ? {
        start: new Date(start),
        end: new Date(end)
      } : undefined

      const result = await this.exportReportingService.generateSummaryReport(
        userId,
        dateRange
      )

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error('Error generating summary report:', error)
      res.status(500).json({ 
        error: 'Failed to generate summary report',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * DELETE /api/analytics/export/cleanup
   * Cleanup old export files (admin only)
   */
  async cleanupOldExports(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Check if user is admin (simplified check)
      const isAdmin = req.user?.email?.endsWith('@admin.com')
      
      if (!isAdmin) {
        res.status(403).json({ error: 'Admin access required' })
        return
      }

      const { maxAge } = req.query as { maxAge?: string }
      const maxAgeMs = maxAge ? parseInt(maxAge) : undefined

      await this.exportReportingService.cleanupOldExports(maxAgeMs)

      res.json({
        success: true,
        message: 'Old export files cleaned up successfully'
      })
    } catch (error) {
      logger.error('Error cleaning up old exports:', error)
      res.status(500).json({ 
        error: 'Failed to cleanup old exports',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}