# SSL Troubleshooting Commands

Run these commands on your server to diagnose the SSL issue:

## 1. Check nginx-proxy logs
```bash
docker logs nginx-proxy
```

## 2. Check Let's Encrypt logs  
```bash
docker logs nginx-proxy-acme
```

## 3. Check SpendWise frontend logs
```bash
docker logs spendwise-frontend
```

## 4. Check if domain resolves to your server
```bash
nslookup cougeon.co.zw
dig cougeon.co.zw
```

## 5. Check nginx-proxy configuration
```bash
# Check if your domain config exists
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf

# Check vhost configuration
docker exec nginx-proxy ls -la /etc/nginx/vhost.d/
cat /srv/nginx/vhost.d/cougeon.co.zw
```

## 6. Check SSL certificates
```bash
# Check if certificates are being generated
docker exec nginx-proxy ls -la /etc/nginx/certs/
```

## 7. Test HTTP first (before HTTPS)
```bash
curl -H "Host: cougeon.co.zw" http://localhost/
curl -I http://cougeon.co.zw/
```

# SSL/Connection Troubleshooting Commands

## After fixing nginx config typo, run these commands:

### 1. Check nginx-proxy status and logs
```bash
# Check if nginx-proxy is running
docker ps | grep nginx-proxy

# Check recent logs for errors
docker logs nginx-proxy --tail 20

# Check nginx config syntax
docker exec nginx-proxy nginx -t
```

### 2. Check vhost config
```bash
# Verify the fix worked
cat /srv/nginx/vhost.d/cougeon.co.zw

# Check for any duplicate headers or syntax issues
grep -n "proxy_set_header" /srv/nginx/vhost.d/cougeon.co.zw
```

### 3. Test connectivity step by step
```bash
# Test if nginx-proxy container responds
docker exec nginx-proxy curl -I http://localhost

# Test if SpendWise frontend container responds
docker exec spendwise-frontend curl -I http://localhost

# Check network connectivity between containers
docker exec nginx-proxy ping -c 3 spendwise-frontend
```

### 4. Check container networks
```bash
# Verify all containers are on the same network
docker network inspect nginx-net | grep -A 5 "Name"
```

### 5. Force regenerate nginx config
```bash
# Sometimes nginx-proxy needs to regenerate its config
docker restart spendwise-frontend
sleep 5
docker restart nginx-proxy
```

## Quick Fixes to Try:

### Fix 1: Restart containers in order
```bash
docker restart nginx-proxy-acme
sleep 10
docker restart nginx-proxy  
sleep 10
docker restart spendwise-frontend
```

### Fix 2: Check and fix vhost config
```bash
# Check if the vhost config has any issues
cat /srv/nginx/vhost.d/cougeon.co.zw

# If there's a typo, fix it:
nano /srv/nginx/vhost.d/cougeon.co.zw
# Then restart nginx-proxy
docker restart nginx-proxy
```

### Fix 3: Force certificate generation
```bash
# Remove any existing certificates and regenerate
docker exec nginx-proxy rm -f /etc/nginx/certs/cougeon.co.zw.*
docker restart nginx-proxy-acme
```

### Fix 4: Check DNS
```bash
# Verify your domain points to this server
dig +short cougeon.co.zw
# Should return: 68.183.86.219
```
