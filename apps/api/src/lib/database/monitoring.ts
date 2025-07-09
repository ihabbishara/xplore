import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { redis } from '../redis';

interface QueryMetrics {
  model: string;
  action: string;
  duration: number;
  params?: any;
  error?: string;
}

interface PerformanceMetrics {
  slowQueries: number;
  totalQueries: number;
  averageDuration: number;
  errorRate: number;
  queriesByModel: Record<string, number>;
  queriesByAction: Record<string, number>;
}

class DatabaseMonitoring {
  private static instance: DatabaseMonitoring;
  private metrics: PerformanceMetrics = {
    slowQueries: 0,
    totalQueries: 0,
    averageDuration: 0,
    errorRate: 0,
    queriesByModel: {},
    queriesByAction: {},
  };

  private constructor() {}

  static getInstance(): DatabaseMonitoring {
    if (!DatabaseMonitoring.instance) {
      DatabaseMonitoring.instance = new DatabaseMonitoring();
    }
    return DatabaseMonitoring.instance;
  }

  async recordQuery(metric: QueryMetrics): Promise<void> {
    this.metrics.totalQueries++;
    
    // Update average duration
    this.metrics.averageDuration = 
      (this.metrics.averageDuration * (this.metrics.totalQueries - 1) + metric.duration) / 
      this.metrics.totalQueries;

    // Track slow queries (> 100ms)
    if (metric.duration > 100) {
      this.metrics.slowQueries++;
    }

    // Track errors
    if (metric.error) {
      this.metrics.errorRate = 
        (this.metrics.errorRate * (this.metrics.totalQueries - 1) + 1) / 
        this.metrics.totalQueries;
    }

    // Track by model and action
    if (metric.model) {
      this.metrics.queriesByModel[metric.model] = 
        (this.metrics.queriesByModel[metric.model] || 0) + 1;
    }
    
    if (metric.action) {
      this.metrics.queriesByAction[metric.action] = 
        (this.metrics.queriesByAction[metric.action] || 0) + 1;
    }

    // Store in Redis for persistence
    await this.persistMetrics();
  }

  async persistMetrics(): Promise<void> {
    try {
      await redis.setEx(
        'db:performance:metrics',
        3600, // 1 hour TTL
        JSON.stringify(this.metrics)
      );
    } catch (error) {
      logger.error('Failed to persist database metrics', { error });
    }
  }

  async getMetrics(): Promise<PerformanceMetrics> {
    try {
      const cached = await redis.get('db:performance:metrics');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.error('Failed to retrieve database metrics', { error });
    }
    return this.metrics;
  }

  reset(): void {
    this.metrics = {
      slowQueries: 0,
      totalQueries: 0,
      averageDuration: 0,
      errorRate: 0,
      queriesByModel: {},
      queriesByAction: {},
    };
  }
}

export function setupQueryMonitoring(prisma: PrismaClient): void {
  const monitoring = DatabaseMonitoring.getInstance();

  // Middleware to monitor all queries
  prisma.$use(async (params, next) => {
    const startTime = Date.now();
    let error: string | undefined;

    try {
      const result = await next(params);
      return result;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      throw e;
    } finally {
      const duration = Date.now() - startTime;
      
      // Log slow queries
      if (duration > 100) {
        logger.warn('Slow query detected', {
          model: params.model,
          action: params.action,
          duration,
          args: process.env.NODE_ENV === 'development' ? params.args : undefined,
        });
      }

      // Record metrics
      await monitoring.recordQuery({
        model: params.model || 'unknown',
        action: params.action || 'unknown',
        duration,
        params: process.env.NODE_ENV === 'development' ? params.args : undefined,
        error,
      });
    }
  });

  // Log periodic performance reports
  if (process.env.NODE_ENV === 'production') {
    setInterval(async () => {
      const metrics = await monitoring.getMetrics();
      logger.info('Database performance report', {
        ...metrics,
        slowQueryRate: (metrics.slowQueries / metrics.totalQueries) * 100,
      });
      monitoring.reset();
    }, 300000); // Every 5 minutes
  }
}

// Query optimization helpers
export const queryOptimizations = {
  // Batch loading to prevent N+1 queries
  async batchLoad<T, K extends keyof T>(
    items: T[],
    key: K,
    loader: (ids: T[K][]) => Promise<Map<T[K], any>>
  ): Promise<Map<T[K], any>> {
    const ids = items.map(item => item[key]);
    const uniqueIds = [...new Set(ids)];
    return loader(uniqueIds);
  },

  // Query result caching
  async cachedQuery<T>(
    key: string,
    query: () => Promise<T>,
    ttl: number = 300 // 5 minutes default
  ): Promise<T> {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache read failed', { key, error });
    }

    const result = await query();

    try {
      await redis.setEx(key, ttl, JSON.stringify(result));
    } catch (error) {
      logger.warn('Cache write failed', { key, error });
    }

    return result;
  },

  // Pagination helper with cursor
  async paginateWithCursor<T>(
    query: any,
    cursor?: string,
    limit: number = 20
  ): Promise<{
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const items = await query.findMany({
      take: limit + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
    });

    const hasMore = items.length > limit;
    if (hasMore) {
      items.pop();
    }

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    };
  },
};

// Export monitoring instance for external access
export const dbMonitoring = DatabaseMonitoring.getInstance();