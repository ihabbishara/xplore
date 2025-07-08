import { Server as HTTPServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { RealtimeAnalyticsService } from '../services/realtimeAnalyticsService'
import { LocationAnalyticsService } from '../services/locationAnalyticsService'
import { SentimentAnalysisService } from '../services/sentimentAnalysisService'
import { DashboardService } from '../services/dashboardService'
import { BehaviorPatternService } from '../services/behaviorPatternService'
import { WeatherService } from '../../weather/services/weatherService'
import { logger } from '../../../lib/logger'
import { authMiddleware } from '../../../middleware/authMiddleware'
import jwt from 'jsonwebtoken'

export class AnalyticsWebSocket {
  private io: SocketServer
  private realtimeService: RealtimeAnalyticsService
  private prisma: PrismaClient

  constructor(httpServer: HTTPServer, prisma: PrismaClient) {
    this.prisma = prisma
    
    // Initialize Socket.IO
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    })

    // Initialize services
    this.initializeServices()
    
    // Setup WebSocket middleware
    this.setupMiddleware()
    
    // Setup namespace handlers
    this.setupNamespaces()
  }

  private initializeServices(): void {
    const sentimentAnalysisService = new SentimentAnalysisService()
    const weatherService = new WeatherService()
    const locationAnalyticsService = new LocationAnalyticsService(
      this.prisma,
      sentimentAnalysisService,
      weatherService
    )
    const dashboardService = new DashboardService(
      this.prisma,
      locationAnalyticsService,
      sentimentAnalysisService,
      null as any // CostIntelligenceService will be injected
    )
    const behaviorPatternService = new BehaviorPatternService(
      this.prisma,
      sentimentAnalysisService
    )

    this.realtimeService = new RealtimeAnalyticsService(
      this.prisma,
      locationAnalyticsService,
      sentimentAnalysisService,
      dashboardService,
      behaviorPatternService,
      this.io
    )
  }

  private setupMiddleware(): void {
    // Authentication middleware for WebSocket
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token
        
        if (!token) {
          return next(new Error('Authentication token required'))
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        
        // Get user from database
        const user = await this.prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true }
        })

        if (!user) {
          return next(new Error('User not found'))
        }

        // Attach user to socket
        socket.data.user = user
        next()
      } catch (error) {
        logger.error('WebSocket authentication error:', error)
        next(new Error('Authentication failed'))
      }
    })

    // Rate limiting middleware
    this.io.use((socket, next) => {
      const rateLimitKey = `rate_limit:${socket.data.user?.id || socket.id}`
      // Implement rate limiting logic here
      next()
    })
  }

  private setupNamespaces(): void {
    // Analytics namespace
    const analyticsNamespace = this.io.of('/analytics')
    
    analyticsNamespace.on('connection', (socket) => {
      const userId = socket.data.user?.id
      
      if (!userId) {
        socket.disconnect()
        return
      }

      logger.info(`Analytics WebSocket connected: ${socket.id} for user ${userId}`)

      // Join user-specific room
      socket.join(`user:${userId}`)

      // Handle real-time analytics subscriptions
      socket.on('subscribe_analytics', (data: { types: string[] }) => {
        data.types.forEach(type => {
          socket.join(`analytics:${type}:${userId}`)
        })
        
        socket.emit('subscribed_analytics', { types: data.types })
      })

      // Handle location analytics requests
      socket.on('request_location_analytics', async (data: { locationId: string }) => {
        try {
          await this.realtimeService.processLocationAnalytics(userId, data.locationId)
        } catch (error) {
          socket.emit('error', { 
            type: 'location_analytics_error',
            message: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })

      // Handle sentiment analysis requests
      socket.on('analyze_sentiment', async (data: { text: string, context?: any }) => {
        try {
          await this.realtimeService.processSentimentAnalysis(userId, data.text, data.context)
        } catch (error) {
          socket.emit('error', { 
            type: 'sentiment_analysis_error',
            message: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })

      // Handle insight generation requests
      socket.on('generate_insights', async () => {
        try {
          await this.realtimeService.generateRealtimeInsights(userId)
        } catch (error) {
          socket.emit('error', { 
            type: 'insight_generation_error',
            message: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })

      // Handle streaming requests
      socket.on('start_stream', async (data: { 
        type: 'sentiment' | 'cost' | 'metrics' | 'insights',
        filters?: any 
      }) => {
        try {
          await this.realtimeService.streamAnalytics(userId, data.type, data.filters)
        } catch (error) {
          socket.emit('error', { 
            type: 'stream_error',
            message: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })

      // Handle job status requests
      socket.on('get_job_status', async (data: { jobId: string }) => {
        try {
          const status = await this.realtimeService.getJobStatus(data.jobId)
          socket.emit('job_status', { jobId: data.jobId, status })
        } catch (error) {
          socket.emit('error', { 
            type: 'job_status_error',
            message: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`Analytics WebSocket disconnected: ${socket.id} for user ${userId}`)
      })
    })

    // Admin namespace for monitoring
    const adminNamespace = this.io.of('/admin')
    
    adminNamespace.use(async (socket, next) => {
      // Additional admin authentication
      const user = socket.data.user
      if (!user || !await this.isAdminUser(user.id)) {
        return next(new Error('Admin access required'))
      }
      next()
    })

    adminNamespace.on('connection', (socket) => {
      const userId = socket.data.user?.id
      
      logger.info(`Admin WebSocket connected: ${socket.id} for user ${userId}`)

      // Join admin room
      socket.join('admin')

      // Send current metrics
      socket.emit('metrics', this.realtimeService.getRealtimeMetrics())

      // Handle admin requests
      socket.on('get_system_status', () => {
        socket.emit('system_status', {
          metrics: this.realtimeService.getRealtimeMetrics(),
          timestamp: new Date()
        })
      })

      socket.on('get_active_sessions', () => {
        // Return active session count (without sensitive data)
        socket.emit('active_sessions', {
          count: this.realtimeService.getRealtimeMetrics().activeUsers
        })
      })

      socket.on('disconnect', () => {
        logger.info(`Admin WebSocket disconnected: ${socket.id} for user ${userId}`)
      })
    })
  }

  /**
   * Broadcast analytics update to all relevant clients
   */
  public async broadcastAnalyticsUpdate(
    userId: string,
    updateType: string,
    data: any,
    locationId?: string
  ): Promise<void> {
    const update = {
      type: updateType,
      data,
      timestamp: new Date(),
      userId,
      locationId
    }

    // Broadcast to user's analytics room
    this.io.of('/analytics').to(`analytics:${updateType}:${userId}`).emit('analytics_update', update)
    
    // Process through realtime service
    await this.realtimeService.processRealtimeUpdate(update)
  }

  /**
   * Broadcast dashboard update
   */
  public async broadcastDashboardUpdate(
    userId: string,
    updateType: string,
    data: any
  ): Promise<void> {
    this.io.of('/analytics').to(`user:${userId}`).emit('dashboard_update', {
      type: updateType,
      data,
      timestamp: new Date()
    })
  }

  /**
   * Broadcast insight update
   */
  public async broadcastInsightUpdate(
    userId: string,
    insight: any
  ): Promise<void> {
    this.io.of('/analytics').to(`analytics:insights:${userId}`).emit('new_insight', {
      insight,
      timestamp: new Date()
    })
  }

  /**
   * Broadcast job progress update
   */
  public async broadcastJobProgress(
    userId: string,
    jobId: string,
    progress: number,
    status: string
  ): Promise<void> {
    this.io.of('/analytics').to(`user:${userId}`).emit('job_progress', {
      jobId,
      progress,
      status,
      timestamp: new Date()
    })
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.io.of('/analytics').sockets.size
  }

  /**
   * Get admin users count
   */
  public getAdminUsersCount(): number {
    return this.io.of('/admin').sockets.size
  }

  /**
   * Close WebSocket server
   */
  public close(): void {
    this.io.close()
  }

  private async isAdminUser(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      })
      
      // Simple admin check - in production, use proper role system
      return user?.email?.endsWith('@admin.com') || false
    } catch (error) {
      logger.error('Error checking admin user:', error)
      return false
    }
  }
}

// Export factory function for easy integration
export function createAnalyticsWebSocket(httpServer: HTTPServer, prisma: PrismaClient): AnalyticsWebSocket {
  return new AnalyticsWebSocket(httpServer, prisma)
}