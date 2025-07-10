'use client'

import React, { useState } from 'react'
import { Card, CardContent, Text, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Trip {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
  duration: string
  status: 'upcoming' | 'in_progress' | 'completed'
  image: string
  progress?: number
}

const trips: Trip[] = [
  {
    id: '1',
    title: 'European Adventure',
    destination: 'Paris, Rome, Barcelona',
    startDate: '2024-03-15',
    endDate: '2024-03-29',
    duration: '14 days',
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=250&fit=crop',
  },
  {
    id: '2',
    title: 'Tokyo Explorer',
    destination: 'Tokyo, Japan',
    startDate: '2024-02-10',
    endDate: '2024-02-17',
    duration: '7 days',
    status: 'in_progress',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=250&fit=crop',
    progress: 65,
  },
  {
    id: '3',
    title: 'Bali Retreat',
    destination: 'Bali, Indonesia',
    startDate: '2024-01-20',
    endDate: '2024-01-30',
    duration: '10 days',
    status: 'completed',
    image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400&h=250&fit=crop',
  },
  {
    id: '4',
    title: 'New York City',
    destination: 'New York, USA',
    startDate: '2024-04-05',
    endDate: '2024-04-12',
    duration: '7 days',
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=250&fit=crop',
  },
]

export function TripsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, trips.length - 2))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, trips.length - 2)) % Math.max(1, trips.length - 2))
  }

  const getStatusBadge = (status: Trip['status']) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="default">Upcoming</Badge>
      case 'in_progress':
        return <Badge variant="warning">In Progress</Badge>
      case 'completed':
        return <Badge variant="success">Completed</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Text variant="h3" className="mb-2">Upcoming Trips</Text>
          <Text variant="body" color="secondary">
            Your planned adventures and ongoing journeys
          </Text>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={prevSlide}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
            disabled={trips.length <= 3}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
            disabled={trips.length <= 3}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
        >
          {trips.map((trip) => (
            <div key={trip.id} className="w-full sm:w-1/2 lg:w-1/3 flex-shrink-0 px-3">
              <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={trip.image}
                      alt={trip.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      {getStatusBadge(trip.status)}
                    </div>

                    {/* Progress Bar for In-Progress Trips */}
                    {trip.status === 'in_progress' && trip.progress && (
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-white h-full transition-all duration-300"
                            style={{ width: `${trip.progress}%` }}
                          />
                        </div>
                        <Text variant="caption" className="text-white mt-1">
                          {trip.progress}% complete
                        </Text>
                      </div>
                    )}

                    {/* Trip Info Overlay */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <Text variant="h6" className="text-white mb-1">
                        {trip.title}
                      </Text>
                      <Text variant="caption" className="text-white/80">
                        {trip.destination}
                      </Text>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Text variant="body-small" color="secondary">
                        {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                      </Text>
                      <Text variant="body-small" weight="medium" color="primary">
                        {trip.duration}
                      </Text>
                    </div>

                    <div className="flex items-center justify-between">
                      <button className="flex items-center text-sm text-primary hover:text-primary-600 font-medium">
                        View Details
                        <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      {trip.status === 'upcoming' && (
                        <button className="text-sm text-muted-foreground hover:text-foreground">
                          Edit Trip
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      {trips.length > 3 && (
        <div className="flex justify-center space-x-2">
          {Array.from({ length: Math.max(1, trips.length - 2) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                currentIndex === index ? 'bg-primary-500' : 'bg-gray-300'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}