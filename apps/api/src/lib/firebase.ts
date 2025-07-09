import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import * as fs from 'fs'
import * as path from 'path'

let firebaseApp: any

// Initialize Firebase Admin SDK
const initFirebase = () => {
  if (getApps().length === 0) {
    // Check if Firebase credentials are provided
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.warn('Firebase not configured - Firebase authentication will be disabled')
      return
    }

    // Priority 1: Use service account path (recommended)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      try {
        const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        
        // Check if file exists
        if (!fs.existsSync(serviceAccountPath)) {
          throw new Error(`Service account file not found at: ${serviceAccountPath}`)
        }
        
        // Read and parse the service account file
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'))
        
        firebaseApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        })
        
        console.log('Firebase initialized with service account file')
      } catch (error) {
        console.error('Error loading Firebase service account file:', error)
        throw new Error('Invalid Firebase service account file configuration')
      }
    }
    // Priority 2: Use service account key JSON string (legacy)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        firebaseApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        })
        console.log('Firebase initialized with service account key JSON')
      } catch (error) {
        console.error('Error parsing Firebase service account:', error)
        throw new Error('Invalid Firebase service account configuration')
      }
    }
    // Priority 3: Use individual environment variables (development)
    else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        }),
        projectId: process.env.FIREBASE_PROJECT_ID
      })
      console.log('Firebase initialized with individual environment variables')
    } else {
      console.warn('Firebase credentials not found - Firebase authentication will be disabled')
      return
    }
  } else {
    firebaseApp = getApps()[0]
  }
}

// Initialize Firebase
initFirebase()

// Export Firebase Auth instance
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null

// Export Firebase app
export { firebaseApp }