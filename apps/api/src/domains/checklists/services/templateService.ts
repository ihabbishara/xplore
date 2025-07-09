import { PrismaClient, Prisma } from '@prisma/client';
import { 
  ChecklistTemplate,
  CreateChecklistTemplateDto,
  UpdateChecklistTemplateDto,
  ChecklistTemplateFilters,
  ChecklistCategory,
  ChecklistItemCategory,
  ChecklistItemPriority
} from '../types/checklist.types';
import { NotFoundError, ForbiddenError } from '../../../shared/utils/errors';

export class TemplateService {
  constructor(private prisma: PrismaClient) {}

  async createTemplate(
    userId: string,
    data: CreateChecklistTemplateDto
  ): Promise<ChecklistTemplate> {
    const template = await this.prisma.checklistTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        icon: data.icon,
        isSystem: false,
        isPublic: data.isPublic ?? true,
        tags: data.tags,
        defaultItems: data.defaultItems as any,
        createdBy: userId,
        metadata: data.metadata as any
      }
    });

    return template as any;
  }

  async getTemplateById(templateId: string): Promise<ChecklistTemplate> {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    return template as any;
  }

  async updateTemplate(
    templateId: string,
    userId: string,
    data: UpdateChecklistTemplateDto
  ): Promise<ChecklistTemplate> {
    // Check ownership
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    if (template.isSystem || template.createdBy !== userId) {
      throw new ForbiddenError('You can only update your own templates');
    }

    const updated = await this.prisma.checklistTemplate.update({
      where: { id: templateId },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        icon: data.icon,
        tags: data.tags,
        defaultItems: data.defaultItems as any,
        isPublic: data.isPublic,
        metadata: data.metadata as any,
        updatedAt: new Date()
      }
    });

    return updated as any;
  }

  async deleteTemplate(templateId: string, userId: string): Promise<void> {
    // Check ownership
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    if (template.isSystem || template.createdBy !== userId) {
      throw new ForbiddenError('You can only delete your own templates');
    }

    await this.prisma.checklistTemplate.delete({
      where: { id: templateId }
    });
  }

  async getTemplates(filters: ChecklistTemplateFilters): Promise<{
    templates: ChecklistTemplate[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ChecklistTemplateWhereInput = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags
      };
    }

    if (filters.isSystem !== undefined) {
      where.isSystem = filters.isSystem;
    }

    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters.minRating !== undefined) {
      where.rating = {
        gte: filters.minRating
      };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Get templates
    const [templates, total] = await Promise.all([
      this.prisma.checklistTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: filters.sortBy ? {
          [filters.sortBy]: filters.sortOrder || 'desc'
        } : { usageCount: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true
                }
              }
            }
          }
        }
      }),
      this.prisma.checklistTemplate.count({ where })
    ]);

    return {
      templates: templates as any[],
      total,
      page,
      limit
    };
  }

  async rateTemplate(
    templateId: string,
    userId: string,
    rating: number
  ): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    // Simple rating update (in production, you'd track individual ratings)
    const currentRating = template.rating?.toNumber() || 0;
    const currentCount = template.usageCount || 0;
    const newRating = currentCount > 0 
      ? (currentRating * currentCount + rating) / (currentCount + 1)
      : rating;

    await this.prisma.checklistTemplate.update({
      where: { id: templateId },
      data: {
        rating: newRating
      }
    });
  }

  async getUserTemplates(userId: string): Promise<ChecklistTemplate[]> {
    const templates = await this.prisma.checklistTemplate.findMany({
      where: { createdBy: userId },
      orderBy: { updatedAt: 'desc' }
    });

    return templates as any[];
  }

  async getPopularTemplates(limit: number = 10): Promise<ChecklistTemplate[]> {
    const templates = await this.prisma.checklistTemplate.findMany({
      where: {
        isPublic: true,
        rating: { gte: 4 }
      },
      orderBy: [
        { usageCount: 'desc' },
        { rating: 'desc' }
      ],
      take: limit
    });

    return templates as any[];
  }

  async getTemplatesByCategory(
    category: ChecklistCategory,
    limit: number = 20
  ): Promise<ChecklistTemplate[]> {
    const templates = await this.prisma.checklistTemplate.findMany({
      where: {
        category,
        isPublic: true
      },
      orderBy: [
        { isSystem: 'desc' },
        { usageCount: 'desc' }
      ],
      take: limit
    });

    return templates as any[];
  }

  // Initialize system templates (run once during setup)
  async initializeSystemTemplates(): Promise<void> {
    const systemTemplates = [
      {
        name: 'Weekend City Break',
        description: 'Essential checklist for a 2-3 day city exploration',
        category: ChecklistCategory.WEEKEND,
        icon: '🏙️',
        isSystem: true,
        isPublic: true,
        tags: ['weekend', 'city', 'short-trip', 'urban'],
        defaultItems: [
          {
            name: 'Valid passport/ID',
            category: ChecklistItemCategory.DOCUMENTS,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Hotel booking confirmation',
            category: ChecklistItemCategory.ACCOMMODATION,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Flight/train tickets',
            category: ChecklistItemCategory.TRANSPORTATION,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Phone charger',
            category: ChecklistItemCategory.ELECTRONICS,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Comfortable walking shoes',
            category: ChecklistItemCategory.CLOTHING,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Weather-appropriate clothing',
            category: ChecklistItemCategory.CLOTHING,
            priority: ChecklistItemPriority.MEDIUM,
            metadata: { weatherDependent: true }
          },
          {
            name: 'Toiletries bag',
            category: ChecklistItemCategory.TOILETRIES,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Credit card & cash',
            category: ChecklistItemCategory.MONEY,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'City map or offline maps downloaded',
            category: ChecklistItemCategory.ACTIVITIES,
            priority: ChecklistItemPriority.LOW
          },
          {
            name: 'Restaurant reservations',
            category: ChecklistItemCategory.FOOD,
            priority: ChecklistItemPriority.LOW
          }
        ],
        metadata: {
          estimatedItems: 10,
          popularFor: ['couples', 'solo travelers', 'friends'],
          weatherConsiderations: true
        }
      },
      {
        name: 'International Relocation Explorer',
        description: 'Comprehensive checklist for exploring a potential new country to live in',
        category: ChecklistCategory.RELOCATION,
        icon: '🌍',
        isSystem: true,
        isPublic: true,
        tags: ['relocation', 'expat', 'long-term', 'international'],
        defaultItems: [
          {
            name: 'Valid passport with 6+ months validity',
            category: ChecklistItemCategory.DOCUMENTS,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Visa or entry requirements',
            category: ChecklistItemCategory.DOCUMENTS,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Travel insurance documentation',
            category: ChecklistItemCategory.DOCUMENTS,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Bank statements for visa',
            category: ChecklistItemCategory.DOCUMENTS,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Resume/CV copies',
            category: ChecklistItemCategory.DOCUMENTS,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Professional references',
            category: ChecklistItemCategory.DOCUMENTS,
            priority: ChecklistItemPriority.LOW
          },
          {
            name: 'Accommodation for first week',
            category: ChecklistItemCategory.ACCOMMODATION,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'List of neighborhoods to explore',
            category: ChecklistItemCategory.ACCOMMODATION,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Real estate agent contacts',
            category: ChecklistItemCategory.ACCOMMODATION,
            priority: ChecklistItemPriority.LOW
          },
          {
            name: 'International SIM card or roaming plan',
            category: ChecklistItemCategory.ELECTRONICS,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Power adapters',
            category: ChecklistItemCategory.ELECTRONICS,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Laptop and work equipment',
            category: ChecklistItemCategory.WORK,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Banking app with international access',
            category: ChecklistItemCategory.MONEY,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Emergency cash in local currency',
            category: ChecklistItemCategory.MONEY,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Cost of living research',
            category: ChecklistItemCategory.MONEY,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Healthcare system research',
            category: ChecklistItemCategory.HEALTH,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'List of hospitals/clinics',
            category: ChecklistItemCategory.HEALTH,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Prescription medications (3 month supply)',
            category: ChecklistItemCategory.HEALTH,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Professional networking events schedule',
            category: ChecklistItemCategory.WORK,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Co-working space day passes',
            category: ChecklistItemCategory.WORK,
            priority: ChecklistItemPriority.LOW
          }
        ],
        metadata: {
          estimatedItems: 20,
          popularFor: ['digital nomads', 'expats', 'remote workers'],
          customizationTips: [
            'Add visa-specific requirements for your nationality',
            'Include industry-specific networking opportunities',
            'Research tax implications before you go'
          ]
        }
      },
      {
        name: 'Mountain Adventure Weekend',
        description: 'Gear and preparation for a mountain hiking adventure',
        category: ChecklistCategory.ADVENTURE,
        icon: '⛰️',
        isSystem: true,
        isPublic: true,
        tags: ['hiking', 'mountain', 'outdoor', 'adventure', 'nature'],
        defaultItems: [
          {
            name: 'Hiking boots (broken in)',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Backpack (30-40L)',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Weather-appropriate layers',
            category: ChecklistItemCategory.CLOTHING,
            priority: ChecklistItemPriority.HIGH,
            metadata: { weatherDependent: true }
          },
          {
            name: 'Rain jacket',
            category: ChecklistItemCategory.CLOTHING,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'First aid kit',
            category: ChecklistItemCategory.EMERGENCY,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Trail maps/GPS device',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Water bottles (2L minimum)',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Trail snacks and energy bars',
            category: ChecklistItemCategory.FOOD,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Sunscreen and sunglasses',
            category: ChecklistItemCategory.HEALTH,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Emergency whistle',
            category: ChecklistItemCategory.EMERGENCY,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Headlamp with extra batteries',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Trekking poles',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.LOW
          },
          {
            name: 'Camera with extra battery',
            category: ChecklistItemCategory.ELECTRONICS,
            priority: ChecklistItemPriority.LOW
          },
          {
            name: 'Emergency shelter/bivvy',
            category: ChecklistItemCategory.EMERGENCY,
            priority: ChecklistItemPriority.LOW
          }
        ],
        metadata: {
          estimatedItems: 14,
          weatherConsiderations: true,
          customizationTips: [
            'Adjust clothing layers based on season',
            'Add camping gear for overnight trips',
            'Consider altitude sickness medication for high peaks'
          ]
        }
      },
      {
        name: 'Business Travel Essentials',
        description: 'Professional travel checklist for business trips',
        category: ChecklistCategory.BUSINESS,
        icon: '💼',
        isSystem: true,
        isPublic: true,
        tags: ['business', 'professional', 'work', 'conference'],
        defaultItems: [
          {
            name: 'Business cards',
            category: ChecklistItemCategory.WORK,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Laptop and charger',
            category: ChecklistItemCategory.ELECTRONICS,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Presentation materials',
            category: ChecklistItemCategory.WORK,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Professional attire',
            category: ChecklistItemCategory.CLOTHING,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Meeting agenda and contacts',
            category: ChecklistItemCategory.WORK,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Expense tracking app/receipts folder',
            category: ChecklistItemCategory.MONEY,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Portable phone charger',
            category: ChecklistItemCategory.ELECTRONICS,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'International roaming plan',
            category: ChecklistItemCategory.ELECTRONICS,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Business travel insurance info',
            category: ChecklistItemCategory.DOCUMENTS,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'LinkedIn profile updated',
            category: ChecklistItemCategory.WORK,
            priority: ChecklistItemPriority.LOW
          }
        ],
        metadata: {
          estimatedItems: 10,
          popularFor: ['executives', 'consultants', 'sales teams']
        }
      },
      {
        name: 'Beach Vacation Paradise',
        description: 'Sun, sand, and relaxation checklist',
        category: ChecklistCategory.TRAVEL,
        icon: '🏖️',
        isSystem: true,
        isPublic: true,
        tags: ['beach', 'summer', 'vacation', 'relaxation', 'tropical'],
        defaultItems: [
          {
            name: 'Sunscreen (SPF 30+)',
            category: ChecklistItemCategory.HEALTH,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Swimwear (2 sets)',
            category: ChecklistItemCategory.CLOTHING,
            priority: ChecklistItemPriority.HIGH,
            metadata: { quantity: 2 }
          },
          {
            name: 'Beach towel',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Sunglasses',
            category: ChecklistItemCategory.CLOTHING,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Hat or cap',
            category: ChecklistItemCategory.CLOTHING,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Beach bag',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Waterproof phone case',
            category: ChecklistItemCategory.ELECTRONICS,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'After-sun lotion',
            category: ChecklistItemCategory.HEALTH,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Beach reads/kindle',
            category: ChecklistItemCategory.ENTERTAINMENT,
            priority: ChecklistItemPriority.LOW
          },
          {
            name: 'Snorkel gear',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.LOW
          },
          {
            name: 'Beach games',
            category: ChecklistItemCategory.ENTERTAINMENT,
            priority: ChecklistItemPriority.LOW
          },
          {
            name: 'Insect repellent',
            category: ChecklistItemCategory.HEALTH,
            priority: ChecklistItemPriority.MEDIUM
          }
        ],
        metadata: {
          estimatedItems: 12,
          seasonSpecific: ['summer'],
          weatherConsiderations: true
        }
      },
      {
        name: 'Winter Ski Trip',
        description: 'Complete checklist for a skiing or snowboarding adventure',
        category: ChecklistCategory.ADVENTURE,
        icon: '⛷️',
        isSystem: true,
        isPublic: true,
        tags: ['ski', 'winter', 'snow', 'mountain', 'sport'],
        defaultItems: [
          {
            name: 'Ski/snowboard equipment',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Ski pass/lift tickets',
            category: ChecklistItemCategory.ACTIVITIES,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Thermal underwear',
            category: ChecklistItemCategory.CLOTHING,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Ski jacket and pants',
            category: ChecklistItemCategory.CLOTHING,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Gloves or mittens',
            category: ChecklistItemCategory.CLOTHING,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Goggles',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Helmet',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Neck warmer/balaclava',
            category: ChecklistItemCategory.CLOTHING,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Hand/toe warmers',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.LOW
          },
          {
            name: 'Lip balm with SPF',
            category: ChecklistItemCategory.HEALTH,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Après-ski clothes',
            category: ChecklistItemCategory.CLOTHING,
            priority: ChecklistItemPriority.LOW
          },
          {
            name: 'Muscle recovery balm',
            category: ChecklistItemCategory.HEALTH,
            priority: ChecklistItemPriority.LOW
          }
        ],
        metadata: {
          estimatedItems: 12,
          seasonSpecific: ['winter'],
          popularFor: ['families', 'adventure seekers', 'sports enthusiasts']
        }
      },
      {
        name: 'Digital Nomad Setup',
        description: 'Everything needed for remote work while traveling',
        category: ChecklistCategory.BUSINESS,
        icon: '💻',
        isSystem: true,
        isPublic: true,
        tags: ['remote-work', 'digital-nomad', 'long-term', 'work'],
        defaultItems: [
          {
            name: 'Laptop with charger',
            category: ChecklistItemCategory.ELECTRONICS,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Portable WiFi hotspot',
            category: ChecklistItemCategory.ELECTRONICS,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Noise-cancelling headphones',
            category: ChecklistItemCategory.ELECTRONICS,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Universal power adapter',
            category: ChecklistItemCategory.ELECTRONICS,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'External hard drive (backup)',
            category: ChecklistItemCategory.ELECTRONICS,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'VPN subscription',
            category: ChecklistItemCategory.WORK,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Cloud storage setup',
            category: ChecklistItemCategory.WORK,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Ergonomic laptop stand',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Portable mouse and mousepad',
            category: ChecklistItemCategory.ELECTRONICS,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Co-working space memberships',
            category: ChecklistItemCategory.WORK,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Time zone converter app',
            category: ChecklistItemCategory.WORK,
            priority: ChecklistItemPriority.LOW
          },
          {
            name: 'Business insurance documents',
            category: ChecklistItemCategory.DOCUMENTS,
            priority: ChecklistItemPriority.MEDIUM
          }
        ],
        metadata: {
          estimatedItems: 12,
          popularFor: ['freelancers', 'remote workers', 'entrepreneurs']
        }
      },
      {
        name: 'Family Road Trip',
        description: 'Keep everyone happy on the open road',
        category: ChecklistCategory.FAMILY,
        icon: '🚗',
        isSystem: true,
        isPublic: true,
        tags: ['family', 'road-trip', 'car', 'kids', 'domestic'],
        defaultItems: [
          {
            name: 'Car maintenance check',
            category: ChecklistItemCategory.TRANSPORTATION,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Roadside assistance membership',
            category: ChecklistItemCategory.EMERGENCY,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Paper maps (backup)',
            category: ChecklistItemCategory.TRANSPORTATION,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Snacks and drinks',
            category: ChecklistItemCategory.FOOD,
            priority: ChecklistItemPriority.HIGH,
            metadata: { quantity: 10 }
          },
          {
            name: 'Entertainment for kids',
            category: ChecklistItemCategory.ENTERTAINMENT,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Travel pillows',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'First aid kit',
            category: ChecklistItemCategory.EMERGENCY,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Wet wipes',
            category: ChecklistItemCategory.TOILETRIES,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Trash bags',
            category: ChecklistItemCategory.OTHER,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Phone car chargers',
            category: ChecklistItemCategory.ELECTRONICS,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Downloaded music/podcasts',
            category: ChecklistItemCategory.ENTERTAINMENT,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Motion sickness remedies',
            category: ChecklistItemCategory.HEALTH,
            priority: ChecklistItemPriority.MEDIUM
          }
        ],
        metadata: {
          estimatedItems: 12,
          popularFor: ['families', 'couples', 'friend groups']
        }
      },
      {
        name: 'Backpacking Europe',
        description: 'Light packing for multi-country European adventure',
        category: ChecklistCategory.BUDGET,
        icon: '🎒',
        isSystem: true,
        isPublic: true,
        tags: ['backpacking', 'europe', 'budget', 'hostel', 'interrail'],
        defaultItems: [
          {
            name: 'Backpack (40-60L)',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Passport with 6+ months validity',
            category: ChecklistItemCategory.DOCUMENTS,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Eurail/Interrail pass',
            category: ChecklistItemCategory.TRANSPORTATION,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Hostel membership card',
            category: ChecklistItemCategory.ACCOMMODATION,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Quick-dry towel',
            category: ChecklistItemCategory.TOILETRIES,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Padlock for lockers',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Money belt',
            category: ChecklistItemCategory.MONEY,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Multi-country power adapter',
            category: ChecklistItemCategory.ELECTRONICS,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Guidebook or offline maps',
            category: ChecklistItemCategory.ACTIVITIES,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Laundry detergent sheets',
            category: ChecklistItemCategory.TOILETRIES,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Flip flops (for showers)',
            category: ChecklistItemCategory.CLOTHING,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Reusable water bottle',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.HIGH
          }
        ],
        metadata: {
          estimatedItems: 12,
          popularFor: ['students', 'gap year travelers', 'budget travelers']
        }
      },
      {
        name: 'Luxury Cruise Vacation',
        description: 'Elegant essentials for a cruise experience',
        category: ChecklistCategory.LUXURY,
        icon: '🛳️',
        isSystem: true,
        isPublic: true,
        tags: ['cruise', 'luxury', 'ocean', 'formal', 'all-inclusive'],
        defaultItems: [
          {
            name: 'Formal evening wear',
            category: ChecklistItemCategory.CLOTHING,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Cruise documents and boarding passes',
            category: ChecklistItemCategory.DOCUMENTS,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Passport and visas',
            category: ChecklistItemCategory.DOCUMENTS,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Seasickness medication',
            category: ChecklistItemCategory.HEALTH,
            priority: ChecklistItemPriority.HIGH
          },
          {
            name: 'Dressy casual outfits',
            category: ChecklistItemCategory.CLOTHING,
            priority: ChecklistItemPriority.MEDIUM,
            metadata: { quantity: 5 }
          },
          {
            name: 'Swimwear and cover-ups',
            category: ChecklistItemCategory.CLOTHING,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Binoculars for sightseeing',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.LOW
          },
          {
            name: 'Lanyard for room key',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Power strip (surge protected)',
            category: ChecklistItemCategory.ELECTRONICS,
            priority: ChecklistItemPriority.MEDIUM
          },
          {
            name: 'Wrinkle release spray',
            category: ChecklistItemCategory.OTHER,
            priority: ChecklistItemPriority.LOW
          },
          {
            name: 'Magnetic hooks for cabin',
            category: ChecklistItemCategory.GEAR,
            priority: ChecklistItemPriority.LOW
          },
          {
            name: 'Cash for tips',
            category: ChecklistItemCategory.MONEY,
            priority: ChecklistItemPriority.HIGH
          }
        ],
        metadata: {
          estimatedItems: 12,
          popularFor: ['couples', 'retirees', 'special occasions']
        }
      }
    ];

    // Check if templates already exist
    const existingCount = await this.prisma.checklistTemplate.count({
      where: { isSystem: true }
    });

    if (existingCount > 0) {
      console.log('System templates already initialized');
      return;
    }

    // Create all system templates
    await this.prisma.checklistTemplate.createMany({
      data: systemTemplates as any
    });

    console.log(`Created ${systemTemplates.length} system templates`);
  }
}