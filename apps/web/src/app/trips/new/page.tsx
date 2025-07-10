'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LocationSearchResult } from '@xplore/shared';
import { Timeline, TripDay } from '@/domains/trips/components/Timeline';
import { TripHeader, Trip } from '@/domains/trips/components/TripHeader';
import { TripSummary } from '@/domains/trips/components/TripSummary';
import { TripMap } from '@/domains/trips/components/TripMap';
import { FloatingDestinationSearch } from '@/domains/trips/components/FloatingDestinationSearch';
import { DraggableDestinationList } from '@/domains/trips/components/DraggableDestinationList';
import { WeatherTimeline } from '@/domains/trips/components/WeatherTimeline';

// Workaround for React version compatibility
const MotionDiv = motion.div as any;

// Mock data for initial development
const mockTrip = {
  id: '1',
  title: 'European Adventure',
  startDate: new Date('2024-08-15'),
  endDate: new Date('2024-08-22'),
  destinations: [
    {
      id: '1',
      name: 'Paris',
      coordinates: { lat: 48.8566, lng: 2.3522 },
      country: 'France',
      placeId: 'paris-france',
      type: 'city' as const,
      description: 'City of Light',
      imageUrl: ''
    },
    {
      id: '2', 
      name: 'Amsterdam',
      coordinates: { lat: 52.3676, lng: 4.9041 },
      country: 'Netherlands',
      placeId: 'amsterdam-netherlands',
      type: 'city' as const,
      description: 'Venice of the North',
      imageUrl: ''
    }
  ]
};

const mockDays: TripDay[] = [
  { id: '1', date: new Date('2024-08-15'), destinations: ['1'], activities: ['Eiffel Tower', 'Louvre Museum'] },
  { id: '2', date: new Date('2024-08-16'), destinations: ['1'], activities: ['Notre Dame', 'Seine River Cruise'] },
  { id: '3', date: new Date('2024-08-17'), destinations: ['1'], activities: ['Montmartre', 'Sacré-Cœur'] },
  { id: '4', date: new Date('2024-08-18'), destinations: ['1', '2'], activities: ['Travel to Amsterdam'] },
  { id: '5', date: new Date('2024-08-19'), destinations: ['2'], activities: ['Canal Tour', 'Van Gogh Museum'] },
  { id: '6', date: new Date('2024-08-20'), destinations: ['2'], activities: ['Rijksmuseum', 'Vondelpark'] },
  { id: '7', date: new Date('2024-08-21'), destinations: ['2'], activities: ['Anne Frank House', 'Jordaan District'] },
  { id: '8', date: new Date('2024-08-22'), destinations: ['2'], activities: ['Departure'] }
];

interface TripPlanningPageProps {}

export default function TripPlanningPage({}: TripPlanningPageProps) {
  const [currentTrip, setCurrentTrip] = useState(mockTrip);
  const [tripDays, setTripDays] = useState(mockDays);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<LocationSearchResult | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'weather'>('timeline');

  const handleDayClick = useCallback((dayId: string) => {
    setSelectedDay(dayId);
  }, []);

  const handleAddDay = useCallback(() => {
    const lastDay = tripDays[tripDays.length - 1];
    const newDate = new Date(lastDay.date);
    newDate.setDate(newDate.getDate() + 1);
    
    const newDay = {
      id: Date.now().toString(),
      date: newDate,
      destinations: [],
      activities: []
    };
    
    setTripDays([...tripDays, newDay]);
  }, [tripDays]);

  const handleMarkerClick = useCallback((location: LocationSearchResult) => {
    setSelectedDestination(location);
  }, []);

  const handleAddDestination = useCallback((location: LocationSearchResult) => {
    // Check if destination already exists
    const exists = currentTrip.destinations.some(dest => dest.id === location.id);
    if (!exists) {
      setCurrentTrip(prev => ({
        ...prev,
        destinations: [...prev.destinations, location]
      }));
    }
  }, [currentTrip.destinations]);

  const handleDestinationReorder = useCallback((reorderedDestinations: LocationSearchResult[]) => {
    setCurrentTrip(prev => ({
      ...prev,
      destinations: reorderedDestinations
    }));
  }, []);

  const handleRemoveDestination = useCallback((destination: LocationSearchResult) => {
    setCurrentTrip(prev => ({
      ...prev,
      destinations: prev.destinations.filter(dest => dest.id !== destination.id)
    }));
  }, []);

  const handleMarkerDrag = useCallback((location: LocationSearchResult, newPosition: { lat: number; lng: number }) => {
    setCurrentTrip(prev => ({
      ...prev,
      destinations: prev.destinations.map(dest => 
        dest.id === location.id 
          ? { ...dest, coordinates: newPosition }
          : dest
      )
    }));
  }, []);

  const handleAddActivity = useCallback((dayId: string, activity: string) => {
    setTripDays(prev => prev.map(day => 
      day.id === dayId 
        ? { ...day, activities: [...day.activities, activity] }
        : day
    ));
  }, []);

  const handleRemoveActivity = useCallback((dayId: string, activityIndex: number) => {
    setTripDays(prev => prev.map(day => 
      day.id === dayId 
        ? { ...day, activities: day.activities.filter((_, index) => index !== activityIndex) }
        : day
    ));
  }, []);

  const handleTripUpdate = useCallback((updatedTrip: Trip) => {
    setCurrentTrip(updatedTrip);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDayDuration = () => {
    if (!currentTrip.startDate || !currentTrip.endDate) return 0;
    const diffTime = Math.abs(currentTrip.endDate.getTime() - currentTrip.startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const totalDistance = 1200; // Mock data
  const estimatedBudget = 3500; // Mock data

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Panel - Timeline */}
      <div className="w-96 bg-white shadow-xl z-10 flex flex-col">
        <TripHeader trip={currentTrip} onTripUpdate={handleTripUpdate} />
        
        {/* Destinations Section */}
        <div className="border-b border-gray-200">
          <div className="p-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Destinations ({currentTrip.destinations.length})</h3>
            <DraggableDestinationList
              destinations={currentTrip.destinations}
              selectedDestination={selectedDestination}
              onDestinationClick={handleMarkerClick}
              onDestinationReorder={handleDestinationReorder}
              onRemoveDestination={handleRemoveDestination}
            />
          </div>
        </div>
        
        {/* Timeline Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'timeline'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('weather')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'weather'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Weather
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'timeline' && (
            <Timeline
              days={tripDays}
              selectedDay={selectedDay}
              onDayClick={handleDayClick}
              onAddDay={handleAddDay}
              onAddActivity={handleAddActivity}
              onRemoveActivity={handleRemoveActivity}
            />
          )}
          
          {activeTab === 'weather' && (
            <WeatherTimeline
              destinations={currentTrip.destinations}
              tripDays={tripDays}
              selectedDay={selectedDay}
              onDayClick={handleDayClick}
            />
          )}
        </div>
        
        <TripSummary
          duration={getDayDuration()}
          distance={totalDistance}
          budget={estimatedBudget}
        />
      </div>

      {/* Right Panel - Interactive Map */}
      <div className="flex-1 relative">
        <TripMap 
          className="absolute inset-0"
          destinations={currentTrip.destinations}
          selectedDestination={selectedDestination}
          onMarkerClick={handleMarkerClick}
          onMarkerDrag={handleMarkerDrag}
          showRoutes={true}
        />

        {/* Floating Controls */}
        <MotionDiv
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute top-4 right-4 z-20"
        >
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-2 shadow-xl">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </MotionDiv>

        {/* Destination Search */}
        <FloatingDestinationSearch
          onLocationSelect={handleAddDestination}
          placeholder="Search destinations to add to your trip..."
          className="absolute top-4 left-4 right-20 z-20"
        />

      </div>
    </div>
  );
}