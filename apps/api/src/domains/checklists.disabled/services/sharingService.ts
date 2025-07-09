import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import {
  ChecklistWithRelations,
  ChecklistShareDto,
  ChecklistShareResponse,
  CreateChecklistDto
} from '../types/checklist.types';
import { checklistService } from './checklistService';
import { AppError } from '../../../shared/utils/errors';

interface ShareCode {
  checklistId: string;
  expiresAt?: Date;
  includeCompleted: boolean;
}

export class SharingService {
  private prisma: PrismaClient;
  private shareCodes: Map<string, ShareCode> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    // Clean up expired codes every hour
    setInterval(() => this.cleanupExpiredCodes(), 3600000);
  }

  // Generate share link/code for a checklist
  async shareChecklist(
    checklistId: string,
    userId: string,
    options: ChecklistShareDto
  ): Promise<ChecklistShareResponse> {
    // Verify user has permission to share
    const checklist = await checklistService.getChecklistById(checklistId, userId);
    
    // Check if user can share (owner or has share permission)
    const canShare = checklist.userId === userId || 
      checklist.collaborators.some(c => 
        c.userId === userId && 
        (c.permissions as any).can_share
      );

    if (!canShare) {
      throw new AppError('You do not have permission to share this checklist', 403);
    }

    const response: ChecklistShareResponse = {};

    switch (options.shareType) {
      case 'link':
        // Generate shareable link
        const shareCode = this.generateShareCode();
        this.shareCodes.set(shareCode, {
          checklistId,
          expiresAt: options.expiresAt,
          includeCompleted: options.includeCompleted || false
        });
        
        response.shareCode = shareCode;
        response.shareUrl = `${process.env.FRONTEND_URL}/checklists/shared/${shareCode}`;
        response.expiresAt = options.expiresAt;
        break;

      case 'copy':
        // Return checklist data for copying
        response.checklistData = this.prepareChecklistForSharing(
          checklist,
          options.includeCompleted || false
        );
        break;

      case 'template':
        // Make checklist available as a public template
        await this.prisma.checklist.update({
          where: { id: checklistId },
          data: { isPublic: true, isTemplate: true }
        });
        response.shareUrl = `${process.env.FRONTEND_URL}/checklists/templates/${checklistId}`;
        break;
    }

    return response;
  }

  // Get shared checklist by share code
  async getSharedChecklist(shareCode: string): Promise<ChecklistWithRelations | null> {
    const shareData = this.shareCodes.get(shareCode);
    
    if (!shareData) {
      throw new AppError('Invalid or expired share code', 404);
    }

    // Check if expired
    if (shareData.expiresAt && new Date() > shareData.expiresAt) {
      this.shareCodes.delete(shareCode);
      throw new AppError('Share link has expired', 410);
    }

    // Get the checklist
    const checklist = await this.prisma.checklist.findUnique({
      where: { id: shareData.checklistId },
      include: {
        user: true,
        trip: true,
        items: {
          include: {
            assignee: true,
            completedUser: true
          },
          orderBy: { orderIndex: 'asc' }
        },
        collaborators: {
          include: { user: true }
        }
      }
    });

    if (!checklist) {
      throw new AppError('Checklist not found', 404);
    }

    // Filter out completed items if requested
    if (!shareData.includeCompleted) {
      checklist.items = checklist.items.filter(item => !item.isCompleted);
    }

    // Remove sensitive information
    return this.sanitizeChecklistForPublic(checklist as ChecklistWithRelations);
  }

  // Import shared checklist
  async importSharedChecklist(
    shareCode: string,
    userId: string,
    options: {
      name?: string;
      tripId?: string;
    }
  ): Promise<ChecklistWithRelations> {
    const sharedChecklist = await this.getSharedChecklist(shareCode);
    
    if (!sharedChecklist) {
      throw new AppError('Shared checklist not found', 404);
    }

    // Create a copy of the checklist
    const createData: CreateChecklistDto = {
      name: options.name || `${sharedChecklist.name} (Imported)`,
      description: sharedChecklist.description,
      tripId: options.tripId,
      category: sharedChecklist.category as any,
      metadata: sharedChecklist.metadata as any,
      items: sharedChecklist.items.map((item, index) => ({
        content: item.content,
        priority: item.priority as any,
        notes: item.notes || undefined,
        orderIndex: index,
        metadata: item.metadata as any
      }))
    };

    return checklistService.createChecklist(userId, createData);
  }

  // Get public templates
  async getPublicTemplates(filters: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    templates: ChecklistWithRelations[];
    total: number;
    page: number;
    pages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      isTemplate: true,
      isPublic: true
    };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [templates, total] = await Promise.all([
      this.prisma.checklist.findMany({
        where,
        include: {
          user: true,
          items: {
            orderBy: { orderIndex: 'asc' }
          },
          _count: {
            select: { items: true }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      this.prisma.checklist.count({ where })
    ]);

    return {
      templates: templates.map(t => this.sanitizeChecklistForPublic(t as any)),
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  // Rate a public template
  async rateTemplate(
    templateId: string,
    userId: string,
    rating: number
  ): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }

    const template = await this.prisma.checklist.findFirst({
      where: {
        id: templateId,
        isTemplate: true,
        isPublic: true
      }
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    // Store rating (you might want to create a separate ratings table)
    // For now, we'll update metadata
    const metadata = (template.metadata as any) || {};
    const ratings = metadata.ratings || {};
    ratings[userId] = rating;
    
    // Calculate average rating
    const ratingValues = Object.values(ratings) as number[];
    const averageRating = ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;

    await this.prisma.checklist.update({
      where: { id: templateId },
      data: {
        metadata: {
          ...metadata,
          ratings,
          averageRating,
          ratingCount: ratingValues.length
        }
      }
    });
  }

  // Helper methods
  private generateShareCode(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private cleanupExpiredCodes(): void {
    const now = new Date();
    for (const [code, data] of this.shareCodes.entries()) {
      if (data.expiresAt && data.expiresAt < now) {
        this.shareCodes.delete(code);
      }
    }
  }

  private prepareChecklistForSharing(
    checklist: ChecklistWithRelations,
    includeCompleted: boolean
  ): Partial<ChecklistWithRelations> {
    const items = includeCompleted 
      ? checklist.items 
      : checklist.items.filter(item => !item.isCompleted);

    return {
      name: checklist.name,
      description: checklist.description,
      category: checklist.category,
      metadata: checklist.metadata,
      items: items.map(item => ({
        content: item.content,
        priority: item.priority,
        notes: item.notes,
        orderIndex: item.orderIndex,
        metadata: item.metadata
      } as any))
    };
  }

  private sanitizeChecklistForPublic(
    checklist: ChecklistWithRelations
  ): ChecklistWithRelations {
    // Remove sensitive user information
    const sanitized = { ...checklist };
    
    // Only keep basic user info
    if (sanitized.user) {
      sanitized.user = {
        id: sanitized.user.id,
        email: '' // Hide email
      } as any;
    }

    // Remove collaborator details
    sanitized.collaborators = [];

    // Remove assignee information from items
    sanitized.items = sanitized.items.map(item => ({
      ...item,
      assignee: undefined,
      assignedTo: undefined,
      completedUser: undefined,
      completedBy: undefined
    }));

    return sanitized;
  }
}

// Export singleton instance
export const sharingService = new SharingService(
  new PrismaClient()
);