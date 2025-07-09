import { body, query } from 'express-validator'

export const weatherValidation = {
  getCurrentWeather: [
    query('latitude')
      .notEmpty().withMessage('Latitude is required')
      .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    query('longitude')
      .notEmpty().withMessage('Longitude is required')
      .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180')
  ],

  getForecast: [
    query('latitude')
      .notEmpty().withMessage('Latitude is required')
      .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    query('longitude')
      .notEmpty().withMessage('Longitude is required')
      .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    query('days')
      .optional()
      .isInt({ min: 1, max: 14 }).withMessage('Days must be between 1 and 14')
  ],

  getClimate: [
    query('latitude')
      .notEmpty().withMessage('Latitude is required')
      .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    query('longitude')
      .notEmpty().withMessage('Longitude is required')
      .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    query('locationId')
      .optional()
      .isString().withMessage('Location ID must be a string')
  ],

  compareLocations: [
    body('locations')
      .notEmpty().withMessage('Locations array is required')
      .isArray({ min: 1 }).withMessage('At least one location is required'),
    body('locations.*.id')
      .notEmpty().withMessage('Location ID is required'),
    body('locations.*.name')
      .notEmpty().withMessage('Location name is required'),
    body('locations.*.latitude')
      .isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('locations.*.longitude')
      .isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    body('startDate')
      .optional()
      .isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    body('endDate')
      .optional()
      .isISO8601().withMessage('End date must be a valid ISO 8601 date')
  ],

  getActivities: [
    query('latitude')
      .notEmpty().withMessage('Latitude is required')
      .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    query('longitude')
      .notEmpty().withMessage('Longitude is required')
      .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    query('forecastDays')
      .optional()
      .isInt({ min: 1, max: 14 }).withMessage('Forecast days must be between 1 and 14')
  ],

  getAlerts: [
    query('latitude')
      .notEmpty().withMessage('Latitude is required')
      .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    query('longitude')
      .notEmpty().withMessage('Longitude is required')
      .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180')
  ],

  updatePreferences: [
    body('idealTempMin')
      .optional()
      .isFloat({ min: -50, max: 50 }).withMessage('Ideal minimum temperature must be between -50 and 50'),
    body('idealTempMax')
      .optional()
      .isFloat({ min: -50, max: 50 }).withMessage('Ideal maximum temperature must be between -50 and 50'),
    body('avoidRain')
      .optional()
      .isBoolean().withMessage('Avoid rain must be a boolean'),
    body('avoidSnow')
      .optional()
      .isBoolean().withMessage('Avoid snow must be a boolean'),
    body('avoidHighHumidity')
      .optional()
      .isBoolean().withMessage('Avoid high humidity must be a boolean'),
    body('avoidStrongWind')
      .optional()
      .isBoolean().withMessage('Avoid strong wind must be a boolean'),
    body('preferSunny')
      .optional()
      .isBoolean().withMessage('Prefer sunny must be a boolean'),
    body('alertsEnabled')
      .optional()
      .isBoolean().withMessage('Alerts enabled must be a boolean'),
    body('alertTypes')
      .optional()
      .isArray().withMessage('Alert types must be an array')
      .custom((value) => {
        const validTypes = ['minor', 'moderate', 'severe', 'extreme']
        return value.every((type: string) => validTypes.includes(type))
      }).withMessage('Invalid alert type')
  ],

  invalidateCache: [
    body('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180')
  ]
}