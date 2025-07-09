import { Application } from 'express';
import authRoutes from '@/domains/auth/routes';
import userRoutes from '@/domains/users/routes';
import locationRoutes from '@/domains/locations/routes';
import tripRoutes from '@/domains/trips/routes/tripRoutes';
import journalRoutes from '@/domains/journal/routes/journalRoutes';
import propertyRoutes from '@/domains/properties/routes/propertyRoutes';
import analyticsRoutes from '@/domains/analytics/routes/analyticsRoutes';
import weatherRoutes from '@/domains/weather/routes/weatherRoutes';
import checklistRoutes from '@/domains/checklists/routes/checklistRoutes';
import monitoringRoutes from '@/routes/monitoring';

export function setupRoutes(app: Application): void {
  // API v1 routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/locations', locationRoutes);
  app.use('/api/trips', tripRoutes);
  app.use('/api/journal', journalRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/weather', weatherRoutes);
  app.use('/api', checklistRoutes); // Checklist and template routes
  
  // Profile endpoint is part of auth (convenience)
  app.use('/api/profile', userRoutes);
  
  // Monitoring and health check routes
  app.use('/api/monitoring', monitoringRoutes);
}