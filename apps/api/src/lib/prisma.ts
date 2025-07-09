// Re-export the optimized Prisma client
export { prisma, type DatabaseClient } from './database/client';
export { cache, cacheConfigs, Cacheable, InvalidateCache } from './cache/strategy';
export { queryOptimizations, dbMonitoring } from './database/monitoring';