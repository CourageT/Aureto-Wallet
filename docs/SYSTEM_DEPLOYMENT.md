# System Deployment and Subdomain Management Guide

## Overview
This guide covers the overall system architecture, nginx-proxy configuration, and how to add new subdomains to the Aureto Wallet infrastructure.

## System Architecture

```
Internet
    ↓
nginx-proxy (Port 80/443)
    ├── aureto.cougeon.co.zw → aureto-frontend (Port 80)
    │   └── /api/* → spendwise-backend (Port 5000)
    │   └── /ws → spendwise-backend (Port 5000)
    └── cougeon.co.zw → spendwise-frontend (Port 80)
        └── /api/* → spendwise-backend (Port 5000)

Backend Services:
    ├── spendwise-backend (Port 5000)
    │   └── spendwise-postgres (Port 5432)
    └── aureto-frontend (nginx:alpine)

Networks:
    ├── nginx-net (nginx-proxy, frontends, backend)
    └── spendwise-backend-deploy_spendwise-net (backend, database)
```

## Core Infrastructure Components

### 1. nginx-proxy
- **Container**: nginxproxy/nginx-proxy
- **Ports**: 80:80, 443:443
- **Purpose**: Reverse proxy and SSL termination
- **Network**: nginx-net
- **Auto-discovery**: Watches Docker events for VIRTUAL_HOST

### 2. acme-companion
- **Container**: nginxproxy/acme-companion
- **Purpose**: Automatic SSL certificate management via Let's Encrypt
- **Volumes**: Shares certificates with nginx-proxy
- **Auto-renewal**: Handles certificate renewal automatically

### 3. Networks
```bash
# Main web traffic network
nginx-net (bridge)
├── nginx-proxy
├── nginx-proxy-acme
├── aureto-frontend
├── spendwise-frontend
└── spendwise-backend

# Database network
spendwise-backend-deploy_spendwise-net (bridge)
├── spendwise-backend
└── spendwise-postgres
```

## Current Subdomain Configuration

### Primary Domain: cougeon.co.zw
- **Frontend**: spendwise-frontend
- **Backend**: spendwise-backend (via /api/ proxy)
- **SSL**: Auto-managed by Let's Encrypt

### Aureto Subdomain: aureto.cougeon.co.zw
- **Frontend**: aureto-frontend
- **Backend**: spendwise-backend (via /api/ proxy)
- **SSL**: Auto-managed by Let's Encrypt
- **Special Config**: SPA routing with try_files

## Adding New Subdomains

### Step 1: Prepare the Application

#### For Frontend Applications
```bash
# 1. Build your application
npm run build

# 2. Create archive
tar -czf myapp-frontend.tar.gz -C dist .

# 3. Upload to server
scp myapp-frontend.tar.gz root@SERVER_IP:/tmp/

# 4. Extract on server
ssh root@SERVER_IP "mkdir -p /root/myapp-frontend && cd /root/myapp-frontend && tar -xzf /tmp/myapp-frontend.tar.gz"
```

#### For Backend Applications
```bash
# 1. Build application
npm run build

# 2. Create Docker image
docker build -t myapp-backend .

# 3. Save and upload image
docker save myapp-backend | gzip > myapp-backend.tar.gz
scp myapp-backend.tar.gz root@SERVER_IP:/tmp/

# 4. Load on server
ssh root@SERVER_IP "docker load < /tmp/myapp-backend.tar.gz"
```

### Step 2: Deploy Frontend Container

```bash
# SSH to server
ssh root@SERVER_IP

# Create nginx configuration for SPA (if needed)
cat > /tmp/myapp-nginx.conf << 'EOF'
server {
    listen       80;
    listen  [::]:80;
    server_name  localhost;

    root   /usr/share/nginx/html;
    index  index.html index.htm;

    # Handle client-side routing for SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
EOF

# Create and start frontend container
docker run -d \
  --name myapp-frontend \
  --network nginx-net \
  -v /root/myapp-frontend:/usr/share/nginx/html:ro \
  -e VIRTUAL_HOST=myapp.cougeon.co.zw \
  -e LETSENCRYPT_HOST=myapp.cougeon.co.zw \
  -e LETSENCRYPT_EMAIL=your-email@domain.com \
  nginx:alpine

# Copy nginx configuration (for SPA apps)
docker cp /tmp/myapp-nginx.conf myapp-frontend:/etc/nginx/conf.d/default.conf

# Reload nginx
docker exec myapp-frontend nginx -s reload
```

### Step 3: Deploy Backend Container (Optional)

```bash
# Start backend container
docker run -d \
  --name myapp-backend \
  --network nginx-net \
  -p 3001:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=your-database-url \
  myapp-backend

# Connect to database network if needed
docker network connect spendwise-backend-deploy_spendwise-net myapp-backend
```

### Step 4: Configure API Routing (If Backend Needed)

```bash
# Create vhost configuration for API routing
cat > /srv/nginx/vhost.d/myapp.cougeon.co.zw << 'EOF'
# API proxy to backend server
location /api/ {
    proxy_pass http://172.17.0.1:3001;
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

# WebSocket support (if needed)
location /ws {
    proxy_pass http://172.17.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
EOF

# Reload nginx-proxy to apply configuration
docker exec nginx-proxy nginx -s reload
```

### Step 5: DNS Configuration

```bash
# Add DNS record (example for Cloudflare API)
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/dns_records" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "A",
    "name": "myapp",
    "content": "SERVER_IP_ADDRESS",
    "ttl": 3600
  }'

# Or manually add A record:
# Name: myapp
# Type: A
# Value: SERVER_IP_ADDRESS
# TTL: Auto or 3600
```

### Step 6: Verify Deployment

```bash
# Test HTTP (should redirect to HTTPS)
curl -I http://myapp.cougeon.co.zw

# Test HTTPS (after SSL certificate is issued)
curl -I https://myapp.cougeon.co.zw

# Test API routing (if configured)
curl -I https://myapp.cougeon.co.zw/api/health

# Check SSL certificate
openssl s_client -connect myapp.cougeon.co.zw:443 -servername myapp.cougeon.co.zw < /dev/null
```

## Advanced Configuration

### Custom nginx Configuration

#### Static Site with Custom Headers
```nginx
server {
    listen       80;
    server_name  localhost;
    root   /usr/share/nginx/html;
    index  index.html index.htm;

    # Custom security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";

    # Cache configuration
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ =404;
    }
}
```

#### API-Only Service
```nginx
# For services that only serve API endpoints
location / {
    proxy_pass http://172.17.0.1:PORT;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS headers (if needed)
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
}
```

### Environment-Specific Configurations

#### Development Subdomain
```bash
# For development/staging environments
docker run -d \
  --name myapp-dev-frontend \
  --network nginx-net \
  -v /root/myapp-dev-frontend:/usr/share/nginx/html:ro \
  -e VIRTUAL_HOST=dev.myapp.cougeon.co.zw \
  -e LETSENCRYPT_HOST=dev.myapp.cougeon.co.zw \
  -e LETSENCRYPT_EMAIL=your-email@domain.com \
  nginx:alpine
```

#### Load Balancing Multiple Backends
```nginx
# In vhost configuration
upstream myapp_backend {
    server 172.17.0.1:3001;
    server 172.17.0.1:3002;
    server 172.17.0.1:3003;
}

location /api/ {
    proxy_pass http://myapp_backend;
    # ... other proxy settings
}
```

## Monitoring and Maintenance

### System Health Checks

```bash
#!/bin/bash
# File: /root/scripts/system-health.sh

echo "=== nginx-proxy Status ==="
docker ps | grep nginx-proxy
docker logs nginx-proxy --tail 3

echo "=== acme-companion Status ==="
docker ps | grep acme
docker logs nginx-proxy-acme --tail 3

echo "=== Frontend Containers ==="
docker ps | grep frontend

echo "=== Backend Containers ==="
docker ps | grep backend

echo "=== Database Status ==="
docker ps | grep postgres

echo "=== SSL Certificates ==="
docker exec nginx-proxy ls -la /etc/nginx/certs/ | grep -E "\.(crt|key)$"

echo "=== Disk Usage ==="
df -h

echo "=== Docker Resource Usage ==="
docker system df
```

### Automated SSL Certificate Monitoring

```bash
#!/bin/bash
# File: /root/scripts/ssl-monitor.sh

DOMAINS=("cougeon.co.zw" "aureto.cougeon.co.zw")

for domain in "${DOMAINS[@]}"; do
    echo "Checking SSL for $domain..."
    
    # Get certificate expiry date
    expiry=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | \
             openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    
    # Convert to epoch time
    expiry_epoch=$(date -d "$expiry" +%s)
    current_epoch=$(date +%s)
    days_left=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    echo "$domain: $days_left days until expiry"
    
    # Alert if less than 7 days
    if [ $days_left -lt 7 ]; then
        echo "WARNING: SSL certificate for $domain expires in $days_left days!"
        # Add your notification logic here (email, Slack, etc.)
    fi
done
```

## Backup and Disaster Recovery

### Complete System Backup

```bash
#!/bin/bash
# File: /root/scripts/full-backup.sh

BACKUP_DIR="/root/backups/system-$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

echo "Starting full system backup..."

# 1. Database backup
echo "Backing up database..."
docker exec spendwise-postgres pg_dump -U spendwise spendwise_production | gzip > $BACKUP_DIR/database.sql.gz

# 2. nginx-proxy configuration
echo "Backing up nginx-proxy config..."
docker exec nginx-proxy tar czf - /etc/nginx/vhost.d /etc/nginx/certs > $BACKUP_DIR/nginx-config.tar.gz

# 3. Frontend files
echo "Backing up frontend files..."
tar czf $BACKUP_DIR/aureto-frontend.tar.gz -C /root/aureto-frontend .
tar czf $BACKUP_DIR/spendwise-frontend.tar.gz -C /root/spendwise-frontend .

# 4. Docker images
echo "Backing up Docker images..."
docker save spendwise-backend-deploy-backend | gzip > $BACKUP_DIR/backend-image.tar.gz

# 5. Container configurations
echo "Backing up container configs..."
docker inspect aureto-frontend > $BACKUP_DIR/aureto-frontend-config.json
docker inspect spendwise-backend > $BACKUP_DIR/spendwise-backend-config.json
docker inspect spendwise-postgres > $BACKUP_DIR/spendwise-postgres-config.json

echo "Backup completed: $BACKUP_DIR"
```

### Disaster Recovery Plan

#### Complete System Restoration
```bash
# 1. Install Docker and docker-compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 2. Create networks
docker network create nginx-net
docker network create spendwise-backend-deploy_spendwise-net

# 3. Start nginx-proxy infrastructure
docker run -d \
  --name nginx-proxy \
  --network nginx-net \
  -p 80:80 -p 443:443 \
  -v /var/run/docker.sock:/tmp/docker.sock:ro \
  -v /srv/nginx/certs:/etc/nginx/certs \
  -v /srv/nginx/vhost.d:/etc/nginx/vhost.d \
  -v /srv/nginx/html:/usr/share/nginx/html \
  nginxproxy/nginx-proxy

docker run -d \
  --name nginx-proxy-acme \
  --network nginx-net \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /srv/nginx/certs:/etc/nginx/certs \
  -v /srv/nginx/vhost.d:/etc/nginx/vhost.d \
  -v /srv/nginx/html:/usr/share/nginx/html \
  nginxproxy/acme-companion

# 4. Restore database
# Load database image and restore data
# (See Database Deployment Guide)

# 5. Restore backend
# Load backend image and start container
# (See Backend Deployment Guide)

# 6. Restore frontends
# Extract frontend files and start containers
# (See Frontend Deployment Guide)

# 7. Restore nginx configurations
tar xzf nginx-config.tar.gz -C /
docker exec nginx-proxy nginx -s reload
```

## Security Considerations

### Network Security
- All services isolated in Docker networks
- Database only accessible from backend containers
- Frontend containers serve static files only
- nginx-proxy handles SSL termination

### SSL/TLS Security
- Automatic certificate renewal via Let's Encrypt
- Strong cipher suites configured by default
- HSTS headers enforced
- Certificate transparency logging

### Container Security
- Non-root users in containers where possible
- Regular base image updates
- Resource limits on containers
- Health checks for all services

### Access Control
- SSH key-based authentication only
- Firewall rules restricting access
- Regular security updates
- Log monitoring and alerting

## Troubleshooting Common Issues

### SSL Certificate Issues
```bash
# Check certificate status
docker logs nginx-proxy-acme | grep -i error

# Force certificate renewal
docker restart nginx-proxy-acme

# Check certificate files
docker exec nginx-proxy ls -la /etc/nginx/certs/
```

### nginx-proxy Issues
```bash
# Check nginx-proxy logs
docker logs nginx-proxy

# Test nginx configuration
docker exec nginx-proxy nginx -t

# Restart nginx-proxy
docker restart nginx-proxy
```

### Network Connectivity Issues
```bash
# Check networks
docker network ls

# Inspect network
docker network inspect nginx-net

# Test connectivity between containers
docker exec container1 nc -z container2 port
```

### Domain Resolution Issues
```bash
# Check DNS resolution
nslookup subdomain.cougeon.co.zw

# Test from different locations
dig @8.8.8.8 subdomain.cougeon.co.zw

# Check domain propagation
https://www.whatsmydns.net/
```

## Performance Optimization

### nginx Tuning
```nginx
# Add to nginx-proxy configuration
worker_processes auto;
worker_connections 1024;

# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Enable HTTP/2
listen 443 ssl http2;
```

### Container Resource Limits
```bash
# Add resource limits to containers
docker run -d \
  --name myapp-frontend \
  --memory=512m \
  --cpus=0.5 \
  # ... other options
```

### Monitoring Setup
```bash
# Install monitoring tools
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  prom/prometheus

docker run -d \
  --name grafana \
  -p 3000:3000 \
  grafana/grafana
```

---

**Last Updated**: August 17, 2025
**Next Review**: September 17, 2025

## Quick Reference

### Essential Commands
```bash
# Check all containers
docker ps -a

# Check networks
docker network ls

# View nginx-proxy logs
docker logs nginx-proxy

# Reload nginx configuration
docker exec nginx-proxy nginx -s reload

# Check SSL certificates
docker exec nginx-proxy ls -la /etc/nginx/certs/

# System resource usage
docker system df
docker stats
```

### Emergency Contacts
- **Server Provider**: [Your hosting provider]
- **Domain Registrar**: [Your domain registrar]
- **SSL Certificate Issues**: Let's Encrypt community support
- **Docker Issues**: Docker community forums
