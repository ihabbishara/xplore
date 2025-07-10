import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useMapStore } from './useMapStore';
import { usePoiStore } from './usePoiStore';
import { POI, POIType, LatLngBounds, POI_CONSTANTS } from '../types/poi';

interface PerformanceMetrics {
  renderTime: number;
  poiCount: number;
  visiblePOIs: number;
  clusterCount: number;
  cacheHitRate: number;
  memoryUsage: number;
}

interface UsePOIPerformanceOptions {
  enableVirtualization?: boolean;
  enableCaching?: boolean;
  enableDebouncing?: boolean;
  debounceDelay?: number;
  maxPOIsPerViewport?: number;
  virtualScrollThreshold?: number;
  cacheSize?: number;
}

export const usePOIPerformance = (options: UsePOIPerformanceOptions = {}) => {
  const {
    enableVirtualization = true,
    enableCaching = true,
    enableDebouncing = true,
    debounceDelay = 300,
    maxPOIsPerViewport = POI_CONSTANTS.MAX_POIS_PER_VIEWPORT,
    virtualScrollThreshold = 500,
    cacheSize = 100,
  } = options;

  const { zoom, bounds, activeLayers } = useMapStore();
  const { pois, cache, setCacheEntry } = usePoiStore();
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    poiCount: 0,
    visiblePOIs: 0,
    clusterCount: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
  });

  const renderStartTime = useRef<number>(0);
  const cacheHits = useRef<number>(0);
  const cacheMisses = useRef<number>(0);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const virtualizedPOIs = useRef<Set<string>>(new Set());
  const lruCache = useRef<Map<string, POI[]>>(new Map());

  // Generate cache key for bounds and filters
  const generateCacheKey = useCallback((bounds: LatLngBounds, layers: POIType[]) => {
    return `${bounds.north}-${bounds.south}-${bounds.east}-${bounds.west}-${layers.join(',')}`;
  }, []);

  // LRU Cache implementation
  const getCachedPOIs = useCallback((key: string): POI[] | null => {
    if (!enableCaching) return null;
    
    const cached = lruCache.current.get(key);
    if (cached) {
      // Move to end (most recently used)
      lruCache.current.delete(key);
      lruCache.current.set(key, cached);
      cacheHits.current++;
      return cached;
    }
    
    cacheMisses.current++;
    return null;
  }, [enableCaching]);

  const setCachedPOIs = useCallback((key: string, pois: POI[]) => {
    if (!enableCaching) return;
    
    // Remove oldest items if cache is full
    if (lruCache.current.size >= cacheSize) {
      const firstKey = lruCache.current.keys().next().value;
      lruCache.current.delete(firstKey);
    }
    
    lruCache.current.set(key, pois);
    setCacheEntry({ key, pois });
  }, [enableCaching, cacheSize, setCacheEntry]);

  // Virtualization: Only render POIs in viewport
  const getVirtualizedPOIs = useCallback((pois: POI[], bounds: LatLngBounds): POI[] => {
    if (!enableVirtualization || pois.length < virtualScrollThreshold) {
      return pois;
    }

    const visiblePOIs = pois.filter(poi => {
      const { lat, lng } = poi.coordinates;
      return (
        lat >= bounds.south &&
        lat <= bounds.north &&
        lng >= bounds.west &&
        lng <= bounds.east
      );
    });

    // Limit to max POIs per viewport
    const limitedPOIs = visiblePOIs.slice(0, maxPOIsPerViewport);
    
    // Update virtualized POIs set
    virtualizedPOIs.current.clear();
    limitedPOIs.forEach(poi => virtualizedPOIs.current.add(poi.id));
    
    return limitedPOIs;
  }, [enableVirtualization, virtualScrollThreshold, maxPOIsPerViewport]);

  // Debounced POI filtering
  const debouncedFilterPOIs = useCallback((
    pois: POI[],
    bounds: LatLngBounds,
    layers: POIType[],
    callback: (filteredPOIs: POI[]) => void
  ) => {
    if (!enableDebouncing) {
      callback(pois);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const cacheKey = generateCacheKey(bounds, layers);
      const cachedPOIs = getCachedPOIs(cacheKey);
      
      if (cachedPOIs) {
        callback(cachedPOIs);
        return;
      }

      // Filter POIs
      const filteredPOIs = pois.filter(poi => {
        if (!layers.includes(poi.type)) return false;
        
        const { lat, lng } = poi.coordinates;
        return (
          lat >= bounds.south &&
          lat <= bounds.north &&
          lng >= bounds.west &&
          lng <= bounds.east
        );
      });

      // Apply virtualization
      const virtualizedPOIs = getVirtualizedPOIs(filteredPOIs, bounds);
      
      // Cache the result
      setCachedPOIs(cacheKey, virtualizedPOIs);
      
      callback(virtualizedPOIs);
    }, debounceDelay);
  }, [
    enableDebouncing,
    debounceDelay,
    generateCacheKey,
    getCachedPOIs,
    setCachedPOIs,
    getVirtualizedPOIs,
  ]);

  // Optimized POI filtering with performance tracking
  const optimizedPOIs = useMemo(() => {
    if (!bounds) return [];
    
    renderStartTime.current = performance.now();
    
    const cacheKey = generateCacheKey(bounds, activeLayers);
    const cachedPOIs = getCachedPOIs(cacheKey);
    
    if (cachedPOIs) {
      const renderTime = performance.now() - renderStartTime.current;
      setMetrics(prev => ({
        ...prev,
        renderTime,
        poiCount: pois.length,
        visiblePOIs: cachedPOIs.length,
        cacheHitRate: cacheHits.current / (cacheHits.current + cacheMisses.current),
      }));
      return cachedPOIs;
    }

    // Filter POIs by active layers
    const layerFilteredPOIs = pois.filter(poi => activeLayers.includes(poi.type));
    
    // Apply virtualization
    const virtualizedPOIs = getVirtualizedPOIs(layerFilteredPOIs, bounds);
    
    // Cache the result
    setCachedPOIs(cacheKey, virtualizedPOIs);
    
    const renderTime = performance.now() - renderStartTime.current;
    setMetrics(prev => ({
      ...prev,
      renderTime,
      poiCount: pois.length,
      visiblePOIs: virtualizedPOIs.length,
      cacheHitRate: cacheHits.current / (cacheHits.current + cacheMisses.current),
    }));
    
    return virtualizedPOIs;
  }, [pois, bounds, activeLayers, generateCacheKey, getCachedPOIs, setCachedPOIs, getVirtualizedPOIs]);

  // Memory usage tracking
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memInfo.usedJSHeapSize / (1024 * 1024), // MB
        }));
      }
    };

    const interval = setInterval(updateMemoryUsage, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Cache cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      lruCache.current.clear();
    };
  }, []);

  // Performance utilities
  const performanceUtils = {
    clearCache: useCallback(() => {
      lruCache.current.clear();
      cacheHits.current = 0;
      cacheMisses.current = 0;
    }, []),

    preloadPOIs: useCallback(async (bounds: LatLngBounds, layers: POIType[]) => {
      const cacheKey = generateCacheKey(bounds, layers);
      if (!getCachedPOIs(cacheKey)) {
        // Simulate POI loading - in real app this would be an API call
        const filteredPOIs = pois.filter(poi => {
          if (!layers.includes(poi.type)) return false;
          const { lat, lng } = poi.coordinates;
          return (
            lat >= bounds.south &&
            lat <= bounds.north &&
            lng >= bounds.west &&
            lng <= bounds.east
          );
        });
        setCachedPOIs(cacheKey, filteredPOIs);
      }
    }, [pois, generateCacheKey, getCachedPOIs, setCachedPOIs]),

    isVirtualized: useCallback((poiId: string) => {
      return virtualizedPOIs.current.has(poiId);
    }, []),

    getOptimizationSuggestions: useCallback(() => {
      const suggestions: string[] = [];
      
      if (metrics.renderTime > 100) {
        suggestions.push('Consider reducing POI count or enabling clustering');
      }
      
      if (metrics.cacheHitRate < 0.5) {
        suggestions.push('Consider increasing cache size or reducing filter changes');
      }
      
      if (metrics.memoryUsage > 100) {
        suggestions.push('Consider enabling virtualization or reducing POI data');
      }
      
      if (metrics.visiblePOIs > maxPOIsPerViewport) {
        suggestions.push('Consider increasing clustering threshold');
      }
      
      return suggestions;
    }, [metrics, maxPOIsPerViewport]),
  };

  return {
    optimizedPOIs,
    metrics,
    performanceUtils,
    debouncedFilterPOIs,
    isVirtualizationEnabled: enableVirtualization,
    isCachingEnabled: enableCaching,
    isDebouncingEnabled: enableDebouncing,
  };
};

// Mobile-specific optimizations hook
export const useMobileOptimizations = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [touchDevice, setTouchDevice] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setOrientation(window.innerWidth < window.innerHeight ? 'portrait' : 'landscape');
      setTouchDevice('ontouchstart' in window);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  const mobileOptimizations = {
    // Reduce animations on mobile for better performance
    reduceAnimations: isMobile,
    
    // Use smaller cluster radius on mobile
    clusterRadius: isMobile ? 30 : 50,
    
    // Reduce max POIs on mobile
    maxPOIs: isMobile ? 50 : 100,
    
    // Increase debounce delay on mobile
    debounceDelay: isMobile ? 500 : 300,
    
    // Enable touch-specific interactions
    touchOptimized: touchDevice,
    
    // Adjust UI for orientation
    compactUI: isMobile && orientation === 'portrait',
  };

  return {
    isMobile,
    orientation,
    touchDevice,
    mobileOptimizations,
  };
};