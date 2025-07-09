# DevOps & CI/CD Documentation

## Overview

This document describes the CI/CD pipeline and DevOps infrastructure for the Xplore application.

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Continuous Integration (`ci.yml`)
- **Triggers**: Pull requests and pushes to `main` and `develop` branches
- **Jobs**:
  - **Lint**: Code quality checks
  - **Test**: Unit and integration tests with PostgreSQL and Redis
  - **Build**: Parallel builds for API and Web apps

#### 2. Deployment (`deploy.yml`)
- **Triggers**: 
  - Automatic: Pushes to `main` (production) and `develop` (staging)
  - Manual: Workflow dispatch with environment selection
- **Environments**:
  - **Staging**: Deployed from `develop` branch
  - **Production**: Deployed from `main` branch

#### 3. Security Checks (`security.yml`)
- **Triggers**: Daily schedule and on push/PR
- **Checks**:
  - Dependency vulnerability scanning
  - Code security analysis with CodeQL
  - Docker image vulnerability scanning
  - Secret scanning with TruffleHog

## Infrastructure

### Docker Configuration

#### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service_name]

# Stop services
docker-compose down
```

#### Production
```bash
# Deploy to production
./scripts/deploy.sh production

# Deploy to staging
./scripts/deploy.sh staging
```

### Services

1. **PostgreSQL** (PostGIS enabled)
   - Development: Port 5432
   - Includes spatial data support

2. **Redis**
   - Development: Port 6379
   - Used for caching and sessions

3. **API** (Node.js/Express)
   - Development: Port 3001
   - Production: Behind Nginx proxy

4. **Web** (Next.js)
   - Development: Port 3000
   - Production: Behind Nginx proxy

5. **Nginx** (Production only)
   - Handles SSL termination
   - Rate limiting
   - Caching
   - Load balancing

## Deployment Process

### Prerequisites
1. Install Docker and Docker Compose
2. Set up environment files (`.env.staging`, `.env.production`)
3. Configure cloud provider credentials

### Deployment Steps

1. **Run Tests**
   ```bash
   pnpm test:ci
   ```

2. **Build Docker Images**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

3. **Deploy**
   ```bash
   ./scripts/deploy.sh [staging|production]
   ```

### Health Checks
```bash
# Check service health
./scripts/health-check.sh [development|staging|production]
```

### Database Backup
```bash
# Manual backup
./scripts/backup-db.sh

# Automated backups run daily in production
```

## Environment Variables

### Required Variables

#### API
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing secret
- `JWT_REFRESH_SECRET`: JWT refresh token secret

#### Web
- `NEXT_PUBLIC_API_URL`: API endpoint URL
- `NEXT_PUBLIC_MAPBOX_TOKEN`: Mapbox public token

### External Services
- OpenWeather API
- Mapbox
- Google Places
- SendGrid
- Cloudflare R2
- Sentry
- Mixpanel

## Monitoring

### Application Monitoring
- **Sentry**: Error tracking and performance monitoring
- **Mixpanel**: User analytics

### Infrastructure Monitoring
- **Health Endpoints**:
  - `/health`: Basic health check
  - `/health/db`: Database connectivity
  - `/health/redis`: Redis connectivity

### Logs
- Application logs: Winston logger with structured logging
- Access logs: Nginx access logs
- Error logs: Centralized error logging

## Security

### SSL/TLS
- Certificates managed via Let's Encrypt
- TLS 1.2 and 1.3 only
- Strong cipher suites

### Security Headers
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content-Security-Policy
- Referrer-Policy

### Rate Limiting
- API: 10 requests/second per IP
- Web: 30 requests/second per IP

## Scaling

### Horizontal Scaling
- API and Web services can be scaled horizontally
- Use Docker Swarm or Kubernetes for orchestration

### Database Scaling
- Read replicas for read-heavy workloads
- Connection pooling with PgBouncer

### Caching Strategy
- Redis for session storage
- Nginx caching for static assets
- API response caching

## Troubleshooting

### Common Issues

1. **Container won't start**
   ```bash
   docker-compose logs [service_name]
   ```

2. **Database connection issues**
   ```bash
   docker exec -it xplore_postgres psql -U postgres
   ```

3. **Redis connection issues**
   ```bash
   docker exec -it xplore_redis redis-cli ping
   ```

### Rollback Procedure
1. Keep previous Docker images tagged
2. Update docker-compose.yml with previous image tag
3. Run deployment script

## Best Practices

1. **Always test in staging first**
2. **Create database backups before migrations**
3. **Monitor logs during deployment**
4. **Use health checks to verify deployment**
5. **Keep secrets in environment variables**
6. **Regular security updates**

## CI/CD Pipeline Secrets

Required GitHub secrets:
- `GCP_PROJECT_ID`
- `GCP_SA_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `PRODUCTION_API_URL`
- `STAGING_API_URL`
- `MAPBOX_ACCESS_TOKEN`
- `SNYK_TOKEN`