# Database Deployment and Maintenance Guide

## Overview
This guide covers the deployment and maintenance of the PostgreSQL database for the Aureto Wallet application using Docker.

## Prerequisites
- Docker installed on server
- Sufficient disk space for database storage
- Regular backup storage location
- Access to server with sudo/root privileges

## Architecture
The database runs as a PostgreSQL container with persistent volume storage and automated backups.

```
Backend Containers → PostgreSQL Container → Persistent Volume Storage
                              ↓
                         Automated Backups
```

## Initial Database Deployment

### 1. Create Database Network
```bash
# Create dedicated database network for security isolation
docker network create spendwise-backend-deploy_spendwise-net
```

### 2. Create Persistent Volume
```bash
# Create directory for database data persistence
mkdir -p /var/lib/docker/volumes/spendwise-postgres-data/_data
mkdir -p /root/database-backups
```

### 3. Deploy PostgreSQL Container
```bash
# Start PostgreSQL container with persistent storage
docker run -d \
  --name spendwise-postgres \
  --network spendwise-backend-deploy_spendwise-net \
  -e POSTGRES_DB=spendwise_production \
  -e POSTGRES_USER=spendwise \
  -e POSTGRES_PASSWORD=your_secure_database_password_here \
  -v spendwise-postgres-data:/var/lib/postgresql/data \
  -p 127.0.0.1:5432:5432 \
  --restart unless-stopped \
  postgres:15-alpine

# Wait for database to start
sleep 30
```

### 4. Verify Database Installation
```bash
# Check container status
docker ps | grep spendwise-postgres

# Test database connection
docker exec spendwise-postgres pg_isready -U spendwise -d spendwise_production

# Connect to database
docker exec -it spendwise-postgres psql -U spendwise -d spendwise_production
```

### 5. Initialize Database Schema
```bash
# Run initial migrations (from backend container)
docker exec spendwise-backend npm run db:migrate

# OR manually run SQL files
docker exec -i spendwise-postgres psql -U spendwise -d spendwise_production < initial-schema.sql
```

## Database Configuration

### Environment Variables
```bash
# Database container environment
POSTGRES_DB=spendwise_production
POSTGRES_USER=spendwise
POSTGRES_PASSWORD=your_secure_database_password_here

# Backend connection string
DATABASE_URL=postgresql://spendwise:your_secure_password@spendwise-postgres:5432/spendwise_production
```

### PostgreSQL Configuration Optimization
```bash
# Create custom PostgreSQL configuration
cat > /tmp/postgresql.conf << 'EOF'
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

# Connection settings
max_connections = 100
listen_addresses = '*'

# Logging
log_statement = 'all'
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Performance
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# Security
ssl = off
password_encryption = scram-sha-256
EOF

# Apply configuration
docker cp /tmp/postgresql.conf spendwise-postgres:/var/lib/postgresql/data/postgresql.conf
docker restart spendwise-postgres
```

## Backup and Recovery

### Automated Daily Backups
```bash
#!/bin/bash
# File: /root/scripts/backup-database.sh

BACKUP_DIR="/root/database-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/spendwise_backup_$DATE.sql"
CONTAINER_NAME="spendwise-postgres"
DB_NAME="spendwise_production"
DB_USER="spendwise"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting database backup at $(date)"

# Create database backup
docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME --no-owner --no-acl | gzip > "${BACKUP_FILE}.gz"

if [ $? -eq 0 ]; then
    echo "✅ Database backup successful: ${BACKUP_FILE}.gz"
    
    # Keep only last 30 days of backups
    find $BACKUP_DIR -name "spendwise_backup_*.sql.gz" -mtime +30 -delete
    
    # Log backup size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo "📊 Backup size: $BACKUP_SIZE"
    
    # Optional: Upload to remote storage
    # rsync -avz "${BACKUP_FILE}.gz" user@backup-server:/backups/
    
else
    echo "❌ Database backup failed!"
    exit 1
fi

echo "Database backup completed at $(date)"
```

### Automated Backup Schedule
```bash
# Add to crontab for daily backups at 2 AM
# crontab -e
# 0 2 * * * /root/scripts/backup-database.sh >> /root/logs/database-backup.log 2>&1

# Create backup log directory
mkdir -p /root/logs

# Make backup script executable
chmod +x /root/scripts/backup-database.sh
```

### Database Restore Procedure
```bash
#!/bin/bash
# File: /root/scripts/restore-database.sh

BACKUP_FILE="$1"
CONTAINER_NAME="spendwise-postgres"
DB_NAME="spendwise_production"
DB_USER="spendwise"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Available backups:"
    ls -la /root/database-backups/spendwise_backup_*.sql.gz
    exit 1
fi

echo "⚠️  WARNING: This will replace the current database!"
echo "Backup file: $BACKUP_FILE"
echo "Database: $DB_NAME"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 1
fi

echo "Starting database restore at $(date)"

# 1. Stop applications that use the database
echo "Stopping backend applications..."
docker stop spendwise-backend

# 2. Create a backup of current database before restore
echo "Creating safety backup of current database..."
SAFETY_BACKUP="/root/database-backups/safety_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME --no-owner --no-acl | gzip > "$SAFETY_BACKUP"
echo "Safety backup created: $SAFETY_BACKUP"

# 3. Drop and recreate database
echo "Recreating database..."
docker exec $CONTAINER_NAME psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker exec $CONTAINER_NAME psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

# 4. Restore from backup
echo "Restoring from backup..."
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME
else
    cat "$BACKUP_FILE" | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME
fi

if [ $? -eq 0 ]; then
    echo "✅ Database restore successful!"
    
    # 5. Restart applications
    echo "Restarting backend applications..."
    docker start spendwise-backend
    
    # 6. Verify restore
    echo "Verifying database..."
    docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "\dt"
    
    echo "Database restore completed at $(date)"
else
    echo "❌ Database restore failed!"
    
    # Restore from safety backup
    echo "Attempting to restore from safety backup..."
    gunzip -c "$SAFETY_BACKUP" | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME
    docker start spendwise-backend
    
    exit 1
fi
```

### Point-in-Time Recovery Setup
```bash
# Enable WAL archiving for point-in-time recovery
cat >> /tmp/postgresql.conf << 'EOF'

# WAL archiving for point-in-time recovery
wal_level = replica
archive_mode = on
archive_command = 'gzip -c %p > /var/lib/postgresql/wal_archive/%f.gz'
max_wal_senders = 3
checkpoint_timeout = 5min
EOF

# Create WAL archive directory
docker exec spendwise-postgres mkdir -p /var/lib/postgresql/wal_archive
docker exec spendwise-postgres chown postgres:postgres /var/lib/postgresql/wal_archive

# Apply configuration
docker cp /tmp/postgresql.conf spendwise-postgres:/var/lib/postgresql/data/postgresql.conf
docker restart spendwise-postgres
```

## Monitoring and Maintenance

### Database Health Monitoring
```bash
#!/bin/bash
# File: /root/scripts/monitor-database.sh

CONTAINER_NAME="spendwise-postgres"
DB_NAME="spendwise_production"
DB_USER="spendwise"
LOG_FILE="/root/logs/database-health.log"

echo "=== Database Health Check $(date) ===" | tee -a $LOG_FILE

# 1. Check container status
echo "Container Status:" | tee -a $LOG_FILE
docker ps | grep $CONTAINER_NAME | tee -a $LOG_FILE

# 2. Check database connectivity
echo "Database Connectivity:" | tee -a $LOG_FILE
if docker exec $CONTAINER_NAME pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
    echo "✅ Database is accepting connections" | tee -a $LOG_FILE
else
    echo "❌ Database connection failed" | tee -a $LOG_FILE
fi

# 3. Check database size
echo "Database Size:" | tee -a $LOG_FILE
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database 
WHERE pg_database.datname = '$DB_NAME';
" | tee -a $LOG_FILE

# 4. Check table sizes
echo "Top 5 Largest Tables:" | tee -a $LOG_FILE
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
LIMIT 5;
" | tee -a $LOG_FILE

# 5. Check active connections
echo "Active Connections:" | tee -a $LOG_FILE
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';
" | tee -a $LOG_FILE

# 6. Check slow queries (if enabled)
echo "Slow Queries (last hour):" | tee -a $LOG_FILE
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements 
WHERE mean_time > 1000 
ORDER BY mean_time DESC 
LIMIT 5;
" 2>/dev/null | tee -a $LOG_FILE || echo "pg_stat_statements not enabled" | tee -a $LOG_FILE

# 7. Check disk usage
echo "Disk Usage:" | tee -a $LOG_FILE
docker exec $CONTAINER_NAME df -h /var/lib/postgresql/data | tee -a $LOG_FILE

# 8. Resource usage
echo "Container Resource Usage:" | tee -a $LOG_FILE
docker stats $CONTAINER_NAME --no-stream | tee -a $LOG_FILE

echo "=== Health Check Complete ===" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE
```

### Automated Monitoring Setup
```bash
# Add to crontab for regular monitoring
# */15 * * * * /root/scripts/monitor-database.sh

# Create monitoring log directory
mkdir -p /root/logs

# Make monitoring script executable
chmod +x /root/scripts/monitor-database.sh
```

### Database Maintenance Tasks
```bash
#!/bin/bash
# File: /root/scripts/maintain-database.sh

CONTAINER_NAME="spendwise-postgres"
DB_NAME="spendwise_production"
DB_USER="spendwise"

echo "Starting database maintenance at $(date)"

# 1. Vacuum and analyze all tables
echo "Running VACUUM ANALYZE..."
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "VACUUM ANALYZE;"

# 2. Reindex database
echo "Reindexing database..."
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "REINDEX DATABASE $DB_NAME;"

# 3. Update table statistics
echo "Updating statistics..."
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "ANALYZE;"

# 4. Check for bloat and suggest actions
echo "Checking for table bloat..."
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

echo "Database maintenance completed at $(date)"

# Schedule weekly maintenance
# Add to crontab: 0 3 * * 0 /root/scripts/maintain-database.sh >> /root/logs/database-maintenance.log 2>&1
```

## Performance Tuning

### Connection Pooling Configuration
```javascript
// Backend connection pool configuration
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Maximum connections in pool
  min: 2,                     // Minimum connections in pool
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout connecting to database
  maxUses: 7500,              // Close connection after 7500 uses
});

// Graceful shutdown
process.on('SIGINT', () => {
  pool.end(() => {
    console.log('Database pool has ended');
    process.exit(0);
  });
});
```

### Index Optimization
```sql
-- Check missing indexes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND correlation < 0.1;

-- Create recommended indexes
CREATE INDEX CONCURRENTLY idx_transactions_user_id ON transactions(user_id);
CREATE INDEX CONCURRENTLY idx_transactions_created_at ON transactions(created_at);
CREATE INDEX CONCURRENTLY idx_wallets_user_id ON wallets(user_id);
```

### Query Performance Analysis
```sql
-- Enable query statistics tracking
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Reset statistics
SELECT pg_stat_statements_reset();
```

## Security Configuration

### User and Permission Management
```sql
-- Create read-only user for reporting
CREATE USER readonly_user WITH PASSWORD 'secure_readonly_password';
GRANT CONNECT ON DATABASE spendwise_production TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

-- Create backup user
CREATE USER backup_user WITH PASSWORD 'secure_backup_password';
GRANT CONNECT ON DATABASE spendwise_production TO backup_user;
GRANT USAGE ON SCHEMA public TO backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;
```

### SSL Configuration (Optional)
```bash
# Generate SSL certificates for database
docker exec spendwise-postgres openssl req -new -x509 -days 365 -nodes -text \
  -out /var/lib/postgresql/data/server.crt \
  -keyout /var/lib/postgresql/data/server.key \
  -subj "/CN=spendwise-postgres"

# Set proper permissions
docker exec spendwise-postgres chown postgres:postgres /var/lib/postgresql/data/server.*
docker exec spendwise-postgres chmod 600 /var/lib/postgresql/data/server.key

# Enable SSL in PostgreSQL
echo "ssl = on" >> /tmp/postgresql.conf
docker cp /tmp/postgresql.conf spendwise-postgres:/var/lib/postgresql/data/postgresql.conf
docker restart spendwise-postgres
```

## Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check container logs
docker logs spendwise-postgres

# Check disk space
df -h

# Check if port is in use
netstat -tulpn | grep 5432

# Remove corrupt data (CAUTION: DATA LOSS)
docker stop spendwise-postgres
docker rm spendwise-postgres
docker volume rm spendwise-postgres-data
# Then redeploy container
```

#### 2. Connection Issues
```bash
# Test from backend container
docker exec spendwise-backend nc -z spendwise-postgres 5432

# Check network connectivity
docker network inspect spendwise-backend-deploy_spendwise-net

# Verify credentials
docker exec spendwise-postgres psql -U spendwise -d spendwise_production -c "SELECT 1;"
```

#### 3. Performance Issues
```sql
-- Check for blocking queries
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
    JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
    JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
        AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
        AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
        AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
        AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
        AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
        AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
        AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
        AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
        AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
        AND blocking_locks.pid != blocked_locks.pid
    JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

#### 4. Storage Issues
```bash
# Check database size
docker exec spendwise-postgres psql -U spendwise -d spendwise_production -c "
SELECT pg_size_pretty(pg_database_size('spendwise_production'));"

# Check volume usage
docker system df -v

# Cleanup old WAL files (if archiving enabled)
docker exec spendwise-postgres find /var/lib/postgresql/wal_archive -name "*.gz" -mtime +7 -delete
```

## Disaster Recovery

### Complete Database Recovery Plan
```bash
#!/bin/bash
# File: /root/scripts/disaster-recovery.sh

echo "=== DISASTER RECOVERY PROCEDURE ==="
echo "This will completely rebuild the database from backups"
echo "Current time: $(date)"

# 1. Stop all applications
echo "Stopping applications..."
docker stop spendwise-backend

# 2. Backup current state (if possible)
echo "Attempting to backup current state..."
docker exec spendwise-postgres pg_dump -U spendwise spendwise_production > /tmp/emergency_backup.sql 2>/dev/null || echo "Could not create emergency backup"

# 3. Remove current database container
echo "Removing current database container..."
docker stop spendwise-postgres
docker rm spendwise-postgres

# 4. Remove corrupted data volume (if necessary)
read -p "Remove data volume? This will delete all current data! (yes/no): " confirm
if [ "$confirm" = "yes" ]; then
    docker volume rm spendwise-postgres-data
fi

# 5. Redeploy database container
echo "Redeploying database container..."
docker run -d \
  --name spendwise-postgres \
  --network spendwise-backend-deploy_spendwise-net \
  -e POSTGRES_DB=spendwise_production \
  -e POSTGRES_USER=spendwise \
  -e POSTGRES_PASSWORD=your_secure_password_here \
  -v spendwise-postgres-data:/var/lib/postgresql/data \
  -p 127.0.0.1:5432:5432 \
  --restart unless-stopped \
  postgres:15-alpine

# 6. Wait for database to start
echo "Waiting for database to start..."
sleep 30

# 7. Find latest backup
LATEST_BACKUP=$(ls -t /root/database-backups/spendwise_backup_*.sql.gz | head -1)
echo "Using backup: $LATEST_BACKUP"

# 8. Restore from backup
echo "Restoring from backup..."
gunzip -c "$LATEST_BACKUP" | docker exec -i spendwise-postgres psql -U spendwise -d spendwise_production

# 9. Verify restoration
echo "Verifying restoration..."
docker exec spendwise-postgres psql -U spendwise -d spendwise_production -c "\dt"

# 10. Restart applications
echo "Restarting applications..."
docker start spendwise-backend

echo "=== DISASTER RECOVERY COMPLETE ==="
echo "Please verify application functionality"
```

---

**Last Updated**: August 17, 2025
**Next Review**: September 17, 2025

## Quick Reference Commands

```bash
# Check database status
docker ps | grep spendwise-postgres

# Connect to database
docker exec -it spendwise-postgres psql -U spendwise -d spendwise_production

# Create backup
docker exec spendwise-postgres pg_dump -U spendwise spendwise_production | gzip > backup.sql.gz

# Check database size
docker exec spendwise-postgres psql -U spendwise -d spendwise_production -c "SELECT pg_size_pretty(pg_database_size('spendwise_production'));"

# Monitor connections
docker exec spendwise-postgres psql -U spendwise -d spendwise_production -c "SELECT count(*) FROM pg_stat_activity;"

# View logs
docker logs spendwise-postgres --tail 20
```
