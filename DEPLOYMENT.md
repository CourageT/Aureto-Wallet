# Aureto Wallet - Production Deployment Guide

This guide will help you deploy Aureto Wallet to your production server at `https://cougeon.co.zw`.

## Prerequisites

### Server Requirements
- Ubuntu 20.04+ or similar Linux distribution
- 2+ CPU cores
- 4GB+ RAM
- 20GB+ disk space
- Docker and Docker Compose installed
- Domain configured with SSL certificate

### Required Services
- PostgreSQL database (included in Docker setup)
- Nginx reverse proxy (included)
- SSL certificate (Let's Encrypt recommended)

## Step 1: Server Setup

### Install Docker & Docker Compose
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login to apply group changes
```

## Step 2: Application Setup

### Clone & Configure
```bash
# Clone your repository
git clone <your-repo-url> aureto-wallet
cd aureto-wallet

# Copy environment template
cp env.production.template .env

# Edit environment variables
nano .env
```

### Configure Environment Variables
Update `.env` with your actual values:

```bash
# Database Configuration
POSTGRES_DB=aureto_wallet
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_very_secure_database_password_here

# Application Secrets (generate a secure 32+ character string)
SESSION_SECRET=your_very_secure_session_secret_key_at_least_32_characters_long

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Domain
PRODUCTION_DOMAIN=https://cougeon.co.zw
NODE_ENV=production
```

## Step 3: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure:
   - Application type: Web application
   - Name: Aureto Wallet
   - Authorized JavaScript origins: `https://cougeon.co.zw`
   - Authorized redirect URIs: `https://cougeon.co.zw/api/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

## Step 4: SSL Certificate Setup

### Option A: Let's Encrypt (Recommended)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate (stop nginx first if running)
sudo certbot certonly --standalone -d cougeon.co.zw -d www.cougeon.co.zw

# Create SSL directory for Docker
sudo mkdir -p ./ssl
sudo cp /etc/letsencrypt/live/cougeon.co.zw/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/cougeon.co.zw/privkey.pem ./ssl/
sudo chown -R $USER:$USER ./ssl
```

### Option B: Custom Certificate
Place your SSL certificate files in the `./ssl/` directory:
- `fullchain.pem` (certificate + intermediate)
- `privkey.pem` (private key)

## Step 5: Update Nginx Configuration

Update `nginx.conf` to include SSL:

```nginx
server {
    listen 80;
    server_name cougeon.co.zw www.cougeon.co.zw;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cougeon.co.zw www.cougeon.co.zw;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Rest of your configuration...
    # (Keep all the existing location blocks)
}
```

## Step 6: Deploy Application

```bash
# Build and start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Run database migrations
docker-compose exec backend npm run db:push
```

## Step 7: Verification

### Check Services
```bash
# Check all containers are running
docker-compose ps

# Test frontend
curl -I https://cougeon.co.zw

# Test backend API
curl -I https://cougeon.co.zw/api/health

# Test database connection
docker-compose exec database pg_isready -U postgres
```

### Test OAuth
1. Visit `https://cougeon.co.zw`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify successful login

## Step 8: Monitoring & Maintenance

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

### Backup Database
```bash
# Create backup
docker-compose exec database pg_dump -U postgres aureto_wallet > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup (if needed)
docker-compose exec -T database psql -U postgres aureto_wallet < backup_file.sql
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run migrations if needed
docker-compose exec backend npm run db:push
```

### SSL Certificate Renewal
```bash
# Renew Let's Encrypt certificate
sudo certbot renew --dry-run

# Update SSL files in Docker
sudo cp /etc/letsencrypt/live/cougeon.co.zw/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/cougeon.co.zw/privkey.pem ./ssl/
docker-compose restart frontend
```

## Step 9: Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Troubleshooting

### Common Issues

1. **Container won't start**
   ```bash
   docker-compose logs [service-name]
   ```

2. **Database connection issues**
   ```bash
   # Check database logs
   docker-compose logs database
   
   # Test connection
   docker-compose exec backend npm run db:push
   ```

3. **OAuth not working**
   - Verify Google Console redirect URLs
   - Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
   - Ensure PRODUCTION_DOMAIN is correct

4. **SSL issues**
   - Verify certificate files exist in ./ssl/
   - Check certificate expiration: `openssl x509 -in ./ssl/fullchain.pem -text -noout`

5. **502 Bad Gateway**
   - Check if backend container is running
   - Verify nginx configuration
   - Check backend health: `curl http://localhost:3001/health`

### Performance Optimization

1. **Enable HTTP/2**
   - Already included in nginx config

2. **Database optimization**
   ```sql
   -- Connect to database and run
   docker-compose exec database psql -U postgres aureto_wallet
   
   -- Analyze tables for better performance
   ANALYZE;
   ```

3. **Monitor resources**
   ```bash
   # Check resource usage
   docker stats
   
   # Check disk usage
   df -h
   du -sh ./postgres_data
   ```

## Security Best Practices

1. **Regular Updates**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Update Docker images
   docker-compose pull
   docker-compose up -d
   ```

2. **Monitor Logs**
   ```bash
   # Set up log rotation for Docker
   sudo nano /etc/docker/daemon.json
   ```
   
   Add:
   ```json
   {
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "10m",
       "max-file": "3"
     }
   }
   ```

3. **Backup Strategy**
   - Set up automated database backups
   - Store backups in secure, offsite location
   - Test backup restoration regularly

## Support

For technical support or deployment issues:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables in `.env`
3. Test each service individually
4. Check firewall and DNS configuration

---

**Production URL**: https://cougeon.co.zw
**Admin Panel**: https://cougeon.co.zw/profile
**API Health**: https://cougeon.co.zw/api/health