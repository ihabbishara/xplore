'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Map, Camera, Shield, TrendingUp, Filter, Search } from 'lucide-react'
import { Button, Card, Text, Input, Tabs } from '@/components/ui'
import { 
  WildlifeSpeciesCard, 
  SightingFeed, 
  WildlifeHeatmap,
  MobileSpeciesBrowser 
} from '@/domains/wildlife/components'
import { useWildlifeStore } from '@/domains/wildlife/hooks/useWildlifeStore'

// Workaround for React version compatibility
const MotionDiv = motion.div as any

export default function WildlifePage() {
  const [selectedTab, setSelectedTab] = useState<'species' | 'sightings' | 'heatmap'>('species')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  const { species, sightings, loadSpecies, loadSightings } = useWildlifeStore()
  
  React.useEffect(() => {
    loadSpecies()
    loadSightings()
  }, [loadSpecies, loadSightings])
  
  const filteredSpecies = species.filter(s => 
    s.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.scientificName.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 120
      }
    }
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-600 to-green-800 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Wildlife Tracker
            </h1>
            <p className="text-xl text-green-100 max-w-2xl">
              Discover, track, and contribute to wildlife conservation through community-driven sightings
            </p>
          </MotionDiv>
        </div>
      </div>
      
      {/* Stats Bar */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Text className="text-2xl font-bold text-primary">{species.length}</Text>
              <Text className="text-sm text-gray-600">Species Tracked</Text>
            </div>
            <div className="text-center">
              <Text className="text-2xl font-bold text-green-600">{sightings.length}</Text>
              <Text className="text-sm text-gray-600">Total Sightings</Text>
            </div>
            <div className="text-center">
              <Text className="text-2xl font-bold text-blue-600">
                {sightings.filter(s => s.verificationStatus === 'verified' || s.verificationStatus === 'expert_verified').length}
              </Text>
              <Text className="text-sm text-gray-600">Verified Reports</Text>
            </div>
            <div className="text-center">
              <Text className="text-2xl font-bold text-orange-600">
                {new Set(sightings.map(s => s.userId)).size}
              </Text>
              <Text className="text-sm text-gray-600">Active Contributors</Text>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search species by name..."
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs
          value={selectedTab}
          onValueChange={(value) => setSelectedTab(value as any)}
          className="mb-8"
        >
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setSelectedTab('species')}
              className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
                selectedTab === 'species'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="h-4 w-4" />
              Species
            </button>
            <button
              onClick={() => setSelectedTab('sightings')}
              className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
                selectedTab === 'sightings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera className="h-4 w-4" />
              Recent Sightings
            </button>
            <button
              onClick={() => setSelectedTab('heatmap')}
              className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
                selectedTab === 'heatmap'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Map className="h-4 w-4" />
              Density Map
            </button>
          </div>
        </Tabs>
        
        {/* Tab Content */}
        <MotionDiv
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {selectedTab === 'species' && (
            <>
              {/* Mobile View - Swipeable Cards */}
              <div className="block md:hidden">
                <MobileSpeciesBrowser />
              </div>
              
              {/* Desktop/Tablet View - Grid */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSpecies.map((animal, idx) => (
                  <MotionDiv key={animal.id} variants={itemVariants}>
                    <WildlifeSpeciesCard
                      species={animal}
                      onSightingReport={() => {
                        // Navigate to sighting form
                        window.location.href = `/wildlife/sightings?species=${animal.id}`
                      }}
                    />
                  </MotionDiv>
                ))}
              </div>
            </>
          )}
          
          {selectedTab === 'sightings' && (
            <SightingFeed
              realtime={true}
              showFilters={true}
              onSightingSelect={(sighting) => {
                // Navigate to sighting detail
                console.log('Selected sighting:', sighting)
              }}
            />
          )}
          
          {selectedTab === 'heatmap' && (
            <WildlifeHeatmap
              timeRange="30d"
              onCellClick={(cell) => {
                console.log('Selected cell:', cell)
              }}
            />
          )}
        </MotionDiv>
        
        {/* Empty State */}
        {selectedTab === 'species' && filteredSpecies.length === 0 && (
          <Card className="p-12 text-center">
            <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <Text className="text-xl font-medium mb-2">No species found</Text>
            <Text className="text-gray-600">
              Try adjusting your search or filters
            </Text>
          </Card>
        )}
      </div>
    </div>
  )
}