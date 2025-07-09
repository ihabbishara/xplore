import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { errorHandler } from '@/shared/middleware/errorHandler';
import { notFoundHandler } from '@/shared/middleware/notFoundHandler';
import { setupSecurityMiddleware } from '@/middleware/security';
import { setupRoutes } from '@/routes';
import { logger } from '@/shared/utils/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { getSecurityConfig } from '@/config/security';

const app = express();
const httpServer = createServer(app);
const config = getSecurityConfig();

const io = new Server(httpServer, {
  cors: config.cors,
});

// Cookie parser (needed for CSRF)
app.use(cookieParser());

// Security middleware (must be early)
setupSecurityMiddleware(app);

// Body parsing middleware (after security)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Other middleware
app.use(compression());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'error', error: 'Database connection failed' });
  }
});

// Redis health check
app.get('/health/redis', async (req, res) => {
  try {
    await redis.ping();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'error', error: 'Redis connection failed' });
  }
});

// Routes
setupRoutes(app);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Socket.io setup
io.on('connection', (socket) => {
  logger.info('New socket connection:', socket.id);
  
  socket.on('disconnect', () => {
    logger.info('Socket disconnected:', socket.id);
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Starting graceful shutdown...');
  
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });
  
  await prisma.$disconnect();
  await redis.disconnect();
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});