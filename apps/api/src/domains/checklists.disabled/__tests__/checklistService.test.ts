import { PrismaClient } from '@prisma/client';
import { ChecklistService } from '../services/checklistService';
import { 
  ChecklistVisibility, 
  ChecklistItemPriority,
  CollaboratorRole 
} from '../types/checklist.types';
import { NotFoundError, ForbiddenError } from '../../../shared/utils/errors';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    $transaction: jest.fn(),
    checklist: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    checklistTemplate: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    checklistItem: {
      create: jest.fn(),
      createMany: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    checklistCollaborator: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    checklistActivity: {
      create: jest.fn(),
      findMany: jest.fn()
    }
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

describe('ChecklistService', () => {
  let prisma: PrismaClient;
  let checklistService: ChecklistService;

  beforeEach(() => {
    prisma = new PrismaClient();
    checklistService = new ChecklistService(prisma);
    jest.clearAllMocks();
  });

  describe('createChecklist', () => {
    it('should create a checklist without template', async () => {
      const userId = 'user-123';
      const checklistData = {
        name: 'My Travel Checklist',
        description: 'Checklist for my trip',
        visibility: ChecklistVisibility.PRIVATE
      };

      const mockChecklist = {
        id: 'checklist-123',
        ...checklistData,
        userId,
        progress: 0
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          checklist: {
            create: jest.fn().mockResolvedValue(mockChecklist)
          },
          checklistActivity: {
            create: jest.fn()
          }
        });
      });

      (prisma.checklist.findUnique as jest.Mock).mockResolvedValue({
        ...mockChecklist,
        items: [],
        collaborators: []
      });

      const result = await checklistService.createChecklist(userId, checklistData);

      expect(result).toHaveProperty('id', 'checklist-123');
      expect(result).toHaveProperty('name', checklistData.name);
    });

    it('should create a checklist from template', async () => {
      const userId = 'user-123';
      const templateId = 'template-123';
      const checklistData = {
        name: 'Weekend Trip',
        templateId
      };

      const mockTemplate = {
        id: templateId,
        defaultItems: [
          {
            name: 'Passport',
            category: 'documents',
            priority: ChecklistItemPriority.HIGH
          }
        ]
      };

      const mockChecklist = {
        id: 'checklist-123',
        ...checklistData,
        userId
      };

      (prisma.checklistTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
      
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          checklist: {
            create: jest.fn().mockResolvedValue(mockChecklist)
          },
          checklistItem: {
            createMany: jest.fn()
          },
          checklistActivity: {
            create: jest.fn()
          }
        });
      });

      (prisma.checklist.findUnique as jest.Mock).mockResolvedValue({
        ...mockChecklist,
        items: [{
          id: 'item-123',
          name: 'Passport',
          isCompleted: false
        }],
        collaborators: []
      });

      const result = await checklistService.createChecklist(userId, checklistData);

      expect(prisma.checklistTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: templateId }
      });
      expect(result).toHaveProperty('id', 'checklist-123');
    });
  });

  describe('getChecklistById', () => {
    it('should get checklist with calculated progress', async () => {
      const userId = 'user-123';
      const checklistId = 'checklist-123';

      const mockChecklist = {
        id: checklistId,
        userId,
        visibility: ChecklistVisibility.PRIVATE,
        items: [
          { id: 'item-1', isCompleted: true },
          { id: 'item-2', isCompleted: false },
          { id: 'item-3', isCompleted: true }
        ],
        collaborators: []
      };

      (prisma.checklist.findUnique as jest.Mock).mockResolvedValue(mockChecklist);

      const result = await checklistService.getChecklistById(checklistId, userId);

      expect(result).toHaveProperty('progress', 67); // 2 out of 3 items completed
    });

    it('should throw NotFoundError if checklist does not exist', async () => {
      const userId = 'user-123';
      const checklistId = 'non-existent';

      (prisma.checklist.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        checklistService.getChecklistById(checklistId, userId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user has no access', async () => {
      const userId = 'user-123';
      const checklistId = 'checklist-123';

      const mockChecklist = {
        id: checklistId,
        userId: 'other-user',
        visibility: ChecklistVisibility.PRIVATE,
        collaborators: []
      };

      (prisma.checklist.findUnique as jest.Mock).mockResolvedValue(mockChecklist);

      await expect(
        checklistService.getChecklistById(checklistId, userId)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('toggleChecklistItem', () => {
    it('should toggle item completion status', async () => {
      const userId = 'user-123';
      const checklistId = 'checklist-123';
      const itemId = 'item-123';

      const mockChecklist = {
        id: checklistId,
        userId,
        collaborators: []
      };

      const mockItem = {
        id: itemId,
        checklistId,
        isCompleted: false
      };

      const updatedItem = {
        ...mockItem,
        isCompleted: true,
        completedAt: new Date(),
        completedBy: userId
      };

      (prisma.checklist.findUnique as jest.Mock).mockResolvedValue(mockChecklist);
      (prisma.checklistItem.findFirst as jest.Mock).mockResolvedValue(mockItem);
      (prisma.checklistItem.update as jest.Mock).mockResolvedValue(updatedItem);
      (prisma.checklistItem.findMany as jest.Mock).mockResolvedValue([updatedItem]);

      const result = await checklistService.toggleChecklistItem(
        checklistId,
        itemId,
        userId
      );

      expect(result.isCompleted).toBe(true);
      expect(result.completedBy).toBe(userId);
    });
  });

  describe('addCollaborator', () => {
    it('should add a collaborator to checklist', async () => {
      const userId = 'owner-123';
      const checklistId = 'checklist-123';
      const collaboratorData = {
        userId: 'collaborator-123',
        role: CollaboratorRole.EDITOR,
        canEdit: true,
        canComplete: true,
        canAssign: false
      };

      const mockChecklist = {
        id: checklistId,
        userId,
        isCollaborative: false
      };

      const mockCollaborator = {
        id: 'collab-123',
        checklistId,
        ...collaboratorData,
        invitedBy: userId
      };

      (prisma.checklist.findUnique as jest.Mock).mockResolvedValue(mockChecklist);
      (prisma.checklistCollaborator.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.checklist.update as jest.Mock).mockResolvedValue({
        ...mockChecklist,
        isCollaborative: true
      });
      (prisma.checklistCollaborator.create as jest.Mock).mockResolvedValue(mockCollaborator);

      const result = await checklistService.addCollaborator(
        checklistId,
        userId,
        collaboratorData
      );

      expect(result).toHaveProperty('id', 'collab-123');
      expect(result).toHaveProperty('role', CollaboratorRole.EDITOR);
      expect(prisma.checklist.update).toHaveBeenCalledWith({
        where: { id: checklistId },
        data: { isCollaborative: true }
      });
    });

    it('should throw ForbiddenError if user is not owner', async () => {
      const userId = 'non-owner-123';
      const checklistId = 'checklist-123';
      const collaboratorData = {
        userId: 'collaborator-123'
      };

      const mockChecklist = {
        id: checklistId,
        userId: 'owner-123'
      };

      (prisma.checklist.findUnique as jest.Mock).mockResolvedValue(mockChecklist);
      (prisma.checklistCollaborator.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        checklistService.addCollaborator(checklistId, userId, collaboratorData)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getUserChecklists', () => {
    it('should return user checklists with pagination', async () => {
      const userId = 'user-123';
      const filters = {
        page: 1,
        limit: 10,
        visibility: ChecklistVisibility.PRIVATE
      };

      const mockChecklists = [
        {
          id: 'checklist-1',
          userId,
          items: [
            { id: 'item-1', isCompleted: true },
            { id: 'item-2', isCompleted: false }
          ]
        },
        {
          id: 'checklist-2',
          userId,
          items: [
            { id: 'item-3', isCompleted: true }
          ]
        }
      ];

      (prisma.checklist.findMany as jest.Mock).mockResolvedValue(mockChecklists);
      (prisma.checklist.count as jest.Mock).mockResolvedValue(2);

      const result = await checklistService.getUserChecklists(userId, filters);

      expect(result.checklists).toHaveLength(2);
      expect(result.checklists[0]).toHaveProperty('progress', 50); // 1 out of 2
      expect(result.checklists[1]).toHaveProperty('progress', 100); // 1 out of 1
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });
});