# Xplore - Local Development Setup Guide

This guide will walk you through setting up and running the Xplore application locally for testing and development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **pnpm** (v8.0.0 or higher)
- **Docker** and **Docker Compose**
- **Git**
- **PostgreSQL client** (optional, for database access)

## Quick Start

For those who want to get up and running quickly:

```bash
# Clone the repository
git clone <repository-url>
cd xplore

# Install dependencies
pnpm install

# Start services with Docker
docker-compose up -d

# Run database migrations
cd apps/api
npx prisma migrate deploy
npx prisma db seed

# Start development servers
cd ../..
pnpm dev
```

## Detailed Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd xplore
```

### 2. Environment Configuration

#### Backend API (.env)

Create `.env` file in `apps/api/`:

```bash
cd apps/api
cp .env.example .env
```

Edit `apps/api/.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/xplore_dev"
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"

# External APIs
MAPBOX_ACCESS_TOKEN="<your-mapbox-token>"  # Get from https://mapbox.com
GOOGLE_PLACES_API_KEY=""  # Optional

# Email (for email verification)
SENDGRID_API_KEY=""  # Optional for now
FROM_EMAIL="noreply@xplore.app"

# File Storage
CLOUDFLARE_R2_BUCKET=""  # Optional for now
CLOUDFLARE_R2_ACCESS_KEY=""
CLOUDFLARE_R2_SECRET_KEY=""

# App Configuration
NODE_ENV="development"
PORT="3001"
FRONTEND_URL="http://localhost:3000"
```

#### Frontend Web App (.env.local)

Create `.env.local` file in `apps/web/`:

```bash
cd ../web
cp .env.example .env.local
```

Edit `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_MAPBOX_TOKEN="<your-mapbox-token>"  # Same as backend
```

### 3. Docker Setup for Services

Create `docker-compose.yml` in the root directory:

```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    container_name: xplore_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: xplore_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: xplore_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Optional: Adminer for database management
  adminer:
    image: adminer
    container_name: xplore_adminer
    ports:
      - "8080:8080"
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:
```

Start the services:

```bash
# Start all services
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v
```

### 4. Install Dependencies

```bash
# From root directory
pnpm install
```

### 5. Database Setup

```bash
cd apps/api

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed the database with test data
npx prisma db seed

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 6. Build Shared Packages

```bash
# From root directory
cd packages/shared
pnpm build
cd ../..
```

### 7. Start Development Servers

Open multiple terminal windows/tabs:

**Terminal 1 - Backend API:**
```bash
cd apps/api
pnpm dev
# API will run on http://localhost:3001
```

**Terminal 2 - Frontend Web:**
```bash
cd apps/web
pnpm dev
# Web app will run on http://localhost:3000
```

**Or run all at once from root:**
```bash
pnpm dev
```

## Testing the Application

### 1. Test User Registration

1. Open http://localhost:3000 in your browser
2. Click "Get Started" or navigate to `/auth/register`
3. Create a new account with:
   - Email: `test@example.com`
   - Password: `Test123!@#`
4. You should be redirected to the dashboard

### 2. Test Location Search

1. Navigate to http://localhost:3000/locations
2. In the search bar, try searching for:
   - "Paris"
   - "New York"
   - "Tokyo"
3. Click on a location to see details
4. Click the heart icon to save a location

### 3. Test Wishlist Management

1. Save multiple locations
2. View your saved locations on the locations page
3. Try:
   - Adding personal notes
   - Adding tags
   - Rating locations (1-5 stars)
   - Marking as favorite

### 4. API Testing with cURL

**Get authentication token:**
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

**Search locations:**
```bash
curl -X GET "http://localhost:3001/api/locations/search?q=Paris&limit=5" \
  -H "Accept: application/json"
```

**Save a location (requires auth token):**
```bash
curl -X POST http://localhost:3001/api/locations/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "placeId": "place.12345",
    "name": "Paris",
    "country": "France",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "placeType": "city"
  }'
```

## Common Issues & Solutions

### 1. Database Connection Error

**Error:** `Can't reach database server at localhost:5432`

**Solution:**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Check PostgreSQL logs
docker-compose logs postgres
```

### 2. Redis Connection Error

**Error:** `Redis connection failed`

**Solution:**
```bash
# Check if Redis is running
docker-compose ps

# Test Redis connection
docker exec -it xplore_redis redis-cli ping
# Should return "PONG"
```

### 3. Mapbox API Issues

**Error:** `Mapbox API token not configured`

**Solution:**
1. Sign up at https://mapbox.com
2. Create a new access token
3. Add token to both backend and frontend .env files
4. Restart the development servers

### 4. Port Already in Use

**Error:** `Port 3000/3001/5432 already in use`

**Solution:**
```bash
# Find process using port (macOS/Linux)
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change ports in .env files
```

### 5. Package Installation Issues

**Error:** `pnpm install` fails

**Solution:**
```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules and lockfile
rm -rf node_modules pnpm-lock.yaml
rm -rf apps/*/node_modules packages/*/node_modules

# Reinstall
pnpm install
```

## Database Management

### View Database with Adminer

1. Open http://localhost:8080
2. Login with:
   - System: PostgreSQL
   - Server: postgres
   - Username: postgres
   - Password: postgres
   - Database: xplore_dev

### Direct PostgreSQL Access

```bash
# Connect to PostgreSQL
docker exec -it xplore_postgres psql -U postgres -d xplore_dev

# Useful commands:
\dt                     # List tables
\d+ users              # Describe users table
SELECT * FROM users;   # Query users
\q                     # Quit
```

### Reset Database

```bash
cd apps/api

# Drop all tables and re-run migrations
npx prisma migrate reset

# This will:
# 1. Drop the database
# 2. Create a new database
# 3. Run all migrations
# 4. Run seed script (if configured)
```

## Monitoring & Debugging

### View Application Logs

```bash
# Backend logs
cd apps/api
pnpm dev

# Frontend logs
cd apps/web
pnpm dev

# Docker service logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Debug Frontend

1. Open Chrome DevTools (F12)
2. Check Console for errors
3. Check Network tab for API calls
4. Redux DevTools Extension for state debugging

### Debug Backend

1. Check terminal output for errors
2. Use Prisma Studio to inspect database:
   ```bash
   cd apps/api
   npx prisma studio
   ```
3. Check Redis cache:
   ```bash
   docker exec -it xplore_redis redis-cli
   > KEYS *
   > GET "location:search:Paris:country,region,place:10"
   ```

## Next Steps

Once you have the application running locally:

1. **Explore Features:**
   - User registration and authentication
   - Location search and discovery
   - Wishlist management
   - User profile settings

2. **Development:**
   - Make code changes and see hot-reload
   - Run tests: `pnpm test`
   - Check types: `pnpm type-check`
   - Lint code: `pnpm lint`

3. **Production Build:**
   ```bash
   # Build all packages
   pnpm build
   
   # Test production build locally
   cd apps/api
   pnpm start
   
   cd ../web
   pnpm start
   ```

## Support

If you encounter any issues not covered in this guide:

1. Check the project's GitHub issues
2. Review the error logs carefully
3. Ensure all prerequisites are properly installed
4. Try the "Reset Everything" approach below

### Reset Everything (Nuclear Option)

```bash
# Stop all services
docker-compose down -v

# Clean all node_modules
rm -rf node_modules pnpm-lock.yaml
rm -rf apps/*/node_modules packages/*/node_modules

# Clean build artifacts
rm -rf apps/*/dist packages/*/dist
rm -rf apps/web/.next

# Start fresh
pnpm install
docker-compose up -d
cd apps/api
npx prisma migrate deploy
cd ../..
pnpm dev
```

Happy coding! 🚀