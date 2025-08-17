#!/bin/bash
set -e

# Configuration - Update these values for your deployment
SERVER_IP="68.183.86.219"
SERVER_USER="root"
DOMAIN="cougeon.co.zw"

echo "🚀 SpendWise Server Setup - Step 1 of 3"
echo "📡 Setting up server at $SERVER_IP"

# SSH into server and run setup commands
ssh "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
#!/bin/bash
set -e

echo "📦 Updating system packages..."
apt update && apt upgrade -y

echo "🐳 Installing Docker..."
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Start and enable Docker
systemctl start docker
systemctl enable docker

echo "🔥 Setting up firewall..."
# Configure UFW firewall
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

echo "📁 Creating necessary directories..."
mkdir -p /root/backups
mkdir -p /root/logs

echo "⚡ Optimizing system performance..."
# Docker optimization
echo '{"log-driver": "json-file", "log-opts": {"max-size": "10m", "max-file": "3"}}' > /etc/docker/daemon.json
systemctl reload docker

# System optimization
echo "vm.swappiness=10" >> /etc/sysctl.conf
echo "net.core.rmem_max=134217728" >> /etc/sysctl.conf
echo "net.core.wmem_max=134217728" >> /etc/sysctl.conf
sysctl -p

echo "✅ Server setup completed successfully!"
echo "📊 System Information:"
echo "   Docker Version: $(docker --version)"
echo "   Docker Compose Version: $(docker compose version --short)"
echo "   Available Memory: $(free -h | grep '^Mem:' | awk '{print $2}')"
echo "   Available Disk: $(df -h / | tail -1 | awk '{print $4}')"
ENDSSH

echo ""
echo "✅ Server setup completed!"
echo "📝 Next steps:"
echo "   1. Run ./02-deploy-frontend.sh to deploy the frontend"
echo "   2. Run ./03-deploy-backend.sh to deploy the backend"
echo ""
echo "🔍 Verify setup:"
echo "   ssh $SERVER_USER@$SERVER_IP 'docker --version && docker compose version'"
