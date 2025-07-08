'use client'

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/store/store'
import { createDecisionMatrix } from '../store/analyticsSlice'
import { DecisionMatrix } from '../types/analytics.types'
import { Button } from '@/components/ui/Button'
import { 
  Grid3x3,
  Plus,
  Trophy,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Target,
  Scale,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface DecisionMatrixGridProps {
  matrices: DecisionMatrix[]
}

export function DecisionMatrixGrid({ matrices }: DecisionMatrixGridProps) {
  const dispatch = useDispatch<AppDispatch>()
  const [selectedMatrix, setSelectedMatrix] = useState<DecisionMatrix | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleViewMatrix = (matrix: DecisionMatrix) => {
    setSelectedMatrix(matrix)
  }

  const handleCreateMatrix = () => {
    setShowCreateModal(true)
  }

  const formatScore = (score: number) => {
    return score.toFixed(2)
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = score / maxScore
    if (percentage >= 0.8) return 'text-green-600'
    if (percentage >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number, maxScore: number) => {
    const percentage = score / maxScore
    if (percentage >= 0.8) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (percentage >= 0.6) return <BarChart3 className="w-4 h-4 text-yellow-500" />
    return <TrendingDown className="w-4 h-4 text-red-500" />
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-purple-500" />
            Decision Matrices
          </h3>
          <p className="text-sm text-gray-600">
            Structured decision-making with weighted criteria
          </p>
        </div>
        
        <Button
          onClick={handleCreateMatrix}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Matrix
        </Button>
      </div>

      {/* Matrices Grid */}
      <div className="grid grid-cols-1 gap-4">
        {matrices.map((matrix) => {
          const maxScore = Math.max(...matrix.results.map(r => r.totalScore))
          const winner = matrix.results.find(r => r.rank === 1)
          
          return (
            <div
              key={matrix.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {matrix.name || 'Unnamed Matrix'}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {matrix.alternatives.length} alternatives
                    </span>
                    <span className="flex items-center gap-1">
                      <Scale className="w-3 h-3" />
                      {matrix.criteria.length} criteria
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Created {new Date(matrix.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewMatrix(matrix)}
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
              {winner && (
                <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium text-purple-800">Best Alternative</span>
                  </div>
                  <p className="text-purple-900 font-semibold mt-1">
                    {winner.alternative}
                  </p>
                  <p className="text-sm text-purple-700">
                    Score: {formatScore(winner.totalScore)}
                  </p>
                </div>
              )}

              {/* Results Rankings */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Rankings</h5>
                {matrix.results
                  .sort((a, b) => a.rank - b.rank)
                  .slice(0, 3)
                  .map((result) => (
                    <div
                      key={result.alternative}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-600">
                          #{result.rank}
                        </span>
                        <span className="text-sm text-gray-900 font-medium">
                          {result.alternative}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getScoreIcon(result.totalScore, maxScore)}
                        <span className={`text-sm font-semibold ${getScoreColor(result.totalScore, maxScore)}`}>
                          {formatScore(result.totalScore)}
                        </span>
                      </div>
                    </div>
                  ))}
                
                {matrix.results.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{matrix.results.length - 3} more alternatives
                  </p>
                )}
              </div>

              {/* Criteria Preview */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Criteria</h5>
                <div className="flex flex-wrap gap-2">
                  {matrix.criteria.slice(0, 4).map((criterion) => (
                    <span
                      key={criterion.name}
                      className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                    >
                      {criterion.name}: {(criterion.weight * 100).toFixed(0)}%
                    </span>
                  ))}
                  {matrix.criteria.length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{matrix.criteria.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detailed View Modal */}
      {selectedMatrix && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedMatrix.name || 'Decision Matrix Details'}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMatrix(null)}
                >
                  Close
                </Button>
              </div>

              {/* Matrix Table */}
              <div className="mb-6 overflow-x-auto">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Score Matrix</h4>
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-900">
                        Alternative
                      </th>
                      {selectedMatrix.criteria.map((criterion) => (
                        <th
                          key={criterion.name}
                          className="border-b border-gray-200 p-3 text-center text-sm font-medium text-gray-900"
                        >
                          {criterion.name}
                          <br />
                          <span className="text-xs text-gray-500">
                            ({(criterion.weight * 100).toFixed(0)}%)
                          </span>
                        </th>
                      ))}
                      <th className="border-b border-gray-200 p-3 text-center text-sm font-medium text-gray-900">
                        Total Score
                      </th>
                      <th className="border-b border-gray-200 p-3 text-center text-sm font-medium text-gray-900">
                        Rank
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMatrix.results
                      .sort((a, b) => a.rank - b.rank)
                      .map((result) => (
                        <tr key={result.alternative} className="hover:bg-gray-50">
                          <td className="border-b border-gray-200 p-3 text-sm font-medium text-gray-900">
                            {result.alternative}
                          </td>
                          {selectedMatrix.criteria.map((criterion) => {
                            const score = selectedMatrix.scores[result.alternative]?.[criterion.name] || 0
                            return (
                              <td
                                key={criterion.name}
                                className="border-b border-gray-200 p-3 text-center text-sm text-gray-600"
                              >
                                {score.toFixed(2)}
                              </td>
                            )
                          })}
                          <td className="border-b border-gray-200 p-3 text-center text-sm font-semibold text-gray-900">
                            {formatScore(result.totalScore)}
                          </td>
                          <td className="border-b border-gray-200 p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-sm font-semibold text-gray-900">
                                #{result.rank}
                              </span>
                              {result.rank === 1 && <Trophy className="w-4 h-4 text-yellow-500" />}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Criteria Breakdown */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Criteria Weights</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedMatrix.criteria.map((criterion) => (
                    <div key={criterion.name} className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-900">{criterion.name}</p>
                      <p className="text-lg font-semibold text-purple-700">
                        {(criterion.weight * 100).toFixed(0)}%
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
      {matrices.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Grid3x3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No decision matrices yet</p>
          <p className="text-sm mb-4">
            Create your first matrix to make structured decisions
          </p>
          <Button onClick={handleCreateMatrix} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Matrix
          </Button>
        </div>
      )}
    </div>
  )
}