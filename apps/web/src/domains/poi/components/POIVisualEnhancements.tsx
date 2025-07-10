'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { POI, POIType, POIHeatmapData, LatLngBounds, DEFAULT_POI_LAYERS } from '../types/poi';
import { useMapStore } from '../hooks/useMapStore';
import { usePoiStore } from '../hooks/usePoiStore';

interface POIVisualEnhancementsProps {
  pois: POI[];
  showHeatmap?: boolean;
  show3DMarkers?: boolean;
  showRouteCorridor?: boolean;
  routePoints?: { lat: number; lng: number }[];
  heatmapIntensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export const POIVisualEnhancements: React.FC<POIVisualEnhancementsProps> = ({
  pois,
  showHeatmap = false,
  show3DMarkers = true,
  showRouteCorridor = false,
  routePoints = [],
  heatmapIntensity = 'medium',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [heatmapData, setHeatmapData] = useState<POIHeatmapData[]>([]);
  
  const { zoom, bounds, routeCorridorRadius, activeLayers } = useMapStore();

  // Generate heatmap data from POIs
  const generateHeatmapData = useMemo((): POIHeatmapData[] => {
    if (!showHeatmap) return [];
    
    const filteredPOIs = pois.filter(poi => activeLayers.includes(poi.type));
    
    return filteredPOIs.map(poi => {
      // Calculate intensity based on rating and review count
      let intensity = 0.5; // Base intensity
      
      if (poi.rating) {
        intensity += (poi.rating / 5) * 0.3; // Up to 30% boost for rating
      }
      
      if (poi.reviewCount) {
        intensity += Math.min(poi.reviewCount / 100, 1) * 0.2; // Up to 20% boost for reviews
      }
      
      // Apply intensity modifier
      switch (heatmapIntensity) {
        case 'low':
          intensity *= 0.6;
          break;
        case 'high':
          intensity *= 1.4;
          break;
        default:
          break;
      }
      
      return {
        coordinates: poi.coordinates,
        intensity: Math.min(intensity, 1),
        type: poi.type,
      };
    });
  }, [pois, showHeatmap, activeLayers, heatmapIntensity]);

  // Update heatmap data when dependencies change
  useEffect(() => {
    setHeatmapData(generateHeatmapData);
  }, [generateHeatmapData]);

  // Draw heatmap on canvas
  useEffect(() => {
    if (!showHeatmap || !canvasRef.current || heatmapData.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size to match container
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Draw heatmap points
    heatmapData.forEach(point => {
      const screenPos = convertToScreenCoordinates(point.coordinates.lat, point.coordinates.lng);
      const x = (screenPos.x / 100) * canvas.width;
      const y = (screenPos.y / 100) * canvas.height;
      
      // Create radial gradient for heatmap effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20 * zoom / 10);
      
      // Use POI type color with opacity based on intensity
      const layerConfig = DEFAULT_POI_LAYERS[point.type];
      const color = layerConfig.color;
      
      gradient.addColorStop(0, `${color}${Math.round(point.intensity * 100).toString(16)}`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x - 20, y - 20, 40, 40);
    });

    // Apply blend mode for better heatmap effect
    ctx.globalCompositeOperation = 'multiply';
  }, [showHeatmap, heatmapData, zoom]);

  // Convert lat/lng to screen coordinates
  const convertToScreenCoordinates = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  // Generate route corridor path
  const generateRouteCorridorPath = useMemo(() => {
    if (!showRouteCorridor || routePoints.length < 2) return '';
    
    const corridorWidth = (routeCorridorRadius || 5) * 0.01; // Convert km to approximate degrees
    const pathPoints: string[] = [];
    
    routePoints.forEach((point, index) => {
      const screenPos = convertToScreenCoordinates(point.lat, point.lng);
      
      if (index === 0) {
        pathPoints.push(`M ${screenPos.x} ${screenPos.y}`);
      } else {
        pathPoints.push(`L ${screenPos.x} ${screenPos.y}`);
      }
    });
    
    return pathPoints.join(' ');
  }, [showRouteCorridor, routePoints, routeCorridorRadius]);

  // Generate 3D marker shadow effects
  const generate3DMarkerShadows = useMemo(() => {
    if (!show3DMarkers) return [];
    
    const filteredPOIs = pois.filter(poi => activeLayers.includes(poi.type));
    
    return filteredPOIs.map(poi => {
      const screenPos = convertToScreenCoordinates(poi.coordinates.lat, poi.coordinates.lng);
      const layerConfig = DEFAULT_POI_LAYERS[poi.type];
      
      return {
        id: poi.id,
        x: screenPos.x,
        y: screenPos.y,
        color: layerConfig.color,
        size: poi.rating ? Math.max(8, poi.rating * 2) : 8,
        elevation: poi.rating ? poi.rating * 2 : 2,
      };
    });
  }, [show3DMarkers, pois, activeLayers]);

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Heatmap Canvas */}
      {showHeatmap && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-60"
          style={{ mixBlendMode: 'multiply' }}
        />
      )}

      {/* Route Corridor */}
      {showRouteCorridor && routePoints.length > 1 && (
        <svg className="absolute inset-0 w-full h-full opacity-30">
          <defs>
            <linearGradient id="corridorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.2" />
            </linearGradient>
            <filter id="corridorGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
            d={generateRouteCorridorPath}
            stroke="url(#corridorGradient)"
            strokeWidth={`${(routeCorridorRadius || 5) * 2}px`}
            fill="none"
            filter="url(#corridorGlow)"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* 3D Marker Shadows */}
      {show3DMarkers && (
        <div className="absolute inset-0">
          <AnimatePresence>
            {generate3DMarkerShadows.map((shadow, index) => (
              <motion.div
                key={shadow.id}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0, y: 20 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.05,
                  ease: 'easeOut'
                }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${shadow.x}%`,
                  top: `${shadow.y}%`,
                }}
              >
                {/* 3D Base Shadow */}
                <div
                  className="absolute rounded-full opacity-30 blur-sm"
                  style={{
                    width: `${shadow.size + 4}px`,
                    height: `${shadow.size + 4}px`,
                    backgroundColor: shadow.color,
                    top: `${shadow.elevation + 2}px`,
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                />
                
                {/* 3D Marker Body */}
                <div
                  className="relative rounded-full shadow-lg"
                  style={{
                    width: `${shadow.size}px`,
                    height: `${shadow.size}px`,
                    backgroundColor: shadow.color,
                    boxShadow: `
                      0 ${shadow.elevation}px ${shadow.elevation * 2}px rgba(0,0,0,0.3),
                      inset 0 1px 0 rgba(255,255,255,0.3),
                      inset 0 -1px 0 rgba(0,0,0,0.1)
                    `,
                  }}
                >
                  {/* 3D Highlight */}
                  <div
                    className="absolute top-0 left-0 w-full h-full rounded-full opacity-40"
                    style={{
                      background: `linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%)`,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* POI Density Visualization */}
      {showHeatmap && (
        <div className="absolute top-4 right-4 bg-black/80 text-white text-xs p-2 rounded pointer-events-auto">
          <div className="mb-1 font-medium">POI Density</div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-red-500 rounded-full"></div>
            <span>Low → High</span>
          </div>
          <div className="mt-1">
            Intensity: {heatmapIntensity}
          </div>
        </div>
      )}

      {/* Route Corridor Info */}
      {showRouteCorridor && routePoints.length > 1 && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded pointer-events-auto">
          <div className="mb-1 font-medium">Route Corridor</div>
          <div>Radius: {routeCorridorRadius}km</div>
          <div>Points: {routePoints.length}</div>
        </div>
      )}

      {/* 3D Effects Info */}
      {show3DMarkers && (
        <div className="absolute bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded pointer-events-auto">
          <div className="mb-1 font-medium">3D Effects</div>
          <div>Markers: {generate3DMarkerShadows.length}</div>
          <div>Zoom: {zoom.toFixed(1)}x</div>
        </div>
      )}

      {/* Animated Particles for Visual Enhancement */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-20"
            initial={{
              x: Math.random() * 100 + '%',
              y: Math.random() * 100 + '%',
            }}
            animate={{
              x: Math.random() * 100 + '%',
              y: Math.random() * 100 + '%',
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'linear',
            }}
          />
        ))}
      </div>
    </div>
  );
};