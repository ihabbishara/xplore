'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LocationSearchResult } from '@xplore/shared';

// Workaround for React version compatibility
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface MapContainerProps {
  className?: string;
  locations: LocationSearchResult[];
  selectedLocation?: LocationSearchResult | null;
  onMarkerClick?: (location: LocationSearchResult) => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  className = '',
  locations,
  selectedLocation,
  onMarkerClick
}) => {
  const [mapStyle, setMapStyle] = useState<'light' | 'dark' | 'satellite'>('light');
  const [zoomLevel, setZoomLevel] = useState(5);

  const handleMarkerClick = (location: LocationSearchResult) => {
    onMarkerClick?.(location);
  };

  // Create a Mapbox Static API URL
  const getMapboxStaticUrl = () => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    console.log('Mapbox token available:', !!token);
    console.log('Token:', token); // Debug log
    if (!token) {
      console.error('No Mapbox token found!');
      return null;
    }

    // Calculate center based on locations
    let centerLat = 48.8566; // Default Paris
    let centerLng = 2.3522;
    
    if (locations.length > 0) {
      centerLat = locations.reduce((sum, loc) => sum + loc.coordinates.lat, 0) / locations.length;
      centerLng = locations.reduce((sum, loc) => sum + loc.coordinates.lng, 0) / locations.length;
    }

    const style = mapStyle === 'satellite' ? 'satellite-v9' : mapStyle === 'dark' ? 'dark-v11' : 'light-v11';
    const width = 1280;
    const height = 720;

    // Create markers for locations
    let markersParam = '';
    if (locations.length > 0) {
      const markers = locations.slice(0, 50).map(loc => {
        const isSelected = selectedLocation?.id === loc.id;
        const color = isSelected ? 'f43f5e' : '3b82f6';
        const size = isSelected ? 'l' : 's';
        return `pin-${size}+${color}(${loc.coordinates.lng},${loc.coordinates.lat})`;
      }).join(',');
      markersParam = markers + '/';
    }

    const url = `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${markersParam}${centerLng},${centerLat},${zoomLevel}/${width}x${height}@2x?access_token=${token}`;
    console.log('Mapbox URL:', url);
    return url;
  };

  const mapUrl = getMapboxStaticUrl();

  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      {/* Fallback gradient background - only show if no map URL */}
      {!mapUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
          <div className="absolute inset-0 bg-[url('/map-pattern.svg')] opacity-10" />
        </div>
      )}

      {/* Static Map Image */}
      {mapUrl ? (
        <>
          <img
            src={mapUrl}
            alt="Location map"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              console.error('Failed to load Mapbox static map:', e);
              console.error('Image URL was:', mapUrl);
            }}
            onLoad={(e) => {
              console.log('Mapbox static map loaded successfully');
              console.log('Image dimensions:', (e.target as HTMLImageElement).naturalWidth, 'x', (e.target as HTMLImageElement).naturalHeight);
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <p>Loading map...</p>
        </div>
      )}

      {/* Overlay gradient for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none z-[1]" />

      {/* Interactive Markers Overlay */}
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
              onClick={() => handleMarkerClick(location)}
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
        <MotionButton
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setZoomLevel(prev => Math.min(prev + 1, 18))}
          className="block p-3 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300"
          title="Zoom In"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </MotionButton>
        <MotionButton
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setZoomLevel(prev => Math.max(prev - 1, 1))}
          className="block p-3 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300"
          title="Zoom Out"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </MotionButton>
      </MotionDiv>

      {/* Map Style Toggle */}
      <MotionDiv
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute bottom-4 left-4 z-20"
      >
        <div className="flex bg-white/90 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => setMapStyle('light')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              mapStyle === 'light'
                ? 'bg-primary-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Light
          </button>
          <button
            onClick={() => setMapStyle('dark')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              mapStyle === 'dark'
                ? 'bg-primary-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              mapStyle === 'satellite'
                ? 'bg-primary-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Satellite
          </button>
        </div>
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