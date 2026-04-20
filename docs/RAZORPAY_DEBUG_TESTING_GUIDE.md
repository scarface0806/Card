# Razorpay Payment Flow - Complete Debugging & Testing Guide

## 🎯 Quick Start

This guide walks through debugging and testing the Razorpay test mode payment flow without modifying existing business logic.

**Status**: All backend logging, environment validation, and testing utilities have been added to the system.

---

## ✅ Phase 1: Environment Validation

### 1.1 Backend Environment Check

**Action**: Run this in your backend logs on server startup.

```bash
# You should see these logs when server starts:
✅ [RazorpayService] Service initialized
✅ [ENV] RAZORPAY_KEY_ID is valid (rzp_test_...)
✅ [ENV] RAZORPAY_KEY_SECRET is valid (24 chars)
✅ [ENV] All environment variables are valid
```

### 1.2 Verify `.env.local` Configuration

Check that your `.env.local` file has (without typos or extra spaces):

```
RAZORPAY_KEY_ID="rzp_test_Sfj4ep6wqxAupk"
RAZORPAY_KEY_SECRET="Qc8EslwVogEz6H5QCc8BRN43"
RAZORPAY_MODE="test"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret_here"
```

**Important**: No extra spaces, exact values required.

### 1.3 Check Key Format

- ✅ `RAZORPAY_KEY_ID` should start with `rzp_test_` (test mode)
- ✅ `RAZORPAY_KEY_SECRET` should be 24+ characters
- ✅ No leading/trailing spaces in values

---

## ✅ Phase 2: Backend API Testing

### 2.1 Test Create Order Endpoint

**Endpoint**: `POST /api/payment/create-razorpay-order`

**Using cURL** (replace `ORDER_ID_HERE` with a real order ID):

```bash
curl -X POST http://localhost:3000/api/payment/create-razorpay-order \
  -H "Content-Type: application/json" \
  -d '{
    "existingOrderId": "ORDER_ID_HERE",
    "amount": 100,
    "userEmail": "test@example.com",
    "userPhone": "9876543210",
    "userName": "Test User"
  }'
```

**Expected Response**:

```json
{
  "success": true,
  "razorpay_order_id": "order_xxxxxxxxxxxxx",
  "razorpay_key": "rzp_test_Sfj4ep6wqxAupk",
  "amount": 10000,
  "currency": "INR",
  "paymentLogId": "xxxxxxxxxxxxx"
}
```

**Server Logs** (check console for):

```
✅ [RazorpayService.createOrder] Creating Razorpay order
✅ [RazorpayService.createOrder] Order created successfully
✅ [PaymentAdapter.createRazorpayOrder] Razorpay order created
✅ [POST /api/payment/create-razorpay-order] Order creation successful
```

### 2.2 What to Check

- [ ] Response includes `razorpay_order_id` starting with `order_`
- [ ] `razorpay_key` matches your `RAZORPAY_KEY_ID`
- [ ] `amount` is in **paise** (100 paise = ₹1)
- [ ] Status code is 200
- [ ] No error messages in response

---

## ✅ Phase 3: Frontend Testing

### 3.1 Enable Debug Component

Add this to your order page (`app/(frontend)/order/page.tsx`):

```tsx
import RazorpayDebugComponent from '@/components/RazorpayDebugComponent';

// Inside the component JSX, at the end of return statement:
{process.env.NODE_ENV === 'development' && <RazorpayDebugComponent />}
```

This adds a debug panel in the bottom-right corner (dev mode only).

### 3.2 Verify Razorpay Script

**Check**: Open DevTools (F12) and run:

```javascript
typeof Razorpay
```

Expected: `"function"` (script loaded)

If error, add this to your layout or page HTML:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 3.3 Test Using Debug Component

1. **Open order page** (e.g., `http://localhost:3000/order`)
2. **Find debug panel** in bottom-right corner (blue box with 🔧 icon)
3. **Enter Order ID**: Paste a valid MongoDB ObjectId from your orders
4. **Enter Amount**: Default 100 (₹100)
5. **Click "Step 1: Create Order"**
6. **Verify**:
   - [ ] Green success message appears
   - [ ] Order ID displayed matches Razorpay response
   - [ ] No error messages

### 3.4 Test Checkout Opening

1. **Click "Step 2: Open Checkout"** (button appears after step 1)
2. **Verify**:
   - [ ] Razorpay checkout modal opens
   - [ ] Modal title shows payment amount
   - [ ] Test card option is available

### 3.5 Test Payment with Test Card

In the opened checkout modal:

1. **Email**: `test@example.com`
2. **Card Number**: `4111 1111 1111 1111` (test card)
3. **Expiry**: Any future date (e.g., 12/25)
4. **CVV**: Any 3 digits (e.g., 123)
5. **Click Pay**
6. **OTP Screen**: Enter `123456`
7. **Verify**:
   - [ ] Payment succeeds
   - [ ] Checkout modal closes
   - [ ] Success message appears

---

## ✅ Phase 4: Backend Verification Logging

### 4.1 Check Server Console After Payment

After completing the test payment, check server logs for:

```
✅ [RazorpayService.verifyPaymentSignature] Signature verified successfully
✅ [PaymentAdapter.verifyPayment] Signature validation successful
✅ [POST /api/payment/verify] Payment verification successful
```

### 4.2 Database Check

Run this in MongoDB compass or shell:

```javascript
// Connect to your database
use taxiapp

// Check payment logs
db.payments_log.find({}).sort({createdAt: -1}).limit(1)

// Expected fields:
// - razorpayOrderId (starts with "order_")
// - razorpayPaymentId (set after payment)
// - status: "SUCCESS"
// - amount: 100
// - currency: "INR"
```

---

## ✅ Phase 5: Razorpay Dashboard Verification

### 5.1 Check Razorpay Dashboard

1. **Go to**: [Razorpay Dashboard - Payments](https://dashboard.razorpay.com/payments)
2. **Filter**: Ensure you're in **TEST MODE** (toggle on dashboard)
3. **Look for**: Your test transaction
4. **Verify**:
   - [ ] Transaction appears in recent payments
   - [ ] Status shows "Captured" or "Authorized"
   - [ ] Amount matches (₹100)
   - [ ] Notes include your order ID

---

## 🔍 Debugging Steps (If Issues Occur)

### Issue: Checkout Doesn't Open

**Possible Causes**:

1. **Razorpay script not loaded**
   - Fix: Add `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>` to layout
   - Verify: Run `typeof Razorpay` in console → should return `"function"`

2. **Invalid razorpay_key**
   - Fix: Check `RAZORPAY_KEY_ID` in `.env.local` matches dashboard
   - Verify: In debug panel, check the order response shows correct key

3. **Missing order ID**
   - Fix: Ensure order exists in database
   - Verify: Query: `db.orders.findOne({_id: ObjectId("YOUR_ID")})`

4. **Direct instantiation (Fallback)**
   - Open browser console and run:
   ```javascript
   const rzp = new Razorpay({
     key: 'rzp_test_Sfj4ep6wqxAupk',
     order_id: 'order_xxxxx',
     amount: 10000
   });
   rzp.open();
   ```

### Issue: Payment Verification Fails

**Possible Causes**:

1. **Signature mismatch**
   - Check server logs: Look for "Signature verification failed"
   - Verify: `RAZORPAY_KEY_SECRET` matches exactly (no spaces)

2. **Order not found in database**
   - Verify: Run `db.payments_log.findOne({razorpayOrderId: "order_xxx"})`
   - Check: Payment log exists and matches order ID

3. **API endpoint unreachable**
   - Test: `curl http://localhost:3000/api/payment/verify`
   - Verify: Dev server is running

### Issue: Environment Variables Not Loaded

**Debug Command** (run in Node.js):

```javascript
console.log('KEY_ID:', process.env.RAZORPAY_KEY_ID);
console.log('KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET);
console.log('MODE:', process.env.RAZORPAY_MODE);
```

**Fix**:
- Restart dev server: `npm run dev`
- Verify `.env.local` exists in project root
- Ensure no `.env.local.example` (should be `.env.example`)

---

## 📊 Console Debugging Commands

Open browser DevTools (F12) and use these commands:

```javascript
// Check if everything is set up
window.razorpayDebugFrontend.checkRazorpayScript()

// Create test order
await window.razorpayDebugFrontend.testCreateOrder('ORDER_ID', 100)

// Print debug report
window.razorpayDebugFrontend.printReport()

// Export all logs
window.razorpayDebugFrontend.exportLogs()

// Clear logs
window.razorpayDebugFrontend.clearLogs()
```

---

## ✅ Complete Testing Checklist

- [ ] `.env.local` has correct credentials (no spaces)
- [ ] Dev server restarts after `.env.local` changes
- [ ] `POST /api/payment/create-razorpay-order` returns valid order
- [ ] Razorpay script loads (check `typeof Razorpay === 'function'`)
- [ ] Debug panel appears on order page (dev mode)
- [ ] Debug panel can create orders
- [ ] Checkout modal opens successfully
- [ ] Test payment completes without errors
- [ ] Server logs show signature verification success
- [ ] Payment log entry exists in database with SUCCESS status
- [ ] Transaction appears in Razorpay dashboard (TEST MODE)
- [ ] No modifications made to existing business logic

---

## 🚀 Next Steps After Testing

Once everything works:

1. **Integrate with PaymentForm**: Add checkout trigger to existing payment form
2. **Handle Payment Status**: Update order status after successful payment
3. **Send Confirmation**: Email confirmation after payment succeeds
4. **Deploy**: Update `.env.example` and deploy with live credentials

---

## 📞 Support Info

**Test Credentials**:
- Key: `rzp_test_Sfj4ep6wqxAupk`
- Secret: `Qc8EslwVogEz6H5QCc8BRN43`
- Mode: `test`
- Test Card: `4111 1111 1111 1111`
- Test OTP: `123456`

**API Reference**:
- Create Order: `POST /api/payment/create-razorpay-order`
- Verify Payment: `POST /api/payment/verify`
- Webhooks: `POST /api/payment/webhook`

**Documentation**:
- [RAZORPAY_INTEGRATION_GUIDE.md](./RAZORPAY_INTEGRATION_GUIDE.md)
- [RAZORPAY_ENV_SECURITY.md](./RAZORPAY_ENV_SECURITY.md)
- [RAZORPAY_ENV_VERIFICATION.md](./RAZORPAY_ENV_VERIFICATION.md)
