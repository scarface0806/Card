# 🔐 Admin Local Login - Quick Reference

## One-Line Setup
```bash
npm run setup:local
```

## Admin Credentials
```
Email:    admin@tapvyo.com
Password: admin123
Role:     ADMIN
```

## Access Points

| Path | URL | Purpose |
|------|-----|---------|
| Dashboard | `http://localhost:3000/admin` | Main admin panel |
| Customers | `http://localhost:3000/admin/customers` | Customer management |
| Orders | `http://localhost:3000/admin/orders` | Order tracking |
| Products | `http://localhost:3000/admin/products` | Product catalog |
| Newsletter | `http://localhost:3000/admin/newsletter` | Email campaigns |
| Login | `http://localhost:3000/login` | Authentication page |

## Step-by-Step Login

### 1️⃣ Setup Admin User
```bash
npm run prisma:seed
```

### 2️⃣ Start Server
```bash
npm run dev
```

### 3️⃣ Visit Login Page
```
http://localhost:3000/login
```

### 4️⃣ Enter Credentials
```
Email:    admin@tapvyo.com
Password: admin123
```

### 5️⃣ Access Dashboard
```
http://localhost:3000/admin
```

---

## API Testing

### Get Auth Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tapvyo.com","password":"admin123"}'
```

### Use Token for Admin API
```bash
curl -X GET http://localhost:3000/api/admin/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run prisma:seed` | Create admin user |
| `npm run setup:local` | Full local setup (seed + build) |
| `npm run start` | Run production build |

---

## Troubleshooting

**Q: "Invalid credentials" error**  
A: Run `npm run prisma:seed` to create admin user

**Q: Can't access dashboard**  
A: Clear cookies, try incognito window, restart dev server

**Q: "Database connection error"**  
A: Ensure MongoDB is running and `DATABASE_URL` is set in `.env.local`

---

## 🚀 Ready to Login!

You now have everything needed for local admin access. Display the credentials above or share this file with your team for quick reference.

**Remember:** These credentials are for **local development only**. Change passwords in production!
