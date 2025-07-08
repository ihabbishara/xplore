import { Application } from 'express';
import authRoutes from '@/domains/auth/routes';
import userRoutes from '@/domains/users/routes';
import locationRoutes from '@/domains/locations/routes';

export function setupRoutes(app: Application): void {
  // API v1 routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/locations', locationRoutes);
  
  // Profile endpoint is part of auth (convenience)
  app.use('/api/profile', userRoutes);
}