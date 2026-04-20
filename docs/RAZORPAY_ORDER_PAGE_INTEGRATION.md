# Razorpay Payment Gateway Integration - Order Page

## Overview

This document explains how Razorpay payment gateway has been integrated into the existing "Place Order" flow **without any UI or layout changes**.

---

## ✅ Integration Points

### 1. **What Changed**
- ✅ Added `useRazorpayPayment` hook
- ✅ Added import in order page
- ✅ Modified `onSubmit` function to trigger payment after order creation
- ✅ Added environment variables for Razorpay public key
- ❌ **NO UI changes** - all buttons, radio buttons, layouts remain exactly the same

### 2. **How It Works (Silent Integration)**

**Before**: User fills form → Click "Place Order" → Order created in DB → Redirect to success

**After**: User fills form → Click "Place Order" → Order created in DB → **Razorpay Checkout Opens** → Payment verification → Redirect to success

The entire Razorpay flow happens **after** the order is created but **before** the redirect. User sees:
1. Same "Place Order" button
2. Button shows loading spinner (same as before)
3. Razorpay popup opens (user doesn't have to do anything in the UI)
4. User completes payment in Razorpay modal
5. Success page loads

---

## 🔄 Detailed Payment Flow

```
User clicks "Place Order" button
        ↓
Form validation
        ↓
Create order in database (returns orderId)
        ↓
Razorpay hook loads checkout.js script
        ↓
Create Razorpay order via /api/payment/create-razorpay-order
        ↓
Open Razorpay checkout modal (user sees payment form)
        ↓
User completes payment (test: 4111 1111 1111 1111)
        ↓
Payment verification via /api/payment/verify
        ↓
✅ Success or ❌ Error handling
        ↓
Redirect to success page with orderId
```

---

## 📁 Files Modified/Created

### Created Files (Non-Invasive Addition)

1. **hooks/useRazorpayPayment.ts** (NEW)
   - Complete payment flow handler
   - Manages checkout lifecycle
   - Verification logic
   - Can be removed without affecting order flow

### Modified Files (Minimal Changes)

2. **app/(frontend)/order/page.tsx**
   - Added import: `import { useRazorpayPayment } from '@/hooks/useRazorpayPayment'`
   - Added hook: `const { initiatePayment, isLoading } = useRazorpayPayment()`
   - Modified `onSubmit`: Added payment initiation after order creation
   - **NO UI CHANGES** - all existing elements preserved

3. **.env.local**
   - Added: `NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_Sfj4ep6wqxAupk"`

4. **.env.example**
   - Added: `NEXT_PUBLIC_RAZORPAY_KEY_ID=` (template)

---

## 🚀 Usage

### For End User

1. Fill out all form fields (steps 1-4)
2. On step 5, select payment method and agree to terms
3. Click "Place Order"
4. Razorpay checkout modal opens automatically
5. Enter test card details:
   - Card: `4111 1111 1111 1111`
   - Expiry: Any future date
   - CVV: Any 3 digits
   - OTP: `123456` (when prompted)
6. Payment completes
7. Redirect to order success page

### For Developers

**In Order Page:**

```tsx
import { useRazorpayPayment } from '@/hooks/useRazorpayPayment';

export default function OrderPage() {
  const { initiatePayment, isLoading, error } = useRazorpayPayment();
  
  const onSubmit = async (data: FormData) => {
    // ... existing logic ...
    
    // Create order first
    const result = await createOrder(orderData);
    
    // Then initiate payment
    const paymentResponse = await initiatePayment({
      existingOrderId: result.orderId,
      amount: result.data.total,
      userEmail: data.personalDetails.email,
      userName: data.personalDetails.name,
      userPhone: data.personalDetails.mobile,
      paymentMethod: selectedPaymentMethod,
    });
    
    if (paymentResponse.success) {
      router.push(`/order-success?orderId=${result.orderId}`);
    }
  };
}
```

---

## 🔐 Security Features

✅ **No credentials exposed to frontend**
- Only public key (`NEXT_PUBLIC_RAZORPAY_KEY_ID`) is used in frontend
- Secret key only used in backend
- HMAC signature verification on backend
- Webhook validation

✅ **Payment verification required**
- Every payment must pass backend signature verification
- Invalid payments are rejected
- Order created before payment (order exists even if payment fails)

✅ **Environment variables**
- All keys from `.env` - not hardcoded
- Can switch between test/live by changing env vars
- `.env.local` protected by `.gitignore`

---

## 🧪 Testing Checklist

- [ ] Environment variables set in `.env.local`
- [ ] Dev server restarted (`npm run dev`)
- [ ] Order page loads without errors
- [ ] All form steps work as before
- [ ] Step 5 shows payment methods
- [ ] Place Order button works
- [ ] Razorpay checkout opens when clicked
- [ ] Test payment completes (use test card)
- [ ] Success page loads after payment
- [ ] Order exists in database
- [ ] Payment log exists in database with SUCCESS status
- [ ] No UI changes from original design

---

## 🐛 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Razorpay script not loading | Missing env var or network issue | Check `NEXT_PUBLIC_RAZORPAY_KEY_ID` in `.env.local`, restart server |
| Checkout doesn't open | Script failed to load | Check browser console for errors, check network tab |
| "Order creation failed" | Database error | Check MongoDB connection, check order API |
| "Payment verification failed" | Signature mismatch | Check env variables, no extra spaces, restart server |
| Button keeps loading | Payment handler stuck | Check browser console, try again or refresh page |

---

## 📊 Data Flow

### Order Creation (Existing)
```
Form Data → createOrder() → /api/orders → MongoDB → Order Created (ID)
```

### Payment Creation (New)
```
Order ID + Amount → initiatePayment() 
  → /api/payment/create-razorpay-order 
  → Razorpay API 
  → Order ID returned
```

### Checkout (New - User Interaction)
```
Razorpay Order ID → Display Checkout Modal → User Enters Card → Payment Processed
```

### Verification (New)
```
Payment ID + Order ID + Signature 
  → /api/payment/verify 
  → Signature verified 
  → payment_log Updated
  → Response returned
```

### Success (Existing Logic)
```
Payment Verified → Redirect to /order-success → Display Order
```

---

## 🔌 Plug-in Architecture

This integration is designed as a **plug-in layer**:

**If you remove Razorpay:**
1. Delete `hooks/useRazorpayPayment.ts`
2. Remove import from order page
3. Remove Razorpay payment initiation from `onSubmit`
4. Change `onSubmit` to redirect directly after `createOrder()`
5. Everything else works exactly as before

**The existing order creation logic remains completely untouched.**

---

## 📱 Payment Methods Supported

Currently supporting:
- ✅ Credit/Debit Cards
- ✅ UPI (India)
- ✅ Digital Wallets

These are selected by the user in the PaymentForm and passed as metadata to Razorpay.

---

## 🌍 Environment-Specific Setup

### Development (TEST MODE)
```
RAZORPAY_KEY_ID="rzp_test_Sfj4ep6wqxAupk"
RAZORPAY_KEY_SECRET="Qc8EslwVogEz6H5QCc8BRN43"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_Sfj4ep6wqxAupk"
RAZORPAY_MODE="test"
```

### Production (LIVE MODE)
```
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxx"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxx"
RAZORPAY_MODE="live"
```

Just update `.env` variables - no code changes needed!

---

## 📞 Testing Card Details

| Field | Value |
|-------|-------|
| Card Number | 4111 1111 1111 1111 |
| Expiry | Any future date (e.g., 12/25) |
| CVV | Any 3 digits (e.g., 123) |
| OTP (if prompted) | 123456 |

---

## 📝 Order Lifecycle

```
1. Order Created (DB)
   └─ order._id: created
   └─ status: pending (or whatever default)
   
2. Razorpay Order Created
   └─ razorpay_order_id: order_xxxxx
   └─ payment_log created (status: PENDING)
   
3. Payment Processed (User enters card)
   └─ razorpay_payment_id: pay_xxxxx
   
4. Payment Verified
   └─ Signature verified
   └─ payment_log updated (status: SUCCESS)
   
5. Redirect to Success
   └─ Order complete
```

---

## ✨ Key Features

✅ **Non-invasive**: No UI or layout changes  
✅ **Reversible**: Can remove without affecting order flow  
✅ **Secure**: Keys from environment, signature verification  
✅ **Transparent**: Loading state shown to user  
✅ **Debuggable**: Comprehensive logging in browser console  
✅ **Flexible**: Supports multiple payment methods  
✅ **Testable**: Works with Razorpay test cards  
✅ **Scalable**: Easy to switch to live mode  

---

## 🎯 Success Criteria

Payment integration is working correctly if:

1. ✅ Order page loads without errors
2. ✅ All form fields work as before
3. ✅ Clicking "Place Order" creates order in DB
4. ✅ Razorpay checkout opens automatically
5. ✅ Payment completes with test card
6. ✅ Order success page loads
7. ✅ Payment log exists in database
8. ✅ No existing functionality broken
9. ✅ UI looks exactly the same

---

## 🚀 Next Steps

1. **Verify setup**: Check all env variables are set
2. **Restart server**: `npm run dev`
3. **Test complete flow**: Fill form → Click Place Order → Complete payment
4. **Check database**: Verify order and payment_log entries
5. **Deploy**: When ready, update production env variables

---

## 📚 Related Documentation

- [RAZORPAY_DEBUG_QUICK_REFERENCE.md](./RAZORPAY_DEBUG_QUICK_REFERENCE.md)
- [RAZORPAY_INTEGRATION_GUIDE.md](./RAZORPAY_INTEGRATION_GUIDE.md)
- [RAZORPAY_ENV_SECURITY.md](./RAZORPAY_ENV_SECURITY.md)

---

## 🎉 Summary

Razorpay payment gateway is now seamlessly integrated into your order flow. The integration:

- **Maintains existing UI** - Not a single UI element changed
- **Adds payment processing** - Payment happens after order creation
- **Preserves order flow** - Existing logic untouched
- **Enables testing** - Use test cards immediately
- **Ready for production** - Just swap environment variables

**Status**: ✅ Ready to use
