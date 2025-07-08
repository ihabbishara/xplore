'use client'

import { DashboardOverview } from '../types/analytics.types'
import { MapPin, Route, BookOpen, TrendingUp, Star, Activity } from 'lucide-react'

interface DashboardOverviewCardsProps {
  overview: DashboardOverview
}

export function DashboardOverviewCards({ overview }: DashboardOverviewCardsProps) {
  const cards = [
    {
      title: 'Locations Explored',
      value: overview.totalLocations,
      icon: MapPin,
      color: 'bg-blue-500',
      description: 'Total locations in your wishlist'
    },
    {
      title: 'Trips Planned',
      value: overview.totalTrips,
      icon: Route,
      color: 'bg-green-500',
      description: 'Trips created and planned'
    },
    {
      title: 'Journal Entries',
      value: overview.totalJournalEntries,
      icon: BookOpen,
      color: 'bg-purple-500',
      description: 'Documentation and memories'
    },
    {
      title: 'Average Sentiment',
      value: overview.averageSentiment.toFixed(1),
      icon: TrendingUp,
      color: 'bg-orange-500',
      description: 'Overall satisfaction score',
      suffix: '/5.0'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {card.value}
                {card.suffix && (
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    {card.suffix}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">{card.description}</p>
            </div>
            <div className={`${card.color} p-3 rounded-full`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      ))}
      
      {/* Top Locations Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 md:col-span-2 lg:col-span-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Top Locations
          </h3>
          <span className="text-sm text-gray-500">Based on your activity</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {overview.topLocations.map((location, index) => (
            <div key={location.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">
                    #{index + 1}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {location.name}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>Score: {location.score.toFixed(1)}</span>
                  <span>•</span>
                  <span>{location.visits} visits</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {overview.topLocations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No locations data available yet</p>
            <p className="text-sm">Start exploring to see your top locations here</p>
          </div>
        )}
      </div>
      
      {/* Recent Activity Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 md:col-span-2 lg:col-span-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            Recent Activity
          </h3>
          <span className="text-sm text-gray-500">Last 7 days</span>
        </div>
        
        <div className="space-y-3">
          {overview.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {overview.recentActivity.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No recent activity</p>
            <p className="text-sm">Your recent exploration activities will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}