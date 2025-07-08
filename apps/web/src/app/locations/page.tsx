'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { LocationSearchBar } from '@/domains/locations/components/LocationSearchBar';
import { LocationCard } from '@/domains/locations/components/LocationCard';
import { fetchSavedLocations, fetchPopularDestinations } from '@/domains/locations/store/locationSlice';
import { LocationSearchResult } from '@xplore/shared';

export default function LocationsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { savedLocations, savedLocationsLoading, popularDestinations } = useSelector(
    (state: RootState) => state.locations
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);

  useEffect(() => {
    // Fetch popular destinations
    dispatch(fetchPopularDestinations());
    
    // Fetch saved locations if authenticated
    if (isAuthenticated) {
      dispatch(fetchSavedLocations());
    }
  }, [dispatch, isAuthenticated]);

  const handleLocationSelect = (location: LocationSearchResult) => {
    setSelectedLocation(location);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Your Next Destination
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Search and save locations for your future adventures
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl">
            <LocationSearchBar
              onLocationSelect={handleLocationSelect}
              showPopular={true}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Selected Location Preview */}
        {selectedLocation && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Selected Location
            </h2>
            <div className="max-w-sm">
              <LocationCard
                location={selectedLocation}
                isSaved={savedLocations.some(
                  (saved) => saved.location.placeId === selectedLocation.placeId
                )}
              />
            </div>
          </div>
        )}

        {/* Saved Locations */}
        {isAuthenticated && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Your Saved Locations
            </h2>
            
            {savedLocationsLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-t-2 border-primary-500 rounded-full animate-spin" />
              </div>
            ) : savedLocations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No saved locations</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Search for locations and save them to your wishlist.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {savedLocations.map((savedLocation) => (
                  <LocationCard
                    key={savedLocation.id}
                    location={savedLocation}
                    isSaved={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Popular Destinations */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Popular Destinations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {popularDestinations.map((destination) => (
              <LocationCard
                key={destination.id}
                location={destination}
                isSaved={savedLocations.some(
                  (saved) => saved.location.placeId === destination.placeId
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}