import { body, param, query, ValidationChain } from 'express-validator';
import {
  ChecklistCategory,
  ChecklistPriority,
  ChecklistTemplateType
} from '../types/checklist.types';

// Create checklist validation
export const createChecklistValidation: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 1, max: 255 }).withMessage('Name must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  body('tripId')
    .optional()
    .isUUID().withMessage('Invalid trip ID'),
  body('templateId')
    .optional()
    .isString().withMessage('Template ID must be a string'),
  body('category')
    .optional()
    .isIn(Object.values(ChecklistCategory)).withMessage('Invalid category'),
  body('isTemplate')
    .optional()
    .isBoolean().withMessage('isTemplate must be a boolean'),
  body('isPublic')
    .optional()
    .isBoolean().withMessage('isPublic must be a boolean'),
  body('metadata')
    .optional()
    .isObject().withMessage('Metadata must be an object'),
  body('items')
    .optional()
    .isArray().withMessage('Items must be an array'),
  body('items.*.content')
    .trim()
    .notEmpty().withMessage('Item content is required'),
  body('items.*.priority')
    .optional()
    .isIn(Object.values(ChecklistPriority)).withMessage('Invalid priority'),
  body('items.*.dueDate')
    .optional()
    .isISO8601().withMessage('Invalid due date'),
  body('items.*.assignedTo')
    .optional()
    .isUUID().withMessage('Invalid user ID for assignment'),
  body('items.*.notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters'),
  body('items.*.orderIndex')
    .optional()
    .isInt({ min: 0 }).withMessage('Order index must be a positive integer'),
  body('items.*.metadata')
    .optional()
    .isObject().withMessage('Item metadata must be an object')
];

// Update checklist validation
export const updateChecklistValidation: ValidationChain[] = [
  param('id')
    .isUUID().withMessage('Invalid checklist ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty')
    .isLength({ min: 1, max: 255 }).withMessage('Name must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  body('category')
    .optional()
    .isIn(Object.values(ChecklistCategory)).withMessage('Invalid category'),
  body('isPublic')
    .optional()
    .isBoolean().withMessage('isPublic must be a boolean'),
  body('metadata')
    .optional()
    .isObject().withMessage('Metadata must be an object')
];

// Add item validation
export const addItemValidation: ValidationChain[] = [
  param('id')
    .isUUID().withMessage('Invalid checklist ID'),
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 1, max: 500 }).withMessage('Content must be between 1 and 500 characters'),
  body('priority')
    .optional()
    .isIn(Object.values(ChecklistPriority)).withMessage('Invalid priority'),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid due date'),
  body('assignedTo')
    .optional()
    .isUUID().withMessage('Invalid user ID for assignment'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters'),
  body('orderIndex')
    .optional()
    .isInt({ min: 0 }).withMessage('Order index must be a positive integer'),
  body('metadata')
    .optional()
    .isObject().withMessage('Metadata must be an object')
];

// Update item validation
export const updateItemValidation: ValidationChain[] = [
  param('id')
    .isUUID().withMessage('Invalid checklist ID'),
  param('itemId')
    .isUUID().withMessage('Invalid item ID'),
  body('content')
    .optional()
    .trim()
    .notEmpty().withMessage('Content cannot be empty')
    .isLength({ min: 1, max: 500 }).withMessage('Content must be between 1 and 500 characters'),
  body('isCompleted')
    .optional()
    .isBoolean().withMessage('isCompleted must be a boolean'),
  body('priority')
    .optional()
    .isIn(Object.values(ChecklistPriority)).withMessage('Invalid priority'),
  body('dueDate')
    .optional()
    .custom((value) => value === null || new Date(value).toString() !== 'Invalid Date')
    .withMessage('Invalid due date'),
  body('assignedTo')
    .optional()
    .custom((value) => value === null || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))
    .withMessage('Invalid user ID for assignment'),
  body('notes')
    .optional()
    .custom((value) => value === null || (typeof value === 'string' && value.length <= 500))
    .withMessage('Notes must not exceed 500 characters'),
  body('orderIndex')
    .optional()
    .isInt({ min: 0 }).withMessage('Order index must be a positive integer'),
  body('metadata')
    .optional()
    .isObject().withMessage('Metadata must be an object')
];

// Reorder items validation
export const reorderItemsValidation: ValidationChain[] = [
  param('id')
    .isUUID().withMessage('Invalid checklist ID'),
  body('items')
    .isArray({ min: 1 }).withMessage('Items array is required and must not be empty'),
  body('items.*.id')
    .isUUID().withMessage('Invalid item ID'),
  body('items.*.orderIndex')
    .isInt({ min: 0 }).withMessage('Order index must be a positive integer')
];

// Bulk update items validation
export const bulkUpdateItemsValidation: ValidationChain[] = [
  param('id')
    .isUUID().withMessage('Invalid checklist ID'),
  body('items')
    .isArray({ min: 1 }).withMessage('Items array is required and must not be empty'),
  body('items.*.id')
    .isUUID().withMessage('Invalid item ID'),
  body('items.*.updates')
    .isObject().withMessage('Updates must be an object')
];

// Add collaborator validation
export const addCollaboratorValidation: ValidationChain[] = [
  param('id')
    .isUUID().withMessage('Invalid checklist ID'),
  body('userId')
    .isUUID().withMessage('Invalid user ID'),
  body('permissions')
    .isObject().withMessage('Permissions must be an object'),
  body('permissions.can_edit')
    .isBoolean().withMessage('can_edit must be a boolean'),
  body('permissions.can_complete')
    .isBoolean().withMessage('can_complete must be a boolean'),
  body('permissions.can_assign')
    .isBoolean().withMessage('can_assign must be a boolean'),
  body('permissions.can_delete')
    .isBoolean().withMessage('can_delete must be a boolean'),
  body('permissions.can_share')
    .isBoolean().withMessage('can_share must be a boolean')
];

// Update collaborator permissions validation
export const updateCollaboratorPermissionsValidation: ValidationChain[] = [
  param('id')
    .isUUID().withMessage('Invalid checklist ID'),
  param('collaboratorId')
    .isUUID().withMessage('Invalid collaborator ID'),
  body('permissions')
    .isObject().withMessage('Permissions must be an object'),
  body('permissions.can_edit')
    .isBoolean().withMessage('can_edit must be a boolean'),
  body('permissions.can_complete')
    .isBoolean().withMessage('can_complete must be a boolean'),
  body('permissions.can_assign')
    .isBoolean().withMessage('can_assign must be a boolean'),
  body('permissions.can_delete')
    .isBoolean().withMessage('can_delete must be a boolean'),
  body('permissions.can_share')
    .isBoolean().withMessage('can_share must be a boolean')
];

// Remove collaborator validation
export const removeCollaboratorValidation: ValidationChain[] = [
  param('id')
    .isUUID().withMessage('Invalid checklist ID'),
  param('collaboratorId')
    .isUUID().withMessage('Invalid collaborator ID')
];

// Clone checklist validation
export const cloneChecklistValidation: ValidationChain[] = [
  param('id')
    .isUUID().withMessage('Invalid checklist ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 }).withMessage('Name must be between 1 and 255 characters')
];

// Get checklists query validation
export const getChecklistsValidation: ValidationChain[] = [
  query('tripId')
    .optional()
    .isUUID().withMessage('Invalid trip ID'),
  query('category')
    .optional()
    .isIn(Object.values(ChecklistCategory)).withMessage('Invalid category'),
  query('isTemplate')
    .optional()
    .isBoolean().withMessage('isTemplate must be a boolean'),
  query('isPublic')
    .optional()
    .isBoolean().withMessage('isPublic must be a boolean'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'name']).withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Invalid sort order'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Get template validation
export const getTemplateValidation: ValidationChain[] = [
  param('type')
    .isIn(Object.values(ChecklistTemplateType)).withMessage('Invalid template type')
];

// Create from template validation
export const createFromTemplateValidation: ValidationChain[] = [
  param('type')
    .isIn(Object.values(ChecklistTemplateType)).withMessage('Invalid template type'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 }).withMessage('Name must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  body('tripId')
    .optional()
    .isUUID().withMessage('Invalid trip ID')
];

// Generate suggestions validation
export const generateSuggestionsValidation: ValidationChain[] = [
  param('id')
    .isUUID().withMessage('Invalid checklist ID'),
  body('tripDetails')
    .optional()
    .isObject().withMessage('Trip details must be an object'),
  body('tripDetails.destinations')
    .optional()
    .isArray().withMessage('Destinations must be an array'),
  body('tripDetails.destinations.*.locationId')
    .isUUID().withMessage('Invalid location ID'),
  body('tripDetails.destinations.*.arrivalDate')
    .isISO8601().withMessage('Invalid arrival date'),
  body('tripDetails.destinations.*.departureDate')
    .isISO8601().withMessage('Invalid departure date'),
  body('tripDetails.activities')
    .optional()
    .isArray().withMessage('Activities must be an array'),
  body('tripDetails.transportMode')
    .optional()
    .isArray().withMessage('Transport modes must be an array'),
  body('weatherData')
    .optional()
    .isArray().withMessage('Weather data must be an array'),
  body('userPreferences')
    .optional()
    .isObject().withMessage('User preferences must be an object'),
  body('userPreferences.packingStyle')
    .optional()
    .isIn(['minimal', 'moderate', 'comprehensive']).withMessage('Invalid packing style'),
  body('userPreferences.interests')
    .optional()
    .isArray().withMessage('Interests must be an array')
];

// Apply suggestions validation
export const applySuggestionsValidation: ValidationChain[] = [
  param('id')
    .isUUID().withMessage('Invalid checklist ID'),
  body('suggestions')
    .isArray({ min: 1 }).withMessage('Suggestions array is required and must not be empty'),
  body('suggestions.*.item')
    .trim()
    .notEmpty().withMessage('Suggestion item is required'),
  body('suggestions.*.priority')
    .isIn(Object.values(ChecklistPriority)).withMessage('Invalid priority'),
  body('suggestions.*.reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters'),
  body('suggestions.*.metadata')
    .optional()
    .isObject().withMessage('Metadata must be an object')
];

// ID validation helper
export const idValidation: ValidationChain[] = [
  param('id')
    .isUUID().withMessage('Invalid checklist ID')
];

// Item ID validation helper
export const itemIdValidation: ValidationChain[] = [
  param('id')
    .isUUID().withMessage('Invalid checklist ID'),
  param('itemId')
    .isUUID().withMessage('Invalid item ID')
];