#!/bin/bash

# Aureto Wallet - Production Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Aureto Wallet Production Deployment"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found!"
    echo -e "${YELLOW}Please copy env.production.template to .env and configure your values.${NC}"
    exit 1
fi

# Check if required environment variables are set
echo "🔍 Checking environment variables..."
required_vars=("POSTGRES_PASSWORD" "SESSION_SECRET" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env || grep -q "^${var}=your_" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing or incomplete environment variables:${NC}"
    for var in "${missing_vars[@]}"; do
        echo -e "${YELLOW}  - $var${NC}"
    done
    echo -e "${YELLOW}Please update your .env file with actual values.${NC}"
    exit 1
fi

# Check if SSL certificates exist
if [ ! -d "./ssl" ]; then
    echo -e "${YELLOW}⚠️  SSL directory not found. Creating directory...${NC}"
    mkdir -p ./ssl
    echo -e "${YELLOW}Please add your SSL certificates to ./ssl/ directory:${NC}"
    echo -e "${YELLOW}  - fullchain.pem${NC}"
    echo -e "${YELLOW}  - privkey.pem${NC}"
    echo -e "${YELLOW}Or run: sudo certbot certonly --standalone -d cougeon.co.zw${NC}"
fi

if [ ! -f "./ssl/fullchain.pem" ] || [ ! -f "./ssl/privkey.pem" ]; then
    echo -e "${RED}❌ SSL certificates not found in ./ssl/ directory${NC}"
    echo -e "${YELLOW}Please add fullchain.pem and privkey.pem to ./ssl/ directory${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment configuration looks good!${NC}"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Pull latest images
echo "📥 Pulling latest images..."
docker-compose pull

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec -T backend npm run db:push || echo "⚠️  Migration failed - database might not be ready yet"

# Check service health
echo "🏥 Checking service health..."
sleep 5

# Function to check service health
check_service() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service is healthy${NC}"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts: Waiting for $service..."
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ $service failed to start${NC}"
    return 1
}

# Check backend health
check_service "Backend API" "http://localhost:3001/health" || {
    echo -e "${RED}Backend logs:${NC}"
    docker-compose logs backend
    exit 1
}

# Check frontend health
check_service "Frontend" "http://localhost:80" || {
    echo -e "${RED}Frontend logs:${NC}"
    docker-compose logs frontend
    exit 1
}

# Display final status
echo ""
echo "🎉 Deployment completed successfully!"
echo "========================================="
echo -e "${GREEN}✅ Application is running at: https://cougeon.co.zw${NC}"
echo -e "${GREEN}✅ Health check: https://cougeon.co.zw/health${NC}"
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "📝 Next steps:"
echo "1. Test the application: https://cougeon.co.zw"
echo "2. Test Google OAuth login"
echo "3. Monitor logs: docker-compose logs -f"
echo "4. Set up automated backups"
echo ""
echo "🔧 Management commands:"
echo "  View logs: docker-compose logs -f [service]"
echo "  Restart: docker-compose restart [service]"
echo "  Update: git pull && ./deploy.sh"
echo "  Backup DB: docker-compose exec database pg_dump -U postgres aureto_wallet > backup.sql"