# Database Performance Optimization

This document describes the database performance optimization implementation for the Xplore API.

## Overview

The performance optimization includes:
1. **Database Indexes** - Composite and partial indexes for common queries
2. **Query Monitoring** - Real-time tracking of slow queries
3. **Connection Pooling** - Optimized database connections
4. **Caching Strategy** - Redis-based caching with intelligent invalidation
5. **Query Optimizations** - Patterns for efficient data loading

## Components

### 1. Database Client (`/lib/database/client.ts`)
- Optimized Prisma client with connection pooling
- Query monitoring middleware
- Health check functionality
- Graceful shutdown handling

### 2. Query Monitoring (`/lib/database/monitoring.ts`)
- Tracks query performance metrics
- Identifies slow queries (>100ms)
- Provides batch loading utilities
- Implements caching patterns

### 3. Caching Strategy (`/lib/cache/strategy.ts`)
- Multiple cache layers (short, medium, long, daily)
- Tag-based cache invalidation
- Compression for large values
- Cache-aside and write-through patterns
- Decorators for easy integration

### 4. Query Optimizations (`/lib/database/optimizations.ts`)
- Pre-built optimized queries for common operations
- Full-text search with PostgreSQL
- Spatial queries with PostGIS
- Batch loading to prevent N+1 queries
- Transaction patterns for complex operations

## Usage Examples

### Using Optimized Queries
```typescript
import { locationQueries } from '@/lib/database/optimizations';

// Search locations with full-text search
const results = await locationQueries.searchLocations('Paris', 10);

// Get nearby locations
const nearby = await locationQueries.getNearbyLocations(48.8566, 2.3522, 50);
```

### Using Cache Decorators
```typescript
import { Cacheable, InvalidateCache, cacheConfigs } from '@/lib/prisma';

class LocationService {
  @Cacheable(cacheConfigs.medium)
  async getPopularLocations() {
    // This method's results will be cached for 5 minutes
  }

  @InvalidateCache(['locations:popular'])
  async saveLocation(data: any) {
    // This method will invalidate the 'locations:popular' cache
  }
}
```

### Manual Cache Management
```typescript
import { cache, cacheConfigs } from '@/lib/prisma';

// Cache a value
await cache.set('key', value, cacheConfigs.long);

// Get cached value
const cached = await cache.get('key');

// Cache-aside pattern
const data = await cache.cacheAside(
  'expensive-query',
  async () => await expensiveQuery(),
  cacheConfigs.medium
);

// Invalidate by tags
await cache.invalidateByTags(['user:123', 'locations']);
```

## Monitoring Endpoints

### Health Check
```
GET /api/monitoring/health
```

### Database Metrics (Admin Only)
```
GET /api/monitoring/metrics/database
GET /api/monitoring/metrics/cache
GET /api/monitoring/metrics/queries
GET /api/monitoring/metrics/indexes
GET /api/monitoring/metrics/tables
```

### Cache Management (Admin Only)
```
POST /api/monitoring/cache/clear
POST /api/monitoring/cache/warm
```

## Running the Migration

To apply the performance indexes:

```bash
# Using Prisma migrate
pnpm db:migrate

# Or run the script directly
pnpm tsx src/scripts/run-performance-migration.ts
```

## Configuration

Environment variables for performance tuning:

```env
# Database Connection Pool
DATABASE_CONNECTION_LIMIT=10
DATABASE_CONNECT_TIMEOUT=5000
DATABASE_POOL_TIMEOUT=10000
DATABASE_IDLE_TIMEOUT=60000
DATABASE_STATEMENT_CACHE_SIZE=200

# Debug
DEBUG_DATABASE=false
```

## Best Practices

1. **Always use selective queries** - Only select fields you need
2. **Implement pagination** - Never load unlimited results
3. **Use batch loading** - Prevent N+1 queries
4. **Cache strategically** - Cache expensive queries, not everything
5. **Monitor performance** - Check metrics regularly
6. **Index wisely** - Don't over-index, monitor usage

## Performance Gains

Expected improvements:
- **50-80% faster** location searches with full-text indexes
- **90% faster** user saved locations queries with composite indexes
- **60% reduction** in database load with caching
- **Near-instant** popular content serving from cache
- **Reduced memory usage** with selective field loading

## Troubleshooting

### Slow Queries
1. Check `/api/monitoring/metrics/queries` for slow query report
2. Analyze query plan with `EXPLAIN ANALYZE`
3. Add appropriate indexes or optimize query

### High Cache Miss Rate
1. Check `/api/monitoring/metrics/cache` for statistics
2. Adjust cache TTL for frequently accessed data
3. Implement cache warming for critical data

### Database Connection Issues
1. Check connection pool settings
2. Monitor `/api/monitoring/health` endpoint
3. Adjust pool size based on load