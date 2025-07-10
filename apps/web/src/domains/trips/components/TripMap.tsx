'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LocationSearchResult } from '@xplore/shared';

// Workaround for React version compatibility
const MotionDiv = motion.div as any;

interface TripMapProps {
  className?: string;
  destinations: LocationSearchResult[];
  selectedDestination?: LocationSearchResult | null;
  onMarkerClick?: (location: LocationSearchResult) => void;
  onMarkerDrag?: (location: LocationSearchResult, newPosition: { lat: number; lng: number }) => void;
  showRoutes?: boolean;
  routeColor?: string;
}

export const TripMap: React.FC<TripMapProps> = ({
  className = '',
  destinations,
  selectedDestination,
  onMarkerClick,
  onMarkerDrag,
  showRoutes = true,
  routeColor = '#3b82f6'
}) => {
  const [draggingMarker, setDraggingMarker] = useState<string | null>(null);

  const handleMarkerClick = (location: LocationSearchResult) => {
    onMarkerClick?.(location);
  };

  const handleMarkerDragStart = (e: React.DragEvent, location: LocationSearchResult) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(location));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingMarker(location.id);
  };

  const handleMarkerDragEnd = (e: React.DragEvent, location: LocationSearchResult) => {
    setDraggingMarker(null);
    
    // Calculate new position based on drop location
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
    
    if (parentRect) {
      const x = ((e.clientX - parentRect.left) / parentRect.width) * 100;
      const y = ((e.clientY - parentRect.top) / parentRect.height) * 100;
      
      // Convert screen coordinates back to lat/lng
      const lng = (x / 100) * 360 - 180;
      const lat = 90 - (y / 100) * 180;
      
      onMarkerDrag?.(location, { lat, lng });
    }
  };

  const getRoutePoints = () => {
    if (!showRoutes || destinations.length < 2) return [];
    
    const points = [];
    for (let i = 0; i < destinations.length - 1; i++) {
      const current = destinations[i];
      const next = destinations[i + 1];
      
      const currentX = ((current.coordinates.lng + 180) / 360) * 100;
      const currentY = ((90 - current.coordinates.lat) / 180) * 100;
      const nextX = ((next.coordinates.lng + 180) / 360) * 100;
      const nextY = ((90 - next.coordinates.lat) / 180) * 100;
      
      points.push({
        x1: currentX,
        y1: currentY,
        x2: nextX,
        y2: nextY,
        index: i
      });
    }
    
    return points;
  };

  const routePoints = getRoutePoints();

  return (
    <div className={`relative ${className}`}>
      {/* World map background using a gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-blue-50 to-blue-100">
        {/* Add a subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="tripMapDots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="currentColor" className="text-blue-900" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tripMapDots)" />
          </svg>
        </div>
      </div>

      {/* Route Lines */}
      {showRoutes && (
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={routeColor} stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
              </linearGradient>
              <filter id="routeGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {routePoints.map((route, index) => (
              <g key={`route-${index}`}>
                {/* Route line background */}
                <line
                  x1={`${route.x1}%`}
                  y1={`${route.y1}%`}
                  x2={`${route.x2}%`}
                  y2={`${route.y2}%`}
                  stroke="white"
                  strokeWidth="5"
                  opacity="0.8"
                />
                
                {/* Animated route line */}
                <line
                  x1={`${route.x1}%`}
                  y1={`${route.y1}%`}
                  x2={`${route.x2}%`}
                  y2={`${route.y2}%`}
                  stroke="url(#routeGradient)"
                  strokeWidth="3"
                  strokeDasharray="8,4"
                  filter="url(#routeGlow)"
                  className="animate-pulse"
                />
                
                {/* Route direction arrow */}
                <defs>
                  <marker
                    id={`arrowhead-${index}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill={routeColor}
                      opacity="0.8"
                    />
                  </marker>
                </defs>
                
                <line
                  x1={`${route.x1}%`}
                  y1={`${route.y1}%`}
                  x2={`${route.x2}%`}
                  y2={`${route.y2}%`}
                  stroke="transparent"
                  strokeWidth="1"
                  markerEnd={`url(#arrowhead-${index})`}
                />
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* Destination markers */}
      <div className="absolute inset-0">
        {destinations.map((destination, index) => {
          // Simple positioning based on normalized coordinates
          const left = ((destination.coordinates.lng + 180) / 360) * 100;
          const top = ((90 - destination.coordinates.lat) / 180) * 100;
          
          const isSelected = selectedDestination?.id === destination.id;
          const isFirst = index === 0;
          const isLast = index === destinations.length - 1;
          const isDragging = draggingMarker === destination.id;
          
          return (
            <MotionDiv
              key={destination.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 transition-all ${
                isDragging ? 'opacity-50 scale-110 cursor-grabbing' : 'cursor-grab'
              }`}
              style={{
                left: `${left}%`,
                top: `${top}%`,
              }}
              whileHover={{ scale: 1.1, zIndex: 20 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMarkerClick(destination)}
              draggable={true}
              onDragStart={(e) => handleMarkerDragStart(e, destination)}
              onDragEnd={(e) => handleMarkerDragEnd(e, destination)}
            >
              {/* Marker Pulse Effect */}
              <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                isSelected ? 'bg-red-400' : 
                isFirst ? 'bg-green-400' :
                isLast ? 'bg-red-400' :
                'bg-primary-400'
              }`} />
              
              {/* Main Marker */}
              <div
                className={`relative w-12 h-12 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
                  isSelected
                    ? 'bg-gradient-to-br from-red-400 to-red-600 ring-4 ring-red-200'
                    : isFirst
                    ? 'bg-gradient-to-br from-green-400 to-green-600 ring-2 ring-green-200'
                    : isLast
                    ? 'bg-gradient-to-br from-red-400 to-red-600 ring-2 ring-red-200'
                    : 'bg-gradient-to-br from-primary-400 to-primary-600 hover:from-primary-500 hover:to-primary-700'
                }`}
              >
                {/* Marker Icon */}
                {isFirst ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                ) : isLast ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ) : (
                  <div className="w-3 h-3 bg-white rounded-full" />
                )}
              </div>

              {/* Destination order number */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </div>

              {/* Location Name Tooltip */}
              <MotionDiv
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                whileHover={{ opacity: 1, y: -15, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none"
              >
                <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                  <div className="font-medium">{destination.name}</div>
                  <div className="text-gray-300 text-xs">
                    {isFirst ? 'Start' : isLast ? 'End' : `Stop ${index}`}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                </div>
              </MotionDiv>
            </MotionDiv>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20">
        <div className="bg-white/90 backdrop-blur-lg rounded-lg p-3 shadow-lg">
          <div className="text-xs font-medium text-gray-900 mb-2">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full"></div>
              <span className="text-xs text-gray-600">Start</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full"></div>
              <span className="text-xs text-gray-600">Stop</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gradient-to-br from-red-400 to-red-600 rounded-full"></div>
              <span className="text-xs text-gray-600">End</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Counter */}
      {destinations.length > 0 && (
        <MotionDiv
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="absolute top-4 left-4 z-20"
        >
          <div className="bg-white/90 backdrop-blur-lg rounded-lg px-3 py-2 shadow-lg">
            <span className="text-sm font-medium text-gray-900">
              {destinations.length} destination{destinations.length !== 1 ? 's' : ''}
            </span>
          </div>
        </MotionDiv>
      )}
    </div>
  );
};