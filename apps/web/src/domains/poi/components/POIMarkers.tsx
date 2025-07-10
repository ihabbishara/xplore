'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { POI, POICluster, POIType, DEFAULT_POI_LAYERS, POI_CONSTANTS } from '../types/poi';
import { useMapStore } from '../hooks/useMapStore';
import { usePoiStore } from '../hooks/usePoiStore';

interface POIMarkersProps {
  pois: POI[];
  onMarkerClick?: (poi: POI) => void;
  onMarkerHover?: (poi: POI | null) => void;
  onClusterClick?: (cluster: POICluster) => void;
  showClustering?: boolean;
  clusterRadius?: number;
  minClusterSize?: number;
  animate?: boolean;
  className?: string;
}

export const POIMarkers: React.FC<POIMarkersProps> = ({
  pois,
  onMarkerClick,
  onMarkerHover,
  onClusterClick,
  showClustering = true,
  clusterRadius = POI_CONSTANTS.CLUSTER_RADIUS,
  minClusterSize = 2,
  animate = true,
  className = '',
}) => {
  const { zoom, bounds, activeLayers, selectedPOI, hoveredPOI, setSelectedPOI, setHoveredPOI } = useMapStore();
  const { pois: storePois } = usePoiStore();
  
  const [clusters, setClusters] = useState<POICluster[]>([]);
  const [singlePOIs, setSinglePOIs] = useState<POI[]>([]);

  // Filter POIs based on active layers and zoom level
  const filteredPOIs = useMemo(() => {
    return pois.filter(poi => {
      // Check if POI type is active
      if (!activeLayers.includes(poi.type)) return false;
      
      // Check zoom threshold
      const layerConfig = DEFAULT_POI_LAYERS[poi.type];
      if (layerConfig.zoomThreshold && zoom < layerConfig.zoomThreshold) return false;
      
      // Check if POI is within bounds
      if (bounds) {
        const { coordinates } = poi;
        if (
          coordinates.lat < bounds.south ||
          coordinates.lat > bounds.north ||
          coordinates.lng < bounds.west ||
          coordinates.lng > bounds.east
        ) {
          return false;
        }
      }
      
      return true;
    });
  }, [pois, activeLayers, zoom, bounds]);

  // Clustering algorithm
  const clusterPOIs = useMemo(() => {
    if (!showClustering || zoom > POI_CONSTANTS.MAX_ZOOM_FOR_CLUSTERING) {
      return { clusters: [], singlePOIs: filteredPOIs };
    }

    const clusters: POICluster[] = [];
    const processed = new Set<string>();
    const remaining: POI[] = [];

    filteredPOIs.forEach(poi => {
      if (processed.has(poi.id)) return;

      const nearby = filteredPOIs.filter(otherPoi => {
        if (processed.has(otherPoi.id) || poi.id === otherPoi.id) return false;

        // Calculate distance (simplified for demo)
        const distance = Math.sqrt(
          Math.pow(poi.coordinates.lat - otherPoi.coordinates.lat, 2) +
          Math.pow(poi.coordinates.lng - otherPoi.coordinates.lng, 2)
        );

        // Scale cluster radius based on zoom level
        const scaledRadius = clusterRadius / Math.pow(2, zoom - 10);
        return distance < scaledRadius;
      });

      if (nearby.length >= minClusterSize - 1) {
        const allPOIs = [poi, ...nearby];
        
        // Calculate cluster center
        const centerLat = allPOIs.reduce((sum, p) => sum + p.coordinates.lat, 0) / allPOIs.length;
        const centerLng = allPOIs.reduce((sum, p) => sum + p.coordinates.lng, 0) / allPOIs.length;
        
        // Calculate cluster bounds
        const lats = allPOIs.map(p => p.coordinates.lat);
        const lngs = allPOIs.map(p => p.coordinates.lng);
        
        const cluster: POICluster = {
          id: `cluster-${poi.id}`,
          center: { lat: centerLat, lng: centerLng },
          count: allPOIs.length,
          pois: allPOIs,
          bounds: {
            north: Math.max(...lats),
            south: Math.min(...lats),
            east: Math.max(...lngs),
            west: Math.min(...lngs),
          },
          zoom,
        };

        clusters.push(cluster);
        
        // Mark all POIs in cluster as processed
        allPOIs.forEach(p => processed.add(p.id));
      } else {
        remaining.push(poi);
      }
    });

    return { clusters, singlePOIs: remaining };
  }, [filteredPOIs, showClustering, zoom, clusterRadius, minClusterSize]);

  // Update state when clustering changes
  useEffect(() => {
    setClusters(clusterPOIs.clusters);
    setSinglePOIs(clusterPOIs.singlePOIs);
  }, [clusterPOIs]);

  const handleMarkerClick = (poi: POI) => {
    setSelectedPOI(poi);
    onMarkerClick?.(poi);
  };

  const handleMarkerHover = (poi: POI | null) => {
    setHoveredPOI(poi);
    onMarkerHover?.(poi);
  };

  const handleClusterClick = (cluster: POICluster) => {
    onClusterClick?.(cluster);
  };

  const getMarkerIcon = (poi: POI) => {
    const config = DEFAULT_POI_LAYERS[poi.type];
    return config.icon;
  };

  const getMarkerColor = (poi: POI) => {
    const config = DEFAULT_POI_LAYERS[poi.type];
    return config.color;
  };

  const getMarkerSize = (poi: POI) => {
    const isSelected = selectedPOI?.id === poi.id;
    const isHovered = hoveredPOI?.id === poi.id;
    
    if (isSelected) return 'w-12 h-12 text-lg';
    if (isHovered) return 'w-10 h-10 text-base';
    return 'w-8 h-8 text-sm';
  };

  const getClusterColor = (cluster: POICluster) => {
    // Use the most common POI type in the cluster
    const typeCounts = cluster.pois.reduce((acc, poi) => {
      acc[poi.type] = (acc[poi.type] || 0) + 1;
      return acc;
    }, {} as Record<POIType, number>);

    const mostCommonType = Object.entries(typeCounts).reduce((a, b) => 
      typeCounts[a[0] as POIType] > typeCounts[b[0] as POIType] ? a : b
    )[0] as POIType;

    return DEFAULT_POI_LAYERS[mostCommonType].color;
  };

  const getClusterSize = (cluster: POICluster) => {
    if (cluster.count >= 100) return 'w-16 h-16 text-lg';
    if (cluster.count >= 10) return 'w-12 h-12 text-base';
    return 'w-10 h-10 text-sm';
  };

  const convertToScreenCoordinates = (lat: number, lng: number) => {
    // This is a simplified conversion - in a real implementation,
    // you would use the map's projection system
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Cluster Markers */}
      <AnimatePresence>
        {clusters.map((cluster) => {
          const screenPos = convertToScreenCoordinates(
            cluster.center.lat,
            cluster.center.lng
          );
          
          return (
            <motion.div
              key={cluster.id}
              initial={animate ? { scale: 0, opacity: 0 } : undefined}
              animate={{ scale: 1, opacity: 1 }}
              exit={animate ? { scale: 0, opacity: 0 } : undefined}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer z-20"
              style={{
                left: `${screenPos.x}%`,
                top: `${screenPos.y}%`,
              }}
              onClick={() => handleClusterClick(cluster)}
            >
              {/* Cluster pulse effect */}
              <div className="absolute inset-0 rounded-full animate-ping opacity-30">
                <div
                  className={`w-full h-full rounded-full ${getClusterSize(cluster)}`}
                  style={{ backgroundColor: getClusterColor(cluster) }}
                />
              </div>
              
              {/* Main cluster marker */}
              <div
                className={`relative rounded-full shadow-lg flex items-center justify-center text-white font-bold transition-all duration-200 hover:scale-110 ${getClusterSize(cluster)}`}
                style={{ backgroundColor: getClusterColor(cluster) }}
              >
                {cluster.count}
              </div>
              
              {/* Cluster tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  {cluster.count} locations
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Individual POI Markers */}
      <AnimatePresence>
        {singlePOIs.map((poi, index) => {
          const screenPos = convertToScreenCoordinates(
            poi.coordinates.lat,
            poi.coordinates.lng
          );
          
          const isSelected = selectedPOI?.id === poi.id;
          const isHovered = hoveredPOI?.id === poi.id;
          
          return (
            <motion.div
              key={poi.id}
              initial={animate ? { scale: 0, opacity: 0 } : undefined}
              animate={{ scale: 1, opacity: 1 }}
              exit={animate ? { scale: 0, opacity: 0 } : undefined}
              transition={{ 
                duration: 0.4, 
                delay: animate ? index * 0.05 : 0,
                ease: 'easeOut' 
              }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer z-10 group"
              style={{
                left: `${screenPos.x}%`,
                top: `${screenPos.y}%`,
              }}
              onClick={() => handleMarkerClick(poi)}
              onMouseEnter={() => handleMarkerHover(poi)}
              onMouseLeave={() => handleMarkerHover(null)}
            >
              {/* Marker pulse effect for selected/hovered */}
              {(isSelected || isHovered) && (
                <div className="absolute inset-0 rounded-full animate-pulse opacity-30">
                  <div
                    className={`w-full h-full rounded-full ${getMarkerSize(poi)}`}
                    style={{ backgroundColor: getMarkerColor(poi) }}
                  />
                </div>
              )}
              
              {/* Main marker */}
              <div
                className={`relative rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-110 ${getMarkerSize(poi)} ${
                  isSelected ? 'ring-4 ring-white ring-opacity-50' : ''
                }`}
                style={{ backgroundColor: getMarkerColor(poi) }}
              >
                <span className="drop-shadow-sm">
                  {getMarkerIcon(poi)}
                </span>
              </div>
              
              {/* Marker tooltip */}
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ 
                  opacity: isHovered ? 1 : 0, 
                  y: isHovered ? -10 : 10,
                  scale: isHovered ? 1 : 0.8
                }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none"
              >
                <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap max-w-xs">
                  <div className="font-medium">{poi.name}</div>
                  {poi.rating && (
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-yellow-400">⭐</span>
                      <span>{poi.rating.toFixed(1)}</span>
                      {poi.reviewCount && (
                        <span className="text-gray-300">({poi.reviewCount})</span>
                      )}
                    </div>
                  )}
                  <div className="text-gray-300 text-xs mt-1">
                    {DEFAULT_POI_LAYERS[poi.type].name}
                  </div>
                  
                  {/* Tooltip arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                </div>
              </motion.div>
              
              {/* Priority indicator for high-priority POIs */}
              {poi.rating && poi.rating >= 4.5 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">⭐</span>
                </div>
              )}
              
              {/* User-generated indicator */}
              {poi.isUserGenerated && (
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white">👤</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black/80 text-white text-xs p-2 rounded pointer-events-auto">
          <div>Total POIs: {pois.length}</div>
          <div>Filtered: {filteredPOIs.length}</div>
          <div>Clusters: {clusters.length}</div>
          <div>Single: {singlePOIs.length}</div>
          <div>Zoom: {zoom.toFixed(1)}</div>
        </div>
      )}
    </div>
  );
};