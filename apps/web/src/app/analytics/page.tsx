'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch } from '@/store/store'
import {
  fetchDashboardOverview,
  fetchDashboardInsights,
  fetchSentimentTrends,
  fetchCostTrends,
  selectAnalytics,
  selectAnalyticsLoading,
  selectAnalyticsError
} from '@/domains/analytics/store/analyticsSlice'
import { AnalyticsDashboardHeader } from '@/domains/analytics/components/AnalyticsDashboardHeader'
import { DashboardOverviewCards } from '@/domains/analytics/components/DashboardOverviewCards'
import { SentimentTrendsChart } from '@/domains/analytics/components/SentimentTrendsChart'
import { CostTrendsChart } from '@/domains/analytics/components/CostTrendsChart'
import { InsightsPanel } from '@/domains/analytics/components/InsightsPanel'
import { LocationComparisonsGrid } from '@/domains/analytics/components/LocationComparisonsGrid'
import { DecisionMatrixGrid } from '@/domains/analytics/components/DecisionMatrixGrid'
import { BehaviorPatternsPanel } from '@/domains/analytics/components/BehaviorPatternsPanel'
import { ExportPanel } from '@/domains/analytics/components/ExportPanel'
import { AnalyticsFiltersPanel } from '@/domains/analytics/components/AnalyticsFiltersPanel'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

export default function AnalyticsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const analytics = useSelector(selectAnalytics)
  const isLoading = useSelector(selectAnalyticsLoading)
  const error = useSelector(selectAnalyticsError)

  useEffect(() => {
    // Initial data fetch
    dispatch(fetchDashboardOverview())
    dispatch(fetchDashboardInsights())
    dispatch(fetchSentimentTrends('month'))
    dispatch(fetchCostTrends('month'))
  }, [dispatch])

  if (isLoading && !analytics.overview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ErrorMessage message={error} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <AnalyticsDashboardHeader />

        {/* Filters */}
        <div className="mb-8">
          <AnalyticsFiltersPanel />
        </div>

        {/* Main Dashboard Content */}
        <div className="space-y-8">
          {/* Overview Cards */}
          {analytics.overview && (
            <DashboardOverviewCards overview={analytics.overview} />
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <SentimentTrendsChart trends={analytics.sentimentTrends} />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <CostTrendsChart trends={analytics.costTrends} />
            </div>
          </div>

          {/* Insights Panel */}
          <div className="bg-white rounded-lg shadow-sm">
            <InsightsPanel insights={analytics.insights} />
          </div>

          {/* Analysis Grids */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm">
              <LocationComparisonsGrid comparisons={analytics.locationComparisons} />
            </div>
            <div className="bg-white rounded-lg shadow-sm">
              <DecisionMatrixGrid matrices={analytics.decisionMatrices} />
            </div>
          </div>

          {/* Behavior Patterns */}
          <div className="bg-white rounded-lg shadow-sm">
            <BehaviorPatternsPanel patterns={analytics.behaviorPatterns} />
          </div>

          {/* Export Panel */}
          <div className="bg-white rounded-lg shadow-sm">
            <ExportPanel />
          </div>
        </div>
      </div>
    </div>
  )
}