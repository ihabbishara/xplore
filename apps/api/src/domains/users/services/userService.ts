import { prisma } from '@/lib/prisma';
import { 
  CreateProfileRequest, 
  UpdateProfileRequest, 
  UserProfile 
} from '@xplore/shared';
import { NotFoundError, ValidationError } from '@/shared/utils/errors';
import { logger } from '@/shared/utils/logger';

export class UserService {
  static async getProfile(userId: string): Promise<UserProfile | null> {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    return profile as UserProfile | null;
  }

  static async createProfile(
    userId: string, 
    data: CreateProfileRequest
  ): Promise<UserProfile> {
    // Check if profile already exists
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new ValidationError('Profile already exists for this user');
    }

    const profile = await prisma.userProfile.create({
      data: {
        userId,
        ...data,
        currentLocation: data.currentLocation ? data.currentLocation : undefined,
        interests: data.interests ? data.interests : undefined,
        privacySettings: data.privacySettings ? data.privacySettings : undefined,
      },
    });

    logger.info(`Profile created for user: ${userId}`);
    return profile as UserProfile;
  }

  static async updateProfile(
    userId: string, 
    data: UpdateProfileRequest
  ): Promise<UserProfile> {
    // Check if profile exists
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      throw new NotFoundError('Profile not found');
    }

    const profile = await prisma.userProfile.update({
      where: { userId },
      data: {
        ...data,
        currentLocation: data.currentLocation !== undefined 
          ? data.currentLocation 
          : existingProfile.currentLocation,
        interests: data.interests !== undefined 
          ? data.interests 
          : existingProfile.interests,
        privacySettings: data.privacySettings !== undefined 
          ? data.privacySettings 
          : existingProfile.privacySettings,
      },
    });

    logger.info(`Profile updated for user: ${userId}`);
    return profile as UserProfile;
  }

  static async uploadAvatar(userId: string, avatarUrl: string): Promise<UserProfile> {
    const profile = await prisma.userProfile.update({
      where: { userId },
      data: { avatarUrl },
    });

    logger.info(`Avatar uploaded for user: ${userId}`);
    return profile as UserProfile;
  }

  static async deleteProfile(userId: string): Promise<void> {
    // This will cascade delete all user data
    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info(`User and profile deleted: ${userId}`);
  }

  static async setupProfile(
    userId: string,
    data: CreateProfileRequest
  ): Promise<UserProfile> {
    // This method handles the onboarding profile setup
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      // Update existing profile
      return this.updateProfile(userId, data);
    } else {
      // Create new profile
      return this.createProfile(userId, data);
    }
  }
}