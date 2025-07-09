import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { setupQueryMonitoring } from './monitoring';

// Connection pool configuration for optimal performance
const connectionPoolConfig = {
  // Maximum number of connections in the pool
  connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
  
  // Connection timeout in milliseconds
  connectTimeout: parseInt(process.env.DATABASE_CONNECT_TIMEOUT || '5000'),
  
  // Pool timeout in milliseconds
  poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10000'),
  
  // Idle timeout in milliseconds
  idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '60000'),
  
  // Statement cache size
  statementCacheSize: parseInt(process.env.DATABASE_STATEMENT_CACHE_SIZE || '200'),
};

// Build database URL with connection pool parameters
function buildDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const url = new URL(baseUrl);
  
  // Add connection pool parameters
  url.searchParams.set('connection_limit', connectionPoolConfig.connectionLimit.toString());
  url.searchParams.set('connect_timeout', connectionPoolConfig.connectTimeout.toString());
  url.searchParams.set('pool_timeout', connectionPoolConfig.poolTimeout.toString());
  url.searchParams.set('idle_in_transaction_session_timeout', connectionPoolConfig.idleTimeout.toString());
  url.searchParams.set('statement_cache_size', connectionPoolConfig.statementCacheSize.toString());
  
  // PostgreSQL specific optimizations
  url.searchParams.set('schema', 'public');
  url.searchParams.set('sslmode', process.env.NODE_ENV === 'production' ? 'require' : 'prefer');
  
  return url.toString();
}

// Prisma log configuration
const logConfig = (() => {
  if (process.env.NODE_ENV === 'production') {
    return ['error', 'warn'];
  }
  if (process.env.DEBUG_DATABASE === 'true') {
    return ['query', 'info', 'warn', 'error'];
  }
  return ['warn', 'error'];
})();

// Create optimized Prisma client
class OptimizedPrismaClient extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: buildDatabaseUrl(),
        },
      },
      log: logConfig as any,
      errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
    });

    // Set up query monitoring
    setupQueryMonitoring(this);

    // Handle connection events
    // Note: $on events are not available in current Prisma version
    // TODO: Re-enable when Prisma supports these events
    // this.$on('query', (e) => {
    //   if (process.env.DEBUG_DATABASE === 'true') {
    //     logger.debug('Database query', {
    //       query: e.query,
    //       params: e.params,
    //       duration: e.duration,
    //     });
    //   }
    // });

    // this.$on('error', (e) => {
    //   logger.error('Database error', {
    //     message: e.message,
    //     target: e.target,
    //   });
    // });

    // this.$on('warn', (e) => {
    //   logger.warn('Database warning', {
    //     message: e.message,
    //   });
    // });
  }

  async $connect(): Promise<void> {
    try {
      await super.$connect();
      logger.info('Database connected successfully', {
        connectionLimit: connectionPoolConfig.connectionLimit,
      });
    } catch (error) {
      logger.error('Failed to connect to database', { error });
      throw error;
    }
  }

  async $disconnect(): Promise<void> {
    try {
      await super.$disconnect();
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect from database', { error });
      throw error;
    }
  }

  // Health check method
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> {
    const startTime = Date.now();
    try {
      await this.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Singleton pattern for Prisma client
const globalForPrisma = global as unknown as { prisma: OptimizedPrismaClient };

export const prisma = globalForPrisma.prisma || new OptimizedPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handling
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Export type for use in services
export type DatabaseClient = typeof prisma;