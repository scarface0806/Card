# Razorpay Payment Flow Debug - Quick Reference Card

## 🚀 5-Minute Quick Start

### 1. Environment Check ✅

```bash
# Verify .env.local has (no extra spaces):
RAZORPAY_KEY_ID="rzp_test_Sfj4ep6wqxAupk"
RAZORPAY_KEY_SECRET="Qc8EslwVogEz6H5QCc8BRN43"
RAZORPAY_MODE="test"

# Restart: Ctrl+C then npm run dev
```

### 2. Backend Test ✅

```bash
# Test with your real order ID:
curl -X POST http://localhost:3000/api/payment/create-razorpay-order \
  -H "Content-Type: application/json" \
  -d '{"existingOrderId":"YOUR_ORDER_ID","amount":100}'

# Expected: Returns razorpay_order_id starting with "order_"
```

### 3. Frontend Test ✅

**Add to `app/(frontend)/order/page.tsx`**:
```tsx
import RazorpayDebugComponent from '@/components/RazorpayDebugComponent';

// In JSX (end of return):
{process.env.NODE_ENV === 'development' && <RazorpayDebugComponent />}
```

Then:
1. Visit http://localhost:3000/order
2. Find blue debug panel (bottom-right)
3. Enter Order ID → Click "Step 1: Create Order"
4. Click "Step 2: Open Checkout"
5. Use test card: `4111 1111 1111 1111` → OTP: `123456`

### 4. Browser Console ✅

```javascript
// Check Razorpay loaded
typeof Razorpay  // Should be "function"

// Print debug report
window.razorpayDebugFrontend.printReport()

// Export logs
window.razorpayDebugFrontend.exportLogs()
```

---

## 📋 What Was Added

### Backend (No Breaking Changes ✅)

| File | What | Why |
|------|------|-----|
| `lib/razorpay-debug.ts` | Debug utility + env validation | Centralized logging |
| `lib/razorpay.ts` | Added logging (no logic change) | Track payment flow |
| `lib/payment-adapter.ts` | Added logging (no logic change) | Track adapter flow |
| `app/api/payment/*` | Added logging to endpoints | Track API calls |

### Frontend

| File | What | Why |
|------|------|-----|
| `lib/razorpay-debug-frontend.ts` | Frontend debug utility | Browser console testing |
| `components/RazorpayDebugComponent.tsx` | Visual debug panel | Easy one-click testing |

### Testing & Docs

| File | What | Why |
|------|------|-----|
| `scripts/test-razorpay-flow.ts` | Node.js API test script | Automated testing |
| `docs/RAZORPAY_DEBUG_TESTING_GUIDE.md` | Complete testing guide | Step-by-step instructions |
| `docs/RAZORPAY_DEBUGGING_INFRASTRUCTURE.md` | Infrastructure docs | Architecture overview |

---

## 🔍 Debug Workflow

```
┌─ Environment Check
│   └─ Verify .env.local credentials
│
├─ Backend API Test
│   ├─ Create order: curl or test script
│   ├─ Check response has order_id
│   └─ Check server logs show success
│
├─ Frontend Setup
│   ├─ Add debug component
│   ├─ Restart server
│   └─ Check debug panel appears
│
├─ Manual Payment Test
│   ├─ Create order via debug panel
│   ├─ Open checkout
│   ├─ Use test card: 4111111111111111
│   ├─ Enter OTP: 123456
│   └─ Complete payment
│
├─ Verification
│   ├─ Check server logs for "Signature verified"
│   ├─ Check database for payment_log entry
│   └─ Check Razorpay dashboard for transaction
│
└─ Complete! ✅
```

---

## 🐛 Common Issues & Fixes

| Issue | Fix | Verify |
|-------|-----|--------|
| "Credentials not configured" | Restart dev server after `.env.local` change | `npm run dev` |
| Checkout doesn't open | Add Razorpay script to layout | `typeof Razorpay === "function"` in console |
| Invalid order_id returned | Ensure order exists in DB | Query MongoDB for order ID |
| Signature verification fails | Check `RAZORPAY_KEY_SECRET` (no spaces) | Restart server + check `.env.local` |
| Debug panel not showing | Import and render component | Check `process.env.NODE_ENV === 'development'` |
| Payment not appearing in dashboard | Check TEST MODE is on | Visit Razorpay dashboard, toggle to TEST |

---

## 💻 Console Commands

### Quick Diagnostics
```javascript
// All-in-one
window.razorpayDebugFrontend.printReport()

// Detailed logs
window.razorpayDebugFrontend.getLogs()

// Export for sharing
copy(window.razorpayDebugFrontend.exportLogs())
```

### Manual Payment Test
```javascript
// 1. Create order
const orderData = await window.razorpayDebugFrontend.testCreateOrder('ORDER_ID_HERE', 100)

// 2. Open checkout
await window.razorpayDebugFrontend.testOpenCheckout(orderData)

// 3. Complete payment (use test card in modal)
// 4. Check verification logs
window.razorpayDebugFrontend.printReport()
```

---

## 📊 Server Log Patterns

### ✅ Success Pattern
```
✅ [RazorpayService] Service initialized
✅ [RazorpayService.createOrder] Order created successfully
✅ [PaymentAdapter.createRazorpayOrder] Razorpay order created
✅ [RazorpayService.verifyPaymentSignature] Signature verified successfully
✅ [PaymentAdapter.verifyPayment] Payment verification completed successfully
```

### ❌ Error Pattern
```
❌ [RazorpayService] "Razorpay credentials not configured"
   → Fix: Check .env.local and restart server

❌ [RazorpayService.createOrder] "Razorpay API Error"
   → Fix: Check API key validity and network

❌ [RazorpayService.verifyPaymentSignature] "Signature verification failed"
   → Fix: Check KEY_SECRET has no extra spaces
```

---

## 🎯 Verification Checklist

- [ ] `.env.local` updated with test credentials
- [ ] Dev server restarted
- [ ] Backend logs show "Service initialized" ✅
- [ ] `POST /api/payment/create-razorpay-order` returns order_id
- [ ] Order ID format: `order_xxxxxxxxxxxxx`
- [ ] Amount in response is in paise (100 paise = ₹1)
- [ ] Razorpay script loaded (`typeof Razorpay === "function"`)
- [ ] Debug component appears on order page
- [ ] Debug component can create orders
- [ ] Checkout modal opens successfully
- [ ] Test payment completes
- [ ] Server logs show signature verification ✅
- [ ] Payment log created in database
- [ ] Transaction appears in Razorpay dashboard (TEST MODE)

---

## 🚀 After Everything Works

```bash
# 1. Run full test suite
npx ts-node scripts/test-razorpay-flow.ts YOUR_ORDER_ID

# 2. Check all logs
# - Browser console: window.razorpayDebugFrontend.printReport()
# - Server console: Look for all ✅ entries

# 3. Verify database
# db.payments_log.findOne({status: "SUCCESS"})

# 4. Check dashboard
# Razorpay dashboard → Payments → TEST MODE → Your transaction

# 5. Remove debug component (optional)
# Delete RazorpayDebugComponent from order page

# 6. Deploy!
# Update .env with live credentials
# Deploy to production
```

---

## 📞 Quick Reference

**Test Credentials**:
- Key: `rzp_test_Sfj4ep6wqxAupk`
- Secret: `Qc8EslwVogEz6H5QCc8BRN43`
- Test Card: `4111 1111 1111 1111`
- OTP: `123456`

**Endpoints**:
- Create: `POST /api/payment/create-razorpay-order`
- Verify: `POST /api/payment/verify`
- Webhooks: `POST /api/payment/webhook`

**Databases**:
- Orders: `db.orders`
- Payments: `db.payments_log`

**Dashboards**:
- Razorpay: https://dashboard.razorpay.com
- Mode: Make sure TEST MODE is on (toggle in dashboard)

---

## 🎓 Full Documentation

- [RAZORPAY_DEBUG_TESTING_GUIDE.md](./RAZORPAY_DEBUG_TESTING_GUIDE.md) - Complete step-by-step guide
- [RAZORPAY_DEBUGGING_INFRASTRUCTURE.md](./RAZORPAY_DEBUGGING_INFRASTRUCTURE.md) - Architecture & infrastructure
- [RAZORPAY_INTEGRATION_GUIDE.md](./RAZORPAY_INTEGRATION_GUIDE.md) - Original integration guide

---

## ⚠️ Important

- ✅ All changes are **non-invasive** (no existing logic modified)
- ✅ All changes are **fully reversible** (can remove debug files)
- ✅ Debug component **dev-mode only** (not in production)
- ✅ Logging **disabled in production** (NODE_ENV check)
- ✅ Existing orders/APIs **completely untouched**

---

**Status**: ✅ Ready to debug and test payment flow

**Last Updated**: 2024
