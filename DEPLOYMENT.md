# SpendWise Frontend Deployment Guide

## Overview
This deployment setup replaces your current `nginx-hello` container with a production-ready frontend that serves your SpendWise application and proxies API calls to your backend using volume mounts (no custom Docker image required).

## Prerequisites
- Your nginx-proxy setup is already running (commands 4-6 from your original setup)
- Your backend server should be running and accessible on port 5000
- SSH access to your server

## How It Works

### Current nginx-proxy Setup
Your existing setup uses:
```bash
# nginx-proxy (handles SSL and routing)
docker run -d --name nginx-proxy --restart always --network nginx-net \
  --label com.github.nginx-proxy.nginx-proxy=true \
  -p 80:80 -p 443:443 \
  -v /srv/nginx/certs:/etc/nginx/certs \
  -v /srv/nginx/vhost.d:/etc/nginx/vhost.d \
  -v /srv/nginx/html:/usr/share/nginx/html \
  -v /var/run/docker.sock:/tmp/docker.sock:ro \
  nginxproxy/nginx-proxy

# Let's Encrypt SSL
docker run -d --name nginx-proxy-acme --restart always --network nginx-net \
  -v /srv/nginx/certs:/etc/nginx/certs \
  -v /srv/nginx/vhost.d:/etc/nginx/vhost.d \
  -v /srv/nginx/html:/usr/share/nginx/html \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e DEFAULT_EMAIL=couragetbarwe@gmail.com \
  -e NGINX_PROXY_CONTAINER=nginx-proxy \
  nginxproxy/acme-companion
```

### SpendWise Frontend Container
The deployment script replaces:
```bash
# OLD: nginx-hello
docker run -d --name nginx-hello --restart always --network nginx-net \
  -e VIRTUAL_HOST=cougeon.co.zw \
  -e LETSENCRYPT_HOST=cougeon.co.zw \
  -e LETSENCRYPT_EMAIL=couragetbarwe@gmail.com \
  -v ~/nginx-hello:/usr/share/nginx/html:ro \
  nginx

# NEW: spendwise-frontend
docker run -d --name spendwise-frontend --restart always --network nginx-net \
  -e VIRTUAL_HOST=cougeon.co.zw \
  -e LETSENCRYPT_HOST=cougeon.co.zw \
  -e LETSENCRYPT_EMAIL=couragetbarwe@gmail.com \
  -v /srv/spendwise-frontend/html:/usr/share/nginx/html:ro \
  nginx:alpine
```

### File Structure on Server
```
/srv/
├── nginx/
│   ├── vhost.d/
│   │   └── cougeon.co.zw          # Custom nginx config for API proxy
│   ├── certs/                     # SSL certificates
│   └── html/                      # Default nginx-proxy files
└── spendwise-frontend/
    └── html/                      # Your React app static files
        ├── index.html
        ├── assets/
        └── ...
```

## Deployment Steps

### 1. Quick Deployment (Automated)
```bash
./deploy-frontend.sh
```

### 2. Manual Deployment Steps

#### Build Frontend
```bash
npm run build
```

#### Upload Files
```bash
# Create deployment package
tar -czf frontend-deploy.tar.gz dist/public nginx.conf Dockerfile.frontend

# Upload to server
scp frontend-deploy.tar.gz root@68.183.86.219:/tmp/
```

#### Deploy on Server
```bash
ssh root@68.183.86.219

# Extract files
cd /tmp
tar -xzf frontend-deploy.tar.gz

# Build Docker image
docker build -t spendwise-frontend:latest -f Dockerfile.frontend .

# Stop old container
docker stop nginx-hello
docker rm nginx-hello

# Start new container
docker run -d \
  --name spendwise-frontend \
  --restart always \
  --network nginx-net \
  -e VIRTUAL_HOST=cougeon.co.zw \
  -e LETSENCRYPT_HOST=cougeon.co.zw \
  -e LETSENCRYPT_EMAIL=couragetbarwe@gmail.com \
  spendwise-frontend:latest
```

## Backend Integration

### API Endpoint Configuration
Your frontend makes calls to these API endpoints:
- `/api/wallets`
- `/api/users/me`
- `/api/categories`
- `/api/reports/*`
- `/api/ai/*`
- `/api/login`
- And more...

### Backend Requirements
Your backend should:
1. **Listen on port 5000** (or update nginx.conf)
2. **Accept connections from the nginx container**
3. **Handle CORS properly** (since requests come through nginx)
4. **Be accessible** on the Docker network or host

### Environment Variables for Backend
Make sure your backend has:
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=your_production_database_url
# ... other env vars from your .env
```

## Testing the Deployment

### Check Container Status
```bash
ssh root@68.183.86.219 'docker ps | grep spendwise'
```

### View Logs
```bash
ssh root@68.183.86.219 'docker logs spendwise-frontend'
```

### Test Website
- Visit: https://cougeon.co.zw
- Check API calls in browser dev tools
- Verify SSL certificate

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Backend not running or not accessible
   - Check nginx.conf proxy_pass URL
   - Verify backend port and network connectivity

2. **API calls failing**
   - Check backend logs
   - Verify CORS settings
   - Check network connectivity between containers

3. **SSL not working**
   - Check Let's Encrypt container logs
   - Verify domain DNS points to server

### Debug Commands
```bash
# Check nginx config
docker exec spendwise-frontend nginx -t

# Check network connectivity
docker exec spendwise-frontend nslookup backend

# Check backend from nginx container
docker exec spendwise-frontend wget -O- http://backend:5000/api/health
```

## Next Steps

1. **Deploy Backend**: If not already done, deploy your backend server
2. **Database Setup**: Ensure your production database is configured
3. **Monitoring**: Set up log monitoring and health checks
4. **Backup**: Implement backup strategy for your database

## File Structure
```
/
├── dist/public/          # Built frontend files
├── nginx.conf           # Nginx configuration
├── Dockerfile.frontend  # Frontend container definition
└── deploy-frontend.sh   # Deployment script
```
