import { createClient } from 'redis';
import { logger } from '@/shared/utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = createClient({
  url: redisUrl,
});

redis.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

// Connect to Redis
(async () => {
  try {
    await redis.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
  }
})();