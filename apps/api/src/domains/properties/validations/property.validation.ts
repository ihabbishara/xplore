import { body, param, query } from 'express-validator';
import { ValidationMessages } from '../../../middleware/validation';

/**
 * Validation rules for importing a property by URL
 */
export const importPropertyValidation = [
  body('url')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Property URL'))
    .isURL({ require_protocol: true }).withMessage(ValidationMessages.URL)
    .custom((url: string) => {
      // Validate supported real estate platforms
      const supportedDomains = [
        'zillow.com',
        'realtor.com',
        'redfin.com',
        'trulia.com',
        'apartments.com',
        'rightmove.co.uk',
        'zoopla.co.uk',
        'idealista.com',
        'immobilienscout24.de',
        'seloger.com'
      ];
      
      try {
        const urlObj = new URL(url);
        return supportedDomains.some(domain => urlObj.hostname.includes(domain));
      } catch {
        return false;
      }
    }).withMessage('URL must be from a supported real estate platform'),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((tags: string[]) => {
      return tags.every(tag => typeof tag === 'string' && tag.length <= 50);
    }).withMessage('Each tag must be a string with maximum 50 characters')
];

/**
 * Validation rules for saving a property
 */
export const savePropertyValidation = [
  body('url')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Property URL'))
    .isURL({ require_protocol: true }).withMessage(ValidationMessages.URL),
  
  body('title')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Property title'))
    .isString()
    .trim()
    .isLength({ min: 1, max: 300 }),
  
  body('price')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Price'))
    .isFloat({ min: 0 }).withMessage(ValidationMessages.POSITIVE_NUMBER)
    .toFloat(),
  
  body('currency')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Currency'))
    .isString()
    .isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter ISO code')
    .toUpperCase(),
  
  body('location')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Location')),
  
  body('location.address')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Address'))
    .isString()
    .isLength({ max: 500 }),
  
  body('location.latitude')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Latitude'))
    .isFloat({ min: -90, max: 90 }).withMessage(ValidationMessages.LATITUDE)
    .toFloat(),
  
  body('location.longitude')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Longitude'))
    .isFloat({ min: -180, max: 180 }).withMessage(ValidationMessages.LONGITUDE)
    .toFloat(),
  
  body('bedrooms')
    .optional()
    .isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer')
    .toInt(),
  
  body('bathrooms')
    .optional()
    .isFloat({ min: 0 }).withMessage('Bathrooms must be a non-negative number')
    .toFloat(),
  
  body('size')
    .optional()
    .isFloat({ min: 0 }).withMessage('Size must be a positive number')
    .toFloat(),
  
  body('sizeUnit')
    .optional()
    .isIn(['sqft', 'sqm']).withMessage('Size unit must be sqft or sqm'),
  
  body('propertyType')
    .optional()
    .isIn(['house', 'apartment', 'condo', 'townhouse', 'land', 'other'])
    .withMessage('Invalid property type'),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
];

/**
 * Validation rules for property ID parameter
 */
export const propertyIdValidation = [
  param('id')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Property ID'))
    .isUUID().withMessage(ValidationMessages.UUID)
];

/**
 * Validation rules for property search/filter
 */
export const propertyQueryValidation = [
  query('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Minimum price must be non-negative')
    .toFloat(),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Maximum price must be non-negative')
    .toFloat()
    .custom((maxPrice, { req }) => {
      if (!req.query.minPrice) return true;
      return parseFloat(maxPrice) >= parseFloat(req.query.minPrice);
    }).withMessage('Maximum price must be greater than minimum price'),
  
  query('minBedrooms')
    .optional()
    .isInt({ min: 0 }).withMessage('Minimum bedrooms must be non-negative')
    .toInt(),
  
  query('minBathrooms')
    .optional()
    .isFloat({ min: 0 }).withMessage('Minimum bathrooms must be non-negative')
    .toFloat(),
  
  query('propertyType')
    .optional()
    .isIn(['house', 'apartment', 'condo', 'townhouse', 'land', 'other'])
    .withMessage('Invalid property type'),
  
  query('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage(ValidationMessages.LATITUDE)
    .toFloat(),
  
  query('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage(ValidationMessages.LONGITUDE)
    .toFloat(),
  
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 100 }).withMessage('Radius must be between 0.1 and 100 km')
    .toFloat(),
  
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
 * Validation rules for updating property notes
 */
export const updatePropertyNotesValidation = [
  body('notes')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Notes'))
    .isString()
    .isLength({ max: 5000 }).withMessage('Notes cannot exceed 5000 characters')
];