# Local Admin Login Guide

## Quick Start

### 1. Setup Admin User

```bash
# Run the database seed to create admin user
npm run prisma:seed
```

Expected output:
```
============================================================
✅ ADMIN USER CREATED SUCCESSFULLY
============================================================

📧 Email:    admin@tapvyo.com
🔐 Password: admin123
```

### 2. Start Development Server

```bash
npm run dev
```

Server runs at: `http://localhost:3000`

### 3. Login to Admin Dashboard

**Method A: Via Login Page**
1. Navigate to: `http://localhost:3000/login`
2. Enter credentials:
   - Email: `admin@tapvyo.com`
   - Password: `admin123`
3. Click "Login"
4. You'll be redirected to: `http://localhost:3000/admin`

**Method B: Direct Access (After Login)**
- Admin Dashboard: `http://localhost:3000/admin`
- Customers: `http://localhost:3000/admin/customers`
- Orders: `http://localhost:3000/admin/orders`
- Products: `http://localhost:3000/admin/products`
- Newsletter: `http://localhost:3000/admin/newsletter`

---

## Admin Credentials

| Field | Value |
|-------|-------|
| **Email** | `admin@tapvyo.com` |
| **Password** | `admin123` |
| **Role** | ADMIN |
| **Status** | Active |

---

## API Testing (Using cURL or Postman)

### 1. Login and Get Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tapvyo.com",
    "password": "admin123"
  }'
```

Expected response:
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "admin@tapvyo.com",
    "role": "ADMIN",
    "name": "Admin"
  }
}
```

### 2. Use Token for Admin API Calls

Store the token from login response, then use it in headers:

```bash
curl -X GET http://localhost:3000/api/admin/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Test Protected Admin Routes

```bash
# Get all customers
curl -X GET http://localhost:3000/api/admin/customers \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get all orders
curl -X GET http://localhost:3000/api/admin/orders \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get dashboard stats
curl -X GET http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## verify Admin Access

### Check Current User

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Should return:
```json
{
  "id": "...",
  "email": "admin@tapvyo.com",
  "role": "ADMIN",
  "name": "Admin",
  "isActive": true
}
```

---

## Troubleshooting

### "Invalid credentials" error
- Verify admin user was created: Check MongoDB for user with `admin@tapvyo.com`
- Run seed again: `npm run prisma:seed`
- Check `.env.local` has correct `DATABASE_URL`

### "Access Denied" or 403 error
- Token may be expired (tokens expire after time set in auth config)
- Re-login and get new token
- Verify Authorization header format: `Bearer TOKEN_HERE`

### Admin page shows "Unauthorized"
- Clear browser cookies/localStorage
- Try incognito/private window
- Restart dev server: `npm run dev`

### Seed script says "Admin user already exists"
- This means the admin is already in the database (expected on subsequent runs)
- If you need to reset, delete the user from MongoDB:
  ```bash
  db.users.deleteOne({ email: "admin@tapvyo.com" })
  ```

---

## Environment Variables

Ensure `.env.local` contains:

```bash
# Database
DATABASE_URL=mongodb://[user]:[password]@localhost:27017/tapvyo-nfc

# JWT Secret (for token signing)
JWT_SECRET=your_secure_jwt_secret_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## Testing Checklist

- [ ] Admin user created with `npm run prisma:seed`
- [ ] Dev server running: `npm run dev`
- [ ] Can login at `http://localhost:3000/login`
- [ ] Dashboard accessible at `http://localhost:3000/admin`
- [ ] Can view customers, orders, products, newsletter
- [ ] API token works for `/api/admin/*` routes
- [ ] Regular users cannot access `/admin` routes

---

## Security Notes (Development Only)

⚠️ **For Local Development ONLY:**
- Default credentials are insecure and hardcoded for convenience
- Never use these credentials in production
- Always use environment-specific strong passwords
- Rotate admin credentials regularly
- Use HTTPS in production

---

## Next Steps

1. Create additional test users (regular customers)
2. Test customer creation flow
3. Test order creation and management
4. Test newsletter functionality
5. Test product management

Run `npm run prisma:seed` again to validate the setup anytime.

---

**Last Updated**: March 3, 2026
**Status**: ✅ Production-Ready Local Setup
