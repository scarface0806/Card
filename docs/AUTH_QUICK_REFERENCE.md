# Login & Signup - Quick Reference Guide

## 📖 Quick Code Reference

---

## 1️⃣ Using the Auth Service

### Login Implementation
```typescript
import { loginUser } from '@/services/auth';

// Call the login function
const response = await loginUser({
  email: 'user@example.com',
  password: 'password123'
});

if (response.success) {
  console.log('Login successful!', response.data.user);
  // Store token
  localStorage.setItem('authToken', response.data.token);
  // Redirect
  router.push('/dashboard');
} else {
  console.error('Login failed:', response.message);
}
```

### Signup Implementation
```typescript
import { registerUser } from '@/services/auth';

// Call the register function
const response = await registerUser({
  fullName: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  confirmPassword: 'password123'
});

if (response.success) {
  console.log('Signup successful!', response.data.user);
  localStorage.setItem('authToken', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  router.push('/onboarding');
} else {
  console.error('Signup failed:', response.message);
}
```

---

## 2️⃣ Form Validation Examples

### Email Validation
```typescript
register('email', {
  required: 'Email is required',
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'Invalid email address',
  },
})
```

### Password Validation
```typescript
register('password', {
  required: 'Password is required',
  minLength: {
    value: 6,
    message: 'Password must be at least 6 characters',
  },
})
```

### Confirm Password Validation
```typescript
const password = watch('password');

register('confirmPassword', {
  required: 'Please confirm your password',
  validate: (value) => value === password || 'Passwords do not match',
})
```

### Required Field
```typescript
register('fullName', {
  required: 'Full name is required',
  minLength: {
    value: 2,
    message: 'Name must be at least 2 characters',
  },
})
```

---

## 3️⃣ Tailwind CSS Classes Reference

### Input Styling
```tsx
// Normal state
className="border border-teal-200 rounded-xl px-4 py-3"

// Focus state
className="focus:outline-none focus:ring-2 focus:ring-teal-400"

// Combined with error handling
className={`w-full px-4 py-3 border rounded-xl ${
  errors.email ? 'border-red-500 focus:ring-red-400' : 'border-teal-200 focus:ring-teal-400'
}`}
```

### Button Styling
```tsx
// Primary button
className="bg-teal-700 text-white px-6 py-3 rounded-xl hover:bg-teal-800 transition-all duration-300"

// Text button
className="text-teal-700 hover:text-teal-900 font-medium transition-colors"

// Sign Up button (gradient effect)
className="bg-teal-700 hover:bg-teal-800 text-white rounded-full px-6 py-2.5 transition-all duration-300"
```

### Link Styling
```tsx
className="text-teal-700 font-semibold hover:text-teal-900 transition-colors"
```

### Error Message
```tsx
{errors.email && (
  <p className="text-sm text-red-500 mt-2">{errors.email.message}</p>
)}
```

---

## 4️⃣ Component Usage Examples

### Imports
```typescript
// Next.js & React
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

// Icons
import { Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react';

// Custom
import { loginUser, registerUser } from '@/services/auth';
import { ROUTES } from '@/utils/constants';
```

### useForm Setup
```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
  watch,
} = useForm<LoginFormData>({
  defaultValues: {
    email: '',
    password: '',
    rememberMe: false,
  },
});
```

### Form Submission
```typescript
const onSubmit = async (data: LoginFormData) => {
  setIsLoading(true);
  setServerError('');

  try {
    const response = await loginUser(data);
    
    if (response.success && response.data?.token) {
      localStorage.setItem('authToken', response.data.token);
      setTimeout(() => {
        router.push('/');
      }, 500);
    } else {
      setServerError(response.message);
    }
  } catch (error) {
    setServerError('An error occurred');
  } finally {
    setIsLoading(false);
  }
};
```

---

## 5️⃣ LocalStorage Usage

### Store Auth Token
```typescript
localStorage.setItem('authToken', token);
```

### Retrieve Auth Token
```typescript
const token = localStorage.getItem('authToken');
```

### Store User Data
```typescript
localStorage.setItem('user', JSON.stringify(user));
const user = JSON.parse(localStorage.getItem('user'));
```

### Store Remember Me
```typescript
localStorage.setItem('rememberMe', 'true');
```

### Clear All Auth Data
```typescript
localStorage.removeItem('authToken');
localStorage.removeItem('user');
localStorage.removeItem('rememberMe');
// Or clear everything:
localStorage.clear();
```

---

## 6️⃣ Show/Hide Password Toggle

```typescript
const [showPassword, setShowPassword] = useState(false);

// In JSX
<input
  type={showPassword ? 'text' : 'password'}
  placeholder="••••••••"
/>
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-4 top-3.5"
>
  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
</button>
```

---

## 7️⃣ Toast/Alert Components (Future Enhancement)

### Success Message Pattern
```typescript
// Current implementation
setServerError(''); // Clear errors
// Redirect automatically

// Future: Add toast library
import { toast } from 'react-hot-toast';

toast.success('Login successful!');
```

### Error Message Pattern
```typescript
// Current
setServerError(response.message);

// Future
toast.error(response.message);
```

---

## 8️⃣ Protected Routes Setup (Future)

```typescript
// Create a ProtectedRoute component
export function ProtectedRoute({ children }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) return null;
  return children;
}

// Usage
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

---

## 9️⃣ Navbar Integration

### Login Button Link
```tsx
<Link href={ROUTES.LOGIN}>Login</Link>
```

### Sign Up Button Link
```tsx
<Link href={ROUTES.SIGNUP}>Sign Up</Link>
```

### Mobile Menu Toggle
```typescript
const [isOpen, setIsOpen] = useState(false);

<button onClick={() => setIsOpen(!isOpen)}>
  {isOpen ? <X /> : <Menu />}
</button>
```

---

## 🔟 API Integration Checklist

### When Moving to Real API:

#### 1. Update Auth Service
```typescript
// Replace mock API with real endpoint
const response = await axiosInstance.post('/api/auth/login', payload);

// Handle real API response
if (response.data.success) {
  return response.data;
} else {
  throw new Error(response.data.message);
}
```

#### 2. Add Error Handling
```typescript
try {
  const result = await loginUser(data);
  // Handle success
} catch (error) {
  if (error.response?.status === 401) {
    setServerError('Invalid credentials');
  } else if (error.response?.status === 429) {
    setServerError('Too many attempts. Try again later.');
  } else {
    setServerError('Server error. Please try again.');
  }
}
```

#### 3. Setup Axios Interceptors
```typescript
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 1️⃣1️⃣ TypeScript Interfaces

```typescript
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      fullName?: string;
    };
  };
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
}
```

---

## 1️⃣2️⃣ Common Issues & Solutions

### Issue: Form errors not showing
```typescript
// Wrong
{errors.email && <p>{errors.email}</p>}

// Correct
{errors.email && <p>{errors.email.message}</p>}
```

### Issue: useRouter not working in middleware
```typescript
// Wrong
import { useRouter } from 'next/router';

// Correct (for app directory)
import { useRouter } from 'next/navigation';
```

### Issue: Redirect not working after login
```typescript
// Add setTimeout to allow state updates
setTimeout(() => {
  router.push('/dashboard');
}, 500);
```

### Issue: Tailwind classes not applying
```typescript
// Check that className is in backticks, not quotes
className={`flex items-center ${condition ? 'bg-red-500' : 'bg-blue-500'}`}
```

### Issue: "Cannot find module" errors
```typescript
// Verify imports use @/ alias
import { something } from '@/path/to/file';
// Not: import { something } from '../../../path/to/file';
```

---

## 1️⃣3️⃣ File Structure Reference

```
tapvyo-nfc/
├── app/
│   ├── layout.tsx              (Root layout with AuthProvider)
│   ├── login/
│   │   └── page.tsx            (Login page)
│   └── signup/
│       └── page.tsx            (Signup page)
│
├── src/
│   ├── components/
│   │   ├── PremiumNavbar.tsx    (Updated navbar)
│   │   ├── GoogleAuthButton.tsx (Google OAuth UI)
│   │   └── AuthModal.tsx        (Modal auth)
│   │
│   └── services/
│       └── auth.ts             (Auth service with mock API)
│
└── src/utils/
    └── constants.ts            (ROUTES definitions)
```

---

## 1️⃣4️⃣ Environment Variables (Optional)

```env
# .env.local
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME=Tapvyo

# Only for backend (not exposed to client)
API_SECRET_TOKEN=your_secret_token
```

Usage in code:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.tapvyo-nfc.com';
```

---

## Resources & Documentation

- **React Hook Form:** https://react-hook-form.com/
- **Tailwind CSS:** https://tailwindcss.com/
- **Lucide Icons:** https://lucide.dev/
- **Next.js App Router:** https://nextjs.org/docs/app
- **Framer Motion:** https://www.framer.com/motion/

---

**Last Updated:** March 3, 2026
**Quick Reference Version:** 1.0
