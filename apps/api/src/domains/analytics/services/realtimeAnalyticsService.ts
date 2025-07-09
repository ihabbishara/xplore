import { PrismaClient } from '@prisma/client'
import { Server as SocketServer } from 'socket.io'
import { 
  RealtimeAnalyticsUpdate,
  AnalyticsProcessingJob,
  LocationMetrics,
  SentimentResult
} from '../types/analytics.types'
import { LocationAnalyticsService } from './locationAnalyticsService'
import { SentimentAnalysisService } from './sentimentAnalysisService'
import { DashboardService } from './dashboardService'
import { BehaviorPatternService } from './behaviorPatternService'
import { redis } from '../../../lib/redis'
import { logger } from '../../../shared/utils/logger'
import EventEmitter from 'events'

interface ProcessingQueue {
  id: string
  type: 'insight_generation' | 'pattern_analysis' | 'prediction' | 'comparison'
  userId: string
  data: any
  priority: 'high' | 'medium' | 'low'
  createdAt: Date
  attempts: number
}

interface RealtimeMetrics {
  activeUsers: number
  processingJobs: number
  completedJobs: number
  errorRate: number
  averageProcessingTime: number
}

interface WebSocketSession {
  userId: string
  socketId: string
  subscribedTopics: string[]
  lastActivity: Date
}

export class RealtimeAnalyticsService extends EventEmitter {
  private io: SocketServer
  private processingQueue: ProcessingQueue[] = []
  private processingJobs: Map<string, AnalyticsProcessingJob> = new Map()
  private activeSessions: Map<string, WebSocketSession> = new Map()
  private isProcessing = false
  private metrics: RealtimeMetrics = {
    activeUsers: 0,
    processingJobs: 0,
    completedJobs: 0,
    errorRate: 0,
    averageProcessingTime: 0
  }

  constructor(
    private prisma: PrismaClient,
    private locationAnalyticsService: LocationAnalyticsService,
    private sentimentAnalysisService: SentimentAnalysisService,
    private dashboardService: DashboardService,
    private behaviorPatternService: BehaviorPatternService,
    io: SocketServer
  ) {
    super()
    this.io = io
    this.setupWebSocketHandlers()
    this.startProcessingLoop()
    this.startMetricsCollection()
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info(`WebSocket connected: ${socket.id}`)

      socket.on('authenticate', async (data: { userId: string, token: string }) => {
        try {
          // Validate token and authenticate user
          const isValid = await this.validateUserToken(data.userId, data.token)
          
          if (isValid) {
            this.activeSessions.set(socket.id, {
              userId: data.userId,
              socketId: socket.id,
              subscribedTopics: [],
              lastActivity: new Date()
            })
            
            socket.emit('authenticated', { success: true })
            this.updateMetrics()
            
            // Send current analytics state
            await this.sendInitialAnalytics(socket.id, data.userId)
          } else {
            socket.emit('authentication_failed', { error: 'Invalid credentials' })
            socket.disconnect()
          }
        } catch (error) {
          logger.error('Authentication error:', error)
          socket.emit('authentication_failed', { error: 'Authentication failed' })
          socket.disconnect()
        }
      })

      socket.on('subscribe', (data: { topics: string[] }) => {
        const session = this.activeSessions.get(socket.id)
        if (session) {
          session.subscribedTopics = data.topics
          session.lastActivity = new Date()
          
          // Join socket rooms for subscribed topics
          data.topics.forEach(topic => {
            socket.join(`${session.userId}:${topic}`)
          })
          
          socket.emit('subscribed', { topics: data.topics })
        }
      })

      socket.on('unsubscribe', (data: { topics: string[] }) => {
        const session = this.activeSessions.get(socket.id)
        if (session) {
          data.topics.forEach(topic => {
            socket.leave(`${session.userId}:${topic}`)
            const index = session.subscribedTopics.indexOf(topic)
            if (index > -1) {
              session.subscribedTopics.splice(index, 1)
            }
          })
          
          socket.emit('unsubscribed', { topics: data.topics })
        }
      })

      socket.on('request_analytics', async (data: { type: string, filters?: any }) => {
        const session = this.activeSessions.get(socket.id)
        if (session) {
          await this.handleAnalyticsRequest(session.userId, data.type, data.filters, socket.id)
        }
      })

      socket.on('disconnect', () => {
        this.activeSessions.delete(socket.id)
        this.updateMetrics()
        logger.info(`WebSocket disconnected: ${socket.id}`)
      })
    })
  }

  /**
   * Process real-time analytics updates
   */
  async processRealtimeUpdate(update: RealtimeAnalyticsUpdate): Promise<void> {
    try {
      // Store update in database
      await this.storeAnalyticsUpdate(update)
      
      // Process based on update type
      switch (update.type) {
        case 'insight':
          await this.processInsightUpdate(update)
          break
        case 'metric':
          await this.processMetricUpdate(update)
          break
        case 'comparison':
          await this.processComparisonUpdate(update)
          break
        case 'prediction':
          await this.processPredictionUpdate(update)
          break
      }

      // Emit to subscribed clients
      this.broadcastUpdate(update)
      
    } catch (error) {
      logger.error('Error processing realtime update:', error)
      this.emit('processing_error', { update, error })
    }
  }

  /**
   * Queue analytics processing job
   */
  async queueProcessingJob(
    userId: string,
    jobType: 'insight_generation' | 'pattern_analysis' | 'prediction' | 'comparison',
    data: any,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<string> {
    const jobId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const job: ProcessingQueue = {
      id: jobId,
      type: jobType,
      userId,
      data,
      priority,
      createdAt: new Date(),
      attempts: 0
    }

    // Insert job based on priority
    const insertIndex = this.processingQueue.findIndex(q => 
      this.getPriorityValue(q.priority) < this.getPriorityValue(priority)
    )
    
    if (insertIndex === -1) {
      this.processingQueue.push(job)
    } else {
      this.processingQueue.splice(insertIndex, 0, job)
    }

    // Create job record in database
    await this.createProcessingJob(jobId, userId, jobType, data)
    
    logger.info(`Queued ${jobType} job ${jobId} for user ${userId}`)
    return jobId
  }

  /**
   * Get processing job status
   */
  async getJobStatus(jobId: string): Promise<AnalyticsProcessingJob | null> {
    return this.processingJobs.get(jobId) || null
  }

  /**
   * Stream analytics data to client
   */
  async streamAnalytics(
    userId: string,
    dataType: 'sentiment' | 'cost' | 'metrics' | 'insights',
    filters?: any
  ): Promise<void> {
    const sessionKey = `stream:${userId}:${dataType}`
    
    try {
      // Get initial data
      let initialData: any
      
      switch (dataType) {
        case 'sentiment':
          initialData = await this.getSentimentStream(userId, filters)
          break
        case 'cost':
          initialData = await this.getCostStream(userId, filters)
          break
        case 'metrics':
          initialData = await this.getMetricsStream(userId, filters)
          break
        case 'insights':
          initialData = await this.getInsightsStream(userId, filters)
          break
      }

      // Send initial data
      this.io.to(`${userId}:${dataType}`).emit('stream_data', {
        type: dataType,
        data: initialData,
        timestamp: new Date()
      })

      // Set up continuous streaming
      this.setupContinuousStream(userId, dataType, filters)
      
    } catch (error) {
      logger.error('Error streaming analytics:', error)
      this.io.to(`${userId}:${dataType}`).emit('stream_error', {
        type: dataType,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Process location analytics in real-time
   */
  async processLocationAnalytics(userId: string, locationId: string): Promise<void> {
    try {
      // Queue high-priority job for location analytics
      const jobId = await this.queueProcessingJob(
        userId,
        'insight_generation',
        { locationId, type: 'location_metrics' },
        'high'
      )

      // Emit job queued event
      this.io.to(`${userId}:metrics`).emit('job_queued', {
        jobId,
        type: 'location_metrics',
        locationId,
        estimatedDuration: 30000 // 30 seconds
      })

    } catch (error) {
      logger.error('Error processing location analytics:', error)
    }
  }

  /**
   * Process sentiment analysis in real-time
   */
  async processSentimentAnalysis(userId: string, text: string, context?: any): Promise<void> {
    try {
      // Analyze sentiment immediately for real-time feedback
      const sentiment = await this.sentimentAnalysisService.analyzeSentiment({ text })
      
      // Emit real-time sentiment result
      this.io.to(`${userId}:sentiment`).emit('sentiment_result', {
        text,
        sentiment,
        context,
        timestamp: new Date()
      })

      // Queue pattern analysis job
      await this.queueProcessingJob(
        userId,
        'pattern_analysis',
        { text, sentiment, context },
        'low'
      )

    } catch (error) {
      logger.error('Error processing sentiment analysis:', error)
    }
  }

  /**
   * Generate real-time insights
   */
  async generateRealtimeInsights(userId: string): Promise<void> {
    try {
      const jobId = await this.queueProcessingJob(
        userId,
        'insight_generation',
        { type: 'comprehensive_insights' },
        'medium'
      )

      // Emit job queued event
      this.io.to(`${userId}:insights`).emit('insights_generation_started', {
        jobId,
        estimatedDuration: 60000 // 60 seconds
      })

    } catch (error) {
      logger.error('Error generating real-time insights:', error)
    }
  }

  /**
   * Get real-time metrics
   */
  getRealtimeMetrics(): RealtimeMetrics {
    return { ...this.metrics }
  }

  // Private methods

  private async validateUserToken(userId: string, token: string): Promise<boolean> {
    try {
      // Validate JWT token or session token
      // This is a simplified implementation
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      })
      
      return user !== null // Simplified validation
    } catch (error) {
      logger.error('Token validation error:', error)
      return false
    }
  }

  private async sendInitialAnalytics(socketId: string, userId: string): Promise<void> {
    try {
      // Get dashboard overview
      const overview = await this.dashboardService.getDashboardOverview(userId)
      
      // Send initial data
      this.io.to(socketId).emit('initial_analytics', {
        overview,
        timestamp: new Date()
      })
    } catch (error) {
      logger.error('Error sending initial analytics:', error)
    }
  }

  private startProcessingLoop(): void {
    setInterval(async () => {
      if (this.isProcessing || this.processingQueue.length === 0) return
      
      this.isProcessing = true
      
      try {
        const job = this.processingQueue.shift()
        if (job) {
          await this.executeProcessingJob(job)
        }
      } catch (error) {
        logger.error('Error in processing loop:', error)
      } finally {
        this.isProcessing = false
      }
    }, 1000) // Process every second
  }

  private async executeProcessingJob(job: ProcessingQueue): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Update job status
      const jobRecord: AnalyticsProcessingJob = {
        id: job.id,
        userId: job.userId,
        jobType: job.type,
        status: 'processing',
        progress: 0,
        startedAt: new Date(),
        error: undefined,
        result: undefined
      }
      
      this.processingJobs.set(job.id, jobRecord)
      
      // Emit job started event
      this.io.to(`${job.userId}:jobs`).emit('job_started', {
        jobId: job.id,
        type: job.type
      })

      let result: any
      
      // Process based on job type
      switch (job.type) {
        case 'insight_generation':
          result = await this.executeInsightGeneration(job)
          break
        case 'pattern_analysis':
          result = await this.executePatternAnalysis(job)
          break
        case 'prediction':
          result = await this.executePrediction(job)
          break
        case 'comparison':
          result = await this.executeComparison(job)
          break
      }

      // Update job completion
      const endTime = Date.now()
      const duration = endTime - startTime
      
      jobRecord.status = 'completed'
      jobRecord.progress = 100
      jobRecord.completedAt = new Date()
      jobRecord.result = result
      
      this.processingJobs.set(job.id, jobRecord)
      
      // Update metrics
      this.metrics.completedJobs++
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime * (this.metrics.completedJobs - 1) + duration) / this.metrics.completedJobs
      
      // Emit job completed event
      this.io.to(`${job.userId}:jobs`).emit('job_completed', {
        jobId: job.id,
        type: job.type,
        result,
        duration
      })

      // Emit specific result based on job type
      await this.emitJobResult(job.userId, job.type, result)
      
    } catch (error) {
      logger.error(`Error executing job ${job.id}:`, error)
      
      // Update job error
      const jobRecord = this.processingJobs.get(job.id)
      if (jobRecord) {
        jobRecord.status = 'failed'
        jobRecord.error = error instanceof Error ? error.message : 'Unknown error'
        jobRecord.completedAt = new Date()
        this.processingJobs.set(job.id, jobRecord)
      }
      
      // Update metrics
      this.metrics.errorRate = (this.metrics.errorRate * this.metrics.completedJobs + 1) / (this.metrics.completedJobs + 1)
      
      // Emit job failed event
      this.io.to(`${job.userId}:jobs`).emit('job_failed', {
        jobId: job.id,
        type: job.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async executeInsightGeneration(job: ProcessingQueue): Promise<any> {
    const { data } = job
    
    if (data.type === 'location_metrics') {
      // Calculate location metrics
      const metrics = await this.locationAnalyticsService.calculateLocationMetrics(
        data.locationId,
        job.userId
      )
      
      return {
        type: 'location_metrics',
        locationId: data.locationId,
        metrics
      }
    } else if (data.type === 'comprehensive_insights') {
      // Generate comprehensive insights
      await this.dashboardService.generateInsights(job.userId)
      
      const insights = await this.dashboardService.getDashboardInsights(job.userId)
      
      return {
        type: 'comprehensive_insights',
        insights
      }
    }
    
    return null
  }

  private async executePatternAnalysis(job: ProcessingQueue): Promise<any> {
    const { data } = job
    
    // Analyze behavior patterns
    const patterns = await this.behaviorPatternService.analyzeUserBehaviorPatterns(job.userId)
    
    return {
      type: 'pattern_analysis',
      patterns,
      context: data.context
    }
  }

  private async executePrediction(job: ProcessingQueue): Promise<any> {
    const { data } = job
    
    // Execute prediction logic
    const prediction = await this.behaviorPatternService.predictUserBehavior(
      job.userId,
      data.scenario,
      data.context
    )
    
    return {
      type: 'prediction',
      prediction,
      scenario: data.scenario
    }
  }

  private async executeComparison(job: ProcessingQueue): Promise<any> {
    const { data } = job
    
    // Execute comparison logic
    const comparison = await this.locationAnalyticsService.compareLocations({
      userId: job.userId,
      locationIds: data.locationIds,
      criteria: data.criteria,
      comparisonName: data.comparisonName
    })
    
    return {
      type: 'comparison',
      comparison
    }
  }

  private async emitJobResult(userId: string, jobType: string, result: any): Promise<void> {
    switch (jobType) {
      case 'insight_generation':
        if (result.type === 'location_metrics') {
          this.io.to(`${userId}:metrics`).emit('metrics_updated', {
            locationId: result.locationId,
            metrics: result.metrics,
            timestamp: new Date()
          })
        } else if (result.type === 'comprehensive_insights') {
          this.io.to(`${userId}:insights`).emit('insights_updated', {
            insights: result.insights,
            timestamp: new Date()
          })
        }
        break
      case 'pattern_analysis':
        this.io.to(`${userId}:patterns`).emit('patterns_updated', {
          patterns: result.patterns,
          timestamp: new Date()
        })
        break
      case 'prediction':
        this.io.to(`${userId}:predictions`).emit('prediction_result', {
          prediction: result.prediction,
          scenario: result.scenario,
          timestamp: new Date()
        })
        break
      case 'comparison':
        this.io.to(`${userId}:comparisons`).emit('comparison_result', {
          comparison: result.comparison,
          timestamp: new Date()
        })
        break
    }
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMetrics()
    }, 10000) // Update every 10 seconds
  }

  private updateMetrics(): void {
    this.metrics.activeUsers = this.activeSessions.size
    this.metrics.processingJobs = this.processingQueue.length
    
    // Emit metrics to admin users
    this.io.to('admin').emit('metrics_updated', this.metrics)
  }

  private getPriorityValue(priority: 'high' | 'medium' | 'low'): number {
    switch (priority) {
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 1
    }
  }

  private async storeAnalyticsUpdate(update: RealtimeAnalyticsUpdate): Promise<void> {
    try {
      await redis.lPush(
        `analytics_updates:${update.userId}`,
        JSON.stringify(update)
      )
      
      // Keep only last 1000 updates
      await redis.lTrim(`analytics_updates:${update.userId}`, 0, 999)
    } catch (error) {
      logger.error('Error storing analytics update:', error)
    }
  }

  private broadcastUpdate(update: RealtimeAnalyticsUpdate): void {
    const topic = `${update.userId}:${update.type}`
    this.io.to(topic).emit('analytics_update', update)
  }

  private async processInsightUpdate(update: RealtimeAnalyticsUpdate): Promise<void> {
    // Process insight-specific logic
    logger.info(`Processing insight update for user ${update.userId}`)
  }

  private async processMetricUpdate(update: RealtimeAnalyticsUpdate): Promise<void> {
    // Process metric-specific logic
    logger.info(`Processing metric update for user ${update.userId}`)
  }

  private async processComparisonUpdate(update: RealtimeAnalyticsUpdate): Promise<void> {
    // Process comparison-specific logic
    logger.info(`Processing comparison update for user ${update.userId}`)
  }

  private async processPredictionUpdate(update: RealtimeAnalyticsUpdate): Promise<void> {
    // Process prediction-specific logic
    logger.info(`Processing prediction update for user ${update.userId}`)
  }

  private async createProcessingJob(
    jobId: string,
    userId: string,
    jobType: string,
    data: any
  ): Promise<void> {
    try {
      await this.prisma.analyticsProcessingJob.create({
        data: {
          id: jobId,
          userId,
          jobType,
          status: 'pending',
          progress: 0,
          startedAt: new Date(),
          data
        }
      })
    } catch (error) {
      logger.error('Error creating processing job:', error)
    }
  }

  private async handleAnalyticsRequest(
    userId: string,
    type: string,
    filters: any,
    socketId: string
  ): Promise<void> {
    try {
      switch (type) {
        case 'dashboard_overview':
          const overview = await this.dashboardService.getDashboardOverview(userId, filters)
          this.io.to(socketId).emit('analytics_response', {
            type: 'dashboard_overview',
            data: overview
          })
          break
        case 'sentiment_trends':
          const trends = await this.dashboardService.getSentimentTrends(userId, filters?.period)
          this.io.to(socketId).emit('analytics_response', {
            type: 'sentiment_trends',
            data: trends
          })
          break
        case 'behavior_patterns':
          const patterns = await this.behaviorPatternService.analyzeUserBehaviorPatterns(userId)
          this.io.to(socketId).emit('analytics_response', {
            type: 'behavior_patterns',
            data: patterns
          })
          break
      }
    } catch (error) {
      logger.error('Error handling analytics request:', error)
      this.io.to(socketId).emit('analytics_error', {
        type,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private setupContinuousStream(userId: string, dataType: string, filters?: any): void {
    // Set up periodic data streaming
    const interval = setInterval(async () => {
      try {
        let streamData: any
        
        switch (dataType) {
          case 'sentiment':
            streamData = await this.getSentimentStream(userId, filters)
            break
          case 'metrics':
            streamData = await this.getMetricsStream(userId, filters)
            break
        }
        
        if (streamData) {
          this.io.to(`${userId}:${dataType}`).emit('stream_update', {
            type: dataType,
            data: streamData,
            timestamp: new Date()
          })
        }
      } catch (error) {
        logger.error('Error in continuous stream:', error)
      }
    }, 30000) // Update every 30 seconds
    
    // Clean up interval when user disconnects
    this.on('user_disconnected', (disconnectedUserId: string) => {
      if (disconnectedUserId === userId) {
        clearInterval(interval)
      }
    })
  }

  private async getSentimentStream(userId: string, filters?: any): Promise<any> {
    return this.dashboardService.getSentimentTrends(userId, filters?.period)
  }

  private async getCostStream(userId: string, filters?: any): Promise<any> {
    return this.dashboardService.getCostTrends(userId, filters?.period)
  }

  private async getMetricsStream(userId: string, filters?: any): Promise<any> {
    return this.dashboardService.getDashboardOverview(userId, filters)
  }

  private async getInsightsStream(userId: string, filters?: any): Promise<any> {
    return this.dashboardService.getDashboardInsights(userId, filters)
  }
}