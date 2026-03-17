@echo off
REM Start Tapvyo NFC with In-Memory MongoDB

cd /d "%~dp0.."

echo.
echo 🚀 Starting Tapvyo NFC Development Server
echo.
echo 📦 Starting in-memory MongoDB and seeding admin user...
echo.

REM Set environment variable for MongoDB Memory Server
set MONGODB_MEMORY_SERVER_DOWNLOAD_BINARIES=true

REM Run seed and dev
call npm run prisma:seed
if errorlevel 1 (
    echo ⚠️  Seed warning (non-critical)
)

echo.
echo 🔥 Starting Next.js development server...
echo 📱 App will be available at: http://localhost:3000
echo.
echo Test login credentials:
echo   Email: admin@tapvyo.com
echo   Password: admin123
echo.

npm run dev

pause
