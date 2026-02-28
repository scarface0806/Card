# AuthModal - Usage Guide & Code Examples

## 🚀 Quick Start

### 1. Basic Setup in a Component

```tsx
'use client';
import { useState } from 'react';
import AuthModal from '@/components/AuthModal';

export default function MyComponent() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsAuthModalOpen(true)}>
        Login
      </button>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}
```

---

## 📋 API Reference

### AuthModal Props

```tsx
interface AuthModalProps {
  isOpen: boolean;        // Controls visibility
  onClose: () => void;    // Called when modal closes
}
```

### Internal State

```tsx
type AuthMode = 'login' | 'signup';

// Automatically managed by AuthModal
const [mode, setMode] = useState<AuthMode>('login');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [name, setName] = useState('');
const [loading, setLoading] = useState(false);
```

---

## 💡 Real-World Examples

### Example 1: Navbar Integration

```tsx
// src/layouts/Navbar.tsx
'use client';
import { useState } from 'react';
import AuthModal from '@/components/AuthModal';

export default function Navbar() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <nav>
        {/* Login Button - Opens Modal */}
        <button onClick={() => setIsAuthModalOpen(true)}>
          Login
        </button>
        
        {/* Sign Up Button - Opens Modal */}
        <button onClick={() => setIsAuthModalOpen(true)}>
          Sign Up
        </button>
      </nav>

      {/* Single Modal Instance */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}
```

### Example 2: Cards Page with Contact Modal

```tsx
// app/cards/page.tsx
'use client';
import { useState } from 'react';
import AuthModal from '@/components/AuthModal';
import ContactModal from '@/components/ContactModal';

export default function CardsPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  return (
    <>
      <main>
        {/* Buy Now - Opens Auth Modal */}
        <button onClick={() => setIsAuthModalOpen(true)}>
          Get This Card
        </button>

        {/* Contact Team - Opens Contact Modal */}
        <button onClick={() => setIsContactModalOpen(true)}>
          Talk to Team
        </button>
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
      
      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
        source="general"
      />
    </>
  );
}
```

### Example 3: Custom Button Component

```tsx
// src/components/CtaButton.tsx
'use client';
import { useState } from 'react';
import AuthModal from '@/components/AuthModal';

interface CtaButtonProps {
  text: string;
  onClick?: () => void;
  auth?: boolean; // If true, opens auth modal instead
}

export default function CtaButton({ text, onClick, auth }: CtaButtonProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleClick = () => {
    if (auth) {
      setIsAuthModalOpen(true);
    } else {
      onClick?.();
    }
  };

  return (
    <>
      <button 
        onClick={handleClick}
        className="px-6 py-3 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-full"
      >
        {text}
      </button>

      {auth && (
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      )}
    </>
  );
}

// Usage
<CtaButton text="Buy Now" auth={true} />
```

---

## 🎨 Modal Appearance

### Structure

```
┌─────────────────────────────────────┐
│  [X]                                │  ← Close button
│                                     │
│  Welcome Back                       │  ← Title
│  Sign in to your Tapvyo account     │  ← Subtitle
│                                     │
│  ┌─────────────────────────────────┐│  ← Email input
│  │ your@example.com                ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│  ← Password input
│  │ ••••••••                         ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│  ← Login button
│  │  Login →                        ││
│  └─────────────────────────────────┘│
│                                     │
│         Or continue with            │  ← Divider
│                                     │
│  ┌─────────────────────────────────┐│  ← Google button
│  │ [Google Icon] Google            ││
│  └─────────────────────────────────┘│
│                                     │
│  Don't have account? Sign Up        │  ← Mode switch
└─────────────────────────────────────┘
```

---

## 🎯 Styling Customization

### Current Design System

```tsx
// Colors
Primary Gradient: from-teal-600 to-green-600
Text: #0f2e25
Border: teal-200
Focus: teal-600 with ring effect

// Spacing
Modal Padding: p-8
Form Gap: space-y-4
Input Padding: px-4 py-3

// Border Radius
Modal: rounded-3xl
Inputs: rounded-xl
Buttons: rounded-full
```

### How to Override

To customize colors, modify the Tailwind classes in `src/components/AuthModal.tsx`:

```tsx
// Change primary color
<button className="bg-gradient-to-r from-blue-600 to-purple-600">
  Login
</button>

// Change border color
<input className="border border-blue-200 focus:border-blue-600">
  Email
</input>
```

---

## 🔄 User Flow

### Login Flow

1. User clicks "Login" button → `setIsAuthModalOpen(true)`
2. AuthModal mounts with `mode: 'login'`
3. Backdrop & modal animate in (0.25s)
4. User enters email & password
5. User clicks "Login →" button
6. Form submits (TODO: add auth logic)
7. User can switch to signup with "Sign Up" link

### Signup Flow

1. User clicks "Sign Up" button → `setIsAuthModalOpen(true)`
2. AuthModal mounts with default `mode: 'login'`
3. User clicks "Sign Up" link
4. `setMode('signup')` - form fields change
5. Name input appears
6. User fills name, email, password
7. User clicks "Create Account →"
8. Form submits (TODO: add auth logic)
9. User can switch back to login with "Login" link

---

## 🔐 Form Submission (TODO)

The AuthModal currently has placeholder form submission. Connect it to your auth service:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    if (mode === 'login') {
      // Call your login API
      const response = await loginUser({ email, password });
      
      if (response.success) {
        // Store token
        localStorage.setItem('authToken', response.token);
        onClose(); // Close modal
      }
    } else {
      // Call your signup API
      const response = await signupUser({ name, email, password });
      
      if (response.success) {
        // Auto-login or redirect
        onClose();
      }
    }
  } catch (error) {
    console.error('Auth error:', error);
  } finally {
    setLoading(false);
  }
};
```

Connect to your auth service:

```tsx
import { loginUser, signupUser } from '@/services/auth';

// src/services/auth.ts
export async function loginUser(credentials: LoginCredentials) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return response.json();
}

export async function signupUser(data: SignupData) {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
```

---

## 🎬 Animation Details

### Backdrop Animation

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.25 }}
  onClick={onClose}  // Click backdrop to close
>
```

### Modal Animation

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.25, ease: 'easeOut' }}
>
```

Combined effect:
- Modal scales from 95% → 100% size
- While fading in (opacity 0 → 1)
- Over 0.25 seconds with easeOut
- Makes modal feel like it's rising from the screen

---

## 🧪 Testing Checklist

- [ ] Modal opens when button clicked
- [ ] Modal closes when X button clicked
- [ ] Modal closes when backdrop clicked
- [ ] Mode switches from login to signup
- [ ] Mode switches from signup to login
- [ ] Form clears when mode switches
- [ ] All inputs accept user input
- [ ] Google button is clickable
- [ ] Mobile view is responsive (90% width)
- [ ] Animations are smooth (no stuttering)
- [ ] No page reload on modal open
- [ ] No layout shift when modal appears

---

## 📞 Support

For issues or feature requests:
1. Check that `isOpen` prop is correctly set
2. Verify `onClose` callback is provided
3. Ensure parent component is `'use client'`
4. Check browser console for errors

---

*Last Updated: 2026-02-26*
