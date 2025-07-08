# 🧪 Testing Firebase Authentication Implementation

## 📋 Testing Options

### Option 1: Quick Test Server (Recommended for Quick Testing)

1. **Start the test server:**
   ```bash
   cd apps/api
   node test-firebase-auth.js
   ```

2. **Test with curl:**
   ```bash
   # Test without auth (should return 401)
   curl http://localhost:3001/api/test/auth

   # Test with a fake token
   curl -H "Authorization: Bearer test-token-123" http://localhost:3001/api/test/auth
   ```

### Option 2: Frontend Testing (Recommended for Full Integration)

1. **Start the frontend:**
   ```bash
   cd apps/web
   npm run dev
   ```

2. **Check Firebase configuration:**
   - Ensure `.env.local` has Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   ```

3. **Test authentication flow:**
   - Open http://localhost:3000
   - Click on login/register
   - Sign in with Firebase (Google, email/password)
   - Check browser DevTools Network tab
   - Look for API calls with `Authorization: Bearer` headers
   - The token should be a long Firebase ID token (200+ characters)

### Option 3: Direct API Testing with Firebase Admin SDK

Create a test file `test-firebase-direct.js`:

```javascript
// test-firebase-direct.js
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testFirebaseAuth() {
  try {
    // Sign in with test credentials
    const userCredential = await signInWithEmailAndPassword(
      auth,
      'test@example.com',
      'testpassword123'
    );
    
    // Get the ID token
    const idToken = await userCredential.user.getIdToken();
    console.log('Firebase ID Token:', idToken.substring(0, 50) + '...');
    
    // Test API call
    const response = await fetch('http://localhost:3001/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    const data = await response.json();
    console.log('API Response:', data);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFirebaseAuth();
```

### Option 4: Using Postman or Insomnia

1. **Get a Firebase ID token:**
   - Use Firebase Auth REST API
   - Or use the frontend to get a token from DevTools

2. **Make API requests:**
   ```
   GET http://localhost:3001/api/users/profile
   Headers:
     Authorization: Bearer YOUR_FIREBASE_ID_TOKEN
   ```

## 🔍 What to Check

### 1. **Token Detection**
- JWT tokens are typically 100-150 characters
- Firebase ID tokens are typically 200+ characters
- Check server logs to see which type was detected

### 2. **User Creation**
- First Firebase login should create a new user in the database
- Check database for new user record:
  ```sql
  SELECT * FROM users WHERE social_provider = 'firebase';
  ```

### 3. **Error Handling**
- Test with expired token
- Test with invalid token
- Test with no token

### 4. **Backend Logs**
Look for these log messages:
```
Firebase not configured - Firebase authentication will be disabled
Authenticating with Firebase token
Created user from Firebase: email@example.com
```

## 🛠️ Troubleshooting

### If Firebase is not configured:
1. Add Firebase Admin SDK credentials to `.env`:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-client-email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   ```

2. Or use service account JSON:
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
   ```

### If server won't start:
1. Try running with TypeScript transpile-only:
   ```bash
   npx nodemon --exec "npx ts-node --transpile-only src/index.ts"
   ```

2. Or create a minimal test server that only loads the auth middleware

### If authentication fails:
1. Check that Firebase is initialized in the frontend
2. Verify the token is being sent in the Authorization header
3. Check server logs for specific error messages
4. Ensure Firebase project IDs match between frontend and backend

## 📊 Expected Results

### Successful Authentication:
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### Failed Authentication:
```json
{
  "error": "Firebase token expired"
}
```

## 🎯 Quick Test Commands

```bash
# 1. Test health endpoint
curl http://localhost:3001/health

# 2. Test without auth (should fail)
curl http://localhost:3001/api/users/profile

# 3. Test with fake token (should fail)
curl -H "Authorization: Bearer fake-token" http://localhost:3001/api/users/profile

# 4. Test with real Firebase token (should succeed)
curl -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" http://localhost:3001/api/users/profile
```

## 🔐 Security Notes

- Never commit real Firebase tokens to version control
- Firebase ID tokens expire after 1 hour
- Always use HTTPS in production
- Validate token audience and issuer in production