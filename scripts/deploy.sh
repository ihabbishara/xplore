#!/bin/bash

# Deploy script for Xplore application
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if environment is provided
if [ -z "$1" ]; then
    print_error "Please provide environment: staging or production"
    echo "Usage: ./scripts/deploy.sh [staging|production]"
    exit 1
fi

ENVIRONMENT=$1

# Validate environment
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    print_error "Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

print_status "Starting deployment to $ENVIRONMENT environment"

# Check if required tools are installed
command -v docker >/dev/null 2>&1 || { print_error "Docker is required but not installed. Aborting."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { print_error "Docker Compose is required but not installed. Aborting."; exit 1; }

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    print_status "Loading environment variables from .env.$ENVIRONMENT"
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
else
    print_error ".env.$ENVIRONMENT file not found"
    exit 1
fi

# Run tests before deployment
print_status "Running tests..."
pnpm test:ci || { print_error "Tests failed. Aborting deployment."; exit 1; }

# Build Docker images
print_status "Building Docker images..."
docker-compose -f docker-compose.prod.yml build

# Database backup (for production only)
if [ "$ENVIRONMENT" == "production" ]; then
    print_status "Creating database backup..."
    ./scripts/backup-db.sh
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# Start new containers
print_status "Starting new containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Health check
print_status "Running health checks..."
./scripts/health-check.sh $ENVIRONMENT

# Clean up old images
print_status "Cleaning up old Docker images..."
docker image prune -f

print_status "Deployment to $ENVIRONMENT completed successfully!"

# Send deployment notification
if [ "$ENVIRONMENT" == "production" ]; then
    # You can add Slack/Discord/Email notification here
    print_status "Sending deployment notification..."
fi