# Frontend Deployment and Maintenance Guide

## Overview
This guide covers the deployment and maintenance of the Aureto Wallet React frontend application using Docker and nginx.

## Prerequisites
- Docker installed on server
- nginx-proxy with acme-companion setup
- Built React application (production bundle)
- Access to server with sudo/root privileges

## Architecture
The frontend is deployed as a static React SPA served by nginx in a Docker container, with routing handled by nginx-proxy.

```
Internet → nginx-proxy → aureto-frontend (nginx container) → React SPA
```

## 🔒 Security Configuration

### Environment Variables
```bash
# Required for container deployment
VIRTUAL_HOST=aureto.cougeon.co.zw
LETSENCRYPT_HOST=aureto.cougeon.co.zw
LETSENCRYPT_EMAIL=your-email@domain.com
```

## Initial Deployment

### 1. Build the Frontend
```bash
# On local machine - build the React app
npm install
npm run build

# Create deployment archive
tar -czf aureto-frontend.tar.gz -C dist .
```

### 2. Upload to Server
```bash
# Upload build to server
scp aureto-frontend.tar.gz root@SERVER_IP:/tmp/

# SSH to server and extract
ssh root@SERVER_IP
mkdir -p /root/aureto-frontend
cd /root/aureto-frontend
tar -xzf /tmp/aureto-frontend.tar.gz
```

### 3. nginx Configuration for SPA
```bash
# Create nginx config for React Router (SPA routing)
cat > /tmp/aureto-nginx.conf << 'EOF'
server {
    listen       80;
    listen  [::]:80;
    server_name  localhost;

    root   /usr/share/nginx/html;
    index  index.html index.htm;

    # Handle client-side routing for React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets for better performance
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # GZIP compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
EOF
```

### 4. Deploy Container
```bash
# Start the frontend container
docker run -d \
  --name aureto-frontend \
  --network nginx-net \
  -v /root/aureto-frontend:/usr/share/nginx/html:ro \
  -e VIRTUAL_HOST=aureto.cougeon.co.zw \
  -e LETSENCRYPT_HOST=aureto.cougeon.co.zw \
  -e LETSENCRYPT_EMAIL=your-email@domain.com \
  nginx:alpine

# Copy the nginx configuration
docker cp /tmp/aureto-nginx.conf aureto-frontend:/etc/nginx/conf.d/default.conf

# Reload nginx to apply configuration
docker exec aureto-frontend nginx -s reload
```

### 5. Verify Deployment
```bash
# Check container status
docker ps | grep aureto-frontend

# Test HTTP (should redirect to HTTPS)
curl -I http://aureto.cougeon.co.zw

# Test HTTPS after SSL certificate is issued (usually takes 1-2 minutes)
curl -I https://aureto.cougeon.co.zw

# Check nginx logs
docker logs aureto-frontend
```

## Updates and Maintenance

### Updating the Frontend

#### Method 1: Zero-Downtime Update
```bash
# 1. Build new version locally
npm run build
tar -czf aureto-frontend-new.tar.gz -C dist .

# 2. Upload to server
scp aureto-frontend-new.tar.gz root@SERVER_IP:/tmp/

# 3. SSH to server and prepare new version
ssh root@SERVER_IP
mkdir -p /root/aureto-frontend-new
cd /root/aureto-frontend-new
tar -xzf /tmp/aureto-frontend-new.tar.gz

# 4. Create new container
docker run -d \
  --name aureto-frontend-new \
  --network nginx-net \
  -v /root/aureto-frontend-new:/usr/share/nginx/html:ro \
  -e VIRTUAL_HOST=aureto.cougeon.co.zw \
  -e LETSENCRYPT_HOST=aureto.cougeon.co.zw \
  -e LETSENCRYPT_EMAIL=your-email@domain.com \
  nginx:alpine

# 5. Copy nginx configuration
docker cp aureto-frontend:/etc/nginx/conf.d/default.conf aureto-frontend-new:/etc/nginx/conf.d/default.conf
docker exec aureto-frontend-new nginx -s reload

# 6. Wait for health check, then switch
sleep 30
docker stop aureto-frontend
docker rm aureto-frontend
docker rename aureto-frontend-new aureto-frontend

# 7. Cleanup old files
rm -rf /root/aureto-frontend-old
mv /root/aureto-frontend /root/aureto-frontend-old
mv /root/aureto-frontend-new /root/aureto-frontend
```

#### Method 2: Quick Update (Brief Downtime)
```bash
# 1. Build and upload new version
npm run build
tar -czf aureto-frontend.tar.gz -C dist .
scp aureto-frontend.tar.gz root@SERVER_IP:/tmp/

# 2. Update files and restart container
ssh root@SERVER_IP
docker stop aureto-frontend
rm -rf /root/aureto-frontend/*
cd /root/aureto-frontend
tar -xzf /tmp/aureto-frontend.tar.gz
docker start aureto-frontend

# 3. Verify update
docker logs aureto-frontend --tail 10
curl -I https://aureto.cougeon.co.zw
```

### Rollback Procedure
```bash
# If you kept the old version in /root/aureto-frontend-old
docker stop aureto-frontend
rm -rf /root/aureto-frontend/*
cp -r /root/aureto-frontend-old/* /root/aureto-frontend/
docker start aureto-frontend

# Verify rollback
curl -I https://aureto.cougeon.co.zw
```

## Monitoring and Health Checks

### Container Health Check
```bash
#!/bin/bash
# File: /root/scripts/frontend-health.sh

echo "=== Frontend Container Status ==="
docker ps | grep aureto-frontend

echo "=== Container Resource Usage ==="
docker stats aureto-frontend --no-stream

echo "=== nginx Error Logs ==="
docker logs aureto-frontend --tail 5 2>&1 | grep -i error

echo "=== HTTP Response Test ==="
curl -s -o /dev/null -w "HTTP: %{http_code}, Time: %{time_total}s\n" https://aureto.cougeon.co.zw

echo "=== Disk Usage ==="
df -h /root/aureto-frontend
```

### Automated Health Monitoring
```bash
#!/bin/bash
# File: /root/scripts/frontend-monitor.sh

HEALTH_URL="https://aureto.cougeon.co.zw"
LOG_FILE="/root/logs/frontend-health.log"
mkdir -p /root/logs

check_health() {
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" $HEALTH_URL)
    
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "[$TIMESTAMP] OK - HTTP $HTTP_CODE, Response Time: ${RESPONSE_TIME}s" >> $LOG_FILE
    else
        echo "[$TIMESTAMP] ERROR - HTTP $HTTP_CODE, Response Time: ${RESPONSE_TIME}s" >> $LOG_FILE
        # Add alert logic here (email, Slack, etc.)
        docker logs aureto-frontend --tail 10 >> $LOG_FILE
    fi
}

check_health

# Add to crontab for regular monitoring:
# */5 * * * * /root/scripts/frontend-monitor.sh
```

## Backup and Recovery

### Frontend Backup
```bash
#!/bin/bash
# File: /root/scripts/backup-frontend.sh

BACKUP_DIR="/root/backups/frontend-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

echo "Backing up frontend files..."
tar czf $BACKUP_DIR/aureto-frontend-files.tar.gz -C /root/aureto-frontend .

echo "Backing up nginx configuration..."
docker exec aureto-frontend tar czf - /etc/nginx/conf.d > $BACKUP_DIR/nginx-config.tar.gz

echo "Backing up container configuration..."
docker inspect aureto-frontend > $BACKUP_DIR/container-config.json

echo "Frontend backup completed: $BACKUP_DIR"
```

### Recovery from Backup
```bash
# 1. Stop current container
docker stop aureto-frontend
docker rm aureto-frontend

# 2. Restore files
cd /root/aureto-frontend
rm -rf *
tar xzf /path/to/backup/aureto-frontend-files.tar.gz

# 3. Start container
docker run -d \
  --name aureto-frontend \
  --network nginx-net \
  -v /root/aureto-frontend:/usr/share/nginx/html:ro \
  -e VIRTUAL_HOST=aureto.cougeon.co.zw \
  -e LETSENCRYPT_HOST=aureto.cougeon.co.zw \
  -e LETSENCRYPT_EMAIL=your-email@domain.com \
  nginx:alpine

# 4. Restore nginx configuration
tar xzf /path/to/backup/nginx-config.tar.gz
docker cp etc/nginx/conf.d/default.conf aureto-frontend:/etc/nginx/conf.d/default.conf
docker exec aureto-frontend nginx -s reload
```

## Performance Optimization

### Bundle Analysis
```bash
# On local machine - analyze bundle size
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/static/js/*.js

# Optimize recommendations:
# 1. Enable code splitting
# 2. Use lazy loading for routes
# 3. Optimize images and assets
# 4. Enable tree shaking
```

### nginx Performance Tuning
```nginx
# Add to nginx configuration for better performance
server {
    # ... existing configuration ...
    
    # Enable compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # Browser caching
    location ~* \.(css|js|gif|jpe?g|png|svg|ico|webp|woff2?)$ {
        expires 1M;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }
    
    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
}
```

## Troubleshooting

### Common Issues

#### 1. React Router 404 Errors
**Problem**: Direct URL access returns 404
**Solution**: Ensure `try_files $uri $uri/ /index.html;` is in nginx config

#### 2. Static Assets Not Loading
**Problem**: CSS/JS files return 404
**Solution**: Check file permissions and nginx asset location configuration
```bash
# Fix permissions
docker exec aureto-frontend chown -R nginx:nginx /usr/share/nginx/html
docker exec aureto-frontend chmod -R 755 /usr/share/nginx/html
```

#### 3. SSL Certificate Issues
**Problem**: SSL certificate not generating
**Solution**: Check acme-companion logs and domain DNS
```bash
docker logs nginx-proxy-acme
nslookup aureto.cougeon.co.zw
```

#### 4. Container Won't Start
**Problem**: Container exits immediately
**Solution**: Check nginx configuration syntax
```bash
docker run --rm -v /tmp/aureto-nginx.conf:/etc/nginx/conf.d/default.conf nginx:alpine nginx -t
```

### Debug Commands
```bash
# Check container logs
docker logs aureto-frontend

# Execute commands in container
docker exec -it aureto-frontend sh

# Test nginx configuration
docker exec aureto-frontend nginx -t

# Check nginx access logs
docker exec aureto-frontend tail -f /var/log/nginx/access.log

# Check network connectivity
docker exec aureto-frontend ping nginx-proxy
```

## Security Hardening

### nginx Security Configuration
```nginx
# Add security headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";

# Hide nginx version
server_tokens off;

# Prevent access to hidden files
location ~ /\. {
    deny all;
}
```

### Container Security
```bash
# Run container with non-root user
docker run -d \
  --name aureto-frontend \
  --user nginx \
  --read-only \
  --tmpfs /var/cache/nginx \
  --tmpfs /var/log/nginx \
  --tmpfs /tmp \
  # ... other options ...
```

---

**Last Updated**: August 17, 2025
**Next Review**: September 17, 2025

## Quick Reference Commands

```bash
# Check status
docker ps | grep aureto-frontend

# View logs
docker logs aureto-frontend --tail 20

# Restart container
docker restart aureto-frontend

# Update nginx config
docker cp new-config.conf aureto-frontend:/etc/nginx/conf.d/default.conf
docker exec aureto-frontend nginx -s reload

# Check SSL certificate
openssl s_client -connect aureto.cougeon.co.zw:443 -servername aureto.cougeon.co.zw < /dev/null
```
