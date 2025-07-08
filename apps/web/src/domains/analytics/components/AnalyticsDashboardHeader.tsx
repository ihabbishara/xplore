'use client'

import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch } from '@/store/store'
import {
  generateDashboardInsights,
  refreshDashboardCache,
  selectAnalyticsLoading
} from '../store/analyticsSlice'
import { Button } from '@/components/ui/Button'
import { RefreshCw, Sparkles, Download, Settings } from 'lucide-react'

export function AnalyticsDashboardHeader() {
  const dispatch = useDispatch<AppDispatch>()
  const isLoading = useSelector(selectAnalyticsLoading)

  const handleGenerateInsights = () => {
    dispatch(generateDashboardInsights())
  }

  const handleRefreshCache = () => {
    dispatch(refreshDashboardCache())
  }

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Comprehensive insights into your exploration journey and decision-making patterns
        </p>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshCache}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateInsights}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Generate Insights
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>
    </div>
  )
}