# Razorpay Payment Integration - Complete Testing Checklist

## 🎯 Quick Start (5 Minutes)

### Prerequisites
- [ ] Node.js installed (v18+)
- [ ] `.env.local` file with Razorpay credentials
- [ ] Dev server running (`npm run dev`)
- [ ] MongoDB connected
- [ ] Browser DevTools ready

### Quick Test
```
1. Open http://localhost:3000/order
2. Fill form with test data
3. Click "Place Order"
4. Enter test card: 4111 1111 1111 1111
5. Complete payment
6. Verify order in database
```

**Time: 5 minutes**

---

## ✅ Pre-Flight Checklist

### Step 1: Environment Variables
```bash
# Verify in .env.local:
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_Sfj4ep6wqxAupk"
RAZORPAY_KEY_SECRET="Qc8EslwVogEz6H5QCc8BRN43"
RAZORPAY_MODE="test"
DATABASE_URL="mongodb://..."
```

- [ ] All variables present
- [ ] No extra spaces
- [ ] Correct values (test keys for development)

### Step 2: Server Ready
```bash
npm run dev
```

- [ ] Server starts without errors
- [ ] No Razorpay-related errors in console
- [ ] Accessible at http://localhost:3000

### Step 3: Database Ready
- [ ] MongoDB running
- [ ] Connection successful
- [ ] `orders` collection accessible
- [ ] `payment_logs` collection created

---

## 🧪 Test Suite

### TEST 1: UI Loads Correctly

**Objective**: Verify order page loads without errors

**Steps**:
1. Navigate to http://localhost:3000/order
2. Wait for page to fully load
3. Open DevTools (F12)
4. Check Console tab

**Expected**:
- [ ] Page loads without JavaScript errors
- [ ] All form fields visible
- [ ] "Place Order" button visible
- [ ] No warnings in console about Razorpay

**Pass**: ✅ | **Fail**: ❌

---

### TEST 2: Form Functionality

**Objective**: Verify form works exactly as before

**Steps**:
1. Fill Step 1 - Personal Details
   - Name: `Test User`
   - Email: `test@example.com`
   - Mobile: `9999999999`
2. Fill Step 2 - Design Selection
   - Select any design
3. Fill Step 3 - Customization
   - Fill required fields
4. Fill Step 4 - Address
   - Fill required fields
5. Go to Step 5

**Expected**:
- [ ] All fields accept input
- [ ] No validation errors
- [ ] Progress bar shows step 5/5
- [ ] Payment form visible

**Pass**: ✅ | **Fail**: ❌

---

### TEST 3: Payment Method Selection

**Objective**: Verify payment method selection works

**Steps**:
1. On Step 5, check payment options
2. Select a payment method (e.g., "Card")
3. Verify "Agree to terms" checkbox visible
4. Check/uncheck the checkbox

**Expected**:
- [ ] Payment methods displayed
- [ ] Radio buttons work
- [ ] Checkbox works
- [ ] "Place Order" button enabled when checkbox checked

**Pass**: ✅ | **Fail**: ❌

---

### TEST 4: Payment Initiation

**Objective**: Verify payment flow starts correctly

**Steps**:
1. Ensure form is filled
2. Ensure terms checkbox is checked
3. Click "Place Order" button
4. Watch for changes

**Expected Within 2 Seconds**:
- [ ] Button text stays "Place Order"
- [ ] Loading spinner appears (blue circle)
- [ ] Button becomes disabled
- [ ] Razorpay checkout modal opens
- [ ] Modal title shows "Pay ₹[amount]"

**Pass**: ✅ | **Fail**: ❌

---

### TEST 5: Order Creation

**Objective**: Verify order is created in database before payment

**Steps**:
1. Click "Place Order"
2. Note the approximate time
3. Immediately open MongoDB Compass or terminal
4. Query: `db.orders.findOne({}, {sort: {createdAt: -1}})`

**Expected**:
- [ ] New order document exists
- [ ] Document created around same time
- [ ] Has all form data (name, email, address, etc.)
- [ ] Has `_id` field
- [ ] Has `price` field with `total` amount

**Pass**: ✅ | **Fail**: ❌

**Note**: Even if payment fails, order should exist in database.

---

### TEST 6: Razorpay Checkout Modal

**Objective**: Verify Razorpay modal works correctly

**Expected Modal Elements**:
- [ ] "Pay ₹[amount]" title visible
- [ ] Card number field
- [ ] Expiry date field
- [ ] CVV field
- [ ] "Pay" button
- [ ] Close (X) button

---

### TEST 7: Test Payment Completion

**Objective**: Complete a test payment

**Test Card Details**:
- Card: `4111 1111 1111 1111`
- Expiry: `12/25` (any future date)
- CVV: `123`
- Name: `Test User`

**Steps**:
1. Enter card number: `4111 1111 1111 1111`
2. Enter expiry: `12/25`
3. Enter CVV: `123`
4. (Optional) Enter cardholder name
5. Click "Pay" button
6. If OTP prompt: enter `123456`

**Expected**:
- [ ] Payment processes (may take a few seconds)
- [ ] Success message appears
- [ ] Modal closes
- [ ] Page redirects to success page
- [ ] Order ID displayed on success page
- [ ] Button loading state clears
- [ ] No error messages

**Pass**: ✅ | **Fail**: ❌

---

### TEST 8: Success Page

**Objective**: Verify success page displays correctly

**Expected**:
- [ ] Page URL is `/order-success?orderId=[orderId]`
- [ ] Order ID displayed
- [ ] Confirmation message visible
- [ ] Page loads without errors
- [ ] All elements visible and styled correctly

**Pass**: ✅ | **Fail**: ❌

---

### TEST 9: Payment Log in Database

**Objective**: Verify payment record created

**Steps**:
1. Open MongoDB
2. Query: `db.payment_logs.findOne({}, {sort: {createdAt: -1}})`
3. Review the document

**Expected**:
- [ ] Document exists
- [ ] `orderId` matches order ID
- [ ] `razorpay_order_id` present (starts with "order_")
- [ ] `razorpay_payment_id` present (starts with "pay_")
- [ ] `razorpay_signature` present
- [ ] `status` field = "SUCCESS"
- [ ] `amount` field = total amount (in paise)
- [ ] `currency` field = "INR"
- [ ] `createdAt` timestamp close to order time

**Pass**: ✅ | **Fail**: ❌

---

### TEST 10: Browser Console Logs

**Objective**: Verify debug logging works

**Steps**:
1. During payment, open DevTools Console
2. Search for "[Razorpay Debug]"

**Expected Logs** (in order):
- [ ] "Payment flow started"
- [ ] "Razorpay script loaded successfully"
- [ ] "Opening Razorpay checkout"
- [ ] "Triggering checkout open"
- [ ] "Payment handler called"
- [ ] "Payment completed successfully"

**Pass**: ✅ | **Fail**: ❌

---

### TEST 11: Network Requests

**Objective**: Verify correct API calls

**Steps**:
1. Open DevTools Network tab
2. Filter for "payment" and "order"
3. Complete a payment
4. Review requests

**Expected Requests**:
- [ ] `POST /api/orders/create-order` → Status 200/201
- [ ] `POST /api/payment/create-razorpay-order` → Status 200
- [ ] `POST /api/payment/verify` → Status 200

**All responses should succeed without errors.**

**Pass**: ✅ | **Fail**: ❌

---

## 🚨 Error Scenario Tests

### ERROR TEST 1: Cancel Payment

**Objective**: Handle user cancellation gracefully

**Steps**:
1. Click "Place Order"
2. When Razorpay modal opens, click X button to close
3. Observe behavior

**Expected**:
- [ ] Modal closes
- [ ] Button loading state stops
- [ ] Error message shown: "Payment cancelled by user"
- [ ] Page doesn't redirect
- [ ] Order still exists in database

**Pass**: ✅ | **Fail**: ❌

---

### ERROR TEST 2: Invalid Card

**Objective**: Handle payment failure

**Steps**:
1. Click "Place Order"
2. Razorpay modal opens
3. Enter invalid card: `4000 0000 0000 0002`
4. Complete payment attempt

**Expected**:
- [ ] Payment fails
- [ ] Error message shown from Razorpay
- [ ] Modal closes
- [ ] Button loading state stops
- [ ] Order exists in database
- [ ] No payment_log entry (or status: FAILED)

**Pass**: ✅ | **Fail**: ❌

---

### ERROR TEST 3: Missing Env Variable

**Objective**: Handle configuration errors

**Steps**:
1. Remove `NEXT_PUBLIC_RAZORPAY_KEY_ID` from `.env.local`
2. Restart server
3. Try to place order

**Expected**:
- [ ] Error message shown to user
- [ ] Button loading stops
- [ ] No modal opens
- [ ] Error in console

**Pass**: ✅ | **Fail**: ❌

---

### ERROR TEST 4: Network Offline

**Objective**: Handle network errors

**Steps**:
1. Set DevTools Network to "Offline"
2. Try to place order

**Expected**:
- [ ] Error message shown
- [ ] Button loading stops
- [ ] Graceful error handling
- [ ] No complete page crash

**Pass**: ✅ | **Fail**: ❌

---

## 🔄 UI/UX Tests

### UI TEST 1: Button States

**Objective**: Verify button behavior

**Button States**:
- [ ] Normal state: "Place Order" text visible, clickable
- [ ] Disabled state (terms unchecked): Button disabled/grayed out
- [ ] Loading state: Spinner visible, button disabled
- [ ] After error: Button clickable again

**Pass**: ✅ | **Fail**: ❌

---

### UI TEST 2: Form Validation

**Objective**: Verify form validation still works

**Steps**:
1. Try to submit with empty fields
2. Try to submit with invalid email
3. Try to submit without checking terms

**Expected**:
- [ ] Empty fields: Show validation errors
- [ ] Invalid email: Show validation error
- [ ] Terms unchecked: Disable button
- [ ] All validations work exactly as before

**Pass**: ✅ | **Fail**: ❌

---

### UI TEST 3: Responsive Design

**Objective**: Verify works on mobile/tablet

**Steps**:
1. Open DevTools Device Emulation
2. Test on: iPhone 12, iPad, Android phone
3. Try payment flow

**Expected**:
- [ ] Page responsive on all sizes
- [ ] Form fits screen without scrolling
- [ ] Razorpay modal fits mobile screen
- [ ] Payment works on mobile
- [ ] No horizontal scrolling

**Pass**: ✅ | **Fail**: ❌

---

### UI TEST 4: No Design Changes

**Objective**: Verify no UI elements changed

**Comparison**:
- [ ] Button styling exactly the same
- [ ] Form layout exactly the same
- [ ] Colors unchanged
- [ ] Spacing unchanged
- [ ] Fonts unchanged
- [ ] No new UI elements added

**Pass**: ✅ | **Fail**: ❌

---

## 🔐 Security Tests

### SECURITY TEST 1: Keys Not Exposed

**Objective**: Verify secret key not in frontend

**Steps**:
1. Open DevTools Network tab
2. Search responses for "secret"
3. Check page source (Ctrl+U)
4. Search for "RAZORPAY_KEY_SECRET"

**Expected**:
- [ ] No secret key in network responses
- [ ] No secret key in page source
- [ ] Only public key visible
- [ ] Secret key only in backend logs

**Pass**: ✅ | **Fail**: ❌

---

### SECURITY TEST 2: Signature Verification

**Objective**: Verify signature validation works

**Steps**:
1. Intercept payment response (Advanced - optional)
2. Modify signature
3. Try to verify

**Expected**:
- [ ] Signature verification fails
- [ ] Payment rejected
- [ ] Order not completed

**Pass**: ✅ | **Fail**: ❌

---

### SECURITY TEST 3: Amount Verification

**Objective**: Verify amount can't be changed

**Steps**:
1. Order placed for ₹1000
2. Verify database shows ₹1000
3. Verify payment_log shows correct amount

**Expected**:
- [ ] Amount matches exactly
- [ ] Can't modify amount after order creation
- [ ] Backend validates amount

**Pass**: ✅ | **Fail**: ❌

---

## 📊 Performance Tests

### PERF TEST 1: Load Time

**Objective**: Verify acceptable load times

**Measurements**:
- [ ] Order page load: < 3 seconds
- [ ] Razorpay script load: < 2 seconds
- [ ] Payment verification: < 1 second
- [ ] Redirect to success: < 1 second

**Pass**: ✅ | **Fail**: ❌

---

### PERF TEST 2: Memory

**Objective**: Check for memory leaks

**Steps**:
1. Open DevTools Memory tab
2. Complete 3-4 payment flows
3. Take heap snapshot
4. Look for increasing memory

**Expected**:
- [ ] Memory stable
- [ ] No large retained objects
- [ ] Modal properly cleaned up
- [ ] No lingering event listeners

**Pass**: ✅ | **Fail**: ❌

---

## 📱 Cross-Browser Tests

### BROWSER TEST 1: Chrome

**Steps**: Complete full payment flow in Chrome
- [ ] Page loads
- [ ] Payment completes
- [ ] Success page shows
- [ ] No console errors

**Pass**: ✅ | **Fail**: ❌

---

### BROWSER TEST 2: Firefox

**Steps**: Complete full payment flow in Firefox
- [ ] Page loads
- [ ] Payment completes
- [ ] Success page shows
- [ ] No console errors

**Pass**: ✅ | **Fail**: ❌

---

### BROWSER TEST 3: Safari

**Steps**: Complete full payment flow in Safari
- [ ] Page loads
- [ ] Payment completes
- [ ] Success page shows
- [ ] No console errors

**Pass**: ✅ | **Fail**: ❌

---

### BROWSER TEST 4: Edge

**Steps**: Complete full payment flow in Edge
- [ ] Page loads
- [ ] Payment completes
- [ ] Success page shows
- [ ] No console errors

**Pass**: ✅ | **Fail**: ❌

---

## 🎯 Final Verification

### All Required Tests Complete

- [ ] All 11 main tests passed
- [ ] All 4 error scenario tests passed
- [ ] All 4 UI/UX tests passed
- [ ] All 3 security tests passed
- [ ] All 2 performance tests passed
- [ ] All 4 cross-browser tests passed

### No Regressions

- [ ] Existing order flow works
- [ ] Existing form validation works
- [ ] Existing success page works
- [ ] No breaking changes
- [ ] No TypeScript errors
- [ ] No console warnings

### Production Readiness

- [ ] Code reviewed
- [ ] Documentation complete
- [ ] All tests pass
- [ ] Ready for production deployment
- [ ] Live keys prepared

---

## 🎯 Test Report

```
Date: ________________
Tester: ________________
Environment: ☐ Dev ☐ Staging ☐ Production

MAIN TESTS:        __/11 Passed
ERROR TESTS:       __/4 Passed
UI/UX TESTS:       __/4 Passed
SECURITY TESTS:    __/3 Passed
PERFORMANCE TESTS: __/2 Passed
BROWSER TESTS:     __/4 Passed

TOTAL:             __/32 Passed

Status: ☐ PASS ☐ FAIL ☐ NEEDS FIXES

Issues Found:
_______________________________
_______________________________
_______________________________

Approved for Production: ☐ YES ☐ NO

Sign Off: __________________ Date: __________
```

---

## 🚀 Deployment Checklist

Once all tests pass:

- [ ] Code merged to main branch
- [ ] Production environment variables set
- [ ] Live Razorpay keys configured
- [ ] One real payment tested with small amount
- [ ] Razorpay dashboard monitored
- [ ] Team notified of deployment
- [ ] Users can begin using payment

---

## 📞 Support

**If tests fail**, check:

1. Environment variables set
2. Server restarted after `.env.local` change
3. MongoDB running and connected
4. Browser console for specific errors
5. Server console for API errors
6. Network tab for failed requests

**Common solutions**:
- Restart server: `npm run dev`
- Clear browser cache: Ctrl+Shift+Delete
- Check MongoDB: `mongosh` or Compass
- Review console errors carefully

---

## ✨ Summary

This comprehensive test suite ensures:

✅ Payment integration works correctly  
✅ No UI elements were changed  
✅ All error scenarios handled  
✅ Security properly implemented  
✅ Performance acceptable  
✅ Cross-browser compatible  
✅ Production ready  

**Test all items. Report results. Deploy with confidence!**
