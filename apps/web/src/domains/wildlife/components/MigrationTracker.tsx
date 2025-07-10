'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  Navigation,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info,
  Clock,
  MapPin,
  Users,
  Compass,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs } from '@/components/ui/Tabs';
import { Select } from '@/components/ui/Select';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  WildlifeSpecies,
  MigrationPattern,
  MigrationRoute,
  MigrationStopover,
  MigrationStatus,
  Season,
  Coordinates,
} from '../types/wildlife';
import { useWildlifeStore } from '../hooks/useWildlifeStore';

interface MigrationTrackerProps {
  species: WildlifeSpecies;
  onRouteSelect?: (route: MigrationRoute) => void;
  showTimeline?: boolean;
  enableAnimation?: boolean;
  className?: string;
}

interface AnimationState {
  isPlaying: boolean;
  currentMonth: number;
  speed: number;
}

const statusColors = {
  [MigrationStatus.NOT_STARTED]: 'text-gray-500',
  [MigrationStatus.IN_PROGRESS]: 'text-blue-500',
  [MigrationStatus.COMPLETED]: 'text-green-500',
  [MigrationStatus.DELAYED]: 'text-yellow-500',
  [MigrationStatus.DISRUPTED]: 'text-red-500',
};

const seasonColors = {
  [Season.SPRING]: 'bg-green-100 text-green-700',
  [Season.SUMMER]: 'bg-yellow-100 text-yellow-700',
  [Season.FALL]: 'bg-orange-100 text-orange-700',
  [Season.WINTER]: 'bg-blue-100 text-blue-700',
  [Season.YEAR_ROUND]: 'bg-gray-100 text-gray-700',
};

export const MigrationTracker: React.FC<MigrationTrackerProps> = ({
  species,
  onRouteSelect,
  showTimeline = true,
  enableAnimation = true,
  className = '',
}) => {
  const [selectedRoute, setSelectedRoute] = useState<MigrationRoute | null>(null);
  const [selectedStopover, setSelectedStopover] = useState<MigrationStopover | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'timeline' | 'statistics'>('map');
  const [animation, setAnimation] = useState<AnimationState>({
    isPlaying: false,
    currentMonth: new Date().getMonth(),
    speed: 1,
  });
  
  const {
    migrationPatterns,
    loadMigrationPatterns,
    getCurrentMigrationStatus,
    getMigrationProgress,
  } = useWildlifeStore();
  
  const patterns = migrationPatterns[species.id] || [];
  const currentStatus = getCurrentMigrationStatus(species.id);
  const progress = getMigrationProgress(species.id);

  useEffect(() => {
    if (!patterns.length) {
      loadMigrationPatterns(species.id);
    }
  }, [species.id, patterns.length, loadMigrationPatterns]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (animation.isPlaying) {
      interval = setInterval(() => {
        setAnimation(prev => ({
          ...prev,
          currentMonth: (prev.currentMonth + 1) % 12,
        }));
      }, 2000 / animation.speed);
    }
    return () => clearInterval(interval);
  }, [animation.isPlaying, animation.speed]);

  const handleRouteClick = (route: MigrationRoute) => {
    setSelectedRoute(route);
    if (onRouteSelect) {
      onRouteSelect(route);
    }
  };

  const renderMapView = () => {
    // Simplified map visualization - in real app would use Mapbox/Google Maps
    return (
      <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg h-96 overflow-hidden">
        {/* Map Background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Map className="h-32 w-32 text-gray-300 dark:text-gray-600" />
        </div>

        {/* Routes */}
        {patterns.map(pattern => (
          <div key={pattern.id}>
            {pattern.routes.map(route => (
              <div key={route.id} className="absolute inset-0">
                {/* Route Path (simplified) */}
                <svg className="absolute inset-0 w-full h-full">
                  <path
                    d={`M ${route.startPoint.lng * 2 + 200} ${200 - route.startPoint.lat * 2} 
                        Q ${(route.startPoint.lng + route.endPoint.lng) + 200} ${150} 
                        ${route.endPoint.lng * 2 + 200} ${200 - route.endPoint.lat * 2}`}
                    fill="none"
                    stroke={route === selectedRoute ? '#3B82F6' : '#9CA3AF'}
                    strokeWidth={route === selectedRoute ? 3 : 2}
                    strokeDasharray={route.isActive ? '0' : '5,5'}
                    className="transition-all"
                  />
                </svg>

                {/* Stopovers */}
                {route.majorStopovers.map((stopover, idx) => (
                  <Tooltip
                    key={stopover.id}
                    content={
                      <div className="text-sm">
                        <Text className="font-medium">{stopover.name}</Text>
                        <Text className="text-gray-400">
                          {stopover.typicalDuration} days • {stopover.importance}
                        </Text>
                      </div>
                    }
                  >
                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedStopover(stopover)}
                      className={`absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                        stopover === selectedStopover
                          ? 'bg-blue-500 ring-2 ring-blue-300'
                          : 'bg-orange-500 hover:ring-2 hover:ring-orange-300'
                      }`}
                      style={{
                        left: `${stopover.coordinates.lng * 2 + 200}px`,
                        top: `${200 - stopover.coordinates.lat * 2}px`,
                      }}
                    />
                  </Tooltip>
                ))}

                {/* Start/End Points */}
                <div
                  className="absolute w-6 h-6 bg-green-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{
                    left: `${route.startPoint.lng * 2 + 200}px`,
                    top: `${200 - route.startPoint.lat * 2}px`,
                  }}
                >
                  <Navigation className="h-3 w-3 text-white rotate-45" />
                </div>
                <div
                  className="absolute w-6 h-6 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{
                    left: `${route.endPoint.lng * 2 + 200}px`,
                    top: `${200 - route.endPoint.lat * 2}px`,
                  }}
                >
                  <MapPin className="h-3 w-3 text-white" />
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Current Position Indicator */}
        {animation.isPlaying && currentStatus.currentLocation && (
          <motion.div
            animate={{
              left: `${currentStatus.currentLocation.lng * 2 + 200}px`,
              top: `${200 - currentStatus.currentLocation.lat * 2}px`,
            }}
            transition={{ duration: 2 / animation.speed }}
            className="absolute w-8 h-8 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-full h-full bg-blue-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping" />
          </motion.div>
        )}

        {/* Map Controls */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <Card className="px-3 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur">
            <Text className="text-sm font-medium">
              {format(new Date(2024, animation.currentMonth), 'MMMM')}
            </Text>
          </Card>

          {enableAnimation && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAnimation(prev => ({ ...prev, isPlaying: !prev.isPlaying }))}
              >
                {animation.isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAnimation(prev => ({ ...prev, speed: prev.speed === 1 ? 2 : 1 }))}
              >
                <SkipForward className="h-4 w-4" />
                {animation.speed}x
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAnimation(prev => ({ ...prev, currentMonth: new Date().getMonth() }))}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTimelineView = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    
    return (
      <div className="space-y-4">
        {patterns.map(pattern => (
          <Card key={pattern.id} className="p-4">
            <h4 className="font-semibold mb-4">{pattern.name}</h4>
            
            {pattern.routes.map(route => (
              <div key={route.id} className="mb-6 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <Text className="font-medium">{route.name}</Text>
                  <Badge variant={seasonColors[route.season]}>
                    {route.season}
                  </Badge>
                </div>

                {/* Timeline */}
                <div className="relative">
                  <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2" />
                  
                  {/* Months */}
                  <div className="relative flex justify-between">
                    {months.map(month => {
                      const isActive = month >= route.typicalTiming.startMonth && 
                                      month <= route.typicalTiming.endMonth;
                      const isCurrent = month === animation.currentMonth;
                      
                      return (
                        <div
                          key={month}
                          className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                            isActive
                              ? isCurrent
                                ? 'bg-blue-500 text-white scale-125'
                                : 'bg-green-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                          }`}
                        >
                          {format(new Date(2024, month), 'MMM').charAt(0)}
                        </div>
                      );
                    })}
                  </div>

                  {/* Stopovers on Timeline */}
                  <div className="mt-4 space-y-2">
                    {route.majorStopovers.map(stopover => (
                      <div
                        key={stopover.id}
                        className="flex items-center gap-2 text-sm"
                        style={{
                          marginLeft: `${(stopover.arrivalTiming.month / 12) * 100}%`,
                        }}
                      >
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <Text className="text-gray-600 dark:text-gray-400">
                          {stopover.name}
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Route Details */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <Text className="text-gray-500">Distance</Text>
                    <Text className="font-medium">{route.totalDistance} km</Text>
                  </div>
                  <div>
                    <Text className="text-gray-500">Duration</Text>
                    <Text className="font-medium">{route.averageDuration} days</Text>
                  </div>
                  <div>
                    <Text className="text-gray-500">Population</Text>
                    <Text className="font-medium">{route.populationSize.toLocaleString()}</Text>
                  </div>
                </div>
              </div>
            ))}
          </Card>
        ))}
      </div>
    );
  };

  const renderStatisticsView = () => {
    return (
      <div className="space-y-4">
        {/* Current Status */}
        <Card className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Compass className="h-5 w-5" />
            Current Migration Status
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text className="text-sm text-gray-500">Status</Text>
              <div className="flex items-center gap-2 mt-1">
                <div className={`h-2 w-2 rounded-full ${
                  currentStatus.status === MigrationStatus.IN_PROGRESS ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
                }`} />
                <Text className={`font-medium ${statusColors[currentStatus.status]}`}>
                  {currentStatus.status.replace('_', ' ')}
                </Text>
              </div>
            </div>
            
            <div>
              <Text className="text-sm text-gray-500">Progress</Text>
              <div className="mt-1">
                <Progress value={progress * 100} className="h-2" />
                <Text className="text-xs text-gray-500 mt-1">{Math.round(progress * 100)}%</Text>
              </div>
            </div>

            {currentStatus.currentLocation && (
              <div>
                <Text className="text-sm text-gray-500">Current Location</Text>
                <Text className="font-medium">
                  {currentStatus.estimatedArrival || 'Unknown'}
                </Text>
              </div>
            )}

            {currentStatus.nextStopover && (
              <div>
                <Text className="text-sm text-gray-500">Next Stop</Text>
                <Text className="font-medium">{currentStatus.nextStopover}</Text>
              </div>
            )}
          </div>
        </Card>

        {/* Pattern Statistics */}
        {patterns.map(pattern => (
          <Card key={pattern.id} className="p-4">
            <h4 className="font-semibold mb-3">{pattern.name} Statistics</h4>
            
            <div className="space-y-3">
              {/* Conservation Threats */}
              {pattern.conservationThreats.length > 0 && (
                <div>
                  <Text className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                    Conservation Threats
                  </Text>
                  <div className="space-y-1">
                    {pattern.conservationThreats.map((threat, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        <Text className="text-sm">{threat}</Text>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Climate Impact */}
              <div>
                <Text className="text-sm font-medium mb-2">Climate Change Impact</Text>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <Text className="text-sm">
                      Timing shift: {pattern.climateImpact.timingShift} days
                    </Text>
                  </div>
                  <div className="flex items-center gap-1">
                    <Navigation className="h-4 w-4 text-blue-500" />
                    <Text className="text-sm">
                      Route change: {pattern.climateImpact.routeChange}%
                    </Text>
                  </div>
                </div>
                <Progress 
                  value={pattern.climateImpact.threatLevel * 20} 
                  className="h-2 mt-2"
                />
              </div>

              {/* Historical Comparison */}
              <div>
                <Text className="text-sm font-medium mb-2">Population Trend</Text>
                <div className="flex items-center justify-between">
                  <Text className="text-sm text-gray-500">Last 10 years</Text>
                  <div className="flex items-center gap-1">
                    {pattern.populationTrend === 'increasing' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : pattern.populationTrend === 'decreasing' ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <span className="h-4 w-4 text-gray-500">→</span>
                    )}
                    <Text className={`font-medium ${
                      pattern.populationTrend === 'increasing' ? 'text-green-600' :
                      pattern.populationTrend === 'decreasing' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {pattern.populationTrend}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Migration Tracker
            </h3>
            <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {species.commonName} migration patterns
            </Text>
          </div>

          {/* View Mode Selector */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
            >
              Map
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('timeline')}
            >
              Timeline
            </Button>
            <Button
              variant={viewMode === 'statistics' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('statistics')}
            >
              Stats
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {viewMode === 'map' && renderMapView()}
          {viewMode === 'timeline' && showTimeline && renderTimelineView()}
          {viewMode === 'statistics' && renderStatisticsView()}
        </div>

        {/* Selected Route Details */}
        {selectedRoute && (
          <Card className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20">
            <h4 className="font-semibold mb-2">{selectedRoute.name}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Text className="text-gray-500">Distance</Text>
                <Text className="font-medium">{selectedRoute.totalDistance} km</Text>
              </div>
              <div>
                <Text className="text-gray-500">Duration</Text>
                <Text className="font-medium">{selectedRoute.averageDuration} days</Text>
              </div>
              <div>
                <Text className="text-gray-500">Stopovers</Text>
                <Text className="font-medium">{selectedRoute.majorStopovers.length}</Text>
              </div>
              <div>
                <Text className="text-gray-500">Population</Text>
                <Text className="font-medium">{selectedRoute.populationSize.toLocaleString()}</Text>
              </div>
            </div>
            {selectedRoute.keyFeatures.length > 0 && (
              <div className="mt-3">
                <Text className="text-sm font-medium mb-1">Key Features</Text>
                <div className="flex flex-wrap gap-1">
                  {selectedRoute.keyFeatures.map((feature, idx) => (
                    <Badge key={idx} variant="outline" size="sm">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Selected Stopover Details */}
        {selectedStopover && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {selectedStopover.name}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <Text className="text-gray-500">Typical Stay</Text>
                    <Text className="font-medium">{selectedStopover.typicalDuration} days</Text>
                  </div>
                  <div>
                    <Text className="text-gray-500">Importance</Text>
                    <Badge 
                      variant={selectedStopover.importance === 'critical' ? 'destructive' : 'secondary'}
                      size="sm"
                    >
                      {selectedStopover.importance}
                    </Badge>
                  </div>
                </div>
                <Text className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedStopover.description}
                </Text>
                {selectedStopover.resources.length > 0 && (
                  <div className="mt-3">
                    <Text className="text-sm font-medium mb-1">Resources</Text>
                    <div className="flex flex-wrap gap-1">
                      {selectedStopover.resources.map((resource, idx) => (
                        <Badge key={idx} variant="ghost" size="sm">
                          {resource}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Info Note */}
        <div className="mt-4 flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Info className="h-4 w-4 mt-0.5" />
          <Text className="text-xs">
            Migration patterns are based on historical data and may vary due to weather conditions,
            food availability, and environmental changes.
          </Text>
        </div>
      </Card>
    </div>
  );
};