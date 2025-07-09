import { body, query, param } from 'express-validator';
import { ValidationMessages } from '../../../middleware/validation';

/**
 * Validation rules for location search
 */
export const searchValidation = [
  query('query')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Search query'))
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    .toInt(),
  
  query('country')
    .optional()
    .isString()
    .isLength({ min: 2, max: 2 }).withMessage('Country must be a 2-letter ISO code')
    .toUpperCase()
];

/**
 * Validation rules for saving a location
 */
export const saveLocationValidation = [
  body('placeId')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Place ID'))
    .isString(),
  
  body('name')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Location name'))
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 }),
  
  body('latitude')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Latitude'))
    .isFloat({ min: -90, max: 90 }).withMessage(ValidationMessages.LATITUDE)
    .toFloat(),
  
  body('longitude')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Longitude'))
    .isFloat({ min: -180, max: 180 }).withMessage(ValidationMessages.LONGITUDE)
    .toFloat(),
  
  body('address')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 }),
  
  body('country')
    .optional()
    .isString()
    .isLength({ min: 2, max: 2 }).withMessage('Country must be a 2-letter ISO code')
    .toUpperCase(),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((tags: string[]) => {
      return tags.every(tag => typeof tag === 'string' && tag.length <= 50);
    }).withMessage('Each tag must be a string with maximum 50 characters')
];

/**
 * Validation rules for location ID parameter
 */
export const locationIdValidation = [
  param('id')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Location ID'))
    .isUUID().withMessage(ValidationMessages.UUID)
];

/**
 * Validation rules for updating a location
 */
export const updateLocationValidation = [
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 }),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((tags: string[]) => {
      return tags.every(tag => typeof tag === 'string' && tag.length <= 50);
    }).withMessage('Each tag must be a string with maximum 50 characters'),
  
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
];

/**
 * Validation rules for getting locations by coordinates
 */
export const coordinatesValidation = [
  query('lat')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Latitude'))
    .isFloat({ min: -90, max: 90 }).withMessage(ValidationMessages.LATITUDE)
    .toFloat(),
  
  query('lng')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Longitude'))
    .isFloat({ min: -180, max: 180 }).withMessage(ValidationMessages.LONGITUDE)
    .toFloat(),
  
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 50 }).withMessage('Radius must be between 0.1 and 50 km')
    .toFloat()
];