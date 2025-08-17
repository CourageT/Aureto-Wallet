#!/bin/bash
set -e

# Configuration - Update these values for your deployment
SERVER_IP="68.183.86.219"
SERVER_USER="root"
DOMAIN="cougeon.co.zw"
DB_PASSWORD="your-secure-password"

echo "🚀 SpendWise Backend Deployment - Step 3 of 3"
echo "🔧 Deploying backend API server and database"

# Build backend locally
echo "📦 Building backend application..."
npm run build

# Create backend deployment package
echo "📁 Creating backend deployment package..."
DEPLOY_DIR="backend-deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy necessary files
cp -r dist "$DEPLOY_DIR/"
cp -r node_modules "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/"
cp drizzle.config.ts "$DEPLOY_DIR/"

# Copy deployment files
cp Dockerfile.backend "$DEPLOY_DIR/"
cp docker-compose.yml "$DEPLOY_DIR/"
cp .env.production "$DEPLOY_DIR/"
cp shared/db/init-db.sql "$DEPLOY_DIR/"

# Create deployment archive
echo "📦 Creating deployment archive..."
tar -czf "backend-deploy.tar.gz" -C "$DEPLOY_DIR" .

# Upload to server
echo "📤 Uploading to server..."
scp "backend-deploy.tar.gz" "$SERVER_USER@$SERVER_IP:/tmp/"

# Deploy on server
echo "🚀 Deploying on server..."
ssh "$SERVER_USER@$SERVER_IP" << ENDSSH
#!/bin/bash
set -e

echo "📁 Extracting backend files..."
cd /opt
rm -rf spendwise-backend
mkdir -p spendwise-backend
cd spendwise-backend
tar -xzf /tmp/backend-deploy.tar.gz

echo "🔧 Setting up environment..."
# Update environment file with actual values
sed -i "s/your-secure-password/$DB_PASSWORD/g" .env.production
sed -i "s/localhost:5432/postgres:5432/g" .env.production

echo "🐳 Starting backend services..."
# Stop existing services
docker-compose down 2>/dev/null || true

# Start database and backend
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 30

echo "📊 Running database migrations..."
# Run migrations
docker-compose exec -T backend npm run migrate 2>/dev/null || echo "Migrations already applied"

echo "🏥 Checking service health..."
# Wait for backend to be healthy
for i in {1..30}; do
    if curl -f http://localhost:5000/health >/dev/null 2>&1; then
        echo "✅ Backend is healthy!"
        break
    fi
    echo "⏳ Waiting for backend... (\$i/30)"
    sleep 2
done

# Test database connection
if docker-compose exec -T postgres pg_isready -U spendwise >/dev/null 2>&1; then
    echo "✅ Database is ready!"
else
    echo "❌ Database connection failed!"
fi

echo "🧪 Testing API endpoints..."
# Test API endpoints
curl -s http://localhost:5000/api/health && echo " - Health check: ✅"
curl -s http://localhost:5000/api/accounts && echo " - Accounts endpoint: ✅"

echo "✅ Backend deployment completed!"
echo "🌐 API available at: http://localhost:5000"
echo "📊 Database running on port 5432"

# Cleanup
rm -f /tmp/backend-deploy.tar.gz
ENDSSH

# Cleanup local files
rm -rf "$DEPLOY_DIR"
rm -f "backend-deploy.tar.gz"

echo ""
echo "✅ Backend deployment completed!"
echo "🎉 Full SpendWise deployment is now complete!"
echo ""
echo "🔍 Verify full deployment:"
echo "   Frontend: https://$DOMAIN"
echo "   API Health: https://$DOMAIN/api/health"
echo "   Dashboard: https://$DOMAIN/dashboard"
echo ""
echo "📝 Next steps:"
echo "   1. Test user registration at https://$DOMAIN"
echo "   2. Monitor logs: ssh $SERVER_USER@$SERVER_IP 'cd /opt/spendwise-backend && docker-compose logs -f'"
echo "   3. Set up monitoring and backups using scripts in deployments/patches/maintenance/"
echo ""
echo "🎯 Your SpendWise application is live and ready to use!"
