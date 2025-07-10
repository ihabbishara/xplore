'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SavedLocation, LocationSearchResult } from '@xplore/shared';
import { LocationCard } from './LocationCard';

// Workaround for React version compatibility
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;
const MotionAnimatePresence = AnimatePresence as any;

interface WishlistSidebarProps {
  savedLocations: SavedLocation[];
  onClose: () => void;
  onLocationSelect: (location: LocationSearchResult) => void;
}

const WISHLIST_COLLECTIONS = [
  { id: 'all', name: 'All Saved', icon: '💫', count: 0 },
  { id: 'travel', name: 'Travel Plans', icon: '✈️', count: 0 },
  { id: 'living', name: 'Living Options', icon: '🏠', count: 0 },
  { id: 'favorites', name: 'Favorites', icon: '❤️', count: 0 },
  { id: 'visited', name: 'Visited', icon: '✅', count: 0 },
];

export const WishlistSidebar: React.FC<WishlistSidebarProps> = ({
  savedLocations,
  onClose,
  onLocationSelect
}) => {
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter locations based on selected collection and search
  const filteredLocations = savedLocations.filter(location => {
    const matchesSearch = !searchQuery || 
      location.location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.location.country.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedCollection === 'all') return matchesSearch;
    if (selectedCollection === 'favorites') return location.isFavorite && matchesSearch;
    if (selectedCollection === 'visited') return false && matchesSearch; // Placeholder - visitStatus doesn't exist yet
    // For travel and living, you could filter by custom tags
    return matchesSearch;
  });

  // Update collection counts
  const collectionsWithCounts = WISHLIST_COLLECTIONS.map(collection => ({
    ...collection,
    count: collection.id === 'all' 
      ? savedLocations.length
      : collection.id === 'favorites'
      ? savedLocations.filter(l => l.isFavorite).length
      : collection.id === 'visited'
      ? 0 // Placeholder - visitStatus doesn't exist yet
      : savedLocations.length // placeholder for travel/living
  }));

  return (
    <MotionDiv
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">My Wishlist</h2>
          <MotionButton
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </MotionButton>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your saved places..."
            className="w-full px-4 py-2 pl-10 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <svg 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Collections */}
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-1">
          {collectionsWithCounts.map((collection) => (
            <MotionButton
              key={collection.id}
              onClick={() => setSelectedCollection(collection.id)}
              whileHover={{ x: 4 }}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                selectedCollection === collection.id
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{collection.icon}</span>
                <span className="font-medium">{collection.name}</span>
              </div>
              <span className={`text-sm px-2 py-1 rounded-full ${
                selectedCollection === collection.id
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {collection.count}
              </span>
            </MotionButton>
          ))}
        </div>
      </div>

      {/* Locations List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredLocations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No matching locations' : 'No saved locations yet'}
            </h3>
            <p className="text-gray-500 text-sm">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Start exploring and save places you love!'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <MotionAnimatePresence>
              {filteredLocations.map((savedLocation, index) => (
                <MotionDiv
                  key={savedLocation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer"
                  onClick={() => onLocationSelect(savedLocation.location)}
                >
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    {/* Location Image Placeholder */}
                    <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-200 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      
                      {/* Favorite Badge */}
                      {savedLocation.isFavorite && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Location Info */}
                    <div className="p-3">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                        {savedLocation.location.name}
                      </h4>
                      <p className="text-xs text-gray-500 mb-2 truncate">
                        {[savedLocation.location.city, savedLocation.location.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      
                      {/* Tags */}
                      {savedLocation.customTags && savedLocation.customTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {savedLocation.customTags.slice(0, 2).map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {savedLocation.customTags.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{savedLocation.customTags.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Saved Date */}
                      <p className="text-xs text-gray-400">
                        Saved {new Date(savedLocation.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </MotionDiv>
              ))}
            </MotionAnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <MotionButton
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          Share Wishlist
        </MotionButton>
      </div>
    </MotionDiv>
  );
};