import { PrismaClient } from '@prisma/client'
import { 
  ExportOptions,
  ExportResult,
  LocationMetrics,
  DashboardOverview
} from '../types/analytics.types'
import { LocationAnalyticsService } from './locationAnalyticsService'
import { DashboardService } from './dashboardService'
import { BehaviorPatternService } from './behaviorPatternService'
import { redis } from '../../../lib/redis'
import { logger } from '../../../shared/utils/logger'
import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'
import { createObjectCsvWriter } from 'csv-writer'

interface ReportTemplate {
  id: string
  name: string
  description: string
  sections: string[]
  format: 'pdf' | 'excel' | 'csv'
  category: 'location' | 'behavior' | 'decision' | 'comprehensive'
}

interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'scatter'
  title: string
  data: any[]
  labels: string[]
  colors?: string[]
}

interface ReportSection {
  title: string
  type: 'text' | 'table' | 'chart' | 'metrics'
  content: any
  order: number
}

export class ExportReportingService {
  private readonly EXPORT_DIR = path.join(process.cwd(), 'exports')
  private readonly CACHE_TTL = 3600 // 1 hour
  private readonly MAX_EXPORT_SIZE = 50 * 1024 * 1024 // 50MB

  constructor(
    private prisma: PrismaClient,
    private locationAnalyticsService: LocationAnalyticsService,
    private dashboardService: DashboardService,
    private behaviorPatternService: BehaviorPatternService
  ) {
    this.ensureExportDirectory()
  }

  /**
   * Export analytics data based on options
   */
  async exportData(userId: string, options: ExportOptions): Promise<ExportResult> {
    try {
      const startTime = Date.now()
      
      // Validate options
      this.validateExportOptions(options)
      
      // Generate unique filename
      const filename = this.generateFilename(options)
      const filePath = path.join(this.EXPORT_DIR, filename)
      
      // Check cache first
      const cacheKey = `export:${userId}:${JSON.stringify(options)}`
      const cached = await redis.get(cacheKey)
      if (cached) {
        const cachedResult = JSON.parse(cached)
        if (fs.existsSync(path.join(this.EXPORT_DIR, cachedResult.filename))) {
          return cachedResult
        }
      }

      // Gather data for export
      const exportData = await this.gatherExportData(userId, options)
      
      // Generate export file based on format
      let downloadUrl: string
      
      switch (options.format) {
        case 'pdf':
          downloadUrl = await this.generatePDFReport(exportData, filePath, options)
          break
        case 'excel':
          downloadUrl = await this.generateExcelReport(exportData, filePath, options)
          break
        case 'csv':
          downloadUrl = await this.generateCSVReport(exportData, filePath, options)
          break
        case 'json':
          downloadUrl = await this.generateJSONReport(exportData, filePath, options)
          break
        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }

      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Create result
      const result: ExportResult = {
        success: true,
        downloadUrl,
        filename,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }

      // Cache result
      await redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result))
      
      // Log export
      await this.logExport(userId, options, result, duration)
      
      return result
    } catch (error) {
      logger.error('Error exporting data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        generatedAt: new Date(),
        expiresAt: new Date()
      }
    }
  }

  /**
   * Get available export templates
   */
  async getExportTemplates(): Promise<ReportTemplate[]> {
    return [
      {
        id: 'location_comprehensive',
        name: 'Comprehensive Location Analysis',
        description: 'Complete analysis of location metrics, costs, and recommendations',
        sections: ['overview', 'metrics', 'cost_analysis', 'sentiment', 'recommendations'],
        format: 'pdf',
        category: 'location'
      },
      {
        id: 'behavior_patterns',
        name: 'Behavior Pattern Report',
        description: 'Analysis of user behavior patterns and biases',
        sections: ['patterns', 'biases', 'insights', 'predictions'],
        format: 'pdf',
        category: 'behavior'
      },
      {
        id: 'decision_matrix',
        name: 'Decision Matrix Summary',
        description: 'Summary of decision matrices and comparisons',
        sections: ['matrices', 'comparisons', 'recommendations'],
        format: 'excel',
        category: 'decision'
      },
      {
        id: 'dashboard_export',
        name: 'Dashboard Data Export',
        description: 'Export of all dashboard data and insights',
        sections: ['overview', 'trends', 'insights', 'metrics'],
        format: 'excel',
        category: 'comprehensive'
      },
      {
        id: 'location_comparison',
        name: 'Location Comparison Report',
        description: 'Side-by-side comparison of multiple locations',
        sections: ['comparison', 'rankings', 'strengths_weaknesses'],
        format: 'pdf',
        category: 'location'
      }
    ]
  }

  /**
   * Generate report from template
   */
  async generateFromTemplate(
    userId: string,
    templateId: string,
    customOptions?: Partial<ExportOptions>
  ): Promise<ExportResult> {
    try {
      const templates = await this.getExportTemplates()
      const template = templates.find(t => t.id === templateId)
      
      if (!template) {
        throw new Error(`Template not found: ${templateId}`)
      }

      const options: ExportOptions = {
        format: template.format,
        sections: template.sections,
        includeCharts: true,
        includeRawData: false,
        ...customOptions
      }

      return await this.exportData(userId, options)
    } catch (error) {
      logger.error('Error generating report from template:', error)
      throw error
    }
  }

  /**
   * Schedule recurring export
   */
  async scheduleRecurringExport(
    userId: string,
    options: ExportOptions,
    frequency: 'daily' | 'weekly' | 'monthly'
  ): Promise<{ scheduleId: string }> {
    try {
      const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Store schedule in database
      await this.prisma.exportSchedule.create({
        data: {
          id: scheduleId,
          userId,
          options: options as any,
          frequency,
          nextRun: this.calculateNextRun(frequency),
          isActive: true
        }
      })

      logger.info(`Scheduled recurring export ${scheduleId} for user ${userId}`)
      return { scheduleId }
    } catch (error) {
      logger.error('Error scheduling recurring export:', error)
      throw error
    }
  }

  /**
   * Get user's export history
   */
  async getExportHistory(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<{
    exports: Array<{
      id: string
      format: string
      sections: string[]
      createdAt: Date
      fileSize: number
      downloadUrl?: string
    }>
    total: number
  }> {
    try {
      const [exports, total] = await Promise.all([
        this.prisma.exportHistory.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        }),
        this.prisma.exportHistory.count({ where: { userId } })
      ])

      return {
        exports: exports.map(exp => ({
          id: exp.id,
          format: exp.format,
          sections: exp.sections,
          createdAt: exp.createdAt,
          fileSize: exp.fileSize,
          downloadUrl: exp.downloadUrl || undefined
        })),
        total
      }
    } catch (error) {
      logger.error('Error getting export history:', error)
      throw error
    }
  }

  /**
   * Generate analytics summary report
   */
  async generateSummaryReport(
    userId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<ExportResult> {
    try {
      const options: ExportOptions = {
        format: 'pdf',
        sections: ['overview', 'key_metrics', 'insights', 'recommendations'],
        includeCharts: true,
        includeRawData: false,
        dateRange,
        template: 'summary'
      }

      return await this.exportData(userId, options)
    } catch (error) {
      logger.error('Error generating summary report:', error)
      throw error
    }
  }

  /**
   * Cleanup old export files
   */
  async cleanupOldExports(maxAge = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - maxAge)
      
      // Get old exports from database
      const oldExports = await this.prisma.exportHistory.findMany({
        where: {
          createdAt: { lt: cutoffDate }
        },
        select: { filename: true, id: true }
      })

      // Delete files
      for (const exp of oldExports) {
        const filePath = path.join(this.EXPORT_DIR, exp.filename)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      }

      // Delete database records
      await this.prisma.exportHistory.deleteMany({
        where: {
          createdAt: { lt: cutoffDate }
        }
      })

      logger.info(`Cleaned up ${oldExports.length} old export files`)
    } catch (error) {
      logger.error('Error cleaning up old exports:', error)
    }
  }

  // Private methods

  private validateExportOptions(options: ExportOptions): void {
    if (!options.format || !['pdf', 'excel', 'csv', 'json'].includes(options.format)) {
      throw new Error('Invalid export format')
    }

    if (!options.sections || options.sections.length === 0) {
      throw new Error('At least one section must be specified')
    }

    if (options.dateRange) {
      if (options.dateRange.start >= options.dateRange.end) {
        throw new Error('Invalid date range')
      }
    }
  }

  private generateFilename(options: ExportOptions): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const sections = options.sections.join('_')
    const extension = options.format === 'excel' ? 'xlsx' : options.format
    
    return `analytics_export_${sections}_${timestamp}.${extension}`
  }

  private async gatherExportData(userId: string, options: ExportOptions): Promise<any> {
    const data: any = {
      userId,
      generatedAt: new Date(),
      options
    }

    // Get data for each requested section
    for (const section of options.sections) {
      switch (section) {
        case 'overview':
          data.overview = await this.dashboardService.getDashboardOverview(userId)
          break
        case 'metrics':
          data.metrics = await this.getLocationMetrics(userId, options)
          break
        case 'cost_analysis':
          data.costAnalysis = await this.getCostAnalysis(userId, options)
          break
        case 'sentiment':
          data.sentiment = await this.getSentimentAnalysis(userId, options)
          break
        case 'behavior':
          data.behavior = await this.getBehaviorAnalysis(userId, options)
          break
        case 'insights':
          data.insights = await this.getInsights(userId, options)
          break
        case 'recommendations':
          data.recommendations = await this.getRecommendations(userId, options)
          break
        case 'trends':
          data.trends = await this.getTrends(userId, options)
          break
        case 'comparisons':
          data.comparisons = await this.getComparisons(userId, options)
          break
      }
    }

    return data
  }

  private async generatePDFReport(
    data: any,
    filePath: string,
    options: ExportOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument()
        const stream = fs.createWriteStream(filePath)
        doc.pipe(stream)

        // Title page
        doc.fontSize(24).text('Analytics Report', { align: 'center' })
        doc.moveDown()
        doc.fontSize(12).text(`Generated: ${data.generatedAt.toLocaleString()}`, { align: 'center' })
        doc.moveDown(2)

        // Generate content for each section
        options.sections.forEach(section => {
          this.addPDFSection(doc, section, data[section], options)
        })

        doc.end()
        
        stream.on('finish', () => {
          resolve(`/exports/${path.basename(filePath)}`)
        })
        
        stream.on('error', reject)
      } catch (error) {
        reject(error)
      }
    })
  }

  private async generateExcelReport(
    data: any,
    filePath: string,
    options: ExportOptions
  ): Promise<string> {
    try {
      const workbook = new ExcelJS.Workbook()
      
      // Add worksheets for each section
      for (const section of options.sections) {
        const worksheet = workbook.addWorksheet(section.replace('_', ' ').toUpperCase())
        await this.addExcelSection(worksheet, section, data[section], options)
      }

      // Add summary sheet
      const summarySheet = workbook.addWorksheet('SUMMARY')
      this.addExcelSummary(summarySheet, data, options)

      await workbook.xlsx.writeFile(filePath)
      return `/exports/${path.basename(filePath)}`
    } catch (error) {
      logger.error('Error generating Excel report:', error)
      throw error
    }
  }

  private async generateCSVReport(
    data: any,
    filePath: string,
    options: ExportOptions
  ): Promise<string> {
    try {
      // For CSV, we'll focus on the most important tabular data
      const csvData = this.flattenDataForCSV(data, options)
      
      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: Object.keys(csvData[0] || {}).map(key => ({ id: key, title: key }))
      })

      await csvWriter.writeRecords(csvData)
      return `/exports/${path.basename(filePath)}`
    } catch (error) {
      logger.error('Error generating CSV report:', error)
      throw error
    }
  }

  private async generateJSONReport(
    data: any,
    filePath: string,
    options: ExportOptions
  ): Promise<string> {
    try {
      const jsonData = {
        ...data,
        exportOptions: options,
        metadata: {
          version: '1.0',
          generatedBy: 'Xplore Analytics Engine',
          format: 'json'
        }
      }

      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2))
      return `/exports/${path.basename(filePath)}`
    } catch (error) {
      logger.error('Error generating JSON report:', error)
      throw error
    }
  }

  private addPDFSection(doc: any, section: string, data: any, options: ExportOptions): void {
    doc.addPage()
    doc.fontSize(18).text(section.replace('_', ' ').toUpperCase(), { underline: true })
    doc.moveDown()

    switch (section) {
      case 'overview':
        this.addPDFOverview(doc, data)
        break
      case 'metrics':
        this.addPDFMetrics(doc, data)
        break
      case 'insights':
        this.addPDFInsights(doc, data)
        break
      default:
        doc.fontSize(12).text(JSON.stringify(data, null, 2))
    }
  }

  private addPDFOverview(doc: any, overview: DashboardOverview): void {
    doc.fontSize(12)
    doc.text(`Total Locations: ${overview.totalLocations}`)
    doc.text(`Total Trips: ${overview.totalTrips}`)
    doc.text(`Journal Entries: ${overview.totalJournalEntries}`)
    doc.text(`Average Sentiment: ${overview.averageSentiment.toFixed(2)}`)
    doc.moveDown()

    if (overview.topLocations.length > 0) {
      doc.text('Top Locations:', { underline: true })
      overview.topLocations.forEach((location, index) => {
        doc.text(`${index + 1}. ${location.name} (Score: ${location.score.toFixed(2)})`)
      })
    }
  }

  private addPDFMetrics(doc: any, metrics: any): void {
    doc.fontSize(12)
    if (Array.isArray(metrics)) {
      metrics.forEach((metric, index) => {
        doc.text(`Location ${index + 1}: ${metric.locationId}`)
        doc.text(`Visits: ${metric.totalVisits}`)
        doc.text(`Sentiment: ${metric.averageSentiment?.toFixed(2) || 'N/A'}`)
        doc.moveDown()
      })
    } else {
      doc.text(JSON.stringify(metrics, null, 2))
    }
  }

  private addPDFInsights(doc: any, insights: any): void {
    doc.fontSize(12)
    if (insights?.insights && Array.isArray(insights.insights)) {
      insights.insights.forEach((insight: any, index: number) => {
        doc.text(`${index + 1}. ${insight.title}`)
        doc.fontSize(10).text(insight.content)
        doc.fontSize(12)
        doc.moveDown()
      })
    }
  }

  private async addExcelSection(
    worksheet: any,
    section: string,
    data: any,
    options: ExportOptions
  ): Promise<void> {
    // Add headers
    worksheet.addRow([section.replace('_', ' ').toUpperCase()])
    worksheet.addRow([])

    switch (section) {
      case 'overview':
        this.addExcelOverview(worksheet, data)
        break
      case 'metrics':
        this.addExcelMetrics(worksheet, data)
        break
      default:
        // Generic data handling
        if (Array.isArray(data)) {
          if (data.length > 0 && typeof data[0] === 'object') {
            const headers = Object.keys(data[0])
            worksheet.addRow(headers)
            data.forEach(item => {
              worksheet.addRow(headers.map(header => item[header]))
            })
          }
        }
    }
  }

  private addExcelOverview(worksheet: any, overview: DashboardOverview): void {
    worksheet.addRow(['Metric', 'Value'])
    worksheet.addRow(['Total Locations', overview.totalLocations])
    worksheet.addRow(['Total Trips', overview.totalTrips])
    worksheet.addRow(['Journal Entries', overview.totalJournalEntries])
    worksheet.addRow(['Average Sentiment', overview.averageSentiment])
    worksheet.addRow([])
    
    if (overview.topLocations.length > 0) {
      worksheet.addRow(['Top Locations'])
      worksheet.addRow(['Rank', 'Name', 'Score', 'Visits'])
      overview.topLocations.forEach((location, index) => {
        worksheet.addRow([index + 1, location.name, location.score, location.visits])
      })
    }
  }

  private addExcelMetrics(worksheet: any, metrics: any): void {
    if (Array.isArray(metrics)) {
      worksheet.addRow(['Location ID', 'Total Visits', 'Average Sentiment', 'Weather Rating'])
      metrics.forEach((metric: LocationMetrics) => {
        worksheet.addRow([
          metric.locationId,
          metric.totalVisits,
          metric.averageSentiment || 0,
          metric.weatherRating || 0
        ])
      })
    }
  }

  private addExcelSummary(worksheet: any, data: any, options: ExportOptions): void {
    worksheet.addRow(['EXPORT SUMMARY'])
    worksheet.addRow(['Generated At', data.generatedAt])
    worksheet.addRow(['Sections', options.sections.join(', ')])
    worksheet.addRow(['Format', options.format])
    worksheet.addRow(['Include Charts', options.includeCharts])
    worksheet.addRow(['Include Raw Data', options.includeRawData])
  }

  private flattenDataForCSV(data: any, options: ExportOptions): any[] {
    const flattened: any[] = []
    
    // Focus on the most important data for CSV export
    if (data.overview) {
      flattened.push({
        type: 'overview',
        metric: 'total_locations',
        value: data.overview.totalLocations
      })
      flattened.push({
        type: 'overview',
        metric: 'total_trips',
        value: data.overview.totalTrips
      })
      flattened.push({
        type: 'overview',
        metric: 'average_sentiment',
        value: data.overview.averageSentiment
      })
    }

    if (data.metrics && Array.isArray(data.metrics)) {
      data.metrics.forEach((metric: LocationMetrics) => {
        flattened.push({
          type: 'metric',
          location_id: metric.locationId,
          total_visits: metric.totalVisits,
          average_sentiment: metric.averageSentiment || 0,
          weather_rating: metric.weatherRating || 0
        })
      })
    }

    return flattened.length > 0 ? flattened : [{ message: 'No data to export' }]
  }

  private async getLocationMetrics(userId: string, options: ExportOptions): Promise<LocationMetrics[]> {
    const savedLocations = await this.prisma.userSavedLocation.findMany({
      where: { userId },
      include: { location: true },
      take: options.locations ? options.locations.length : 20
    })

    const metrics: LocationMetrics[] = []
    for (const saved of savedLocations) {
      try {
        const metric = await this.locationAnalyticsService.calculateLocationMetrics(saved.locationId, userId)
        metrics.push(metric)
      } catch (error) {
        logger.error(`Error getting metrics for location ${saved.locationId}:`, error)
      }
    }

    return metrics
  }

  private async getCostAnalysis(userId: string, options: ExportOptions): Promise<any> {
    // Get cost analysis data
    return { placeholder: 'Cost analysis data' }
  }

  private async getSentimentAnalysis(userId: string, options: ExportOptions): Promise<any> {
    return this.dashboardService.getSentimentTrends(userId, 'month')
  }

  private async getBehaviorAnalysis(userId: string, options: ExportOptions): Promise<any> {
    return this.behaviorPatternService.analyzeUserBehaviorPatterns(userId)
  }

  private async getInsights(userId: string, options: ExportOptions): Promise<any> {
    return this.dashboardService.getDashboardInsights(userId, { userId })
  }

  private async getRecommendations(userId: string, options: ExportOptions): Promise<any> {
    const insights = await this.behaviorPatternService.getBehaviorInsights(userId)
    return insights.recommendations
  }

  private async getTrends(userId: string, options: ExportOptions): Promise<any> {
    const [sentimentTrends, costTrends] = await Promise.all([
      this.dashboardService.getSentimentTrends(userId, 'month'),
      this.dashboardService.getCostTrends(userId, 'month')
    ])

    return { sentimentTrends, costTrends }
  }

  private async getComparisons(userId: string, options: ExportOptions): Promise<any> {
    const comparisons = await this.prisma.locationComparison.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return comparisons
  }

  private calculateNextRun(frequency: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date()
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      case 'monthly':
        const nextMonth = new Date(now)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        return nextMonth
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }
  }

  private async logExport(
    userId: string,
    options: ExportOptions,
    result: ExportResult,
    duration: number
  ): Promise<void> {
    try {
      const fileSize = result.filename && fs.existsSync(path.join(this.EXPORT_DIR, result.filename))
        ? fs.statSync(path.join(this.EXPORT_DIR, result.filename)).size
        : 0

      await this.prisma.exportHistory.create({
        data: {
          userId,
          format: options.format,
          sections: options.sections,
          filename: result.filename || '',
          downloadUrl: result.downloadUrl,
          fileSize,
          duration,
          success: result.success
        }
      })
    } catch (error) {
      logger.error('Error logging export:', error)
    }
  }

  private ensureExportDirectory(): void {
    if (!fs.existsSync(this.EXPORT_DIR)) {
      fs.mkdirSync(this.EXPORT_DIR, { recursive: true })
    }
  }
}