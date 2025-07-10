'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClockIcon, 
  MapPinIcon, 
  StarIcon, 
  ChevronRightIcon,
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  HomeIcon,
  EyeIcon,
  EyeSlashIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { RouteAwarePOISuggestion, POI, DEFAULT_POI_LAYERS } from '../types/poi';
import { usePoiStore } from '../hooks/usePoiStore';

interface RouteAwarePOISuggestionsProps {
  routeId: string;
  isVisible?: boolean;
  onToggleVisibility?: (visible: boolean) => void;
  onSuggestionClick?: (suggestion: RouteAwarePOISuggestion) => void;
  onPOIClick?: (poi: POI) => void;
  className?: string;
  position?: 'left' | 'right' | 'bottom';
  maxSuggestions?: number;
}

export const RouteAwarePOISuggestions: React.FC<RouteAwarePOISuggestionsProps> = ({
  routeId,
  isVisible = true,
  onToggleVisibility,
  onSuggestionClick,
  onPOIClick,
  className = '',
  position = 'left',
  maxSuggestions = 5,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedSuggestionType, setSelectedSuggestionType] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(new Set([
    'timing', 'interest', 'practical', 'accommodation'
  ]));

  const { suggestions, fetchRouteAwareSuggestions, loading } = usePoiStore();

  // Fetch suggestions when component mounts or route changes
  useEffect(() => {
    if (routeId) {
      fetchRouteAwareSuggestions({ routeId });
    }
  }, [routeId, fetchRouteAwareSuggestions]);

  // Filter suggestions based on enabled types
  const filteredSuggestions = suggestions
    .filter(suggestion => enabledTypes.has(suggestion.type))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxSuggestions);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'timing':
        return <ClockIcon className="w-4 h-4" />;
      case 'interest':
        return <StarIcon className="w-4 h-4" />;
      case 'practical':
        return <InformationCircleIcon className="w-4 h-4" />;
      case 'accommodation':
        return <HomeIcon className="w-4 h-4" />;
      default:
        return <LightBulbIcon className="w-4 h-4" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'timing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'interest':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'practical':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'accommodation':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'timing':
        return 'Timing';
      case 'interest':
        return 'Interest';
      case 'practical':
        return 'Practical';
      case 'accommodation':
        return 'Stay';
      default:
        return 'Other';
    }
  };

  const formatDistance = (distanceInMeters: number) => {
    if (distanceInMeters < 1000) {
      return `${distanceInMeters}m`;
    }
    return `${(distanceInMeters / 1000).toFixed(1)}km`;
  };

  const formatDetourTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  };

  const toggleSuggestionType = (type: string) => {
    const newEnabledTypes = new Set(enabledTypes);
    if (newEnabledTypes.has(type)) {
      newEnabledTypes.delete(type);
    } else {
      newEnabledTypes.add(type);
    }
    setEnabledTypes(newEnabledTypes);
  };

  const positionClasses = {
    left: 'left-4 top-1/2 transform -translate-y-1/2',
    right: 'right-4 top-1/2 transform -translate-y-1/2',
    bottom: 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed z-30 ${positionClasses[position]} ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 max-w-sm w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
            <h3 className="text-sm font-medium text-gray-900">Route Suggestions</h3>
            {filteredSuggestions.length > 0 && (
              <span className="text-xs text-gray-500">
                ({filteredSuggestions.length})
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-gray-600" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              {isExpanded ? (
                <ChevronUpIcon className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-gray-600" />
              )}
            </motion.button>
            
            {onToggleVisibility && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggleVisibility(false)}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="w-4 h-4 text-gray-600" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-b border-gray-200 bg-gray-50 overflow-hidden"
            >
              <div className="p-3">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Suggestion Types</h4>
                
                <div className="space-y-2">
                  {['timing', 'interest', 'practical', 'accommodation'].map((type) => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={enabledTypes.has(type)}
                        onChange={() => toggleSuggestionType(type)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-1">
                        <span className={`p-1 rounded ${getSuggestionColor(type)}`}>
                          {getSuggestionIcon(type)}
                        </span>
                        <span className="text-xs text-gray-600">
                          {getSuggestionTypeLabel(type)}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Finding suggestions...</p>
                  </div>
                ) : filteredSuggestions.length === 0 ? (
                  <div className="p-6 text-center">
                    <LightBulbIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No suggestions for this route</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-3">
                    {filteredSuggestions.map((suggestion, index) => (
                      <motion.div
                        key={`${suggestion.type}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onSuggestionClick?.(suggestion)}
                      >
                        {/* Suggestion Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`p-1 rounded border ${getSuggestionColor(suggestion.type)}`}>
                              {getSuggestionIcon(suggestion.type)}
                            </span>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {suggestion.title}
                              </h4>
                              <p className="text-xs text-gray-600">
                                {getSuggestionTypeLabel(suggestion.type)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              {formatDistance(suggestion.distanceFromRoute)} away
                            </div>
                            {suggestion.detourTime && (
                              <div className="text-xs text-gray-500">
                                +{formatDetourTime(suggestion.detourTime)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-3">
                          {suggestion.description}
                        </p>

                        {/* Suggested Time */}
                        {suggestion.suggestedTime && (
                          <div className="flex items-center space-x-1 mb-3">
                            <ClockIcon className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              Suggested: {new Date(suggestion.suggestedTime).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        )}

                        {/* POI List */}
                        <div className="space-y-2">
                          {suggestion.pois.slice(0, 3).map((poi) => {
                            const layerConfig = DEFAULT_POI_LAYERS[poi.type];
                            
                            return (
                              <div
                                key={poi.id}
                                className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPOIClick?.(poi);
                                }}
                              >
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                                  style={{ backgroundColor: layerConfig.color }}
                                >
                                  {layerConfig.icon}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {poi.name}
                                  </div>
                                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    <span>{layerConfig.name}</span>
                                    {poi.rating && (
                                      <>
                                        <span>•</span>
                                        <div className="flex items-center space-x-1">
                                          <StarIcon className="w-3 h-3 text-yellow-500" />
                                          <span>{poi.rating.toFixed(1)}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                              </div>
                            );
                          })}
                          
                          {suggestion.pois.length > 3 && (
                            <div className="text-xs text-gray-500 text-center py-1">
                              +{suggestion.pois.length - 3} more locations
                            </div>
                          )}
                        </div>

                        {/* Priority Indicator */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">Priority:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full mr-1 ${
                                    i < suggestion.priority ? 'bg-blue-500' : 'bg-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};