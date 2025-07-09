# Firebase Authentication Implementation Guide

## Overview

The Xplore application now supports dual authentication methods:
1. **Firebase Authentication** (for frontend convenience and social logins)
2. **JWT Authentication** (legacy support and API-to-API communication)

## Implementation Details

### Backend Components

1. **Firebase Service** (`/apps/api/src/lib/firebase.ts`)
   - Initializes Firebase Admin SDK
   - Supports both service account JSON and individual credentials
   - Gracefully handles missing Firebase configuration

2. **Firebase Auth Service** (`/apps/api/src/domains/auth/services/firebaseAuthService.ts`)
   - Verifies Firebase ID tokens
   - Creates users from Firebase tokens automatically
   - Syncs user data between Firebase and database
   - Distinguishes between Firebase and JWT tokens

3. **Auth Middleware** (`/apps/api/src/domains/auth/middleware/authMiddleware.ts`)
   - Supports both Firebase and JWT tokens
   - Automatically detects token type
   - Provides consistent user payload regardless of auth method

### Frontend Components

1. **API Client** (`/apps/web/src/lib/api/client.ts`)
   - Automatically attaches Firebase ID token to requests
   - Handles token refresh transparently
   - Manages authentication errors

## Configuration

### Backend Environment Variables

Add these to your `.env` file:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Alternative: Use complete service account JSON
# FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

### Frontend Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-web-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

## Testing the Implementation

### 1. Unit Tests

Run the authentication tests:

```bash
cd apps/api
npm test -- --testPathPattern=auth
```

### 2. Integration Tests

Test the complete authentication flow:

```bash
cd apps/api
npm test -- --testPathPattern=integration/auth
```

### 3. Manual Testing

#### Option A: Using the Frontend

1. Start both frontend and backend:
   ```bash
   # Terminal 1 - Backend
   cd apps/api
   npm run dev

   # Terminal 2 - Frontend
   cd apps/web
   npm run dev
   ```

2. Open http://localhost:3000
3. Sign in using Firebase authentication
4. Check Network tab for API calls with `Authorization: Bearer` headers
5. Verify successful API responses

#### Option B: Using cURL

1. Get a Firebase ID token (from frontend DevTools or Firebase Auth REST API)
2. Test protected endpoints:
   ```bash
   # Test user profile endpoint
   curl -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
        http://localhost:3001/api/users/profile

   # Test trip creation
   curl -X POST \
        -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"title":"Test Trip","description":"Testing Firebase auth"}' \
        http://localhost:3001/api/trips
   ```

#### Option C: Using the Test Script

```bash
cd apps/api
node test-firebase-auth.js
```

## Token Identification

The system automatically identifies token types:

- **Firebase Tokens**: 
  - Typically 200+ characters long
  - Use RS256 algorithm
  - Contain Firebase-specific claims

- **JWT Tokens**:
  - Typically 100-150 characters
  - Use HS256 algorithm
  - Created by our backend

## User Creation Flow

When a user authenticates with Firebase for the first time:

1. Firebase token is verified
2. System checks if user exists in database
3. If not, creates new user with:
   - Email from Firebase token
   - Email verification status
   - Social provider set to 'firebase'
   - Profile with name and avatar (if available)
4. Returns JWT-compatible payload for consistency

## Error Handling

The system handles various authentication scenarios:

1. **Missing Authentication**: Returns 401 Unauthorized
2. **Invalid Token Format**: Returns 401 with specific error
3. **Expired Firebase Token**: Returns 401 with "Firebase token expired"
4. **Invalid Firebase Token**: Returns 401 with "Invalid Firebase token"
5. **Firebase Not Configured**: Falls back to JWT authentication
6. **User Creation Failure**: Returns 500 with error details

## Security Considerations

1. **Token Validation**: All Firebase tokens are cryptographically verified
2. **User Isolation**: Each Firebase user gets a unique database record
3. **Email Verification**: Tracked and enforced where required
4. **Rate Limiting**: Applied to all authentication endpoints
5. **HTTPS Required**: In production, all auth tokens must be sent over HTTPS

## Troubleshooting

### Common Issues

1. **"Firebase authentication is not configured"**
   - Check environment variables
   - Ensure Firebase Admin SDK credentials are correct
   - Verify project ID matches between frontend and backend

2. **"Firebase token expired"**
   - Firebase ID tokens expire after 1 hour
   - Frontend should refresh tokens automatically
   - Check if `auth.currentUser.getIdToken(true)` is called

3. **"Invalid Firebase token"**
   - Ensure frontend and backend use same Firebase project
   - Check if token is being sent correctly in Authorization header
   - Verify token format: `Bearer <token>`

4. **User creation fails**
   - Check database connection
   - Ensure user table schema is up to date
   - Check for unique constraint violations

### Debug Mode

Enable detailed logging:

```env
LOG_LEVEL=debug
```

This will log:
- Token type detection
- User creation/lookup
- Token verification steps
- Error details

## Migration Guide

### For Existing JWT Users

No action required. The system supports both authentication methods simultaneously.

### For New Implementations

1. Prefer Firebase Authentication for:
   - Web and mobile apps
   - Social login requirements
   - Email/password authentication
   - Real-time auth state management

2. Use JWT Authentication for:
   - API-to-API communication
   - Long-lived service tokens
   - Legacy system integration

## API Endpoints Supporting Firebase Auth

All protected endpoints now support Firebase authentication:

- `/api/users/*` - User management
- `/api/trips/*` - Trip planning
- `/api/locations/*` - Location management
- `/api/journal/*` - Journal entries
- `/api/properties/*` - Property management
- `/api/weather/*` - Weather data
- `/api/checklists/*` - Checklist management
- `/api/analytics/*` - Analytics dashboard

## Performance Considerations

1. **Token Caching**: Firebase tokens are verified cryptographically (fast)
2. **User Lookup**: Indexed by email for quick retrieval
3. **Transaction Safety**: User creation uses database transactions
4. **Connection Pooling**: Firebase Admin SDK reuses connections

## Future Enhancements

1. **Token Refresh Endpoint**: Exchange expired Firebase tokens
2. **Session Management**: Track active sessions per user
3. **Multi-Factor Authentication**: Integrate Firebase MFA
4. **Role-Based Access Control**: Extend user permissions
5. **Audit Logging**: Track authentication events

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review test files for implementation examples
3. Check Firebase Admin SDK documentation
4. Review error logs for specific issues