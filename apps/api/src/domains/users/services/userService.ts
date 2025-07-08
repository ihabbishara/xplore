import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { 
  CreateProfileRequest, 
  UpdateProfileRequest, 
  UserProfile,
  CurrentLocation,
  UserInterests,
  PrivacySettings
} from '@xplore/shared';
import { NotFoundError, ValidationError } from '@/shared/utils/errors';
import { logger } from '@/shared/utils/logger';

export class UserService {
  static async getProfile(userId: string): Promise<UserProfile | null> {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) return null;

    return {
      ...profile,
      firstName: profile.firstName ?? undefined,
      lastName: profile.lastName ?? undefined,
      currentLocation: profile.currentLocation as unknown as CurrentLocation | undefined,
      interests: profile.interests as unknown as UserInterests | undefined,
      privacySettings: profile.privacySettings as unknown as PrivacySettings | undefined,
      bio: profile.bio ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
    } as UserProfile;
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
        firstName: data.firstName,
        lastName: data.lastName,
        targetCountries: data.targetCountries || [],
        explorationTimeline: data.explorationTimeline,
        userType: data.userType,
        bio: data.bio,
        currentLocation: data.currentLocation ? (data.currentLocation as any) : Prisma.JsonNull,
        interests: data.interests ? (data.interests as any) : Prisma.JsonNull,
        privacySettings: data.privacySettings ? (data.privacySettings as any) : Prisma.JsonNull,
      },
    });

    logger.info(`Profile created for user: ${userId}`);
    return {
      ...profile,
      firstName: profile.firstName ?? undefined,
      lastName: profile.lastName ?? undefined,
      currentLocation: profile.currentLocation as unknown as CurrentLocation | undefined,
      interests: profile.interests as unknown as UserInterests | undefined,
      privacySettings: profile.privacySettings as unknown as PrivacySettings | undefined,
      bio: profile.bio ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
    } as UserProfile;
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

    const updateData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      targetCountries: data.targetCountries,
      explorationTimeline: data.explorationTimeline,
      userType: data.userType,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
    };

    if (data.currentLocation !== undefined) {
      updateData.currentLocation = data.currentLocation || Prisma.JsonNull;
    }

    if (data.interests !== undefined) {
      updateData.interests = data.interests || Prisma.JsonNull;
    }

    if (data.privacySettings !== undefined) {
      updateData.privacySettings = data.privacySettings || Prisma.JsonNull;
    }

    const profile = await prisma.userProfile.update({
      where: { userId },
      data: updateData,
    });

    logger.info(`Profile updated for user: ${userId}`);
    return {
      ...profile,
      firstName: profile.firstName ?? undefined,
      lastName: profile.lastName ?? undefined,
      currentLocation: profile.currentLocation as unknown as CurrentLocation | undefined,
      interests: profile.interests as unknown as UserInterests | undefined,
      privacySettings: profile.privacySettings as unknown as PrivacySettings | undefined,
      bio: profile.bio ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
    } as UserProfile;
  }

  static async uploadAvatar(userId: string, avatarUrl: string): Promise<UserProfile> {
    const profile = await prisma.userProfile.update({
      where: { userId },
      data: { avatarUrl },
    });

    logger.info(`Avatar uploaded for user: ${userId}`);
    return {
      ...profile,
      firstName: profile.firstName ?? undefined,
      lastName: profile.lastName ?? undefined,
      currentLocation: profile.currentLocation as unknown as CurrentLocation | undefined,
      interests: profile.interests as unknown as UserInterests | undefined,
      privacySettings: profile.privacySettings as unknown as PrivacySettings | undefined,
      bio: profile.bio ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
    } as UserProfile;
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