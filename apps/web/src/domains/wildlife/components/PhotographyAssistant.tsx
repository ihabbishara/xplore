'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Aperture,
  Focus,
  Sun,
  Clock,
  Wind,
  Eye,
  AlertTriangle,
  ShieldCheck,
  Settings,
  Ruler,
  Compass,
  Info,
  ChevronRight,
  TreePine,
  Mountain,
  Waves,
  CheckCircle,
  XCircle,
  Zap,
  Cloud,
  CloudRain,
  Sunrise,
  Sunset,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { Tooltip } from '@/components/ui/Tooltip';
import { Select } from '@/components/ui/Select';
import {
  WildlifeSpecies,
  ActivityPeriod,
  WeatherConditions,
  HabitatType,
  BehaviorType,
  ACTIVITY_PERIOD_TIMES,
} from '../types/wildlife';
import { useWildlifeStore } from '../hooks/useWildlifeStore';

interface PhotographyAssistantProps {
  species: WildlifeSpecies;
  currentWeather?: WeatherConditions;
  onEquipmentSelect?: (equipment: EquipmentRecommendation) => void;
  className?: string;
}

interface EquipmentRecommendation {
  category: 'camera' | 'lens' | 'accessories';
  item: string;
  reason: string;
  priority: 'essential' | 'recommended' | 'optional';
  priceRange: string;
}

interface PhotographyTip {
  category: string;
  tip: string;
  icon: React.ReactNode;
  importance: 'high' | 'medium' | 'low';
}

const habitatIcons: Record<HabitatType, React.ReactNode> = {
  [HabitatType.FOREST]: <TreePine className="h-4 w-4" />,
  [HabitatType.GRASSLAND]: <Waves className="h-4 w-4" />,
  [HabitatType.WETLAND]: <Waves className="h-4 w-4" />,
  [HabitatType.MOUNTAIN]: <Mountain className="h-4 w-4" />,
  [HabitatType.DESERT]: <Sun className="h-4 w-4" />,
  [HabitatType.COASTAL]: <Waves className="h-4 w-4" />,
  [HabitatType.URBAN]: <Settings className="h-4 w-4" />,
  [HabitatType.ARCTIC]: <Cloud className="h-4 w-4" />,
  [HabitatType.MARINE]: <Waves className="h-4 w-4" />,
};

const weatherIcons = {
  clear: <Sun className="h-4 w-4" />,
  cloudy: <Cloud className="h-4 w-4" />,
  rain: <CloudRain className="h-4 w-4" />,
  fog: <Cloud className="h-4 w-4" />,
};

export const PhotographyAssistant: React.FC<PhotographyAssistantProps> = ({
  species,
  currentWeather,
  onEquipmentSelect,
  className = '',
}) => {
  const [selectedTab, setSelectedTab] = useState<'tips' | 'equipment' | 'settings' | 'ethics'>('tips');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [budget, setBudget] = useState<'budget' | 'mid-range' | 'professional'>('mid-range');
  
  const { getBestViewingTime } = useWildlifeStore();
  const bestTime = getBestViewingTime(species.id);

  const equipmentRecommendations = useMemo<EquipmentRecommendation[]>(() => {
    const baseRecommendations: EquipmentRecommendation[] = [
      {
        category: 'lens',
        item: `${species.photographyTips.minFocalLength}mm+ telephoto lens`,
        reason: `Maintain safe distance of ${species.photographyTips.recommendedDistance}m`,
        priority: 'essential',
        priceRange: budget === 'budget' ? '$500-1500' : budget === 'mid-range' ? '$1500-4000' : '$4000+',
      },
      {
        category: 'camera',
        item: 'Camera with fast autofocus',
        reason: `${species.commonName} can move quickly`,
        priority: 'essential',
        priceRange: budget === 'budget' ? '$800-1500' : budget === 'mid-range' ? '$1500-3000' : '$3000+',
      },
    ];

    // Add habitat-specific equipment
    if (species.preferredHabitats.includes(HabitatType.WETLAND)) {
      baseRecommendations.push({
        category: 'accessories',
        item: 'Waterproof camera cover',
        reason: 'Protection in wetland environments',
        priority: 'recommended',
        priceRange: '$50-150',
      });
    }

    if (species.activityPeriods.includes(ActivityPeriod.DAWN) || 
        species.activityPeriods.includes(ActivityPeriod.DUSK)) {
      baseRecommendations.push({
        category: 'camera',
        item: 'Camera with good low-light performance',
        reason: 'Active during dawn/dusk',
        priority: 'essential',
        priceRange: budget === 'budget' ? '$1000-2000' : budget === 'mid-range' ? '$2000-4000' : '$4000+',
      });
    }

    // Add accessories
    baseRecommendations.push(
      {
        category: 'accessories',
        item: 'Sturdy tripod',
        reason: 'Stability for telephoto shots',
        priority: 'essential',
        priceRange: '$200-600',
      },
      {
        category: 'accessories',
        item: 'Camouflage gear or hide',
        reason: 'Minimize disturbance',
        priority: 'recommended',
        priceRange: '$100-500',
      },
      {
        category: 'accessories',
        item: 'Bean bag support',
        reason: 'Vehicle window photography',
        priority: 'optional',
        priceRange: '$30-80',
      }
    );

    return baseRecommendations;
  }, [species, budget]);

  const photographyTips = useMemo<PhotographyTip[]>(() => {
    const tips: PhotographyTip[] = [];

    // Distance and approach tips
    tips.push({
      category: 'Approach',
      tip: `Maintain minimum distance of ${species.photographyTips.recommendedDistance}m`,
      icon: <Ruler className="h-4 w-4" />,
      importance: 'high',
    });

    // Behavioral tips
    species.photographyTips.behavioralCues.forEach(cue => {
      tips.push({
        category: 'Behavior',
        tip: cue,
        icon: <Eye className="h-4 w-4" />,
        importance: 'high',
      });
    });

    // Time-based tips
    if (species.photographyTips.bestTime.length > 0) {
      tips.push({
        category: 'Timing',
        tip: `Best during ${species.photographyTips.bestTime.join(', ')}`,
        icon: <Clock className="h-4 w-4" />,
        importance: 'medium',
      });
    }

    // Composition tips
    species.photographyTips.compositionTips.forEach(tip => {
      tips.push({
        category: 'Composition',
        tip: tip,
        icon: <Focus className="h-4 w-4" />,
        importance: 'medium',
      });
    });

    // Weather-specific tips
    if (currentWeather) {
      if (currentWeather.windSpeed > 20) {
        tips.push({
          category: 'Weather',
          tip: 'High wind - increase shutter speed to compensate for camera shake',
          icon: <Wind className="h-4 w-4" />,
          importance: 'medium',
        });
      }
      
      if (currentWeather.conditions === 'fog') {
        tips.push({
          category: 'Weather',
          tip: 'Foggy conditions can create atmospheric shots but reduce visibility',
          icon: <Cloud className="h-4 w-4" />,
          importance: 'low',
        });
      }
    }

    return tips;
  }, [species, currentWeather]);

  const cameraSettings = useMemo(() => {
    const settings = {
      shutterSpeed: {
        min: species.movementSpeed === 'fast' ? '1/1000s' : '1/500s',
        recommended: species.movementSpeed === 'fast' ? '1/2000s' : '1/1000s',
      },
      aperture: {
        portrait: 'f/5.6 - f/8',
        environmental: 'f/8 - f/11',
      },
      iso: {
        daylight: 'ISO 100-400',
        goldenHour: 'ISO 400-1600',
        lowLight: 'ISO 1600-6400',
      },
      focusMode: species.movementSpeed === 'fast' ? 'Continuous AF (AF-C)' : 'Single AF (AF-S)',
      meteringMode: 'Spot or Center-weighted',
    };

    return settings;
  }, [species]);

  const renderTipsTab = () => (
    <div className="space-y-4">
      {/* Current Conditions */}
      {currentWeather && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Current Conditions
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              {weatherIcons[currentWeather.conditions] || weatherIcons.clear}
              <Text>{currentWeather.conditions}</Text>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4" />
              <Text>{currentWeather.windSpeed} km/h wind</Text>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <Text>{currentWeather.visibility}km visibility</Text>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <Text>{currentWeather.temperature}°C</Text>
            </div>
          </div>
        </Card>
      )}

      {/* Photography Tips */}
      <div className="space-y-3">
        {photographyTips.map((tip, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className={`p-3 ${
              tip.importance === 'high' ? 'border-orange-200 dark:border-orange-800' : ''
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  tip.importance === 'high' ? 'bg-orange-100 dark:bg-orange-900/30' : 
                  'bg-gray-100 dark:bg-gray-800'
                }`}>
                  {tip.icon}
                </div>
                <div className="flex-1">
                  <Badge variant="outline" size="sm" className="mb-1">
                    {tip.category}
                  </Badge>
                  <Text className="text-sm">{tip.tip}</Text>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Best Time Indicator */}
      <Card className="p-4 bg-green-50 dark:bg-green-900/20">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Optimal Photography Times
        </h4>
        <div className="space-y-2">
          {species.photographyTips.bestTime.map(period => (
            <div key={period} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {period === ActivityPeriod.DAWN && <Sunrise className="h-4 w-4 text-orange-500" />}
                {period === ActivityPeriod.DUSK && <Sunset className="h-4 w-4 text-purple-500" />}
                {period === ActivityPeriod.MORNING && <Sun className="h-4 w-4 text-yellow-500" />}
                <Text className="capitalize">{period.replace('_', ' ')}</Text>
              </div>
              <Text className="text-sm text-gray-500">{getOptimalTime(period)}</Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderEquipmentTab = () => (
    <div className="space-y-4">
      {/* Budget Selector */}
      <div className="flex items-center gap-3 mb-4">
        <Text className="font-medium">Budget Level:</Text>
        <Select
          value={budget}
          onChange={(e) => setBudget(e.target.value as any)}
          className="w-40"
        >
          <option value="budget">Budget</option>
          <option value="mid-range">Mid-Range</option>
          <option value="professional">Professional</option>
        </Select>
      </div>

      {/* Equipment Recommendations */}
      <div className="space-y-3">
        {equipmentRecommendations.map((equipment, idx) => (
          <Card
            key={idx}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              equipment.priority === 'essential' ? 'border-blue-200 dark:border-blue-800' : ''
            }`}
            onClick={() => onEquipmentSelect?.(equipment)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="h-4 w-4" />
                  <Text className="font-medium">{equipment.item}</Text>
                  <Badge
                    variant={equipment.priority === 'essential' ? 'default' : 
                            equipment.priority === 'recommended' ? 'secondary' : 'outline'}
                    size="sm"
                  >
                    {equipment.priority}
                  </Badge>
                </div>
                <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {equipment.reason}
                </Text>
                <Text className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {equipment.priceRange}
                </Text>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </Card>
        ))}
      </div>

      {/* Habitat-Specific Gear */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">Habitat-Specific Recommendations</h4>
        <div className="space-y-2">
          {species.preferredHabitats.map(habitat => (
            <div key={habitat} className="flex items-center gap-3">
              {habitatIcons[habitat]}
              <Text className="text-sm capitalize">{habitat.replace('_', ' ')}</Text>
              <Text className="text-sm text-gray-500">
                {getHabitatGear(habitat)}
              </Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-4">
      {/* Experience Level Selector */}
      <div className="flex items-center gap-3 mb-4">
        <Text className="font-medium">Experience Level:</Text>
        <Select
          value={experienceLevel}
          onChange={(e) => setExperienceLevel(e.target.value as any)}
          className="w-40"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </Select>
      </div>

      {/* Camera Settings */}
      <Card className="p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Recommended Camera Settings
        </h4>
        
        <div className="space-y-3">
          {/* Shutter Speed */}
          <div>
            <Text className="text-sm font-medium mb-1">Shutter Speed</Text>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{cameraSettings.shutterSpeed.min}</Badge>
              <Text className="text-sm text-gray-500">minimum</Text>
              <Badge variant="secondary">{cameraSettings.shutterSpeed.recommended}</Badge>
              <Text className="text-sm text-gray-500">recommended</Text>
            </div>
          </div>

          {/* Aperture */}
          <div>
            <Text className="text-sm font-medium mb-1">Aperture</Text>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Text className="text-xs text-gray-500">Portrait</Text>
                <Badge variant="outline">{cameraSettings.aperture.portrait}</Badge>
              </div>
              <div>
                <Text className="text-xs text-gray-500">Environmental</Text>
                <Badge variant="outline">{cameraSettings.aperture.environmental}</Badge>
              </div>
            </div>
          </div>

          {/* ISO */}
          <div>
            <Text className="text-sm font-medium mb-1">ISO Range</Text>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Text className="text-sm">Daylight</Text>
                <Badge variant="outline" size="sm">{cameraSettings.iso.daylight}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <Text className="text-sm">Golden Hour</Text>
                <Badge variant="outline" size="sm">{cameraSettings.iso.goldenHour}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <Text className="text-sm">Low Light</Text>
                <Badge variant="outline" size="sm">{cameraSettings.iso.lowLight}</Badge>
              </div>
            </div>
          </div>

          {/* Focus & Metering */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Text className="text-sm font-medium mb-1">Focus Mode</Text>
              <Badge variant="secondary">{cameraSettings.focusMode}</Badge>
            </div>
            <div>
              <Text className="text-sm font-medium mb-1">Metering</Text>
              <Badge variant="secondary">{cameraSettings.meteringMode}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Settings Guide */}
      <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Quick Setup Guide
        </h4>
        <ol className="space-y-1 text-sm">
          <li>1. Set focus mode to {cameraSettings.focusMode}</li>
          <li>2. Start with {cameraSettings.shutterSpeed.recommended} shutter speed</li>
          <li>3. Use {cameraSettings.aperture.portrait} for close portraits</li>
          <li>4. Adjust ISO based on light conditions</li>
          <li>5. Enable image stabilization if available</li>
        </ol>
      </Card>
    </div>
  );

  const renderEthicsTab = () => (
    <div className="space-y-4">
      {/* Ethical Guidelines */}
      <Card className="p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Ethical Photography Guidelines
        </h4>
        <div className="space-y-3">
          {species.photographyTips.ethicalGuidelines.map((guideline, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <Text className="text-sm">{guideline}</Text>
            </div>
          ))}
        </div>
      </Card>

      {/* Do\'s and Don\'ts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-green-50 dark:bg-green-900/20">
          <h4 className="font-medium mb-3 text-green-700 dark:text-green-300">Do\'s</h4>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <Text className="text-sm">Respect minimum distance of {species.photographyTips.recommendedDistance}m</Text>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <Text className="text-sm">Use telephoto lenses to maintain distance</Text>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <Text className="text-sm">Move slowly and quietly</Text>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <Text className="text-sm">Leave if animal shows stress</Text>
            </li>
          </ul>
        </Card>

        <Card className="p-4 bg-red-50 dark:bg-red-900/20">
          <h4 className="font-medium mb-3 text-red-700 dark:text-red-300">Don\'ts</h4>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <Text className="text-sm">Never use bait or lures</Text>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <Text className="text-sm">Don\'t approach nests or young</Text>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <Text className="text-sm">Avoid flash photography</Text>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <Text className="text-sm">Don\'t share exact locations of rare species</Text>
            </li>
          </ul>
        </Card>
      </div>

      {/* Safety Warning */}
      {species.dangerLevel !== 'harmless' && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <Text className="font-medium text-yellow-800 dark:text-yellow-200">
                Safety Warning
              </Text>
              <Text className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {species.commonName} is classified as {species.dangerLevel}. 
                Always maintain safe distance and be prepared to retreat. 
                Never compromise safety for a photograph.
              </Text>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const getOptimalTime = (period: ActivityPeriod): string => {
    const times = ACTIVITY_PERIOD_TIMES[period];
    if (!times) return '';
    
    switch (period) {
      case ActivityPeriod.DAWN:
        return '05:30 - 06:30';
      case ActivityPeriod.MORNING:
        return '06:30 - 10:00';
      case ActivityPeriod.DUSK:
        return '17:30 - 19:00';
      default:
        return '';
    }
  };

  const getHabitatGear = (habitat: HabitatType): string => {
    const gearMap: Record<HabitatType, string> = {
      [HabitatType.FOREST]: 'Camo clothing, insect repellent',
      [HabitatType.WETLAND]: 'Waterproof gear, waders',
      [HabitatType.MOUNTAIN]: 'Sturdy boots, warm clothing',
      [HabitatType.DESERT]: 'Sun protection, water',
      [HabitatType.COASTAL]: 'Weather protection, lens cleaning kit',
      [HabitatType.GRASSLAND]: 'Ground blind, knee pads',
      [HabitatType.URBAN]: 'Discrete gear, permissions',
      [HabitatType.ARCTIC]: 'Extreme cold weather gear',
      [HabitatType.MARINE]: 'Waterproof housing, boat stability',
    };
    return gearMap[habitat] || 'Standard outdoor gear';
  };

  const tabs = [
    { id: 'tips', label: 'Tips', icon: <Info className="h-4 w-4" /> },
    { id: 'equipment', label: 'Equipment', icon: <Camera className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
    { id: 'ethics', label: 'Ethics', icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  return (
    <div className={className}>
      <Card className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photography Assistant
          </h3>
          <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Expert guidance for photographing {species.commonName}
          </Text>
        </div>

        {/* Tabs */}
        <Tabs
          value={selectedTab}
          onValueChange={(value) => setSelectedTab(value as any)}
          className="mb-6"
        >
          <div className="flex gap-2 border-b">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
                  selectedTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </Tabs>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {selectedTab === 'tips' && renderTipsTab()}
            {selectedTab === 'equipment' && renderEquipmentTab()}
            {selectedTab === 'settings' && renderSettingsTab()}
            {selectedTab === 'ethics' && renderEthicsTab()}
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  );
};