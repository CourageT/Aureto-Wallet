# Manual Deployment Steps

If you prefer to deploy manually instead of using the automated script, here are the step-by-step instructions:

## 1. Build Frontend Locally
```bash
npm run build
```

## 2. Create Deployment Structure
```bash
# Create temporary directory
mkdir frontend-manual-deploy
cd frontend-manual-deploy

# Create subdirectories
mkdir html conf

# Copy built frontend files
cp -r ../dist/public/* html/

# Create nginx config for API proxy
cat > conf/cougeon.co.zw << 'EOF'
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
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Handle client-side routing (SPA)
location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# Static assets with cache headers
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
EOF
```

## 3. Upload to Server
```bash
# Create archive
tar -czf spendwise-frontend.tar.gz html conf

# Upload to server
scp spendwise-frontend.tar.gz root@68.183.86.219:/tmp/
```

## 4. Deploy on Server
```bash
# SSH to server
ssh root@68.183.86.219

# Extract files
cd /tmp
tar -xzf spendwise-frontend.tar.gz

# Stop old container
docker stop nginx-hello 2>/dev/null || true
docker rm nginx-hello 2>/dev/null || true

# Create directories
mkdir -p /srv/spendwise-frontend/html

# Copy files
cp -r html/* /srv/spendwise-frontend/html/
cp conf/* /srv/nginx/vhost.d/

# Start new container
docker run -d \
  --name spendwise-frontend \
  --restart always \
  --network nginx-net \
  -e VIRTUAL_HOST=cougeon.co.zw \
  -e LETSENCRYPT_HOST=cougeon.co.zw \
  -e LETSENCRYPT_EMAIL=couragetbarwe@gmail.com \
  -v /srv/spendwise-frontend/html:/usr/share/nginx/html:ro \
  nginx:alpine

# Check status
docker ps | grep spendwise-frontend
```

## 5. Verify Deployment
```bash
# Check container logs
docker logs spendwise-frontend

# Check nginx-proxy logs
docker logs nginx-proxy

# Test website
curl -I https://cougeon.co.zw
```

## Backend Configuration

Make sure your backend is accessible from the Docker container. The nginx config uses `host.docker.internal:5000` which should work if your backend is running on the host machine on port 5000.

If your backend is running differently, update the proxy_pass URLs in `/srv/nginx/vhost.d/cougeon.co.zw`:

```nginx
# For backend on different port
proxy_pass http://host.docker.internal:YOUR_PORT;

# For backend in another Docker container
proxy_pass http://your-backend-container:5000;

# For backend on different server
proxy_pass http://YOUR_BACKEND_IP:5000;
```

After changing the config, restart nginx-proxy:
```bash
docker restart nginx-proxy
```

## Troubleshooting

### 502 Bad Gateway
- Check if backend is running: `curl http://localhost:5000/api/health`
- Check nginx config: `cat /srv/nginx/vhost.d/cougeon.co.zw`
- Check container network: `docker network inspect nginx-net`

### SSL Issues
- Check Let's Encrypt logs: `docker logs nginx-proxy-acme`
- Verify domain DNS points to your server
- Check certificate: `docker exec nginx-proxy ls -la /etc/nginx/certs/`

### Frontend Not Loading
- Check static files: `ls -la /srv/spendwise-frontend/html/`
- Check container: `docker logs spendwise-frontend`
- Verify container is running: `docker ps | grep spendwise`
