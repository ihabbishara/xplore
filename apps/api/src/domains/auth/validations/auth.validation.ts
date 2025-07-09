import { body, header } from 'express-validator';
import { ValidationMessages } from '../../../middleware/validation';

/**
 * Validation rules for user registration
 */
export const registerValidation = [
  body('email')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Email'))
    .isEmail().withMessage(ValidationMessages.EMAIL)
    .normalizeEmail()
    .trim(),
  
  body('password')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Password'))
    .isLength({ min: 8 }).withMessage(ValidationMessages.MIN_LENGTH('Password', 8))
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(ValidationMessages.PASSWORD),
  
  body('firstName')
    .optional()
    .isString().withMessage('First name must be a string')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .optional()
    .isString().withMessage('Last name must be a string')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
];

/**
 * Validation rules for user login
 */
export const loginValidation = [
  body('email')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Email'))
    .isEmail().withMessage(ValidationMessages.EMAIL)
    .normalizeEmail()
    .trim(),
  
  body('password')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Password'))
];

/**
 * Validation rules for token refresh
 */
export const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Refresh token'))
    .isJWT().withMessage('Invalid refresh token format')
];

/**
 * Validation rules for password reset request
 */
export const forgotPasswordValidation = [
  body('email')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Email'))
    .isEmail().withMessage(ValidationMessages.EMAIL)
    .normalizeEmail()
    .trim()
];

/**
 * Validation rules for password reset
 */
export const resetPasswordValidation = [
  body('token')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Reset token'))
    .isString(),
  
  body('password')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Password'))
    .isLength({ min: 8 }).withMessage(ValidationMessages.MIN_LENGTH('Password', 8))
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(ValidationMessages.PASSWORD)
];

/**
 * Validation rules for authenticated requests (Bearer token)
 */
export const authTokenValidation = [
  header('authorization')
    .notEmpty().withMessage('Authorization header is required')
    .matches(/^Bearer .+/).withMessage('Authorization header must be in format: Bearer <token>')
];