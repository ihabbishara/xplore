import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logger } from '@/shared/utils/logger';

async function seed() {
  try {
    logger.info('Starting database seed...');

    // Clear existing data
    await prisma.emailVerificationToken.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const hashedPassword = await bcrypt.hash('Test123!', 12);

    // Relocation Explorer user
    const user1 = await prisma.user.create({
      data: {
        email: 'marie.chen@example.com',
        passwordHash: hashedPassword,
        emailVerified: true,
        profile: {
          create: {
            firstName: 'Marie',
            lastName: 'Chen',
            userType: 'relocation_explorer',
            currentLocation: {
              country: 'Canada',
              city: 'Toronto',
              coordinates: {
                lat: 43.6532,
                lng: -79.3832,
              },
            },
            targetCountries: ['France', 'Spain', 'Portugal'],
            explorationTimeline: '3-6 months',
            interests: {
              work: ['tech hubs', 'startup scene', 'coworking spaces'],
              lifestyle: ['food scene', 'arts & culture', 'nightlife'],
              climate: ['mediterranean', 'coastal'],
            },
            bio: 'Software engineer looking to relocate to Europe for better work-life balance.',
            privacySettings: {
              profileVisible: true,
              locationVisible: true,
            },
          },
        },
      },
    });

    // Weekend Traveler user
    const user2 = await prisma.user.create({
      data: {
        email: 'alex.rodriguez@example.com',
        passwordHash: hashedPassword,
        emailVerified: true,
        profile: {
          create: {
            firstName: 'Alex',
            lastName: 'Rodriguez',
            userType: 'weekend_traveler',
            currentLocation: {
              country: 'United States',
              city: 'New York',
              coordinates: {
                lat: 40.7128,
                lng: -74.0060,
              },
            },
            targetCountries: ['Mexico', 'Canada', 'Caribbean'],
            explorationTimeline: '1-3 months',
            interests: {
              lifestyle: ['food scene', 'nightlife', 'shopping'],
              climate: ['tropical', 'coastal'],
            },
            bio: 'Marketing manager who loves exploring new places on weekends.',
            privacySettings: {
              profileVisible: true,
              locationVisible: false,
            },
          },
        },
      },
    });

    // Outdoor Adventurer user
    const user3 = await prisma.user.create({
      data: {
        email: 'jordan.kim@example.com',
        passwordHash: hashedPassword,
        emailVerified: false,
        profile: {
          create: {
            firstName: 'Jordan',
            lastName: 'Kim',
            userType: 'outdoor_adventurer',
            currentLocation: {
              country: 'United States',
              city: 'Denver',
              coordinates: {
                lat: 39.7392,
                lng: -104.9903,
              },
            },
            targetCountries: ['Nepal', 'New Zealand', 'Chile'],
            explorationTimeline: '6-12 months',
            interests: {
              lifestyle: ['nature', 'fitness'],
              climate: ['mountain', 'desert'],
            },
            bio: 'Freelance designer and outdoor enthusiast planning a year of adventure.',
            privacySettings: {
              profileVisible: true,
              locationVisible: true,
            },
          },
        },
      },
    });

    logger.info('Seed completed successfully');
    logger.info(`Created ${3} users`);
  } catch (error) {
    logger.error('Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});