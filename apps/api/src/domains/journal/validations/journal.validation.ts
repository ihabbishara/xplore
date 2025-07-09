import { body, param, query } from 'express-validator';
import { ValidationMessages } from '../../../middleware/validation';

/**
 * Validation rules for creating a journal entry
 */
export const createJournalEntryValidation = [
  body('title')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  
  body('content')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Content'))
    .isString()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content must be between 1 and 10000 characters'),
  
  body('tripId')
    .optional()
    .isUUID().withMessage(ValidationMessages.UUID),
  
  body('locationId')
    .optional()
    .isUUID().withMessage(ValidationMessages.UUID),
  
  body('location')
    .optional(),
  
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage(ValidationMessages.LATITUDE)
    .toFloat(),
  
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage(ValidationMessages.LONGITUDE)
    .toFloat(),
  
  body('location.name')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 }),
  
  body('weather')
    .optional(),
  
  body('weather.temperature')
    .optional()
    .isFloat().withMessage('Temperature must be a number')
    .toFloat(),
  
  body('weather.condition')
    .optional()
    .isString()
    .isLength({ max: 100 }),
  
  body('mood')
    .optional()
    .isIn(['excited', 'happy', 'neutral', 'tired', 'sad'])
    .withMessage('Invalid mood value'),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((tags: string[]) => {
      return tags.every(tag => typeof tag === 'string' && tag.length <= 50);
    }).withMessage('Each tag must be a string with maximum 50 characters'),
  
  body('isPublic')
    .optional()
    .isBoolean().withMessage('isPublic must be a boolean')
    .toBoolean()
];

/**
 * Validation rules for updating a journal entry
 */
export const updateJournalEntryValidation = [
  body('title')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  
  body('content')
    .optional()
    .isString()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content must be between 1 and 10000 characters'),
  
  body('mood')
    .optional()
    .isIn(['excited', 'happy', 'neutral', 'tired', 'sad'])
    .withMessage('Invalid mood value'),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((tags: string[]) => {
      return tags.every(tag => typeof tag === 'string' && tag.length <= 50);
    }).withMessage('Each tag must be a string with maximum 50 characters'),
  
  body('isPublic')
    .optional()
    .isBoolean().withMessage('isPublic must be a boolean')
    .toBoolean()
];

/**
 * Validation rules for journal entry ID parameter
 */
export const journalEntryIdValidation = [
  param('id')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Journal entry ID'))
    .isUUID().withMessage(ValidationMessages.UUID)
];

/**
 * Validation rules for journal query filters
 */
export const journalQueryValidation = [
  query('tripId')
    .optional()
    .isUUID().withMessage(ValidationMessages.UUID),
  
  query('locationId')
    .optional()
    .isUUID().withMessage(ValidationMessages.UUID),
  
  query('startDate')
    .optional()
    .isISO8601().withMessage(ValidationMessages.DATE)
    .toDate(),
  
  query('endDate')
    .optional()
    .isISO8601().withMessage(ValidationMessages.DATE)
    .toDate()
    .custom((endDate, { req }) => {
      if (!req.query.startDate) return true;
      return new Date(endDate) >= new Date(req.query.startDate);
    }).withMessage('End date must be after or equal to start date'),
  
  query('mood')
    .optional()
    .isIn(['excited', 'happy', 'neutral', 'tired', 'sad'])
    .withMessage('Invalid mood value'),
  
  query('tags')
    .optional()
    .custom((value) => {
      // Accept both string (comma-separated) and array
      if (typeof value === 'string') return true;
      if (Array.isArray(value)) return value.every(tag => typeof tag === 'string');
      return false;
    }).withMessage('Tags must be a string or array of strings'),
  
  query('isPublic')
    .optional()
    .isBoolean().withMessage('isPublic must be a boolean')
    .toBoolean(),
  
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
 * Validation rules for adding media to journal entry
 */
export const addMediaValidation = [
  body('type')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Media type'))
    .isIn(['photo', 'video', 'audio'])
    .withMessage('Media type must be photo, video, or audio'),
  
  body('caption')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Caption cannot exceed 500 characters')
];

/**
 * Validation rules for voice transcription
 */
export const voiceTranscriptionValidation = [
  body('language')
    .optional()
    .isString()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language code must be 2-5 characters'),
  
  body('duration')
    .optional()
    .isFloat({ min: 0, max: 300 })
    .withMessage('Duration must be between 0 and 300 seconds')
    .toFloat()
];