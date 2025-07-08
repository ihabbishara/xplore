'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts'
import { CostTrend } from '../types/analytics.types'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

interface CostTrendsChartProps {
  trends: CostTrend[]
}

export function CostTrendsChart({ trends }: CostTrendsChartProps) {
  const chartData = useMemo(() => {
    if (!trends || trends.length === 0) return []

    // Group trends by date and aggregate by category
    const groupedData = trends.reduce((acc, trend) => {
      const date = new Date(trend.date).toLocaleDateString()
      
      if (!acc[date]) {
        acc[date] = {
          date,
          accommodation: 0,
          food: 0,
          transport: 0,
          activities: 0,
          total: 0,
          count: 0
        }
      }

      acc[date][trend.category as keyof typeof acc[typeof date]] += trend.cost
      acc[date].total += trend.cost
      acc[date].count += 1

      return acc
    }, {} as Record<string, any>)

    // Format for chart
    return Object.values(groupedData).map((item: any) => ({
      date: item.date,
      accommodation: item.accommodation,
      food: item.food,
      transport: item.transport,
      activities: item.activities,
      total: item.total
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [trends])

  const totalCost = useMemo(() => {
    if (!trends || trends.length === 0) return 0
    return trends.reduce((sum, trend) => sum + trend.cost, 0)
  }, [trends])

  const averageDailyCost = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0
    return totalCost / chartData.length
  }, [totalCost, chartData])

  const costTrend = useMemo(() => {
    if (chartData.length < 2) return 0
    const first = chartData[0].total
    const last = chartData[chartData.length - 1].total
    return ((last - first) / first * 100).toFixed(1)
  }, [chartData])

  if (!trends || trends.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No cost data available</p>
          <p className="text-sm">Start tracking expenses to see your cost trends</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Cost Trends
          </h3>
          <p className="text-sm text-gray-600">Your spending patterns across different categories</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Avg Daily Cost</p>
          <p className="text-2xl font-semibold text-gray-900">${averageDailyCost.toFixed(0)}</p>
          <p className={`text-xs flex items-center gap-1 ${parseFloat(costTrend) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {parseFloat(costTrend) >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {parseFloat(costTrend) >= 0 ? '+' : ''}{costTrend}% from start
          </p>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: any, name: string) => [
                `$${parseFloat(value).toFixed(0)}`,
                name.charAt(0).toUpperCase() + name.slice(1)
              ]}
            />
            <Legend />
            <Bar 
              dataKey="accommodation" 
              stackId="a"
              fill="#3b82f6"
              name="Accommodation"
            />
            <Bar 
              dataKey="food" 
              stackId="a"
              fill="#10b981"
              name="Food"
            />
            <Bar 
              dataKey="transport" 
              stackId="a"
              fill="#f59e0b"
              name="Transport"
            />
            <Bar 
              dataKey="activities" 
              stackId="a"
              fill="#8b5cf6"
              name="Activities"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-blue-700">Accommodation</span>
          </div>
          <p className="text-lg font-semibold text-blue-900 mt-1">
            ${trends.filter(t => t.category === 'accommodation').reduce((sum, t) => sum + t.cost, 0).toFixed(0)}
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">Food</span>
          </div>
          <p className="text-lg font-semibold text-green-900 mt-1">
            ${trends.filter(t => t.category === 'food').reduce((sum, t) => sum + t.cost, 0).toFixed(0)}
          </p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm font-medium text-yellow-700">Transport</span>
          </div>
          <p className="text-lg font-semibold text-yellow-900 mt-1">
            ${trends.filter(t => t.category === 'transport').reduce((sum, t) => sum + t.cost, 0).toFixed(0)}
          </p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-sm font-medium text-purple-700">Activities</span>
          </div>
          <p className="text-lg font-semibold text-purple-900 mt-1">
            ${trends.filter(t => t.category === 'activities').reduce((sum, t) => sum + t.cost, 0).toFixed(0)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>Total tracked expenses: ${totalCost.toFixed(0)}</span>
        <span>{trends.length} transactions</span>
      </div>
    </div>
  )
}