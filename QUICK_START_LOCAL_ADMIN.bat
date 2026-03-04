@echo off
REM 🚀 TAPVYO NFC - ADMIN LOCAL LOGIN SETUP FOR WINDOWS
REM Copy-paste commands for quick local admin access

setlocal enabledelayedexpansion

cls
color 0A
echo.
echo ============================================================
echo  TAPVYO NFC - ADMIN LOCAL LOGIN SETUP WIZARD
echo ============================================================
echo.

:menu
echo Choose an option:
echo.
echo 1. Create Admin User (First time only)
echo 2. Start Development Server
echo 3. Full Setup (Create Admin + Build + Instructions)
echo 4. View Admin Credentials
echo 5. Open Login Page (requires running dev server)
echo 6. View Documentation
echo 0. Exit
echo.
set /p choice="Enter your choice (0-6): "

if "%choice%"=="1" goto create_admin
if "%choice%"=="2" goto start_dev
if "%choice%"=="3" goto full_setup
if "%choice%"=="4" goto show_creds
if "%choice%"=="5" goto open_login
if "%choice%"=="6" goto docs
if "%choice%"=="0" goto end
goto menu

:create_admin
cls
echo.
echo Creating Admin User...
echo.
call npm run prisma:seed
echo.
pause
goto menu

:start_dev
cls
echo.
echo Starting Development Server...
echo.
echo ✓ Server will be available at: http://localhost:3000
echo ✓ Press Ctrl+C to stop the server
echo.
call npm run dev
goto menu

:full_setup
cls
echo.
echo Running Full Setup...
echo.
call npm run setup:local
echo.
pause
goto menu

:show_creds
cls
echo.
echo ============================================================
echo  ADMIN CREDENTIALS
echo ============================================================
echo.
echo  Email:    admin@tapvyo.com
echo  Password: admin123
echo  Role:     ADMIN
echo.
echo ============================================================
echo.
pause
goto menu

:open_login
cls
echo.
echo Make sure dev server is running first!
echo.
echo Opening login page in browser...
echo.
start http://localhost:3000/login
timeout /t 2 /nobreak
goto menu

:docs
cls
echo.
echo ============================================================
echo  DOCUMENTATION
echo ============================================================
echo.
echo Available documentation files:
echo.
echo - QUICK_LOGIN.md
echo   Quick reference card with common commands
echo.
echo - LOCAL_ADMIN_LOGIN.md
echo   Detailed login guide with API examples
echo.
echo - ADMIN_SETUP.md
echo   Complete setup documentation
echo.
echo - ADMIN_LOCAL_LOGIN_COMPLETE.md
echo   Comprehensive guide with everything
echo.
echo Open these files with any text editor.
echo.
pause
goto menu

:end
cls
exit /b 0

REM =============================================================================
REM MANUAL SETUP INSTRUCTIONS (if not using this script)
REM =============================================================================
REM
REM STEP 1: Create Admin User
REM   Command: npm run prisma:seed
REM
REM STEP 2: Start Dev Server
REM   Command: npm run dev
REM
REM STEP 3: Login
REM   URL: http://localhost:3000/login
REM   Email: admin@tapvyo.com
REM   Password: admin123
REM
REM STEP 4: Access Dashboard
REM   URL: http://localhost:3000/admin
REM
REM =============================================================================
REM QUICK SETUP (One Command)
REM =============================================================================
REM
REM Instead of manual setup, just run:
REM   npm run setup:local
REM
REM This does everything for you automatically!
REM
REM =============================================================================
