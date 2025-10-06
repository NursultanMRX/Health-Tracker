#!/bin/bash

# Railway.app Quick Deploy Script for Linux/Mac
# Run this from your project directory

set -e

echo "========================================"
echo "🚂 Railway.app Deployment for Health Tracker"
echo "========================================"
echo ""

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo ""
    echo "Install Railway CLI first:"
    echo "  curl -fsSL https://railway.app/install.sh | sh"
    echo ""
    exit 1
fi

echo "✅ Railway CLI found!"
echo ""

# Login
echo "🔐 Step 1: Logging in to Railway..."
railway login

# Initialize
echo ""
echo "📦 Step 2: Initializing Railway project..."
railway init || true

# Set environment variables
echo ""
echo "⚙️  Step 3: Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set API_URL=https://health-tracker-production-598b.up.railway.app/api
railway variables set CORS_ORIGIN=https://health-tracker-production-598b.up.railway.app
railway variables set VITE_API_URL=https://health-tracker-production-598b.up.railway.app/api
railway variables set DATABASE_PATH=./diabetes.db

# Deploy
echo ""
echo "🚀 Step 4: Deploying to Railway..."
railway up

echo ""
echo "========================================"
echo "✅ Deployment Complete!"
echo "========================================"
echo ""
echo "🌐 Your app is available at:"
echo "   https://health-tracker-production-598b.up.railway.app"
echo ""
echo "📊 Useful commands:"
echo "   railway logs    - View logs"
echo "   railway open    - Open app in browser"
echo "   railway status  - Check deployment status"
echo ""
