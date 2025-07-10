'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, Text, Avatar, Badge } from '@/components/ui'

interface Activity {
  id: string
  type: 'location_saved' | 'trip_created' | 'journal_entry' | 'checklist_completed'
  title: string
  description: string
  timestamp: string
  icon: React.ReactNode
  color: string
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'location_saved',
    title: 'Saved new location',
    description: 'Added Santorini, Greece to wishlist',
    timestamp: '2 hours ago',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'bg-primary-100 text-primary-600',
  },
  {
    id: '2',
    type: 'trip_created',
    title: 'Created new trip',
    description: 'European Adventure - 14 days itinerary',
    timestamp: '5 hours ago',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    color: 'bg-success-100 text-success-600',
  },
  {
    id: '3',
    type: 'journal_entry',
    title: 'New journal entry',
    description: 'Amazing sunset at Mykonos beach',
    timestamp: '1 day ago',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: 'bg-orange-100 text-orange-600',
  },
  {
    id: '4',
    type: 'checklist_completed',
    title: 'Checklist completed',
    description: 'Travel preparations for Paris trip',
    timestamp: '2 days ago',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'bg-green-100 text-green-600',
  },
  {
    id: '5',
    type: 'location_saved',
    title: 'Saved new location',
    description: 'Added Tokyo, Japan to planned destinations',
    timestamp: '3 days ago',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'bg-primary-100 text-primary-600',
  },
]

export function ActivityFeed() {
  return (
    <Card className="h-[400px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <button className="text-sm text-primary hover:text-primary-600 font-medium">
            View All
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[300px] overflow-y-auto">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className="px-6 py-4 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${activity.color}`}>
                  {activity.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Text variant="body-small" weight="medium" className="truncate">
                      {activity.title}
                    </Text>
                    <Text variant="caption" color="secondary" className="flex-shrink-0 ml-2">
                      {activity.timestamp}
                    </Text>
                  </div>
                  <Text variant="caption" color="secondary" className="mt-1 truncate">
                    {activity.description}
                  </Text>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="px-6 py-4 border-t border-border">
          <button className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
            Load more activities...
          </button>
        </div>
      </CardContent>
    </Card>
  )
}