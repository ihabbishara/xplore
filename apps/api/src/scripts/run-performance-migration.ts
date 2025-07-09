import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { logger } from '@/shared/utils/logger';
import fs from 'fs/promises';
import path from 'path';

async function runPerformanceMigration() {
  logger.info('Starting database performance optimization migration...');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      '../../prisma/migrations/20250709_add_performance_indexes/migration.sql'
    );
    
    const migrationSql = await fs.readFile(migrationPath, 'utf-8');
    
    // Split SQL statements by semicolon and filter out empty statements
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    logger.info(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        logger.info(`Executing statement ${i + 1}/${statements.length}...`);
        await prisma.$executeRawUnsafe(statement);
        logger.info(`✓ Statement ${i + 1} completed successfully`);
      } catch (error: any) {
        // Ignore "already exists" errors for indexes
        if (error.message && error.message.includes('already exists')) {
          logger.warn(`⚠ Statement ${i + 1} skipped: Index already exists`);
        } else {
          logger.error(`✗ Statement ${i + 1} failed:`, error.message);
          throw error;
        }
      }
    }

    // Run ANALYZE to update statistics
    logger.info('Running ANALYZE to update database statistics...');
    await prisma.$executeRawUnsafe('ANALYZE');

    logger.info('✅ Database performance optimization migration completed successfully!');

    // Display current index statistics
    const indexCount = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `;

    logger.info(`Total indexes in database: ${indexCount[0].count}`);

  } catch (error) {
    logger.error('Failed to run performance migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runPerformanceMigration();