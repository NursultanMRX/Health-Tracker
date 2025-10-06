#!/bin/bash

# Health Tracker - VPS Deployment Script
# This script automates the deployment process to Yandex Cloud VPS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🚀 Health Tracker VPS Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running on VPS
if [ ! -d "/home/ubuntu" ]; then
    echo -e "${YELLOW}⚠️  This script should be run on the VPS server${NC}"
    echo -e "${YELLOW}   Copy this script to your VPS first${NC}"
    exit 1
fi

# Variables
APP_DIR="/home/ubuntu/Health-Tracker"
NGINX_CONFIG="/etc/nginx/sites-available/health-tracker"
LOG_DIR="$APP_DIR/logs"

echo ""
echo -e "${YELLOW}📋 Step 1: Checking system requirements...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo -e "${YELLOW}   Installing Node.js 18.x...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}✅ Node.js $(node --version) found${NC}"
fi

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}   Installing PM2...${NC}"
    sudo npm install -g pm2
else
    echo -e "${GREEN}✅ PM2 $(pm2 --version) found${NC}"
fi

# Check Nginx
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}   Installing Nginx...${NC}"
    sudo apt install nginx -y
else
    echo -e "${GREEN}✅ Nginx found${NC}"
fi

echo ""
echo -e "${YELLOW}📦 Step 2: Installing dependencies...${NC}"
cd $APP_DIR
npm install

echo ""
echo -e "${YELLOW}🏗️  Step 3: Building frontend...${NC}"
npm run build

if [ ! -d "$APP_DIR/dist" ]; then
    echo -e "${RED}❌ Build failed! dist directory not created${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend built successfully${NC}"

echo ""
echo -e "${YELLOW}📁 Step 4: Creating logs directory...${NC}"
mkdir -p $LOG_DIR
echo -e "${GREEN}✅ Logs directory created${NC}"

echo ""
echo -e "${YELLOW}🗄️  Step 5: Initializing database...${NC}"
if [ ! -f "$APP_DIR/diabetes.db" ]; then
    echo -e "${YELLOW}   Starting server to initialize database...${NC}"
    node server.js &
    SERVER_PID=$!
    sleep 5
    kill $SERVER_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Database initialized${NC}"
else
    echo -e "${GREEN}✅ Database already exists${NC}"
fi

echo ""
echo -e "${YELLOW}🔄 Step 6: Starting application with PM2...${NC}"

# Stop existing instance if running
pm2 stop health-tracker 2>/dev/null || true
pm2 delete health-tracker 2>/dev/null || true

# Start with ecosystem config if available
if [ -f "$APP_DIR/ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --env production
else
    pm2 start server.js --name health-tracker --env production
fi

echo -e "${GREEN}✅ Application started${NC}"

echo ""
echo -e "${YELLOW}🌐 Step 7: Configuring Nginx...${NC}"

# Check if nginx config exists
if [ -f "$APP_DIR/nginx.conf" ]; then
    echo -e "${YELLOW}   Copying Nginx configuration...${NC}"

    # Get VPS IP
    VPS_IP=$(curl -s ifconfig.me)

    # Update nginx config with VPS IP
    sudo cp $APP_DIR/nginx.conf $NGINX_CONFIG
    sudo sed -i "s/YOUR_VPS_IP_OR_DOMAIN/$VPS_IP/g" $NGINX_CONFIG

    # Enable site
    sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/health-tracker

    # Remove default if exists
    sudo rm -f /etc/nginx/sites-enabled/default

    # Test nginx config
    if sudo nginx -t; then
        sudo systemctl restart nginx
        echo -e "${GREEN}✅ Nginx configured and restarted${NC}"
    else
        echo -e "${RED}❌ Nginx configuration error${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}   nginx.conf not found, skipping...${NC}"
fi

echo ""
echo -e "${YELLOW}🔥 Step 8: Configuring firewall...${NC}"
sudo ufw allow 22/tcp 2>/dev/null || true
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 443/tcp 2>/dev/null || true
echo -e "${GREEN}✅ Firewall configured${NC}"

echo ""
echo -e "${YELLOW}💾 Step 9: Setting up PM2 auto-restart...${NC}"
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true
echo -e "${GREEN}✅ PM2 configured for auto-restart${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}📊 Application Status:${NC}"
pm2 status

echo ""
VPS_IP=$(curl -s ifconfig.me)
echo -e "${GREEN}🌐 Access your application at:${NC}"
echo -e "${GREEN}   Frontend: http://$VPS_IP${NC}"
echo -e "${GREEN}   Backend API: http://$VPS_IP:3001/api${NC}"

echo ""
echo -e "${YELLOW}📝 Useful Commands:${NC}"
echo -e "   pm2 status              - Check application status"
echo -e "   pm2 logs health-tracker - View logs"
echo -e "   pm2 restart health-tracker - Restart application"
echo -e "   sudo systemctl restart nginx - Restart Nginx"

echo ""
echo -e "${YELLOW}⚠️  Important Next Steps:${NC}"
echo -e "   1. Update .env file with correct VPS IP: nano /home/ubuntu/Health-Tracker/.env"
echo -e "   2. Update .env.production file: nano /home/ubuntu/Health-Tracker/.env.production"
echo -e "   3. Rebuild frontend: cd /home/ubuntu/Health-Tracker && npm run build"
echo -e "   4. Restart PM2: pm2 restart health-tracker"

echo ""
echo -e "${GREEN}🎉 Happy deploying!${NC}"
