'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { LocationSearchResult } from '@xplore/shared';
import { RootState } from '@/store/index';
import { 
  searchLocations, 
  setSearchQuery, 
  clearSearchResults,
  fetchPopularDestinations 
} from '@/domains/locations/store/locationSlice';

// Workaround for React version compatibility
const MotionDiv = motion.div as any;

interface FloatingDestinationSearchProps {
  onLocationSelect: (location: LocationSearchResult) => void;
  placeholder?: string;
  className?: string;
}

export const FloatingDestinationSearch: React.FC<FloatingDestinationSearchProps> = ({
  onLocationSelect,
  placeholder = "Search destinations to add to your trip...",
  className = ''
}) => {
  const dispatch = useDispatch();
  const { searchResults, searchQuery, searchLoading, popularDestinations } = useSelector(
    (state: RootState) => state.locations
  );
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch popular destinations on mount
  useEffect(() => {
    dispatch(fetchPopularDestinations() as any);
  }, [dispatch]);

  // Handle search with debouncing
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (inputValue.trim()) {
        dispatch(setSearchQuery(inputValue) as any);
        dispatch(searchLocations({ query: inputValue }) as any);
      } else {
        dispatch(clearSearchResults() as any);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputValue, dispatch]);

  // Get displayed results (search results or popular destinations)
  const displayedResults = inputValue.trim() 
    ? searchResults 
    : popularDestinations.slice(0, 8);

  // Handle input focus
  const handleFocus = () => {
    setIsExpanded(true);
    setShowResults(true);
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay closing to allow for clicks on results
    setTimeout(() => {
      setIsExpanded(false);
      setShowResults(false);
      setSelectedIndex(-1);
    }, 200);
  };

  // Handle location selection
  const handleLocationSelect = (location: LocationSearchResult) => {
    onLocationSelect(location);
    setInputValue('');
    setShowResults(false);
    setIsExpanded(false);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < displayedResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < displayedResults.length) {
          handleLocationSelect(displayedResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setIsExpanded(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex]);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <MotionDiv
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative"
      >
        <div className={`bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl transition-all duration-300 ${
          isExpanded ? 'ring-2 ring-primary-200' : ''
        }`}>
          <div className="flex items-center p-4">
            <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
            
            {searchLoading && (
              <div className="ml-2 flex-shrink-0">
                <svg className="animate-spin h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
        </div>
      </MotionDiv>

      {/* Search Results */}
      <AnimatePresence>
        {showResults && displayedResults.length > 0 && (
          <MotionDiv
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2"
          >
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200 max-h-80 overflow-y-auto">
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-900">
                  {inputValue.trim() ? 'Search Results' : 'Popular Destinations'}
                </h3>
              </div>

              {/* Results List */}
              <div ref={resultsRef} className="py-2">
                {displayedResults.map((location, index) => (
                  <div
                    key={location.id}
                    onClick={() => handleLocationSelect(location)}
                    className={`px-4 py-3 cursor-pointer transition-all duration-150 hover:bg-gray-50 ${
                      index === selectedIndex ? 'bg-primary-50 border-r-2 border-primary-500' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      {/* Location Icon */}
                      <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      
                      {/* Location Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {location.name}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {location.city && location.city !== location.name ? `${location.city}, ` : ''}
                          {location.country}
                        </p>
                      </div>
                      
                      {/* Location Type Badge */}
                      <div className="flex-shrink-0 ml-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          location.type === 'city' ? 'bg-blue-100 text-blue-800' :
                          location.type === 'region' ? 'bg-green-100 text-green-800' :
                          location.type === 'poi' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {location.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {inputValue.trim() && searchResults.length === 0 && !searchLoading && (
                <div className="p-8 text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No destinations found</h3>
                  <p className="text-xs text-gray-500">Try searching for a different location</p>
                </div>
              )}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};