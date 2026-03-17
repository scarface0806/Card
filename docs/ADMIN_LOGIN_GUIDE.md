# Admin Login System - Implementation Guide

## Overview

A modern, secure admin login system has been implemented for the Tapvyo NFC Business Cards application. The system includes:

- **Clean UI**: Modern, centered login card with gradient background
- **Form Validation**: Client-side and server-side validation
- **Security**: Rate limiting, password hashing, JWT tokens
- **Redirect Guard**: Automatic redirect if already logged in
- **Loading States**: Proper loading indicators and disabled states

## Files Created/Modified

### 1. Admin Login Page
**Location**: `/app/admin/login/page.tsx`
**Features**:
- Clean, modern UI design
- Automatic redirect if `admin_token` exists
- Uses reusable `AdminLoginForm` component
- Responsive design with TailwindCSS

### 2. Admin Login Form Component
**Location**: `/src/components/admin/AdminLoginForm.tsx`
**Features**:
- Form validation with React Hook Form
- Email and password validation
- Show/hide password toggle
- Loading states with spinner
- Error message display
- Calls `/api/admin/login` endpoint

### 3. Admin Login API
**Location**: `/app/api/admin/login/route.ts`
**Features**:
- Admin-only authentication (role: 'ADMIN')
- Rate limiting (10 attempts per minute)
- JWT token generation
- Secure HTTP-only cookies
- Comprehensive error handling

## Authentication Flow

### 1. Login Process
1. User enters email and password
2. Client-side validation checks format
3. POST request sent to `/api/admin/login`
4. Server validates credentials against database
5. JWT token generated and stored in `admin_token`
6. User redirected to `/admin/dashboard`

### 2. Security Features
- **Rate Limiting**: 10 login attempts per minute per IP
- **Admin Only**: Only users with `role: 'ADMIN'` can login
- **Password Hashing**: bcryptjs for secure password storage
- **JWT Tokens**: Secure, expiring tokens
- **Input Validation**: Zod schema validation

### 3. Redirect Guard
```javascript
useEffect(() => {
  const adminToken = localStorage.getItem('admin_token');
  if (adminToken) {
    router.push('/admin/dashboard');
  }
}, [router]);
```

## Form Validation Rules

### Email Field
- **Required**: Email is required
- **Format**: Valid email format (user@domain.com)
- **Placeholder**: `admin@example.com`

### Password Field
- **Required**: Password is required
- **Minimum Length**: 6 characters
- **Placeholder**: `Enter your password`
- **Toggle**: Show/hide password functionality

## API Endpoint Details

### POST /api/admin/login

**Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "ADMIN"
  },
  "token": "jwt_token_here"
}
```

**Error Responses**:
- **400**: Invalid input format
- **401**: Invalid credentials
- **403**: Account deactivated
- **429**: Too many attempts (rate limited)
- **500**: Server error

## Styling Details

### Color Scheme
- **Primary**: Blue (`bg-blue-600`, `hover:bg-blue-700`)
- **Background**: Gray gradient (`from-gray-50 to-gray-100`)
- **Card**: White with subtle shadow and border
- **Error**: Red accents for validation errors
- **Success**: Green accents (future enhancement)

### Layout
- **Full Screen Height**: `min-h-screen`
- **Centered**: `flex items-center justify-center`
- **Card Width**: `max-w-md`
- **Padding**: `p-8` on card, `p-8` on main
- **Responsive**: Mobile-friendly design

## Integration with Existing System

### Middleware Protection
The existing middleware in `/middleware.ts` already protects admin routes:
```javascript
const adminRoutes = [
  "/admin/dashboard",
  "/admin/customers",
  "/admin/cards",
  // ... other admin routes
];
```

### Token Storage
- **Client**: `localStorage.setItem('admin_token', token)`
- **Server**: HTTP-only cookie `admin-token`
- **Expiry**: 7 days

### Database Integration
Uses existing Prisma models:
- **User Model**: Already supports `role: 'ADMIN'`
- **Authentication**: Uses existing `hashPassword` and `verifyPassword` functions

## Usage Instructions

### 1. Create Admin User
Ensure you have an admin user in the database:
```javascript
await prisma.user.create({
  data: {
    email: 'admin@tapvyo.com',
    password: hashedPassword,
    role: 'ADMIN',
    name: 'Admin User',
    isActive: true
  }
});
```

### 2. Access Login Page
Navigate to: `http://localhost:3000/admin/login`

### 3. Login Credentials
- **Email**: Your admin email
- **Password**: Your admin password

### 4. Successful Login
Redirected to: `/admin/dashboard`

## Development Notes

### Environment Variables
Required for authentication:
- `JWT_SECRET`: Secret for JWT signing
- `DATABASE_URL`: MongoDB connection string

### Development Mode
The existing development mode with mock authentication still works for testing:
```javascript
if (process.env.NODE_ENV === 'development' && process.env.ENABLE_MOCK_AUTH === 'true') {
  // Mock admin login logic
}
```

### Future Enhancements
1. **Remember Me**: Extended session duration
2. **Two-Factor Authentication**: Enhanced security
3. **Password Reset**: Self-service password recovery
4. **Session Management**: Active session tracking
5. **Audit Logs**: Login attempt logging

## Testing

### Test Cases to Verify:
1. ✅ Valid admin login
2. ✅ Invalid credentials
3. ✅ Empty form submission
4. ✅ Invalid email format
5. ✅ Short password
6. ✅ Rate limiting
7. ✅ Redirect guard
8. ✅ Loading states
9. ✅ Password visibility toggle
10. ✅ Responsive design

### Manual Testing Steps:
1. Navigate to `/admin/login`
2. Try invalid credentials → Should show error
3. Try valid credentials → Should redirect to dashboard
4. Refresh dashboard with token → Should stay logged in
5. Access `/admin/login` with token → Should redirect to dashboard
6. Clear token and access admin routes → Should be blocked

## Security Considerations

### Implemented:
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Rate limiting
- ✅ Input validation and sanitization
- ✅ HTTPS-only cookies in production
- ✅ Admin role verification

### Recommendations:
- 🔒 Enable HTTPS in production
- 🔒 Use strong JWT secrets
- 🔒 Implement account lockout after failed attempts
- 🔒 Add CSRF protection
- 🔒 Regular security audits

---

This admin login system provides a secure, modern, and user-friendly authentication experience for the Tapvyo NFC Business Cards admin dashboard.
