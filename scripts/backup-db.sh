#!/bin/bash

# Database backup script for Xplore
set -e

# Configuration
BACKUP_DIR="/var/backups/xplore"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="xplore_backup_${TIMESTAMP}"
RETENTION_DAYS=7

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    print_error ".env.production file not found"
    exit 1
fi

# Extract database connection details
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

print_status "Starting database backup for $DB_NAME"

# Perform backup using docker
docker exec xplore_postgres_prod pg_dump \
    -h localhost \
    -U $DB_USER \
    -d $DB_NAME \
    --no-owner \
    --no-acl \
    -f /tmp/${BACKUP_NAME}.sql

# Copy backup from container
docker cp xplore_postgres_prod:/tmp/${BACKUP_NAME}.sql $BACKUP_DIR/

# Compress backup
print_status "Compressing backup..."
gzip $BACKUP_DIR/${BACKUP_NAME}.sql

# Upload to cloud storage (optional)
if [ ! -z "$BACKUP_S3_BUCKET" ]; then
    print_status "Uploading backup to S3..."
    aws s3 cp $BACKUP_DIR/${BACKUP_NAME}.sql.gz s3://$BACKUP_S3_BUCKET/database-backups/
fi

# Clean up old backups
print_status "Cleaning up old backups..."
find $BACKUP_DIR -name "xplore_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Verify backup
BACKUP_SIZE=$(stat -f%z "$BACKUP_DIR/${BACKUP_NAME}.sql.gz" 2>/dev/null || stat -c%s "$BACKUP_DIR/${BACKUP_NAME}.sql.gz")
print_status "Backup completed successfully!"
print_status "Backup file: $BACKUP_DIR/${BACKUP_NAME}.sql.gz"
print_status "Backup size: $(($BACKUP_SIZE / 1024 / 1024)) MB"