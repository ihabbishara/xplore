'use client';

import React from 'react';
import { LocationSearchResult } from '@xplore/shared';
import { motion } from 'framer-motion';

// Workaround for React version compatibility
const MotionDiv = motion.div as any;

interface SimpleMapBackgroundProps {
  className?: string;
  locations: LocationSearchResult[];
  selectedLocation?: LocationSearchResult | null;
  onMarkerClick?: (location: LocationSearchResult) => void;
}

export const SimpleMapBackground: React.FC<SimpleMapBackgroundProps> = ({
  className = '',
  locations,
  selectedLocation,
  onMarkerClick
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* World map background using a gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-blue-50 to-blue-100">
        {/* Add a subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="currentColor" className="text-blue-900" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>
      </div>

      {/* Simple world map SVG */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <img 
          src="https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json" 
          alt="World Map"
          className="max-w-full max-h-full opacity-20"
          onError={(e) => {
            // Fallback to a simple div if image fails
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      {/* Location markers positioned on map */}
      <div className="absolute inset-0">
        {locations.map((location, index) => {
          // Simple positioning based on normalized coordinates
          const left = ((location.coordinates.lng + 180) / 360) * 100;
          const top = ((90 - location.coordinates.lat) / 180) * 100;
          
          return (
            <MotionDiv
              key={location.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.05,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
              style={{
                left: `${left}%`,
                top: `${top}%`,
              }}
              whileHover={{ scale: 1.1, zIndex: 20 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onMarkerClick?.(location)}
            >
              {/* Marker Pulse Effect */}
              <div className="absolute inset-0 rounded-full bg-primary-400 animate-ping opacity-75" />
              
              {/* Main Marker */}
              <div
                className={`relative w-10 h-10 rounded-full shadow-lg transition-all duration-300 ${
                  selectedLocation?.id === location.id
                    ? 'bg-gradient-to-br from-red-400 to-red-600 ring-4 ring-red-200'
                    : 'bg-gradient-to-br from-primary-400 to-primary-600 hover:from-primary-500 hover:to-primary-700'
                }`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>

              {/* Location Name Tooltip */}
              <MotionDiv
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                whileHover={{ opacity: 1, y: -10, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none"
              >
                <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                  {location.name}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                </div>
              </MotionDiv>
            </MotionDiv>
          );
        })}
      </div>

      {/* Map Controls */}
      <MotionDiv
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="absolute bottom-24 right-4 z-20 space-y-2"
      >
        <p className="text-xs text-gray-500 text-right mr-2">Map view</p>
      </MotionDiv>

      {/* Location Counter */}
      {locations.length > 0 && (
        <MotionDiv
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="absolute top-4 left-4 z-20"
        >
          <div className="bg-white/90 backdrop-blur-lg rounded-lg px-3 py-2 shadow-lg">
            <span className="text-sm font-medium text-gray-900">
              {locations.length} location{locations.length !== 1 ? 's' : ''}
            </span>
          </div>
        </MotionDiv>
      )}
    </div>
  );
};