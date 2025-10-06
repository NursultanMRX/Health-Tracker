@echo off
REM Railway.app Quick Deploy Script for Windows
REM Run this from your project directory

echo ========================================
echo Railway.app Deployment for Health Tracker
echo ========================================
echo.

echo Checking Railway CLI installation...
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Railway CLI not found!
    echo.
    echo Install Railway CLI first:
    echo   PowerShell: iwr https://railway.app/install.ps1 ^| iex
    echo.
    pause
    exit /b 1
)

echo Railway CLI found!
echo.

echo Step 1: Logging in to Railway...
railway login
if %errorlevel% neq 0 (
    echo Login failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Initializing Railway project...
railway init
if %errorlevel% neq 0 (
    echo Already initialized or error occurred
)

echo.
echo Step 3: Setting environment variables...
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set API_URL=https://health-tracker-production-598b.up.railway.app/api
railway variables set CORS_ORIGIN=https://health-tracker-production-598b.up.railway.app
railway variables set VITE_API_URL=https://health-tracker-production-598b.up.railway.app/api
railway variables set DATABASE_PATH=./diabetes.db

echo.
echo Step 4: Deploying to Railway...
railway up

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Your app is available at:
echo https://health-tracker-production-598b.up.railway.app
echo.
echo View logs: railway logs
echo Open app: railway open
echo.
pause
