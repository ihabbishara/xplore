#!/bin/bash

# Xplore Local Setup Script
# This script sets up the local development environment

set -e  # Exit on error

echo "🚀 Setting up Xplore local development environment..."

# Check prerequisites
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install $1 first."
        exit 1
    fi
}

echo "📋 Checking prerequisites..."
check_command node
check_command pnpm
check_command docker
check_command docker-compose

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ All prerequisites met!"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if PostgreSQL is ready
until docker exec xplore_postgres pg_isready -U postgres; do
    echo "Waiting for PostgreSQL to be ready..."
    sleep 2
done

# Check if Redis is ready
until docker exec xplore_redis redis-cli ping | grep -q PONG; do
    echo "Waiting for Redis to be ready..."
    sleep 2
done

echo "✅ Services are ready!"

# Build shared packages
echo "🔨 Building shared packages..."
cd packages/shared
pnpm build
cd ../..

# Setup database
echo "🗄️  Setting up database..."
cd apps/api
npx prisma generate
npx prisma migrate deploy

# Ask if user wants to seed the database
read -p "Do you want to seed the database with test data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma db seed
fi

cd ../..

# Check for environment files
echo "🔐 Checking environment configuration..."

if [ ! -f "apps/api/.env" ]; then
    echo "⚠️  Backend .env file not found. Creating from example..."
    cp apps/api/.env.example apps/api/.env
    echo "📝 Please update apps/api/.env with your configuration (especially Mapbox token)"
fi

if [ ! -f "apps/web/.env.local" ]; then
    echo "⚠️  Frontend .env.local file not found. Creating from example..."
    cp apps/web/.env.example apps/web/.env.local
    echo "📝 Please update apps/web/.env.local with your configuration (especially Mapbox token)"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update environment files with your API keys (especially Mapbox)"
echo "2. Run 'pnpm dev' to start the development servers"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "🔧 Useful commands:"
echo "  pnpm dev          - Start all development servers"
echo "  pnpm build        - Build all packages"
echo "  pnpm test         - Run tests"
echo "  docker-compose ps - Check Docker services status"
echo ""
echo "Happy coding! 🎉"