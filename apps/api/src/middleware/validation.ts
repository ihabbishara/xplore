import { validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate request data using express-validator
 * @param validations Array of validation chains to execute
 * @returns Express middleware function
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format validation errors for consistent API response
    res.status(400).json({
      error: {
        message: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.type === 'field' ? err.path : err.type,
          message: err.msg,
          value: 'value' in err ? err.value : undefined
        }))
      }
    });
  };
};

/**
 * Common validation error messages
 */
export const ValidationMessages = {
  REQUIRED: (field: string) => `${field} is required`,
  EMAIL: 'Must be a valid email address',
  MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters long`,
  MAX_LENGTH: (field: string, max: number) => `${field} must not exceed ${max} characters`,
  NUMERIC: (field: string) => `${field} must be a number`,
  DATE: 'Must be a valid date',
  URL: 'Must be a valid URL',
  PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  UUID: 'Must be a valid UUID',
  LATITUDE: 'Must be a valid latitude between -90 and 90',
  LONGITUDE: 'Must be a valid longitude between -180 and 180',
  POSITIVE_NUMBER: 'Must be a positive number',
  ENUM: (field: string, values: string[]) => `${field} must be one of: ${values.join(', ')}`
};