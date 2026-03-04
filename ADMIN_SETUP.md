# Admin User Setup Guide

## Overview
This document explains how to create the default admin user for local development and testing.

## Default Admin Credentials
- **Email**: `admin@tapvyo.com`
- **Password**: `admin123`
- **Role**: `ADMIN`

## How to Run the Seed Script

### Method 1: Using npm (Recommended)
```bash
npm run prisma:seed
```

### Method 2: Direct ts-node execution
```bash
npm run seed
```

## What the Seed Script Does

1. ✅ **Checks for existing admin** - Prevents duplicate admin creation
2. ✅ **Hashes password** - Uses bcryptjs with 12 salt rounds (same as production auth)
3. ✅ **Creates admin user** - With full ADMIN role privileges
4. ✅ **Logs credentials** - Displays admin details in terminal for easy reference
5. ✅ **Handles errors gracefully** - Proper error messages and cleanup

## Expected Output

```
============================================================
✅ ADMIN USER CREATED SUCCESSFULLY
============================================================

📧 Email:    admin@tapvyo.com
🔐 Password: admin123
👤 Name:     Admin
🎯 Role:     ADMIN
✨ Status:   Active
📅 Created:  [timestamp]

============================================================
⚠️  IMPORTANT: CHANGE THIS PASSWORD IN PRODUCTION!
⚠️  This seed should only be used for local development.
============================================================
```

## Running the Full Seed Setup

To run the seed after database setup:

```bash
# 1. Ensure .env.local has DATABASE_URL pointing to your MongoDB instance
# 2. Run the seed script
npm run prisma:seed
```

## Security Notes

⚠️ **CRITICAL FOR PRODUCTION:**
- This seed script should **NEVER** be run in production
- The default credentials are for **local development only**
- Always change the admin password immediately in production
- Use strong, unique passwords (minimum 12 characters with mixed case, numbers, symbols)

## Troubleshooting

### Seed script fails with "database connection error"
- Ensure MongoDB is running
- Check `DATABASE_URL` in `.env.local`
- Verify database credentials are correct

### Admin user already exists
- The script is working correctly - it prevents duplicates
- If you need to reset, delete the user from MongoDB manually or use:
  ```bash
  npx prisma db push --skip-generate
  ```

### Password hashing takes time
- First run may take longer due to bcryptjs hashing (normal behavior)
- Subsequent runs are instant since duplicate check prevents re-hashing

## Manual Admin Creation

If you prefer to create an admin user manually:

```bash
npx prisma studio  # Opens Prisma GUI
# Navigate to Users table and create a new user with:
# - email: admin@tapvyo.com
# - password: [use bcryptjs to hash "admin123"]
# - role: ADMIN
# - isActive: true
```

## After Setup

Once the admin user is created:

1. Start the development server: `npm run dev`
2. Navigate to login page: `http://localhost:3000/login`
3. Login with admin credentials
4. Access admin dashboard: `http://localhost:3000/admin`
5. Change password immediately (implement password change feature)

---

**Created**: March 3, 2026
**Last Updated**: Production Refactoring Session
