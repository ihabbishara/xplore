import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { redisWrapper } from '@/lib/redis-wrapper';
import { Prisma } from '@prisma/client';
import {
  AuthResponse,
  AuthTokens,
  JWTPayload,
  RegisterRequest,
  LoginRequest,
} from '@xplore/shared';
import { AUTH_CONSTANTS } from '@xplore/shared';
import {
  AppError,
  AuthenticationError,
  ConflictError,
  ValidationError,
} from '@/shared/utils/errors';
import { logger } from '@/shared/utils/logger';

export class AuthService {
  private static JWT_SECRET = process.env.JWT_SECRET!;
  private static JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user and profile in transaction
    const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
        },
      });

      // Create empty profile
      await tx.userProfile.create({
        data: {
          userId: newUser.id,
          firstName,
          lastName,
        },
      });

      return newUser;
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.emailVerified);

    // Create email verification token
    await this.createEmailVerificationToken(email);

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        profile: profile ? {
          firstName: profile.firstName || undefined,
          lastName: profile.lastName || undefined,
          avatarUrl: profile.avatarUrl || undefined,
        } : undefined,
      },
      tokens,
    };
  }

  static async login(data: LoginRequest): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !user.passwordHash) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.emailVerified);

    return {
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        profile: user.profile ? {
          firstName: user.profile.firstName || undefined,
          lastName: user.profile.lastName || undefined,
          avatarUrl: user.profile.avatarUrl || undefined,
        } : undefined,
      },
      tokens,
    };
  }

  static async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as JWTPayload;

      // Check if token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.userId !== payload.userId) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
        throw new AuthenticationError('Refresh token expired');
      }

      // Delete old refresh token
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });

      // Generate new tokens
      return this.generateTokens(
        storedToken.user.id,
        storedToken.user.email,
        storedToken.user.emailVerified
      );
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid refresh token');
      }
      throw error;
    }
  }

  static async verifyEmail(token: string): Promise<void> {
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      throw new ValidationError('Invalid verification token');
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({ where: { id: verificationToken.id } });
      throw new ValidationError('Verification token expired');
    }

    // Update user
    await prisma.user.update({
      where: { email: verificationToken.email },
      data: { emailVerified: true },
    });

    // Delete token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    logger.info(`Email verified for: ${verificationToken.email}`);
  }

  static async generateTokens(
    userId: string,
    email: string,
    emailVerified: boolean
  ): Promise<AuthTokens> {
    const payload: JWTPayload = { userId, email, emailVerified };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY,
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  static async createEmailVerificationToken(email: string): Promise<string> {
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    // TODO: Send verification email
    logger.info(`Email verification token created for: ${email}`);

    return token;
  }

  static async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Delete specific refresh token
      await prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    } else {
      // Delete all refresh tokens for user (logout from all devices)
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }

    // Clear any cached sessions
    await redisWrapper.del(`session:${userId}`);
  }

  static async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Access token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid access token');
      }
      throw error;
    }
  }
}