@echo off
echo Setting up local development environment...

REM Create .env file for local development
(
echo NODE_ENV=development
echo PORT=3001
echo API_URL=http://localhost:3001/api
echo VITE_API_URL=http://localhost:3001/api
echo CORS_ORIGIN=http://localhost:5173
) > .env

echo ✓ Created .env file for local development
echo ✓ API_URL set to: http://localhost:3001/api
echo ✓ VITE_API_URL set to: http://localhost:3001/api
echo ✓ CORS_ORIGIN set to: http://localhost:5173

echo.
echo To start development:
echo 1. Run 'npm run dev' in one terminal ^(for frontend^)
echo 2. Run 'npm run server' in another terminal ^(for backend^)
echo.
echo The frontend will be available at http://localhost:5173
echo The backend API will be available at http://localhost:3001
pause
