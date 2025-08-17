# Server Setup Commands

Run these commands on your server to complete the setup:

```bash
# 1. Create the network (if not exists)
docker network create nginx-net || true

# 2. Start nginx-proxy
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

# 3. Start Let's Encrypt companion
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

# 4. Check status
docker ps

# 5. Check logs
docker logs nginx-proxy
docker logs nginx-proxy-acme
docker logs spendwise-frontend
```

## Current Status Check

You can check what's currently running:

```bash
# Check running containers
docker ps

# Check networks
docker network ls

# Check if SpendWise files are in place
ls -la /srv/spendwise-frontend/html/
ls -la /srv/nginx/vhost.d/cougeon.co.zw

# Test local connectivity
curl -I http://localhost/
```

## Quick Complete Setup

If you want to do everything in one go:

```bash
# Create and run this script on your server
cat > complete_setup.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Setting up complete infrastructure..."

# Create network
docker network create nginx-net || true

# Stop any existing containers
docker stop nginx-proxy nginx-proxy-acme 2>/dev/null || true
docker rm nginx-proxy nginx-proxy-acme 2>/dev/null || true

# Start nginx-proxy
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

# Start acme companion
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

sleep 3

# Restart SpendWise frontend to register with nginx-proxy
docker restart spendwise-frontend

echo "✅ Setup complete!"
docker ps
EOF

chmod +x complete_setup.sh
./complete_setup.sh
```
