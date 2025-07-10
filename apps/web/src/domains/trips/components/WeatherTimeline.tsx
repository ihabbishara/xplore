'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LocationSearchResult } from '@xplore/shared';
import { weatherService } from '@/domains/weather/services/weatherService';
import { WeatherRangeSummary, DailyWeather } from '@/domains/weather/types/weather.types';
import { useWeatherForecast } from '@/domains/weather/hooks/useWeather';
import { TripDay } from './Timeline';

// Workaround for React version compatibility
const MotionDiv = motion.div as any;

interface WeatherTimelineProps {
  destinations: LocationSearchResult[];
  tripDays: TripDay[];
  selectedDay?: string | null;
  onDayClick?: (dayId: string) => void;
  className?: string;
}

interface DayWeatherData {
  dayId: string;
  date: Date;
  destinations: LocationSearchResult[];
  weather: Map<string, DailyWeather>; // destinationId -> weather
  activities: string[];
  weatherSummary: {
    avgTemp: number;
    conditions: string[];
    rainProbability: number;
    recommendations: string[];
  };
}

const WeatherIcon: React.FC<{ 
  icon: string; 
  condition: string; 
  size?: 'sm' | 'md' | 'lg' 
}> = ({ icon, condition, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <img
      src={weatherService.getWeatherIconUrl(icon, '2x')}
      alt={condition}
      className={`${sizeClasses[size]} flex-shrink-0`}
      title={condition}
    />
  );
};

const WeatherCard: React.FC<{
  destination: LocationSearchResult;
  weather: DailyWeather;
  isCompact?: boolean;
}> = ({ destination, weather, isCompact = false }) => {
  if (isCompact) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-gray-200">
        <WeatherIcon icon={weather.icon} condition={weather.condition} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-900 truncate">{destination.name}</div>
          <div className="text-xs text-gray-500">
            {weatherService.formatTemperature(weather.temp.max)}° / {weatherService.formatTemperature(weather.temp.min)}°
          </div>
        </div>
        {weather.precipitationProbability && weather.precipitationProbability > 30 && (
          <div className="text-xs text-blue-600">
            {Math.round(weather.precipitationProbability)}%
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-gray-900 text-sm truncate">{destination.name}</div>
        <WeatherIcon icon={weather.icon} condition={weather.condition} size="sm" />
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-900">
            {weatherService.formatTemperature(weather.temp.max)}°
          </span>
          <span className="text-gray-500">
            {weatherService.formatTemperature(weather.temp.min)}°
          </span>
        </div>
        
        {weather.precipitationProbability && weather.precipitationProbability > 0 && (
          <div className="flex items-center space-x-1 text-blue-600">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3.5a1.5 1.5 0 00-1.5 1.5v1a3 3 0 00-3 3v5a3 3 0 003 3h3a3 3 0 003-3V9a3 3 0 00-3-3V5a1.5 1.5 0 00-1.5-1.5z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">{Math.round(weather.precipitationProbability)}%</span>
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-500">
        {weather.conditionDescription}
      </div>
    </div>
  );
};

const WeatherRecommendations: React.FC<{ recommendations: string[] }> = ({ recommendations }) => {
  if (recommendations.length === 0) return null;

  return (
    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <h4 className="text-sm font-medium text-blue-900 mb-2">Weather Recommendations</h4>
      <ul className="space-y-1">
        {recommendations.map((rec, index) => (
          <li key={index} className="text-sm text-blue-800 flex items-start">
            <span className="mr-2">•</span>
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const WeatherTimeline: React.FC<WeatherTimelineProps> = ({
  destinations,
  tripDays,
  selectedDay,
  onDayClick,
  className = ''
}) => {
  const [weatherData, setWeatherData] = useState<Map<string, Map<string, DailyWeather>>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch weather data for all destinations
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (destinations.length === 0) return;

      setLoading(true);
      setError(null);

      try {
        const weatherMap = new Map<string, Map<string, DailyWeather>>();

        const promises = destinations.map(async (destination) => {
          try {
            const forecast = await weatherService.getWeatherForecast(
              destination.coordinates.lat,
              destination.coordinates.lng,
              14
            );
            
            const destWeatherMap = new Map<string, DailyWeather>();
            forecast.daily.forEach(day => {
              const dateKey = day.date.toISOString().split('T')[0];
              destWeatherMap.set(dateKey, day);
            });
            
            weatherMap.set(destination.id, destWeatherMap);
          } catch (err) {
            console.error(`Error fetching weather for ${destination.name}:`, err);
          }
        });

        await Promise.all(promises);
        setWeatherData(weatherMap);
      } catch (err) {
        setError('Failed to load weather data');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [destinations]);

  // Process trip days with weather data
  const processedDays = useMemo<DayWeatherData[]>(() => {
    return tripDays.map(day => {
      const dayDestinations = destinations.filter(dest => 
        day.destinations.includes(dest.id)
      );
      
      const dayWeather = new Map<string, DailyWeather>();
      const dateKey = day.date.toISOString().split('T')[0];
      
      let totalTemp = 0;
      let tempCount = 0;
      let totalRain = 0;
      let rainCount = 0;
      const conditions: string[] = [];
      const recommendations: string[] = [];

      dayDestinations.forEach(dest => {
        const destWeatherMap = weatherData.get(dest.id);
        if (destWeatherMap) {
          const weather = destWeatherMap.get(dateKey);
          if (weather) {
            dayWeather.set(dest.id, weather);
            totalTemp += weather.temp.max;
            tempCount++;
            
            if (weather.precipitationProbability) {
              totalRain += weather.precipitationProbability;
              rainCount++;
            }
            
            if (!conditions.includes(weather.condition)) {
              conditions.push(weather.condition);
            }
          }
        }
      });

      // Generate recommendations
      const avgTemp = tempCount > 0 ? totalTemp / tempCount : 0;
      const avgRain = rainCount > 0 ? totalRain / rainCount : 0;

      if (avgRain > 70) {
        recommendations.push('High chance of rain - pack umbrella and waterproof gear');
      } else if (avgRain > 30) {
        recommendations.push('Possible rain - consider indoor activities as backup');
      }

      if (avgTemp < 10) {
        recommendations.push('Cold weather - dress warmly and plan indoor activities');
      } else if (avgTemp > 30) {
        recommendations.push('Hot weather - stay hydrated and seek shade during midday');
      }

      if (conditions.some(c => c.toLowerCase().includes('clear') || c.toLowerCase().includes('sunny'))) {
        recommendations.push('Great weather for outdoor activities and sightseeing');
      }

      return {
        dayId: day.id,
        date: day.date,
        destinations: dayDestinations,
        weather: dayWeather,
        activities: day.activities,
        weatherSummary: {
          avgTemp,
          conditions,
          rainProbability: avgRain,
          recommendations
        }
      };
    });
  }, [tripDays, destinations, weatherData]);

  if (loading) {
    return (
      <div className={`${className} p-6`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} p-6`}>
        <div className="text-center text-red-600">
          <p className="text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} p-6`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Weather Timeline</h3>
        <p className="text-sm text-gray-600">
          Weather forecasts for your trip destinations
        </p>
      </div>

      <div className="space-y-6">
        {processedDays.map((dayData, index) => (
          <MotionDiv
            key={dayData.dayId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`border rounded-lg transition-all duration-200 ${
              selectedDay === dayData.dayId
                ? 'border-primary-300 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div
              className="p-4 cursor-pointer"
              onClick={() => onDayClick?.(dayData.dayId)}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {dayData.date.toLocaleDateString('en-US', { weekday: 'long' })}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {dayData.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  {dayData.weatherSummary.avgTemp > 0 && (
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">
                        {weatherService.formatTemperature(dayData.weatherSummary.avgTemp)}
                      </span>
                    </div>
                  )}
                  
                  {dayData.weatherSummary.rainProbability > 0 && (
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3.5a1.5 1.5 0 00-1.5 1.5v1a3 3 0 00-3 3v5a3 3 0 003 3h3a3 3 0 003-3V9a3 3 0 00-3-3V5a1.5 1.5 0 00-1.5-1.5z" clipRule="evenodd" />
                      </svg>
                      <span className="text-blue-600">
                        {Math.round(dayData.weatherSummary.rainProbability)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Weather by Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {dayData.destinations.map(dest => {
                  const weather = dayData.weather.get(dest.id);
                  if (!weather) return null;
                  
                  return (
                    <WeatherCard
                      key={dest.id}
                      destination={dest}
                      weather={weather}
                      isCompact={dayData.destinations.length > 2}
                    />
                  );
                })}
              </div>

              {/* Weather Recommendations */}
              <WeatherRecommendations recommendations={dayData.weatherSummary.recommendations} />
            </div>
          </MotionDiv>
        ))}
      </div>
    </div>
  );
};