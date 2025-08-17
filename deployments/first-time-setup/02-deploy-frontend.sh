#!/bin/bash
set -e

# Configuration - Update these values for your deployment
SERVER_IP="68.183.86.219"
SERVER_USER="root"
DOMAIN="cougeon.co.zw"
EMAIL="couragengwenya@gmail.com"

echo "🚀 SpendWise Frontend Deployment - Step 2 of 3"
echo "🌐 Deploying frontend to https://$DOMAIN"

# Build frontend locally
echo "📦 Building frontend application..."
npm run build

# Ensure assets have correct permissions
echo "🔧 Fixing asset permissions..."
chmod -R 644 dist/public/*

# Create frontend deployment package
echo "📁 Creating frontend deployment package..."
DEPLOY_DIR="frontend-deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Create nginx configuration for SPA
cat > "$DEPLOY_DIR/nginx-spa.conf" << 'EOF'
server {
    listen       80;
    listen  [::]:80;
    server_name  localhost;
    root   /usr/share/nginx/html;
    index  index.html;

    # Handle SPA routes - serve index.html for all routes that don't match files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
EOF

# Create VIRTUAL_HOST file for nginx-proxy
cat > "$DEPLOY_DIR/vhost-config" << EOF
# API proxy to backend server
location /api/ {
    proxy_pass http://172.17.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_cache_bypass \$http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}

# WebSocket support
location /ws {
    proxy_pass http://172.17.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
}
EOF

# Copy built files
cp -r dist/public/* "$DEPLOY_DIR/"

# Create deployment archive
echo "📦 Creating deployment archive..."
tar -czf "frontend-deploy.tar.gz" -C "$DEPLOY_DIR" .

# Upload to server
echo "📤 Uploading to server..."
scp "frontend-deploy.tar.gz" "$SERVER_USER@$SERVER_IP:/tmp/"

# Deploy on server
echo "🚀 Deploying on server..."
ssh "$SERVER_USER@$SERVER_IP" << ENDSSH
#!/bin/bash
set -e

echo "🐳 Setting up nginx-proxy and SSL..."

# Create nginx-proxy network if it doesn't exist
docker network create nginx-net 2>/dev/null || true

# Start nginx-proxy if not running
if ! docker ps | grep -q nginx-proxy; then
    echo "Starting nginx-proxy..."
    docker run -d \\
        --name nginx-proxy \\
        --network nginx-net \\
        --restart unless-stopped \\
        -p 80:80 \\
        -p 443:443 \\
        -v /var/run/docker.sock:/tmp/docker.sock:ro \\
        -v /etc/nginx/certs:/etc/nginx/certs \\
        -v /etc/nginx/vhost.d:/etc/nginx/vhost.d \\
        -v /usr/share/nginx/html:/usr/share/nginx/html \\
        nginxproxy/nginx-proxy
fi

# Start Let's Encrypt companion if not running
if ! docker ps | grep -q nginx-proxy-acme; then
    echo "Starting Let's Encrypt companion..."
    docker run -d \\
        --name nginx-proxy-acme \\
        --network nginx-net \\
        --restart unless-stopped \\
        -v /var/run/docker.sock:/var/run/docker.sock:ro \\
        -v /etc/nginx/certs:/etc/nginx/certs \\
        -v /etc/nginx/vhost.d:/etc/nginx/vhost.d \\
        -v /usr/share/nginx/html:/usr/share/nginx/html \\
        --volumes-from nginx-proxy \\
        nginxproxy/acme-companion
fi

echo "📁 Extracting frontend files..."
cd /tmp
rm -rf frontend-extracted
mkdir -p frontend-extracted
tar -xzf frontend-deploy.tar.gz -C frontend-extracted

echo "🌐 Deploying frontend container..."
# Stop existing frontend if running
docker stop spendwise-frontend 2>/dev/null || true
docker rm spendwise-frontend 2>/dev/null || true

# Create new frontend container
docker run -d \\
    --name spendwise-frontend \\
    --network nginx-net \\
    --restart unless-stopped \\
    -e VIRTUAL_HOST=$DOMAIN \\
    -e LETSENCRYPT_HOST=$DOMAIN \\
    -e LETSENCRYPT_EMAIL=$EMAIL \\
    nginx:alpine

# Copy files to container
docker cp frontend-extracted/. spendwise-frontend:/usr/share/nginx/html/

# Copy nginx configuration
docker cp frontend-extracted/nginx-spa.conf spendwise-frontend:/etc/nginx/conf.d/default.conf

# Copy vhost configuration for nginx-proxy
cp frontend-extracted/vhost-config /etc/nginx/vhost.d/$DOMAIN

# Restart nginx in container
docker exec spendwise-frontend nginx -s reload

# Restart nginx-proxy to pick up vhost config
docker restart nginx-proxy

echo "⏳ Waiting for SSL certificate generation..."
sleep 30

echo "✅ Frontend deployment completed!"
echo "🌐 Your site should be available at: https://$DOMAIN"
echo "🔒 SSL certificate will be automatically generated"

# Cleanup
rm -f frontend-deploy.tar.gz
rm -rf frontend-extracted
ENDSSH

# Cleanup local files
rm -rf "$DEPLOY_DIR"
rm -f "frontend-deploy.tar.gz"

echo ""
echo "✅ Frontend deployment completed!"
echo "🌐 Website: https://$DOMAIN"
echo "📝 Next steps:"
echo "   1. Wait 2-3 minutes for SSL certificate generation"
echo "   2. Test frontend: curl -I https://$DOMAIN"
echo "   3. Run ./03-deploy-backend.sh to deploy the backend"
echo ""
echo "🔍 Verify deployment:"
echo "   curl -I https://$DOMAIN"
echo "   curl -I https://$DOMAIN/dashboard"
echo "   curl -I https://$DOMAIN/aureto-logo.png"
