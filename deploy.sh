#!/bin/bash

# Health Tracker Production Deployment Script
# This script helps deploy the application to production

echo "🚀 Health Tracker Production Deployment"
echo "========================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your production values"
    echo "   - API_URL: Your production API URL"
    echo "   - CORS_ORIGIN: Your production frontend URL"
    echo "   - NODE_ENV: production"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend built successfully!"

# Initialize database if it doesn't exist
if [ ! -f "diabetes.db" ]; then
    echo "🗄️  Initializing database..."
    node server.js
    node init-sqlite-data.js
    echo "✅ Database initialized!"
fi

# Start production server
echo "🚀 Starting production server..."
echo "   - Frontend: Built and ready"
echo "   - Backend: Starting on port ${PORT:-3001}"
echo "   - API URL: ${API_URL:-http://localhost:3001/api}"

# Start the server
npm start
