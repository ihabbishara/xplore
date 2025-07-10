'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Camera, 
  Calendar, 
  Navigation, 
  Shield, 
  Eye,
  Heart,
  Share2,
  AlertTriangle,
  MapPin,
  Clock
} from 'lucide-react'
import { Button, Card, Text, Badge, Tabs } from '@/components/ui'
import { 
  ActivityCalendar,
  MigrationTracker,
  PhotographyAssistant,
  SafetyGuidelines,
  SightingFeed,
  WildlifeSpeciesCard
} from '@/domains/wildlife/components'
import { useWildlifeStore } from '@/domains/wildlife/hooks/useWildlifeStore'
import { useCommunityStore } from '@/domains/wildlife/hooks/useCommunityStore'

// Workaround for React version compatibility
const MotionDiv = motion.div as any

export default function SpeciesDetailPage() {
  const params = useParams()
  const router = useRouter()
  const speciesId = params.id as string
  
  const [selectedTab, setSelectedTab] = useState<'overview' | 'activity' | 'migration' | 'photography' | 'safety'>('overview')
  const [isFollowing, setIsFollowing] = useState(false)
  
  const { 
    species, 
    sightings, 
    loadSpeciesById, 
    loadSightingsBySpecies,
    reportSighting 
  } = useWildlifeStore()
  
  const { 
    toggleFollowSpecies, 
    isFollowingSpecies 
  } = useCommunityStore()
  
  const currentSpecies = species.find(s => s.id === speciesId)
  const speciesSightings = sightings.filter(s => s.speciesId === speciesId)
  
  useEffect(() => {
    if (speciesId) {
      loadSpeciesById(speciesId)
      loadSightingsBySpecies(speciesId)
    }
  }, [speciesId, loadSpeciesById, loadSightingsBySpecies])
  
  useEffect(() => {
    if (speciesId) {
      setIsFollowing(isFollowingSpecies(speciesId))
    }
  }, [speciesId, isFollowingSpecies])
  
  if (!currentSpecies) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <Text className="text-xl">Loading species information...</Text>
        </Card>
      </div>
    )
  }
  
  const handleFollow = () => {
    toggleFollowSpecies(speciesId)
    setIsFollowing(!isFollowing)
  }
  
  const handleReportSighting = () => {
    router.push(`/wildlife/sightings?species=${speciesId}`)
  }
  
  const dangerColors = {
    harmless: 'bg-green-100 text-green-700',
    caution: 'bg-yellow-100 text-yellow-700',
    dangerous: 'bg-orange-100 text-orange-700',
    lethal: 'bg-red-100 text-red-700'
  }
  
  const conservationColors = {
    'least_concern': 'bg-green-100 text-green-700',
    'near_threatened': 'bg-yellow-100 text-yellow-700',
    'vulnerable': 'bg-orange-100 text-orange-700',
    'endangered': 'bg-red-100 text-red-700',
    'critically_endangered': 'bg-red-200 text-red-800',
    'extinct_in_wild': 'bg-gray-200 text-gray-800',
    'extinct': 'bg-gray-300 text-gray-900',
    'data_deficient': 'bg-gray-100 text-gray-700',
    'not_evaluated': 'bg-gray-50 text-gray-600'
  }
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Eye className="h-4 w-4" /> },
    { id: 'activity', label: 'Activity', icon: <Calendar className="h-4 w-4" /> },
    { id: 'migration', label: 'Migration', icon: <Navigation className="h-4 w-4" /> },
    { id: 'photography', label: 'Photography', icon: <Camera className="h-4 w-4" /> },
    { id: 'safety', label: 'Safety', icon: <Shield className="h-4 w-4" /> }
  ]
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/wildlife')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{currentSpecies.commonName}</h1>
                <Text className="text-sm text-gray-600 italic">
                  {currentSpecies.scientificName}
                </Text>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant={isFollowing ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleFollow}
                className="gap-2"
              >
                <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleReportSighting}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Report Sighting
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Info Bar */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4">
            <Badge 
              variant="secondary" 
              className={dangerColors[currentSpecies.dangerLevel]}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              {currentSpecies.dangerLevel}
            </Badge>
            <Badge 
              variant="secondary"
              className={conservationColors[currentSpecies.conservationStatus]}
            >
              {currentSpecies.conservationStatus.replace('_', ' ')}
            </Badge>
            {currentSpecies.preferredHabitats.map(habitat => (
              <Badge key={habitat} variant="outline">
                <MapPin className="h-3 w-3 mr-1" />
                {habitat}
              </Badge>
            ))}
            {currentSpecies.activityPeriods.map(period => (
              <Badge key={period} variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {period.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <Tabs
          value={selectedTab}
          onValueChange={(value) => setSelectedTab(value as any)}
          className="mb-8"
        >
          <div className="flex gap-2 border-b overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                  selectedTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </Tabs>
        
        {/* Tab Content */}
        <MotionDiv
          key={selectedTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {selectedTab === 'overview' && (
            <div className="space-y-8">
              {/* Description */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">About {currentSpecies.commonName}</h2>
                <Text className="text-gray-600 leading-relaxed">
                  {currentSpecies.description}
                </Text>
              </Card>
              
              {/* Recent Sightings */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Recent Sightings</h2>
                <SightingFeed
                  sightings={speciesSightings.slice(0, 5)}
                  showFilters={false}
                  onSightingSelect={(sighting) => {
                    console.log('Selected sighting:', sighting)
                  }}
                />
              </div>
            </div>
          )}
          
          {selectedTab === 'activity' && (
            <ActivityCalendar
              species={currentSpecies}
              showLegend={true}
              onDateSelect={(date, predictions) => {
                console.log('Selected date:', date, predictions)
              }}
            />
          )}
          
          {selectedTab === 'migration' && (
            <MigrationTracker
              species={currentSpecies}
              showTimeline={true}
              enableAnimation={true}
              onRouteSelect={(route) => {
                console.log('Selected route:', route)
              }}
            />
          )}
          
          {selectedTab === 'photography' && (
            <PhotographyAssistant
              species={currentSpecies}
              onEquipmentSelect={(equipment) => {
                console.log('Selected equipment:', equipment)
              }}
            />
          )}
          
          {selectedTab === 'safety' && (
            <SafetyGuidelines
              species={currentSpecies}
              onEmergencyActivate={() => {
                // Handle emergency activation
                console.log('Emergency activated')
              }}
            />
          )}
        </MotionDiv>
      </div>
    </div>
  )
}