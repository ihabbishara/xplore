#!/bin/bash

# Health check script for Xplore services
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

# Get environment
ENVIRONMENT=${1:-"development"}

# Set URLs based on environment
if [ "$ENVIRONMENT" == "production" ]; then
    API_URL="https://api.xplore.app"
    WEB_URL="https://xplore.app"
elif [ "$ENVIRONMENT" == "staging" ]; then
    API_URL="https://staging-api.xplore.app"
    WEB_URL="https://staging.xplore.app"
else
    API_URL="http://localhost:3001"
    WEB_URL="http://localhost:3000"
fi

echo "Running health checks for $ENVIRONMENT environment..."
echo "----------------------------------------"

# Check API health
echo -n "Checking API health... "
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ "$API_RESPONSE" == "200" ]; then
    print_success "API is healthy"
else
    print_error "API is not responding (HTTP $API_RESPONSE)"
    exit 1
fi

# Check database connection
echo -n "Checking database connection... "
DB_RESPONSE=$(curl -s $API_URL/health/db | jq -r '.status' 2>/dev/null || echo "error")
if [ "$DB_RESPONSE" == "ok" ]; then
    print_success "Database connection is healthy"
else
    print_error "Database connection failed"
    exit 1
fi

# Check Redis connection
echo -n "Checking Redis connection... "
REDIS_RESPONSE=$(curl -s $API_URL/health/redis | jq -r '.status' 2>/dev/null || echo "error")
if [ "$REDIS_RESPONSE" == "ok" ]; then
    print_success "Redis connection is healthy"
else
    print_error "Redis connection failed"
    exit 1
fi

# Check web app
echo -n "Checking web application... "
WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $WEB_URL)
if [ "$WEB_RESPONSE" == "200" ]; then
    print_success "Web application is healthy"
else
    print_error "Web application is not responding (HTTP $WEB_RESPONSE)"
    exit 1
fi

# Check critical API endpoints
echo -n "Checking authentication endpoint... "
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/api/auth/health)
if [ "$AUTH_RESPONSE" == "200" ]; then
    print_success "Authentication service is healthy"
else
    print_warning "Authentication service returned HTTP $AUTH_RESPONSE"
fi

# Check WebSocket connection (if in development)
if [ "$ENVIRONMENT" == "development" ]; then
    echo -n "Checking WebSocket connection... "
    # Simple check - in production you'd want a more robust test
    WS_CHECK=$(curl -s $API_URL/socket.io/?EIO=4&transport=polling | grep -c "0" || echo "0")
    if [ "$WS_CHECK" != "0" ]; then
        print_success "WebSocket service is healthy"
    else
        print_warning "WebSocket service might not be running"
    fi
fi

echo "----------------------------------------"
echo "Health check completed successfully!"