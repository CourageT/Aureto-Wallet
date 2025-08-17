# SpendWise Production Deployment Guide

## 🚀 Overview
This folder contains all scripts and documentation needed to deploy SpendWise to production servers. The deployment supports both first-time setup and ongoing updates.

## 📁 Folder Structure
```
deployments/
├── README.md                    # This guide
├── DEPLOYMENT_GUIDE.md          # Detailed deployment instructions
├── first-time-setup/            # Scripts for initial deployment
│   ├── 01-setup-server.sh       # Server preparation and Docker setup
│   ├── 02-deploy-frontend.sh    # Frontend deployment with nginx-proxy
│   └── 03-deploy-backend.sh     # Backend and database deployment
└── patches/                     # Scripts for updates and maintenance
    ├── update-frontend.sh        # Frontend-only updates
    ├── update-backend.sh         # Backend-only updates
    ├── update-full-stack.sh      # Complete application update
    └── maintenance/               # Maintenance scripts
        ├── backup-database.sh    # Database backup
        ├── restore-database.sh   # Database restore
        └── restart-services.sh   # Service restart
```

## 🎯 Quick Start

### First Time Deployment
1. **Server Setup**: Run `./first-time-setup/01-setup-server.sh`
2. **Frontend Deploy**: Run `./first-time-setup/02-deploy-frontend.sh`
3. **Backend Deploy**: Run `./first-time-setup/03-deploy-backend.sh`

### Updates
- **Frontend Only**: `./patches/update-frontend.sh`
- **Backend Only**: `./patches/update-backend.sh`
- **Full Stack**: `./patches/update-full-stack.sh`

## 📋 Prerequisites
- Ubuntu 24.04 server with root access
- Domain name pointed to your server IP
- SSH key-based authentication configured

## 🔧 Configuration
Update these variables in the deployment scripts:
- `SERVER_IP`: Your server IP address
- `DOMAIN`: Your domain name (e.g., cougeon.co.zw)
- `EMAIL`: Your email for Let's Encrypt certificates

## 📚 Documentation
See `DEPLOYMENT_GUIDE.md` for detailed step-by-step instructions.

## 🎉 Success Criteria
After successful deployment, you should have:
- ✅ HTTPS website at your domain
- ✅ Working frontend SPA with proper routing
- ✅ Functional backend API endpoints
- ✅ PostgreSQL database with persistent storage
- ✅ Automatic SSL certificate renewal
- ✅ All static assets loading correctly
