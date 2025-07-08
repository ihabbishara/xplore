export interface SentimentResult {
  score: number // -1 to 1
  label: 'negative' | 'neutral' | 'positive'
  confidence: number // 0 to 1
  details?: {
    positive: number
    negative: number
    neutral: number
  }
}

export interface SentimentAnalysisInput {
  text: string
  language?: string
  context?: string // 'journal', 'review', 'note'
}

export interface LocationMetrics {
  locationId: string
  totalVisits: number
  totalTimeSpent: number
  journalEntries: number
  savedByUsers: number
  averageSentiment?: number
  sentimentDistribution?: {
    positive: number
    neutral: number
    negative: number
  }
  averageCostRating?: number
  costBreakdown?: {
    housing: number
    food: number
    transportation: number
    utilities: number
    entertainment: number
    miscellaneous: number
  }
  affordabilityScore?: number
  weatherRating?: number
  cultureRating?: number
  safetyRating?: number
  transportRating?: number
  visitPatterns?: {
    seasonal: Record<string, number>
    daily: Record<string, number>
    duration: Record<string, number>
  }
  activityPreferences?: Record<string, number>
  decisionFactors?: Record<string, number>
  relocateProb?: number
  comparisonScore?: number
  rankingPosition?: number
}

export interface ExplorationInsightInput {
  userId: string
  locationAnalyticsId?: string
  insightType: 'pattern' | 'recommendation' | 'warning' | 'prediction'
  category: 'cost' | 'climate' | 'culture' | 'decision' | 'behavior'
  priority: 'high' | 'medium' | 'low'
  confidence: number
  title: string
  content: string
  actionable: boolean
  supportingData?: any
  relatedLocations?: string[]
  validUntil?: Date
}

export interface LocationComparisonInput {
  userId: string
  comparisonName?: string
  locationIds: string[]
  criteria: {
    [key: string]: number // weight for each criterion
  }
}

export interface LocationComparisonResult {
  id: string
  comparisonName?: string
  locationIds: string[]
  criteria: Record<string, number>
  scores: {
    [locationId: string]: {
      total: number
      [criterion: string]: number
    }
  }
  rankings: Record<string, string> // rank -> locationId
  winner?: string
  strengths?: Record<string, string[]>
  weaknesses?: Record<string, string[]>
  recommendations?: Record<string, string>
}

export interface DecisionMatrixInput {
  userId: string
  name: string
  description?: string
  matrixType: 'location' | 'property' | 'general'
  criteria: {
    [key: string]: {
      weight: number
      scale: 'higher_better' | 'lower_better'
      description?: string
    }
  }
  alternatives: {
    [key: string]: {
      name: string
      data: Record<string, number>
    }
  }
}

export interface DecisionMatrixResult {
  id: string
  name: string
  description?: string
  matrixType: string
  criteria: Record<string, any>
  alternatives: Record<string, any>
  scores?: Record<string, number>
  rankings?: Record<string, string>
  sensitivity?: Record<string, any>
  recommendation?: string
}

export interface BehaviorPatternInput {
  userId: string
  patternType: 'preference' | 'decision' | 'exploration' | 'bias'
  category: 'cost' | 'climate' | 'culture' | 'timing' | 'duration'
  pattern: any
  frequency: number
  confidence: number
  triggers?: any
  outcomes?: any
  firstObserved: Date
  lastObserved: Date
  dataPoints: number
  reliability: number
}

export interface BehaviorPattern {
  id: string
  userId: string
  patternType: string
  category: string
  pattern: any
  frequency: number
  confidence: number
  triggers?: any
  outcomes?: any
  firstObserved: Date
  lastObserved: Date
  evolution?: any
  dataPoints: number
  reliability: number
  isActive: boolean
}

export interface PredictiveModelInput {
  userId?: string
  modelType: 'satisfaction' | 'cost' | 'climate' | 'market'
  targetVariable: string
  features: Record<string, any>
  hyperparameters: Record<string, any>
  trainingDataSize: number
  trainingPeriod: {
    start: Date
    end: Date
  }
}

export interface PredictiveModelResult {
  id: string
  userId?: string
  modelType: string
  targetVariable: string
  accuracy: number
  precision?: number
  recall?: number
  f1Score?: number
  features: Record<string, any>
  hyperparameters: Record<string, any>
  trainingDataSize: number
  trainingPeriod: {
    start: Date
    end: Date
  }
  isActive: boolean
  lastTrained: Date
  lastValidated?: Date
  predictions?: any
}

export interface DashboardOverview {
  totalLocations: number
  totalTrips: number
  totalJournalEntries: number
  totalTimeSpent: number
  averageSentiment: number
  topLocations: Array<{
    locationId: string
    name: string
    score: number
    visits: number
  }>
  recentInsights: Array<{
    id: string
    type: string
    title: string
    confidence: number
    createdAt: Date
  }>
  upcomingTrips: Array<{
    id: string
    name: string
    startDate: Date
    destinations: number
  }>
  costSummary: {
    totalSpent: number
    averageDaily: number
    topCategories: Record<string, number>
  }
  weatherPreferences: Record<string, number>
  activityPreferences: Record<string, number>
}

export interface AnalyticsFilters {
  userId: string
  locationIds?: string[]
  dateFrom?: Date
  dateTo?: Date
  categories?: string[]
  sentimentRange?: {
    min: number
    max: number
  }
  costRange?: {
    min: number
    max: number
  }
  includeInactive?: boolean
  limit?: number
  offset?: number
}

export interface InsightGenerationContext {
  userId: string
  locationData: LocationMetrics[]
  journalEntries: any[]
  tripData: any[]
  userPreferences: Record<string, any>
  behaviorPatterns: BehaviorPattern[]
  previousInsights: any[]
}

export interface CostBreakdown {
  housing: number
  food: number
  transportation: number
  utilities: number
  entertainment: number
  miscellaneous: number
  total: number
}

export interface CostAnalysis {
  locationId: string
  totalCost: number
  costBreakdown: CostBreakdown
  affordabilityScore: number
  comparisonToAverage: number
  recommendations: string[]
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable'
    percentage: number
    period: string
  }
}

export interface ClimateAnalysis {
  locationId: string
  averageTemperature: number
  temperatureRange: {
    min: number
    max: number
  }
  precipitation: number
  humidity: number
  sunshineHours: number
  seasonalVariation: Record<string, any>
  climateRating: number
  suitability: {
    score: number
    reasons: string[]
  }
}

export interface CultureAnalysis {
  locationId: string
  languageBarrier: number
  culturalSimilarity: number
  socialIntegration: number
  entertainment: number
  cuisine: number
  overallCultureScore: number
  recommendations: string[]
}

export interface SafetyAnalysis {
  locationId: string
  crimeRate: number
  emergencyServices: number
  politicalStability: number
  healthcareQuality: number
  overallSafetyScore: number
  riskFactors: string[]
  safetyTips: string[]
}

export interface TransportAnalysis {
  locationId: string
  publicTransport: number
  walkability: number
  bikeability: number
  carNecessity: number
  accessibility: number
  overallTransportScore: number
  recommendations: string[]
}

export interface LocationAnalysisComplete {
  locationId: string
  name: string
  overall: {
    score: number
    ranking: number
    recommendation: string
  }
  cost: CostAnalysis
  climate: ClimateAnalysis
  culture: CultureAnalysis
  safety: SafetyAnalysis
  transport: TransportAnalysis
  sentiment: {
    score: number
    distribution: Record<string, number>
    trends: any
  }
  insights: Array<{
    type: string
    title: string
    content: string
    confidence: number
    actionable: boolean
  }>
  predictions: Array<{
    type: string
    prediction: string
    confidence: number
    timeframe: string
  }>
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json'
  sections: string[]
  includeCharts: boolean
  includeRawData: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  locations?: string[]
  template?: string
}

export interface ExportResult {
  success: boolean
  downloadUrl?: string
  filename?: string
  error?: string
  generatedAt: Date
  expiresAt: Date
}

export interface RealtimeAnalyticsUpdate {
  type: 'insight' | 'metric' | 'comparison' | 'prediction'
  data: any
  timestamp: Date
  userId: string
  locationId?: string
}

export interface AnalyticsProcessingJob {
  id: string
  userId: string
  jobType: 'insight_generation' | 'pattern_analysis' | 'prediction' | 'comparison'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  startedAt: Date
  completedAt?: Date
  error?: string
  result?: any
}

export interface MLModelConfig {
  modelType: string
  version: string
  features: string[]
  hyperparameters: Record<string, any>
  trainingConfig: {
    batchSize: number
    epochs: number
    learningRate: number
    validationSplit: number
  }
  performance: {
    accuracy: number
    precision: number
    recall: number
    f1Score: number
  }
}

export interface BiasDetectionResult {
  biasType: 'anchoring' | 'recency' | 'confirmation' | 'availability'
  severity: 'low' | 'medium' | 'high'
  confidence: number
  description: string
  evidence: string[]
  recommendations: string[]
  affectedDecisions: string[]
}