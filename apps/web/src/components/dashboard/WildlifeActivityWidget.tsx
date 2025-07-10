'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, TrendingUp, Camera, MapPin, ChevronRight, Activity } from 'lucide-react'
import { Card, Text, Badge } from '@/components/ui'
import { useWildlifeStore } from '@/domains/wildlife/hooks/useWildlifeStore'
import { formatDistanceToNow } from 'date-fns'

// Workaround for React version compatibility
const MotionDiv = motion.div as any

export function WildlifeActivityWidget() {
  const router = useRouter()
  const { 
    realtimeSightings, 
    species,
    loadSightings,
    loadSpecies,
    getBestViewingTime 
  } = useWildlifeStore()
  
  useEffect(() => {
    loadSightings()
    loadSpecies()
  }, [loadSightings, loadSpecies])
  
  const recentSightings = realtimeSightings.slice(0, 3)
  const activeSpecies = species.filter(s => {
    const bestTime = getBestViewingTime(s.id)
    return bestTime && bestTime.includes(new Date().getHours())
  }).slice(0, 3)
  
  const stats = {
    todaySightings: realtimeSightings.filter(s => {
      const today = new Date()
      const sightingDate = new Date(s.timestamp)
      return sightingDate.toDateString() === today.toDateString()
    }).length,
    activeSpecies: activeSpecies.length,
    verifiedToday: realtimeSightings.filter(s => {
      const today = new Date()
      const sightingDate = new Date(s.timestamp)
      return sightingDate.toDateString() === today.toDateString() && 
             (s.verificationStatus === 'verified' || s.verificationStatus === 'expert_verified')
    }).length
  }
  
  return (
    <Card className="h-full">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <Text variant="h5">Wildlife Activity</Text>
              <Text variant="body-small" color="secondary">
                Live sightings & active species
              </Text>
            </div>
          </div>
          
          <button
            onClick={() => router.push('/wildlife')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <Text className="text-2xl font-bold text-green-600">{stats.todaySightings}</Text>
            <Text className="text-xs text-gray-500">Today</Text>
          </div>
          <div className="text-center">
            <Text className="text-2xl font-bold text-blue-600">{stats.activeSpecies}</Text>
            <Text className="text-xs text-gray-500">Active Now</Text>
          </div>
          <div className="text-center">
            <Text className="text-2xl font-bold text-purple-600">{stats.verifiedToday}</Text>
            <Text className="text-xs text-gray-500">Verified</Text>
          </div>
        </div>
        
        {/* Recent Sightings */}
        <div className="space-y-3 mb-6">
          <Text className="font-medium text-sm">Recent Sightings</Text>
          {recentSightings.length > 0 ? (
            recentSightings.map((sighting, idx) => (
              <MotionDiv
                key={sighting.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => router.push(`/wildlife/sightings`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Camera className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <Text className="font-medium text-sm">{sighting.species}</Text>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <Text>{sighting.locationName || 'Unknown location'}</Text>
                      <Text>•</Text>
                      <Text>{formatDistanceToNow(new Date(sighting.timestamp), { addSuffix: true })}</Text>
                    </div>
                  </div>
                </div>
                
                {sighting.photos && sighting.photos.length > 0 && (
                  <Badge variant="secondary" size="sm">
                    <Camera className="h-3 w-3 mr-1" />
                    {sighting.photos.length}
                  </Badge>
                )}
              </MotionDiv>
            ))
          ) : (
            <div className="text-center py-4">
              <Text className="text-sm text-gray-500">No recent sightings</Text>
            </div>
          )}
        </div>
        
        {/* Active Species */}
        <div className="space-y-3">
          <Text className="font-medium text-sm">Active Species Now</Text>
          {activeSpecies.length > 0 ? (
            activeSpecies.map((animal, idx) => (
              <MotionDiv
                key={animal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                onClick={() => router.push(`/wildlife/species/${animal.id}`)}
              >
                <div>
                  <Text className="font-medium text-sm">{animal.commonName}</Text>
                  <Text className="text-xs text-gray-500 italic">{animal.scientificName}</Text>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" size="sm">
                    <Activity className="h-3 w-3 mr-1" />
                    {animal.activityPeriods[0]}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </MotionDiv>
            ))
          ) : (
            <div className="text-center py-4">
              <Text className="text-sm text-gray-500">No species active at this time</Text>
            </div>
          )}
        </div>
        
        {/* View All Link */}
        <button
          onClick={() => router.push('/wildlife')}
          className="w-full mt-6 p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="h-4 w-4 text-green-600" />
          <Text className="text-sm font-medium text-green-600">
            Explore Wildlife Tracker
          </Text>
        </button>
      </div>
    </Card>
  )
}