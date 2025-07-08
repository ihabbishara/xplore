import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

let firebaseApp: any

// Initialize Firebase Admin SDK
const initFirebase = () => {
  if (getApps().length === 0) {
    // Check if Firebase credentials are provided
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.warn('Firebase not configured - Firebase authentication will be disabled')
      return
    }

    // In production, use service account key
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        firebaseApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        })
      } catch (error) {
        console.error('Error parsing Firebase service account:', error)
        throw new Error('Invalid Firebase service account configuration')
      }
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      // For development, use environment variables
      firebaseApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        }),
        projectId: process.env.FIREBASE_PROJECT_ID
      })
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