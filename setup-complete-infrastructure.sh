#!/bin/bash

# Complete SpendWise Deployment Setup
# This script sets up the entire nginx-proxy infrastructure and deploys SpendWise

set -e

echo "🚀 Setting up complete SpendWise deployment infrastructure..."

# Step 1: Create network
echo "📡 Creating Docker network..."
docker network create nginx-net || echo "Network nginx-net already exists"

# Step 2: Start nginx-proxy
echo "🌐 Starting nginx-proxy..."
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

# Step 3: Start Let's Encrypt companion
echo "🔒 Starting Let's Encrypt companion..."
docker run -d \
  --name nginx-proxy-acme \
  --restart always \
  --network nginx-net \
  -v /srv/nginx/certs:/etc/nginx/certs \
  -v /srv/nginx/vhost.d:/etc/nginx/vhost.d \
  -v /srv/nginx/html:/usr/share/nginx/html \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e DEFAULT_EMAIL=couragetbarwe@gmail.com \
  -e NGINX_PROXY_CONTAINER=nginx-proxy \
  nginxproxy/acme-companion

# Wait a moment for containers to start
sleep 5

# Step 4: Check if SpendWise frontend is already running
if docker ps | grep -q spendwise-frontend; then
    echo "✅ SpendWise frontend is already running"
else
    echo "🚀 Starting SpendWise frontend..."
    docker run -d \
      --name spendwise-frontend \
      --restart always \
      --network nginx-net \
      -e VIRTUAL_HOST=cougeon.co.zw \
      -e LETSENCRYPT_HOST=cougeon.co.zw \
      -e LETSENCRYPT_EMAIL=couragetbarwe@gmail.com \
      -v /srv/spendwise-frontend/html:/usr/share/nginx/html:ro \
      nginx:alpine
fi

echo ""
echo "📊 Deployment Status:"
echo "====================="
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" | grep -E "(nginx-proxy|spendwise-frontend|NAMES)"

echo ""
echo "🌐 Your SpendWise app should be available at: https://cougeon.co.zw"
echo "⏳ SSL certificate generation may take a few minutes..."
echo ""
echo "📋 Useful commands:"
echo "   Check logs: docker logs <container-name>"
echo "   Restart:    docker restart <container-name>"
echo "   Status:     docker ps"
echo ""
