import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { checklistService } from './checklistService';
import { 
  ChecklistWebSocketEvents,
  UpdateChecklistItemDto,
  ChecklistItemWithRelations
} from '../types/checklist.types';
import { AppError } from '../../../shared/utils/errors';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export class CollaborationService {
  private io: Server;
  private prisma: PrismaClient;
  private checklistRooms: Map<string, Set<string>> = new Map(); // checklistId -> Set<userId>

  constructor(io: Server, prisma: PrismaClient) {
    this.io = io;
    this.prisma = prisma;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      // Handle checklist room joining
      socket.on('checklist:join', async (checklistId: string) => {
        try {
          const userId = socket.userId;
          if (!userId) {
            socket.emit('error', { message: 'Unauthorized' });
            return;
          }

          // Verify user has access to checklist
          await checklistService.getChecklistById(checklistId, userId);

          // Join the checklist room
          socket.join(`checklist:${checklistId}`);
          
          // Track user in room
          if (!this.checklistRooms.has(checklistId)) {
            this.checklistRooms.set(checklistId, new Set());
          }
          this.checklistRooms.get(checklistId)!.add(userId);

          // Notify others that user joined
          socket.to(`checklist:${checklistId}`).emit('checklist:user:joined', {
            userId,
            checklistId
          });

          // Send current collaborators
          const collaborators = Array.from(this.checklistRooms.get(checklistId) || []);
          socket.emit('checklist:collaborators', {
            checklistId,
            collaborators
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to join checklist' });
        }
      });

      // Handle checklist room leaving
      socket.on('checklist:leave', (checklistId: string) => {
        const userId = socket.userId;
        if (!userId) return;

        socket.leave(`checklist:${checklistId}`);
        
        // Remove user from room tracking
        const room = this.checklistRooms.get(checklistId);
        if (room) {
          room.delete(userId);
          if (room.size === 0) {
            this.checklistRooms.delete(checklistId);
          }
        }

        // Notify others that user left
        socket.to(`checklist:${checklistId}`).emit('checklist:user:left', {
          userId,
          checklistId
        });
      });

      // Handle real-time item updates
      socket.on('checklist:item:update', async (data: {
        checklistId: string;
        itemId: string;
        updates: UpdateChecklistItemDto;
      }) => {
        try {
          const userId = socket.userId;
          if (!userId) {
            socket.emit('error', { message: 'Unauthorized' });
            return;
          }

          // Update the item
          const updatedItem = await checklistService.updateItem(
            data.itemId,
            userId,
            data.updates
          );

          // Broadcast update to all users in the room
          this.io.to(`checklist:${data.checklistId}`).emit('checklist:item:updated', {
            checklistId: data.checklistId,
            itemId: data.itemId,
            updates: data.updates,
            updatedBy: userId
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to update item' });
        }
      });

      // Handle item completion toggle
      socket.on('checklist:item:toggle', async (data: {
        checklistId: string;
        itemId: string;
        isCompleted: boolean;
      }) => {
        try {
          const userId = socket.userId;
          if (!userId) {
            socket.emit('error', { message: 'Unauthorized' });
            return;
          }

          // Toggle completion
          const updatedItem = await checklistService.updateItem(
            data.itemId,
            userId,
            { isCompleted: data.isCompleted }
          );

          // Emit specific completion event
          this.io.to(`checklist:${data.checklistId}`).emit('checklist:item:completed', {
            checklistId: data.checklistId,
            itemId: data.itemId,
            completedBy: userId,
            isCompleted: data.isCompleted
          });

          // Update statistics for all users
          const stats = await checklistService.getChecklistStatistics(
            data.checklistId,
            userId
          );
          this.io.to(`checklist:${data.checklistId}`).emit('checklist:statistics:updated', {
            checklistId: data.checklistId,
            statistics: stats
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to toggle item' });
        }
      });

      // Handle typing indicators
      socket.on('checklist:typing:start', (data: {
        checklistId: string;
        itemId?: string;
      }) => {
        const userId = socket.userId;
        if (!userId) return;

        socket.to(`checklist:${data.checklistId}`).emit('checklist:user:typing', {
          userId,
          checklistId: data.checklistId,
          itemId: data.itemId
        });
      });

      socket.on('checklist:typing:stop', (data: {
        checklistId: string;
        itemId?: string;
      }) => {
        const userId = socket.userId;
        if (!userId) return;

        socket.to(`checklist:${data.checklistId}`).emit('checklist:user:stopped:typing', {
          userId,
          checklistId: data.checklistId,
          itemId: data.itemId
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        const userId = socket.userId;
        if (!userId) return;

        // Remove user from all checklist rooms
        this.checklistRooms.forEach((users, checklistId) => {
          if (users.has(userId)) {
            users.delete(userId);
            if (users.size === 0) {
              this.checklistRooms.delete(checklistId);
            }
            
            // Notify others
            socket.to(`checklist:${checklistId}`).emit('checklist:user:left', {
              userId,
              checklistId
            });
          }
        });
      });
    });
  }

  // Broadcast item addition
  broadcastItemAdded(checklistId: string, item: ChecklistItemWithRelations) {
    this.io.to(`checklist:${checklistId}`).emit('checklist:item:added', {
      checklistId,
      item
    });
  }

  // Broadcast item deletion
  broadcastItemDeleted(checklistId: string, itemId: string) {
    this.io.to(`checklist:${checklistId}`).emit('checklist:item:deleted', {
      checklistId,
      itemId
    });
  }

  // Broadcast collaborator changes
  broadcastCollaboratorAdded(checklistId: string, collaborator: any) {
    this.io.to(`checklist:${checklistId}`).emit('checklist:collaborator:added', {
      checklistId,
      collaborator
    });
  }

  broadcastCollaboratorRemoved(checklistId: string, userId: string) {
    this.io.to(`checklist:${checklistId}`).emit('checklist:collaborator:removed', {
      checklistId,
      userId
    });
  }

  // Get active users for a checklist
  getActiveUsers(checklistId: string): string[] {
    return Array.from(this.checklistRooms.get(checklistId) || []);
  }

  // Send notification to specific user
  notifyUser(userId: string, event: string, data: any) {
    const sockets = this.io.sockets.sockets;
    sockets.forEach((socket: AuthenticatedSocket) => {
      if (socket.userId === userId) {
        socket.emit(event, data);
      }
    });
  }
}

// Export factory function since we need Socket.IO server instance
export const createCollaborationService = (io: Server, prisma: PrismaClient) => {
  return new CollaborationService(io, prisma);
};