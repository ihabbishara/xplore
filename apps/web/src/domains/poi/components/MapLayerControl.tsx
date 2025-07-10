'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, Cog6ToothIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useMapStore } from '../hooks/useMapStore';
import { POIType, DEFAULT_POI_LAYERS } from '../types/poi';

interface MapLayerControlProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  isCollapsed?: boolean;
  showLayerCount?: boolean;
  onLayerToggle?: (type: POIType, enabled: boolean) => void;
}

export const MapLayerControl: React.FC<MapLayerControlProps> = ({
  className = '',
  position = 'top-right',
  isCollapsed = false,
  showLayerCount = true,
  onLayerToggle,
}) => {
  const {
    activeLayers,
    layerConfigs,
    zoom,
    toggleLayer,
    enableLayer,
    disableLayer,
    setActiveLayers,
    updateLayerConfig,
    enableAllLayers,
    disableAllLayers,
    resetToDefaults,
  } = useMapStore();

  const [isExpanded, setIsExpanded] = useState(!isCollapsed);
  const [showSettings, setShowSettings] = useState(false);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const handleLayerToggle = (type: POIType) => {
    const isEnabled = activeLayers.includes(type);
    toggleLayer(type);
    onLayerToggle?.(type, !isEnabled);
  };

  const getVisibleLayersCount = () => {
    return activeLayers.filter(type => {
      const config = layerConfigs[type];
      return config.zoomThreshold ? zoom >= config.zoomThreshold : true;
    }).length;
  };

  const isLayerVisible = (type: POIType) => {
    const config = layerConfigs[type];
    return config.zoomThreshold ? zoom >= config.zoomThreshold : true;
  };

  const sortedLayers = Object.entries(layerConfigs)
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([type]) => type as POIType);

  return (
    <div className={`absolute z-30 ${positionClasses[position]} ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 min-w-[280px] max-w-[320px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
            <h3 className="text-sm font-medium text-gray-900">Map Layers</h3>
            {showLayerCount && (
              <span className="text-xs text-gray-500">
                ({getVisibleLayersCount()}/{Object.keys(layerConfigs).length})
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
              <Cog6ToothIcon className="w-4 h-4 text-gray-600" />
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
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Quick Actions */}
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={enableAllLayers}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    Show All
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={disableAllLayers}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Hide All
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetToDefaults}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-md hover:bg-purple-50 transition-colors"
                  >
                    Reset
                  </motion.button>
                </div>
              </div>

              {/* Layer List */}
              <div className="max-h-96 overflow-y-auto">
                <div className="p-2 space-y-1">
                  {sortedLayers.map((type) => {
                    const config = layerConfigs[type];
                    const isActive = activeLayers.includes(type);
                    const isVisible = isLayerVisible(type);
                    
                    return (
                      <motion.div
                        key={type}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: config.priority * 0.02 }}
                        className={`group relative ${!isVisible ? 'opacity-50' : ''}`}
                      >
                        <div
                          className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                          onClick={() => handleLayerToggle(type)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: config.color }}
                              />
                              <span className="text-lg">{config.icon}</span>
                            </div>
                            
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {config.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {config.description}
                              </div>
                              {config.zoomThreshold && (
                                <div className="text-xs text-gray-400">
                                  Zoom {config.zoomThreshold}+ {!isVisible && '(hidden)'}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`p-1 rounded-md transition-colors ${
                              isActive
                                ? 'text-blue-600 hover:bg-blue-100'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLayerToggle(type);
                            }}
                          >
                            {isActive ? (
                              <EyeIcon className="w-4 h-4" />
                            ) : (
                              <EyeSlashIcon className="w-4 h-4" />
                            )}
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-200 bg-gray-50 overflow-hidden"
            >
              <div className="p-3">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Display Settings</h4>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showLayerCount}
                      onChange={(e) => {
                        // This would be handled by parent component
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-600">Show layer count</span>
                  </label>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Current zoom:</span>
                    <span className="text-xs font-medium text-gray-900">{zoom.toFixed(1)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Visible layers:</span>
                    <span className="text-xs font-medium text-gray-900">{getVisibleLayersCount()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};