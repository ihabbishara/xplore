'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  FunnelIcon, 
  StarIcon, 
  MapPinIcon, 
  ClockIcon,
  CurrencyDollarIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { usePoiStore } from '../hooks/usePoiStore';
import { FilterOptions, POIType, DEFAULT_POI_LAYERS } from '../types/poi';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  className?: string;
  position?: 'left' | 'right' | 'center';
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  className = '',
  position = 'right',
}) => {
  const { activeFilters, setActiveFilters, clearFilters } = usePoiStore();
  
  const [localFilters, setLocalFilters] = useState<FilterOptions>(activeFilters);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    types: true,
    rating: true,
    distance: true,
    price: true,
    amenities: false,
    hours: false,
  });

  // Common amenities list
  const commonAmenities = [
    'WiFi', 'Parking', 'Wheelchair Accessible', 'Pet Friendly', 'Outdoor Seating',
    'Air Conditioning', 'Takeout', 'Delivery', 'Reservations', 'Credit Cards',
    'Restrooms', 'Family Friendly', 'Groups', 'Quiet', 'Trendy', 'Casual',
    'Upscale', 'Romantic', 'Business', 'Solo Dining', 'Live Music', 'TV',
    'Happy Hour', 'Brunch', 'Breakfast', 'Lunch', 'Dinner', 'Late Night',
  ];

  const priceRanges = [
    { value: 'budget', label: 'Budget', symbol: '$' },
    { value: 'mid-range', label: 'Mid-range', symbol: '$$' },
    { value: 'premium', label: 'Premium', symbol: '$$$' },
  ];

  // Update local filters when active filters change
  useEffect(() => {
    setLocalFilters(activeFilters);
  }, [activeFilters]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleTypeToggle = (type: POIType) => {
    const currentTypes = localFilters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    setLocalFilters(prev => ({
      ...prev,
      types: newTypes,
    }));
  };

  const handleRatingChange = (rating: number) => {
    setLocalFilters(prev => ({
      ...prev,
      minRating: prev.minRating === rating ? undefined : rating,
    }));
  };

  const handleDistanceChange = (distance: number) => {
    setLocalFilters(prev => ({
      ...prev,
      maxDistance: prev.maxDistance === distance ? undefined : distance,
    }));
  };

  const handlePriceRangeToggle = (range: 'budget' | 'mid-range' | 'premium') => {
    const currentRanges = localFilters.priceRange || [];
    const newRanges = currentRanges.includes(range)
      ? currentRanges.filter(r => r !== range)
      : [...currentRanges, range];
    
    setLocalFilters(prev => ({
      ...prev,
      priceRange: newRanges,
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = localFilters.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    
    setLocalFilters(prev => ({
      ...prev,
      amenities: newAmenities,
    }));
  };

  const handleOpenNowToggle = () => {
    setLocalFilters(prev => ({
      ...prev,
      openNow: !prev.openNow,
    }));
  };

  const handleApplyFilters = () => {
    setActiveFilters(localFilters);
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClearFilters = () => {
    const emptyFilters: FilterOptions = {};
    setLocalFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    clearFilters();
    onApplyFilters(emptyFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.types && localFilters.types.length > 0) count++;
    if (localFilters.minRating) count++;
    if (localFilters.maxDistance) count++;
    if (localFilters.priceRange && localFilters.priceRange.length > 0) count++;
    if (localFilters.amenities && localFilters.amenities.length > 0) count++;
    if (localFilters.openNow) count++;
    return count;
  };

  const positionClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 transform -translate-x-1/2',
  };

  const sortedPOITypes = Object.entries(DEFAULT_POI_LAYERS)
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([type]) => type as POIType);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Filter Panel */}
          <motion.div
            initial={{ opacity: 0, x: position === 'left' ? -100 : position === 'right' ? 100 : 0, y: position === 'center' ? -20 : 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: position === 'left' ? -100 : position === 'right' ? 100 : 0, y: position === 'center' ? -20 : 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`fixed top-4 bottom-4 ${positionClasses[position]} w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col ${className}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                {getActiveFiltersCount() > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* POI Types */}
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('types')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-sm font-medium text-gray-900">POI Types</h3>
                  {expandedSections.types ? (
                    <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                <AnimatePresence>
                  {expandedSections.types && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {sortedPOITypes.map((type) => {
                        const config = DEFAULT_POI_LAYERS[type];
                        const isSelected = localFilters.types?.includes(type);
                        
                        return (
                          <motion.label
                            key={type}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: config.priority * 0.02 }}
                            className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleTypeToggle(type)}
                              className="sr-only"
                            />
                            
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: config.color }}
                              />
                              <span className="text-sm">{config.icon}</span>
                            </div>
                            
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {config.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {config.description}
                              </div>
                            </div>
                            
                            {isSelected && (
                              <CheckIcon className="w-4 h-4 text-blue-600" />
                            )}
                          </motion.label>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Minimum Rating */}
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('rating')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-sm font-medium text-gray-900">Minimum Rating</h3>
                  {expandedSections.rating ? (
                    <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                <AnimatePresence>
                  {expandedSections.rating && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {[4, 3, 2, 1].map((rating) => (
                        <motion.button
                          key={rating}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: (5 - rating) * 0.05 }}
                          onClick={() => handleRatingChange(rating)}
                          className={`flex items-center space-x-2 p-2 rounded-lg transition-colors w-full ${
                            localFilters.minRating === rating
                              ? 'bg-yellow-50 border border-yellow-200'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`w-4 h-4 ${
                                  i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-700">
                            {rating}+ stars
                          </span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Distance */}
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('distance')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-sm font-medium text-gray-900">Distance</h3>
                  {expandedSections.distance ? (
                    <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                <AnimatePresence>
                  {expandedSections.distance && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {[1, 5, 10, 25, 50].map((distance) => (
                        <motion.button
                          key={distance}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: distance * 0.01 }}
                          onClick={() => handleDistanceChange(distance)}
                          className={`flex items-center space-x-2 p-2 rounded-lg transition-colors w-full ${
                            localFilters.maxDistance === distance
                              ? 'bg-green-50 border border-green-200'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <MapPinIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            Within {distance}km
                          </span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('price')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-sm font-medium text-gray-900">Price Range</h3>
                  {expandedSections.price ? (
                    <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                <AnimatePresence>
                  {expandedSections.price && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {priceRanges.map((range, index) => {
                        const isSelected = localFilters.priceRange?.includes(range.value as any);
                        
                        return (
                          <motion.button
                            key={range.value}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            onClick={() => handlePriceRangeToggle(range.value as any)}
                            className={`flex items-center space-x-2 p-2 rounded-lg transition-colors w-full ${
                              isSelected
                                ? 'bg-green-50 border border-green-200'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">
                              {range.label} ({range.symbol})
                            </span>
                            {isSelected && (
                              <CheckIcon className="w-4 h-4 text-green-600 ml-auto" />
                            )}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Opening Hours */}
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('hours')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-sm font-medium text-gray-900">Opening Hours</h3>
                  {expandedSections.hours ? (
                    <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                <AnimatePresence>
                  {expandedSections.hours && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleOpenNowToggle}
                        className={`flex items-center space-x-2 p-2 rounded-lg transition-colors w-full ${
                          localFilters.openNow
                            ? 'bg-green-50 border border-green-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <ClockIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">
                          Open now
                        </span>
                        {localFilters.openNow && (
                          <CheckIcon className="w-4 h-4 text-green-600 ml-auto" />
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Amenities */}
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('amenities')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-sm font-medium text-gray-900">Amenities</h3>
                  {expandedSections.amenities ? (
                    <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                <AnimatePresence>
                  {expandedSections.amenities && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 overflow-hidden max-h-60 overflow-y-auto"
                    >
                      {commonAmenities.map((amenity, index) => {
                        const isSelected = localFilters.amenities?.includes(amenity);
                        
                        return (
                          <motion.button
                            key={amenity}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.02 }}
                            onClick={() => handleAmenityToggle(amenity)}
                            className={`flex items-center justify-between p-2 rounded-lg transition-colors w-full ${
                              isSelected
                                ? 'bg-blue-50 border border-blue-200'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-sm text-gray-700">
                              {amenity}
                            </span>
                            {isSelected && (
                              <CheckIcon className="w-4 h-4 text-blue-600" />
                            )}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleApplyFilters}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Apply Filters
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Clear All
                </motion.button>
              </div>
              
              {getActiveFiltersCount() > 0 && (
                <div className="text-xs text-gray-500 text-center">
                  {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} active
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};