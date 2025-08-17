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

# Copy necessary files with proper structure
cp -r dist "$DEPLOY_DIR/"
cp -r shared "$DEPLOY_DIR/"
cp -r migrations "$DEPLOY_DIR/"
cp package*.json "$DEPLOY_DIR/"
cp Dockerfile.backend "$DEPLOY_DIR/"
cp docker-compose.yml "$DEPLOY_DIR/"
cp .env.production "$DEPLOY_DIR/.env"
cp init-db.sql "$DEPLOY_DIR/"
cp drizzle.config.ts "$DEPLOY_DIR/"

# Create deployment script for server
cat > "$DEPLOY_DIR/deploy-on-server.sh" << 'EOFINNER'
#!/bin/bash
set -e

echo "🛑 Stopping existing backend services..."
docker compose down || true

echo "📁 Setting up directories..."
mkdir -p logs

echo "🏗️  Building backend image..."
docker compose build backend

echo "🚀 Starting services..."
docker compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Wait for database
echo "📊 Checking database connection..."
for i in {1..30}; do
    if docker compose exec -T postgres pg_isready -U spendwise -d spendwise_production; then
        echo "✅ Database is ready"
        break
    fi
    echo "⏳ Waiting for database... ($i/30)"
    sleep 2
done

# Wait for backend
echo "📊 Checking backend health..."
for i in {1..30}; do
    if curl -f http://localhost:5000/health >/dev/null 2>&1; then
        echo "✅ Backend is ready"
        break
    fi
    echo "⏳ Waiting for backend... ($i/30)"
    sleep 2
done

echo "📊 Service status:"
docker compose ps

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
echo "   Check status: ssh $SERVER_USER@$SERVER_IP 'cd /tmp/spendwise-backend-deploy && docker compose ps'"
echo "   View logs:    ssh $SERVER_USER@$SERVER_IP 'cd /tmp/spendwise-backend-deploy && docker compose logs -f backend'"
echo "   Restart:      ssh $SERVER_USER@$SERVER_IP 'cd /tmp/spendwise-backend-deploy && docker compose restart backend'"
