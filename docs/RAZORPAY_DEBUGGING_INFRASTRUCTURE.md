# Razorpay Payment Flow - Debugging & Testing Infrastructure

## Overview

This document describes the comprehensive debugging and testing infrastructure that has been added to fix and validate the Razorpay test mode payment flow. All additions are **non-invasive** and **fully reversible** - no existing business logic, APIs, or database structures were modified.

---

## What Was Added (10 Files)

### Backend Debugging & Logging

1. **lib/razorpay-debug.ts** (NEW)
   - Centralized debugging utility for backend
   - Environment variable validation
   - Comprehensive logging with severity levels (INFO, SUCCESS, WARN, ERROR)
   - Development-only logging (disabled in production)

2. **lib/razorpay.ts** (ENHANCED)
   - Added logging to constructor (validates env vars, logs initialization)
   - Added logging to `createOrder()` method (tracks order creation flow)
   - Added logging to `verifyPaymentSignature()` method (tracks signature verification)
   - Added logging to `verifyWebhookSignature()` method (webhook validation)
   - **No logic changes** - only added logging

3. **lib/payment-adapter.ts** (ENHANCED)
   - Added logging to `createRazorpayOrder()` method
   - Added logging to `verifyPayment()` method
   - Added logging to `getPaymentAdapterService()` initialization
   - **No logic changes** - only added logging

4. **app/api/payment/create-razorpay-order/route.ts** (ENHANCED)
   - Added detailed request/response logging
   - Added validation error logging
   - Added order lookup logging
   - **No logic changes** - only added logging

5. **app/api/payment/verify/route.ts** (ENHANCED)
   - Added request logging
   - Added validation logging
   - Added verification result logging
   - **No logic changes** - only added logging

### Frontend Debugging & Testing

6. **lib/razorpay-debug-frontend.ts** (NEW)
   - Frontend-only debugging utility
   - Test order creation function
   - Test checkout opening function
   - Test payment verification function
   - Comprehensive logging
   - Logs exported to console for analysis
   - Attached to `window.razorpayDebugFrontend` for browser console access

7. **components/RazorpayDebugComponent.tsx** (NEW)
   - Visual debug panel for development mode
   - Step-by-step payment flow testing
   - One-click order creation
   - One-click checkout opening
   - Debug report generation
   - Log export functionality
   - **Conditionally rendered** (dev mode only, does NOT appear in production)

### Testing & Documentation

8. **scripts/test-razorpay-flow.ts** (NEW)
   - Node.js test script for API testing
   - Validates order existence
   - Tests create-order endpoint
   - Checks payment log creation
   - Comprehensive test reporting
   - Can be run: `npx ts-node scripts/test-razorpay-flow.ts ORDER_ID`

9. **docs/RAZORPAY_DEBUG_TESTING_GUIDE.md** (NEW)
   - Complete step-by-step debugging guide
   - Environment validation procedures
   - API testing with cURL
   - Frontend testing procedures
   - Database verification steps
   - Razorpay dashboard verification
   - Troubleshooting guide with solutions
   - Console debugging commands

10. **This Document** (NEW)
    - Overview of all debugging infrastructure
    - Quick start guide
    - Usage examples

---

## How Everything Works

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │       RazorpayDebugComponent (Dev Mode Only)           │  │
│  │  - Step 1: Create Order                                │  │
│  │  - Step 2: Open Checkout                               │  │
│  │  - Print Debug Report                                  │  │
│  │  - Export Logs                                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                           │                                   │
│  ┌────────────────────────▼────────────────────────────────┐  │
│  │   razorpay-debug-frontend.ts                            │  │
│  │   - Test order creation                                 │  │
│  │   - Test checkout opening                               │  │
│  │   - Test payment verification                           │  │
│  │   - Attached to: window.razorpayDebugFrontend           │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │ HTTP API │
┌─────────────────────────▼─────────────────────────────────────┐
│                   Backend (Next.js)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              API Endpoints (Enhanced)                     │   │
│  │  - POST /api/payment/create-razorpay-order              │   │
│  │  - POST /api/payment/verify                              │   │
│  │  - POST /api/payment/webhook                             │   │
│  │                                                           │   │
│  │  ✨ New: Comprehensive logging at each step             │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  razorpay.ts │  │payment-adap  │  │razorpay-debug.ts│    │
│  │              │  │ter.ts        │  │(Validation)     │    │
│  │✨ Enhanced   │  │              │  │                 │    │
│  │Logging       │  │✨ Enhanced   │  │✨ New: Env      │    │
│  │- Service     │  │Logging       │  │validation       │    │
│  │  init        │  │- Flow steps  │  │- Format checks  │    │
│  │- Order       │  │- Log updates │  │- Value logging  │    │
│  │  creation    │  │- Errors      │  │                 │    │
│  │- Signature   │  │              │  │                 │    │
│  │  verification│  │              │  │                 │    │
│  └──────────────┘  └──────────────┘  └──────────────────┘    │
│         │                    │                    │            │
│         └────────────────────┼────────────────────┘            │
│                              ▼                                 │
│                     📊 All logged to console                   │
│                     (dev mode only)                            │
│                                                                │
│  Database Layer:                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Prisma ORM                                               │  │
│  │  - Read existing orders (unchanged)                       │  │
│  │  - Create/update payment logs (unchanged schema)          │  │
│  │                                                            │  │
│  │  MongoDB Collections:                                     │  │
│  │  - orders (unchanged)                                     │  │
│  │  - payments_log (new collection, isolated)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start Guide

### 1. Verify Environment Setup

Ensure `.env.local` has (no extra spaces):

```
RAZORPAY_KEY_ID="rzp_test_Sfj4ep6wqxAupk"
RAZORPAY_KEY_SECRET="Qc8EslwVogEz6H5QCc8BRN43"
RAZORPAY_MODE="test"
```

Restart dev server:
```bash
npm run dev
```

Check server startup logs for:
```
✅ [RazorpayService] Service initialized
✅ [ENV] All environment variables are valid
```

### 2. Test Backend API

**Using cURL**:
```bash
curl -X POST http://localhost:3000/api/payment/create-razorpay-order \
  -H "Content-Type: application/json" \
  -d '{
    "existingOrderId": "PASTE_REAL_ORDER_ID_HERE",
    "amount": 100
  }'
```

**Or using Node.js test script**:
```bash
npx ts-node scripts/test-razorpay-flow.ts PASTE_REAL_ORDER_ID_HERE
```

### 3. Test Frontend UI

Add debug component to your order page:

**In `app/(frontend)/order/page.tsx`** (at the end of return):

```tsx
{process.env.NODE_ENV === 'development' && <RazorpayDebugComponent />}
```

Import it:
```tsx
import RazorpayDebugComponent from '@/components/RazorpayDebugComponent';
```

Then:
- Open `http://localhost:3000/order`
- Find blue debug panel in bottom-right
- Enter order ID and click "Step 1: Create Order"
- Click "Step 2: Open Checkout"
- Use test card: `4111 1111 1111 1111`

### 4. Debug Using Browser Console

```javascript
// Check if Razorpay script loaded
typeof Razorpay  // Should return "function"

// Print debug report
window.razorpayDebugFrontend.printReport()

// Export logs
window.razorpayDebugFrontend.exportLogs()
```

---

## Logging Output Examples

### Backend Console Output

```
✅ [RazorpayService] Service initialized
   Data: {
     keyIdPrefix: "rzp_test_Sfj4eu...",
     keySecretLength: 24,
     mode: "test"
   }

✅ [RazorpayService.createOrder] Creating Razorpay order
   Data: {
     amount: 10000,
     currency: "INR",
     amountInINR: 100
   }

✅ [RazorpayService.createOrder] Order created successfully
   Data: {
     orderId: "order_1234567890ABC",
     amount: 10000,
     status: "created"
   }

✅ [PaymentAdapter.createRazorpayOrder] Razorpay order created
   Data: {
     razorpayOrderId: "order_1234567890ABC",
     amount: 10000
   }

✅ [POST /api/payment/create-razorpay-order] Order creation successful
   Data: {
     razorpayOrderId: "order_1234567890ABC",
     amount: 10000
   }
```

### Frontend Console Output

```
✅ [Frontend] Razorpay script loaded successfully

✅ [TestAPI] Order created successfully
   Data: {
     razorpayOrderId: "order_1234567890ABC",
     razorpayKey: "rzp_test_Sfj4eu...",
     amount: 10000,
     currency: "INR"
   }

✅ [TestCheckout] Payment handler called
   Data: {
     paymentId: "pay_1234567890ABC",
     orderId: "order_1234567890ABC",
     signature: "9f2dd3ae3c3dc..."
   }

✅ [TestVerify] Payment verified successfully
   Data: {
     paymentId: "pay_1234567890ABC",
     message: "Payment verified successfully"
   }
```

---

## Testing Checklist

- [ ] **Environment**: `.env.local` has correct credentials (no spaces)
- [ ] **Server**: Dev server restarted after env changes
- [ ] **Logs**: Backend startup shows "✅ Service initialized"
- [ ] **API**: `POST /api/payment/create-razorpay-order` works
- [ ] **Order**: Response includes `razorpay_order_id` starting with "order_"
- [ ] **Script**: Browser console shows `typeof Razorpay === 'function'`
- [ ] **Component**: Debug panel appears in bottom-right (dev mode)
- [ ] **UI Test**: Can create order via debug panel
- [ ] **Checkout**: Checkout modal opens
- [ ] **Payment**: Test payment completes
- [ ] **Verification**: Server logs show signature verified
- [ ] **Database**: Payment log entry exists with SUCCESS status
- [ ] **Dashboard**: Transaction visible in Razorpay dashboard (TEST MODE)

---

## File Locations & Purposes

| File | Purpose | Status |
|------|---------|--------|
| `lib/razorpay-debug.ts` | Backend debug utility | ✨ NEW |
| `lib/razorpay-debug-frontend.ts` | Frontend debug utility | ✨ NEW |
| `lib/razorpay.ts` | Razorpay service | 🔧 Enhanced |
| `lib/payment-adapter.ts` | Payment adapter | 🔧 Enhanced |
| `app/api/payment/create-razorpay-order/route.ts` | Create order endpoint | 🔧 Enhanced |
| `app/api/payment/verify/route.ts` | Verify payment endpoint | 🔧 Enhanced |
| `components/RazorpayDebugComponent.tsx` | Debug UI panel | ✨ NEW |
| `scripts/test-razorpay-flow.ts` | API test script | ✨ NEW |
| `docs/RAZORPAY_DEBUG_TESTING_GUIDE.md` | Testing guide | ✨ NEW |

---

## Important Notes

### Non-Invasive Changes

✅ **All changes are additive only**:
- No existing business logic modified
- No existing APIs modified
- No UI components changed
- No database schema changes (PaymentLog already added)
- No existing order creation flow affected
- Debug component is dev-mode only

✅ **Fully Reversible**:
- Remove debug files if needed
- Remove logging imports from services
- Remove debug component from pages
- Everything continues to work

### Production Safety

- Debug logging disabled in production (`NODE_ENV !== 'production'`)
- Debug component not rendered in production
- No hardcoded values in code
- All credentials from environment variables
- Webhook validation in place

### Security

- No secrets logged in production
- Frontend receives only public key (KEY_ID)
- Backend-only access to secret key
- HMAC signature verification enabled
- Git protection via `.gitignore`

---

## Next Steps

1. **Verify Setup**: Follow [RAZORPAY_DEBUG_TESTING_GUIDE.md](./RAZORPAY_DEBUG_TESTING_GUIDE.md)
2. **Test Flow**: Use debug component or test script
3. **Check Results**: Verify database and Razorpay dashboard
4. **Deploy**: When confident, deploy to production with live credentials

---

## Troubleshooting

**Logs not appearing?**
- Check `NODE_ENV` is not 'production'
- Restart dev server
- Check browser console (F12)

**Debug panel not showing?**
- Ensure component is imported and rendered
- Check `process.env.NODE_ENV === 'development'`
- Check dev server is running locally (not deployed)

**Payment not verifying?**
- Check `RAZORPAY_KEY_SECRET` has no extra spaces
- Restart dev server after env changes
- Check server logs for signature mismatch errors

**API returning errors?**
- Check order ID is valid (MongoDB ObjectId format)
- Check amount is positive integer
- Check `.env.local` has all required variables
- Check network tab for exact error response

---

## Documentation Index

- [RAZORPAY_DEBUG_TESTING_GUIDE.md](./RAZORPAY_DEBUG_TESTING_GUIDE.md) - Step-by-step testing guide
- [RAZORPAY_INTEGRATION_GUIDE.md](./RAZORPAY_INTEGRATION_GUIDE.md) - Integration reference
- [RAZORPAY_ENV_SECURITY.md](./RAZORPAY_ENV_SECURITY.md) - Security best practices
- [RAZORPAY_ENV_VERIFICATION.md](./RAZORPAY_ENV_VERIFICATION.md) - Verification checklist

---

## Support

For detailed testing procedures, see [RAZORPAY_DEBUG_TESTING_GUIDE.md](./RAZORPAY_DEBUG_TESTING_GUIDE.md)

For troubleshooting specific issues, check the Troubleshooting Guide section in that document.
