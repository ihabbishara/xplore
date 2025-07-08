'use client'

import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch } from '@/store/store'
import { 
  setFilters, 
  clearFilters, 
  selectAnalyticsFilters,
  fetchDashboardOverview,
  fetchDashboardInsights,
  fetchSentimentTrends,
  fetchCostTrends
} from '../store/analyticsSlice'
import { AnalyticsFilters } from '../types/analytics.types'
import { Button } from '@/components/ui/Button'
import { 
  Filter,
  Calendar,
  MapPin,
  Tag,
  TrendingUp,
  DollarSign,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react'

export function AnalyticsFiltersPanel() {
  const dispatch = useDispatch<AppDispatch>()
  const currentFilters = useSelector(selectAnalyticsFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [tempFilters, setTempFilters] = useState<AnalyticsFilters>(currentFilters)

  const handleApplyFilters = () => {
    dispatch(setFilters(tempFilters))
    
    // Refresh data with new filters
    dispatch(fetchDashboardOverview(tempFilters))
    dispatch(fetchDashboardInsights(tempFilters))
    dispatch(fetchSentimentTrends('month'))
    dispatch(fetchCostTrends('month'))
    
    setShowFilters(false)
  }

  const handleClearFilters = () => {
    const emptyFilters: AnalyticsFilters = {}
    setTempFilters(emptyFilters)
    dispatch(clearFilters())
    
    // Refresh data without filters
    dispatch(fetchDashboardOverview())
    dispatch(fetchDashboardInsights())
    dispatch(fetchSentimentTrends('month'))
    dispatch(fetchCostTrends('month'))
    
    setShowFilters(false)
  }

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const date = new Date(value)
    setTempFilters({
      ...tempFilters,
      dateRange: {
        ...tempFilters.dateRange,
        [field]: date
      }
    })
  }

  const handleSentimentRangeChange = (field: 'min' | 'max', value: number) => {
    setTempFilters({
      ...tempFilters,
      sentiment: {
        ...tempFilters.sentiment,
        [field]: value
      }
    })
  }

  const handleCostRangeChange = (field: 'min' | 'max', value: number) => {
    setTempFilters({
      ...tempFilters,
      cost: {
        ...tempFilters.cost,
        [field]: value
      }
    })
  }

  const handleCategoriesChange = (categories: string[]) => {
    setTempFilters({
      ...tempFilters,
      categories
    })
  }

  const hasActiveFilters = () => {
    return Object.keys(currentFilters).length > 0
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (currentFilters.dateRange) count++
    if (currentFilters.locations && currentFilters.locations.length > 0) count++
    if (currentFilters.categories && currentFilters.categories.length > 0) count++
    if (currentFilters.sentiment) count++
    if (currentFilters.cost) count++
    return count
  }

  const quickFilters = [
    {
      label: 'Last 7 days',
      onClick: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 7)
        setTempFilters({ ...tempFilters, dateRange: { start, end } })
      }
    },
    {
      label: 'Last 30 days',
      onClick: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 30)
        setTempFilters({ ...tempFilters, dateRange: { start, end } })
      }
    },
    {
      label: 'Last 3 months',
      onClick: () => {
        const end = new Date()
        const start = new Date()
        start.setMonth(start.getMonth() - 3)
        setTempFilters({ ...tempFilters, dateRange: { start, end } })
      }
    },
    {
      label: 'This year',
      onClick: () => {
        const end = new Date()
        const start = new Date(end.getFullYear(), 0, 1)
        setTempFilters({ ...tempFilters, dateRange: { start, end } })
      }
    }
  ]

  const availableCategories = [
    'journal',
    'review',
    'note',
    'trip',
    'location',
    'cost',
    'accommodation',
    'food',
    'transport',
    'activities'
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {getActiveFiltersCount() > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                {getActiveFiltersCount()}
              </span>
            )}
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          
          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            {quickFilters.map((filter) => (
              <Button
                key={filter.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  filter.onClick()
                  handleApplyFilters()
                }}
                className="text-xs"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            
            {currentFilters.dateRange && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                <Calendar className="w-3 h-3" />
                {currentFilters.dateRange.start.toLocaleDateString()} - {currentFilters.dateRange.end.toLocaleDateString()}
              </span>
            )}
            
            {currentFilters.locations && currentFilters.locations.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                <MapPin className="w-3 h-3" />
                {currentFilters.locations.length} locations
              </span>
            )}
            
            {currentFilters.categories && currentFilters.categories.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                <Tag className="w-3 h-3" />
                {currentFilters.categories.length} categories
              </span>
            )}
            
            {currentFilters.sentiment && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                <TrendingUp className="w-3 h-3" />
                Sentiment: {currentFilters.sentiment.min} - {currentFilters.sentiment.max}
              </span>
            )}
            
            {currentFilters.cost && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                <DollarSign className="w-3 h-3" />
                Cost: ${currentFilters.cost.min} - ${currentFilters.cost.max}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Detailed Filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={tempFilters.dateRange?.start.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={tempFilters.dateRange?.end.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {availableCategories.map((category) => (
                  <label key={category} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tempFilters.categories?.includes(category) || false}
                      onChange={(e) => {
                        const categories = tempFilters.categories || []
                        if (e.target.checked) {
                          handleCategoriesChange([...categories, category])
                        } else {
                          handleCategoriesChange(categories.filter(c => c !== category))
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sentiment Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sentiment Range
              </label>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500">Min: {tempFilters.sentiment?.min || 1}</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={tempFilters.sentiment?.min || 1}
                    onChange={(e) => handleSentimentRangeChange('min', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Max: {tempFilters.sentiment?.max || 5}</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={tempFilters.sentiment?.max || 5}
                    onChange={(e) => handleSentimentRangeChange('max', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Cost Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Range ($)
              </label>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500">Min: ${tempFilters.cost?.min || 0}</label>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={tempFilters.cost?.min || 0}
                    onChange={(e) => handleCostRangeChange('min', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Max: ${tempFilters.cost?.max || 1000}</label>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={tempFilters.cost?.max || 1000}
                    onChange={(e) => handleCostRangeChange('max', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTempFilters(currentFilters)
                setShowFilters(false)
              }}
            >
              Cancel
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTempFilters({})}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            
            <Button
              size="sm"
              onClick={handleApplyFilters}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}