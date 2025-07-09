import { body, param, query } from 'express-validator';
import { ValidationMessages } from '../../../middleware/validation';

/**
 * Validation rules for creating a trip
 */
export const createTripValidation = [
  body('name')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Trip name'))
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Trip name must be between 1 and 200 characters'),
  
  body('startDate')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Start date'))
    .isISO8601().withMessage(ValidationMessages.DATE)
    .toDate(),
  
  body('endDate')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('End date'))
    .isISO8601().withMessage(ValidationMessages.DATE)
    .toDate()
    .custom((endDate, { req }) => {
      const startDate = new Date(req.body.startDate);
      return new Date(endDate) >= startDate;
    }).withMessage('End date must be after or equal to start date'),
  
  body('destinations')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Destinations'))
    .isArray({ min: 1 }).withMessage('At least one destination is required'),
  
  body('destinations.*.locationId')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Location ID'))
    .isUUID().withMessage(ValidationMessages.UUID),
  
  body('destinations.*.days')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Days'))
    .isInt({ min: 1 }).withMessage('Days must be a positive integer')
    .toInt(),
  
  body('destinations.*.order')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Order'))
    .isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
    .toInt(),
  
  body('description')
    .optional()
    .isString()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  
  body('isPublic')
    .optional()
    .isBoolean().withMessage('isPublic must be a boolean')
    .toBoolean()
];

/**
 * Validation rules for updating a trip
 */
export const updateTripValidation = [
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Trip name must be between 1 and 200 characters'),
  
  body('startDate')
    .optional()
    .isISO8601().withMessage(ValidationMessages.DATE)
    .toDate(),
  
  body('endDate')
    .optional()
    .isISO8601().withMessage(ValidationMessages.DATE)
    .toDate()
    .custom((endDate, { req }) => {
      if (!req.body.startDate) return true;
      const startDate = new Date(req.body.startDate);
      return new Date(endDate) >= startDate;
    }).withMessage('End date must be after or equal to start date'),
  
  body('description')
    .optional()
    .isString()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  
  body('isPublic')
    .optional()
    .isBoolean().withMessage('isPublic must be a boolean')
    .toBoolean()
];

/**
 * Validation rules for trip ID parameter
 */
export const tripIdValidation = [
  param('id')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Trip ID'))
    .isUUID().withMessage(ValidationMessages.UUID)
];

/**
 * Validation rules for adding a destination to a trip
 */
export const addDestinationValidation = [
  body('locationId')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Location ID'))
    .isUUID().withMessage(ValidationMessages.UUID),
  
  body('days')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Days'))
    .isInt({ min: 1 }).withMessage('Days must be a positive integer')
    .toInt(),
  
  body('order')
    .optional()
    .isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
    .toInt()
];

/**
 * Validation rules for trip query filters
 */
export const tripQueryValidation = [
  query('startDate')
    .optional()
    .isISO8601().withMessage(ValidationMessages.DATE)
    .toDate(),
  
  query('endDate')
    .optional()
    .isISO8601().withMessage(ValidationMessages.DATE)
    .toDate(),
  
  query('status')
    .optional()
    .isIn(['planned', 'ongoing', 'completed']).withMessage('Status must be planned, ongoing, or completed'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('offset')
    .optional()
    .isInt({ min: 0 }).withMessage('Offset must be non-negative')
    .toInt()
];

/**
 * Validation rules for trip collaboration
 */
export const addCollaboratorValidation = [
  body('email')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Email'))
    .isEmail().withMessage(ValidationMessages.EMAIL)
    .normalizeEmail(),
  
  body('role')
    .optional()
    .isIn(['viewer', 'editor']).withMessage('Role must be viewer or editor')
];