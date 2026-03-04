# 📊 Login & Signup System - Architecture Diagram

## System Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE LAYER                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │     PremiumNavbar.tsx (Updated)        │
        │  ┌──────────────────────────────────┐  │
        │  │ Login Button → /login route     │  │
        │  │ Signup Button → /signup route   │  │
        │  └──────────────────────────────────┘  │
        └─────────────┬────────────────┬───────┘
                      │                │
         ┌────────────▼──┐    ┌────────▼──────┐
         │  Login Page   │    │  Signup Page  │
         │ /login        │    │  /signup      │
         │ app/login/    │    │  app/signup/  │
         │ page.tsx      │    │  page.tsx     │
         └────────┬──────┘    └────────┬──────┘
                  │                    │
                  │    ┌───────────────┘
                  │    │
        ┌─────────▼────▼───────────────────────┐
        │    Form Validation Layer             │
        │  Using React Hook Form               │
        ├─────────────────────────────────────┤
        │  ✓ Required field validation         │
        │  ✓ Email format validation           │
        │  ✓ Password min 6 characters        │
        │  ✓ Confirm password matching        │
        │  ✓ Terms acceptance check           │
        └────────┬────────────────────────────┘
                 │
                 ▼
        ┌──────────────────────────────┐
        │  Auth Service Layer          │
        │  src/services/auth.ts        │
        ├──────────────────────────────┤
        │  loginUser(payload)          │
        │  registerUser(payload)       │
        │  logoutUser()                │
        │  getAuthToken()              │
        │  setAuthToken(token)         │
        └────────┬─────────────────────┘
                 │
     ┌───────────┴────────────┐
     │                        │
     ▼                        ▼
┌─────────────────┐    ┌────────────────┐
│  Mock API       │    │ LocalStorage   │
│  (800ms delay)  │    │ Management     │
├─────────────────┤    ├────────────────┤
│ Console Logs    │    │ authToken      │
│ Validation      │    │ user data      │
│ Success/Error   │    │ rememberMe     │
└─────────────────┘    └────────────────┘
     │                        │
     └───────────┬────────────┘
                 │
                 ▼
        ┌──────────────────────┐
        │  Redirect to Home    │
        │  router.push('/')    │
        └──────────────────────┘
```

---

## Component Interaction Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  LAYOUT (AuthProvider wrapper)                               │
│  ├─ app/layout.tsx                                           │
│  │                                                            │
│  ├─ PremiumNavbar Component                                  │
│  │  └─ Links to: /login, /signup                            │
│  │                                                            │
│  └─ Page Routes                                              │
│     ├─ app/login/page.tsx                                   │
│     │  ├─ useForm (React Hook Form)                         │
│     │  ├─ loginUser() call                                  │
│     │  └─ localStorage.setItem()                            │
│     │                                                        │
│     └─ app/signup/page.tsx                                  │
│        ├─ useForm (React Hook Form)                         │
│        ├─ registerUser() call                               │
│        └─ localStorage.setItem()                            │
│                                                              │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram - Login Process

```
User Input
   │
   │ Email: user@example.com
   │ Password: password123
   │
   ▼
Form Validation
   │
   ├─ Email: Required ✓ Valid Format ✓
   ├─ Password: Required ✓ Min 6 chars ✓
   │
   ▼
Submit Button Click
   │
   │ setIsLoading(true)
   │ setServerError('')
   │
   ▼
Auth Service: loginUser()
   │
   │ console.log('[AUTH SERVICE] Login attempt:', { email: '...' })
   │
   ▼
Mock API Simulation
   │
   │ await delay(800ms)
   │ Validation checks
   │
   ▼
Successful Response
   │
   │ {
   │   success: true,
   │   message: 'Login successful',
   │   data: {
   │     token: 'mock_jwt_token_...',
   │     user: { id: 'user_123', email: '...' }
   │   }
   │ }
   │
   ▼
console.log('[AUTH SERVICE] Login success:', ...)
   │
   ▼
Store Token
   │
   │ localStorage.setItem('authToken', token)
   │
   ▼
Redirect Home
   │
   │ setTimeout(() => router.push('/'), 500)
   │
   ▼
User at Home Page
```

---

## Data Flow Diagram - Signup Process

```
User Input
   │
   │ Full Name: John Doe
   │ Email: john@example.com
   │ Password: password123
   │ Confirm: password123
   │ Terms: Checked ✓
   │
   ▼
Form Validation (Multiple checks)
   │
   ├─ Full Name: Required ✓ Min 2 chars ✓
   ├─ Email: Required ✓ Valid Format ✓
   ├─ Password: Required ✓ Min 6 chars ✓
   ├─ Confirm: Required ✓ Matches ✓
   ├─ Terms: Checked ✓
   │
   ▼
Submit Button Click
   │
   │ Check if agreeToTerms === true
   │ setIsLoading(true)
   │
   ▼
Auth Service: registerUser()
   │
   │ console.log('[AUTH SERVICE] Registration attempt:', ...)
   │
   ▼
Mock API Simulation
   │
   │ await delay(800ms)
   │ Validation checks
   │
   ▼
Successful Response
   │
   │ {
   │   success: true,
   │   message: 'Account created successfully',
   │   data: {
   │     token: 'mock_jwt_token_...',
   │     user: { id: 'user_...', email: '...', fullName: '...' }
   │   }
   │ }
   │
   ▼
console.log('[AUTH SERVICE] Registration success:', ...)
   │
   ▼
Store Token & User Data
   │
   │ localStorage.setItem('authToken', token)
   │ localStorage.setItem('user', JSON.stringify(user))
   │
   ▼
Redirect Home
   │
   │ setTimeout(() => router.push('/'), 500)
   │
   ▼
User at Home Page
```

---

## State Management Diagram

```
┌────────────────────────────────────────────────┐
│         React Hook Form State                 │
├────────────────────────────────────────────────┤
│                                               │
│  register('email', rules)                     │
│  └─ Binds input to form state               │
│     └─ Validates on change/blur             │
│        └─ Updates errors object             │
│                                               │
│  register('password', rules)                  │
│  └─ Binds input to form state               │
│     └─ Validates on change/blur             │
│        └─ Updates errors object             │
│                                               │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│      Component State (useState)               │
├────────────────────────────────────────────────┤
│                                               │
│  isLoading          → Button disabled state  │
│  showPassword       → Input type toggle      │
│  serverError        → Error message display  │
│                                               │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│      Browser Storage (localStorage)           │
├────────────────────────────────────────────────┤
│                                               │
│  authToken    → User session token          │
│  user        → User profile data            │
│  rememberMe  → Remember preference          │
│                                               │
└────────────────────────────────────────────────┘
```

---

## Validation Rules Hierarchy

```
LOGIN PAGE
├─ Email Field
│  ├─ Rule 1: Required
│  ├─ Rule 2: Valid Email Format (regex)
│  └─ Error: Red text below input
│
├─ Password Field
│  ├─ Rule 1: Required
│  ├─ Rule 2: Min 6 characters
│  └─ Error: Red text below input
│
└─ Remember Me
   └─ Optional checkbox


SIGNUP PAGE
├─ Full Name Field
│  ├─ Rule 1: Required
│  ├─ Rule 2: Min 2 characters
│  └─ Error: Red text below input
│
├─ Email Field
│  ├─ Rule 1: Required
│  ├─ Rule 2: Valid Email Format (regex)
│  └─ Error: Red text below input
│
├─ Password Field
│  ├─ Rule 1: Required
│  ├─ Rule 2: Min 6 characters
│  └─ Error: Red text below input
│
├─ Confirm Password Field
│  ├─ Rule 1: Required
│  ├─ Rule 2: Must match password
│  └─ Error: Red text below input
│
└─ Terms & Conditions
   ├─ Rule 1: Must be checked
   └─ Error: Red text below checkbox
```

---

## API Response Flow

```
┌─────────────────────────────────────────────┐
│  Mock API Response                          │
├─────────────────────────────────────────────┤
│                                             │
│  Success Case:                              │
│  {                                          │
│    success: true,                           │
│    message: 'Login successful',             │
│    data: {                                  │
│      token: string,                         │
│      user: {                                │
│        id: string,                          │
│        email: string,                       │
│        fullName?: string                    │
│      }                                      │
│    }                                        │
│  }                                          │
│                                             │
│  Error Case:                                │
│  {                                          │
│    success: false,                          │
│    message: 'Error description'             │
│  }                                          │
│                                             │
└─────────────────────────────────────────────┘
```

---

## File Dependencies Diagram

```
app/layout.tsx
└─ src/components/AuthProvider.tsx

app/login/page.tsx
├─ src/services/auth.ts ──┐
├─ src/utils/constants.ts │
└─ src/components/GoogleAuthButton.tsx

app/signup/page.tsx
├─ src/services/auth.ts ──┐
├─ src/utils/constants.ts │
└─ src/components/GoogleAuthButton.tsx

src/components/PremiumNavbar.tsx
├─ src/utils/constants.ts
└─ Next.js components

src/services/auth.ts
└─ axios library

All pages use:
├─ React Hook Form
├─ Tailwind CSS
├─ Lucide React (icons)
└─ Next.js routing
```

---

## Styling Architecture

```
┌────────────────────────────────────────────────┐
│       Tailwind CSS Utility Classes             │
├────────────────────────────────────────────────┤
│                                               │
│  Colors                                       │
│  ├─ Primary: teal-700 (#0d9488)             │
│  ├─ Hover: teal-800 (#155e75)               │
│  ├─ Focus: teal-400 (#2dd4bf)               │
│  └─ Error: red-500 (#ef4444)                │
│                                               │
│  Spacing                                      │
│  ├─ Card Padding: p-10                      │
│  ├─ Form Gap: space-y-5                     │
│  └─ Mobile Padding: py-12 px-4              │
│                                               │
│  Borders & Radius                             │
│  ├─ Card Rounded: rounded-3xl                │
│  ├─ Input Rounded: rounded-xl                │
│  └─ Button Rounded: rounded-full             │
│                                               │
│  Shadows                                      │
│  ├─ Card Shadow: shadow-xl                  │
│  └─ Button Hover: hover:shadow-lg            │
│                                               │
│  Transitions                                  │
│  ├─ Duration: duration-300 (smooth)         │
│  └─ Easing: ease-out (natural)              │
│                                               │
└────────────────────────────────────────────────┘
```

---

## Responsive Breakpoints

```
Mobile (< 768px)
├─ Full width card with padding
├─ Hamburger menu visible
├─ Login/Signup in mobile dropdown
└─ Touch-friendly sizes

Tablet (768px - 1024px)
├─ Card centered
├─ Desktop nav appearing
└─ Proper spacing

Desktop (> 1024px)
├─ Fixed navbar with desktop layout
├─ Login/Signup buttons on right
└─ Full-featured UI
```

---

## Error Handling Flow

```
User Input
   │
   ▼
Validation Fails
   │
   ├─ Email invalid?
   │  └─ Show: "Invalid email address"
   │
   ├─ Password too short?
   │  └─ Show: "Password must be at least 6 characters"
   │
   ├─ Passwords don't match?
   │  └─ Show: "Passwords do not match"
   │
   └─ Terms not checked?
      └─ Show: "You must agree to the Terms & Conditions"
   │
   └─ Disable Submit Button
   │
   ▼
All Validations Pass
   │
   ▼
API Call
   │
   ├─ Error Response?
   │  └─ Show server error message
   │     └─ Keep user on page
   │
   └─ Success Response?
      └─ Store token
      └─ Redirect to home
```

---

**Diagram Generated:** March 3, 2026
**Architecture Version:** 1.0
