import { Application } from 'express';
import authRoutes from '@/domains/auth/routes';
import userRoutes from '@/domains/users/routes';
import locationRoutes from '@/domains/locations/routes';
import tripRoutes from '@/domains/trips/routes/tripRoutes';
import journalRoutes from '@/domains/journal/routes/journalRoutes';
import propertyRoutes from '@/domains/properties/routes/propertyRoutes';
import analyticsRoutes from '@/domains/analytics/routes/analyticsRoutes';

export function setupRoutes(app: Application): void {
  // API v1 routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/locations', locationRoutes);
  app.use('/api/trips', tripRoutes);
  app.use('/api/journal', journalRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/analytics', analyticsRoutes);
  
  // Profile endpoint is part of auth (convenience)
  app.use('/api/profile', userRoutes);
}