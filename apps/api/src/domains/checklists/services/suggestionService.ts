import { PrismaClient } from '@prisma/client';
import {
  ChecklistSuggestion,
  WeatherBasedSuggestion,
  LocationBasedSuggestion,
  ChecklistCategory,
  ChecklistPriority,
  GenerateSuggestionsDto
} from '../types/checklist.types';
import { weatherService } from '../../weather/services/weatherService';

export class SuggestionService {
  constructor(private prisma: PrismaClient) {}

  // Generate smart suggestions based on trip details
  async generateSuggestions(data: GenerateSuggestionsDto): Promise<ChecklistSuggestion[]> {
    const suggestions: ChecklistSuggestion[] = [];
    
    // Get existing checklist items to avoid duplicates
    const existingItems = await this.prisma.checklistItem.findMany({
      where: { checklistId: data.checklistId },
      select: { content: true }
    });
    const existingContents = new Set(existingItems.map(item => item.content.toLowerCase()));

    // Weather-based suggestions
    if (data.weatherData) {
      const weatherSuggestions = await this.getWeatherBasedSuggestions(data.weatherData);
      suggestions.push(...weatherSuggestions);
    }

    // Location-based suggestions
    if (data.tripDetails?.destinations) {
      const locationSuggestions = await this.getLocationBasedSuggestions(data.tripDetails.destinations);
      suggestions.push(...locationSuggestions);
    }

    // Activity-based suggestions
    if (data.tripDetails?.activities) {
      const activitySuggestions = this.getActivityBasedSuggestions(data.tripDetails.activities);
      suggestions.push(...activitySuggestions);
    }

    // Transport-based suggestions
    if (data.tripDetails?.transportMode) {
      const transportSuggestions = this.getTransportBasedSuggestions(data.tripDetails.transportMode);
      suggestions.push(...transportSuggestions);
    }

    // User preference-based suggestions
    if (data.userPreferences) {
      const preferenceSuggestions = this.getUserPreferenceBasedSuggestions(data.userPreferences);
      suggestions.push(...preferenceSuggestions);
    }

    // Filter out duplicates and existing items
    const uniqueSuggestions = this.deduplicateSuggestions(suggestions)
      .filter(s => !existingContents.has(s.item.toLowerCase()));

    // Sort by confidence and priority
    return uniqueSuggestions.sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Weather-based suggestions
  private async getWeatherBasedSuggestions(weatherData: any[]): Promise<ChecklistSuggestion[]> {
    const suggestions: ChecklistSuggestion[] = [];
    
    // Analyze weather patterns
    const hasRain = weatherData.some(w => 
      w.conditions.toLowerCase().includes('rain') || 
      w.conditions.toLowerCase().includes('shower')
    );
    const hasCold = weatherData.some(w => w.temperature.min < 10);
    const hasHot = weatherData.some(w => w.temperature.max > 30);
    const hasSun = weatherData.some(w => 
      w.conditions.toLowerCase().includes('sun') || 
      w.conditions.toLowerCase().includes('clear')
    );

    // Rain suggestions
    if (hasRain) {
      suggestions.push(
        {
          item: 'Waterproof jacket',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.HIGH,
          reason: 'Rain is expected during your trip',
          confidence: 0.95,
          metadata: { weatherDependent: true }
        },
        {
          item: 'Umbrella',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.HIGH,
          reason: 'Rain is forecasted',
          confidence: 0.9,
          metadata: { weatherDependent: true }
        },
        {
          item: 'Waterproof bag covers',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.MEDIUM,
          reason: 'To protect your belongings from rain',
          confidence: 0.8,
          metadata: { weatherDependent: true }
        },
        {
          item: 'Quick-dry clothing',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Useful for rainy conditions',
          confidence: 0.75,
          metadata: { weatherDependent: true }
        }
      );
    }

    // Cold weather suggestions
    if (hasCold) {
      suggestions.push(
        {
          item: 'Warm jacket or coat',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.HIGH,
          reason: `Temperatures as low as ${Math.min(...weatherData.map(w => w.temperature.min))}°C expected`,
          confidence: 0.95,
          metadata: { weatherDependent: true, temperatureRange: { max: 10 } }
        },
        {
          item: 'Thermal underwear',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.HIGH,
          reason: 'Cold weather protection',
          confidence: 0.85,
          metadata: { weatherDependent: true, temperatureRange: { max: 10 } }
        },
        {
          item: 'Gloves',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Keep hands warm in cold weather',
          confidence: 0.8,
          metadata: { weatherDependent: true }
        },
        {
          item: 'Warm hat or beanie',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Essential for cold weather',
          confidence: 0.8,
          metadata: { weatherDependent: true }
        },
        {
          item: 'Scarf',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.LOW,
          reason: 'Additional cold protection',
          confidence: 0.7,
          metadata: { weatherDependent: true }
        }
      );
    }

    // Hot weather suggestions
    if (hasHot) {
      suggestions.push(
        {
          item: 'Sunscreen SPF 50+',
          category: ChecklistCategory.HEALTH,
          priority: ChecklistPriority.HIGH,
          reason: `High temperatures up to ${Math.max(...weatherData.map(w => w.temperature.max))}°C expected`,
          confidence: 0.95,
          metadata: { weatherDependent: true, essentialItem: true }
        },
        {
          item: 'Sun hat or cap',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.HIGH,
          reason: 'Sun protection in hot weather',
          confidence: 0.9,
          metadata: { weatherDependent: true }
        },
        {
          item: 'Lightweight, breathable clothing',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.HIGH,
          reason: 'Stay cool in hot weather',
          confidence: 0.9,
          metadata: { weatherDependent: true, temperatureRange: { min: 25 } }
        },
        {
          item: 'Reusable water bottle',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.HIGH,
          reason: 'Stay hydrated in hot weather',
          confidence: 0.85,
          metadata: { weatherDependent: true, essentialItem: true }
        },
        {
          item: 'Cooling towel',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.LOW,
          reason: 'Help stay cool in hot conditions',
          confidence: 0.6,
          metadata: { weatherDependent: true }
        }
      );
    }

    // Sun protection
    if (hasSun) {
      suggestions.push(
        {
          item: 'Sunglasses',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.HIGH,
          reason: 'Sunny weather expected',
          confidence: 0.85,
          metadata: { weatherDependent: true }
        },
        {
          item: 'After-sun lotion',
          category: ChecklistCategory.HEALTH,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Soothe skin after sun exposure',
          confidence: 0.7,
          metadata: { weatherDependent: true }
        }
      );
    }

    return suggestions;
  }

  // Location-based suggestions
  private async getLocationBasedSuggestions(destinations: any[]): Promise<ChecklistSuggestion[]> {
    const suggestions: ChecklistSuggestion[] = [];
    
    for (const destination of destinations) {
      const location = await this.prisma.location.findUnique({
        where: { id: destination.locationId }
      });

      if (!location) continue;

      // Country-specific suggestions
      const countrySpecificItems = await this.getCountrySpecificSuggestions(location.country);
      suggestions.push(...countrySpecificItems);

      // Location type suggestions (beach, mountain, city, etc.)
      if (location.metadata) {
        const metadata = location.metadata as any;
        if (metadata.type) {
          const typeSpecificItems = this.getLocationTypeSpecificSuggestions(metadata.type);
          suggestions.push(...typeSpecificItems);
        }
      }
    }

    return suggestions;
  }

  // Country-specific suggestions
  private async getCountrySpecificSuggestions(country?: string | null): Promise<ChecklistSuggestion[]> {
    if (!country) return [];

    const suggestions: ChecklistSuggestion[] = [];

    // Electrical adapter suggestions
    const adapterTypes: Record<string, string> = {
      'United States': 'Type A/B adapter',
      'United Kingdom': 'Type G adapter',
      'France': 'Type C/E adapter',
      'Germany': 'Type C/F adapter',
      'Italy': 'Type C/F/L adapter',
      'Spain': 'Type C/F adapter',
      'Japan': 'Type A/B adapter',
      'Australia': 'Type I adapter',
      'China': 'Type A/C/I adapter',
      'India': 'Type C/D/M adapter'
    };

    if (adapterTypes[country]) {
      suggestions.push({
        item: adapterTypes[country],
        category: ChecklistCategory.TECHNOLOGY,
        priority: ChecklistPriority.HIGH,
        reason: `Required for electrical devices in ${country}`,
        confidence: 0.95,
        metadata: { locationSpecific: true, essentialItem: true }
      });
    }

    // Currency-related suggestions
    const cashCurrencies = ['Japan', 'Germany', 'Morocco', 'Egypt'];
    if (cashCurrencies.includes(country)) {
      suggestions.push({
        item: 'Local currency in cash',
        category: ChecklistCategory.FINANCE,
        priority: ChecklistPriority.HIGH,
        reason: `Cash is widely preferred in ${country}`,
        confidence: 0.85,
        metadata: { locationSpecific: true }
      });
    }

    // Health and safety suggestions
    const vaccinationCountries = ['Brazil', 'Kenya', 'India', 'Thailand', 'Peru'];
    if (vaccinationCountries.includes(country)) {
      suggestions.push({
        item: 'Check vaccination requirements',
        category: ChecklistCategory.HEALTH,
        priority: ChecklistPriority.HIGH,
        reason: `Some vaccinations may be required for ${country}`,
        confidence: 0.9,
        metadata: { locationSpecific: true, essentialItem: true }
      });
    }

    // Communication suggestions
    const simCardCountries = ['Japan', 'South Korea', 'China'];
    if (simCardCountries.includes(country)) {
      suggestions.push({
        item: 'Portable WiFi device or local SIM card',
        category: ChecklistCategory.TECHNOLOGY,
        priority: ChecklistPriority.HIGH,
        reason: `Internet access can be challenging for tourists in ${country}`,
        confidence: 0.8,
        metadata: { locationSpecific: true }
      });
    }

    return suggestions;
  }

  // Location type specific suggestions
  private getLocationTypeSpecificSuggestions(locationType: string): ChecklistSuggestion[] {
    const suggestions: ChecklistSuggestion[] = [];

    switch (locationType.toLowerCase()) {
      case 'beach':
      case 'coastal':
        suggestions.push(
          {
            item: 'Beach towel',
            category: ChecklistCategory.PACKING,
            priority: ChecklistPriority.HIGH,
            reason: 'Essential for beach destinations',
            confidence: 0.9,
            metadata: { locationSpecific: true }
          },
          {
            item: 'Swimsuit',
            category: ChecklistCategory.PACKING,
            priority: ChecklistPriority.HIGH,
            reason: 'For swimming and beach activities',
            confidence: 0.95,
            metadata: { locationSpecific: true, quantity: 2 }
          },
          {
            item: 'Waterproof phone case',
            category: ChecklistCategory.TECHNOLOGY,
            priority: ChecklistPriority.MEDIUM,
            reason: 'Protect phone at the beach',
            confidence: 0.75,
            metadata: { locationSpecific: true }
          },
          {
            item: 'Beach shoes/flip flops',
            category: ChecklistCategory.PACKING,
            priority: ChecklistPriority.HIGH,
            reason: 'Comfortable beach footwear',
            confidence: 0.85,
            metadata: { locationSpecific: true }
          }
        );
        break;

      case 'mountain':
      case 'alpine':
        suggestions.push(
          {
            item: 'Hiking boots',
            category: ChecklistCategory.PACKING,
            priority: ChecklistPriority.HIGH,
            reason: 'Essential for mountain terrain',
            confidence: 0.95,
            metadata: { locationSpecific: true, essentialItem: true }
          },
          {
            item: 'Altitude sickness medication',
            category: ChecklistCategory.HEALTH,
            priority: ChecklistPriority.MEDIUM,
            reason: 'Helpful for high altitude destinations',
            confidence: 0.7,
            metadata: { locationSpecific: true }
          },
          {
            item: 'Layered clothing',
            category: ChecklistCategory.PACKING,
            priority: ChecklistPriority.HIGH,
            reason: 'Mountain weather can change quickly',
            confidence: 0.85,
            metadata: { locationSpecific: true }
          },
          {
            item: 'Trail map or GPS device',
            category: ChecklistCategory.TECHNOLOGY,
            priority: ChecklistPriority.HIGH,
            reason: 'Navigation in mountain areas',
            confidence: 0.8,
            metadata: { locationSpecific: true }
          }
        );
        break;

      case 'desert':
        suggestions.push(
          {
            item: 'Wide-brim hat',
            category: ChecklistCategory.PACKING,
            priority: ChecklistPriority.HIGH,
            reason: 'Sun protection in desert conditions',
            confidence: 0.9,
            metadata: { locationSpecific: true }
          },
          {
            item: 'Electrolyte supplements',
            category: ChecklistCategory.HEALTH,
            priority: ChecklistPriority.MEDIUM,
            reason: 'Prevent dehydration in dry conditions',
            confidence: 0.8,
            metadata: { locationSpecific: true }
          },
          {
            item: 'Dust mask or bandana',
            category: ChecklistCategory.PACKING,
            priority: ChecklistPriority.MEDIUM,
            reason: 'Protection from dust and sand',
            confidence: 0.75,
            metadata: { locationSpecific: true }
          }
        );
        break;

      case 'urban':
      case 'city':
        suggestions.push(
          {
            item: 'Comfortable walking shoes',
            category: ChecklistCategory.PACKING,
            priority: ChecklistPriority.HIGH,
            reason: 'Cities require lots of walking',
            confidence: 0.9,
            metadata: { locationSpecific: true, quantity: 2 }
          },
          {
            item: 'Anti-theft bag or wallet',
            category: ChecklistCategory.PACKING,
            priority: ChecklistPriority.MEDIUM,
            reason: 'Security in crowded urban areas',
            confidence: 0.75,
            metadata: { locationSpecific: true }
          },
          {
            item: 'Public transport app/card',
            category: ChecklistCategory.TRANSPORTATION,
            priority: ChecklistPriority.HIGH,
            reason: 'Navigate city transportation',
            confidence: 0.85,
            metadata: { locationSpecific: true }
          }
        );
        break;
    }

    return suggestions;
  }

  // Activity-based suggestions
  private getActivityBasedSuggestions(activities: string[]): ChecklistSuggestion[] {
    const suggestions: ChecklistSuggestion[] = [];
    const activityLower = activities.map(a => a.toLowerCase());

    // Water activities
    if (activityLower.some(a => a.includes('swim') || a.includes('snorkel') || a.includes('dive'))) {
      suggestions.push(
        {
          item: 'Goggles or snorkel mask',
          category: ChecklistCategory.ACTIVITIES,
          priority: ChecklistPriority.MEDIUM,
          reason: 'For water activities',
          confidence: 0.8,
          metadata: { locationSpecific: true }
        },
        {
          item: 'Waterproof dry bag',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Keep belongings dry during water activities',
          confidence: 0.75,
          metadata: {}
        }
      );
    }

    // Photography
    if (activityLower.some(a => a.includes('photo') || a.includes('sightseeing'))) {
      suggestions.push(
        {
          item: 'Camera with extra batteries',
          category: ChecklistCategory.TECHNOLOGY,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Capture memories',
          confidence: 0.7,
          metadata: {}
        },
        {
          item: 'Memory cards',
          category: ChecklistCategory.TECHNOLOGY,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Extra storage for photos',
          confidence: 0.65,
          metadata: { quantity: 2 }
        }
      );
    }

    // Hiking/Trekking
    if (activityLower.some(a => a.includes('hik') || a.includes('trek') || a.includes('walk'))) {
      suggestions.push(
        {
          item: 'Trail snacks and energy bars',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Energy for hiking activities',
          confidence: 0.8,
          metadata: {}
        },
        {
          item: 'Blister prevention/treatment',
          category: ChecklistCategory.HEALTH,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Foot care during long walks',
          confidence: 0.75,
          metadata: {}
        },
        {
          item: 'Trekking poles',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.LOW,
          reason: 'Support for challenging hikes',
          confidence: 0.6,
          metadata: {}
        }
      );
    }

    // Business/Work
    if (activityLower.some(a => a.includes('business') || a.includes('conference') || a.includes('meeting'))) {
      suggestions.push(
        {
          item: 'Business attire',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.HIGH,
          reason: 'Professional appearance required',
          confidence: 0.95,
          metadata: { quantity: 2 }
        },
        {
          item: 'Laptop and work materials',
          category: ChecklistCategory.TECHNOLOGY,
          priority: ChecklistPriority.HIGH,
          reason: 'Work essentials',
          confidence: 0.9,
          metadata: { essentialItem: true }
        },
        {
          item: 'Business cards',
          category: ChecklistCategory.DOCUMENTS,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Networking at business events',
          confidence: 0.7,
          metadata: { quantity: 50 }
        }
      );
    }

    return suggestions;
  }

  // Transport-based suggestions
  private getTransportBasedSuggestions(transportModes: string[]): ChecklistSuggestion[] {
    const suggestions: ChecklistSuggestion[] = [];
    const modesLower = transportModes.map(m => m.toLowerCase());

    // Air travel
    if (modesLower.includes('flight') || modesLower.includes('plane')) {
      suggestions.push(
        {
          item: 'Travel pillow',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Comfort during flights',
          confidence: 0.7,
          metadata: {}
        },
        {
          item: 'Compression socks',
          category: ChecklistCategory.HEALTH,
          priority: ChecklistPriority.LOW,
          reason: 'Prevent DVT on long flights',
          confidence: 0.6,
          metadata: {}
        },
        {
          item: 'TSA-approved toiletry bag',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.HIGH,
          reason: 'Security compliance for air travel',
          confidence: 0.85,
          metadata: {}
        },
        {
          item: 'Luggage tags',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Identify luggage easily',
          confidence: 0.75,
          metadata: {}
        }
      );
    }

    // Road travel
    if (modesLower.includes('car') || modesLower.includes('drive')) {
      suggestions.push(
        {
          item: 'Car phone mount',
          category: ChecklistCategory.TECHNOLOGY,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Safe navigation while driving',
          confidence: 0.8,
          metadata: {}
        },
        {
          item: 'Road trip snacks',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Refreshments for the journey',
          confidence: 0.75,
          metadata: {}
        },
        {
          item: 'Emergency car kit',
          category: ChecklistCategory.EMERGENCY,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Safety during road trips',
          confidence: 0.7,
          metadata: {}
        }
      );
    }

    // Train travel
    if (modesLower.includes('train') || modesLower.includes('rail')) {
      suggestions.push(
        {
          item: 'Entertainment for train journey',
          category: ChecklistCategory.ACTIVITIES,
          priority: ChecklistPriority.LOW,
          reason: 'Pass time on long train rides',
          confidence: 0.65,
          metadata: {}
        },
        {
          item: 'Light snacks',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.LOW,
          reason: 'Train food can be expensive',
          confidence: 0.6,
          metadata: {}
        }
      );
    }

    return suggestions;
  }

  // User preference-based suggestions
  private getUserPreferenceBasedSuggestions(preferences: any): ChecklistSuggestion[] {
    const suggestions: ChecklistSuggestion[] = [];

    // Packing style preferences
    if (preferences.packingStyle === 'minimal') {
      suggestions.push(
        {
          item: 'Packing cubes',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Organize minimal packing efficiently',
          confidence: 0.8,
          metadata: {}
        },
        {
          item: 'Multi-purpose clothing items',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Versatile items for minimal packing',
          confidence: 0.75,
          metadata: {}
        }
      );
    } else if (preferences.packingStyle === 'comprehensive') {
      suggestions.push(
        {
          item: 'Extra luggage for souvenirs',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.LOW,
          reason: 'Space for bringing items back',
          confidence: 0.6,
          metadata: {}
        },
        {
          item: 'Luggage scale',
          category: ChecklistCategory.PACKING,
          priority: ChecklistPriority.MEDIUM,
          reason: 'Avoid overweight baggage fees',
          confidence: 0.7,
          metadata: {}
        }
      );
    }

    // Interest-based suggestions
    if (preferences.interests) {
      const interests = preferences.interests.map((i: string) => i.toLowerCase());
      
      if (interests.includes('fitness') || interests.includes('sports')) {
        suggestions.push(
          {
            item: 'Workout clothes',
            category: ChecklistCategory.PACKING,
            priority: ChecklistPriority.MEDIUM,
            reason: 'Maintain fitness routine while traveling',
            confidence: 0.8,
            metadata: {}
          },
          {
            item: 'Resistance bands',
            category: ChecklistCategory.PACKING,
            priority: ChecklistPriority.LOW,
            reason: 'Portable workout equipment',
            confidence: 0.6,
            metadata: {}
          }
        );
      }

      if (interests.includes('cooking') || interests.includes('food')) {
        suggestions.push(
          {
            item: 'Food tour bookings',
            category: ChecklistCategory.ACTIVITIES,
            priority: ChecklistPriority.MEDIUM,
            reason: 'Explore local cuisine',
            confidence: 0.7,
            metadata: {}
          },
          {
            item: 'Restaurant reservation list',
            category: ChecklistCategory.DOCUMENTS,
            priority: ChecklistPriority.LOW,
            reason: 'Plan dining experiences',
            confidence: 0.65,
            metadata: {}
          }
        );
      }
    }

    return suggestions;
  }

  // Deduplicate suggestions
  private deduplicateSuggestions(suggestions: ChecklistSuggestion[]): ChecklistSuggestion[] {
    const seen = new Map<string, ChecklistSuggestion>();
    
    for (const suggestion of suggestions) {
      const key = suggestion.item.toLowerCase();
      const existing = seen.get(key);
      
      if (!existing || suggestion.confidence > existing.confidence) {
        seen.set(key, suggestion);
      }
    }
    
    return Array.from(seen.values());
  }

  // Get suggestions for a specific category
  async getCategorySuggestions(
    category: ChecklistCategory,
    context?: {
      weather?: any;
      location?: any;
      activities?: string[];
    }
  ): Promise<ChecklistSuggestion[]> {
    const baseSuggestions = this.getBaseCategorySuggestions(category);
    const suggestions = [...baseSuggestions];

    if (context?.weather) {
      const weatherSuggestions = await this.getWeatherBasedSuggestions([context.weather]);
      suggestions.push(...weatherSuggestions.filter(s => s.category === category));
    }

    if (context?.location) {
      const locationSuggestions = await this.getLocationBasedSuggestions([context.location]);
      suggestions.push(...locationSuggestions.filter(s => s.category === category));
    }

    if (context?.activities) {
      const activitySuggestions = this.getActivityBasedSuggestions(context.activities);
      suggestions.push(...activitySuggestions.filter(s => s.category === category));
    }

    return this.deduplicateSuggestions(suggestions);
  }

  // Base category suggestions
  private getBaseCategorySuggestions(category: ChecklistCategory): ChecklistSuggestion[] {
    const suggestions: ChecklistSuggestion[] = [];

    switch (category) {
      case ChecklistCategory.DOCUMENTS:
        suggestions.push(
          {
            item: 'Passport',
            category: ChecklistCategory.DOCUMENTS,
            priority: ChecklistPriority.HIGH,
            reason: 'Essential travel document',
            confidence: 0.95,
            metadata: { essentialItem: true }
          },
          {
            item: 'Travel insurance policy',
            category: ChecklistCategory.DOCUMENTS,
            priority: ChecklistPriority.HIGH,
            reason: 'Important for emergencies',
            confidence: 0.85,
            metadata: {}
          },
          {
            item: 'Copies of important documents',
            category: ChecklistCategory.DOCUMENTS,
            priority: ChecklistPriority.MEDIUM,
            reason: 'Backup in case of loss',
            confidence: 0.8,
            metadata: {}
          }
        );
        break;

      case ChecklistCategory.HEALTH:
        suggestions.push(
          {
            item: 'First aid kit',
            category: ChecklistCategory.HEALTH,
            priority: ChecklistPriority.HIGH,
            reason: 'Basic medical supplies',
            confidence: 0.85,
            metadata: {}
          },
          {
            item: 'Prescription medications',
            category: ChecklistCategory.HEALTH,
            priority: ChecklistPriority.HIGH,
            reason: 'Personal health requirements',
            confidence: 0.95,
            metadata: { essentialItem: true }
          },
          {
            item: 'Pain relievers',
            category: ChecklistCategory.HEALTH,
            priority: ChecklistPriority.MEDIUM,
            reason: 'Common health needs',
            confidence: 0.75,
            metadata: {}
          }
        );
        break;

      case ChecklistCategory.TECHNOLOGY:
        suggestions.push(
          {
            item: 'Phone charger',
            category: ChecklistCategory.TECHNOLOGY,
            priority: ChecklistPriority.HIGH,
            reason: 'Keep devices powered',
            confidence: 0.95,
            metadata: { essentialItem: true }
          },
          {
            item: 'Portable battery pack',
            category: ChecklistCategory.TECHNOLOGY,
            priority: ChecklistPriority.MEDIUM,
            reason: 'Backup power on the go',
            confidence: 0.8,
            metadata: {}
          },
          {
            item: 'Universal adapter',
            category: ChecklistCategory.TECHNOLOGY,
            priority: ChecklistPriority.HIGH,
            reason: 'Use electronics internationally',
            confidence: 0.85,
            metadata: { locationSpecific: true }
          }
        );
        break;

      case ChecklistCategory.FINANCE:
        suggestions.push(
          {
            item: 'Credit/debit cards',
            category: ChecklistCategory.FINANCE,
            priority: ChecklistPriority.HIGH,
            reason: 'Payment methods',
            confidence: 0.95,
            metadata: { essentialItem: true }
          },
          {
            item: 'Cash in local currency',
            category: ChecklistCategory.FINANCE,
            priority: ChecklistPriority.HIGH,
            reason: 'For places that don\'t accept cards',
            confidence: 0.85,
            metadata: { locationSpecific: true }
          },
          {
            item: 'Travel budget tracker',
            category: ChecklistCategory.FINANCE,
            priority: ChecklistPriority.MEDIUM,
            reason: 'Monitor spending',
            confidence: 0.7,
            metadata: {}
          }
        );
        break;

      case ChecklistCategory.EMERGENCY:
        suggestions.push(
          {
            item: 'Emergency contact list',
            category: ChecklistCategory.EMERGENCY,
            priority: ChecklistPriority.HIGH,
            reason: 'Important phone numbers',
            confidence: 0.9,
            metadata: { essentialItem: true }
          },
          {
            item: 'Embassy contact information',
            category: ChecklistCategory.EMERGENCY,
            priority: ChecklistPriority.MEDIUM,
            reason: 'Help abroad if needed',
            confidence: 0.75,
            metadata: { locationSpecific: true }
          },
          {
            item: 'Travel insurance hotline',
            category: ChecklistCategory.EMERGENCY,
            priority: ChecklistPriority.HIGH,
            reason: 'Quick access to assistance',
            confidence: 0.85,
            metadata: {}
          }
        );
        break;
    }

    return suggestions;
  }
}

// Export singleton instance
export const suggestionService = new SuggestionService(
  new PrismaClient()
);