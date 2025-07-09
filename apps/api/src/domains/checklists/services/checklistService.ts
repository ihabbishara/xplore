import { PrismaClient, Prisma } from '@prisma/client';
import { 
  Checklist,
  ChecklistTemplate,
  ChecklistItem,
  ChecklistCollaborator,
  CreateChecklistDto,
  UpdateChecklistDto,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  BulkCreateChecklistItemsDto,
  ReorderChecklistItemsDto,
  AddCollaboratorDto,
  UpdateCollaboratorDto,
  ChecklistFilters,
  ChecklistItemFilters,
  ChecklistActivityAction,
  CollaboratorRole,
  ChecklistVisibility,
  ChecklistItemPriority
} from '../types/checklist.types';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../../shared/utils/errors';

export class ChecklistService {
  constructor(private prisma: PrismaClient) {}

  // Checklist CRUD operations
  async createChecklist(userId: string, data: CreateChecklistDto): Promise<Checklist> {
    // If template is provided, fetch it to populate items
    let templateItems: any[] = [];
    if (data.templateId) {
      const template = await this.prisma.checklistTemplate.findUnique({
        where: { id: data.templateId }
      });
      
      if (!template) {
        throw new NotFoundError('Template not found');
      }
      
      templateItems = template.defaultItems as any[];
      
      // Update template usage count
      await this.prisma.checklistTemplate.update({
        where: { id: data.templateId },
        data: { usageCount: { increment: 1 } }
      });
    }

    // Create checklist with items in a transaction
    const checklist = await this.prisma.$transaction(async (tx) => {
      // Create the checklist
      const newChecklist = await tx.checklist.create({
        data: {
          name: data.name,
          description: data.description,
          userId,
          tripId: data.tripId,
          templateId: data.templateId,
          dueDate: data.dueDate,
          isCollaborative: data.isCollaborative || false,
          visibility: data.visibility || ChecklistVisibility.PRIVATE,
          metadata: data.metadata as any
        }
      });

      // Create items from template if any
      if (templateItems.length > 0) {
        const items = templateItems.map((item, index) => ({
          checklistId: newChecklist.id,
          name: item.name,
          description: item.description,
          category: item.category,
          priority: item.priority || ChecklistItemPriority.LOW,
          position: index,
          metadata: item.metadata as any
        }));

        await tx.checklistItem.createMany({
          data: items
        });
      }

      // If collaborative, add creator as owner
      if (data.isCollaborative) {
        await tx.checklistCollaborator.create({
          data: {
            checklistId: newChecklist.id,
            userId,
            role: CollaboratorRole.OWNER,
            canEdit: true,
            canComplete: true,
            canAssign: true
          }
        });
      }

      // Log activity
      await tx.checklistActivity.create({
        data: {
          checklistId: newChecklist.id,
          userId,
          action: ChecklistActivityAction.CREATED
        }
      });

      return newChecklist;
    });

    return this.getChecklistById(checklist.id, userId);
  }

  async getChecklistById(checklistId: string, userId: string): Promise<Checklist> {
    const checklist = await this.prisma.checklist.findUnique({
      where: { id: checklistId },
      include: {
        user: {
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
        },
        trip: true,
        template: true,
        items: {
          orderBy: { position: 'asc' },
          include: {
            assignee: {
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
        },
        collaborators: {
          include: {
            user: {
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
        }
      }
    });

    if (!checklist) {
      throw new NotFoundError('Checklist not found');
    }

    // Check access permissions
    const hasAccess = await this.checkChecklistAccess(checklistId, userId, 'view');
    if (!hasAccess) {
      throw new ForbiddenError('Access denied to this checklist');
    }

    // Calculate progress
    const totalItems = checklist.items.length;
    const completedItems = checklist.items.filter(item => item.isCompleted).length;
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      ...checklist,
      progress,
      createdAt: checklist.createdAt,
      updatedAt: checklist.updatedAt
    } as any;
  }

  async updateChecklist(
    checklistId: string, 
    userId: string, 
    data: UpdateChecklistDto
  ): Promise<Checklist> {
    // Check permissions
    const hasAccess = await this.checkChecklistAccess(checklistId, userId, 'edit');
    if (!hasAccess) {
      throw new ForbiddenError('You do not have permission to edit this checklist');
    }

    const checklist = await this.prisma.checklist.update({
      where: { id: checklistId },
      data: {
        name: data.name,
        description: data.description,
        dueDate: data.dueDate,
        visibility: data.visibility,
        metadata: data.metadata as any,
        updatedAt: new Date()
      }
    });

    // Log activity
    await this.prisma.checklistActivity.create({
      data: {
        checklistId,
        userId,
        action: ChecklistActivityAction.UPDATED,
        details: { changes: Object.keys(data) }
      }
    });

    return this.getChecklistById(checklistId, userId);
  }

  async deleteChecklist(checklistId: string, userId: string): Promise<void> {
    // Check ownership
    const checklist = await this.prisma.checklist.findUnique({
      where: { id: checklistId }
    });

    if (!checklist) {
      throw new NotFoundError('Checklist not found');
    }

    if (checklist.userId !== userId) {
      throw new ForbiddenError('You can only delete your own checklists');
    }

    await this.prisma.checklist.delete({
      where: { id: checklistId }
    });
  }

  async getUserChecklists(userId: string, filters: ChecklistFilters): Promise<{
    checklists: Checklist[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ChecklistWhereInput = {
      OR: [
        { userId },
        {
          collaborators: {
            some: { userId }
          }
        }
      ]
    };

    if (filters.tripId) {
      where.tripId = filters.tripId;
    }

    if (filters.visibility) {
      where.visibility = filters.visibility;
    }

    if (filters.isCollaborative !== undefined) {
      where.isCollaborative = filters.isCollaborative;
    }

    if (filters.dueBefore) {
      where.dueDate = { lte: filters.dueBefore };
    }

    if (filters.dueAfter) {
      where.dueDate = { gte: filters.dueAfter };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Get checklists with counts
    const [checklists, total] = await Promise.all([
      this.prisma.checklist.findMany({
        where,
        skip,
        take: limit,
        orderBy: filters.sortBy ? {
          [filters.sortBy]: filters.sortOrder || 'desc'
        } : { updatedAt: 'desc' },
        include: {
          items: {
            select: {
              id: true,
              isCompleted: true
            }
          },
          collaborators: {
            select: {
              userId: true,
              role: true
            }
          },
          trip: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      this.prisma.checklist.count({ where })
    ]);

    // Calculate progress for each checklist
    const checklistsWithProgress = checklists.map(checklist => {
      const totalItems = checklist.items.length;
      const completedItems = checklist.items.filter(item => item.isCompleted).length;
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        ...checklist,
        progress,
        createdAt: checklist.createdAt,
        updatedAt: checklist.updatedAt
      };
    });

    // Filter by incomplete items if requested
    let filteredChecklists = checklistsWithProgress;
    if (filters.hasIncompleteItems) {
      filteredChecklists = checklistsWithProgress.filter(c => c.progress < 100);
    }

    return {
      checklists: filteredChecklists as any[],
      total,
      page,
      limit
    };
  }

  // Checklist Item operations
  async createChecklistItem(
    checklistId: string,
    userId: string,
    data: CreateChecklistItemDto
  ): Promise<ChecklistItem> {
    // Check permissions
    const hasAccess = await this.checkChecklistAccess(checklistId, userId, 'edit');
    if (!hasAccess) {
      throw new ForbiddenError('You do not have permission to add items to this checklist');
    }

    // Get the next position if not provided
    let position = data.position;
    if (position === undefined) {
      const lastItem = await this.prisma.checklistItem.findFirst({
        where: { checklistId },
        orderBy: { position: 'desc' }
      });
      position = lastItem ? lastItem.position + 1 : 0;
    }

    const item = await this.prisma.checklistItem.create({
      data: {
        checklistId,
        name: data.name,
        description: data.description,
        category: data.category,
        priority: data.priority || ChecklistItemPriority.LOW,
        assignedTo: data.assignedTo,
        dueDate: data.dueDate,
        notes: data.notes,
        position,
        metadata: data.metadata as any
      },
      include: {
        assignee: {
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

    // Log activity
    await this.prisma.checklistActivity.create({
      data: {
        checklistId,
        userId,
        itemId: item.id,
        action: ChecklistActivityAction.ITEM_ADDED,
        details: { itemName: item.name }
      }
    });

    // Update checklist progress
    await this.updateChecklistProgress(checklistId);

    return item as any;
  }

  async bulkCreateChecklistItems(
    checklistId: string,
    userId: string,
    data: BulkCreateChecklistItemsDto
  ): Promise<ChecklistItem[]> {
    // Check permissions
    const hasAccess = await this.checkChecklistAccess(checklistId, userId, 'edit');
    if (!hasAccess) {
      throw new ForbiddenError('You do not have permission to add items to this checklist');
    }

    // Get the starting position
    const lastItem = await this.prisma.checklistItem.findFirst({
      where: { checklistId },
      orderBy: { position: 'desc' }
    });
    let position = lastItem ? lastItem.position + 1 : 0;

    // Create items
    const items = await this.prisma.$transaction(
      data.items.map((itemData, index) => 
        this.prisma.checklistItem.create({
          data: {
            checklistId,
            name: itemData.name,
            description: itemData.description,
            category: itemData.category,
            priority: itemData.priority || ChecklistItemPriority.LOW,
            assignedTo: itemData.assignedTo,
            dueDate: itemData.dueDate,
            notes: itemData.notes,
            position: position + index,
            metadata: itemData.metadata as any
          }
        })
      )
    );

    // Log activity
    await this.prisma.checklistActivity.create({
      data: {
        checklistId,
        userId,
        action: ChecklistActivityAction.ITEM_ADDED,
        details: { count: items.length }
      }
    });

    // Update checklist progress
    await this.updateChecklistProgress(checklistId);

    return items as any[];
  }

  async updateChecklistItem(
    checklistId: string,
    itemId: string,
    userId: string,
    data: UpdateChecklistItemDto
  ): Promise<ChecklistItem> {
    // Check permissions
    const hasAccess = await this.checkChecklistAccess(checklistId, userId, 'edit');
    if (!hasAccess) {
      throw new ForbiddenError('You do not have permission to edit items in this checklist');
    }

    // Verify item belongs to checklist
    const existingItem = await this.prisma.checklistItem.findFirst({
      where: { id: itemId, checklistId }
    });

    if (!existingItem) {
      throw new NotFoundError('Item not found in this checklist');
    }

    const item = await this.prisma.checklistItem.update({
      where: { id: itemId },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        priority: data.priority,
        assignedTo: data.assignedTo,
        dueDate: data.dueDate,
        notes: data.notes,
        position: data.position,
        metadata: data.metadata as any,
        updatedAt: new Date()
      },
      include: {
        assignee: {
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

    // Log activity
    await this.prisma.checklistActivity.create({
      data: {
        checklistId,
        userId,
        itemId,
        action: ChecklistActivityAction.UPDATED,
        details: { changes: Object.keys(data) }
      }
    });

    return item as any;
  }

  async toggleChecklistItem(
    checklistId: string,
    itemId: string,
    userId: string
  ): Promise<ChecklistItem> {
    // Check permissions
    const hasAccess = await this.checkChecklistAccess(checklistId, userId, 'complete');
    if (!hasAccess) {
      throw new ForbiddenError('You do not have permission to complete items in this checklist');
    }

    // Get current item state
    const item = await this.prisma.checklistItem.findFirst({
      where: { id: itemId, checklistId }
    });

    if (!item) {
      throw new NotFoundError('Item not found in this checklist');
    }

    // Toggle completion
    const updatedItem = await this.prisma.checklistItem.update({
      where: { id: itemId },
      data: {
        isCompleted: !item.isCompleted,
        completedAt: !item.isCompleted ? new Date() : null,
        completedBy: !item.isCompleted ? userId : null
      },
      include: {
        assignee: {
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

    // Log activity
    await this.prisma.checklistActivity.create({
      data: {
        checklistId,
        userId,
        itemId,
        action: updatedItem.isCompleted 
          ? ChecklistActivityAction.COMPLETED 
          : ChecklistActivityAction.UNCOMPLETED
      }
    });

    // Update checklist progress
    await this.updateChecklistProgress(checklistId);

    return updatedItem as any;
  }

  async deleteChecklistItem(
    checklistId: string,
    itemId: string,
    userId: string
  ): Promise<void> {
    // Check permissions
    const hasAccess = await this.checkChecklistAccess(checklistId, userId, 'edit');
    if (!hasAccess) {
      throw new ForbiddenError('You do not have permission to delete items from this checklist');
    }

    // Verify item belongs to checklist
    const item = await this.prisma.checklistItem.findFirst({
      where: { id: itemId, checklistId }
    });

    if (!item) {
      throw new NotFoundError('Item not found in this checklist');
    }

    await this.prisma.checklistItem.delete({
      where: { id: itemId }
    });

    // Log activity
    await this.prisma.checklistActivity.create({
      data: {
        checklistId,
        userId,
        action: ChecklistActivityAction.ITEM_REMOVED,
        details: { itemName: item.name }
      }
    });

    // Update checklist progress
    await this.updateChecklistProgress(checklistId);
  }

  async reorderChecklistItems(
    checklistId: string,
    userId: string,
    data: ReorderChecklistItemsDto
  ): Promise<void> {
    // Check permissions
    const hasAccess = await this.checkChecklistAccess(checklistId, userId, 'edit');
    if (!hasAccess) {
      throw new ForbiddenError('You do not have permission to reorder items in this checklist');
    }

    // Verify all items belong to the checklist
    const itemCount = await this.prisma.checklistItem.count({
      where: {
        id: { in: data.itemIds },
        checklistId
      }
    });

    if (itemCount !== data.itemIds.length) {
      throw new BadRequestError('Some items do not belong to this checklist');
    }

    // Update positions in a transaction
    await this.prisma.$transaction(
      data.itemIds.map((itemId, index) =>
        this.prisma.checklistItem.update({
          where: { id: itemId },
          data: { position: index }
        })
      )
    );

    // Log activity
    await this.prisma.checklistActivity.create({
      data: {
        checklistId,
        userId,
        action: ChecklistActivityAction.ITEM_MOVED,
        details: { itemCount: data.itemIds.length }
      }
    });
  }

  // Collaborator operations
  async addCollaborator(
    checklistId: string,
    userId: string,
    data: AddCollaboratorDto
  ): Promise<ChecklistCollaborator> {
    // Check if user is owner or has permission to add collaborators
    const checklist = await this.prisma.checklist.findUnique({
      where: { id: checklistId }
    });

    if (!checklist) {
      throw new NotFoundError('Checklist not found');
    }

    if (checklist.userId !== userId) {
      const collaborator = await this.prisma.checklistCollaborator.findFirst({
        where: { checklistId, userId, role: CollaboratorRole.OWNER }
      });
      
      if (!collaborator) {
        throw new ForbiddenError('Only checklist owners can add collaborators');
      }
    }

    // Check if user is already a collaborator
    const existing = await this.prisma.checklistCollaborator.findUnique({
      where: {
        checklistId_userId: {
          checklistId,
          userId: data.userId
        }
      }
    });

    if (existing) {
      throw new BadRequestError('User is already a collaborator');
    }

    // Ensure checklist is collaborative
    if (!checklist.isCollaborative) {
      await this.prisma.checklist.update({
        where: { id: checklistId },
        data: { isCollaborative: true }
      });
    }

    const collaborator = await this.prisma.checklistCollaborator.create({
      data: {
        checklistId,
        userId: data.userId,
        role: data.role || CollaboratorRole.VIEWER,
        canEdit: data.canEdit || false,
        canComplete: data.canComplete || true,
        canAssign: data.canAssign || false,
        invitedBy: userId
      },
      include: {
        user: {
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

    // Log activity
    await this.prisma.checklistActivity.create({
      data: {
        checklistId,
        userId,
        action: ChecklistActivityAction.SHARED,
        details: { 
          collaboratorId: data.userId,
          role: collaborator.role 
        }
      }
    });

    return collaborator as any;
  }

  async updateCollaborator(
    checklistId: string,
    collaboratorId: string,
    userId: string,
    data: UpdateCollaboratorDto
  ): Promise<ChecklistCollaborator> {
    // Check if user is owner
    const checklist = await this.prisma.checklist.findUnique({
      where: { id: checklistId }
    });

    if (!checklist) {
      throw new NotFoundError('Checklist not found');
    }

    if (checklist.userId !== userId) {
      const userCollaborator = await this.prisma.checklistCollaborator.findFirst({
        where: { checklistId, userId, role: CollaboratorRole.OWNER }
      });
      
      if (!userCollaborator) {
        throw new ForbiddenError('Only checklist owners can update collaborators');
      }
    }

    const collaborator = await this.prisma.checklistCollaborator.update({
      where: { id: collaboratorId },
      data: {
        role: data.role,
        canEdit: data.canEdit,
        canComplete: data.canComplete,
        canAssign: data.canAssign
      },
      include: {
        user: {
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

    // Log activity
    await this.prisma.checklistActivity.create({
      data: {
        checklistId,
        userId,
        action: ChecklistActivityAction.UPDATED,
        details: { 
          collaboratorId: collaborator.userId,
          changes: Object.keys(data)
        }
      }
    });

    return collaborator as any;
  }

  async removeCollaborator(
    checklistId: string,
    collaboratorId: string,
    userId: string
  ): Promise<void> {
    // Check if user is owner or removing themselves
    const checklist = await this.prisma.checklist.findUnique({
      where: { id: checklistId }
    });

    if (!checklist) {
      throw new NotFoundError('Checklist not found');
    }

    const collaborator = await this.prisma.checklistCollaborator.findUnique({
      where: { id: collaboratorId }
    });

    if (!collaborator) {
      throw new NotFoundError('Collaborator not found');
    }

    const isOwner = checklist.userId === userId;
    const isSelf = collaborator.userId === userId;

    if (!isOwner && !isSelf) {
      throw new ForbiddenError('You can only remove yourself or be removed by the owner');
    }

    await this.prisma.checklistCollaborator.delete({
      where: { id: collaboratorId }
    });

    // Log activity
    await this.prisma.checklistActivity.create({
      data: {
        checklistId,
        userId,
        action: ChecklistActivityAction.UNSHARED,
        details: { 
          removedUserId: collaborator.userId
        }
      }
    });
  }

  // Helper methods
  private async checkChecklistAccess(
    checklistId: string,
    userId: string,
    action: 'view' | 'edit' | 'complete' | 'assign'
  ): Promise<boolean> {
    const checklist = await this.prisma.checklist.findUnique({
      where: { id: checklistId },
      include: {
        collaborators: {
          where: { userId }
        }
      }
    });

    if (!checklist) {
      return false;
    }

    // Owner has full access
    if (checklist.userId === userId) {
      return true;
    }

    // Check visibility for view access
    if (action === 'view') {
      if (checklist.visibility === ChecklistVisibility.PUBLIC) {
        return true;
      }
      if (checklist.visibility === ChecklistVisibility.SHARED && checklist.collaborators.length > 0) {
        return true;
      }
    }

    // Check collaborator permissions
    const collaborator = checklist.collaborators[0];
    if (!collaborator) {
      return false;
    }

    switch (action) {
      case 'view':
        return true;
      case 'edit':
        return collaborator.canEdit;
      case 'complete':
        return collaborator.canComplete;
      case 'assign':
        return collaborator.canAssign;
      default:
        return false;
    }
  }

  private async updateChecklistProgress(checklistId: string): Promise<void> {
    const items = await this.prisma.checklistItem.findMany({
      where: { checklistId },
      select: { isCompleted: true }
    });

    const totalItems = items.length;
    const completedItems = items.filter(item => item.isCompleted).length;
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    await this.prisma.checklist.update({
      where: { id: checklistId },
      data: { progress }
    });
  }

  // Activity history
  async getChecklistActivities(
    checklistId: string,
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    // Check access
    const hasAccess = await this.checkChecklistAccess(checklistId, userId, 'view');
    if (!hasAccess) {
      throw new ForbiddenError('Access denied to this checklist');
    }

    const activities = await this.prisma.checklistActivity.findMany({
      where: { checklistId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
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

    return activities;
  }
}