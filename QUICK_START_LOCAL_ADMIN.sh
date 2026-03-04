#!/bin/bash

# 🚀 TAPVYO NFC - ADMIN LOCAL LOGIN SETUP
# Copy-paste commands for quick local admin access

# ============================================================================
# STEP 1: Create Admin User (First Time Only)
# ============================================================================
# Run this ONCE to create the admin user account in your database

npm run prisma:seed

# Expected output:
# ============================================================
# ✅ ADMIN USER CREATED SUCCESSFULLY
# ============================================================
# 📧 Email:    admin@tapvyo.com
# 🔐 Password: admin123
# 👤 Name:     Admin
# 🎯 Role:     ADMIN
# ✨ Status:   Active
# ============================================================


# ============================================================================
# STEP 2: Start Development Server
# ============================================================================
# Run this to start the Next.js dev server on localhost:3000

npm run dev

# Watch for message: "Ready in [time] ms"
# Dev server URL: http://localhost:3000


# ============================================================================
# STEP 3: Open Browser & Login
# ============================================================================
# Open your web browser to the login page:

# Login Page: http://localhost:3000/login

# Then enter:
# Email:    admin@tapvyo.com
# Password: admin123

# Click "Login" and you'll be redirected to admin dashboard


# ============================================================================
# STEP 4: Access Admin Dashboard
# ============================================================================
# After successful login, you can access:

# Main Dashboard:   http://localhost:3000/admin
# Customers:        http://localhost:3000/admin/customers
# Orders:           http://localhost:3000/admin/orders
# Products:         http://localhost:3000/admin/products
# Newsletter:       http://localhost:3000/admin/newsletter


# ============================================================================
# OPTIONAL: Quick Setup (Do Both Steps 1+2 Automatically)
# ============================================================================
# Instead of running Step 1 and 2 separately, run this:

npm run setup:local

# This will:
# 1. Create admin user
# 2. Verify build works
# 3. Show you the credentials and next steps


# ============================================================================
# OPTIONAL: Test Admin API (Using cURL)
# ============================================================================

# Get authentication token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tapvyo.com","password":"admin123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

# Use token to call admin API
curl -X GET http://localhost:3000/api/admin/customers \
  -H "Authorization: Bearer $TOKEN"


# ============================================================================
# QUICK REFERENCE: Admin Credentials
# ============================================================================

# Email:    admin@tapvyo.com
# Password: admin123
# Role:     ADMIN

# Remember: These are for LOCAL DEVELOPMENT ONLY
# ⚠️  Change password in production!


# ============================================================================
# TROUBLESHOOTING
# ============================================================================

# If you get "database connection error":
#   → Make sure MongoDB is running locally
#   → Check .env.local has DATABASE_URL set

# If you get "invalid credentials" at login:
#   → Run: npm run prisma:seed
#   → Restart dev server: npm run dev
#   → Clear browser cookies and try again

# If dashboard won't load:
#   → Open JavaScript console (F12)
#   → Check for any error messages
#   → Restart dev server
#   → Try incognito/private window


# ============================================================================
# DOCUMENTATION FILES
# ============================================================================

# Read these files for detailed information:
#
# QUICK_LOGIN.md                      - Quick reference card
# LOCAL_ADMIN_LOGIN.md                - Detailed login guide with API examples
# ADMIN_SETUP.md                      - Complete setup documentation
# ADMIN_LOCAL_LOGIN_COMPLETE.md       - Comprehensive guide (this file)


echo "✅ Ready to setup admin local login!"
echo ""
echo "Run this command first:"
echo "  npm run setup:local"
echo ""
echo "Then:"
echo "  npm run dev"
echo ""
echo "Then visit:"
echo "  http://localhost:3000/login"
echo ""
