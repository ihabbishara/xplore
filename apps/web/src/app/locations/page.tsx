'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/index';
import { fetchSavedLocations, fetchPopularDestinations, searchLocations } from '@/domains/locations/store/locationSlice';
import { LocationSearchResult } from '@xplore/shared';
import { FloatingSearchBar } from '@/domains/locations/components/FloatingSearchBar';
import { SimpleMapBackground } from '@/domains/locations/components/SimpleMapBackground';
import { BottomSheet } from '@/domains/locations/components/BottomSheet';
import { LocationCard } from '@/domains/locations/components/LocationCard';
import { WishlistSidebar } from '@/domains/locations/components/WishlistSidebar';

// Workaround for React version compatibility
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;
const MotionAnimatePresence = AnimatePresence as any;
const MotionH2 = motion.h2 as any;

export default function LocationsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const locationsState = useSelector((state: RootState) => state.locations);
  const { savedLocations = [], popularDestinations = [], searchQuery = '', searchResults = [] } = locationsState || {};
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  useEffect(() => {
    dispatch(fetchPopularDestinations());
    if (isAuthenticated) {
      dispatch(fetchSavedLocations());
    }
  }, [dispatch, isAuthenticated]);

  const handleSearch = useCallback((query: string, filters: string[]) => {
    setSelectedFilters(filters);
    // Don't automatically show bottom sheet - only when user explicitly searches
  }, []);

  const handleSearchSubmit = useCallback((query: string, filters: string[]) => {
    setSelectedFilters(filters);
    // Reset selected location to show search results grid
    setSelectedLocation(null);
    // Show bottom sheet when user explicitly searches
    if (query.length >= 2) {
      setShowBottomSheet(true);
    }
  }, []);

  const handleLocationSelect = (location: LocationSearchResult) => {
    // When user selects from dropdown, we want to show search results, not single location
    setSelectedLocation(null);
    setShowBottomSheet(true);
    // Also trigger a search to ensure we have results for the selected location
    dispatch(searchLocations({ query: location.name, filters: selectedFilters }));
  };

  const handleMapMarkerClick = (location: LocationSearchResult) => {
    setSelectedLocation(location);
    setShowBottomSheet(true);
  };

  const handleLocationDetailsView = (location: LocationSearchResult) => {
    setSelectedLocation(location);
    setShowBottomSheet(true);
  };

  return (
    <div className="relative h-screen overflow-hidden bg-gray-100">
      {/* Full-screen Map Background */}
      <SimpleMapBackground 
        className="absolute inset-0"
        locations={searchResults.length > 0 ? searchResults : popularDestinations}
        selectedLocation={selectedLocation}
        onMarkerClick={handleMapMarkerClick}
      />

      {/* Floating Search Bar */}
      <MotionDiv
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-4 left-4 right-4 z-20"
      >
        <FloatingSearchBar
          onSearch={handleSearch}
          onSearchSubmit={handleSearchSubmit}
          onLocationSelect={handleLocationSelect}
          className="max-w-2xl mx-auto"
        />
      </MotionDiv>

      {/* Wishlist Toggle Button */}
      {isAuthenticated && (
        <MotionDiv
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-20 right-4 z-20"
        >
          <MotionButton
            onClick={() => setShowWishlist(!showWishlist)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300"
          >
            <svg
              className={`w-6 h-6 transition-colors ${
                showWishlist ? 'text-red-500' : 'text-gray-600'
              }`}
              fill={showWishlist ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </MotionButton>
        </MotionDiv>
      )}


      {/* Wishlist Sidebar */}
      <MotionAnimatePresence>
        {showWishlist && isAuthenticated && (
          <WishlistSidebar
            savedLocations={savedLocations}
            onClose={() => setShowWishlist(false)}
            onLocationSelect={handleLocationSelect}
          />
        )}
      </MotionAnimatePresence>

      {/* Bottom Sheet - Results Panel */}
      <BottomSheet
        open={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        snapPoints={[0.2, 0.5, 0.9]}
        defaultSnap={0.5}
      >
        <div className="p-6">
          {selectedLocation ? (
            // Single location details
            <div>
              <MotionH2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-gray-900 mb-4"
              >
                {selectedLocation.name}
              </MotionH2>
              <div className="max-w-md">
                <LocationCard
                  location={selectedLocation}
                  isSaved={savedLocations.some(
                    (saved) => saved.location.placeId === selectedLocation.placeId
                  )}
                  enhanced={true}
                />
              </div>
            </div>
          ) : (
            // Search results grid
            <div>
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-6"
              >
                <h2 className="text-2xl font-bold text-gray-900">
                  {searchQuery ? `Results for "${searchQuery}"` : 'Popular Destinations'}
                </h2>
                <span className="text-sm text-gray-500">
                  {searchResults.length > 0 ? searchResults.length : popularDestinations.length} locations
                </span>
              </MotionDiv>

              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {(searchResults.length > 0 ? searchResults : popularDestinations).map((location, index) => (
                  <MotionDiv
                    key={location.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <LocationCard
                      location={location}
                      isSaved={savedLocations.some(
                        (saved) => saved.location.placeId === location.placeId
                      )}
                      enhanced={true}
                      onViewDetails={() => handleLocationDetailsView(location)}
                    />
                  </MotionDiv>
                ))}
              </MotionDiv>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Welcome overlay for non-authenticated users */}
      {!isAuthenticated && !searchQuery && (
        <MotionDiv
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute bottom-6 left-6 right-6 z-10"
        >
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Discover Amazing Places
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Search for destinations and create your wishlist to plan your next adventure.
            </p>
            <MotionButton
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              Start Exploring
            </MotionButton>
          </div>
        </MotionDiv>
      )}
    </div>
  );
}