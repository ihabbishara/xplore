# Firebase Authentication Setup

This guide explains how to configure Firebase Authentication for the Xplore API.

## Configuration Options

The Firebase Admin SDK can be configured in three ways (in order of priority):

### 1. Service Account File Path (Recommended)

This is the most secure and recommended approach for production environments.

1. Download your service account JSON file from Firebase Console:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the downloaded JSON file securely

2. Set the environment variable:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_PATH="/path/to/serviceAccountKey.json"
   FIREBASE_PROJECT_ID="your-project-id"
   ```

3. Make sure the file is readable by the application but not accessible publicly

### 2. Service Account JSON String (Legacy)

For environments where file access is limited (e.g., some cloud platforms):

```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project-id",...}'
FIREBASE_PROJECT_ID="your-project-id"
```

### 3. Individual Credentials (Development Only)

For local development, you can use individual environment variables:

```bash
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

## Security Best Practices

1. **Never commit service account files to version control**
   - Add `*.serviceAccountKey.json` to your `.gitignore`
   - Use environment-specific configuration

2. **Restrict file permissions**
   ```bash
   chmod 600 /path/to/serviceAccountKey.json
   ```

3. **Use different service accounts for different environments**
   - Development, staging, and production should have separate credentials

4. **Rotate keys regularly**
   - Generate new private keys periodically
   - Remove old keys from Firebase Console

## Verification

The application will log which configuration method is being used:
- "Firebase initialized with service account file"
- "Firebase initialized with service account key JSON"
- "Firebase initialized with individual environment variables"

If Firebase is not configured or credentials are invalid, the application will fall back to JWT-only authentication.

## Troubleshooting

1. **File not found error**
   - Ensure the path is absolute, not relative
   - Check file permissions
   - Verify the path in the environment variable

2. **Invalid JSON error**
   - Validate the JSON file format
   - Check for proper escaping if using JSON string

3. **Authentication errors**
   - Verify the service account has necessary permissions
   - Check that the project ID matches your Firebase project