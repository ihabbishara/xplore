import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ChecklistService } from '../services/checklistService';
import { TemplateService } from '../services/templateService';
import { WeatherAwareService } from '../services/weatherAwareService';
import {
  createChecklistSchema,
  updateChecklistSchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
  bulkCreateChecklistItemsSchema,
  reorderChecklistItemsSchema,
  addCollaboratorSchema,
  updateCollaboratorSchema,
  checklistQuerySchema,
  checklistItemQuerySchema,
  idSchema
} from '../validation/checklistValidation';

const prisma = new PrismaClient();
const checklistService = new ChecklistService(prisma);
const templateService = new TemplateService(prisma);
const weatherAwareService = new WeatherAwareService(prisma);

// Checklist operations
export const createChecklist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const validatedData = createChecklistSchema.parse(req.body);

    const checklist = await checklistService.createChecklist(userId, validatedData);
    
    res.status(201).json({
      data: checklist,
      message: 'Checklist created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getChecklist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const checklistId = idSchema.parse(req.params.checklistId);

    const checklist = await checklistService.getChecklistById(checklistId, userId);
    
    res.json({ data: checklist });
  } catch (error) {
    next(error);
  }
};

export const updateChecklist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const checklistId = idSchema.parse(req.params.checklistId);
    const validatedData = updateChecklistSchema.parse(req.body);

    const checklist = await checklistService.updateChecklist(
      checklistId,
      userId,
      validatedData
    );
    
    res.json({
      data: checklist,
      message: 'Checklist updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteChecklist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const checklistId = idSchema.parse(req.params.checklistId);

    await checklistService.deleteChecklist(checklistId, userId);
    
    res.json({ message: 'Checklist deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getUserChecklists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const filters = checklistQuerySchema.parse(req.query);

    const result = await checklistService.getUserChecklists(userId, {
      ...filters,
      page: filters.page,
      limit: filters.limit
    });
    
    res.json({
      data: result.checklists,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Checklist item operations
export const createChecklistItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const checklistId = idSchema.parse(req.params.checklistId);
    const validatedData = createChecklistItemSchema.parse(req.body);

    const item = await checklistService.createChecklistItem(
      checklistId,
      userId,
      validatedData
    );
    
    res.status(201).json({
      data: item,
      message: 'Item added successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const bulkCreateChecklistItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const checklistId = idSchema.parse(req.params.checklistId);
    const validatedData = bulkCreateChecklistItemsSchema.parse(req.body);

    const items = await checklistService.bulkCreateChecklistItems(
      checklistId,
      userId,
      validatedData
    );
    
    res.status(201).json({
      data: items,
      message: `${items.length} items added successfully`
    });
  } catch (error) {
    next(error);
  }
};

export const updateChecklistItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const checklistId = idSchema.parse(req.params.checklistId);
    const itemId = idSchema.parse(req.params.itemId);
    const validatedData = updateChecklistItemSchema.parse(req.body);

    const item = await checklistService.updateChecklistItem(
      checklistId,
      itemId,
      userId,
      validatedData
    );
    
    res.json({
      data: item,
      message: 'Item updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const toggleChecklistItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const checklistId = idSchema.parse(req.params.checklistId);
    const itemId = idSchema.parse(req.params.itemId);

    const item = await checklistService.toggleChecklistItem(
      checklistId,
      itemId,
      userId
    );
    
    res.json({
      data: item,
      message: item.isCompleted ? 'Item completed' : 'Item uncompleted'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteChecklistItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const checklistId = idSchema.parse(req.params.checklistId);
    const itemId = idSchema.parse(req.params.itemId);

    await checklistService.deleteChecklistItem(checklistId, itemId, userId);
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const reorderChecklistItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const checklistId = idSchema.parse(req.params.checklistId);
    const validatedData = reorderChecklistItemsSchema.parse(req.body);

    await checklistService.reorderChecklistItems(
      checklistId,
      userId,
      validatedData
    );
    
    res.json({ message: 'Items reordered successfully' });
  } catch (error) {
    next(error);
  }
};

// Collaborator operations
export const addCollaborator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const checklistId = idSchema.parse(req.params.checklistId);
    const validatedData = addCollaboratorSchema.parse(req.body);

    const collaborator = await checklistService.addCollaborator(
      checklistId,
      userId,
      validatedData
    );
    
    res.status(201).json({
      data: collaborator,
      message: 'Collaborator added successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const updateCollaborator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const checklistId = idSchema.parse(req.params.checklistId);
    const collaboratorId = idSchema.parse(req.params.collaboratorId);
    const validatedData = updateCollaboratorSchema.parse(req.body);

    const collaborator = await checklistService.updateCollaborator(
      checklistId,
      collaboratorId,
      userId,
      validatedData
    );
    
    res.json({
      data: collaborator,
      message: 'Collaborator updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const removeCollaborator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const checklistId = idSchema.parse(req.params.checklistId);
    const collaboratorId = idSchema.parse(req.params.collaboratorId);

    await checklistService.removeCollaborator(
      checklistId,
      collaboratorId,
      userId
    );
    
    res.json({ message: 'Collaborator removed successfully' });
  } catch (error) {
    next(error);
  }
};

// Activity history
export const getChecklistActivities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const checklistId = idSchema.parse(req.params.checklistId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const activities = await checklistService.getChecklistActivities(
      checklistId,
      userId,
      limit
    );
    
    res.json({ data: activities });
  } catch (error) {
    next(error);
  }
};

// Weather-aware suggestions
export const getWeatherSuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const checklistId = idSchema.parse(req.params.checklistId);
    const tripId = req.query.tripId as string;

    if (!tripId) {
      return res.status(400).json({ 
        error: 'Trip ID is required for weather suggestions' 
      });
    }

    const suggestions = await weatherAwareService.getWeatherBasedSuggestions(
      tripId,
      checklistId
    );
    
    res.json({ data: suggestions });
  } catch (error) {
    next(error);
  }
};

export const getLocationSuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const locationId = req.query.locationId as string;
    const season = req.query.season as string || 'summer';

    if (!locationId) {
      return res.status(400).json({ 
        error: 'Location ID is required for location suggestions' 
      });
    }

    const suggestions = await weatherAwareService.getLocationBasedSuggestions(
      locationId,
      season
    );
    
    res.json({ data: suggestions });
  } catch (error) {
    next(error);
  }
};