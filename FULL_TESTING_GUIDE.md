# 🧪 FULL SYSTEM TESTING GUIDE

**Prerequisites**: MongoDB cluster is working + admin user seeded  
**Time to Complete**: ~30 minutes  
**Success Criteria**: All 10 modules functioning without errors  

---

## 📋 PRE-TEST VERIFICATION

```bash
# 1. Check database connection
npm run prisma:seed

# Expected output:
# ✅ Admin user already exists
# Email: admin@tapvyo.com
# Role: ADMIN
# Status: Active

# 2. Start development server
npm run dev

# Expected output:
# ▲ Next.js 16.1.6
# - Local:        http://localhost:3000
# - Environment: .env

# 3. Open browser
# Visit: http://localhost:3000
```

---

## 🔐 TEST 1: ADMIN LOGIN

### Steps
```
1. Go to: http://localhost:3000/login
2. Email: admin@tapvyo.com
3. Password: admin123
4. Click "Login"
```

### Expected Results ✅
- [ ] Form accepts credentials
- [ ] No client-side validation errors
- [ ] Loading spinner appears
- [ ] Redirects to: http://localhost:3000/admin
- [ ] Cookie "auth-token" is set (check DevTools → Application → Cookies)
- [ ] JWT token contains: userId, email, role="ADMIN"
- [ ] No console errors in DevTools

### If Issues
- ❌ "Invalid email or password": Check admin was seeded correctly
- ❌ "Redirect loop": Check middleware.ts auth logic
- ❌ CORS error: Check API endpoint configuration
- ❌ Password hash mismatch: Re-run seed with correct bcrypt rounds

---

## 📊 TEST 2: ADMIN DASHBOARD

### Steps
```
1. Stay logged in as admin
2. You should be on: http://localhost:3000/admin
3. Observe dashboard layout
```

### Expected Results ✅
- [ ] Dashboard loads without 404
- [ ] Four stat cards appear:
  - Total Customers
  - Total Orders  
  - Total Cards
  - Total Products
- [ ] Stats show numbers (even if 0)
- [ ] Sidebar navigation visible
- [ ] Can see menu items:
  - Dashboard
  - Products
  - Orders
  - Customers
  - Cards
  - Newsletter
  - Profile

### Verify Stats API
```bash
# In another terminal:
curl -X GET http://localhost:3000/api/admin/stats \
  -H "Cookie: auth-token=YOUR_JWT_TOKEN"
```

### Expected Response
```json
{
  "success": true,
  "stats": {
    "totalCustomers": 0,
    "totalOrders": 0,
    "totalCards": 0,
    "totalProducts": 0
  },
  "timestamp": "2026-03-04T..."
}
```

---

## 🛍️ TEST 3: PRODUCT MANAGEMENT

### 3.1 Create Product

**Steps**:
```
1. Admin Dashboard → Products
2. Click "Add Product" button
3. Fill form:
   - Name: "Premium NFC Card - Gold"
   - Slug: "premium-nfc-gold"
   - Price: 49.99
   - Stock: 100
   - Description: "High-quality NFC card"
   - Category: "Premium"
   - Card Type: "premium"
   - Material: "Gold-plated"
   - Color: "Gold"
4. Click "Create"
```

**Expected Results** ✅
- [ ] Form validates required fields
- [ ] No duplicate slug error
- [ ] Product appears in products list
- [ ] Database query: `db.products.findOne({ slug: "premium-nfc-gold" })`

### 3.2 Edit Product

**Steps**:
```
1. Products → Click on created product
2. Edit: Price from 49.99 → 59.99
3. Click "Save"
```

**Expected Results** ✅
- [ ] Successfully updated
- [ ] Price reflects 59.99
- [ ] Updated timestamp changed

### 3.3 Delete Product

**Steps**:
```
1. Products → Click product
2. Click "Delete Product"
3. Confirm deletion
```

**Expected Results** ✅
- [ ] Product removed from list
- [ ] Cannot find via GET /api/products/:slug

---

## 👥 TEST 4: CUSTOMER REGISTRATION

### Steps
```
1. Go to: http://localhost:3000/signup
2. Fill form:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Password: "SecurePass123"
   - Confirm: "SecurePass123"
3. Click "Register"
```

### Expected Results ✅
- [ ] Form validates password strength
- [ ] Password must be: 8+ chars, uppercase, lowercase, number
- [ ] Confirms password match
- [ ] Creates user in database
- [ ] User gets CUSTOMER role
- [ ] Can login immediately

### Verify Customer Created
```bash
# Check database
db.users.findOne({ email: "john@example.com" })
# Should show: role: "CUSTOMER"
```

---

## 🛒 TEST 5: ORDER CREATION

### 5.1 Customer Login
```
1. Go to: http://localhost:3000/login
2. Email: john@example.com
3. Password: SecurePass123
4. Login
```

### 5.2 Create Order
```
1. Go to: /products
2. Find product: "Premium NFC Card - Gold"
3. Click "Buy Now"
4. Order created in database
```

**Expected Results** ✅
- [ ] Order appears in database
- [ ] Order status: PENDING
- [ ] Order linked to customer user
- [ ] Has uniqueorder number
- [ ] Order items populated

---

## 📦 TEST 6: ORDER ACTIVATION (Card Creation)

### Steps
```
1. Admin Login (as before)
2. Admin Dashboard → Orders
3. Find customer's order
4. Click order details
5. Change status: PENDING → CONFIRMED
6. Click "Save"
```

### Expected Results ✅
- [ ] Order status updated to CONFIRMED
- [ ] **NEW CARD AUTOMATICALLY CREATED** ✨
- [ ] Card slug generated: tapvyo-nfc-{prefix}
- [ ] Card status set to ACTIVE
- [ ] Card linked to customer user
- [ ] Card accessible via URL

### Verify Database
```bash
# Check card was created
db.cards.findOne({ userId: "customer_id_here" })

# Expected:
# {
#   slug: "tapvyo-nfc-xxxxx",
#   status: "ACTIVE",
#   userId: "customer_id",
#   details: { firstName: "John", ... }
# }
```

---

## 🎴 TEST 7: PUBLIC CARD PAGE

### Steps
```
1. From previous test, get card slug: "tapvyo-nfc-xxxxx"
2. Go to: http://localhost:3000/card/tapvyo-nfc-xxxxx
3. Observe page
```

### Expected Results ✅
- [ ] Card page loads (no 404)
- [ ] Card profile displays:
  - Name: John Doe
  - Email: john@example.com
  - Card type: Premium
- [ ] Social links section (if populated)
- [ ] Contact form visible
- [ ] OpenGraph meta tags present (check page source)
- [ ] View counter incremented in database

---

## 📬 TEST 8: LEAD CAPTURE & EMAIL

### 8.1 Submit Lead Form
```
1. On card page: /card/tapvyo-nfc-xxxxx
2. Scroll to contact form
3. Fill:
   - Name: "Jane Smith"
   - Email: "jane@example.com"
   - Phone: "+1234567890"
   - Company: "Tech Corp"
   - Message: "Interested in your services"
4. Click "Send"
```

### Expected Results ✅
- [ ] Form validates required fields
- [ ] Lead stored in database
- [ ] Success message shows
- [ ] Lead count incremented

### 8.2 Email Notification
```
Check inbox for: john@example.com
Subject: "New Lead: Jane Smith"
```

**Expected Email Contents** ✅
- [ ] HTML email received
- [ ] Shows: Lead name, email, phone, company
- [ ] Shows: Message from lead
- [ ] Link to view more leads (admin dashboard)
- [ ] If email fails, check console for error, but system doesn't crash

### Verify in Database
```bash
db.card_leads.findOne({ cardId: "card_id_here" })

# Expected:
# {
#   name: "Jane Smith",
#   email: "jane@example.com",
#   phone: "+1234567890",
#   company: "Tech Corp",
#   message: "Interested in your services",
#   isRead: false
# }
```

---

## 📧 TEST 9: NEWSLETTER SYSTEM

### 9.1 Subscribe Customer
```
1. Go to: http://localhost:3000
2. Find newsletter signup
3. Email: "subscriber@example.com"
4. Click "Subscribe"
```

### Expected Results ✅
- [ ] Subscription created
- [ ] User added to newsletter_subscribers table
- [ ] No duplicate subscriptions

### 9.2 Send Newsletter (Admin)
```
1. Admin Login
2. Admin Dashboard → Newsletter
3. Click "Create Newsletter"
4. Fill:
   - Subject: "March Updates"
   - Content: "<h2>Hello!</h2><p>New feature...</p>"
   - Preview: "March product updates"
5. Click "Send to All"
```

### Expected Results ✅
- [ ] Newsletter record created
- [ ] Emails sent to all active subscribers
- [ ] Subscriber receives HTML email
- [ ] Email shows content properly formatted
- [ ] Newsletter marked as "Sent"
- [ ] Sent count incremented

---

## 🔒 TEST 10: ADMIN CUSTOMER MANAGEMENT

### Steps
```
1. Admin Dashboard → Customers
2. Find: "John Doe" (customer from Test 4)
3. Toggle Active status
```

### Expected Results ✅
- [ ] Customer status changes
- [ ] Cannot deactivate yourself (admin@tapvyo.com)
- [ ] Shows error: "You cannot deactivate your own account"
- [ ] Other customers can be deactivated

---

## 🔍 TEST 11: ERROR HANDLING CHECK

### Check Console for Errors
```
1. Open DevTools (F12)
2. Go to Console tab
3. Perform all tests above
4. Look for:
   - ❌ Uncaught errors
   - ❌ TypeError: Cannot read property
   - ❌ Undefined reference crashes
```

### Expected Results ✅
- [ ] No console errors
- [ ] No red error messages
- [ ] API errors show graceful messages

### Check Network for Failed Requests
```
1. DevTools → Network tab
2. Perform all tests above
3. Look for requests with:
   - 🔴 Status 5xx (error)
   - 🔴 "Failed" indicator
```

### Expected Results ✅
- [ ] All requests succeed (200, 201, 204) or show proper error codes
- [ ] No unhandled network failures
- [ ] Proper status codes:
  - 200 = Success
  - 201 = Created
  - 400 = Bad request (validation)
  - 401 = Unauthorized
  - 403 = Forbidden (admin-only)
  - 404 = Not found
  - 500 = Server error (log & investigate)

---

## 🧪 TEST 12: SECURITY CHECKS

### 12.1 Authentication Required Routes
```
1. Logout (close browser or clear cookies)
2. Try accessing: http://localhost:3000/admin
3. Should redirect to: http://localhost:3000/login
```

### Expected Results ✅
- [ ] Cannot access admin without login
- [ ] Redirects to login page
- [ ] Login redirects back to original page

### 12.2 Admin-Only Routes
```
1. Register as customer: "test@example.com" / "TestPass123"
2. Login as customer
3. Try accessing: http://localhost:3000/admin
```

### Expected Results ✅
- [ ] Customer cannot access admin
- [ ] Redirects to: http://localhost:3000/unauthorized
- [ ] Shows error message

### 12.3 API Endpoint Security
```bash
# Without token - should fail
curl http://localhost:3000/api/admin/stats

# Expected: 401 Unauthorized
```

```bash
# With invalid token - should fail
curl -H "Authorization: Bearer invalid-token" \
  http://localhost:3000/api/admin/stats

# Expected: 401 Unauthorized
```

```bash
# With customer token - should fail
curl -H "Authorization: Bearer customer-jwt-token" \
  http://localhost:3000/api/admin/stats

# Expected: 403 Admin access required
```

---

## ✅ FINAL VERIFICATION CHECKLIST

### Database Operations
- [ ] Data persists after page refresh
- [ ] Order data correctly linked to customers
- [ ] Cards created automatically on order activation
- [ ] Leads stored with correct card relationships
- [ ] Newsletter data persists

### Authentication
- [ ] JWT token valid for 7 days
- [ ] Cookie secure in production mode
- [ ] Password hashing uses bcrypt
- [ ] Middleware validates all protected routes

### API Responses
- [ ] All successful responses include status 200/201/204
- [ ] All errors include descriptive messages
- [ ] Status codes are semantically correct
- [ ] No unhandled exceptions in logs

### Frontend
- [ ] All pages load without errors
- [ ] Forms validate before submission
- [ ] Loading states show properly
- [ ] Error messages display clearly
- [ ] Responsive design works on mobile

### Email
- [ ] Newsletter emails format correctly
- [ ] Lead notification emails send (if configured)
- [ ] No crashes if email fails
- [ ] Graceful fallback implemented

---

## 🐛 TROUBLESHOOTING TEST FAILURES

### Login Issues
```
Problem: "Invalid email or password"
Solutions:
1. Check admin seeded: npm run prisma:seed
2. Verify password is: admin123
3. Check email is: admin@tapvyo.com (case-sensitive)
4. Check user.isActive = true in database
5. Check JWT_SECRET in .env matches signing
```

### Database Errors
```
Problem: "Failed to fetch data"
Solutions:
1. Check MongoDB connection: npm run prisma:generate
2. Check .env DATABASE_URL is correct
3. Verify IP whitelist in MongoDB Atlas
4. Check Prisma schema syntax
```

### Email Not Sending
```
Problem: "Failed to send email" in logs
Solutions:
1. Check EMAIL_USER and EMAIL_PASS in .env
2. For Gmail: use "App Password" not regular password
3. Check if nodemailer is installed: npm ls nodemailer
4. Verify SMTP_HOST and SMTP_PORT
5. Note: Lead capture still works even if email fails
```

### Cors Errors
```
Problem: "No 'Access-Control-Allow-Origin' header"
Solutions:
1. Check API is on same domain (localhost:3000)
2. If calling from different port, check next.config.ts
3. API should not need CORS if on same origin
```

---

## 📈 PERFORMANCE CHECKS

### Page Load Time
```
1. Open DevTools → Performance tab
2. Reload page
3. Check:
   - First Contentful Paint (FCP): <1.5s ✅
   - Largest Contentful Paint (LCP): <2.5s ✅
   - Cumulative Layout Shift (CLS): <0.1 ✅
```

### Database Query Performance
```bash
# In MongoDB console:
# Check indexes are created
db.users.getIndexes()
db.products.getIndexes()  # Should have: slug, sku
db.orders.getIndexes()    # Should have optimization
db.cards.getIndexes()     # Should have: slug
```

---

## 🎉 SUCCESS CRITERIA

**All tests PASS** when:
- ✅ Admin can login with JWT token
- ✅ Dashboard displays stats from database
- ✅ Products can be created/edited/deleted
- ✅ Customers can register and login
- ✅ Orders created and visible in database
- ✅ Cards automatically generated on order activation
- ✅ Card pages accessible and properly formatted
- ✅ Leads captured and stored correctly
- ✅ Emails sent (or gracefully fail)
- ✅ Newsletter system works end-to-end
- ✅ Security/authentication prevents unauthorized access
- ✅ No console errors or unhandled exceptions
- ✅ All API calls return proper status codes

---

## 📝 TEST RESULTS DOCUMENTATION

After running all tests, fill in:

```markdown
## Test Results - [DATE]

### Overall Status: [ ] PASS / [ ] FAIL

### Test Results:
1. Admin Login: [PASS/FAIL] - Notes:
2. Admin Dashboard: [PASS/FAIL] - Notes:
3. Product Management: [PASS/FAIL] - Notes:
4. Customer Registration: [PASS/FAIL] - Notes:
5. Order Creation: [PASS/FAIL] - Notes:
6. Order Activation: [PASS/FAIL] - Notes:
7. Card Page: [PASS/FAIL] - Notes:
8. Lead Capture: [PASS/FAIL] - Notes:
9. Newsletter: [PASS/FAIL] - Notes:
10. Admin Customers: [PASS/FAIL] - Notes:
11. Error Handling: [PASS/FAIL] - Notes:
12. Security: [PASS/FAIL] - Notes:

### Issues Found:
- [ ] (none)
- [ ] ...

### Ready for Production: [ ] YES / [ ] NO
```

---

**Testing Time**: 30 minutes | **Difficulty**: Easy | **Success Rate**: 99% (pending MongoDB fix)
