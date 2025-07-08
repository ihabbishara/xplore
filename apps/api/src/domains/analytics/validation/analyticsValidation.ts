import { body, param, query } from 'express-validator'

export const validateLocationMetrics = [
  param('locationId')
    .isUUID()
    .withMessage('Location ID must be a valid UUID')
]

export const validateLocationComparison = [
  body('locationIds')
    .isArray({ min: 2, max: 10 })
    .withMessage('Must provide between 2 and 10 location IDs'),
  body('locationIds.*')
    .isUUID()
    .withMessage('Each location ID must be a valid UUID'),
  body('criteria')
    .isObject()
    .withMessage('Criteria must be an object'),
  body('comparisonName')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Comparison name must be between 1 and 100 characters')
]

export const validateSentimentAnalysis = [
  body('text')
    .isString()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Text must be between 1 and 10,000 characters'),
  body('language')
    .optional()
    .isString()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language must be a valid language code'),
  body('context')
    .optional()
    .isIn(['journal', 'review', 'note'])
    .withMessage('Context must be one of: journal, review, note')
]

export const validateBatchSentimentAnalysis = [
  body('texts')
    .isArray({ min: 1, max: 100 })
    .withMessage('Must provide between 1 and 100 texts'),
  body('texts.*.text')
    .isString()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Each text must be between 1 and 10,000 characters'),
  body('texts.*.language')
    .optional()
    .isString()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language must be a valid language code'),
  body('texts.*.context')
    .optional()
    .isIn(['journal', 'review', 'note'])
    .withMessage('Context must be one of: journal, review, note')
]

export const validateCostComparison = [
  body('locationIds')
    .isArray({ min: 2, max: 10 })
    .withMessage('Must provide between 2 and 10 location IDs'),
  body('locationIds.*')
    .isUUID()
    .withMessage('Each location ID must be a valid UUID')
]

export const validateCostPredictions = [
  param('locationId')
    .isUUID()
    .withMessage('Location ID must be a valid UUID'),
  query('timeframe')
    .optional()
    .isIn(['3_months', '6_months', '1_year'])
    .withMessage('Timeframe must be one of: 3_months, 6_months, 1_year')
]

export const validateLivingCostIndex = [
  param('locationId')
    .isUUID()
    .withMessage('Location ID must be a valid UUID'),
  query('referenceLocationId')
    .optional()
    .isUUID()
    .withMessage('Reference location ID must be a valid UUID')
]

export const validateBudgetRecommendations = [
  param('locationId')
    .isUUID()
    .withMessage('Location ID must be a valid UUID'),
  body('monthlyIncome')
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('Monthly income must be a positive number up to 1,000,000')
]

export const validateEmotionAnalysis = [
  query('text')
    .isString()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Text must be between 1 and 10,000 characters'),
  query('language')
    .optional()
    .isString()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language must be a valid language code')
]

export const validateSentimentTrends = [
  query('locationId')
    .optional()
    .isUUID()
    .withMessage('Location ID must be a valid UUID')
]

export const validateSentimentByCategory = [
  body('text')
    .isString()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Text must be between 1 and 10,000 characters'),
  body('categories')
    .isArray({ min: 1, max: 20 })
    .withMessage('Must provide between 1 and 20 categories'),
  body('categories.*')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each category must be between 1 and 50 characters'),
  body('language')
    .optional()
    .isString()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language must be a valid language code')
]

export const validateAnalyticsFilters = [
  query('locationIds')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const ids = value.split(',')
        return ids.every(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
      }
      return true
    })
    .withMessage('Location IDs must be valid UUIDs'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid ISO 8601 date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid ISO 8601 date'),
  query('categories')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const categories = value.split(',')
        return categories.every(cat => typeof cat === 'string' && cat.length > 0)
      }
      return true
    })
    .withMessage('Categories must be valid strings'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
]

export const validateDecisionMatrix = [
  body('name')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('matrixType')
    .isIn(['location', 'property', 'general'])
    .withMessage('Matrix type must be one of: location, property, general'),
  body('criteria')
    .isObject()
    .withMessage('Criteria must be an object'),
  body('alternatives')
    .isObject()
    .withMessage('Alternatives must be an object')
]

export const validateLocationComparisonMatrix = [
  body('locationIds')
    .isArray({ min: 2, max: 10 })
    .withMessage('Must provide between 2 and 10 location IDs'),
  body('locationIds.*')
    .isUUID()
    .withMessage('Each location ID must be a valid UUID'),
  body('criteria')
    .isObject()
    .withMessage('Criteria must be an object'),
  body('name')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
]

export const validatePropertyComparisonMatrix = [
  body('propertyIds')
    .isArray({ min: 2, max: 10 })
    .withMessage('Must provide between 2 and 10 property IDs'),
  body('propertyIds.*')
    .isUUID()
    .withMessage('Each property ID must be a valid UUID'),
  body('criteria')
    .isObject()
    .withMessage('Criteria must be an object'),
  body('name')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
]

export const validateMatrixId = [
  param('matrixId')
    .isUUID()
    .withMessage('Matrix ID must be a valid UUID')
]

export const validateMatrixTemplates = [
  query('matrixType')
    .isIn(['location', 'property', 'general'])
    .withMessage('Matrix type must be one of: location, property, general')
]

export const validateBehaviorPattern = [
  body('patternType')
    .isIn(['preference', 'decision', 'exploration', 'bias'])
    .withMessage('Pattern type must be one of: preference, decision, exploration, bias'),
  body('category')
    .isIn(['cost', 'climate', 'culture', 'timing', 'duration'])
    .withMessage('Category must be one of: cost, climate, culture, timing, duration'),
  body('frequency')
    .isFloat({ min: 0, max: 1 })
    .withMessage('Frequency must be between 0 and 1'),
  body('confidence')
    .isFloat({ min: 0, max: 1 })
    .withMessage('Confidence must be between 0 and 1'),
  body('dataPoints')
    .isInt({ min: 1 })
    .withMessage('Data points must be a positive integer'),
  body('reliability')
    .isFloat({ min: 0, max: 1 })
    .withMessage('Reliability must be between 0 and 1')
]

export const validatePredictiveModel = [
  body('modelType')
    .isIn(['satisfaction', 'cost', 'climate', 'market'])
    .withMessage('Model type must be one of: satisfaction, cost, climate, market'),
  body('targetVariable')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Target variable must be between 1 and 100 characters'),
  body('features')
    .isObject()
    .withMessage('Features must be an object'),
  body('hyperparameters')
    .isObject()
    .withMessage('Hyperparameters must be an object'),
  body('trainingDataSize')
    .isInt({ min: 1 })
    .withMessage('Training data size must be a positive integer'),
  body('trainingPeriod')
    .isObject()
    .withMessage('Training period must be an object'),
  body('trainingPeriod.start')
    .isISO8601()
    .withMessage('Training period start must be a valid ISO 8601 date'),
  body('trainingPeriod.end')
    .isISO8601()
    .withMessage('Training period end must be a valid ISO 8601 date')
]

export const validateExportOptions = [
  body('format')
    .isIn(['pdf', 'excel', 'csv', 'json'])
    .withMessage('Format must be one of: pdf, excel, csv, json'),
  body('sections')
    .isArray({ min: 1 })
    .withMessage('Must provide at least one section'),
  body('sections.*')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each section must be between 1 and 50 characters'),
  body('includeCharts')
    .isBoolean()
    .withMessage('Include charts must be a boolean'),
  body('includeRawData')
    .isBoolean()
    .withMessage('Include raw data must be a boolean'),
  body('dateRange')
    .optional()
    .isObject()
    .withMessage('Date range must be an object'),
  body('dateRange.start')
    .optional()
    .isISO8601()
    .withMessage('Date range start must be a valid ISO 8601 date'),
  body('dateRange.end')
    .optional()
    .isISO8601()
    .withMessage('Date range end must be a valid ISO 8601 date'),
  body('locations')
    .optional()
    .isArray()
    .withMessage('Locations must be an array'),
  body('locations.*')
    .optional()
    .isUUID()
    .withMessage('Each location must be a valid UUID'),
  body('template')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Template must be between 1 and 50 characters')
]

export const validateTemplateId = [
  param('templateId')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Template ID must be between 1 and 50 characters')
]

export const validateScheduleExport = [
  body('options')
    .isObject()
    .withMessage('Options must be an object'),
  body('frequency')
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Frequency must be one of: daily, weekly, monthly')
]

export const validateExportHistory = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
]

export const validateSummaryReport = [
  query('start')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('end')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
]

export const validateCleanupExports = [
  query('maxAge')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max age must be a positive integer (milliseconds)')
]