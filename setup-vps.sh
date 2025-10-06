#!/bin/bash

# Health Tracker - VPS Initial Setup Script
# Run this script FIRST on your fresh Yandex Cloud VPS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔧 Health Tracker VPS Setup${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ] && [ -z "$SUDO_USER" ]; then
    echo -e "${RED}❌ Please run with sudo: sudo bash setup-vps.sh${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📊 System Information:${NC}"
echo -e "   OS: $(lsb_release -d | cut -f2)"
echo -e "   Kernel: $(uname -r)"
echo -e "   Architecture: $(uname -m)"

echo ""
echo -e "${YELLOW}🔄 Step 1: Updating system...${NC}"
apt update && apt upgrade -y
echo -e "${GREEN}✅ System updated${NC}"

echo ""
echo -e "${YELLOW}📦 Step 2: Installing essential packages...${NC}"
apt install -y curl wget git build-essential software-properties-common
echo -e "${GREEN}✅ Essential packages installed${NC}"

echo ""
echo -e "${YELLOW}🟢 Step 3: Installing Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
echo -e "${GREEN}✅ Node.js $(node --version) installed${NC}"
echo -e "${GREEN}✅ NPM $(npm --version) installed${NC}"

echo ""
echo -e "${YELLOW}⚡ Step 4: Installing PM2...${NC}"
npm install -g pm2
echo -e "${GREEN}✅ PM2 $(pm2 --version) installed${NC}"

echo ""
echo -e "${YELLOW}🌐 Step 5: Installing Nginx...${NC}"
apt install -y nginx
systemctl start nginx
systemctl enable nginx
echo -e "${GREEN}✅ Nginx installed and started${NC}"

echo ""
echo -e "${YELLOW}🗄️  Step 6: Installing SQLite3...${NC}"
apt install -y sqlite3
echo -e "${GREEN}✅ SQLite3 $(sqlite3 --version) installed${NC}"

echo ""
echo -e "${YELLOW}🔥 Step 7: Configuring firewall (UFW)...${NC}"
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3001/tcp  # For testing
echo -e "${GREEN}✅ Firewall configured${NC}"

echo ""
echo -e "${YELLOW}📁 Step 8: Creating application directory...${NC}"
mkdir -p /home/ubuntu/Health-Tracker
chown -R ubuntu:ubuntu /home/ubuntu/Health-Tracker
echo -e "${GREEN}✅ Application directory created${NC}"

echo ""
echo -e "${YELLOW}🔐 Step 9: Setting up swap (for low memory VPS)...${NC}"
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo -e "${GREEN}✅ 2GB swap created${NC}"
else
    echo -e "${GREEN}✅ Swap already exists${NC}"
fi

echo ""
echo -e "${YELLOW}⚙️  Step 10: Optimizing system settings...${NC}"

# Increase file descriptors
cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
EOF

# Optimize sysctl
cat >> /etc/sysctl.conf << EOF
# Network optimization
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_tw_reuse = 1
EOF
sysctl -p

echo -e "${GREEN}✅ System optimized${NC}"

echo ""
echo -e "${YELLOW}🔧 Step 11: Installing additional tools...${NC}"
apt install -y htop ncdu unzip
echo -e "${GREEN}✅ Additional tools installed${NC}"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ VPS Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}"

echo ""
VPS_IP=$(curl -s ifconfig.me)
echo -e "${GREEN}🌐 Your VPS IP Address: $VPS_IP${NC}"

echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo -e "${YELLOW}1. Upload your application:${NC}"
echo -e "   ${BLUE}# From your local machine:${NC}"
echo -e "   scp -r /path/to/Health-Tracker ubuntu@$VPS_IP:/home/ubuntu/"
echo ""
echo -e "${YELLOW}   OR clone from Git:${NC}"
echo -e "   ${BLUE}# On VPS:${NC}"
echo -e "   cd /home/ubuntu"
echo -e "   git clone https://github.com/YOUR_USERNAME/Health-Tracker.git"
echo ""
echo -e "${YELLOW}2. Create environment files:${NC}"
echo -e "   ${BLUE}# On VPS:${NC}"
echo -e "   cd /home/ubuntu/Health-Tracker"
echo -e "   nano .env"
echo -e "   ${GREEN}# Add:${NC}"
echo -e "   NODE_ENV=production"
echo -e "   PORT=3001"
echo -e "   API_URL=http://$VPS_IP:3001/api"
echo -e "   CORS_ORIGIN=http://$VPS_IP"
echo ""
echo -e "   nano .env.production"
echo -e "   ${GREEN}# Add:${NC}"
echo -e "   VITE_API_URL=http://$VPS_IP:3001/api"
echo ""
echo -e "${YELLOW}3. Run deployment script:${NC}"
echo -e "   cd /home/ubuntu/Health-Tracker"
echo -e "   bash deploy-to-vps.sh"
echo ""
echo -e "${YELLOW}📊 Useful Commands:${NC}"
echo -e "   htop                    - Monitor system resources"
echo -e "   pm2 monit              - Monitor PM2 processes"
echo -e "   sudo ufw status        - Check firewall status"
echo -e "   sudo systemctl status nginx - Check Nginx status"
echo ""
echo -e "${GREEN}🎉 Your VPS is ready for deployment!${NC}"
