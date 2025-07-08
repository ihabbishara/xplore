import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { analyticsService } from '../services/analyticsService'
import {
  DashboardState,
  DashboardOverview,
  ExplorationInsight,
  SentimentTrend,
  CostTrend,
  LocationComparison,
  DecisionMatrix,
  BehaviorPattern,
  ExportResult,
  AnalyticsFilters,
  LocationMetrics
} from '../types/analytics.types'

const initialState: DashboardState = {
  overview: null,
  insights: [],
  sentimentTrends: [],
  costTrends: [],
  locationComparisons: [],
  decisionMatrices: [],
  behaviorPatterns: [],
  loading: false,
  error: null,
  filters: {},
  exportHistory: []
}

// Async thunks
export const fetchDashboardOverview = createAsyncThunk(
  'analytics/fetchDashboardOverview',
  async (filters?: AnalyticsFilters) => {
    return await analyticsService.getDashboardOverview(filters)
  }
)

export const fetchDashboardInsights = createAsyncThunk(
  'analytics/fetchDashboardInsights',
  async (filters?: AnalyticsFilters) => {
    return await analyticsService.getDashboardInsights(filters)
  }
)

export const fetchSentimentTrends = createAsyncThunk(
  'analytics/fetchSentimentTrends',
  async (period: 'week' | 'month' | 'year' = 'month') => {
    return await analyticsService.getSentimentTrends(period)
  }
)

export const fetchCostTrends = createAsyncThunk(
  'analytics/fetchCostTrends',
  async (period: 'week' | 'month' | 'year' = 'month') => {
    return await analyticsService.getCostTrends(period)
  }
)

export const fetchLocationMetrics = createAsyncThunk(
  'analytics/fetchLocationMetrics',
  async (locationId: string) => {
    return await analyticsService.getLocationMetrics(locationId)
  }
)

export const compareLocations = createAsyncThunk(
  'analytics/compareLocations',
  async (params: {
    locationIds: string[]
    criteria: Record<string, number>
    comparisonName?: string
  }) => {
    return await analyticsService.compareLocations(
      params.locationIds,
      params.criteria,
      params.comparisonName
    )
  }
)

export const createDecisionMatrix = createAsyncThunk(
  'analytics/createDecisionMatrix',
  async (params: {
    alternatives: string[]
    criteria: Array<{ name: string; weight: number }>
    scores: Record<string, Record<string, number>>
    name?: string
  }) => {
    return await analyticsService.createDecisionMatrix(
      params.alternatives,
      params.criteria,
      params.scores,
      params.name
    )
  }
)

export const fetchDecisionMatrices = createAsyncThunk(
  'analytics/fetchDecisionMatrices',
  async () => {
    return await analyticsService.listDecisionMatrices()
  }
)

export const fetchBehaviorPatterns = createAsyncThunk(
  'analytics/fetchBehaviorPatterns',
  async () => {
    return await analyticsService.analyzeBehaviorPatterns()
  }
)

export const exportAnalyticsData = createAsyncThunk(
  'analytics/exportAnalyticsData',
  async (options: any) => {
    return await analyticsService.exportAnalyticsData(options)
  }
)

export const fetchExportHistory = createAsyncThunk(
  'analytics/fetchExportHistory',
  async (params: { limit?: number; offset?: number } = {}) => {
    return await analyticsService.getExportHistory(params.limit, params.offset)
  }
)

export const generateDashboardInsights = createAsyncThunk(
  'analytics/generateDashboardInsights',
  async () => {
    await analyticsService.generateDashboardInsights()
    return await analyticsService.getDashboardInsights()
  }
)

export const refreshDashboardCache = createAsyncThunk(
  'analytics/refreshDashboardCache',
  async () => {
    await analyticsService.refreshDashboardCache()
  }
)

// Slice
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<AnalyticsFilters>) => {
      state.filters = action.payload
    },
    clearFilters: (state) => {
      state.filters = {}
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    markInsightAsViewed: (state, action: PayloadAction<string>) => {
      const insight = state.insights.find(i => i.id === action.payload)
      if (insight) {
        insight.isViewed = true
      }
    },
    markInsightAsUseful: (state, action: PayloadAction<{ id: string; isUseful: boolean }>) => {
      const insight = state.insights.find(i => i.id === action.payload.id)
      if (insight) {
        insight.isUseful = action.payload.isUseful
      }
    },
    dismissInsight: (state, action: PayloadAction<string>) => {
      state.insights = state.insights.filter(i => i.id !== action.payload)
    },
    updateRealtimeData: (state, action: PayloadAction<any>) => {
      // Handle real-time updates
      const { type, data } = action.payload
      switch (type) {
        case 'sentiment_trend':
          state.sentimentTrends.push(data)
          break
        case 'cost_trend':
          state.costTrends.push(data)
          break
        case 'insight':
          state.insights.unshift(data)
          break
        case 'overview_update':
          if (state.overview) {
            state.overview = { ...state.overview, ...data }
          }
          break
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Dashboard Overview
      .addCase(fetchDashboardOverview.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDashboardOverview.fulfilled, (state, action) => {
        state.loading = false
        state.overview = action.payload
      })
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch dashboard overview'
      })
      
      // Dashboard Insights
      .addCase(fetchDashboardInsights.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDashboardInsights.fulfilled, (state, action) => {
        state.loading = false
        state.insights = action.payload
      })
      .addCase(fetchDashboardInsights.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch insights'
      })
      
      // Sentiment Trends
      .addCase(fetchSentimentTrends.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSentimentTrends.fulfilled, (state, action) => {
        state.loading = false
        state.sentimentTrends = action.payload
      })
      .addCase(fetchSentimentTrends.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch sentiment trends'
      })
      
      // Cost Trends
      .addCase(fetchCostTrends.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCostTrends.fulfilled, (state, action) => {
        state.loading = false
        state.costTrends = action.payload
      })
      .addCase(fetchCostTrends.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch cost trends'
      })
      
      // Location Comparison
      .addCase(compareLocations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(compareLocations.fulfilled, (state, action) => {
        state.loading = false
        state.locationComparisons.unshift(action.payload)
      })
      .addCase(compareLocations.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to compare locations'
      })
      
      // Decision Matrix
      .addCase(createDecisionMatrix.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createDecisionMatrix.fulfilled, (state, action) => {
        state.loading = false
        state.decisionMatrices.unshift(action.payload)
      })
      .addCase(createDecisionMatrix.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create decision matrix'
      })
      
      .addCase(fetchDecisionMatrices.fulfilled, (state, action) => {
        state.decisionMatrices = action.payload
      })
      
      // Behavior Patterns
      .addCase(fetchBehaviorPatterns.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBehaviorPatterns.fulfilled, (state, action) => {
        state.loading = false
        state.behaviorPatterns = action.payload
      })
      .addCase(fetchBehaviorPatterns.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch behavior patterns'
      })
      
      // Export History
      .addCase(fetchExportHistory.fulfilled, (state, action) => {
        state.exportHistory = action.payload.exports
      })
      
      // Generate Insights
      .addCase(generateDashboardInsights.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(generateDashboardInsights.fulfilled, (state, action) => {
        state.loading = false
        state.insights = action.payload
      })
      .addCase(generateDashboardInsights.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to generate insights'
      })
      
      // Refresh Cache
      .addCase(refreshDashboardCache.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(refreshDashboardCache.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(refreshDashboardCache.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to refresh cache'
      })
  }
})

export const {
  setFilters,
  clearFilters,
  setError,
  clearError,
  markInsightAsViewed,
  markInsightAsUseful,
  dismissInsight,
  updateRealtimeData
} = analyticsSlice.actions

export default analyticsSlice.reducer

// Selectors
export const selectAnalytics = (state: { analytics: DashboardState }) => state.analytics
export const selectDashboardOverview = (state: { analytics: DashboardState }) => state.analytics.overview
export const selectInsights = (state: { analytics: DashboardState }) => state.analytics.insights
export const selectSentimentTrends = (state: { analytics: DashboardState }) => state.analytics.sentimentTrends
export const selectCostTrends = (state: { analytics: DashboardState }) => state.analytics.costTrends
export const selectLocationComparisons = (state: { analytics: DashboardState }) => state.analytics.locationComparisons
export const selectDecisionMatrices = (state: { analytics: DashboardState }) => state.analytics.decisionMatrices
export const selectBehaviorPatterns = (state: { analytics: DashboardState }) => state.analytics.behaviorPatterns
export const selectAnalyticsLoading = (state: { analytics: DashboardState }) => state.analytics.loading
export const selectAnalyticsError = (state: { analytics: DashboardState }) => state.analytics.error
export const selectAnalyticsFilters = (state: { analytics: DashboardState }) => state.analytics.filters
export const selectExportHistory = (state: { analytics: DashboardState }) => state.analytics.exportHistory