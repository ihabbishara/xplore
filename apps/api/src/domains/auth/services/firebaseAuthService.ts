import { firebaseAuth } from '@/lib/firebase'
import { prisma } from '@/lib/prisma'
import { DecodedIdToken } from 'firebase-admin/auth'
import { AuthenticationError } from '@/shared/utils/errors'
import { logger } from '@/shared/utils/logger'
import { JWTPayload } from '@xplore/shared'

export class FirebaseAuthService {
  /**
   * Verify Firebase ID token and return user payload
   */
  static async verifyFirebaseToken(idToken: string): Promise<JWTPayload> {
    try {
      // Check if Firebase is configured
      if (!firebaseAuth) {
        throw new AuthenticationError('Firebase authentication is not configured')
      }

      // Verify the Firebase ID token
      const decodedToken: DecodedIdToken = await firebaseAuth.verifyIdToken(idToken)
      
      // Check if user exists in our database
      let user = await prisma.user.findUnique({
        where: { email: decodedToken.email },
        include: { profile: true }
      })

      // If user doesn't exist, create them
      if (!user) {
        user = await this.createUserFromFirebaseToken(decodedToken)
      }

      // Ensure user exists
      if (!user) {
        throw new AuthenticationError('Failed to authenticate user from Firebase token')
      }

      // Return JWT-compatible payload
      return {
        userId: user.id,
        email: user.email,
        emailVerified: user.emailVerified
      }
    } catch (error) {
      logger.error('Firebase token verification failed:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          throw new AuthenticationError('Firebase token expired')
        }
        if (error.message.includes('invalid')) {
          throw new AuthenticationError('Invalid Firebase token')
        }
      }
      
      throw new AuthenticationError('Firebase token verification failed')
    }
  }

  /**
   * Create user from Firebase token if they don't exist
   */
  private static async createUserFromFirebaseToken(decodedToken: DecodedIdToken) {
    logger.info(`Creating user from Firebase token: ${decodedToken.email}`)

    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: decodedToken.email!,
          emailVerified: decodedToken.email_verified || false,
          socialProvider: 'firebase',
          socialId: decodedToken.uid
        }
      })

      // Create profile with information from Firebase
      await tx.userProfile.create({
        data: {
          userId: newUser.id,
          firstName: decodedToken.name?.split(' ')[0] || null,
          lastName: decodedToken.name?.split(' ').slice(1).join(' ') || null,
          avatarUrl: decodedToken.picture || null
        }
      })

      // Return user with profile included
      return await tx.user.findUnique({
        where: { id: newUser.id },
        include: { profile: true }
      })
    })

    if (!user) {
      throw new Error('Failed to create user from Firebase token')
    }

    logger.info(`Created user from Firebase: ${user.email} (${user.id})`)
    return user
  }

  /**
   * Get user by Firebase UID
   */
  static async getUserByFirebaseUid(uid: string) {
    return await prisma.user.findFirst({
      where: { socialId: uid },
      include: { profile: true }
    })
  }

  /**
   * Update user's email verification status
   */
  static async updateEmailVerificationStatus(email: string, verified: boolean) {
    await prisma.user.update({
      where: { email },
      data: { emailVerified: verified }
    })
  }

  /**
   * Sync user data from Firebase
   */
  static async syncUserFromFirebase(idToken: string) {
    try {
      // Check if Firebase is configured
      if (!firebaseAuth) {
        throw new AuthenticationError('Firebase authentication is not configured')
      }

      const decodedToken = await firebaseAuth.verifyIdToken(idToken)
      
      await prisma.user.update({
        where: { email: decodedToken.email },
        data: {
          emailVerified: decodedToken.email_verified || false
        }
      })

      // Update profile if needed
      if (decodedToken.name || decodedToken.picture) {
        await prisma.userProfile.updateMany({
          where: { 
            user: { email: decodedToken.email }
          },
          data: {
            firstName: decodedToken.name?.split(' ')[0] || undefined,
            lastName: decodedToken.name?.split(' ').slice(1).join(' ') || undefined,
            avatarUrl: decodedToken.picture || undefined
          }
        })
      }

      logger.info(`Synced user data from Firebase: ${decodedToken.email}`)
    } catch (error) {
      logger.error('Error syncing user from Firebase:', error)
      throw error
    }
  }

  /**
   * Check if token is a Firebase token (vs JWT)
   */
  static isFirebaseToken(token: string): boolean {
    // Firebase tokens are longer and have different structure than our JWTs
    // Firebase tokens typically have 3 parts separated by dots and are much longer
    const parts = token.split('.')
    
    if (parts.length !== 3) return false
    
    try {
      // Firebase tokens have a specific header structure
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString())
      return header.alg === 'RS256' && header.typ === 'JWT'
    } catch {
      return false
    }
  }
}