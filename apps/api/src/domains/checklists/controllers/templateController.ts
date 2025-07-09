import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { TemplateService } from '../services/templateService';
import {
  createChecklistTemplateSchema,
  updateChecklistTemplateSchema,
  checklistTemplateQuerySchema,
  idSchema
} from '../validation/checklistValidation';
import { ChecklistCategory } from '../types/checklist.types';

const prisma = new PrismaClient();
const templateService = new TemplateService(prisma);

// Template operations
export const createTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const validatedData = createChecklistTemplateSchema.parse(req.body);

    const template = await templateService.createTemplate(userId, validatedData);
    
    res.status(201).json({
      data: template,
      message: 'Template created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const templateId = idSchema.parse(req.params.templateId);

    const template = await templateService.getTemplateById(templateId);
    
    res.json({ data: template });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const templateId = idSchema.parse(req.params.templateId);
    const validatedData = updateChecklistTemplateSchema.parse(req.body);

    const template = await templateService.updateTemplate(
      templateId,
      userId,
      validatedData
    );
    
    res.json({
      data: template,
      message: 'Template updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const templateId = idSchema.parse(req.params.templateId);

    await templateService.deleteTemplate(templateId, userId);
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters = checklistTemplateQuerySchema.parse(req.query);
    
    // Parse comma-separated tags
    const tags = filters.tags ? filters.tags.split(',').map(t => t.trim()) : undefined;

    const result = await templateService.getTemplates({
      ...filters,
      tags,
      page: filters.page,
      limit: filters.limit
    });
    
    res.json({
      data: result.templates,
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

export const getUserTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const templates = await templateService.getUserTemplates(userId);
    
    res.json({ data: templates });
  } catch (error) {
    next(error);
  }
};

export const getPopularTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const templates = await templateService.getPopularTemplates(limit);
    
    res.json({ data: templates });
  } catch (error) {
    next(error);
  }
};

export const getTemplatesByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = req.params.category as ChecklistCategory;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    if (!Object.values(ChecklistCategory).includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category',
        validCategories: Object.values(ChecklistCategory)
      });
    }

    const templates = await templateService.getTemplatesByCategory(category, limit);
    
    res.json({ data: templates });
  } catch (error) {
    next(error);
  }
};

export const rateTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const templateId = idSchema.parse(req.params.templateId);
    const rating = parseInt(req.body.rating);

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }

    await templateService.rateTemplate(templateId, userId, rating);
    
    res.json({ message: 'Template rated successfully' });
  } catch (error) {
    next(error);
  }
};

export const initializeSystemTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // This should be protected by admin authentication
    await templateService.initializeSystemTemplates();
    
    res.json({ message: 'System templates initialized successfully' });
  } catch (error) {
    next(error);
  }
};