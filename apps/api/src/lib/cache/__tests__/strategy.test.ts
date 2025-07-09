import { CacheStrategy, Cacheable, InvalidateCache, cacheConfigs } from '../strategy';
import { redis } from '../../redis';

// Mock dependencies
jest.mock('../../redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    smembers: jest.fn(),
    sadd: jest.fn(),
    expire: jest.fn(),
  },
}));

jest.mock('@/shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('CacheStrategy', () => {
  let cache: CacheStrategy;

  beforeEach(() => {
    cache = CacheStrategy.getInstance();
    cache.resetStats();
    jest.clearAllMocks();
  });

  describe('generateKey', () => {
    it('should generate simple key without params', () => {
      const key = cache.generateKey('users');
      expect(key).toBe('users');
    });

    it('should generate key with prefix', () => {
      const key = cache.generateKey('list', undefined, 'users');
      expect(key).toBe('users:list');
    });

    it('should generate key with params hash', () => {
      const key = cache.generateKey('search', { query: 'test', limit: 10 });
      expect(key).toMatch(/^search:[a-f0-9]{8}$/);
    });

    it('should generate consistent hash for same params', () => {
      const params = { query: 'test', limit: 10 };
      const key1 = cache.generateKey('search', params);
      const key2 = cache.generateKey('search', params);
      expect(key1).toBe(key2);
    });
  });

  describe('get', () => {
    it('should return parsed value on cache hit', async () => {
      const data = { id: 1, name: 'Test' };
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(data));

      const result = await cache.get('test-key');

      expect(result).toEqual(data);
      expect(redis.get).toHaveBeenCalledWith('test-key');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(0);
    });

    it('should return null on cache miss', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      const result = await cache.get('test-key');

      expect(result).toBeNull();
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(1);
    });

    it('should handle compressed values', async () => {
      const data = { id: 1, content: 'Large content'.repeat(100) };
      const compressed = 'COMPRESSED:H4sIAAAAAAAAE...'; // Mock compressed data
      (redis.get as jest.Mock).mockResolvedValue(compressed);

      // Mock decompression
      jest.spyOn(cache as any, 'decompress').mockResolvedValue(JSON.stringify(data));

      const result = await cache.get('test-key');

      expect(result).toEqual(data);
    });

    it('should handle errors gracefully', async () => {
      (redis.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      const result = await cache.get('test-key');

      expect(result).toBeNull();
      
      const stats = cache.getStats();
      expect(stats.errors).toBe(1);
    });
  });

  describe('set', () => {
    it('should set value with default TTL', async () => {
      const data = { id: 1, name: 'Test' };

      const result = await cache.set('test-key', data);

      expect(result).toBe(true);
      expect(redis.setex).toHaveBeenCalledWith(
        'test-key',
        300, // Default TTL
        JSON.stringify(data)
      );
    });

    it('should set value with custom TTL', async () => {
      const data = { id: 1, name: 'Test' };

      await cache.set('test-key', data, { ttl: 600 });

      expect(redis.setex).toHaveBeenCalledWith(
        'test-key',
        600,
        JSON.stringify(data)
      );
    });

    it('should compress large values when specified', async () => {
      const largeData = { content: 'x'.repeat(2000) };
      
      // Mock compression
      jest.spyOn(cache as any, 'compress').mockResolvedValue(Buffer.from('compressed'));

      await cache.set('test-key', largeData, { compress: true });

      expect(redis.setex).toHaveBeenCalledWith(
        'test-key',
        300,
        expect.stringContaining('COMPRESSED:')
      );
    });

    it('should add tags when specified', async () => {
      const data = { id: 1 };

      await cache.set('test-key', data, { tags: ['user:1', 'active'] });

      expect(redis.sadd).toHaveBeenCalledWith('tag:user:1', 'test-key');
      expect(redis.sadd).toHaveBeenCalledWith('tag:active', 'test-key');
      expect(redis.expire).toHaveBeenCalledWith('tag:user:1', 300);
      expect(redis.expire).toHaveBeenCalledWith('tag:active', 300);
    });
  });

  describe('delete', () => {
    it('should delete key successfully', async () => {
      (redis.del as jest.Mock).mockResolvedValue(1);

      const result = await cache.delete('test-key');

      expect(result).toBe(true);
      expect(redis.del).toHaveBeenCalledWith('test-key');
    });

    it('should return false if key not found', async () => {
      (redis.del as jest.Mock).mockResolvedValue(0);

      const result = await cache.delete('test-key');

      expect(result).toBe(false);
    });
  });

  describe('deletePattern', () => {
    it('should delete keys matching pattern', async () => {
      (redis.keys as jest.Mock).mockResolvedValue(['user:1', 'user:2', 'user:3']);
      (redis.del as jest.Mock).mockResolvedValue(3);

      const result = await cache.deletePattern('user:*');

      expect(result).toBe(3);
      expect(redis.keys).toHaveBeenCalledWith('user:*');
      expect(redis.del).toHaveBeenCalledWith('user:1', 'user:2', 'user:3');
    });

    it('should return 0 if no keys match', async () => {
      (redis.keys as jest.Mock).mockResolvedValue([]);

      const result = await cache.deletePattern('nonexistent:*');

      expect(result).toBe(0);
      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe('invalidateByTags', () => {
    it('should delete all keys with specified tags', async () => {
      (redis.smembers as jest.Mock)
        .mockResolvedValueOnce(['key1', 'key2'])
        .mockResolvedValueOnce(['key3']);
      (redis.del as jest.Mock).mockResolvedValue(1);

      const result = await cache.invalidateByTags(['user:1', 'active']);

      expect(result).toBe(2); // key1, key2, key3 - but del called separately
      expect(redis.smembers).toHaveBeenCalledWith('tag:user:1');
      expect(redis.smembers).toHaveBeenCalledWith('tag:active');
      expect(redis.del).toHaveBeenCalledWith('key1', 'key2');
      expect(redis.del).toHaveBeenCalledWith('key3');
    });
  });

  describe('cacheAside', () => {
    it('should return cached value if available', async () => {
      const cachedData = { id: 1, name: 'Cached' };
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const fetcher = jest.fn().mockResolvedValue({ id: 2, name: 'Fresh' });

      const result = await cache.cacheAside('test-key', fetcher);

      expect(result).toEqual(cachedData);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not cached', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      const freshData = { id: 2, name: 'Fresh' };
      const fetcher = jest.fn().mockResolvedValue(freshData);

      const result = await cache.cacheAside('test-key', fetcher);

      expect(result).toEqual(freshData);
      expect(fetcher).toHaveBeenCalled();
      expect(redis.setex).toHaveBeenCalled();
    });
  });

  describe('writeThrough', () => {
    it('should write to source then cache', async () => {
      const data = { id: 1, name: 'Test' };
      const writer = jest.fn().mockResolvedValue(undefined);

      await cache.writeThrough('test-key', data, writer);

      expect(writer).toHaveBeenCalledWith(data);
      expect(redis.setex).toHaveBeenCalledWith(
        'test-key',
        300,
        JSON.stringify(data)
      );
    });

    it('should not cache if write fails', async () => {
      const data = { id: 1, name: 'Test' };
      const writer = jest.fn().mockRejectedValue(new Error('Write failed'));

      await expect(
        cache.writeThrough('test-key', data, writer)
      ).rejects.toThrow('Write failed');

      expect(redis.setex).not.toHaveBeenCalled();
    });
  });

  describe('warmCache', () => {
    it('should execute all warmup functions', async () => {
      const warmup1 = jest.fn().mockResolvedValue(undefined);
      const warmup2 = jest.fn().mockResolvedValue(undefined);
      const warmup3 = jest.fn().mockRejectedValue(new Error('Failed'));

      await cache.warmCache([warmup1, warmup2, warmup3]);

      expect(warmup1).toHaveBeenCalled();
      expect(warmup2).toHaveBeenCalled();
      expect(warmup3).toHaveBeenCalled();
    });
  });

  describe('statistics', () => {
    it('should track hit rate correctly', async () => {
      (redis.get as jest.Mock)
        .mockResolvedValueOnce('"hit"')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('"hit"')
        .mockResolvedValueOnce(null);

      await cache.get('key1'); // Hit
      await cache.get('key2'); // Miss
      await cache.get('key3'); // Hit
      await cache.get('key4'); // Miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(50);
    });
  });
});

describe('Decorators', () => {
  describe('@Cacheable', () => {
    it('should cache method results', async () => {
      class TestService {
        callCount = 0;

        @Cacheable({ ttl: 60 })
        async getData(id: string) {
          this.callCount++;
          return { id, data: 'test' };
        }
      }

      const service = new TestService();
      
      // First call - should execute method
      (redis.get as jest.Mock).mockResolvedValueOnce(null);
      const result1 = await service.getData('1');
      expect(service.callCount).toBe(1);

      // Second call - should return from cache
      (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(result1));
      const result2 = await service.getData('1');
      expect(service.callCount).toBe(1); // Not incremented
      expect(result2).toEqual(result1);
    });
  });

  describe('@InvalidateCache', () => {
    it('should invalidate cache after method execution', async () => {
      class TestService {
        @InvalidateCache(['user:1'])
        async updateData(data: any) {
          return { success: true };
        }
      }

      const service = new TestService();
      (redis.smembers as jest.Mock).mockResolvedValue([]);
      
      await service.updateData({ id: 1 });

      expect(redis.smembers).toHaveBeenCalledWith('tag:user:1');
    });
  });
});

describe('cacheConfigs', () => {
  it('should have predefined configurations', () => {
    expect(cacheConfigs.short).toEqual({ ttl: 60, prefix: 'short' });
    expect(cacheConfigs.medium).toEqual({ ttl: 300, prefix: 'medium' });
    expect(cacheConfigs.long).toEqual({ ttl: 3600, prefix: 'long' });
    expect(cacheConfigs.daily).toEqual({ ttl: 86400, prefix: 'daily' });
  });

  it('should generate user-specific config', () => {
    const config = cacheConfigs.user('123');
    expect(config).toEqual({
      ttl: 600,
      prefix: 'user:123',
      tags: ['user:123'],
    });
  });

  it('should generate location-specific config', () => {
    const config = cacheConfigs.location('loc456');
    expect(config).toEqual({
      ttl: 1800,
      prefix: 'location:loc456',
      tags: ['location:loc456'],
    });
  });
});