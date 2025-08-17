# Backend Deployment and Maintenance Guide

## Overview
This guide covers the deployment and maintenance of the Aureto Wallet Express.js backend API using Docker and nginx-proxy.

## Prerequisites
- Docker installed on server
- nginx-proxy with acme-companion setup
- PostgreSQL database container running
- Node.js 18+ for building
- Access to server with sudo/root privileges

## Architecture
The backend is deployed as a Node.js Express application in a Docker container, connected to nginx-proxy for routing and SSL.

```
Internet → nginx-proxy → spendwise-backend (Express container) → PostgreSQL
```

## 🔒 Security and Credentials Management

⚠️ **CRITICAL SECURITY NOTICE** ⚠️

**NEVER commit real credentials to version control!** All `.env` files are ignored by Git for security.

### Credential Requirements

1. **Google OAuth Credentials**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create/select a project → "Aureto Wallet"
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Add authorized redirect URIs:
     - `https://aureto.cougeon.co.zw/api/auth/google/callback`
     - `http://localhost:5000/api/auth/google/callback` (for development)

2. **Session Secret Generation**
   ```bash
   # Generate secure session secret
   openssl rand -hex 32
   # OR
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Database Password**
   - Use a strong password (minimum 16 characters)
   - Include uppercase, lowercase, numbers, and special characters
   - Example generator: `openssl rand -base64 24`

### Security Best Practices
- Store all credentials in environment variables only
- Use different credentials for development/production
- Rotate credentials regularly
- Never log or expose credentials in code
- Use HTTPS only for production OAuth callbacks

## Environment Variables

### Required Environment Variables
```bash
# Database Connection
DATABASE_URL=postgresql://username:password@hostname:5432/database_name

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Application
PRODUCTION_DOMAIN=https://aureto.cougeon.co.zw
SESSION_SECRET=your-secure-session-secret-32-chars-minimum
NODE_ENV=production
```

### Production Configuration Template
```bash
DATABASE_URL=postgresql://spendwise:your_secure_database_password_here@spendwise-postgres:5432/spendwise_production
GOOGLE_CLIENT_ID=your-google-oauth-client-id-from-console
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret-from-console
SESSION_SECRET=your-secure-session-secret-32-chars-minimum
PRODUCTION_DOMAIN=https://aureto.cougeon.co.zw
```

## Initial Deployment

### 1. Build the Backend
```bash
# On local machine
npm install
npm run build
```

### 2. Create Docker Image
Using the existing `Dockerfile.backend`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY dist/ ./dist/
COPY src/ ./src/

# Create logs directory
RUN mkdir -p logs && chown node:node logs

# Switch to non-root user
USER node

EXPOSE 5000

CMD ["node", "dist/index.js"]
```

### 3. Build and Deploy
```bash
# Build Docker image
docker build -f Dockerfile.backend -t spendwise-backend-deploy-backend .

# Save and upload image
docker save spendwise-backend-deploy-backend | gzip > spendwise-backend.tar.gz
scp spendwise-backend.tar.gz root@SERVER_IP:/tmp/

# Load image on server
ssh root@SERVER_IP "docker load < /tmp/spendwise-backend.tar.gz"
```

### 4. Deploy Container
```bash
# SSH to server
ssh root@SERVER_IP

# Start new container
docker run -d \
  --name spendwise-backend \
  --network nginx-net \
  -p 5000:5000 \
  -v /tmp/spendwise-backend-deploy/logs:/app/logs:rw \
  -e PRODUCTION_DOMAIN=https://aureto.cougeon.co.zw \
  -e DATABASE_URL='postgresql://spendwise:your_secure_database_password_here@spendwise-postgres:5432/spendwise_production' \
  -e GOOGLE_CLIENT_ID='your-google-oauth-client-id-from-console' \
  -e GOOGLE_CLIENT_SECRET='your-google-oauth-client-secret-from-console' \
  -e SESSION_SECRET='your-secure-session-secret-32-chars-minimum' \
  spendwise-backend-deploy-backend

# Connect to database network
docker network connect spendwise-backend-deploy_spendwise-net spendwise-backend
```

## API Routing Configuration

The backend serves API endpoints under `/api/*` which are proxied by nginx-proxy through the frontend domain.

### nginx-proxy vhost Configuration
Create `/srv/nginx/vhost.d/aureto.cougeon.co.zw`:
```nginx
# API proxy to backend server
location /api/ {
    proxy_pass http://172.17.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}

# WebSocket support for real-time features
location /ws {
    proxy_pass http://172.17.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Health check endpoint
location /api/health {
    proxy_pass http://172.17.0.1:5000;
    proxy_set_header Host $host;
    access_log off;
}
```

### Reload nginx-proxy
```bash
docker exec nginx-proxy nginx -s reload
```

## Database Management

### Connection Setup
The backend connects to PostgreSQL through Docker networking:
```bash
# Database runs in spendwise-backend-deploy_spendwise-net network
# Backend connects to both nginx-net and database network
docker network connect spendwise-backend-deploy_spendwise-net spendwise-backend
```

### Database Migrations
```bash
# Run migrations inside backend container
docker exec spendwise-backend npm run db:migrate

# OR connect to database directly
docker exec -it spendwise-postgres psql -U spendwise -d spendwise_production
```

### Database Health Check
```bash
# Test database connection from backend
docker exec spendwise-backend node -e "
const { Pool } = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL});
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? 'DB Error:' + err : 'DB Connected:' + res.rows[0].now);
  pool.end();
});
"
```

## OAuth Configuration

### Google OAuth Setup
1. **Google Cloud Console Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create/select project
   - Enable Google+ API
   - Create OAuth 2.0 credentials

2. **Authorized Redirect URIs**:
   ```
   https://aureto.cougeon.co.zw/api/auth/google/callback
   http://localhost:5000/api/auth/google/callback
   ```

3. **Environment Variables**:
   ```bash
   GOOGLE_CLIENT_ID=your-actual-client-id
   GOOGLE_CLIENT_SECRET=your-actual-client-secret
   ```

### Testing OAuth Flow
```bash
# Test OAuth login endpoint
curl -I https://aureto.cougeon.co.zw/api/auth/google

# Check OAuth callback
curl -I https://aureto.cougeon.co.zw/api/auth/google/callback
```

## Updates and Maintenance

### Update Procedure
```bash
# 1. Build new version locally
npm run build
docker build -f Dockerfile.backend -t spendwise-backend-deploy-backend .
docker save spendwise-backend-deploy-backend | gzip > spendwise-backend-new.tar.gz

# 2. Upload to server
scp spendwise-backend-new.tar.gz root@SERVER_IP:/tmp/

# 3. Deploy new version
ssh root@SERVER_IP

# Load new image
docker load < /tmp/spendwise-backend-new.tar.gz

# Stop old container
docker stop spendwise-backend

# Start new container (same configuration)
docker run -d \
  --name spendwise-backend-new \
  --network nginx-net \
  -p 5000:5000 \
  -v /tmp/spendwise-backend-deploy/logs:/app/logs:rw \
  -e PRODUCTION_DOMAIN=https://aureto.cougeon.co.zw \
  -e DATABASE_URL='postgresql://spendwise:your_secure_password@spendwise-postgres:5432/spendwise_production' \
  -e GOOGLE_CLIENT_ID='your-google-client-id' \
  -e GOOGLE_CLIENT_SECRET='your-google-client-secret' \
  -e SESSION_SECRET='your-session-secret' \
  spendwise-backend-deploy-backend

# Connect to database network
docker network connect spendwise-backend-deploy_spendwise-net spendwise-backend-new

# Test new container
curl -I https://aureto.cougeon.co.zw/api/health

# If successful, cleanup old container
docker rm spendwise-backend
docker rename spendwise-backend-new spendwise-backend
```

### Rollback Procedure
```bash
# If you kept the old image/container
docker stop spendwise-backend
docker start spendwise-backend-old
docker rename spendwise-backend spendwise-backend-failed
docker rename spendwise-backend-old spendwise-backend
```

## Monitoring and Health Checks

### Health Check Script
```bash
#!/bin/bash
# File: /root/scripts/backend-health.sh

API_URL="https://aureto.cougeon.co.zw/api/health"
LOG_FILE="/root/logs/backend-health.log"
mkdir -p /root/logs

echo "=== Backend Health Check $(date) ===" | tee -a $LOG_FILE

# Check container status
echo "Container Status:" | tee -a $LOG_FILE
docker ps | grep spendwise-backend | tee -a $LOG_FILE

# Check API health
echo "API Health:" | tee -a $LOG_FILE
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" $API_URL)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API OK - HTTP $HTTP_CODE, Response Time: ${RESPONSE_TIME}s" | tee -a $LOG_FILE
else
    echo "❌ API ERROR - HTTP $HTTP_CODE, Response Time: ${RESPONSE_TIME}s" | tee -a $LOG_FILE
    docker logs spendwise-backend --tail 10 | tee -a $LOG_FILE
fi

# Check database connection
echo "Database Connection:" | tee -a $LOG_FILE
docker exec spendwise-backend node -e "
const { Pool } = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL});
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? '❌ DB Error: ' + err.message : '✅ DB Connected');
  pool.end();
});
" 2>&1 | tee -a $LOG_FILE

# Check resource usage
echo "Resource Usage:" | tee -a $LOG_FILE
docker stats spendwise-backend --no-stream | tee -a $LOG_FILE
```

### Automated Monitoring
```bash
#!/bin/bash
# File: /root/scripts/backend-monitor.sh

# Add to crontab: */5 * * * * /root/scripts/backend-monitor.sh

ALERT_EMAIL="your-email@domain.com"
API_URL="https://aureto.cougeon.co.zw/api/health"

check_api() {
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL --max-time 10)
    
    if [ "$HTTP_CODE" != "200" ]; then
        # Send alert
        echo "Backend API is down! HTTP Code: $HTTP_CODE" | mail -s "Aureto Backend Alert" $ALERT_EMAIL
        
        # Attempt restart
        docker restart spendwise-backend
        sleep 30
        
        # Check again
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL --max-time 10)
        if [ "$HTTP_CODE" = "200" ]; then
            echo "Backend automatically recovered after restart" | mail -s "Aureto Backend Recovered" $ALERT_EMAIL
        fi
    fi
}

check_api
```

## Backup and Recovery

### Backend Application Backup
```bash
#!/bin/bash
# File: /root/scripts/backup-backend.sh

BACKUP_DIR="/root/backups/backend-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

echo "Starting backend backup..."

# 1. Backup Docker image
echo "Backing up Docker image..."
docker save spendwise-backend-deploy-backend | gzip > $BACKUP_DIR/backend-image.tar.gz

# 2. Backup container configuration
echo "Backing up container config..."
docker inspect spendwise-backend > $BACKUP_DIR/container-config.json

# 3. Backup application logs
echo "Backing up logs..."
docker cp spendwise-backend:/app/logs $BACKUP_DIR/app-logs

# 4. Backup nginx configuration
echo "Backing up nginx vhost config..."
cp /srv/nginx/vhost.d/aureto.cougeon.co.zw $BACKUP_DIR/nginx-vhost.conf

# 5. Backup environment configuration (template only - no secrets)
echo "Backing up environment template..."
docker exec spendwise-backend env | grep -E "NODE_ENV|PRODUCTION_DOMAIN" > $BACKUP_DIR/env-template.txt

echo "Backend backup completed: $BACKUP_DIR"
```

### Recovery from Backup
```bash
# 1. Load Docker image
docker load < /path/to/backup/backend-image.tar.gz

# 2. Restore nginx configuration
cp /path/to/backup/nginx-vhost.conf /srv/nginx/vhost.d/aureto.cougeon.co.zw
docker exec nginx-proxy nginx -s reload

# 3. Start container with proper configuration
# (Use the container-config.json as reference for environment variables)
docker run -d --name spendwise-backend \
  # ... (use same configuration as deployment)

# 4. Connect to networks
docker network connect nginx-net spendwise-backend
docker network connect spendwise-backend-deploy_spendwise-net spendwise-backend
```

## Performance Optimization

### Node.js Performance
```bash
# Monitor Node.js performance
docker exec spendwise-backend node -e "
setInterval(() => {
  const used = process.memoryUsage();
  console.log('Memory Usage:', {
    rss: Math.round(used.rss / 1024 / 1024) + 'MB',
    heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
    heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB'
  });
}, 5000);
"
```

### Database Query Optimization
```bash
# Enable slow query logging in PostgreSQL
docker exec spendwise-postgres psql -U spendwise -d spendwise_production -c "
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
"

# Monitor slow queries
docker exec spendwise-postgres tail -f /var/lib/postgresql/data/log/postgresql-*.log | grep "duration:"
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Check if database is running
docker ps | grep postgres

# Test connection from backend
docker exec spendwise-backend nc -z spendwise-postgres 5432

# Check network connectivity
docker network inspect spendwise-backend-deploy_spendwise-net
```

#### 2. OAuth Callback Errors
```bash
# Check OAuth configuration
docker exec spendwise-backend env | grep GOOGLE

# Verify redirect URI in Google Console matches:
# https://aureto.cougeon.co.zw/api/auth/google/callback

# Test OAuth endpoints
curl -I https://aureto.cougeon.co.zw/api/auth/google
```

#### 3. API Routing Issues
```bash
# Check nginx-proxy configuration
cat /srv/nginx/vhost.d/aureto.cougeon.co.zw

# Test direct backend connection
curl -I http://127.0.0.1:5000/api/health

# Check nginx-proxy logs
docker logs nginx-proxy | grep aureto
```

#### 4. Memory Issues
```bash
# Check memory usage
docker stats spendwise-backend

# Restart if memory usage is high
docker restart spendwise-backend

# Add memory limits to container
docker update --memory=1g spendwise-backend
```

### Debug Commands
```bash
# View application logs
docker logs spendwise-backend --tail 50

# Execute commands in container
docker exec -it spendwise-backend sh

# Check process status
docker exec spendwise-backend ps aux

# Test database connection
docker exec spendwise-backend npm run db:test

# Check environment variables (without exposing secrets)
docker exec spendwise-backend env | grep -v -E "(SECRET|PASSWORD|CLIENT_SECRET)"
```

## Security Hardening

### Container Security
```bash
# Run with security options
docker run -d \
  --name spendwise-backend \
  --security-opt=no-new-privileges \
  --cap-drop=ALL \
  --cap-add=NET_BIND_SERVICE \
  --read-only \
  --tmpfs /tmp \
  --tmpfs /app/logs \
  # ... other options
```

### Application Security
```javascript
// Rate limiting configuration
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// CORS configuration
const cors = require('cors');
app.use(cors({
  origin: process.env.PRODUCTION_DOMAIN,
  credentials: true
}));
```

---

**Last Updated**: August 17, 2025
**Next Review**: September 17, 2025

## Quick Reference Commands

```bash
# Check status
docker ps | grep spendwise-backend

# View logs  
docker logs spendwise-backend --tail 20

# Restart backend
docker restart spendwise-backend

# Test API health
curl -I https://aureto.cougeon.co.zw/api/health

# Check database connection
docker exec spendwise-backend npm run db:test

# Monitor resources
docker stats spendwise-backend --no-stream
```
