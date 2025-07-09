import { query, body } from 'express-validator';
import { ValidationMessages } from '../../../middleware/validation';

/**
 * Validation rules for getting current weather
 */
export const currentWeatherValidation = [
  query('latitude')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Latitude'))
    .isFloat({ min: -90, max: 90 }).withMessage(ValidationMessages.LATITUDE)
    .toFloat(),
  
  query('longitude')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Longitude'))
    .isFloat({ min: -180, max: 180 }).withMessage(ValidationMessages.LONGITUDE)
    .toFloat(),
  
  query('units')
    .optional()
    .isIn(['metric', 'imperial']).withMessage('Units must be metric or imperial')
];

/**
 * Validation rules for weather forecast
 */
export const weatherForecastValidation = [
  query('latitude')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Latitude'))
    .isFloat({ min: -90, max: 90 }).withMessage(ValidationMessages.LATITUDE)
    .toFloat(),
  
  query('longitude')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Longitude'))
    .isFloat({ min: -180, max: 180 }).withMessage(ValidationMessages.LONGITUDE)
    .toFloat(),
  
  query('days')
    .optional()
    .isInt({ min: 1, max: 14 }).withMessage('Days must be between 1 and 14')
    .toInt(),
  
  query('units')
    .optional()
    .isIn(['metric', 'imperial']).withMessage('Units must be metric or imperial')
];

/**
 * Validation rules for historical weather data
 */
export const historicalWeatherValidation = [
  query('latitude')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Latitude'))
    .isFloat({ min: -90, max: 90 }).withMessage(ValidationMessages.LATITUDE)
    .toFloat(),
  
  query('longitude')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Longitude'))
    .isFloat({ min: -180, max: 180 }).withMessage(ValidationMessages.LONGITUDE)
    .toFloat(),
  
  query('date')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Date'))
    .isISO8601().withMessage(ValidationMessages.DATE)
    .custom((date) => {
      const inputDate = new Date(date);
      const now = new Date();
      const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
      return inputDate <= new Date() && inputDate >= oneYearAgo;
    }).withMessage('Date must be within the last year'),
  
  query('units')
    .optional()
    .isIn(['metric', 'imperial']).withMessage('Units must be metric or imperial')
];

/**
 * Validation rules for user weather preferences
 */
export const weatherPreferencesValidation = [
  body('temperatureUnit')
    .optional()
    .isIn(['celsius', 'fahrenheit']).withMessage('Temperature unit must be celsius or fahrenheit'),
  
  body('windSpeedUnit')
    .optional()
    .isIn(['kmh', 'mph', 'ms']).withMessage('Wind speed unit must be kmh, mph, or ms'),
  
  body('precipitationUnit')
    .optional()
    .isIn(['mm', 'inches']).withMessage('Precipitation unit must be mm or inches'),
  
  body('idealTemperatureRange')
    .optional(),
  
  body('idealTemperatureRange.min')
    .optional()
    .isFloat({ min: -50, max: 50 }).withMessage('Minimum temperature must be between -50 and 50')
    .toFloat(),
  
  body('idealTemperatureRange.max')
    .optional()
    .isFloat({ min: -50, max: 50 }).withMessage('Maximum temperature must be between -50 and 50')
    .toFloat()
    .custom((max, { req }) => {
      if (!req.body.idealTemperatureRange?.min) return true;
      return max > req.body.idealTemperatureRange.min;
    }).withMessage('Maximum temperature must be greater than minimum'),
  
  body('weatherAlerts')
    .optional()
    .isArray().withMessage('Weather alerts must be an array'),
  
  body('weatherAlerts.*')
    .optional()
    .isIn(['rain', 'snow', 'storm', 'extreme-heat', 'extreme-cold', 'high-wind'])
    .withMessage('Invalid weather alert type')
];

/**
 * Validation rules for batch weather requests
 */
export const batchWeatherValidation = [
  body('locations')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Locations'))
    .isArray({ min: 1, max: 10 }).withMessage('Must provide between 1 and 10 locations'),
  
  body('locations.*.latitude')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Latitude'))
    .isFloat({ min: -90, max: 90 }).withMessage(ValidationMessages.LATITUDE)
    .toFloat(),
  
  body('locations.*.longitude')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Longitude'))
    .isFloat({ min: -180, max: 180 }).withMessage(ValidationMessages.LONGITUDE)
    .toFloat(),
  
  body('locations.*.name')
    .optional()
    .isString()
    .isLength({ max: 100 }),
  
  body('type')
    .optional()
    .isIn(['current', 'forecast']).withMessage('Type must be current or forecast'),
  
  body('units')
    .optional()
    .isIn(['metric', 'imperial']).withMessage('Units must be metric or imperial')
];