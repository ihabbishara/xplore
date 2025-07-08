export interface LocationMetrics {
  locationId: string
  totalVisits: number
  averageSentiment: number
  weatherRating: number
  costRating: number
  overallScore: number
  lastVisited: Date
  trends: {
    sentiment: number[]
    cost: number[]
    weather: number[]
  }
}

export interface DashboardOverview {
  totalLocations: number
  totalTrips: number
  totalJournalEntries: number
  averageSentiment: number
  topLocations: Array<{
    id: string
    name: string
    score: number
    visits: number
  }>
  recentActivity: Array<{
    type: string
    description: string
    timestamp: Date
    locationId?: string
  }>
}

export interface SentimentTrend {
  date: Date
  sentiment: number
  category: string
  locationId?: string
}

export interface CostTrend {
  date: Date
  cost: number
  category: string
  locationId?: string
}

export interface ExplorationInsight {
  id: string
  title: string
  content: string
  category: string
  priority: 'high' | 'medium' | 'low'
  createdAt: Date
  isViewed: boolean
  isUseful?: boolean
}

export interface LocationComparison {
  id: string
  comparisonName: string
  locations: Array<{
    id: string
    name: string
    scores: Record<string, number>
    totalScore: number
    rank: number
  }>
  criteria: Record<string, number>
  winner: string
  strengths: Record<string, string[]>
  weaknesses: Record<string, string[]>
  createdAt: Date
}

export interface DecisionMatrix {
  id: string
  name: string
  alternatives: string[]
  criteria: Array<{
    name: string
    weight: number
  }>
  scores: Record<string, Record<string, number>>
  results: Array<{
    alternative: string
    totalScore: number
    rank: number
  }>
  createdAt: Date
}

export interface BehaviorPattern {
  id: string
  patternType: string
  category: string
  description: string
  frequency: number
  confidence: number
  lastObserved: Date
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

export interface AnalyticsFilters {
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
  cost?: {
    min: number
    max: number
  }
}

export interface DashboardState {
  overview: DashboardOverview | null
  insights: ExplorationInsight[]
  sentimentTrends: SentimentTrend[]
  costTrends: CostTrend[]
  locationComparisons: LocationComparison[]
  decisionMatrices: DecisionMatrix[]
  behaviorPatterns: BehaviorPattern[]
  loading: boolean
  error: string | null
  filters: AnalyticsFilters
  exportHistory: ExportResult[]
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'scatter'
  data: any[]
  labels: string[]
  colors?: string[]
  title: string
}

export interface DashboardCard {
  id: string
  title: string
  type: 'metric' | 'chart' | 'list' | 'comparison'
  size: 'small' | 'medium' | 'large'
  position: { x: number; y: number }
  data: any
  refreshInterval?: number
}

export interface RealtimeUpdate {
  type: string
  data: any
  timestamp: Date
  locationId?: string
}