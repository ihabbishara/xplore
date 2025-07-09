import { DatabaseMonitoring, setupQueryMonitoring, queryOptimizations } from '../monitoring';
import { PrismaClient } from '@prisma/client';
import { redis } from '../../redis';

// Mock dependencies
jest.mock('../../redis', () => ({
  redis: {
    setex: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock('@/shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('DatabaseMonitoring', () => {
  let monitoring: DatabaseMonitoring;

  beforeEach(() => {
    monitoring = DatabaseMonitoring.getInstance();
    monitoring.reset();
    jest.clearAllMocks();
  });

  describe('recordQuery', () => {
    it('should track query metrics correctly', async () => {
      await monitoring.recordQuery({
        model: 'User',
        action: 'findMany',
        duration: 50,
      });

      await monitoring.recordQuery({
        model: 'User',
        action: 'findUnique',
        duration: 150, // Slow query
      });

      const metrics = await monitoring.getMetrics();

      expect(metrics.totalQueries).toBe(2);
      expect(metrics.slowQueries).toBe(1);
      expect(metrics.averageDuration).toBe(100);
      expect(metrics.queriesByModel['User']).toBe(2);
      expect(metrics.queriesByAction['findMany']).toBe(1);
      expect(metrics.queriesByAction['findUnique']).toBe(1);
    });

    it('should track errors correctly', async () => {
      await monitoring.recordQuery({
        model: 'User',
        action: 'create',
        duration: 30,
        error: 'Unique constraint violation',
      });

      const metrics = await monitoring.getMetrics();

      expect(metrics.errorRate).toBe(1);
    });

    it('should persist metrics to Redis', async () => {
      await monitoring.recordQuery({
        model: 'Location',
        action: 'findMany',
        duration: 75,
      });

      expect(redis.setex).toHaveBeenCalledWith(
        'db:performance:metrics',
        3600,
        expect.any(String)
      );
    });
  });

  describe('getMetrics', () => {
    it('should retrieve cached metrics from Redis', async () => {
      const cachedMetrics = {
        slowQueries: 5,
        totalQueries: 100,
        averageDuration: 45,
        errorRate: 0.02,
        queriesByModel: { User: 50, Location: 50 },
        queriesByAction: { findMany: 80, create: 20 },
      };

      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedMetrics));

      const metrics = await monitoring.getMetrics();

      expect(metrics).toEqual(cachedMetrics);
      expect(redis.get).toHaveBeenCalledWith('db:performance:metrics');
    });

    it('should return current metrics if Redis fails', async () => {
      (redis.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await monitoring.recordQuery({
        model: 'Trip',
        action: 'update',
        duration: 60,
      });

      const metrics = await monitoring.getMetrics();

      expect(metrics.totalQueries).toBe(1);
      expect(metrics.queriesByModel['Trip']).toBe(1);
    });
  });
});

describe('setupQueryMonitoring', () => {
  it('should add middleware to Prisma client', () => {
    const mockPrisma = {
      $use: jest.fn(),
    } as any;

    setupQueryMonitoring(mockPrisma);

    expect(mockPrisma.$use).toHaveBeenCalledWith(expect.any(Function));
  });
});

describe('queryOptimizations', () => {
  describe('cachedQuery', () => {
    it('should return cached value if available', async () => {
      const cachedData = { id: 1, name: 'Test' };
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const result = await queryOptimizations.cachedQuery(
        'test-key',
        async () => ({ id: 2, name: 'New' }),
        300
      );

      expect(result).toEqual(cachedData);
      expect(redis.get).toHaveBeenCalledWith('test-key');
    });

    it('should fetch and cache if not cached', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      const newData = { id: 2, name: 'New' };

      const result = await queryOptimizations.cachedQuery(
        'test-key',
        async () => newData,
        300
      );

      expect(result).toEqual(newData);
      expect(redis.setex).toHaveBeenCalledWith('test-key', 300, JSON.stringify(newData));
    });
  });

  describe('paginateWithCursor', () => {
    it('should paginate results correctly', async () => {
      const mockQuery = {
        findMany: jest.fn().mockResolvedValue([
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' },
          { id: '3', name: 'Item 3' }, // Extra item to check hasMore
        ]),
      };

      const result = await queryOptimizations.paginateWithCursor(
        mockQuery,
        undefined,
        2
      );

      expect(result.items).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('2');
      expect(mockQuery.findMany).toHaveBeenCalledWith({
        take: 3, // limit + 1
      });
    });

    it('should handle cursor pagination', async () => {
      const mockQuery = {
        findMany: jest.fn().mockResolvedValue([
          { id: '4', name: 'Item 4' },
          { id: '5', name: 'Item 5' },
        ]),
      };

      const result = await queryOptimizations.paginateWithCursor(
        mockQuery,
        '3',
        2
      );

      expect(result.items).toHaveLength(2);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBe(null);
      expect(mockQuery.findMany).toHaveBeenCalledWith({
        take: 3,
        skip: 1,
        cursor: { id: '3' },
      });
    });
  });

  describe('batchLoad', () => {
    it('should batch load items efficiently', async () => {
      const items = [
        { id: '1', userId: 'user1' },
        { id: '2', userId: 'user2' },
        { id: '3', userId: 'user1' }, // Duplicate userId
      ];

      const loader = jest.fn().mockResolvedValue(
        new Map([
          ['user1', { name: 'User 1' }],
          ['user2', { name: 'User 2' }],
        ])
      );

      const result = await queryOptimizations.batchLoad(items, 'userId', loader);

      expect(loader).toHaveBeenCalledWith(['user1', 'user2']); // Unique IDs only
      expect(result.get('user1')).toEqual({ name: 'User 1' });
      expect(result.get('user2')).toEqual({ name: 'User 2' });
    });
  });
});