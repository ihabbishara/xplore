'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, Text, Badge, Progress } from '@/components/ui'

interface AnalyticsStat {
  label: string
  value: number
  unit: string
  change: number
  trend: 'up' | 'down' | 'stable'
  icon: React.ReactNode
  color: string
}

const stats: AnalyticsStat[] = [
  {
    label: 'Locations Explored',
    value: 47,
    unit: 'places',
    change: 12,
    trend: 'up',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'text-primary-600',
  },
  {
    label: 'Trips Completed',
    value: 8,
    unit: 'trips',
    change: 2,
    trend: 'up',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    color: 'text-success-600',
  },
  {
    label: 'Journal Entries',
    value: 23,
    unit: 'entries',
    change: 5,
    trend: 'up',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: 'text-orange-600',
  },
  {
    label: 'Countries Visited',
    value: 12,
    unit: 'countries',
    change: 1,
    trend: 'up',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-purple-600',
  },
]

export function AnalyticsSummary() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Exploration Journey</CardTitle>
          <button className="text-sm text-primary hover:text-primary-600 font-medium">
            View Full Analytics
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={stat.label} className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className={`${stat.color}`}>
                  {stat.icon}
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`text-xs ${stat.trend === 'up' ? 'text-success-600' : 'text-error'}`}>
                    {stat.trend === 'up' ? '+' : '-'}{stat.change}
                  </span>
                  <svg
                    className={`w-3 h-3 ${stat.trend === 'up' ? 'text-success-600' : 'text-error'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={stat.trend === 'up' ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V4'}
                    />
                  </svg>
                </div>
              </div>
              <Text variant="h4" className="mb-1">
                {stat.value}
              </Text>
              <Text variant="caption" color="secondary">
                {stat.unit}
              </Text>
            </div>
          ))}
        </div>

        {/* Exploration Progress */}
        <div className="space-y-4">
          <Text variant="h6">Exploration Goals</Text>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Text variant="body-small">Visit 15 countries</Text>
                <Text variant="caption" color="secondary">12/15</Text>
              </div>
              <Progress value={80} variant="success" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <Text variant="body-small">Complete 10 trips</Text>
                <Text variant="caption" color="secondary">8/10</Text>
              </div>
              <Progress value={80} variant="default" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <Text variant="body-small">50 journal entries</Text>
                <Text variant="caption" color="secondary">23/50</Text>
              </div>
              <Progress value={46} variant="warning" />
            </div>
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="space-y-3">
          <Text variant="h6">Recent Achievements</Text>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-2 bg-success-50 dark:bg-success-900/20 rounded-lg">
              <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <Text variant="body-small" weight="medium">Globe Trotter</Text>
                <Text variant="caption" color="secondary">Visited 10+ countries</Text>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <Text variant="body-small" weight="medium">Storyteller</Text>
                <Text variant="caption" color="secondary">Created 20+ journal entries</Text>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}