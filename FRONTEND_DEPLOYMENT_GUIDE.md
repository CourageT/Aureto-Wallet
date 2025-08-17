# SpendWise Frontend Deployment Guide

## Overview
This guide will help you deploy your SpendWise React frontend to your server using nginx-proxy with automatic SSL certificates.

## Prerequisites
- Server with Docker installed (Ubuntu/Linux)
- Domain pointing to your server IP
- SSH access to your server
- Node.js and npm installed locally

---

## Step 1: Build Frontend Locally

```bash
# Navigate to your project directory
cd /path/to/SpendWise

# Install dependencies (if not already done)
npm install

# Build the frontend for production
npm run build
```

**Expected output:** Built files will be in `dist/public/` directory

---

## Step 2: Prepare Deployment Files

Create the deployment structure:

```bash
# Create deployment directory
mkdir spendwise-deploy
cd spendwise-deploy

# Create subdirectories
mkdir html conf

# Copy built frontend files
cp -r ../dist/public/* html/

# Create nginx configuration for API proxy
cat > conf/YOURDOMAIN.COM << 'EOF'
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

# WebSocket support
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
EOF

# Replace YOURDOMAIN.COM with your actual domain
mv conf/YOURDOMAIN.COM conf/yourdomain.com
```

**⚠️ Important:** Replace `YOURDOMAIN.COM` and `yourdomain.com` with your actual domain name.

---

## Step 3: Upload to Server

```bash
# Create deployment archive
tar -czf spendwise-frontend.tar.gz html conf

# Upload to server (replace with your server details)
scp spendwise-frontend.tar.gz root@YOUR_SERVER_IP:/tmp/

# Clean up local files
rm spendwise-frontend.tar.gz
cd ..
rm -rf spendwise-deploy
```

---

## Step 4: Set Up nginx-proxy Infrastructure (One-time setup)

SSH to your server and run these commands **only once**:

```bash
# SSH to your server
ssh root@YOUR_SERVER_IP

# Create Docker network
docker network create nginx-net || echo "Network already exists"

# Start nginx-proxy (handles routing and SSL)
docker run -d \
  --name nginx-proxy \
  --restart always \
  --network nginx-net \
  --label com.github.nginx-proxy.nginx-proxy=true \
  -p 80:80 -p 443:443 \
  -v /srv/nginx/certs:/etc/nginx/certs \
  -v /srv/nginx/vhost.d:/etc/nginx/vhost.d \
  -v /srv/nginx/html:/usr/share/nginx/html \
  -v /var/run/docker.sock:/tmp/docker.sock:ro \
  nginxproxy/nginx-proxy

# Start Let's Encrypt companion (automatic SSL certificates)
docker run -d \
  --name nginx-proxy-acme \
  --restart always \
  --network nginx-net \
  -v /srv/nginx/certs:/etc/nginx/certs \
  -v /srv/nginx/vhost.d:/etc/nginx/vhost.d \
  -v /srv/nginx/html:/usr/share/nginx/html \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e DEFAULT_EMAIL=your-email@example.com \
  -e NGINX_PROXY_CONTAINER=nginx-proxy \
  nginxproxy/acme-companion
```

**⚠️ Replace `your-email@example.com` with your actual email address.**

---

## Step 5: Deploy Frontend

```bash
# Extract uploaded files
cd /tmp
tar -xzf spendwise-frontend.tar.gz

# Stop any existing frontend container
docker stop spendwise-frontend 2>/dev/null || true
docker rm spendwise-frontend 2>/dev/null || true

# Create directories
mkdir -p /srv/spendwise-frontend/html

# Copy files
cp -r html/* /srv/spendwise-frontend/html/
cp conf/* /srv/nginx/vhost.d/

# Start SpendWise frontend container
docker run -d \
  --name spendwise-frontend \
  --restart always \
  --network nginx-net \
  -e VIRTUAL_HOST=yourdomain.com \
  -e LETSENCRYPT_HOST=yourdomain.com \
  -e LETSENCRYPT_EMAIL=your-email@example.com \
  -v /srv/spendwise-frontend/html:/usr/share/nginx/html:ro \
  nginx:alpine

# Clean up
rm -rf /tmp/html /tmp/conf /tmp/spendwise-frontend.tar.gz
```

**⚠️ Replace `yourdomain.com` and `your-email@example.com` with your actual values.**

---

## Step 6: Verify Deployment

```bash
# Check containers are running
docker ps

# Test nginx configuration
docker exec nginx-proxy nginx -t

# Test website (should redirect to HTTPS)
curl -I http://yourdomain.com

# Test HTTPS (should return 200)
curl -I https://yourdomain.com
```

**Expected results:**
- HTTP request: `301 Moved Permanently` (redirect to HTTPS)
- HTTPS request: `200 OK` with your frontend content

---

## Step 7: Update Frontend (Future deployments)

For future updates, you only need to repeat steps 1, 2, 3, and this simplified deployment:

```bash
# On server, extract new files
cd /tmp
tar -xzf spendwise-frontend.tar.gz

# Update frontend files
cp -r html/* /srv/spendwise-frontend/html/

# Update nginx config (if changed)
cp conf/* /srv/nginx/vhost.d/

# Restart containers to pick up changes
docker restart nginx-proxy
docker restart spendwise-frontend

# Clean up
rm -rf /tmp/html /tmp/conf /tmp/spendwise-frontend.tar.gz
```

---

## Troubleshooting

### Frontend not loading
```bash
# Check container logs
docker logs spendwise-frontend
docker logs nginx-proxy

# Verify files are in place
ls -la /srv/spendwise-frontend/html/
```

### SSL certificate issues
```bash
# Check Let's Encrypt logs
docker logs nginx-proxy-acme

# Verify domain points to your server
dig yourdomain.com
```

### API calls not working
- Ensure your backend is running on port 5000
- Check the nginx config: `cat /srv/nginx/vhost.d/yourdomain.com`

---

## File Structure on Server

After deployment, your server will have:

```
/srv/
├── nginx/
│   ├── vhost.d/
│   │   └── yourdomain.com        # API proxy config
│   ├── certs/                    # SSL certificates
│   └── html/                     # nginx-proxy files
└── spendwise-frontend/
    └── html/                     # Your React app
        ├── index.html
        ├── assets/
        └── ...
```

---

## Quick Deployment Script

Save this as `deploy.sh` for easy future deployments:

```bash
#!/bin/bash
set -e

# Configuration
DOMAIN="yourdomain.com"
EMAIL="your-email@example.com"
SERVER="root@YOUR_SERVER_IP"

echo "🚀 Deploying SpendWise Frontend..."

# Build locally
npm run build

# Create deployment package
mkdir -p spendwise-deploy/{html,conf}
cp -r dist/public/* spendwise-deploy/html/

# Create nginx config
cat > spendwise-deploy/conf/$DOMAIN << EOF
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

# Create archive and upload
tar -czf spendwise-frontend.tar.gz -C spendwise-deploy .
scp spendwise-frontend.tar.gz $SERVER:/tmp/

# Deploy on server
ssh $SERVER << 'ENDSSH'
cd /tmp
tar -xzf spendwise-frontend.tar.gz
cp -r html/* /srv/spendwise-frontend/html/
cp conf/* /srv/nginx/vhost.d/
docker restart nginx-proxy spendwise-frontend
rm -rf html conf spendwise-frontend.tar.gz
ENDSSH

# Clean up locally
rm -rf spendwise-deploy spendwise-frontend.tar.gz

echo "✅ Deployment complete! Visit https://$DOMAIN"
```

Make it executable: `chmod +x deploy.sh`

---

## Summary

Your SpendWise frontend is now deployed with:
- ✅ **Automatic HTTPS** with Let's Encrypt certificates
- ✅ **API proxy** ready for backend integration  
- ✅ **Production optimized** with gzip and caching
- ✅ **Easy updates** with simple file replacement

**Your app is live at:** `https://yourdomain.com`

For backend deployment, ensure your Node.js server runs on port 5000 and API endpoints will automatically work through the `/api/` proxy.
