# SpendWise Backend Deployment Guide

## Overview
Deploy your SpendWise backend with PostgreSQL database using Docker Compose, ensuring data persistence and easy management.

## Prerequisites
- Frontend already deployed and working
- SSH access to your server
- Docker and Docker Compose installed on server

---

## Step 1: Build Backend Locally

```bash
# Navigate to your project directory
cd /Users/***REMOVED***arwe/Downloads/ClaudeCompanion

# Build the backend
npm run build

# Verify build output
ls -la dist/
```

**Expected output:** `dist/index.js` and other build files

---

## Step 2: Create Docker Configuration

### Create Dockerfile for Backend

```bash
cat > Dockerfile.backend << 'EOF'
FROM node:18-alpine

# Install necessary packages for native dependencies
RUN apk add --no-cache python3 make g++

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built application
COPY dist/ ./dist/
COPY shared/ ./shared/
COPY migrations/ ./migrations/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G nodejs -g nodejs nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
EOF
```

### Create Docker Compose Configuration

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: spendwise-postgres
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro
    networks:
      - spendwise-net
    ports:
      - "5432:5432"  # Expose for external access if needed
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # SpendWise Backend
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: spendwise-backend
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      SESSION_SECRET: ${SESSION_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      PRODUCTION_DOMAIN: ${PRODUCTION_DOMAIN}
    volumes:
      - ./logs:/app/logs
    networks:
      - spendwise-net
    ports:
      - "5000:5000"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:5000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  spendwise-net:
    driver: bridge

volumes:
  postgres_data:
    driver: local
EOF
```

### Create Environment File

```bash
cat > .env.production << 'EOF'
# Database Configuration
POSTGRES_DB=spendwise_production
POSTGRES_USER=spendwise
POSTGRES_PASSWORD=your_secure_database_password_here

# Application Configuration
NODE_ENV=production
PORT=5000
SESSION_SECRET=your_very_secure_session_secret_32_chars_minimum

# Google OAuth Configuration
GOOGLE_CLIENT_ID=***REMOVED***
GOOGLE_CLIENT_SECRET=***REMOVED***

# Domain Configuration
PRODUCTION_DOMAIN=https://cougeon.co.zw
EOF
```

### Create Database Initialization Script

```bash
cat > init-db.sql << 'EOF'
-- Create database if it doesn't exist
-- (PostgreSQL automatically creates the database specified in POSTGRES_DB)

-- Create any additional database objects here
-- For example, extensions:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE spendwise_production TO spendwise;
EOF
```

---

## Step 3: Add Health Check Endpoint

Add this to your backend code (`server/routes.ts` or similar):

```typescript
// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

---

## Step 4: Create Deployment Script

```bash
cat > deploy-backend.sh << 'EOF'
#!/bin/bash
set -e

# Configuration
SERVER_IP="68.183.86.219"
SERVER_USER="root"
DEPLOY_DIR="spendwise-backend-$(date +%Y%m%d-%H%M%S)"

echo "🚀 Starting SpendWise Backend Deployment..."

# Step 1: Build locally
echo "📦 Building backend..."
npm run build

# Step 2: Create deployment package
echo "📁 Creating deployment package..."
mkdir -p "$DEPLOY_DIR"

# Copy necessary files
cp -r dist/ "$DEPLOY_DIR/"
cp -r shared/ "$DEPLOY_DIR/"
cp -r migrations/ "$DEPLOY_DIR/"
cp package*.json "$DEPLOY_DIR/"
cp Dockerfile.backend "$DEPLOY_DIR/"
cp docker-compose.yml "$DEPLOY_DIR/"
cp .env.production "$DEPLOY_DIR/.env"
cp init-db.sql "$DEPLOY_DIR/"

# Create deployment script for server
cat > "$DEPLOY_DIR/deploy-on-server.sh" << 'EOFINNER'
#!/bin/bash
set -e

echo "🛑 Stopping existing backend services..."
docker-compose down || true

echo "📁 Setting up directories..."
mkdir -p logs

echo "🏗️  Building backend image..."
docker-compose build backend

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Wait for database
echo "📊 Checking database connection..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U spendwise -d spendwise_production; then
        echo "✅ Database is ready"
        break
    fi
    echo "⏳ Waiting for database... ($i/30)"
    sleep 2
done

# Wait for backend
echo "📊 Checking backend health..."
for i in {1..30}; do
    if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
        echo "✅ Backend is ready"
        break
    fi
    echo "⏳ Waiting for backend... ($i/30)"
    sleep 2
done

echo "📊 Service status:"
docker-compose ps

echo "✅ Backend deployment completed!"
echo "🌐 Backend API available at: http://localhost:5000"
EOFINNER

chmod +x "$DEPLOY_DIR/deploy-on-server.sh"

# Step 3: Create archive
echo "📦 Creating deployment archive..."
tar -czf "spendwise-backend-deploy.tar.gz" -C "$DEPLOY_DIR" .

# Step 4: Upload to server
echo "📤 Uploading to server..."
scp "spendwise-backend-deploy.tar.gz" "$SERVER_USER@$SERVER_IP:/tmp/"

# Step 5: Deploy on server
echo "🚀 Deploying on server..."
ssh "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
cd /tmp
rm -rf spendwise-backend-deploy
mkdir spendwise-backend-deploy
tar -xzf spendwise-backend-deploy.tar.gz -C spendwise-backend-deploy
cd spendwise-backend-deploy
chmod +x deploy-on-server.sh
./deploy-on-server.sh
ENDSSH

# Step 6: Cleanup
echo "🧹 Cleaning up local files..."
rm -rf "$DEPLOY_DIR"
rm "spendwise-backend-deploy.tar.gz"

echo ""
echo "🎉 Backend deployment completed!"
echo "🔗 Test your API: https://cougeon.co.zw/api/health"
echo ""
echo "📋 Server management commands:"
echo "   Check status: ssh $SERVER_USER@$SERVER_IP 'cd /tmp/spendwise-backend-deploy && docker-compose ps'"
echo "   View logs:    ssh $SERVER_USER@$SERVER_IP 'cd /tmp/spendwise-backend-deploy && docker-compose logs -f backend'"
echo "   Restart:      ssh $SERVER_USER@$SERVER_IP 'cd /tmp/spendwise-backend-deploy && docker-compose restart backend'"
EOF

chmod +x deploy-backend.sh
```

---

## Step 5: Update Environment Variables

Edit `.env.production` with your actual values:

```bash
# Update with secure passwords
nano .env.production
```

**⚠️ Important:** 
- Change `POSTGRES_PASSWORD` to a strong password
- Change `SESSION_SECRET` to a secure 32+ character string
- Verify your Google OAuth credentials

---

## Step 6: Deploy Backend

```bash
# Run the deployment script
./deploy-backend.sh
```

---

## Step 7: Run Database Migrations

After deployment, run your database migrations:

```bash
# SSH to server
ssh root@68.183.86.219

# Navigate to deployment directory
cd /tmp/spendwise-backend-deploy

# Run migrations
docker-compose exec backend npm run db:push

# Or if you have a different migration command
docker-compose exec backend npx drizzle-kit push
```

---

## Step 8: Verify Deployment

```bash
# Test health endpoint
curl https://cougeon.co.zw/api/health

# Test from server locally
ssh root@68.183.86.219 'curl http://localhost:5000/api/health'

# Check database connection
ssh root@68.183.86.219 'cd /tmp/spendwise-backend-deploy && docker-compose exec postgres psql -U spendwise -d spendwise_production -c "SELECT version();"'
```

---

## Data Persistence

Your database data is stored in a Docker volume that persists across container restarts:

```bash
# View volume
docker volume ls | grep postgres

# Backup database
docker-compose exec postgres pg_dump -U spendwise spendwise_production > backup.sql

# Restore database (if needed)
docker-compose exec -T postgres psql -U spendwise spendwise_production < backup.sql
```

---

## Managing the Backend

### View Logs
```bash
# Backend logs
docker-compose logs -f backend

# Database logs
docker-compose logs -f postgres

# All logs
docker-compose logs -f
```

### Restart Services
```bash
# Restart backend only
docker-compose restart backend

# Restart database only
docker-compose restart postgres

# Restart all
docker-compose restart
```

### Stop/Start Services
```bash
# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# Stop and remove volumes (⚠️ This will delete data!)
docker-compose down -v
```

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `spendwise_production` |
| `POSTGRES_USER` | Database user | `spendwise` |
| `POSTGRES_PASSWORD` | Database password | `secure_password_123` |
| `SESSION_SECRET` | Session encryption key | `32_char_random_string` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `your_client_id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | `GOCSPX-your_secret` |
| `PRODUCTION_DOMAIN` | Your app domain | `https://cougeon.co.zw` |

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Check if database is ready
docker-compose exec postgres pg_isready -U spendwise

# Restart in correct order
docker-compose down
docker-compose up postgres -d
# Wait for postgres to be ready
docker-compose up backend -d
```

### Database connection issues
```bash
# Test database connection
docker-compose exec postgres psql -U spendwise -d spendwise_production -c "SELECT 1;"

# Check environment variables
docker-compose exec backend env | grep DATABASE_URL
```

### API calls still failing
```bash
# Verify backend is accessible from host
curl http://localhost:5000/api/health

# Check if nginx-proxy is correctly forwarding
docker logs nginx-proxy | grep api
```

---

## File Structure on Server

After deployment:

```
/tmp/spendwise-backend-deploy/
├── docker-compose.yml
├── Dockerfile.backend
├── .env
├── init-db.sql
├── dist/                    # Built backend code
├── shared/                  # Shared schemas
├── migrations/              # Database migrations
├── package.json
└── logs/                    # Application logs
```

---

## Security Notes

1. **Database Password**: Use a strong, unique password
2. **Session Secret**: Generate a cryptographically secure secret
3. **Firewall**: Consider restricting database port (5432) access
4. **Backups**: Set up regular database backups
5. **Logs**: Monitor logs for security issues

---

## Next Steps

After successful backend deployment:

1. **Test all API endpoints**: Verify login, data operations work
2. **Set up monitoring**: Consider adding log aggregation
3. **Configure backups**: Automate database backups
4. **SSL for database**: Consider encrypting database connections
5. **Environment separation**: Use different configs for staging/production

Your SpendWise application should now be fully functional at **https://cougeon.co.zw**!
