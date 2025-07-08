import { redis } from './redis';
import { logger } from '@/shared/utils/logger';

class RedisWrapper {
  private isConnected: boolean = false;

  constructor() {
    redis.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis connected');
    });

    redis.on('error', (err) => {
      this.isConnected = false;
      logger.error('Redis error:', err);
    });

    redis.on('end', () => {
      this.isConnected = false;
      logger.info('Redis disconnected');
    });
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache get');
      return null;
    }

    try {
      return await redis.get(key);
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache set');
      return;
    }

    try {
      await redis.set(key, value);
    } catch (error) {
      logger.error('Redis set error:', error);
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache setex');
      return;
    }

    try {
      await redis.setEx(key, seconds, value);
    } catch (error) {
      logger.error('Redis setex error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache del');
      return;
    }

    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Redis del error:', error);
    }
  }
}

export const redisWrapper = new RedisWrapper();