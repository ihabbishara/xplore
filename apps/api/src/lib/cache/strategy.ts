import { redis } from '../redis';
import { logger } from '@/shared/utils/logger';
import crypto from 'crypto';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Cache key prefix
  compress?: boolean; // Whether to compress large values
  tags?: string[]; // Tags for cache invalidation
}

export interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  hitRate: number;
}

class CacheStrategy {
  private static instance: CacheStrategy;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    errors: 0,
    hitRate: 0,
  };

  private constructor() {}

  static getInstance(): CacheStrategy {
    if (!CacheStrategy.instance) {
      CacheStrategy.instance = new CacheStrategy();
    }
    return CacheStrategy.instance;
  }

  // Generate cache key with optional prefix and hash
  generateKey(identifier: string, params?: any, prefix?: string): string {
    const baseKey = prefix ? `${prefix}:${identifier}` : identifier;
    
    if (!params || Object.keys(params).length === 0) {
      return baseKey;
    }

    // Create a stable hash of parameters
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    const hash = crypto.createHash('md5').update(paramString).digest('hex').substring(0, 8);
    
    return `${baseKey}:${hash}`;
  }

  // Get cached value with automatic deserialization
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      
      if (value === null) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      this.stats.hits++;
      this.updateHitRate();
      
      // Handle compressed values
      if (value.startsWith('COMPRESSED:')) {
        const compressed = Buffer.from(value.substring(11), 'base64');
        const decompressed = await this.decompress(compressed);
        return JSON.parse(decompressed);
      }

      return JSON.parse(value);
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  // Set cached value with automatic serialization
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      const ttl = options.ttl || 300; // Default 5 minutes

      let finalValue = serialized;

      // Compress large values
      if (options.compress && serialized.length > 1024) {
        const compressed = await this.compress(serialized);
        finalValue = `COMPRESSED:${compressed.toString('base64')}`;
      }

      // Set with expiration
      await redis.setEx(key, ttl, finalValue);

      // Add to tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.addToTags(key, options.tags, ttl);
      }

      return true;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache set error', { key, error });
      return false;
    }
  }

  // Delete cached value
  async delete(key: string): Promise<boolean> {
    try {
      const result = await redis.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Cache delete error', { key, error });
      return false;
    }
  }

  // Delete multiple keys by pattern
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      const result = await redis.del(keys);
      return result;
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error });
      return 0;
    }
  }

  // Invalidate cache by tags
  async invalidateByTags(tags: string[]): Promise<number> {
    let totalDeleted = 0;

    for (const tag of tags) {
      try {
        const tagKey = `tag:${tag}`;
        const keys = await redis.sMembers(tagKey);
        
        if (keys.length > 0) {
          const deleted = await redis.del(keys);
          totalDeleted += deleted;
        }

        await redis.del(tagKey);
      } catch (error) {
        logger.error('Cache invalidate by tag error', { tag, error });
      }
    }

    return totalDeleted;
  }

  // Cache-aside pattern implementation
  async cacheAside<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    const value = await fetcher();

    // Store in cache
    await this.set(key, value, options);

    return value;
  }

  // Write-through cache pattern
  async writeThrough<T>(
    key: string,
    value: T,
    writer: (value: T) => Promise<void>,
    options: CacheOptions = {}
  ): Promise<void> {
    // Write to source first
    await writer(value);

    // Then update cache
    await this.set(key, value, options);
  }

  // Cache warming for frequently accessed data
  async warmCache(warmupFunctions: Array<() => Promise<void>>): Promise<void> {
    logger.info('Starting cache warming', { functions: warmupFunctions.length });

    const results = await Promise.allSettled(warmupFunctions);
    
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.info('Cache warming completed', { succeeded, failed });
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Reset statistics
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      hitRate: 0,
    };
  }

  // Private helper methods
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private async addToTags(key: string, tags: string[], ttl: number): Promise<void> {
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      await redis.sAdd(tagKey, key);
      await redis.expire(tagKey, ttl);
    }
  }

  private async compress(data: string): Promise<Buffer> {
    // Using built-in zlib compression
    const { promisify } = await import('util');
    const { gzip } = await import('zlib');
    const gzipAsync = promisify(gzip);
    return gzipAsync(Buffer.from(data));
  }

  private async decompress(data: Buffer): Promise<string> {
    const { promisify } = await import('util');
    const { gunzip } = await import('zlib');
    const gunzipAsync = promisify(gunzip);
    const decompressed = await gunzipAsync(data);
    return decompressed.toString();
  }
}

// Export singleton instance
export const cache = CacheStrategy.getInstance();

// Predefined cache configurations
export const cacheConfigs = {
  // Short-lived cache for frequently changing data
  short: { ttl: 60, prefix: 'short' }, // 1 minute

  // Medium cache for semi-static data
  medium: { ttl: 300, prefix: 'medium' }, // 5 minutes

  // Long cache for rarely changing data
  long: { ttl: 3600, prefix: 'long' }, // 1 hour

  // Daily cache for analytics and reports
  daily: { ttl: 86400, prefix: 'daily' }, // 24 hours

  // User-specific cache
  user: (userId: string) => ({
    ttl: 600,
    prefix: `user:${userId}`,
    tags: [`user:${userId}`],
  }),

  // Location-specific cache
  location: (locationId: string) => ({
    ttl: 1800,
    prefix: `location:${locationId}`,
    tags: [`location:${locationId}`],
  }),

  // Trip-specific cache
  trip: (tripId: string) => ({
    ttl: 900,
    prefix: `trip:${tripId}`,
    tags: [`trip:${tripId}`],
  }),
};

// Cache decorators for methods
export function Cacheable(options: CacheOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = cache.generateKey(
        `${target.constructor.name}:${propertyKey}`,
        args,
        options.prefix
      );

      return cache.cacheAside(
        key,
        () => originalMethod.apply(this, args),
        options
      );
    };

    return descriptor;
  };
}

// Cache invalidation decorator
export function InvalidateCache(tags: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      await cache.invalidateByTags(tags);
      return result;
    };

    return descriptor;
  };
}