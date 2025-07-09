import { Router, Request, Response } from 'express';
import { prisma, dbMonitoring, cache } from '../lib/prisma';
import { redis } from '../lib/redis';
import { logger } from '@/shared/utils/logger';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const checks = await Promise.allSettled([
      prisma.healthCheck(),
      redis.ping(),
    ]);

    const dbHealth = checks[0].status === 'fulfilled' ? checks[0].value : { status: 'unhealthy' };
    const redisHealth = checks[1].status === 'fulfilled' ? { status: 'healthy' } : { status: 'unhealthy' };

    const overall = dbHealth.status === 'healthy' && redisHealth.status === 'healthy' ? 'healthy' : 'unhealthy';

    res.status(overall === 'healthy' ? 200 : 503).json({
      status: overall,
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        redis: redisHealth,
      },
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
    });
  }
});

// Database performance metrics (admin only)
router.get('/metrics/database', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const metrics = await dbMonitoring.getMetrics();
    
    res.json({
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get database metrics', { error });
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

// Cache statistics (admin only)
router.get('/metrics/cache', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const stats = cache.getStats();
    
    res.json({
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get cache stats', { error });
    res.status(500).json({ error: 'Failed to retrieve cache statistics' });
  }
});

// Query performance analysis (admin only)
router.get('/metrics/queries', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Get slow queries from PostgreSQL
    const slowQueries = await prisma.$queryRaw<any[]>`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        min_time,
        max_time
      FROM pg_stat_statements
      WHERE mean_time > 100
      ORDER BY mean_time DESC
      LIMIT 20
    `;

    res.json({
      slowQueries,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get query performance', { error });
    res.status(500).json({ error: 'Failed to retrieve query performance data' });
  }
});

// Index usage statistics (admin only)
router.get('/metrics/indexes', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Get index usage statistics
    const indexUsage = await prisma.$queryRaw<any[]>`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
      LIMIT 50
    `;

    // Get unused indexes
    const unusedIndexes = await prisma.$queryRaw<any[]>`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexrelname,
        idx_scan
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
      AND indexrelname NOT LIKE 'pg_toast%'
      ORDER BY schemaname, tablename
    `;

    res.json({
      indexUsage,
      unusedIndexes,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get index statistics', { error });
    res.status(500).json({ error: 'Failed to retrieve index statistics' });
  }
});

// Table size statistics (admin only)
router.get('/metrics/tables', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const tableStats = await prisma.$queryRaw<any[]>`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
        (SELECT COUNT(*) FROM pg_stat_user_indexes WHERE schemaname = pgt.schemaname AND tablename = pgt.tablename) AS index_count
      FROM pg_tables pgt
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;

    res.json({
      tableStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get table statistics', { error });
    res.status(500).json({ error: 'Failed to retrieve table statistics' });
  }
});

// Clear cache (admin only)
router.post('/cache/clear', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { pattern, tags } = req.body;

    let cleared = 0;

    if (pattern) {
      cleared = await cache.deletePattern(pattern);
    } else if (tags && Array.isArray(tags)) {
      cleared = await cache.invalidateByTags(tags);
    } else {
      // Clear all cache
      await redis.flushdb();
      cleared = -1; // Indicate all cleared
    }

    res.json({
      success: true,
      cleared,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to clear cache', { error });
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Warm cache (admin only)
router.post('/cache/warm', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { targets } = req.body;

    // Import optimization queries
    const { locationQueries, tripQueries } = await import('../lib/database/optimizations');

    const warmupFunctions = [];

    if (!targets || targets.includes('locations')) {
      warmupFunctions.push(() => locationQueries.getPopularLocations());
    }

    if (!targets || targets.includes('trips')) {
      // Warm cache for active trips
      const activeTrips = await prisma.trip.findMany({
        where: { status: { in: ['planned', 'in_progress'] } },
        select: { id: true },
        take: 100,
      });

      activeTrips.forEach(trip => {
        warmupFunctions.push(() => tripQueries.getTripDetails(trip.id));
      });
    }

    await cache.warmCache(warmupFunctions);

    res.json({
      success: true,
      warmedTargets: targets || ['all'],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to warm cache', { error });
    res.status(500).json({ error: 'Failed to warm cache' });
  }
});

export default router;