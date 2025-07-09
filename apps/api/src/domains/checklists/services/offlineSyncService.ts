import { PrismaClient } from '@prisma/client';
import {
  ChecklistWithRelations,
  ChecklistItemWithRelations,
  CreateChecklistDto,
  UpdateChecklistDto,
  CreateChecklistItemDto,
  UpdateChecklistItemDto
} from '../types/checklist.types';
import { checklistService } from './checklistService';
import { AppError } from '../../../shared/utils/errors';

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'checklist' | 'item';
  entityId?: string;
  data?: any;
  timestamp: Date;
  clientId: string;
}

interface SyncConflict {
  operation: SyncOperation;
  serverVersion: any;
  resolution?: 'client' | 'server' | 'merge';
}

interface SyncResult {
  synced: string[];
  conflicts: SyncConflict[];
  errors: Array<{ operation: SyncOperation; error: string }>;
}

export class OfflineSyncService {
  constructor(private prisma: PrismaClient) {}

  // Sync offline changes
  async syncOfflineChanges(
    userId: string,
    operations: SyncOperation[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      synced: [],
      conflicts: [],
      errors: []
    };

    // Sort operations by timestamp
    const sortedOperations = operations.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Process each operation
    for (const operation of sortedOperations) {
      try {
        const syncResult = await this.processSyncOperation(userId, operation);
        
        if (syncResult.conflict) {
          result.conflicts.push(syncResult.conflict);
        } else {
          result.synced.push(operation.id);
        }
      } catch (error) {
        result.errors.push({
          operation,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  // Process individual sync operation
  private async processSyncOperation(
    userId: string,
    operation: SyncOperation
  ): Promise<{ synced?: boolean; conflict?: SyncConflict }> {
    switch (operation.entity) {
      case 'checklist':
        return this.processChecklistOperation(userId, operation);
      case 'item':
        return this.processItemOperation(userId, operation);
      default:
        throw new AppError('Unknown entity type', 400);
    }
  }

  // Process checklist operations
  private async processChecklistOperation(
    userId: string,
    operation: SyncOperation
  ): Promise<{ synced?: boolean; conflict?: SyncConflict }> {
    switch (operation.type) {
      case 'create':
        // Create new checklist
        const createData: CreateChecklistDto = {
          ...operation.data,
          // Map client ID to prevent duplicates
          metadata: {
            ...operation.data.metadata,
            clientId: operation.clientId,
            syncedAt: new Date()
          }
        };
        
        // Check if already synced
        const existing = await this.prisma.checklist.findFirst({
          where: {
            userId,
            metadata: {
              path: ['clientId'],
              equals: operation.clientId
            }
          }
        });

        if (existing) {
          return { synced: true };
        }

        await checklistService.createChecklist(userId, createData);
        return { synced: true };

      case 'update':
        if (!operation.entityId) {
          throw new AppError('Entity ID required for update', 400);
        }

        // Check for conflicts
        const serverChecklist = await this.prisma.checklist.findUnique({
          where: { id: operation.entityId }
        });

        if (!serverChecklist) {
          throw new AppError('Checklist not found', 404);
        }

        // Simple conflict detection based on updatedAt
        const clientTimestamp = new Date(operation.timestamp);
        if (serverChecklist.updatedAt > clientTimestamp) {
          return {
            conflict: {
              operation,
              serverVersion: serverChecklist,
              resolution: 'server' // Default to server version
            }
          };
        }

        const updateData: UpdateChecklistDto = operation.data;
        await checklistService.updateChecklist(
          operation.entityId,
          userId,
          updateData
        );
        return { synced: true };

      case 'delete':
        if (!operation.entityId) {
          throw new AppError('Entity ID required for delete', 400);
        }

        await checklistService.deleteChecklist(operation.entityId, userId);
        return { synced: true };
    }
  }

  // Process item operations
  private async processItemOperation(
    userId: string,
    operation: SyncOperation
  ): Promise<{ synced?: boolean; conflict?: SyncConflict }> {
    switch (operation.type) {
      case 'create':
        const checklistId = operation.data.checklistId;
        if (!checklistId) {
          throw new AppError('Checklist ID required for item creation', 400);
        }

        const createData: CreateChecklistItemDto = {
          ...operation.data,
          metadata: {
            ...operation.data.metadata,
            clientId: operation.clientId,
            syncedAt: new Date()
          }
        };

        // Check if already synced
        const existing = await this.prisma.checklistItem.findFirst({
          where: {
            checklistId,
            metadata: {
              path: ['clientId'],
              equals: operation.clientId
            }
          }
        });

        if (existing) {
          return { synced: true };
        }

        await checklistService.addItem(checklistId, userId, createData);
        return { synced: true };

      case 'update':
        if (!operation.entityId) {
          throw new AppError('Entity ID required for update', 400);
        }

        // Check for conflicts
        const serverItem = await this.prisma.checklistItem.findUnique({
          where: { id: operation.entityId },
          include: { checklist: true }
        });

        if (!serverItem) {
          throw new AppError('Item not found', 404);
        }

        // Conflict detection
        const clientTimestamp = new Date(operation.timestamp);
        if (serverItem.updatedAt > clientTimestamp) {
          // Special handling for completion status conflicts
          if (operation.data.isCompleted !== undefined && 
              serverItem.isCompleted !== operation.data.isCompleted) {
            // Both marked as completed - keep server version
            if (serverItem.isCompleted && operation.data.isCompleted) {
              return { synced: true };
            }
            
            // Conflict - need resolution
            return {
              conflict: {
                operation,
                serverVersion: serverItem,
                resolution: 'server'
              }
            };
          }
        }

        const updateData: UpdateChecklistItemDto = operation.data;
        await checklistService.updateItem(
          operation.entityId,
          userId,
          updateData
        );
        return { synced: true };

      case 'delete':
        if (!operation.entityId) {
          throw new AppError('Entity ID required for delete', 400);
        }

        await checklistService.deleteItem(operation.entityId, userId);
        return { synced: true };
    }
  }

  // Get changes since last sync
  async getChangesSince(
    userId: string,
    lastSyncTimestamp: Date,
    checklistIds?: string[]
  ): Promise<{
    checklists: ChecklistWithRelations[];
    deletedChecklistIds: string[];
    deletedItemIds: string[];
  }> {
    // Get updated checklists
    const checklistWhere: any = {
      OR: [
        { userId },
        {
          collaborators: {
            some: { userId }
          }
        }
      ],
      updatedAt: { gt: lastSyncTimestamp }
    };

    if (checklistIds && checklistIds.length > 0) {
      checklistWhere.id = { in: checklistIds };
    }

    const checklists = await this.prisma.checklist.findMany({
      where: checklistWhere,
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

    // For deleted items, you would need to implement a soft delete
    // or maintain a deletion log. For now, return empty arrays.
    return {
      checklists: checklists as ChecklistWithRelations[],
      deletedChecklistIds: [],
      deletedItemIds: []
    };
  }

  // Resolve sync conflict
  async resolveConflict(
    userId: string,
    conflict: SyncConflict,
    resolution: 'client' | 'server' | 'merge',
    mergedData?: any
  ): Promise<void> {
    conflict.resolution = resolution;

    switch (resolution) {
      case 'client':
        // Apply client version
        await this.processSyncOperation(userId, conflict.operation);
        break;
      
      case 'server':
        // Keep server version (do nothing)
        break;
      
      case 'merge':
        if (!mergedData) {
          throw new AppError('Merged data required for merge resolution', 400);
        }
        
        // Apply merged version
        const mergedOperation: SyncOperation = {
          ...conflict.operation,
          data: mergedData,
          timestamp: new Date()
        };
        
        await this.processSyncOperation(userId, mergedOperation);
        break;
    }
  }

  // Generate sync token for offline capability
  generateSyncToken(userId: string, deviceId: string): string {
    // Simple token generation - in production, use proper JWT
    return Buffer.from(
      JSON.stringify({
        userId,
        deviceId,
        timestamp: new Date().toISOString()
      })
    ).toString('base64');
  }

  // Validate sync token
  validateSyncToken(token: string): { userId: string; deviceId: string } | null {
    try {
      const decoded = JSON.parse(
        Buffer.from(token, 'base64').toString('utf-8')
      );
      
      // Check token age (24 hours)
      const tokenAge = Date.now() - new Date(decoded.timestamp).getTime();
      if (tokenAge > 24 * 60 * 60 * 1000) {
        return null;
      }
      
      return {
        userId: decoded.userId,
        deviceId: decoded.deviceId
      };
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const offlineSyncService = new OfflineSyncService(
  new PrismaClient()
);