'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  MapPinIcon, 
  ClockIcon,
  AdjustmentsHorizontalIcon,
  LocationCrossHairsIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { usePoiStore } from '../hooks/usePoiStore';
import { useMapStore } from '../hooks/useMapStore';
import { POI, FilterOptions, POIType, DEFAULT_POI_LAYERS } from '../types/poi';

interface POISearchBarProps {
  onSearch?: (query: string, filters?: FilterOptions) => void;
  onResultSelect?: (poi: POI) => void;
  onFilterToggle?: () => void;
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
  showCurrentLocation?: boolean;
  autoFocus?: boolean;
  debounceMs?: number;
}

export const POISearchBar: React.FC<POISearchBarProps> = ({
  onSearch,
  onResultSelect,
  onFilterToggle,
  placeholder = 'Search for places, attractions, restaurants...',
  className = '',
  showFilters = true,
  showCurrentLocation = true,
  autoFocus = false,
  debounceMs = 300,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<POI[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const { activeFilters, searchPOIs } = usePoiStore();
  const { center, bounds } = useMapStore();

  // Auto-focus on mount if specified
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        performSearch(query);
      }, debounceMs);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, activeFilters, bounds]);

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchQuery: string) => {
    if (!bounds || !searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const searchParams = {
        bounds,
        types: activeFilters.types || Object.values(POIType),
        filters: activeFilters,
      };

      // Mock search results - in real implementation, this would call the API
      const mockResults: POI[] = [
        {
          id: '1',
          name: `${searchQuery} Restaurant`,
          type: POIType.RESTAURANT,
          coordinates: { lat: center.lat + 0.01, lng: center.lng + 0.01 },
          address: '123 Main St, City, State',
          rating: 4.5,
          reviewCount: 120,
          priceRange: 'mid-range',
          source: 'google',
          photos: ['/api/placeholder/300/200'],
          description: 'A great restaurant with amazing food and atmosphere.',
          amenities: ['WiFi', 'Parking', 'Outdoor Seating'],
          tags: ['Popular', 'Family-friendly'],
        },
        {
          id: '2',
          name: `${searchQuery} Attraction`,
          type: POIType.ATTRACTION,
          coordinates: { lat: center.lat - 0.01, lng: center.lng - 0.01 },
          address: '456 Tourist Ave, City, State',
          rating: 4.8,
          reviewCount: 350,
          source: 'custom',
          photos: ['/api/placeholder/300/200'],
          description: 'A must-visit attraction with rich history.',
          amenities: ['Guided Tours', 'Gift Shop', 'Accessibility'],
          tags: ['Historic', 'Educational'],
        },
      ];

      setSearchResults(mockResults);
      setShowResults(true);
      onSearch?.(searchQuery, activeFilters);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleResultSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultSelect = (poi: POI) => {
    setQuery(poi.name);
    setShowResults(false);
    setSelectedIndex(-1);
    onResultSelect?.(poi);
  };

  const handleClearSearch = () => {
    setQuery('');
    setSearchResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setQuery(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          // In real implementation, this would search near current location
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.types && activeFilters.types.length > 0) count++;
    if (activeFilters.minRating) count++;
    if (activeFilters.maxDistance) count++;
    if (activeFilters.priceRange && activeFilters.priceRange.length > 0) count++;
    if (activeFilters.amenities && activeFilters.amenities.length > 0) count++;
    if (activeFilters.openNow) count++;
    return count;
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) return `${(distance * 1000).toFixed(0)}m`;
    return `${distance.toFixed(1)}km`;
  };

  return (
    <div className={`relative ${className}`} ref={resultsRef}>
      <div className={`relative transition-all duration-200 ${
        isFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}>
        <div className="flex items-center bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Search Icon */}
          <div className="pl-4 pr-2">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              if (query.length >= 2) setShowResults(true);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="flex-1 py-3 px-2 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500"
          />

          {/* Loading spinner */}
          {isLoading && (
            <div className="px-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Clear button */}
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClearSearch}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            </motion.button>
          )}

          {/* Current Location button */}
          {showCurrentLocation && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCurrentLocation}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Use current location"
            >
              <LocationCrossHairsIcon className="w-4 h-4 text-gray-600" />
            </motion.button>
          )}

          {/* Filters button */}
          {showFilters && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onFilterToggle}
              className={`p-2 mr-2 rounded-lg transition-colors relative ${
                getActiveFiltersCount() > 0 
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Search filters"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              {getActiveFiltersCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                  {getActiveFiltersCount()}
                </span>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {showResults && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-2">
              <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100">
                Found {searchResults.length} results
              </div>
              
              {searchResults.map((poi, index) => {
                const layerConfig = DEFAULT_POI_LAYERS[poi.type];
                const isSelected = index === selectedIndex;
                
                return (
                  <motion.div
                    key={poi.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleResultSelect(poi)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* POI Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: layerConfig.color }}
                        >
                          {layerConfig.icon}
                        </div>
                      </div>

                      {/* POI Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {poi.name}
                          </h4>
                          
                          {poi.rating && (
                            <div className="flex items-center space-x-1 ml-2">
                              <StarIcon className="w-3 h-3 text-yellow-500" />
                              <span className="text-xs text-gray-600">
                                {poi.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {layerConfig.name}
                          </span>
                          
                          {poi.address && (
                            <>
                              <span className="text-xs text-gray-300">•</span>
                              <div className="flex items-center space-x-1">
                                <MapPinIcon className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500 truncate">
                                  {poi.address}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Additional Info */}
                        <div className="flex items-center space-x-3 mt-1">
                          {poi.priceRange && (
                            <span className="text-xs text-gray-500">
                              {poi.priceRange === 'budget' ? '$' : 
                               poi.priceRange === 'mid-range' ? '$$' : '$$$'}
                            </span>
                          )}
                          
                          {poi.openingHours && (
                            <div className="flex items-center space-x-1">
                              <ClockIcon className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-green-600">
                                Open now
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Results */}
      <AnimatePresence>
        {showResults && searchResults.length === 0 && query.length >= 2 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
          >
            <div className="p-6 text-center">
              <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                No results found
              </h3>
              <p className="text-xs text-gray-500">
                Try adjusting your search or filters
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};