@echo off
REM Quick MongoDB Setup for Tapvyo NFC
REM This script downloads and extracts MongoDB portable version

setlocal enabledelayedexpansion

echo Setting up MongoDB locally...
echo.

REM Check if mongod already exists
if exist "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" (
    echo MongoDB found! Starting...
    "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "%USERPROFILE%\MongoDBData"
    goto end
)

REM Create data directory
if not exist "%USERPROFILE%\MongoDBData" (
    mkdir "%USERPROFILE%\MongoDBData"
    echo Created MongoDB data directory
)

REM Offer manual download option
echo.
echo MongoDB is not installed. Please choose an option:
echo.
echo Option 1: Download MongoDB Community Edition manually
echo   - Visit: https://www.mongodb.com/try/download/community
echo   - Select Windows MSI
echo   - Run the installer
echo   - Choose "Install MongoDB as a Service" during setup
echo.
echo Option 2: Install via Chocolatey (if installed)
echo   choco install mongodb-community
echo.
echo Option 3: Use MongoDB Atlas when it's back online
echo   - Update .env with your Atlas connection string
echo.
echo After installing MongoDB, run this script again.
pause
:end
