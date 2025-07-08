import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { errorHandler } from '@/shared/middleware/errorHandler';
import { notFoundHandler } from '@/shared/middleware/notFoundHandler';
import { setupRoutes } from '@/routes';
import { logger } from '@/shared/utils/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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