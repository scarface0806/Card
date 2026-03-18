# Quick Reference - Admin Auto-Create Environment Setup

## 🚀 Quick Setup

### Step 1: Add Environment Variables

#### For Local Development (`.env.local`)
```bash
# Database
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/tapvyo

# Auth
JWT_SECRET=your-jwt-secret-key

# Admin Auto-Create (Optional - defaults to admin@local.dev / admin123456)
DEFAULT_ADMIN_EMAIL=admin@local.dev
DEFAULT_ADMIN_PASSWORD=admin123456
```

#### For Vercel Production
```
Dashboard → Project Settings → Environment Variables

DEFAULT_ADMIN_EMAIL  →  your-admin@example.com
DEFAULT_ADMIN_PASSWORD  →  your-secure-password
```

### Step 2: Deploy

```bash
git add .
git commit -m "auto create admin if missing"
git push
```

### Step 3: Test Login

1. Go to http://localhost:3000/admin/login (local) or your Vercel URL
2. Enter email and password from environment variables
3. Admin should be auto-created and login succeeds
4. Check MongoDB Atlas → admins collection to verify

---

## ✅ Verification

After login, verify:
- [ ] Admin created in MongoDB (check admins collection)
- [ ] Auth token received and stored in cookies
- [ ] Can access /admin/dashboard
- [ ] Subsequent logins work

---

## 📋 Environment Variable Reference

| Variable | Scope | Purpose | Example |
|----------|-------|---------|---------|
| `DEFAULT_ADMIN_EMAIL` | Development + Production | Auto-create admin email | `admin@example.com` |
| `DEFAULT_ADMIN_PASSWORD` | Development + Production | Auto-create admin password | `MyPassword123!` |
| `DATABASE_URL` | Development + Production | MongoDB Atlas connection | `mongodb+srv://...` |
| `JWT_SECRET` | Development + Production | Token signing secret | `your-secret-key` |

---

## 🔒 Security Best Practices

✅ **DO:**
- Use strong passwords (min 16 characters recommended)
- Store passwords in Vercel environment variables, never in code
- Rotate admin password periodically
- Use `.env.local` for local development only
- Never commit `.env` files to git

❌ **DON'T:**
- Hardcode passwords in source code
- Use weak passwords (less than 8 characters)
- Share admin credentials in chat/email
- Commit `.env` files to repository

---

## 🐛 Troubleshooting

### "Admin not found" Error
```
Solution:
1. Check DEFAULT_ADMIN_EMAIL is set correctly
2. Check DEFAULT_ADMIN_PASSWORD is set correctly
3. Verify DATABASE_URL connection
4. Check MongoDB Atlas allows your IP
```

### Admin Not Auto-Created
```
Possible Causes:
1. Environment variables not set
2. MongoDB connection failed
3. Email already exists (different case)

Check logs:
- Local: console output in terminal
- Vercel: Vercel Dashboard → Deployments → Logs
```

### "Too many login attempts"
```
The rate limiter is working correctly (10 attempts per period in production).
Wait a few minutes before retrying.
```

---

## 📝 Logging

When auto-create runs, you'll see:

**Success:**
```
[Admin Auto-Create] Default admin created successfully {
  id: "507f1f77bcf86cd799439011",
  email: "admin@example.com"
}
```

**Already Exists:**
```
[Admin Auto-Create] Admin already exists, skipping creation
```

**No Configuration:**
```
[Admin Auto-Create] Skipped: Missing credentials in environment
```

---

## 🔄 How Auto-Create Works

```
1. Admin login attempt
   ↓
2. ensureDefaultAdminExists() runs
   ├─ Checks if DEFAULT_ADMIN_EMAIL/PASSWORD configured
   ├─ Returns if admin already exists
   └─ Creates admin with bcrypt hashed password if missing
   ↓
3. Normal login process continues
   ├─ Validates credentials
   ├─ Generates JWT token
   └─ Sets auth cookies
   ↓
4. Login succeeds
```

---

## 📚 More Information

- **Full Documentation:** `docs/ADMIN_AUTO_CREATE.md`
- **Implementation Summary:** `docs/ADMIN_AUTO_CREATE_SUMMARY.md`
- **Code:** `app/api/admin/login/route.ts`

---

## ✨ Features

✅ Automatic admin creation  
✅ Duplicate prevention  
✅ Bcrypt password hashing  
✅ Case-insensitive email matching  
✅ Comprehensive logging  
✅ Rate limiting preserved  
✅ Production ready  
✅ Vercel compatible  
✅ Zero breaking changes  
✅ Fallback safety net  

---

**Status:** ✅ Production Ready  
**Build:** ✅ Passed (Exit Code 0)  
**Deployment:** Ready to deploy  
**Testing:** Verified locally with MongoDB
