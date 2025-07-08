import { apiClient } from '@/lib/api/client'
import {
  LocationMetrics,
  DashboardOverview,
  SentimentTrend,
  CostTrend,
  ExplorationInsight,
  LocationComparison,
  DecisionMatrix,
  BehaviorPattern,
  ExportOptions,
  ExportResult,
  AnalyticsFilters
} from '../types/analytics.types'

export class AnalyticsService {
  private readonly baseUrl = '/api/analytics'

  // Dashboard APIs
  async getDashboardOverview(filters?: AnalyticsFilters): Promise<DashboardOverview> {
    const params = new URLSearchParams()
    if (filters?.dateRange) {
      params.append('dateFrom', filters.dateRange.start.toISOString())
      params.append('dateTo', filters.dateRange.end.toISOString())
    }
    
    const response = await apiClient.get(`${this.baseUrl}/dashboard/overview?${params}`)
    return response.data
  }

  async getDashboardInsights(filters?: AnalyticsFilters): Promise<ExplorationInsight[]> {
    const params = new URLSearchParams()
    if (filters?.dateRange) {
      params.append('dateFrom', filters.dateRange.start.toISOString())
      params.append('dateTo', filters.dateRange.end.toISOString())
    }
    if (filters?.categories) {
      params.append('categories', filters.categories.join(','))
    }
    
    const response = await apiClient.get(`${this.baseUrl}/dashboard/insights?${params}`)
    return response.data
  }

  async getSentimentTrends(period: 'week' | 'month' | 'year' = 'month'): Promise<SentimentTrend[]> {
    const response = await apiClient.get(`${this.baseUrl}/dashboard/sentiment/trends?period=${period}`)
    return response.data
  }

  async getCostTrends(period: 'week' | 'month' | 'year' = 'month'): Promise<CostTrend[]> {
    const response = await apiClient.get(`${this.baseUrl}/dashboard/cost/trends?period=${period}`)
    return response.data
  }

  async generateDashboardInsights(): Promise<void> {
    await apiClient.post(`${this.baseUrl}/dashboard/insights/generate`)
  }

  async refreshDashboardCache(): Promise<void> {
    await apiClient.post(`${this.baseUrl}/dashboard/cache/refresh`)
  }

  // Location Analytics
  async getLocationMetrics(locationId: string): Promise<LocationMetrics> {
    const response = await apiClient.get(`${this.baseUrl}/location/${locationId}/metrics`)
    return response.data
  }

  async getCompleteLocationAnalysis(locationId: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/location/${locationId}/analysis`)
    return response.data
  }

  async compareLocations(
    locationIds: string[],
    criteria: Record<string, number>,
    comparisonName?: string
  ): Promise<LocationComparison> {
    const response = await apiClient.post(`${this.baseUrl}/locations/compare`, {
      locationIds,
      criteria,
      comparisonName
    })
    return response.data
  }

  // Sentiment Analysis
  async analyzeSentiment(text: string, language?: string, context?: string): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/sentiment/analyze`, {
      text,
      language,
      context
    })
    return response.data
  }

  async batchAnalyzeSentiment(texts: Array<{ text: string; language?: string; context?: string }>): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/sentiment/batch`, { texts })
    return response.data
  }

  async analyzeEmotions(filters?: AnalyticsFilters): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.dateRange) {
      params.append('dateFrom', filters.dateRange.start.toISOString())
      params.append('dateTo', filters.dateRange.end.toISOString())
    }
    
    const response = await apiClient.get(`${this.baseUrl}/sentiment/emotions?${params}`)
    return response.data
  }

  // Cost Intelligence
  async getLocationCostAnalysis(locationId: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/location/${locationId}/cost`)
    return response.data
  }

  async compareLocationCosts(locationIds: string[], criteria: Record<string, number>): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/locations/cost/compare`, {
      locationIds,
      criteria
    })
    return response.data
  }

  async getCostPredictions(locationId: string, timeframe: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/location/${locationId}/cost/predictions?timeframe=${timeframe}`)
    return response.data
  }

  async getBudgetRecommendations(locationId: string, budget: number, duration: number): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/location/${locationId}/budget`, {
      budget,
      duration
    })
    return response.data
  }

  // Decision Matrix
  async createDecisionMatrix(
    alternatives: string[],
    criteria: Array<{ name: string; weight: number }>,
    scores: Record<string, Record<string, number>>,
    name?: string
  ): Promise<DecisionMatrix> {
    const response = await apiClient.post(`${this.baseUrl}/decision-matrix`, {
      alternatives,
      criteria,
      scores,
      name
    })
    return response.data
  }

  async getDecisionMatrix(matrixId: string): Promise<DecisionMatrix> {
    const response = await apiClient.get(`${this.baseUrl}/decision-matrix/${matrixId}`)
    return response.data
  }

  async listDecisionMatrices(): Promise<DecisionMatrix[]> {
    const response = await apiClient.get(`${this.baseUrl}/decision-matrices`)
    return response.data
  }

  async updateDecisionMatrix(matrixId: string, updates: Partial<DecisionMatrix>): Promise<DecisionMatrix> {
    const response = await apiClient.put(`${this.baseUrl}/decision-matrix/${matrixId}`, updates)
    return response.data
  }

  async deleteDecisionMatrix(matrixId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/decision-matrix/${matrixId}`)
  }

  async getMatrixTemplates(): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/decision-matrix/templates`)
    return response.data
  }

  // Behavior Analysis
  async analyzeBehaviorPatterns(): Promise<BehaviorPattern[]> {
    const response = await apiClient.post(`${this.baseUrl}/behavior/analyze`)
    return response.data
  }

  async detectCognitiveBiases(): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/behavior/biases`)
    return response.data
  }

  async getBehaviorInsights(): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/behavior/insights`)
    return response.data
  }

  async predictBehavior(scenario: string, context?: any): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/behavior/predict`, {
      scenario,
      context
    })
    return response.data
  }

  async listBehaviorPatterns(): Promise<BehaviorPattern[]> {
    const response = await apiClient.get(`${this.baseUrl}/behavior/patterns`)
    return response.data
  }

  // Export & Reporting
  async exportAnalyticsData(options: ExportOptions): Promise<ExportResult> {
    const response = await apiClient.post(`${this.baseUrl}/export`, options)
    return response.data
  }

  async getExportTemplates(): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/export/templates`)
    return response.data
  }

  async generateReportFromTemplate(templateId: string, customOptions?: Partial<ExportOptions>): Promise<ExportResult> {
    const response = await apiClient.post(`${this.baseUrl}/export/template/${templateId}`, customOptions)
    return response.data
  }

  async scheduleRecurringExport(options: ExportOptions, frequency: 'daily' | 'weekly' | 'monthly'): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/export/schedule`, {
      options,
      frequency
    })
    return response.data
  }

  async getExportHistory(limit = 20, offset = 0): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/export/history?limit=${limit}&offset=${offset}`)
    return response.data
  }

  async generateSummaryReport(dateRange?: { start: Date; end: Date }): Promise<ExportResult> {
    const params = new URLSearchParams()
    if (dateRange) {
      params.append('start', dateRange.start.toISOString())
      params.append('end', dateRange.end.toISOString())
    }
    
    const response = await apiClient.get(`${this.baseUrl}/export/summary?${params}`)
    return response.data
  }

  // Real-time Analytics
  async queueRealtimeJob(jobType: string, data: any, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/realtime/queue-job`, {
      jobType,
      data,
      priority
    })
    return response.data
  }

  async getJobStatus(jobId: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/realtime/job/${jobId}`)
    return response.data
  }

  async getRealtimeMetrics(): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/realtime/metrics`)
    return response.data
  }

  // Utility methods
  async markInsightAsViewed(insightId: string): Promise<void> {
    // This would be implemented in the insights API
    await apiClient.patch(`${this.baseUrl}/insights/${insightId}/viewed`)
  }

  async markInsightAsUseful(insightId: string, isUseful: boolean): Promise<void> {
    // This would be implemented in the insights API
    await apiClient.patch(`${this.baseUrl}/insights/${insightId}/useful`, { isUseful })
  }

  async dismissInsight(insightId: string): Promise<void> {
    // This would be implemented in the insights API
    await apiClient.patch(`${this.baseUrl}/insights/${insightId}/dismiss`)
  }
}

export const analyticsService = new AnalyticsService()