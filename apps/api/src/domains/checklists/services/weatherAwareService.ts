import { PrismaClient } from '@prisma/client';
import { 
  WeatherBasedSuggestion,
  CreateChecklistItemDto,
  ChecklistItemCategory,
  ChecklistItemPriority
} from '../types/checklist.types';
import { WeatherService } from '../../weather/services/weatherService';

export class WeatherAwareService {
  private weatherService: WeatherService;

  constructor(private prisma: PrismaClient) {
    this.weatherService = new WeatherService();
  }

  async getWeatherBasedSuggestions(
    tripId: string,
    checklistId: string
  ): Promise<WeatherBasedSuggestion[]> {
    // Get trip destinations
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        destinations: {
          include: {
            location: true
          }
        }
      }
    });

    if (!trip) {
      return [];
    }

    const suggestions: WeatherBasedSuggestion[] = [];

    // Analyze weather for each destination
    for (const destination of trip.destinations) {
      if (!destination.location) continue;

      try {
        // Get weather forecast for the destination dates
        const weather = await this.weatherService.getWeatherForLocation(
          destination.location.latitude,
          destination.location.longitude,
          destination.arrivalDate,
          destination.departureDate
        );

        // Generate suggestions based on weather conditions
        const weatherSuggestions = this.generateWeatherSuggestions(
          weather,
          destination.location.name || 'Destination'
        );

        if (weatherSuggestions.items.length > 0) {
          suggestions.push(weatherSuggestions);
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
      }
    }

    return suggestions;
  }

  private generateWeatherSuggestions(
    weather: any,
    locationName: string
  ): WeatherBasedSuggestion {
    const items: CreateChecklistItemDto[] = [];
    const conditions = new Set<string>();
    let minTemp = Infinity;
    let maxTemp = -Infinity;
    let totalPrecipitation = 0;

    // Analyze weather data
    if (weather.daily) {
      weather.daily.forEach((day: any) => {
        if (day.temp) {
          minTemp = Math.min(minTemp, day.temp.min);
          maxTemp = Math.max(maxTemp, day.temp.max);
        }
        if (day.weather && day.weather[0]) {
          conditions.add(day.weather[0].main);
        }
        if (day.rain) {
          totalPrecipitation += day.rain;
        }
        if (day.snow) {
          totalPrecipitation += day.snow;
        }
      });
    }

    // Temperature-based suggestions
    if (minTemp < 10) {
      // Cold weather items
      items.push({
        name: 'Warm jacket or coat',
        category: ChecklistItemCategory.CLOTHING,
        priority: ChecklistItemPriority.HIGH,
        metadata: {
          weatherDependent: true,
          notes: `Expected temperatures as low as ${Math.round(minTemp)}°C`
        }
      });

      items.push({
        name: 'Thermal underwear',
        category: ChecklistItemCategory.CLOTHING,
        priority: ChecklistItemPriority.MEDIUM,
        metadata: { weatherDependent: true }
      });

      items.push({
        name: 'Warm hat and gloves',
        category: ChecklistItemCategory.CLOTHING,
        priority: ChecklistItemPriority.MEDIUM,
        metadata: { weatherDependent: true }
      });
    }

    if (maxTemp > 25) {
      // Hot weather items
      items.push({
        name: 'Lightweight, breathable clothing',
        category: ChecklistItemCategory.CLOTHING,
        priority: ChecklistItemPriority.HIGH,
        metadata: {
          weatherDependent: true,
          notes: `Expected temperatures up to ${Math.round(maxTemp)}°C`
        }
      });

      items.push({
        name: 'Extra sunscreen (SPF 30+)',
        category: ChecklistItemCategory.HEALTH,
        priority: ChecklistItemPriority.HIGH,
        metadata: { weatherDependent: true }
      });

      items.push({
        name: 'Cooling towel or portable fan',
        category: ChecklistItemCategory.GEAR,
        priority: ChecklistItemPriority.LOW,
        metadata: { weatherDependent: true }
      });
    }

    // Rain/precipitation suggestions
    if (conditions.has('Rain') || totalPrecipitation > 10) {
      items.push({
        name: 'Rain jacket or waterproof coat',
        category: ChecklistItemCategory.CLOTHING,
        priority: ChecklistItemPriority.HIGH,
        metadata: {
          weatherDependent: true,
          notes: 'Rain expected during your visit'
        }
      });

      items.push({
        name: 'Waterproof shoes or boots',
        category: ChecklistItemCategory.CLOTHING,
        priority: ChecklistItemPriority.HIGH,
        metadata: { weatherDependent: true }
      });

      items.push({
        name: 'Compact umbrella',
        category: ChecklistItemCategory.GEAR,
        priority: ChecklistItemPriority.MEDIUM,
        metadata: { weatherDependent: true }
      });

      items.push({
        name: 'Waterproof bag or dry sack',
        category: ChecklistItemCategory.GEAR,
        priority: ChecklistItemPriority.LOW,
        metadata: { weatherDependent: true }
      });
    }

    // Snow suggestions
    if (conditions.has('Snow')) {
      items.push({
        name: 'Snow boots with good traction',
        category: ChecklistItemCategory.CLOTHING,
        priority: ChecklistItemPriority.HIGH,
        metadata: {
          weatherDependent: true,
          notes: 'Snow expected during your visit'
        }
      });

      items.push({
        name: 'Warm waterproof gloves',
        category: ChecklistItemCategory.CLOTHING,
        priority: ChecklistItemPriority.HIGH,
        metadata: { weatherDependent: true }
      });

      items.push({
        name: 'Scarf or neck warmer',
        category: ChecklistItemCategory.CLOTHING,
        priority: ChecklistItemPriority.MEDIUM,
        metadata: { weatherDependent: true }
      });
    }

    // Wind suggestions
    if (conditions.has('Wind') || weather.current?.wind_speed > 10) {
      items.push({
        name: 'Windbreaker jacket',
        category: ChecklistItemCategory.CLOTHING,
        priority: ChecklistItemPriority.MEDIUM,
        metadata: {
          weatherDependent: true,
          notes: 'Strong winds expected'
        }
      });

      items.push({
        name: 'Lip balm and moisturizer',
        category: ChecklistItemCategory.HEALTH,
        priority: ChecklistItemPriority.LOW,
        metadata: { weatherDependent: true }
      });
    }

    // UV protection (for sunny conditions)
    if (conditions.has('Clear') || conditions.has('Sunny') || maxTemp > 20) {
      items.push({
        name: 'Sunglasses with UV protection',
        category: ChecklistItemCategory.CLOTHING,
        priority: ChecklistItemPriority.HIGH,
        metadata: { weatherDependent: true }
      });

      items.push({
        name: 'Wide-brimmed hat or cap',
        category: ChecklistItemCategory.CLOTHING,
        priority: ChecklistItemPriority.MEDIUM,
        metadata: { weatherDependent: true }
      });
    }

    // General weather-dependent items
    items.push({
      name: 'Weather app downloaded',
      category: ChecklistItemCategory.ELECTRONICS,
      priority: ChecklistItemPriority.LOW,
      metadata: {
        weatherDependent: true,
        notes: 'Stay updated on changing conditions'
      }
    });

    const conditionsArray = Array.from(conditions);
    const reason = this.generateWeatherReason(
      minTemp,
      maxTemp,
      totalPrecipitation,
      conditionsArray,
      locationName
    );

    return {
      items,
      reason,
      weatherConditions: {
        temperature: { min: Math.round(minTemp), max: Math.round(maxTemp) },
        conditions: conditionsArray,
        precipitation: Math.round(totalPrecipitation)
      }
    };
  }

  private generateWeatherReason(
    minTemp: number,
    maxTemp: number,
    precipitation: number,
    conditions: string[],
    locationName: string
  ): string {
    const parts: string[] = [`Weather forecast for ${locationName} shows`];

    // Temperature description
    if (minTemp < 0) {
      parts.push('freezing temperatures');
    } else if (minTemp < 10) {
      parts.push('cold weather');
    } else if (maxTemp > 30) {
      parts.push('hot temperatures');
    } else if (maxTemp > 25) {
      parts.push('warm weather');
    } else {
      parts.push('mild temperatures');
    }

    // Add temperature range
    parts.push(`(${Math.round(minTemp)}°C to ${Math.round(maxTemp)}°C)`);

    // Conditions
    if (conditions.includes('Rain') || precipitation > 10) {
      parts.push('with expected rainfall');
    }
    if (conditions.includes('Snow')) {
      parts.push('with snowfall');
    }
    if (conditions.includes('Wind')) {
      parts.push('and windy conditions');
    }

    return parts.join(' ') + '. Pack accordingly!';
  }

  async getLocationBasedSuggestions(
    locationId: string,
    season: string
  ): Promise<CreateChecklistItemDto[]> {
    const location = await this.prisma.location.findUnique({
      where: { id: locationId }
    });

    if (!location) {
      return [];
    }

    const items: CreateChecklistItemDto[] = [];

    // Location-specific suggestions based on metadata
    if (location.metadata && typeof location.metadata === 'object') {
      const metadata = location.metadata as any;

      // Altitude suggestions
      if (metadata.altitude && metadata.altitude > 2000) {
        items.push({
          name: 'Altitude sickness medication',
          category: ChecklistItemCategory.HEALTH,
          priority: ChecklistItemPriority.MEDIUM,
          metadata: {
            locationSpecific: true,
            notes: `${location.name} is at high altitude (${metadata.altitude}m)`
          }
        });

        items.push({
          name: 'Extra water bottles for hydration',
          category: ChecklistItemCategory.GEAR,
          priority: ChecklistItemPriority.HIGH,
          metadata: { locationSpecific: true }
        });
      }

      // Coastal suggestions
      if (metadata.type === 'coastal' || location.name?.toLowerCase().includes('beach')) {
        items.push({
          name: 'Beach essentials (towel, swimwear)',
          category: ChecklistItemCategory.GEAR,
          priority: ChecklistItemPriority.MEDIUM,
          metadata: { locationSpecific: true }
        });

        items.push({
          name: 'Water shoes or sandals',
          category: ChecklistItemCategory.CLOTHING,
          priority: ChecklistItemPriority.LOW,
          metadata: { locationSpecific: true }
        });
      }

      // Desert suggestions
      if (metadata.climate === 'desert' || metadata.type === 'desert') {
        items.push({
          name: 'Large water containers',
          category: ChecklistItemCategory.GEAR,
          priority: ChecklistItemPriority.HIGH,
          metadata: {
            locationSpecific: true,
            notes: 'Essential for desert conditions'
          }
        });

        items.push({
          name: 'Sun protection clothing',
          category: ChecklistItemCategory.CLOTHING,
          priority: ChecklistItemPriority.HIGH,
          metadata: { locationSpecific: true }
        });

        items.push({
          name: 'Dust mask or bandana',
          category: ChecklistItemCategory.HEALTH,
          priority: ChecklistItemPriority.MEDIUM,
          metadata: { locationSpecific: true }
        });
      }

      // Tropical suggestions
      if (metadata.climate === 'tropical') {
        items.push({
          name: 'Insect repellent (DEET)',
          category: ChecklistItemCategory.HEALTH,
          priority: ChecklistItemPriority.HIGH,
          metadata: {
            locationSpecific: true,
            notes: 'Protection against tropical insects'
          }
        });

        items.push({
          name: 'Anti-malarial medication',
          category: ChecklistItemCategory.HEALTH,
          priority: ChecklistItemPriority.HIGH,
          metadata: { locationSpecific: true }
        });

        items.push({
          name: 'Quick-dry clothing',
          category: ChecklistItemCategory.CLOTHING,
          priority: ChecklistItemPriority.MEDIUM,
          metadata: { locationSpecific: true }
        });
      }
    }

    // Season-specific items
    const seasonItems = this.getSeasonSpecificItems(season);
    items.push(...seasonItems);

    return items;
  }

  private getSeasonSpecificItems(season: string): CreateChecklistItemDto[] {
    const items: CreateChecklistItemDto[] = [];

    switch (season.toLowerCase()) {
      case 'winter':
        items.push({
          name: 'Hand and toe warmers',
          category: ChecklistItemCategory.GEAR,
          priority: ChecklistItemPriority.LOW,
          metadata: { seasonSpecific: ['winter'] }
        });
        items.push({
          name: 'Moisturizer for dry skin',
          category: ChecklistItemCategory.HEALTH,
          priority: ChecklistItemPriority.LOW,
          metadata: { seasonSpecific: ['winter'] }
        });
        break;

      case 'summer':
        items.push({
          name: 'Cooling neck wrap',
          category: ChecklistItemCategory.GEAR,
          priority: ChecklistItemPriority.LOW,
          metadata: { seasonSpecific: ['summer'] }
        });
        items.push({
          name: 'Hydration salts/electrolytes',
          category: ChecklistItemCategory.HEALTH,
          priority: ChecklistItemPriority.MEDIUM,
          metadata: { seasonSpecific: ['summer'] }
        });
        break;

      case 'spring':
        items.push({
          name: 'Allergy medication',
          category: ChecklistItemCategory.HEALTH,
          priority: ChecklistItemPriority.MEDIUM,
          metadata: { 
            seasonSpecific: ['spring'],
            notes: 'For seasonal allergies'
          }
        });
        items.push({
          name: 'Light layers for variable weather',
          category: ChecklistItemCategory.CLOTHING,
          priority: ChecklistItemPriority.MEDIUM,
          metadata: { seasonSpecific: ['spring'] }
        });
        break;

      case 'fall':
      case 'autumn':
        items.push({
          name: 'Layered clothing options',
          category: ChecklistItemCategory.CLOTHING,
          priority: ChecklistItemPriority.MEDIUM,
          metadata: { seasonSpecific: ['fall'] }
        });
        items.push({
          name: 'Light gloves for cool mornings',
          category: ChecklistItemCategory.CLOTHING,
          priority: ChecklistItemPriority.LOW,
          metadata: { seasonSpecific: ['fall'] }
        });
        break;
    }

    return items;
  }
}