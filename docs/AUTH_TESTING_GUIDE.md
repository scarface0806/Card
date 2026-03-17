# Login & Signup Testing Guide

## 🧪 Quick Testing Checklist

### Pre-Testing Setup
- ✅ Run `npm install` (already done)
- ✅ Run `npm run dev` to start dev server
- ✅ Open http://localhost:3000
- ✅ Open DevTools Console (F12)

---

## 🧬 Navbar Testing

### Desktop Navbar
- [ ] Visit homepage
- [ ] Look for "Login" button (text-teal-700, left side)
- [ ] Look for "Sign Up" button (teal background, with arrow, right side)
- [ ] Click "Login" → Should navigate to `/login`
- [ ] Click "Sign Up" → Should navigate to `/signup`
- [ ] Verify hover effects work smoothly

### Mobile Navbar
- [ ] Resize to mobile (< 768px)
- [ ] Click hamburger menu icon
- [ ] Verify sidebar opens with smooth animation
- [ ] Find "Login" button in mobile menu
- [ ] Find "Sign Up" button in mobile menu
- [ ] Click "Login" → Should navigate to `/login` and close menu
- [ ] Click "Sign Up" → Should navigate to `/signup` and close menu

---

## 🔐 Login Page Testing

### Navigation
- [ ] Visit `/login` directly
- [ ] Or: Click Login button from navbar
- [ ] Page should show centered card with white background
- [ ] Background gradient should be visible (mint tones)

### Form Layout
- [ ] Title: "Welcome Back" (centered, dark text)
- [ ] Subtitle: "Login to manage your NFC profile"
- [ ] Email field with mail icon
- [ ] Password field with lock icon and show/hide toggle
- [ ] "Remember me" checkbox
- [ ] "Forgot password?" link (teal color)
- [ ] "Login" submit button (teal background, full width)
- [ ] "Or continue with" divider
- [ ] Google login button
- [ ] "Don't have an account? Sign up" link

### Form Validation Testing

#### Email Field:
```
Test Case 1: Empty email
- Leave email blank and submit
- Expected: Red error "Email is required"

Test Case 2: Invalid email
- Enter "notanemail"
- Expected: Red error "Invalid email address"

Test Case 3: Valid email
- Enter "user@example.com"
- Expected: No error, green border maintained
```

#### Password Field:
```
Test Case 1: Empty password
- Leave password blank and submit
- Expected: Red error "Password is required"

Test Case 2: Password too short
- Enter "12345" (5 chars)
- Expected: Red error "Password must be at least 6 characters"

Test Case 3: Valid password
- Enter "password123"
- Expected: No error

Test Case 4: Show/Hide toggle
- Click eye icon
- Expected: Password becomes visible as plain text
- Click again
- Expected: Password hidden again with dots
```

### Form State
- [ ] Initially, all error messages hidden
- [ ] Submit button enabled when form has values
- [ ] Submit button disabled during loading
- [ ] Loading spinner appears during submission
- [ ] Button text changes to "Logging in..." during submission

### Submission Flow
```
1. Enter valid credentials:
   Email: user@example.com
   Password: password123
   
2. Check DevTools Console:
   - Should see: "[AUTH SERVICE] Login attempt: { email: 'user@example.com' }"
   
3. Wait 800ms (simulated API delay)
   - Button should show spinner
   - Button text: "Logging in..."
   
4. After response:
   - Should see: "[AUTH SERVICE] Login success: { id: 'user_123', email: 'user@example.com' }"
   - localStorage should contain 'authToken'
   - Page should redirect to home (/)
```

### Remember Me Testing
- [ ] Check "Remember me" checkbox
- [ ] Submit form
- [ ] Check localStorage: `localStorage.getItem('rememberMe')` should be 'true'

### Error Handling
```
Test invalid credentials:
- Any email that fails
- Submit
- Should see error message on page
- Should NOT redirect
```

---

## 📝 Signup Page Testing

### Navigation
- [ ] Visit `/signup` directly
- [ ] Or: Click Sign Up button from navbar
- [ ] Or: Click "Sign up" link from login page
- [ ] Page should show centered card with white background

### Form Layout
- [ ] Title: "Create Your Account"
- [ ] Subtitle: Shows creation text
- [ ] Full Name field with user icon
- [ ] Email field with mail icon
- [ ] Password field with lock icon and toggle
- [ ] Confirm Password field with lock icon and toggle
- [ ] Terms & Conditions checkbox (with teal background box)
- [ ] "Create Account" submit button
- [ ] "Or continue with" divider
- [ ] Google signup button
- [ ] "Already have an account? Login" link

### Form Validation Testing

#### Full Name Field:
```
Test Case 1: Empty name
- Leave blank and submit
- Expected: Red error "Full name is required"

Test Case 2: Name too short
- Enter "J"
- Expected: Red error "Name must be at least 2 characters"

Test Case 3: Valid name
- Enter "John Doe"
- Expected: No error
```

#### Email Field: (same as login page)

#### Password Field: (same as login page)

#### Confirm Password Field:
```
Test Case 1: Empty confirm password
- Leave blank and submit
- Expected: Red error "Please confirm your password"

Test Case 2: Passwords don't match
- Password: "password123"
- Confirm: "password456"
- Expected: Red error "Passwords do not match"

Test Case 3: Passwords match
- Password: "password123"
- Confirm: "password123"
- Expected: No error
```

#### Terms & Conditions:
```
Test Case 1: Unchecked
- Leave unchecked and submit
- Expected: Red error "You must agree to the Terms & Conditions"
- Submit button should be disabled

Test Case 2: Checked
- Check the checkbox
- Expected: Error disappears
- Submit button enabled
- Should see link to /terms-conditions
```

### Submission Flow
```
1. Fill all fields correctly:
   Full Name: John Doe
   Email: john@example.com
   Password: password123
   Confirm: password123
   Check Terms
   
2. Check DevTools Console:
   - Should see: "[AUTH SERVICE] Registration attempt: { 
     fullName: 'John Doe', 
     email: 'john@example.com' }"
   
3. Wait 800ms
   - Button shows spinner
   - Button text: "Creating account..."
   
4. After response:
   - Should see: "[AUTH SERVICE] Registration success: { 
     id: 'user_...', 
     email: 'john@example.com', 
     fullName: 'John Doe' }"
   - localStorage should contain 'authToken' and 'user'
   - Page redirects to home (/)
```

---

## 🎨 Styling & UX Testing

### Color Scheme
- [ ] Login/Signup titles: Dark teal/gray
- [ ] Input borders: Teal color (not gray)
- [ ] Focused inputs: Teal ring (2px)
- [ ] Error states: Red text and red border
- [ ] Buttons: Teal background
- [ ] Button hover: Darker teal
- [ ] Links: Teal with animation underline

### Responsive Design

#### Mobile (< 480px)
- [ ] Visit pages on iPhone size
- [ ] Card takes full width with padding
- [ ] No horizontal scroll
- [ ] Buttons remain clickable
- [ ] Input fields properly sized
- [ ] Text remains readable

#### Tablet (768px - 1024px)
- [ ] Card centered
- [ ] All elements properly spaced
- [ ] Navbar transitions to desktop view at md breakpoint

#### Desktop (> 1024px)
- [ ] Desktop navbar visible (hide hamburger)
- [ ] Login/Sign Up buttons right-aligned
- [ ] Card properly centered
- [ ] Maximum width maintained

### Focus & Accessibility
- [ ] Tab through form fields smoothly
- [ ] Focus ring visible (teal color)
- [ ] Focus order logical (top to bottom)
- [ ] Can tab to all interactive elements
- [ ] Can submit using Enter key

### Animation & Transitions
- [ ] Button hover states smooth (300ms)
- [ ] Error messages appear smoothly
- [ ] Navbar menu opens/closes smoothly
- [ ] Sign Up button has gradient shine effect on hover
- [ ] No jarring color changes

---

## 💾 LocalStorage Testing

### After Login
```javascript
// In DevTools Console:
localStorage.getItem('authToken')
// Expected: mock_jwt_token_[timestamp]

localStorage.getItem('rememberMe') 
// Expected: 'true' if checked, else null
```

### After Signup
```javascript
localStorage.getItem('authToken')
// Expected: mock_jwt_token_[timestamp]

localStorage.getItem('user')
// Expected: JSON with user object
JSON.parse(localStorage.getItem('user'))
// Expected: { id: 'user_...', email: '...', fullName: '...' }
```

### Clearing Storage
```javascript
localStorage.clear()
// Clears all stored data for testing fresh login
```

---

## 🔍 Console Logging Verification

### Expected Console Output

#### Successful Login:
```
[AUTH SERVICE] Login attempt: { email: 'user@example.com' }
[AUTH SERVICE] Login success: { id: 'user_123', email: 'user@example.com' }
```

#### Successful Registration:
```
[AUTH SERVICE] Registration attempt: { fullName: 'John Doe', email: 'john@example.com' }
[AUTH SERVICE] Registration success: { id: 'user_1234567890', email: 'john@example.com', fullName: 'John Doe' }
```

#### Open DevTools to see these logs:
1. Open DevTools (F12)
2. Go to "Console" tab
3. Perform login/signup
4. Verify messages appear

---

## ⚙️ Configuration Verification

### Check Constants
```typescript
// src/utils/constants.ts
ROUTES.LOGIN === '/login'        ✓
ROUTES.SIGNUP === '/signup'      ✓
ROUTES.TERMS === '/terms-conditions' ✓
ROUTES.HOME === '/'              ✓
```

### Check Dependencies
```json
✓ react-hook-form: ^7.71.2
✓ axios: ^1.13.5
✓ tailwindcss: ^4
✓ lucide-react: ^0.575.0
✓ framer-motion: ^12.34.3
```

---

## 🐛 Troubleshooting

### Issue: Form shows error immediately
**Solution:** Check for default values in form state. Should be empty strings initially.

### Issue: Validation not working
**Solution:** Verify react-hook-form is properly imported and setup.

### Issue: Responsive design broken
**Solution:** Check Tailwind CSS is properly compiled. Run `npm install` and `npm run dev`.

### Issue: Styling not applied
**Solution:** Hard refresh browser (Ctrl+Shift+R). Check tailwind.config.ts setup.

### Issue: Redirect not working
**Solution:** Check useRouter import from 'next/navigation' (not 'next/router').

### Issue: localStorage errors
**Solution:** Check for SSR hydration issues. Use useEffect for localStorage access.

---

## ✅ Final Verification Checklist

- [ ] Navbar buttons work and navigate correctly
- [ ] Login page displays all required elements
- [ ] Signup page displays all required elements
- [ ] Form validation works for all fields
- [ ] Error messages display correctly
- [ ] Submit buttons work and show loading state
- [ ] Redirect happens after successful submission
- [ ] Console logs show auth flow
- [ ] LocalStorage stores tokens correctly
- [ ] Mobile responsive design works
- [ ] Styling matches mint/fintech theme
- [ ] All links navigate correctly
- [ ] Google button displays (functional in production)
- [ ] Accessibility works (tab navigation)
- [ ] No console errors

---

## 🚀 Production Readiness

When moving to production:
1. [ ] Replace mock API with real endpoints
2. [ ] Remove console.log statements (or use debug flag)
3. [ ] Setup HTTPS for secure auth
4. [ ] Implement HttpOnly cookies for tokens
5. [ ] Add CSRF protection
6. [ ] Setup backend authentication
7. [ ] Implement token refresh
8. [ ] Add rate limiting
9. [ ] Setup proper error tracking
10. [ ] Test with real backend API

---

**Last Updated:** March 3, 2026
**Status:** Ready for Testing ✅
