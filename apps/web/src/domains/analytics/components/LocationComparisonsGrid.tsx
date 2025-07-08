'use client'

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/store/store'
import { compareLocations } from '../store/analyticsSlice'
import { LocationComparison } from '../types/analytics.types'
import { Button } from '@/components/ui/Button'
import { 
  MapPin, 
  Plus, 
  Trophy, 
  BarChart3,
  Eye,
  Trash2,
  Edit,
  Star,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface LocationComparisonsGridProps {
  comparisons: LocationComparison[]
}

export function LocationComparisonsGrid({ comparisons }: LocationComparisonsGridProps) {
  const dispatch = useDispatch<AppDispatch>()
  const [selectedComparison, setSelectedComparison] = useState<LocationComparison | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleViewComparison = (comparison: LocationComparison) => {
    setSelectedComparison(comparison)
  }

  const handleCreateComparison = () => {
    setShowCreateModal(true)
  }

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1)
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (score >= 0.6) return <BarChart3 className="w-4 h-4 text-yellow-500" />
    return <TrendingDown className="w-4 h-4 text-red-500" />
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            Location Comparisons
          </h3>
          <p className="text-sm text-gray-600">
            Compare locations across multiple criteria
          </p>
        </div>
        
        <Button
          onClick={handleCreateComparison}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Comparison
        </Button>
      </div>

      {/* Comparisons Grid */}
      <div className="grid grid-cols-1 gap-4">
        {comparisons.map((comparison) => (
          <div
            key={comparison.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {comparison.comparisonName || 'Unnamed Comparison'}
                </h4>
                <p className="text-sm text-gray-600">
                  {comparison.locations.length} locations compared
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Created {new Date(comparison.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewComparison(comparison)}
                  className="flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  View
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Winner */}
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-800">Winner</span>
              </div>
              <p className="text-yellow-900 font-semibold mt-1">
                {comparison.locations.find(l => l.id === comparison.winner)?.name || 'Unknown'}
              </p>
              <p className="text-sm text-yellow-700">
                Score: {formatScore(comparison.locations.find(l => l.id === comparison.winner)?.totalScore || 0)}%
              </p>
            </div>

            {/* Locations Rankings */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">Rankings</h5>
              {comparison.locations
                .sort((a, b) => a.rank - b.rank)
                .slice(0, 3)
                .map((location, index) => (
                  <div
                    key={location.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-gray-600">
                          #{location.rank}
                        </span>
                        {index === 0 && <Star className="w-4 h-4 text-yellow-500" />}
                      </div>
                      <span className="text-sm text-gray-900 font-medium">
                        {location.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getScoreIcon(location.totalScore)}
                      <span className={`text-sm font-semibold ${getScoreColor(location.totalScore)}`}>
                        {formatScore(location.totalScore)}%
                      </span>
                    </div>
                  </div>
                ))}
              
              {comparison.locations.length > 3 && (
                <p className="text-xs text-gray-500 text-center">
                  +{comparison.locations.length - 3} more locations
                </p>
              )}
            </div>

            {/* Criteria Preview */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Criteria</h5>
              <div className="flex flex-wrap gap-2">
                {Object.entries(comparison.criteria).slice(0, 4).map(([criterion, weight]) => (
                  <span
                    key={criterion}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {criterion}: {(weight * 100).toFixed(0)}%
                  </span>
                ))}
                {Object.keys(comparison.criteria).length > 4 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{Object.keys(comparison.criteria).length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed View Modal */}
      {selectedComparison && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedComparison.comparisonName || 'Comparison Details'}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedComparison(null)}
                >
                  Close
                </Button>
              </div>

              {/* Detailed Rankings */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Complete Rankings</h4>
                <div className="space-y-3">
                  {selectedComparison.locations
                    .sort((a, b) => a.rank - b.rank)
                    .map((location) => (
                      <div
                        key={location.id}
                        className="p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-lg font-bold text-gray-900">
                                #{location.rank}
                              </span>
                              {location.rank === 1 && <Trophy className="w-5 h-5 text-yellow-500" />}
                            </div>
                            <h5 className="text-lg font-semibold text-gray-900">
                              {location.name}
                            </h5>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${getScoreColor(location.totalScore)}`}>
                              {formatScore(location.totalScore)}%
                            </p>
                          </div>
                        </div>

                        {/* Individual Scores */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.entries(location.scores).map(([criterion, score]) => (
                            <div key={criterion} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-600">{criterion}</span>
                              <span className={`text-sm font-medium ${getScoreColor(score)}`}>
                                {formatScore(score)}%
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Strengths & Weaknesses */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <h6 className="text-sm font-medium text-green-700 mb-1">Strengths</h6>
                            <div className="flex flex-wrap gap-1">
                              {(selectedComparison.strengths?.[location.id] || []).map((strength, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                                >
                                  {strength}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h6 className="text-sm font-medium text-red-700 mb-1">Weaknesses</h6>
                            <div className="flex flex-wrap gap-1">
                              {(selectedComparison.weaknesses?.[location.id] || []).map((weakness, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
                                >
                                  {weakness}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Criteria Breakdown */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Criteria Weights</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(selectedComparison.criteria).map(([criterion, weight]) => (
                    <div key={criterion} className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">{criterion}</p>
                      <p className="text-lg font-semibold text-blue-700">
                        {(weight * 100).toFixed(0)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {comparisons.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No location comparisons yet</p>
          <p className="text-sm mb-4">
            Create your first comparison to analyze locations side by side
          </p>
          <Button onClick={handleCreateComparison} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Comparison
          </Button>
        </div>
      )}
    </div>
  )
}