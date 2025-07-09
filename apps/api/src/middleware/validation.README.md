# API Request Validation Middleware

## Overview

This middleware provides comprehensive request validation for all API endpoints using `express-validator`. It ensures data integrity, security, and consistent error responses across the application.

## Features

- ✅ Type-safe validation using express-validator
- ✅ Consistent error response format
- ✅ Reusable validation rules
- ✅ Domain-specific validation modules
- ✅ Built-in sanitization
- ✅ Custom validation messages
- ✅ Integration with rate limiting

## Usage

### Basic Example

```typescript
import { validate } from '@/middleware/validation';
import { body, query } from 'express-validator';

// Define validation rules
const createUserValidation = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

// Apply to route
router.post('/users', validate(createUserValidation), UserController.create);
```

### Error Response Format

When validation fails, the middleware returns a consistent error response:

```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email",
        "value": "invalid-email"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters",
        "value": "123"
      }
    ]
  }
}
```

## Domain-Specific Validations

### Auth Domain (`auth.validation.ts`)
- `registerValidation` - User registration with email, password, and optional profile fields
- `loginValidation` - User login with email and password
- `refreshTokenValidation` - JWT refresh token validation
- `forgotPasswordValidation` - Password reset request
- `resetPasswordValidation` - Password reset with token

### Location Domain (`location.validation.ts`)
- `searchValidation` - Location search with query, limit, and country
- `saveLocationValidation` - Save location with coordinates and metadata
- `locationIdValidation` - UUID validation for location IDs
- `updateLocationValidation` - Update saved location tags and notes
- `coordinatesValidation` - Latitude/longitude validation

### Trip Domain (`trip.validation.ts`)
- `createTripValidation` - Create trip with dates and destinations
- `updateTripValidation` - Update trip details
- `tripIdValidation` - UUID validation for trip IDs
- `addDestinationValidation` - Add destination to trip
- `tripQueryValidation` - Query trips with filters
- `addCollaboratorValidation` - Add collaborator to trip

### Property Domain (`property.validation.ts`)
- `importPropertyValidation` - Import property from supported platforms
- `savePropertyValidation` - Save property with details
- `propertyIdValidation` - UUID validation for property IDs
- `propertyQueryValidation` - Search properties with filters
- `updatePropertyNotesValidation` - Update property notes

### Journal Domain (`journal.validation.ts`)
- `createJournalEntryValidation` - Create journal entry with content and metadata
- `updateJournalEntryValidation` - Update journal entry
- `journalEntryIdValidation` - UUID validation for journal entries
- `journalQueryValidation` - Query journal entries with filters
- `addMediaValidation` - Add media to journal entry
- `voiceTranscriptionValidation` - Voice transcription settings

### Weather Domain (`weather.validation.ts`)
- `currentWeatherValidation` - Get current weather by coordinates
- `weatherForecastValidation` - Get weather forecast
- `historicalWeatherValidation` - Get historical weather data
- `weatherPreferencesValidation` - Update user weather preferences
- `batchWeatherValidation` - Batch weather requests for multiple locations

### User Domain (`user.validation.ts`)
- `updateProfileValidation` - Update user profile information
- `updatePreferencesValidation` - Update user preferences
- `userIdValidation` - UUID validation for user IDs
- `changePasswordValidation` - Change user password
- `updateEmailValidation` - Update user email
- `deleteAccountValidation` - Delete user account

## Common Validation Patterns

### Required Fields
```typescript
body('fieldName')
  .notEmpty().withMessage(ValidationMessages.REQUIRED('Field name'))
```

### Email Validation
```typescript
body('email')
  .isEmail().withMessage(ValidationMessages.EMAIL)
  .normalizeEmail()
```

### Password Validation
```typescript
body('password')
  .isLength({ min: 8 })
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage(ValidationMessages.PASSWORD)
```

### UUID Validation
```typescript
param('id')
  .isUUID().withMessage(ValidationMessages.UUID)
```

### Coordinate Validation
```typescript
body('latitude')
  .isFloat({ min: -90, max: 90 }).withMessage(ValidationMessages.LATITUDE),
body('longitude')
  .isFloat({ min: -180, max: 180 }).withMessage(ValidationMessages.LONGITUDE)
```

### Array Validation
```typescript
body('tags')
  .isArray().withMessage('Tags must be an array')
  .custom((tags: string[]) => {
    return tags.every(tag => typeof tag === 'string' && tag.length <= 50);
  }).withMessage('Each tag must be a string with maximum 50 characters')
```

### Custom Validation
```typescript
body('endDate')
  .custom((endDate, { req }) => {
    const startDate = new Date(req.body.startDate);
    return new Date(endDate) >= startDate;
  }).withMessage('End date must be after start date')
```

## Type Conversion

The validation middleware automatically converts values to the appropriate types:

```typescript
query('limit')
  .isInt({ min: 1, max: 100 })
  .toInt() // Converts string to integer

body('price')
  .isFloat({ min: 0 })
  .toFloat() // Converts string to float

body('isPublic')
  .isBoolean()
  .toBoolean() // Converts string to boolean

body('startDate')
  .isISO8601()
  .toDate() // Converts string to Date object
```

## Sanitization

Built-in sanitization methods:

```typescript
body('email')
  .normalizeEmail() // Lowercase, remove dots from gmail, etc.

body('name')
  .trim() // Remove leading/trailing whitespace
  .escape() // Escape HTML entities

body('country')
  .toUpperCase() // Convert to uppercase
```

## Testing

### Unit Testing Validations

```typescript
import { validate } from '@/middleware/validation';
import { registerValidation } from '@/domains/auth/validations/auth.validation';

describe('Auth Validation', () => {
  it('should validate registration data', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'StrongP@ssw0rd'
      });

    expect(response.status).toBe(200);
  });

  it('should reject invalid email', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'invalid-email',
        password: 'StrongP@ssw0rd'
      });

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('email');
  });
});
```

## Best Practices

1. **Always validate user input** - Never trust client-side data
2. **Use appropriate validators** - Choose the right validator for each data type
3. **Provide clear error messages** - Help users understand what went wrong
4. **Sanitize input** - Prevent XSS and SQL injection attacks
5. **Be consistent** - Use the same validation patterns across the application
6. **Test thoroughly** - Write tests for both valid and invalid inputs
7. **Document custom validations** - Explain complex validation logic
8. **Use rate limiting** - Combine validation with rate limiting for security

## Security Considerations

- Password requirements enforce strong passwords
- Email normalization prevents duplicate accounts
- Input sanitization prevents XSS attacks
- UUID validation prevents invalid ID injection
- URL validation restricts to supported platforms
- Rate limiting prevents validation abuse

## Migration Guide

If you're migrating from controller-based validation:

1. Remove validation logic from controllers
2. Create validation files in the domain's `validations` folder
3. Import and apply validations in route files
4. Update tests to check for new error format
5. Remove old validation methods from controllers

## Troubleshooting

### Common Issues

1. **Validation not running**
   - Ensure `validate()` middleware is before the controller
   - Check that validation array is passed correctly

2. **Fields not being validated**
   - Verify field names match request body/query/params
   - Check for typos in validation rules

3. **Type conversion not working**
   - Ensure conversion methods (toInt, toFloat, etc.) are called
   - Place conversion after validation rules

4. **Custom validation not working**
   - Return true for valid values, false for invalid
   - Access other fields via `req` parameter in custom function

## Future Enhancements

- [ ] Add validation caching for performance
- [ ] Implement conditional validation rules
- [ ] Add support for file upload validation
- [ ] Create validation rule generator CLI
- [ ] Add OpenAPI schema generation from validations