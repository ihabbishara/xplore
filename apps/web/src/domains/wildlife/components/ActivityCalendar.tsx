'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Sun,
  Moon,
  Cloud,
  TrendingUp,
  Info,
  ChevronLeft,
  ChevronRight,
  Eye,
  Activity,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { Progress } from '@/components/ui/Progress';
import {
  WildlifeSpecies,
  ActivityPattern,
  ActivityPeriod,
  Season,
  ACTIVITY_PERIOD_TIMES,
} from '../types/wildlife';
import { useWildlifeStore } from '../hooks/useWildlifeStore';

interface ActivityCalendarProps {
  species: WildlifeSpecies;
  onDateSelect?: (date: Date, predictions: ActivityPrediction[]) => void;
  showLegend?: boolean;
  className?: string;
}

interface ActivityPrediction {
  period: ActivityPeriod;
  probability: number;
  factors: string[];
  optimalTime?: string;
}

const periodColors: Record<ActivityPeriod, string> = {
  [ActivityPeriod.DAWN]: 'bg-orange-400',
  [ActivityPeriod.MORNING]: 'bg-yellow-400',
  [ActivityPeriod.MIDDAY]: 'bg-yellow-500',
  [ActivityPeriod.AFTERNOON]: 'bg-orange-500',
  [ActivityPeriod.DUSK]: 'bg-purple-500',
  [ActivityPeriod.NIGHT]: 'bg-indigo-600',
  [ActivityPeriod.ALL_DAY]: 'bg-blue-500',
};

const seasonIcons = {
  [Season.SPRING]: '🌸',
  [Season.SUMMER]: '☀️',
  [Season.FALL]: '🍂',
  [Season.WINTER]: '❄️',
  [Season.YEAR_ROUND]: '🌍',
};

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  species,
  onDateSelect,
  showLegend = true,
  className = '',
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  
  const { activityPatterns, loadActivityPatterns, getCurrentSeasonActivity } = useWildlifeStore();
  
  const patterns = activityPatterns[species.id] || [];
  const seasonActivity = getCurrentSeasonActivity(species.id);

  React.useEffect(() => {
    if (!patterns.length) {
      loadActivityPatterns(species.id);
    }
  }, [species.id, patterns.length, loadActivityPatterns]);

  const getCurrentSeason = (date: Date): Season => {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return Season.SPRING;
    if (month >= 5 && month <= 7) return Season.SUMMER;
    if (month >= 8 && month <= 10) return Season.FALL;
    return Season.WINTER;
  };

  const getDayPredictions = (date: Date): ActivityPrediction[] => {
    const season = getCurrentSeason(date);
    const dayOfWeek = date.getDay();
    
    // Get seasonal behavior for this date
    const seasonalBehavior = species.seasonalBehavior.find(b => b.season === season);
    
    return species.activityPeriods.map(period => {
      let baseProbability = 0.5;
      const factors: string[] = [];
      
      // Find pattern for this period if available
      const pattern = patterns.find(p => p.period === period);
      if (pattern) {
        baseProbability = pattern.probability;
        
        // Apply seasonal variation
        if (pattern.seasonalVariation[season]) {
          baseProbability = pattern.seasonalVariation[season];
          factors.push(`${season} activity`);
        }
        
        // Apply weather impacts (simulated)
        pattern.weatherImpact?.forEach(impact => {
          if (impact.impact === 'positive') {
            baseProbability *= 1.1;
            factors.push(impact.factor);
          }
        });
        
        // Moon phase impact for nocturnal periods
        if (period === ActivityPeriod.NIGHT && pattern.moonPhaseImpact) {
          // Simulate moon phase
          const moonPhase = (date.getDate() % 30) / 30; // Simple approximation
          if (moonPhase < 0.1 || moonPhase > 0.9) {
            baseProbability *= pattern.moonPhaseImpact.newMoon;
            factors.push('New moon');
          } else if (moonPhase > 0.4 && moonPhase < 0.6) {
            baseProbability *= pattern.moonPhaseImpact.fullMoon;
            factors.push('Full moon');
          }
        }
      }
      
      // Weekend adjustment (some species are less active when more humans around)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        if (species.dangerLevel !== 'harmless') {
          baseProbability *= 0.8;
          factors.push('Weekend - more human activity');
        }
      }
      
      // Seasonal behavior boost
      if (seasonalBehavior?.behavior.some(b => b.toLowerCase().includes('active'))) {
        baseProbability *= 1.2;
        factors.push('Peak season');
      }
      
      return {
        period,
        probability: Math.min(Math.max(baseProbability, 0), 1),
        factors,
        optimalTime: getOptimalTime(period),
      };
    });
  };

  const getOptimalTime = (period: ActivityPeriod): string => {
    const times = ACTIVITY_PERIOD_TIMES[period];
    if (!times) return '';
    
    // Convert relative times to actual times (simplified)
    switch (period) {
      case ActivityPeriod.DAWN:
        return '05:30 - 06:30';
      case ActivityPeriod.MORNING:
        return '06:30 - 11:00';
      case ActivityPeriod.MIDDAY:
        return '11:00 - 14:00';
      case ActivityPeriod.AFTERNOON:
        return '14:00 - 17:30';
      case ActivityPeriod.DUSK:
        return '17:30 - 19:00';
      case ActivityPeriod.NIGHT:
        return '19:00 - 05:30';
      case ActivityPeriod.ALL_DAY:
        return 'Any time';
      default:
        return '';
    }
  };

  const getDayActivityScore = (date: Date): number => {
    const predictions = getDayPredictions(date);
    return predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length;
  };

  const getActivityColor = (score: number): string => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-green-400';
    if (score >= 0.4) return 'bg-yellow-400';
    if (score >= 0.2) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const predictions = getDayPredictions(date);
    if (onDateSelect) {
      onDateSelect(date, predictions);
    }
  };

  const selectedDatePredictions = selectedDate ? getDayPredictions(selectedDate) : [];

  return (
    <div className={className}>
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Activity Calendar
            </h3>
            <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {species.commonName} activity predictions
            </Text>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Text className="font-medium w-32 text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Current Season Info */}
        <Card className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{seasonIcons[getCurrentSeason(currentMonth)]}</span>
              <div>
                <Text className="font-medium">
                  {getCurrentSeason(currentMonth)} Season
                </Text>
                {species.seasonalBehavior.find(b => b.season === getCurrentSeason(currentMonth)) && (
                  <Text className="text-sm text-gray-600 dark:text-gray-400">
                    {species.seasonalBehavior.find(b => b.season === getCurrentSeason(currentMonth))?.behavior[0]}
                  </Text>
                )}
              </div>
            </div>
            <Badge variant="secondary">
              Best viewing: {species.activityPeriods[0]}
            </Badge>
          </div>
        </Card>

        {/* Calendar Grid */}
        <div className="mb-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                {day}
              </Text>
            ))}
          </div>
          
          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for alignment */}
            {Array.from({ length: monthDays[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            
            {/* Month days */}
            {monthDays.map(day => {
              const activityScore = getDayActivityScore(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              
              return (
                <Tooltip
                  key={day.toISOString()}
                  content={
                    <div className="text-sm">
                      <Text className="font-medium">
                        {format(day, 'MMMM d, yyyy')}
                      </Text>
                      <Text className="text-gray-400">
                        Activity: {Math.round(activityScore * 100)}%
                      </Text>
                    </div>
                  }
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDateClick(day)}
                    onMouseEnter={() => setHoveredDate(day)}
                    onMouseLeave={() => setHoveredDate(null)}
                    className={`
                      relative aspect-square rounded-lg p-1 transition-all
                      ${isSelected ? 'ring-2 ring-primary' : ''}
                      ${isToday ? 'ring-2 ring-blue-500' : ''}
                      hover:shadow-md
                    `}
                  >
                    <div
                      className={`
                        w-full h-full rounded flex items-center justify-center
                        ${getActivityColor(activityScore)} text-white
                        ${isSelected ? 'font-bold' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </div>
                    
                    {/* Activity indicator dots */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5 p-0.5">
                      {getDayPredictions(day).slice(0, 3).map((pred, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 rounded-full ${
                            pred.probability > 0.7 ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </motion.button>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activity Predictions for {format(selectedDate, 'MMMM d, yyyy')}
                </h4>
                
                <div className="space-y-3">
                  {selectedDatePredictions
                    .sort((a, b) => b.probability - a.probability)
                    .map(prediction => (
                      <div key={prediction.period} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${periodColors[prediction.period]}`} />
                            <Text className="font-medium capitalize">
                              {prediction.period.replace('_', ' ')}
                            </Text>
                            {prediction.optimalTime && (
                              <Text className="text-sm text-gray-500">
                                ({prediction.optimalTime})
                              </Text>
                            )}
                          </div>
                          <Badge
                            variant={prediction.probability > 0.7 ? 'secondary' : 'outline'}
                            className={prediction.probability > 0.7 ? 'bg-green-100 text-green-700' : ''}
                          >
                            {Math.round(prediction.probability * 100)}%
                          </Badge>
                        </div>
                        
                        <Progress value={prediction.probability * 100} className="h-2" />
                        
                        {prediction.factors.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {prediction.factors.map((factor, i) => (
                              <Badge key={i} variant="ghost" size="sm">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
                
                {/* Best Time Summary */}
                {selectedDatePredictions.some(p => p.probability > 0.7) && (
                  <Card className="mt-4 p-3 bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-start gap-2">
                      <Eye className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <Text className="font-medium text-green-800 dark:text-green-200">
                          Best Viewing Time
                        </Text>
                        <Text className="text-sm text-green-700 dark:text-green-300">
                          {selectedDatePredictions
                            .filter(p => p.probability > 0.7)
                            .map(p => p.period)
                            .join(', ')}
                        </Text>
                      </div>
                    </div>
                  </Card>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Legend */}
        {showLegend && (
          <div className="mt-6 pt-6 border-t">
            <Text className="text-sm font-medium mb-3">Activity Level Legend</Text>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {[
                  { score: 0.8, label: 'Excellent' },
                  { score: 0.6, label: 'Good' },
                  { score: 0.4, label: 'Fair' },
                  { score: 0.2, label: 'Poor' },
                  { score: 0, label: 'Unlikely' },
                ].map(({ score, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${getActivityColor(score)}`} />
                    <Text className="text-xs text-gray-600 dark:text-gray-400">{label}</Text>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-400" />
                <Text className="text-xs text-gray-500">
                  Based on historical data and environmental factors
                </Text>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};