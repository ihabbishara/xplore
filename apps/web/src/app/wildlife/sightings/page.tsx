'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Map, 
  List, 
  Plus, 
  Filter, 
  Eye, 
  Camera,
  MapPin,
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Button, Card, Text, Badge, Modal, Input, Textarea, Select } from '@/components/ui'
import { 
  SightingFeed,
  VerificationSystem,
  WildlifeHeatmap
} from '@/domains/wildlife/components'
import { useWildlifeStore } from '@/domains/wildlife/hooks/useWildlifeStore'
import { format } from 'date-fns'

// Workaround for React version compatibility
const MotionDiv = motion.div as any

export default function SightingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedSpecies = searchParams.get('species')
  
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedSighting, setSelectedSighting] = useState(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    speciesId: preselectedSpecies || '',
    location: { lat: 0, lng: 0 },
    locationName: '',
    count: 1,
    behavior: [],
    habitatType: '',
    distance: '',
    duration: '',
    notes: '',
    photos: []
  })
  
  const { 
    species,
    sightings,
    realtimeSightings,
    loadSpecies,
    loadSightings,
    reportSighting
  } = useWildlifeStore()
  
  useEffect(() => {
    loadSpecies()
    loadSightings()
  }, [loadSpecies, loadSightings])
  
  useEffect(() => {
    if (preselectedSpecies) {
      setShowReportModal(true)
    }
  }, [preselectedSpecies])
  
  const handleReportSighting = async () => {
    const selectedSpecies = species.find(s => s.id === formData.speciesId)
    if (!selectedSpecies) return
    
    await reportSighting({
      speciesId: formData.speciesId,
      species: selectedSpecies.commonName,
      scientificName: selectedSpecies.scientificName,
      location: formData.location,
      locationName: formData.locationName,
      timestamp: new Date(),
      count: formData.count,
      behavior: formData.behavior,
      habitatType: formData.habitatType,
      distance: parseFloat(formData.distance) || undefined,
      duration: parseFloat(formData.duration) || undefined,
      weatherConditions: {
        temperature: 20, // Would get from weather API
        conditions: 'clear',
        windSpeed: 10,
        visibility: 10
      },
      photos: formData.photos,
      notes: formData.notes,
      verificationStatus: 'pending',
      isPublic: true,
      hidePreciseLocation: false
    })
    
    setShowReportModal(false)
    // Reset form
    setFormData({
      speciesId: '',
      location: { lat: 0, lng: 0 },
      locationName: '',
      count: 1,
      behavior: [],
      habitatType: '',
      distance: '',
      duration: '',
      notes: '',
      photos: []
    })
  }
  
  const stats = {
    total: sightings.length,
    today: sightings.filter(s => {
      const today = new Date()
      const sightingDate = new Date(s.timestamp)
      return sightingDate.toDateString() === today.toDateString()
    }).length,
    verified: sightings.filter(s => 
      s.verificationStatus === 'verified' || 
      s.verificationStatus === 'expert_verified'
    ).length,
    pending: sightings.filter(s => s.verificationStatus === 'pending').length
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Wildlife Sightings</h1>
              <Text className="text-sm text-gray-600">
                Community-reported wildlife observations
              </Text>
            </div>
            
            <Button
              variant="default"
              onClick={() => setShowReportModal(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Report Sighting
            </Button>
          </div>
        </div>
      </div>
      
      {/* Stats Bar */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Text className="text-2xl font-bold">{stats.total}</Text>
              <Text className="text-sm text-gray-600">Total Sightings</Text>
            </div>
            <div className="text-center">
              <Text className="text-2xl font-bold text-blue-600">{stats.today}</Text>
              <Text className="text-sm text-gray-600">Today</Text>
            </div>
            <div className="text-center">
              <Text className="text-2xl font-bold text-green-600">{stats.verified}</Text>
              <Text className="text-sm text-gray-600">Verified</Text>
            </div>
            <div className="text-center">
              <Text className="text-2xl font-bold text-orange-600">{stats.pending}</Text>
              <Text className="text-sm text-gray-600">Pending Verification</Text>
            </div>
          </div>
        </div>
      </div>
      
      {/* View Toggle */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              List View
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="gap-2"
            >
              <Map className="h-4 w-4" />
              Map View
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
        
        {/* Content */}
        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SightingFeed
                realtime={true}
                showFilters={false}
                onSightingSelect={(sighting) => {
                  setSelectedSighting(sighting)
                  setShowVerificationModal(true)
                }}
              />
            </div>
            
            <div className="lg:col-span-1">
              <Card className="p-4 sticky top-24">
                <h3 className="font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div>
                    <Text className="text-sm text-gray-600">Most Active Species</Text>
                    <div className="mt-2 space-y-2">
                      {/* Top species list would go here */}
                      <div className="flex items-center justify-between">
                        <Text className="font-medium">African Elephant</Text>
                        <Badge variant="secondary">24 sightings</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <Text className="font-medium">Lion</Text>
                        <Badge variant="secondary">18 sightings</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <Text className="font-medium">Giraffe</Text>
                        <Badge variant="secondary">15 sightings</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Text className="text-sm text-gray-600">Peak Activity Time</Text>
                    <Text className="font-medium">06:00 - 08:00</Text>
                  </div>
                  
                  <div>
                    <Text className="text-sm text-gray-600">Top Contributors</Text>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <Text className="text-sm">Sarah Johnson</Text>
                        <Badge variant="outline" size="sm">12 verified</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <Text className="text-sm">Mike Chen</Text>
                        <Badge variant="outline" size="sm">8 verified</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <WildlifeHeatmap
            timeRange="7d"
            onCellClick={(cell) => {
              console.log('Map cell clicked:', cell)
            }}
          />
        )}
      </div>
      
      {/* Report Sighting Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report Wildlife Sighting"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Species *</label>
            <Select
              value={formData.speciesId}
              onChange={(e) => setFormData({ ...formData, speciesId: e.target.value })}
              className="w-full"
              required
            >
              <option value="">Select a species</option>
              {species.map(s => (
                <option key={s.id} value={s.id}>
                  {s.commonName} ({s.scientificName})
                </option>
              ))}
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Animals</label>
              <Input
                type="number"
                value={formData.count}
                onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Habitat Type</label>
              <Select
                value={formData.habitatType}
                onChange={(e) => setFormData({ ...formData, habitatType: e.target.value })}
                className="w-full"
              >
                <option value="">Select habitat</option>
                <option value="forest">Forest</option>
                <option value="grassland">Grassland</option>
                <option value="wetland">Wetland</option>
                <option value="mountain">Mountain</option>
                <option value="desert">Desert</option>
                <option value="coastal">Coastal</option>
                <option value="urban">Urban</option>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Location Name</label>
            <Input
              value={formData.locationName}
              onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              placeholder="e.g., Serengeti National Park"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Distance (meters)</label>
              <Input
                type="number"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                placeholder="Estimated distance"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="Observation time"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Describe the behavior, conditions, or any interesting observations..."
              rows={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Photos</label>
            <Card className="p-4 border-dashed">
              <div className="text-center">
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <Text className="text-sm text-gray-600">
                  Click to upload photos or drag and drop
                </Text>
              </div>
            </Card>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowReportModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleReportSighting}
              disabled={!formData.speciesId}
              className="flex-1"
            >
              Submit Sighting
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Verification Modal */}
      {selectedSighting && (
        <Modal
          isOpen={showVerificationModal}
          onClose={() => {
            setShowVerificationModal(false)
            setSelectedSighting(null)
          }}
          title="Verify Sighting"
          className="max-w-4xl"
        >
          <VerificationSystem
            sighting={selectedSighting}
            onVerificationComplete={(status) => {
              setShowVerificationModal(false)
              setSelectedSighting(null)
            }}
            showStats={false}
          />
        </Modal>
      )}
    </div>
  )
}