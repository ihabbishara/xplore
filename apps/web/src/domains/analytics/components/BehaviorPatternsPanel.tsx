'use client'

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/store/store'
import { fetchBehaviorPatterns } from '../store/analyticsSlice'
import { BehaviorPattern } from '../types/analytics.types'
import { Button } from '@/components/ui/Button'
import { 
  Brain,
  TrendingUp,
  AlertTriangle,
  Clock,
  Target,
  RefreshCw,
  Eye,
  Info,
  Zap,
  Activity,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface BehaviorPatternsPanelProps {
  patterns: BehaviorPattern[]
}

export function BehaviorPatternsPanel({ patterns }: BehaviorPatternsPanelProps) {
  const dispatch = useDispatch<AppDispatch>()
  const [selectedPattern, setSelectedPattern] = useState<BehaviorPattern | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const handleRefreshPatterns = () => {
    dispatch(fetchBehaviorPatterns())
  }

  const handleViewPattern = (pattern: BehaviorPattern) => {
    setSelectedPattern(pattern)
  }

  const getPatternIcon = (patternType: string) => {
    switch (patternType) {
      case 'preference':
        return <Target className="w-5 h-5 text-blue-500" />
      case 'decision':
        return <Brain className="w-5 h-5 text-purple-500" />
      case 'exploration':
        return <Activity className="w-5 h-5 text-green-500" />
      case 'bias':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const getPatternColor = (patternType: string) => {
    switch (patternType) {
      case 'preference':
        return 'bg-blue-50 border-blue-200 text-blue-900'
      case 'decision':
        return 'bg-purple-50 border-purple-200 text-purple-900'
      case 'exploration':
        return 'bg-green-50 border-green-200 text-green-900'
      case 'bias':
        return 'bg-red-50 border-red-200 text-red-900'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (confidence >= 0.6) return <Zap className="w-4 h-4 text-yellow-500" />
    return <AlertTriangle className="w-4 h-4 text-red-500" />
  }

  const formatFrequency = (frequency: number) => {
    return `${(frequency * 100).toFixed(1)}%`
  }

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(0)}%`
  }

  const filteredPatterns = patterns.filter(pattern => {
    const categoryMatch = selectedCategory === 'all' || pattern.category === selectedCategory
    const typeMatch = selectedType === 'all' || pattern.patternType === selectedType
    return categoryMatch && typeMatch
  })

  const categories = ['all', ...new Set(patterns.map(p => p.category))]
  const types = ['all', 'preference', 'decision', 'exploration', 'bias']

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Behavior Patterns
          </h3>
          <p className="text-sm text-gray-600">
            AI-detected patterns in your exploration behavior
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

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshPatterns}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          
          <span className="text-sm text-gray-500">
            {filteredPatterns.length} patterns
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                Pattern Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {types.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Patterns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPatterns.map((pattern) => (
          <div
            key={pattern.id}
            className={`border rounded-lg p-4 ${getPatternColor(pattern.patternType)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getPatternIcon(pattern.patternType)}
                <div>
                  <h4 className="font-semibold text-sm">
                    {pattern.patternType.charAt(0).toUpperCase() + pattern.patternType.slice(1)} Pattern
                  </h4>
                  <p className="text-xs opacity-75">{pattern.category}</p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewPattern(pattern)}
                className="flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                View
              </Button>
            </div>

            <p className="text-sm mb-3">{pattern.description}</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium opacity-75">Frequency</p>
                <p className="text-sm font-semibold">{formatFrequency(pattern.frequency)}</p>
              </div>
              <div>
                <p className="text-xs font-medium opacity-75">Confidence</p>
                <div className="flex items-center gap-1">
                  {getConfidenceIcon(pattern.confidence)}
                  <p className={`text-sm font-semibold ${getConfidenceColor(pattern.confidence)}`}>
                    {formatConfidence(pattern.confidence)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
              <p className="text-xs opacity-75 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last observed: {new Date(pattern.lastObserved).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pattern Details Modal */}
      {selectedPattern && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {getPatternIcon(selectedPattern.patternType)}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedPattern.patternType.charAt(0).toUpperCase() + selectedPattern.patternType.slice(1)} Pattern
                    </h3>
                    <p className="text-sm text-gray-600">{selectedPattern.category}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPattern(null)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedPattern.description}</p>
                </div>

                {/* Metrics */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Pattern Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-700">Frequency</p>
                      <p className="text-xl font-semibold text-blue-900">
                        {formatFrequency(selectedPattern.frequency)}
                      </p>
                      <p className="text-xs text-blue-600">How often this pattern occurs</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-700">Confidence</p>
                      <p className="text-xl font-semibold text-purple-900">
                        {formatConfidence(selectedPattern.confidence)}
                      </p>
                      <p className="text-xs text-purple-600">Reliability of detection</p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-700">First Observed</span>
                      <span className="text-sm text-gray-600">
                        {new Date(selectedPattern.lastObserved).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-700">Last Observed</span>
                      <span className="text-sm text-gray-600">
                        {new Date(selectedPattern.lastObserved).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h4>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      {selectedPattern.patternType === 'bias' ? (
                        'Consider being aware of this bias when making decisions. Try to actively seek diverse perspectives.'
                      ) : selectedPattern.patternType === 'preference' ? (
                        'This preference pattern can help you make better choices by focusing on what matters most to you.'
                      ) : selectedPattern.patternType === 'decision' ? (
                        'Understanding this decision pattern can help you make more consistent and effective choices.'
                      ) : (
                        'This exploration pattern reveals insights about your travel and location preferences.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredPatterns.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No behavior patterns detected</p>
          <p className="text-sm mb-4">
            {selectedCategory !== 'all' || selectedType !== 'all' 
              ? 'Try adjusting your filters'
              : 'Continue exploring to build up enough data for pattern detection'
            }
          </p>
          {(selectedCategory !== 'all' || selectedType !== 'all') && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedCategory('all')
                setSelectedType('all')
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}