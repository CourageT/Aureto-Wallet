# SpendWise Production Deployment Guide

## 🌟 Complete Step-by-Step Deployment Instructions

### 📋 Prerequisites

#### Server Requirements
- **OS**: Ubuntu 24.04 LTS
- **RAM**: Minimum 1GB (2GB recommended)
- **Storage**: Minimum 20GB SSD
- **Network**: Public IP with ports 80, 443, and 22 open

#### Local Requirements
- SSH access to your server
- Domain name configured to point to your server IP
- Git repository access

#### Required Information
Before starting, have these details ready:
- `SERVER_IP`: Your server's public IP address
- `DOMAIN`: Your domain name (e.g., yourdomain.com)
- `EMAIL`: Your email for SSL certificates
- `SSH_USER`: Server username (usually 'root' for initial setup)

---

## 🚀 First-Time Deployment

### Step 1: Server Setup and Docker Installation

Run the server setup script to install Docker and prepare the environment:

```bash
./first-time-setup/01-setup-server.sh
```

**What this does:**
- Updates the Ubuntu system
- Installs Docker and Docker Compose
- Sets up firewall rules
- Creates necessary directories
- Configures system optimization

**Verification:**
```bash
ssh root@YOUR_SERVER_IP 'docker --version && docker compose version'
```

### Step 2: Frontend Deployment

Deploy the frontend application with SSL certificates:

```bash
./first-time-setup/02-deploy-frontend.sh
```

**What this does:**
- Builds the React frontend application
- Sets up nginx-proxy with automatic SSL
- Deploys static files with proper permissions
- Configures SPA routing for client-side navigation
- Sets up Let's Encrypt automatic certificate renewal

**Verification:**
```bash
curl -I https://YOUR_DOMAIN
curl -I https://YOUR_DOMAIN/dashboard
curl -I https://YOUR_DOMAIN/aureto-logo.png
```

### Step 3: Backend and Database Deployment

Deploy the backend API and PostgreSQL database:

```bash
./first-time-setup/03-deploy-backend.sh
```

**What this does:**
- Builds the Node.js backend application
- Sets up PostgreSQL with persistent volume
- Runs database migrations
- Configures API routing through nginx-proxy
- Sets up health monitoring

**Verification:**
```bash
curl https://YOUR_DOMAIN/api/users/me
curl https://YOUR_DOMAIN/api/health  # Should return 404 (expected)
curl -X POST https://YOUR_DOMAIN/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass","name":"Test User"}'
```

---

## 🔄 Updates and Patches

### Frontend-Only Updates

When you only change frontend code:

```bash
./patches/update-frontend.sh
```

**Use cases:**
- UI/UX changes
- New React components
- Styling updates
- Client-side routing changes

### Backend-Only Updates

When you only change backend code:

```bash
./patches/update-backend.sh
```

**Use cases:**
- API endpoint changes
- Business logic updates
- Database schema changes
- Authentication improvements

### Full-Stack Updates

When you change both frontend and backend:

```bash
./patches/update-full-stack.sh
```

**Use cases:**
- Major feature releases
- Breaking changes
- Database migrations with UI updates

---

## 🛠️ Maintenance Operations

### Database Backup

Create a backup of your database:

```bash
./patches/maintenance/backup-database.sh
```

**Output**: Creates timestamped backup files in `/root/backups/`

### Database Restore

Restore from a backup:

```bash
./patches/maintenance/restore-database.sh /path/to/backup.sql
```

### Service Restart

Restart all services:

```bash
./patches/maintenance/restart-services.sh
```

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. SSL Certificate Issues
```bash
# Check certificate status
ssh root@YOUR_SERVER_IP 'docker logs nginx-proxy-acme'

# Force certificate renewal
ssh root@YOUR_SERVER_IP 'docker exec nginx-proxy-acme /app/force_renew'
```

#### 2. Backend API Not Working
```bash
# Check backend logs
ssh root@YOUR_SERVER_IP 'cd /tmp/spendwise-backend-deploy && docker compose logs backend'

# Check backend health
ssh root@YOUR_SERVER_IP 'docker exec spendwise-backend curl http://localhost:5000/health'
```

#### 3. Database Connection Issues
```bash
# Check database status
ssh root@YOUR_SERVER_IP 'cd /tmp/spendwise-backend-deploy && docker compose ps postgres'

# Check database logs
ssh root@YOUR_SERVER_IP 'cd /tmp/spendwise-backend-deploy && docker compose logs postgres'
```

#### 4. Frontend 404 on Routes
```bash
# Check nginx config
ssh root@YOUR_SERVER_IP 'docker exec spendwise-frontend cat /etc/nginx/conf.d/default.conf'

# Should contain: try_files $uri $uri/ /index.html;
```

### Service Management Commands

```bash
# Check all container status
ssh root@YOUR_SERVER_IP 'docker ps'

# View nginx-proxy config
ssh root@YOUR_SERVER_IP 'docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf'

# Check disk usage
ssh root@YOUR_SERVER_IP 'df -h'

# Check memory usage
ssh root@YOUR_SERVER_IP 'free -h'
```

---

## 📊 Monitoring and Health Checks

### Automated Health Checks

The deployment includes built-in health monitoring:

- **Frontend**: Nginx serves static files with 99.9% uptime
- **Backend**: Health endpoint at `/health` with Docker health checks
- **Database**: PostgreSQL with connection monitoring
- **SSL**: Automatic certificate renewal every 60 days

### Manual Health Verification

```bash
# Full stack health check
curl -s https://YOUR_DOMAIN | grep -q "SpendWise" && echo "Frontend: ✅"
curl -s https://YOUR_DOMAIN/api/users/me | grep -q "Unauthorized" && echo "Backend: ✅"
```

---

## 🔐 Security Considerations

### Implemented Security Measures

1. **HTTPS Only**: All traffic encrypted with Let's Encrypt
2. **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
3. **Firewall**: Only ports 22, 80, 443 accessible
4. **Container Isolation**: Services run in separate containers
5. **Non-root Users**: Backend runs as non-privileged user
6. **Persistent Volumes**: Database data survives container restarts

### Additional Security Recommendations

1. **Regular Updates**: Keep the server and Docker images updated
2. **Backup Strategy**: Regular database backups to external storage
3. **Monitoring**: Set up log monitoring and alerting
4. **SSH Keys**: Use SSH keys instead of password authentication
5. **Fail2ban**: Consider installing fail2ban for SSH protection

---

## 🎯 Success Checklist

After deployment, verify these items:

- [ ] Frontend loads at https://YOUR_DOMAIN
- [ ] All routes work (/, /dashboard, /login, etc.)
- [ ] All assets load (logos, icons, stylesheets)
- [ ] SSL certificate is valid and auto-renewing
- [ ] API endpoints respond correctly
- [ ] User registration and login work
- [ ] Database persists data across restarts
- [ ] No console errors in browser
- [ ] Mobile responsiveness works
- [ ] Performance is acceptable (< 3s load time)

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the service logs using the provided commands
3. Ensure all prerequisites are met
4. Verify your domain DNS settings

## 🔄 Update Process

For future updates:

1. **Test Locally**: Always test changes in development first
2. **Backup**: Create database backup before major updates
3. **Deploy**: Use appropriate patch script for your changes
4. **Verify**: Run health checks after deployment
5. **Monitor**: Watch logs for any issues post-deployment

---

**🎉 Congratulations! Your SpendWise application is now live and production-ready!**
