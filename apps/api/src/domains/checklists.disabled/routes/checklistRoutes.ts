import { Router } from 'express';
import { authMiddleware } from '../../auth/middleware/authMiddleware';
import {
  createChecklist,
  getChecklist,
  updateChecklist,
  deleteChecklist,
  getUserChecklists,
  createChecklistItem,
  bulkCreateChecklistItems,
  updateChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  reorderChecklistItems,
  addCollaborator,
  updateCollaborator,
  removeCollaborator,
  getChecklistActivities,
  getWeatherSuggestions,
  getLocationSuggestions
} from '../controllers/checklistController';

import {
  createTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplates,
  getUserTemplates,
  getPopularTemplates,
  getTemplatesByCategory,
  rateTemplate,
  initializeSystemTemplates
} from '../controllers/templateController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Checklist routes
router.post('/checklists', createChecklist);
router.get('/checklists', getUserChecklists);
router.get('/checklists/:checklistId', getChecklist);
router.put('/checklists/:checklistId', updateChecklist);
router.delete('/checklists/:checklistId', deleteChecklist);

// Checklist item routes
router.post('/checklists/:checklistId/items', createChecklistItem);
router.post('/checklists/:checklistId/items/bulk', bulkCreateChecklistItems);
router.put('/checklists/:checklistId/items/:itemId', updateChecklistItem);
router.patch('/checklists/:checklistId/items/:itemId/toggle', toggleChecklistItem);
router.delete('/checklists/:checklistId/items/:itemId', deleteChecklistItem);
router.put('/checklists/:checklistId/items/reorder', reorderChecklistItems);

// Collaborator routes
router.post('/checklists/:checklistId/collaborators', addCollaborator);
router.put('/checklists/:checklistId/collaborators/:collaboratorId', updateCollaborator);
router.delete('/checklists/:checklistId/collaborators/:collaboratorId', removeCollaborator);

// Activity and suggestions routes
router.get('/checklists/:checklistId/activities', getChecklistActivities);
router.get('/checklists/:checklistId/suggestions/weather', getWeatherSuggestions);
router.get('/checklists/suggestions/location', getLocationSuggestions);

// Template routes
router.post('/templates', createTemplate);
router.get('/templates', getTemplates);
router.get('/templates/mine', getUserTemplates);
router.get('/templates/popular', getPopularTemplates);
router.get('/templates/category/:category', getTemplatesByCategory);
router.get('/templates/:templateId', getTemplate);
router.put('/templates/:templateId', updateTemplate);
router.delete('/templates/:templateId', deleteTemplate);
router.post('/templates/:templateId/rate', rateTemplate);

// Admin route to initialize system templates (should be protected by admin auth)
router.post('/templates/system/initialize', initializeSystemTemplates);

export default router;