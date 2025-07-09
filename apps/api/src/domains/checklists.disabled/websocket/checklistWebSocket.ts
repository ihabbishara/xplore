import { Server as SocketIOServer, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { ChecklistService } from '../services/checklistService';
import { ChecklistWebSocketEvents } from '../types/checklist.types';

const prisma = new PrismaClient();
const checklistService = new ChecklistService(prisma);

interface AuthenticatedSocket extends Socket {
  userId?: string;
  checklistRooms: Set<string>;
}

export function setupChecklistWebSocket(io: SocketIOServer) {
  const checklistNamespace = io.of('/checklists');

  checklistNamespace.use(async (socket: AuthenticatedSocket, next) => {
    try {
      // Extract and verify auth token
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // TODO: Verify JWT token and extract userId
      // For now, we'll assume the token contains the userId
      socket.userId = socket.handshake.auth.userId;
      socket.checklistRooms = new Set();

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  checklistNamespace.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected to checklist namespace`);

    // Join checklist room
    socket.on('join:checklist', async (checklistId: string) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        // Verify user has access to the checklist
        const hasAccess = await checklistService['checkChecklistAccess'](
          checklistId,
          socket.userId,
          'view'
        );

        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to this checklist' });
          return;
        }

        // Join the room
        socket.join(`checklist:${checklistId}`);
        socket.checklistRooms.add(checklistId);
        
        socket.emit('joined:checklist', { checklistId });
        
        // Notify others in the room
        socket.to(`checklist:${checklistId}`).emit('user:joined', {
          userId: socket.userId,
          checklistId
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join checklist' });
      }
    });

    // Leave checklist room
    socket.on('leave:checklist', (checklistId: string) => {
      socket.leave(`checklist:${checklistId}`);
      socket.checklistRooms.delete(checklistId);
      
      // Notify others in the room
      socket.to(`checklist:${checklistId}`).emit('user:left', {
        userId: socket.userId,
        checklistId
      });
    });

    // Item operations with real-time updates
    socket.on('item:toggle', async (data: { checklistId: string; itemId: string }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        const item = await checklistService.toggleChecklistItem(
          data.checklistId,
          data.itemId,
          socket.userId
        );

        // Emit to all users in the checklist room
        checklistNamespace.to(`checklist:${data.checklistId}`).emit(
          item.isCompleted ? 'item:completed' : 'item:uncompleted',
          {
            checklistId: data.checklistId,
            itemId: data.itemId,
            completedBy: item.isCompleted ? socket.userId : null
          }
        );

        // Update progress
        const checklist = await checklistService.getChecklistById(
          data.checklistId,
          socket.userId
        );

        checklistNamespace.to(`checklist:${data.checklistId}`).emit(
          'checklist:progress',
          {
            checklistId: data.checklistId,
            progress: checklist.progress
          }
        );
      } catch (error) {
        socket.emit('error', { message: 'Failed to toggle item' });
      }
    });

    // Item creation
    socket.on('item:create', async (data: { checklistId: string; item: any }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        const item = await checklistService.createChecklistItem(
          data.checklistId,
          socket.userId,
          data.item
        );

        // Emit to all users in the checklist room
        checklistNamespace.to(`checklist:${data.checklistId}`).emit(
          'item:created',
          {
            checklistId: data.checklistId,
            item
          }
        );
      } catch (error) {
        socket.emit('error', { message: 'Failed to create item' });
      }
    });

    // Item update
    socket.on('item:update', async (data: { 
      checklistId: string; 
      itemId: string; 
      updates: any 
    }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        const item = await checklistService.updateChecklistItem(
          data.checklistId,
          data.itemId,
          socket.userId,
          data.updates
        );

        // Emit to all users in the checklist room
        checklistNamespace.to(`checklist:${data.checklistId}`).emit(
          'item:updated',
          {
            checklistId: data.checklistId,
            item
          }
        );
      } catch (error) {
        socket.emit('error', { message: 'Failed to update item' });
      }
    });

    // Item deletion
    socket.on('item:delete', async (data: { checklistId: string; itemId: string }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        await checklistService.deleteChecklistItem(
          data.checklistId,
          data.itemId,
          socket.userId
        );

        // Emit to all users in the checklist room
        checklistNamespace.to(`checklist:${data.checklistId}`).emit(
          'item:deleted',
          {
            checklistId: data.checklistId,
            itemId: data.itemId
          }
        );
      } catch (error) {
        socket.emit('error', { message: 'Failed to delete item' });
      }
    });

    // Item reordering
    socket.on('items:reorder', async (data: { 
      checklistId: string; 
      itemIds: string[] 
    }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        await checklistService.reorderChecklistItems(
          data.checklistId,
          socket.userId,
          { itemIds: data.itemIds }
        );

        // Emit to all users in the checklist room
        checklistNamespace.to(`checklist:${data.checklistId}`).emit(
          'item:reordered',
          {
            checklistId: data.checklistId,
            itemIds: data.itemIds
          }
        );
      } catch (error) {
        socket.emit('error', { message: 'Failed to reorder items' });
      }
    });

    // Typing indicators
    socket.on('typing:start', (data: { checklistId: string; itemId?: string }) => {
      socket.to(`checklist:${data.checklistId}`).emit('user:typing', {
        userId: socket.userId,
        checklistId: data.checklistId,
        itemId: data.itemId
      });
    });

    socket.on('typing:stop', (data: { checklistId: string; itemId?: string }) => {
      socket.to(`checklist:${data.checklistId}`).emit('user:stopped_typing', {
        userId: socket.userId,
        checklistId: data.checklistId,
        itemId: data.itemId
      });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected from checklist namespace`);
      
      // Leave all checklist rooms
      socket.checklistRooms.forEach(checklistId => {
        socket.to(`checklist:${checklistId}`).emit('user:left', {
          userId: socket.userId,
          checklistId
        });
      });
    });
  });

  return checklistNamespace;
}

// Utility function to emit checklist events from services
export function emitChecklistEvent<K extends keyof ChecklistWebSocketEvents>(
  io: SocketIOServer,
  checklistId: string,
  event: K,
  data: ChecklistWebSocketEvents[K]
) {
  io.of('/checklists')
    .to(`checklist:${checklistId}`)
    .emit(event, data);
}