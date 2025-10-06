@echo off
echo Redeploying to Railway...
echo.

echo Step 1: Checking Railway CLI...
railway --version
if %errorlevel% neq 0 (
    echo Railway CLI not found. Please install it first.
    echo Visit: https://docs.railway.app/develop/cli
    pause
    exit /b 1
)

echo.
echo Step 2: Logging into Railway...
railway login

echo.
echo Step 3: Linking to your project...
railway link

echo.
echo Step 4: Setting environment variables...
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set CORS_ORIGIN=https://health-tracker-production-598b.up.railway.app

echo.
echo Step 5: Deploying...
railway up

echo.
echo Deployment complete! Check your Railway dashboard for status.
echo Your app should be available at: https://health-tracker-production-598b.up.railway.app
pause
