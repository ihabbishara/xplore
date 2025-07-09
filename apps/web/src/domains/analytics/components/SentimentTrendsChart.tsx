'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { SentimentTrend } from '../types/analytics.types'
import { TrendingUp } from 'lucide-react'

interface SentimentTrendsChartProps {
  trends: SentimentTrend[]
}

export function SentimentTrendsChart({ trends }: SentimentTrendsChartProps) {
  const chartData = useMemo(() => {
    if (!trends || trends.length === 0) return []

    // Group trends by date and aggregate by category
    const groupedData = trends.reduce((acc, trend) => {
      const date = new Date(trend.date).toLocaleDateString()
      
      if (!acc[date]) {
        acc[date] = {
          date,
          journal: 0,
          review: 0,
          note: 0,
          overall: 0,
          count: 0
        }
      }

      acc[date][trend.category as keyof typeof acc[typeof date]] += trend.sentiment
      acc[date].overall += trend.sentiment
      acc[date].count += 1

      return acc
    }, {} as Record<string, any>)

    // Calculate averages and format for chart
    return Object.values(groupedData).map((item: any) => ({
      date: item.date,
      journal: item.journal > 0 ? (item.journal / item.count).toFixed(2) : 0,
      review: item.review > 0 ? (item.review / item.count).toFixed(2) : 0,
      note: item.note > 0 ? (item.note / item.count).toFixed(2) : 0,
      overall: (item.overall / item.count).toFixed(2)
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [trends])

  const averageSentiment = useMemo(() => {
    if (!trends || trends.length === 0) return 0
    const total = trends.reduce((sum, trend) => sum + trend.sentiment, 0)
    return (total / trends.length).toFixed(2)
  }, [trends])

  const sentimentTrend = useMemo(() => {
    if (chartData.length < 2) return 0
    const first = parseFloat(chartData[0].overall)
    const last = parseFloat(chartData[chartData.length - 1].overall)
    return ((last - first) / first * 100).toFixed(1)
  }, [chartData])

  if (!trends || trends.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No sentiment data available</p>
          <p className="text-sm">Start journaling to see your sentiment trends</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Sentiment Trends
          </h3>
          <p className="text-sm text-gray-600">How your feelings about places change over time</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Average Sentiment</p>
          <p className="text-2xl font-semibold text-gray-900">{averageSentiment}/5.0</p>
          <p className={`text-xs ${parseFloat(String(sentimentTrend)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {parseFloat(String(sentimentTrend)) >= 0 ? '+' : ''}{sentimentTrend}% from start
          </p>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis 
              domain={[0, 5]} 
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
                `${parseFloat(value).toFixed(2)}/5.0`,
                name.charAt(0).toUpperCase() + name.slice(1)
              ]}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="overall" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              name="Overall"
            />
            <Line 
              type="monotone" 
              dataKey="journal" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
              name="Journal"
            />
            <Line 
              type="monotone" 
              dataKey="review" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
              name="Review"
            />
            <Line 
              type="monotone" 
              dataKey="note" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
              name="Note"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>Sentiment scale: 1 (very negative) to 5 (very positive)</span>
        <span>{trends.length} data points</span>
      </div>
    </div>
  )
}