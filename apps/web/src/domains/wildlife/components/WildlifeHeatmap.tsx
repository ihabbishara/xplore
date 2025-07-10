'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { Clock } from 'lucide-react';
import { Filter } from 'lucide-react';
import { Info } from 'lucide-react';
import { Layers } from 'lucide-react';
import { Eye } from 'lucide-react';
import { Calendar } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import { Users } from 'lucide-react';
import { MapPin } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { ZoomIn } from 'lucide-react';
import { ZoomOut } from 'lucide-react';
import { Maximize2 } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import { Download } from 'lucide-react';
import { Settings } from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { Switch } from '@/components/ui/Switch';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  WildlifeSighting,
  WildlifeSpecies,
  HabitatType,
  ActivityPeriod,
  ConservationStatus,
  Coordinates,
} from '../types/wildlife';
import { useWildlifeStore } from '../hooks/useWildlifeStore';

interface WildlifeHeatmapProps {
  species?: WildlifeSpecies;
  center?: Coordinates;
  radius?: number;
  timeRange?: '24h' | '7d' | '30d' | '90d' | '1y';
  onCellClick?: (cell: HeatmapCell) => void;
  className?: string;
}

interface HeatmapCell {
  id: string;
  coordinates: Coordinates;
  density: number;
  sightingCount: number;
  speciesCount: number;
  lastSighting?: Date;
  dominantSpecies?: string;
  conservationPriority: number;
}

interface HeatmapLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  colorScale: string[];
}

const defaultColorScales = {
  density: ['#FEF3C7', '#FDE047', '#FACC15', '#F59E0B', '#EF4444', '#DC2626'],
  conservation: ['#D1FAE5', '#6EE7B7', '#34D399', '#10B981', '#059669', '#047857'],
  activity: ['#E0E7FF', '#A5B4FC', '#818CF8', '#6366F1', '#4F46E5', '#4338CA'],
};

const timeRangeOptions = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 3 Months' },
  { value: '1y', label: 'Last Year' },
];

export const WildlifeHeatmap: React.FC<WildlifeHeatmapProps> = ({
  species,
  center = { lat: 0, lng: 0 },
  radius = 50,
  timeRange = '30d',
  onCellClick,
  className = '',
}) => {
  const [selectedLayer, setSelectedLayer] = useState<'density' | 'conservation' | 'activity'>('density');
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);
  
  const {
    sightings,
    loadSightings,
    species: allSpecies,
    loadSpecies,
  } = useWildlifeStore();

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      loadSightings({ timeRange: selectedTimeRange }),
      loadSpecies(),
    ]).finally(() => setIsLoading(false));
  }, [selectedTimeRange, loadSightings, loadSpecies]);

  const filteredSightings = useMemo(() => {
    let filtered = [...sightings];
    
    // Filter by species if specified
    if (species) {
      filtered = filtered.filter(s => s.speciesId === species.id);
    }
    
    // Filter by time range
    const now = new Date();
    const cutoffDate = selectedTimeRange === '24h' ? subDays(now, 1) :
                       selectedTimeRange === '7d' ? subDays(now, 7) :
                       selectedTimeRange === '30d' ? subMonths(now, 1) :
                       selectedTimeRange === '90d' ? subMonths(now, 3) :
                       subMonths(now, 12);
    
    filtered = filtered.filter(s => new Date(s.timestamp) >= cutoffDate);
    
    return filtered;
  }, [sightings, species, selectedTimeRange]);

  const heatmapData = useMemo(() => {
    const gridSize = 0.1; // Degrees per cell
    // Create Map using the global constructor to avoid webpack optimization issues
    const MapConstructor = globalThis.Map;
    const cells = new MapConstructor<string, HeatmapCell>();
    
    filteredSightings.forEach(sighting => {
      const cellLat = Math.floor(sighting.location.lat / gridSize) * gridSize;
      const cellLng = Math.floor(sighting.location.lng / gridSize) * gridSize;
      const cellId = `${cellLat},${cellLng}`;
      
      if (!cells.has(cellId)) {
        cells.set(cellId, {
          id: cellId,
          coordinates: { lat: cellLat, lng: cellLng },
          density: 0,
          sightingCount: 0,
          speciesCount: 0,
          conservationPriority: 0,
        });
      }
      
      const cell = cells.get(cellId)!;
      cell.sightingCount++;
      cell.density = Math.log(cell.sightingCount + 1) * 10; // Logarithmic scale
      
      // Update last sighting
      if (!cell.lastSighting || new Date(sighting.timestamp) > cell.lastSighting) {
        cell.lastSighting = new Date(sighting.timestamp);
        cell.dominantSpecies = sighting.species;
      }
      
      // Calculate conservation priority
      const speciesData = allSpecies.find(s => s.id === sighting.speciesId);
      if (speciesData) {
        const statusWeight = {
          [ConservationStatus.EXTINCT]: 0,
          [ConservationStatus.EXTINCT_IN_WILD]: 10,
          [ConservationStatus.CRITICALLY_ENDANGERED]: 9,
          [ConservationStatus.ENDANGERED]: 8,
          [ConservationStatus.VULNERABLE]: 7,
          [ConservationStatus.NEAR_THREATENED]: 6,
          [ConservationStatus.LEAST_CONCERN]: 3,
          [ConservationStatus.DATA_DEFICIENT]: 5,
          [ConservationStatus.NOT_EVALUATED]: 4,
        };
        cell.conservationPriority = Math.max(
          cell.conservationPriority,
          statusWeight[speciesData.conservationStatus] || 0
        );
      }
    });
    
    return Array.from(cells.values());
  }, [filteredSightings, allSpecies]);

  const getColorForCell = (cell: HeatmapCell): string => {
    const colorScale = defaultColorScales[selectedLayer];
    let value = 0;
    
    switch (selectedLayer) {
      case 'density':
        value = cell.density / 100;
        break;
      case 'conservation':
        value = cell.conservationPriority / 10;
        break;
      case 'activity':
        value = cell.sightingCount / 50;
        break;
    }
    
    const index = Math.min(Math.floor(value * colorScale.length), colorScale.length - 1);
    return colorScale[Math.max(0, index)];
  };

  const handleCellClick = (cell: HeatmapCell) => {
    setSelectedCell(cell);
    if (onCellClick) {
      onCellClick(cell);
    }
  };

  const renderHeatmapGrid = () => {
    // Simplified grid visualization - in real app would use Canvas or WebGL
    const gridCells = heatmapData.slice(0, 100); // Limit for performance
    
    return (
      <div className="relative w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        {/* Grid cells */}
        <div className="absolute inset-0" style={{ transform: `scale(${zoomLevel})` }}>
          {gridCells.map(cell => {
            const x = (cell.coordinates.lng - center.lng + radius) * (100 / (radius * 2));
            const y = (center.lat + radius - cell.coordinates.lat) * (100 / (radius * 2));
            
            return (
              <Tooltip
                key={cell.id}
                content={
                  <div className="text-sm">
                    <Text className="font-medium">{cell.dominantSpecies || 'Multiple Species'}</Text>
                    <Text className="text-gray-400">{cell.sightingCount} sightings</Text>
                  </div>
                }
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleCellClick(cell)}
                  className="absolute cursor-pointer transition-all"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${100 / radius}%`,
                    height: `${100 / radius}%`,
                    backgroundColor: getColorForCell(cell),
                    opacity: 0.8,
                    border: showGrid ? '1px solid rgba(0,0,0,0.1)' : 'none',
                  }}
                />
              </Tooltip>
            );
          })}
        </div>

        {/* Center marker */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <MapPin className="h-6 w-6 text-blue-500" />
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    );
  };

  const renderLegend = () => {
    const colorScale = defaultColorScales[selectedLayer];
    const labels = selectedLayer === 'density' ? ['Low', 'High'] :
                   selectedLayer === 'conservation' ? ['Least Concern', 'Critical'] :
                   ['Low Activity', 'High Activity'];
    
    return (
      <div className="flex items-center gap-2">
        <Text className="text-sm font-medium">{labels[0]}</Text>
        <div className="flex h-6">
          {colorScale.map((color, idx) => (
            <div
              key={idx}
              className="w-8"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <Text className="text-sm font-medium">{labels[1]}</Text>
      </div>
    );
  };

  const renderStatistics = () => {
    const stats = {
      totalSightings: filteredSightings.length,
      uniqueSpecies: new Set(filteredSightings.map(s => s.speciesId)).size,
      hotspots: heatmapData.filter(c => c.density > 50).length,
      conservationAreas: heatmapData.filter(c => c.conservationPriority > 7).length,
    };
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <Eye className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <Text className="text-2xl font-bold">{stats.totalSightings}</Text>
          <Text className="text-sm text-gray-500">Total Sightings</Text>
        </Card>
        
        <Card className="p-4 text-center">
          <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <Text className="text-2xl font-bold">{stats.uniqueSpecies}</Text>
          <Text className="text-sm text-gray-500">Species</Text>
        </Card>
        
        <Card className="p-4 text-center">
          <Activity className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <Text className="text-2xl font-bold">{stats.hotspots}</Text>
          <Text className="text-sm text-gray-500">Hotspots</Text>
        </Card>
        
        <Card className="p-4 text-center">
          <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
          <Text className="text-2xl font-bold">{stats.conservationAreas}</Text>
          <Text className="text-sm text-gray-500">Priority Areas</Text>
        </Card>
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
              <Map className="h-5 w-5" />
              Wildlife Density Heatmap
            </h3>
            <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {species ? `${species.commonName} distribution` : 'All species distribution'}
            </Text>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <Select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="w-32"
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsLoading(true);
                loadSightings({ timeRange: selectedTimeRange }).finally(() => setIsLoading(false));
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Layer Selector */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={selectedLayer === 'density' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedLayer('density')}
            className="gap-2"
          >
            <Layers className="h-4 w-4" />
            Density
          </Button>
          <Button
            variant={selectedLayer === 'conservation' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedLayer('conservation')}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Conservation
          </Button>
          <Button
            variant={selectedLayer === 'activity' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedLayer('activity')}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            Activity
          </Button>
        </div>

        {/* Heatmap */}
        <div className="mb-4">
          {renderHeatmapGrid()}
          
          {/* Map Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={showGrid}
                  onCheckedChange={setShowGrid}
                />
                Show Grid
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={showLabels}
                  onCheckedChange={setShowLabels}
                />
                Show Labels
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Text className="text-sm w-12 text-center">{Math.round(zoomLevel * 100)}%</Text>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
                disabled={zoomLevel >= 2}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel(1)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between">
            <Text className="font-medium">Legend</Text>
            {renderLegend()}
          </div>
        </Card>

        {/* Statistics */}
        <div className="mb-4">
          {renderStatistics()}
        </div>

        {/* Selected Cell Details */}
        {selectedCell && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Selected Area Details
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Text className="text-gray-500">Coordinates</Text>
                <Text className="font-medium">
                  {selectedCell.coordinates.lat.toFixed(2)}, {selectedCell.coordinates.lng.toFixed(2)}
                </Text>
              </div>
              <div>
                <Text className="text-gray-500">Sightings</Text>
                <Text className="font-medium">{selectedCell.sightingCount}</Text>
              </div>
              <div>
                <Text className="text-gray-500">Last Activity</Text>
                <Text className="font-medium">
                  {selectedCell.lastSighting ? 
                    formatDistanceToNow(selectedCell.lastSighting, { addSuffix: true }) : 
                    'No recent activity'}
                </Text>
              </div>
              <div>
                <Text className="text-gray-500">Dominant Species</Text>
                <Text className="font-medium">{selectedCell.dominantSpecies || 'Various'}</Text>
              </div>
            </div>
          </Card>
        )}

        {/* Info Note */}
        <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Info className="h-4 w-4 mt-0.5" />
          <Text className="text-xs">
            Heatmap shows wildlife density based on community sightings. 
            Darker areas indicate higher activity. Data is updated in real-time.
          </Text>
        </div>
      </Card>
    </div>
  );
};