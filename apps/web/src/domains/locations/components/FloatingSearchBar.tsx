'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useDebounce } from '@/hooks/useDebounce';
import { RootState, AppDispatch } from '@/store';
import { searchLocations, setSearchQuery } from '../store/locationSlice';
import { LocationSearchResult } from '@xplore/shared';

// Workaround for React version compatibility
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;
const MotionAnimatePresence = AnimatePresence as any;

interface FloatingSearchBarProps {
  onSearch?: (query: string, filters: string[]) => void; // Called when typing (for state updates)
  onSearchSubmit?: (query: string, filters: string[]) => void; // Called when user submits search
  onLocationSelect?: (location: LocationSearchResult) => void;
  className?: string;
}

const FILTER_OPTIONS = [
  { id: 'cities', label: 'Cities', icon: '🏙️' },
  { id: 'nature', label: 'Nature', icon: '🌲' },
  { id: 'beaches', label: 'Beaches', icon: '🏖️' },
  { id: 'mountains', label: 'Mountains', icon: '⛰️' },
  { id: 'historic', label: 'Historic', icon: '🏛️' },
  { id: 'culture', label: 'Culture', icon: '🎭' }
];

export const FloatingSearchBar: React.FC<FloatingSearchBarProps> = ({
  onSearch,
  onSearchSubmit,
  onLocationSelect,
  className = ''
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { searchQuery, searchResults, searchLoading, popularDestinations } = useSelector(
    (state: RootState) => state.locations
  );

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousQueryRef = useRef<string>('');

  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      dispatch(searchLocations({ query: debouncedQuery, filters: selectedFilters }));
    }
    // Only notify parent if query actually changed
    if (debouncedQuery !== previousQueryRef.current) {
      onSearch?.(debouncedQuery, selectedFilters);
      previousQueryRef.current = debouncedQuery;
    }
  }, [debouncedQuery, dispatch, selectedFilters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch(setSearchQuery(value));
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setIsExpanded(true);
    setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim().length >= 2) {
      dispatch(searchLocations({ query: searchQuery, filters: selectedFilters }));
      onSearchSubmit?.(searchQuery, selectedFilters);
      setShowSuggestions(false);
      setIsExpanded(false);
    }
  };

  const handleFilterToggle = (filterId: string) => {
    const newFilters = selectedFilters.includes(filterId)
      ? selectedFilters.filter(f => f !== filterId)
      : [...selectedFilters, filterId];
    
    setSelectedFilters(newFilters);
    onSearch?.(searchQuery, newFilters);
    
    // Trigger search if there's a query
    if (searchQuery.length >= 2) {
      dispatch(searchLocations({ query: searchQuery, filters: newFilters }));
    }
  };

  const handleLocationSelect = (location: LocationSearchResult) => {
    onLocationSelect?.(location);
    onSearchSubmit?.(searchQuery, selectedFilters); // Also trigger search submission
    setShowSuggestions(false);
    setIsExpanded(false);
    inputRef.current?.blur();
  };

  const displayResults = searchQuery.length >= 2 ? searchResults : popularDestinations.slice(0, 5);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <MotionDiv
        layout
        className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden"
        animate={{ 
          height: isExpanded ? 'auto' : '64px',
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Main Search Input */}
        <div className="relative p-2">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              placeholder="Search cities, regions, or places..."
              className="w-full px-4 py-3 pl-12 pr-16 text-gray-900 bg-transparent border-0 rounded-xl focus:outline-none focus:ring-0 placeholder-gray-500"
            />
            
            {/* Search Icon */}
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Loading Spinner */}
            {searchLoading && (
              <div className="absolute inset-y-0 right-12 flex items-center">
                <div className="w-5 h-5 border-t-2 border-primary-500 rounded-full animate-spin" />
              </div>
            )}

            {/* Filter Toggle Button */}
            <MotionButton
              onClick={() => setIsExpanded(!isExpanded)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute inset-y-0 right-2 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </MotionButton>
          </div>
        </div>

        {/* Expanded Content */}
        <MotionAnimatePresence>
          {isExpanded && (
            <MotionDiv
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-100"
            >
              {/* Filter Pills */}
              <div className="p-4 pt-3">
                <div className="flex flex-wrap gap-2">
                  {FILTER_OPTIONS.map((filter) => (
                    <MotionButton
                      key={filter.id}
                      onClick={() => handleFilterToggle(filter.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedFilters.includes(filter.id)
                          ? 'bg-primary-500 text-white shadow-md ring-2 ring-primary-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-sm'
                      }`}
                    >
                      <span className="mr-1">{filter.icon}</span>
                      {filter.label}
                    </MotionButton>
                  ))}
                </div>
              </div>
            </MotionDiv>
          )}
        </MotionAnimatePresence>
      </MotionDiv>

      {/* Search Suggestions Dropdown */}
      <MotionAnimatePresence>
        {showSuggestions && displayResults.length > 0 && (
          <MotionDiv
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="max-h-80 overflow-y-auto">
              {searchQuery.length < 2 && (
                <div className="px-4 py-3 text-sm font-medium text-gray-500 border-b border-gray-100">
                  Popular Destinations
                </div>
              )}
              
              {displayResults.map((location, index) => (
                <MotionButton
                  key={location.id}
                  onClick={() => handleLocationSelect(location)}
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {location.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {[location.region, location.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </MotionButton>
              ))}
            </div>
          </MotionDiv>
        )}
      </MotionAnimatePresence>
    </div>
  );
};