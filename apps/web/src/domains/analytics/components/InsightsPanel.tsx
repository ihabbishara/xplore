'use client'

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/store/store'
import { markInsightAsViewed, markInsightAsUseful, dismissInsight } from '../store/analyticsSlice'
import { ExplorationInsight } from '../types/analytics.types'
import { Button } from '@/components/ui/Button'
import { 
  Lightbulb, 
  AlertCircle, 
  Info, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  X,
  Eye,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface InsightsPanelProps {
  insights: ExplorationInsight[]
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  const dispatch = useDispatch<AppDispatch>()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const handleMarkAsViewed = (insightId: string) => {
    dispatch(markInsightAsViewed(insightId))
  }

  const handleMarkAsUseful = (insightId: string, isUseful: boolean) => {
    dispatch(markInsightAsUseful({ id: insightId, isUseful }))
  }

  const handleDismiss = (insightId: string) => {
    dispatch(dismissInsight(insightId))
  }

  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'recommendation':
        return <Lightbulb className="w-5 h-5 text-yellow-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'trend':
        return <Star className="w-5 h-5 text-blue-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200'
      case 'medium':
        return 'bg-yellow-50 border-yellow-200'
      case 'low':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const filteredInsights = insights.filter(insight => {
    const categoryMatch = selectedCategory === 'all' || insight.category === selectedCategory
    const priorityMatch = selectedPriority === 'all' || insight.priority === selectedPriority
    return categoryMatch && priorityMatch
  })

  const categories = ['all', ...new Set(insights.map(i => i.category))]
  const priorities = ['all', 'high', 'medium', 'low']

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Insights & Recommendations
          </h3>
          <p className="text-sm text-gray-600">
            AI-powered insights based on your exploration patterns
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          
          <span className="text-sm text-gray-500">
            {filteredInsights.length} insights
          </span>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {priorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.map((insight) => (
          <div
            key={insight.id}
            className={`border rounded-lg p-4 ${getPriorityColor(insight.priority)} ${
              !insight.isViewed ? 'ring-2 ring-blue-200' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0 mt-1">
                  {getInsightIcon(insight.category)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                    
                    {!insight.isViewed && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        New
                      </span>
                    )}
                    
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      insight.priority === 'high' ? 'bg-red-100 text-red-800' :
                      insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {insight.priority}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{insight.content}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {new Date(insight.createdAt).toLocaleDateString()}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {!insight.isViewed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsViewed(insight.id)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Mark as read
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsUseful(insight.id, true)}
                          className={`flex items-center gap-1 ${
                            insight.isUseful === true ? 'bg-green-100 border-green-300' : ''
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          Useful
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsUseful(insight.id, false)}
                          className={`flex items-center gap-1 ${
                            insight.isUseful === false ? 'bg-red-100 border-red-300' : ''
                          }`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                          Not useful
                        </Button>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDismiss(insight.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredInsights.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No insights available</p>
          <p className="text-sm">
            {selectedCategory !== 'all' || selectedPriority !== 'all' 
              ? 'Try adjusting your filters'
              : 'Continue exploring to generate personalized insights'
            }
          </p>
        </div>
      )}
    </div>
  )
}