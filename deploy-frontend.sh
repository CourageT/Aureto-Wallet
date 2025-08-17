#!/bin/bash

# SpendWise Frontend Deployment Script
# This script builds and deploys the frontend to replace the nginx-hello container

set -e  # Exit on any error

# Configuration
SERVER_IP="68.183.86.219"
SERVER_USER="root"
DOMAIN="cougeon.co.zw"
EMAIL="couragetbarwe@gmail.com"
CONTAINER_NAME="spendwise-frontend"
IMAGE_NAME="spendwise-frontend:latest"
NETWORK_NAME="nginx-net"

echo "🚀 Starting SpendWise Frontend Deployment..."

# Step 1: Build the frontend locally
echo "📦 Building frontend..."
npm run build

# Step 2: Create deployment package
echo "📁 Creating deployment package..."
DEPLOY_DIR="frontend-deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy necessary files with correct structure
cp -r dist "$DEPLOY_DIR/"
cp nginx.conf "$DEPLOY_DIR/"
cp Dockerfile.frontend "$DEPLOY_DIR/Dockerfile"

# Create build script for server
cat > "$DEPLOY_DIR/build-and-deploy.sh" << 'EOF'
#!/bin/bash

# SpendWise Frontend Deployment Script
# This script deploys frontend static files to replace nginx-hello container

set -e  # Exit on any error

# Configuration
SERVER_IP="68.183.86.219"
SERVER_USER="root"
DOMAIN="cougeon.co.zw"
EMAIL="couragetbarwe@gmail.com"
CONTAINER_NAME="spendwise-frontend"
REMOTE_DIR="/srv/spendwise-frontend"

echo "🚀 Starting SpendWise Frontend Deployment..."

# Step 1: Build the frontend locally
echo "📦 Building frontend..."
npm run build

# Step 2: Create deployment package
echo "📁 Creating deployment package..."
DEPLOY_DIR="frontend-deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR/html"
mkdir -p "$DEPLOY_DIR/conf"

# Copy built files to html directory
cp -r dist/public/* "$DEPLOY_DIR/html/"

# Create nginx config for vhost.d (this will be used by nginx-proxy)
cat > "$DEPLOY_DIR/conf/${DOMAIN}" << 'EOF'
# API proxy to backend server
location /api/ {
    proxy_pass http://host.docker.internal:5000;
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

# WebSocket support
location /ws {
    proxy_pass http://host.docker.internal:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_Set_header X-Forwarded-Proto $scheme;
}

# Handle client-side routing (SPA)
location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}

# Static assets with cache headers
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
EOF

# Create deployment script for server
cat > "$DEPLOY_DIR/deploy-on-server.sh" << 'EOF'
#!/bin/bash
set -e

echo "🛑 Stopping existing frontend container..."
docker stop nginx-hello 2>/dev/null || true
docker rm nginx-hello 2>/dev/null || true
docker stop spendwise-frontend 2>/dev/null || true
docker rm spendwise-frontend 2>/dev/null || true

echo "� Setting up directories..."
mkdir -p /srv/spendwise-frontend/html
mkdir -p /srv/spendwise-frontend/conf

echo "📋 Copying files..."
cp -r html/* /srv/spendwise-frontend/html/
cp -r conf/* /srv/nginx/vhost.d/

echo "�🚀 Starting SpendWise frontend container..."
docker run -d 
  --name spendwise-frontend 
  --restart always 
  --network nginx-net 
  -e VIRTUAL_HOST=cougeon.co.zw 
  -e LETSENCRYPT_HOST=cougeon.co.zw 
  -e LETSENCRYPT_EMAIL=couragetbarwe@gmail.com 
  -v /srv/spendwise-frontend/html:/usr/share/nginx/html:ro 
  nginx:alpine

echo "✅ SpendWise frontend deployment completed!"
echo "🌐 Your app should be available at: https://cougeon.co.zw"

# Show container status
echo "📊 Container status:"
docker ps | grep spendwise-frontend || echo "Container not found in running processes"

# Show nginx-proxy status
echo "📊 Nginx-proxy status:"
docker ps | grep nginx-proxy
EOF

chmod +x "$DEPLOY_DIR/deploy-on-server.sh"

# Step 3: Create deployment archive
echo "📦 Creating deployment archive..."
tar -czf "spendwise-frontend-deploy.tar.gz" -C "$DEPLOY_DIR" .

# Step 4: Upload to server
echo "📤 Uploading to server..."
scp "spendwise-frontend-deploy.tar.gz" "$SERVER_USER@$SERVER_IP:/tmp/"

# Step 5: Deploy on server
echo "🚀 Deploying on server..."
ssh "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
cd /tmp
rm -rf spendwise-frontend-deploy
mkdir spendwise-frontend-deploy
tar -xzf spendwise-frontend-deploy.tar.gz -C spendwise-frontend-deploy
cd spendwise-frontend-deploy
chmod +x deploy-on-server.sh
./deploy-on-server.sh
ENDSSH

# Step 6: Cleanup local files
echo "🧹 Cleaning up local deployment files..."
rm -rf "$DEPLOY_DIR"
rm "spendwise-frontend-deploy.tar.gz"

echo ""
echo "🎉 Deployment completed successfully!"
echo "🌐 Your SpendWise app is now live at: https://$DOMAIN"
echo ""
echo "📋 Useful commands for server management:"
echo "   View logs: ssh $SERVER_USER@$SERVER_IP 'docker logs spendwise-frontend'"
echo "   Restart:   ssh $SERVER_USER@$SERVER_IP 'docker restart spendwise-frontend'"
echo "   Status:    ssh $SERVER_USER@$SERVER_IP 'docker ps | grep spendwise'"
echo "   Nginx logs: ssh $SERVER_USER@$SERVER_IP 'docker logs nginx-proxy'"
echo ""
EOF

chmod +x "$DEPLOY_DIR/build-and-deploy.sh"

# Step 3: Create deployment archive
echo "📦 Creating deployment archive..."
tar -czf "spendwise-frontend-deploy.tar.gz" -C "$DEPLOY_DIR" .

# Step 4: Upload to server
echo "📤 Uploading to server..."
scp "spendwise-frontend-deploy.tar.gz" "$SERVER_USER@$SERVER_IP:/tmp/"

# Step 5: Deploy on server
echo "🚀 Deploying on server..."
ssh "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
cd /tmp
rm -rf spendwise-frontend-deploy
mkdir spendwise-frontend-deploy
tar -xzf spendwise-frontend-deploy.tar.gz -C spendwise-frontend-deploy
cd spendwise-frontend-deploy
chmod +x build-and-deploy.sh
./build-and-deploy.sh
ENDSSH

# Step 6: Cleanup local files
echo "🧹 Cleaning up local deployment files..."
rm -rf "$DEPLOY_DIR"
rm "spendwise-frontend-deploy.tar.gz"

echo ""
echo "🎉 Deployment completed successfully!"
echo "🌐 Your SpendWise app is now live at: https://$DOMAIN"
echo ""
echo "📋 Useful commands for server management:"
echo "   View logs: ssh $SERVER_USER@$SERVER_IP 'docker logs spendwise-frontend'"
echo "   Restart:   ssh $SERVER_USER@$SERVER_IP 'docker restart spendwise-frontend'"
echo "   Status:    ssh $SERVER_USER@$SERVER_IP 'docker ps | grep spendwise'"
echo ""
