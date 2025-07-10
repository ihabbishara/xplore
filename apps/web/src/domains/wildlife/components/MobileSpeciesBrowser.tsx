'use client'

import React, { useState } from 'react'
import { SwipeableCard, Card, Text, Badge, Button } from '@/components/ui'
import { ChevronLeft, ChevronRight, MapPin, Eye, Calendar } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useWildlifeStore } from '../hooks/useWildlifeStore'

export function MobileSpeciesBrowser() {
  const { species } = useWildlifeStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [exitDirection, setExitDirection] = useState<'left' | 'right'>('left')
  
  const handleSwipeLeft = () => {
    if (currentIndex < species.length - 1) {
      setExitDirection('left')
      setCurrentIndex(prev => prev + 1)
    }
  }
  
  const handleSwipeRight = () => {
    if (currentIndex > 0) {
      setExitDirection('right')
      setCurrentIndex(prev => prev - 1)
    }
  }
  
  const currentSpecies = species[currentIndex]
  
  if (species.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Text>No species data available</Text>
      </Card>
    )
  }
  
  return (
    <div className="relative h-[600px] md:hidden">
      {/* Progress Indicator */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between mb-2">
          <Text className="text-sm font-medium">
            {currentIndex + 1} of {species.length}
          </Text>
          <div className="flex gap-1">
            {species.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 w-8 rounded-full transition-colors ${
                  idx === currentIndex ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Swipeable Cards */}
      <div className="h-full flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: exitDirection === 'left' ? 300 : -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: exitDirection === 'left' ? -300 : 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-sm"
          >
            <SwipeableCard
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              threshold={80}
            >
              <Card className="p-0 overflow-hidden">
                {/* Species Image */}
                <div className="relative h-64 bg-gradient-to-br from-green-100 to-green-200">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Text className="text-6xl">🦁</Text>
                  </div>
                  <Badge 
                    variant={currentSpecies.conservationStatus === 'Endangered' ? 'destructive' : 'secondary'}
                    className="absolute top-4 right-4"
                  >
                    {currentSpecies.conservationStatus}
                  </Badge>
                </div>
                
                {/* Species Info */}
                <div className="p-6">
                  <Text variant="h4" className="mb-2">{currentSpecies.commonName}</Text>
                  <Text className="text-sm text-gray-600 italic mb-4">
                    {currentSpecies.scientificName}
                  </Text>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <Text className="text-sm">{currentSpecies.habitat}</Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-600" />
                      <Text className="text-sm">
                        {currentSpecies.recentSightings?.length || 0} recent sightings
                      </Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <Text className="text-sm">
                        Best time: {currentSpecies.activityPatterns?.peakHours?.join(', ')}
                      </Text>
                    </div>
                  </div>
                  
                  <Link href={`/wildlife/species/${currentSpecies.id}`}>
                    <Button variant="primary" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              </Card>
            </SwipeableCard>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Navigation Buttons */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-between px-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSwipeRight}
          disabled={currentIndex === 0}
          className="rounded-full bg-white/80 backdrop-blur"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSwipeLeft}
          disabled={currentIndex === species.length - 1}
          className="rounded-full bg-white/80 backdrop-blur"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}