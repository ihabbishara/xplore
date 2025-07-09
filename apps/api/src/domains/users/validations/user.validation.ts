import { body, param } from 'express-validator';
import { ValidationMessages } from '../../../middleware/validation';

/**
 * Validation rules for updating user profile
 */
export const updateProfileValidation = [
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
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('bio')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('phoneNumber')
    .optional()
    .isMobilePhone('any').withMessage('Invalid phone number'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage(ValidationMessages.DATE)
    .custom((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 13 && age <= 120;
    }).withMessage('Age must be between 13 and 120 years'),
  
  body('country')
    .optional()
    .isString()
    .isLength({ min: 2, max: 2 }).withMessage('Country must be a 2-letter ISO code')
    .toUpperCase(),
  
  body('language')
    .optional()
    .isString()
    .isLength({ min: 2, max: 5 }).withMessage('Language must be a valid ISO code'),
  
  body('timezone')
    .optional()
    .isString()
    .matches(/^[A-Za-z_]+\/[A-Za-z_]+$/).withMessage('Invalid timezone format')
];

/**
 * Validation rules for updating user preferences
 */
export const updatePreferencesValidation = [
  body('notifications')
    .optional()
    .isObject().withMessage('Notifications must be an object'),
  
  body('notifications.email')
    .optional()
    .isBoolean().withMessage('Email notifications must be a boolean'),
  
  body('notifications.push')
    .optional()
    .isBoolean().withMessage('Push notifications must be a boolean'),
  
  body('notifications.tripReminders')
    .optional()
    .isBoolean().withMessage('Trip reminders must be a boolean'),
  
  body('notifications.weatherAlerts')
    .optional()
    .isBoolean().withMessage('Weather alerts must be a boolean'),
  
  body('privacy')
    .optional()
    .isObject().withMessage('Privacy must be an object'),
  
  body('privacy.profileVisibility')
    .optional()
    .isIn(['public', 'friends', 'private']).withMessage('Invalid profile visibility setting'),
  
  body('privacy.showLocation')
    .optional()
    .isBoolean().withMessage('Show location must be a boolean'),
  
  body('privacy.showTrips')
    .optional()
    .isBoolean().withMessage('Show trips must be a boolean'),
  
  body('units')
    .optional()
    .isObject().withMessage('Units must be an object'),
  
  body('units.distance')
    .optional()
    .isIn(['km', 'miles']).withMessage('Distance unit must be km or miles'),
  
  body('units.temperature')
    .optional()
    .isIn(['celsius', 'fahrenheit']).withMessage('Temperature unit must be celsius or fahrenheit'),
  
  body('defaultCurrency')
    .optional()
    .isString()
    .isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter ISO code')
    .toUpperCase()
];

/**
 * Validation rules for user ID parameter
 */
export const userIdValidation = [
  param('id')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('User ID'))
    .isUUID().withMessage(ValidationMessages.UUID)
];

/**
 * Validation rules for changing password
 */
export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Current password')),
  
  body('newPassword')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('New password'))
    .isLength({ min: 8 }).withMessage(ValidationMessages.MIN_LENGTH('Password', 8))
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(ValidationMessages.PASSWORD)
    .custom((newPassword, { req }) => {
      return newPassword !== req.body.currentPassword;
    }).withMessage('New password must be different from current password')
];

/**
 * Validation rules for updating email
 */
export const updateEmailValidation = [
  body('newEmail')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('New email'))
    .isEmail().withMessage(ValidationMessages.EMAIL)
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Password for verification'))
];

/**
 * Validation rules for deleting account
 */
export const deleteAccountValidation = [
  body('password')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Password for verification')),
  
  body('confirmation')
    .notEmpty().withMessage(ValidationMessages.REQUIRED('Confirmation'))
    .equals('DELETE').withMessage('Please type DELETE to confirm account deletion')
];