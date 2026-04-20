# Razorpay Payment Adapter - Quick Reference

## Quick Start (5 Minutes)

### 1. Backend is Ready ✅
- Payment adapter endpoints are at `/api/payment/`
- Database table `payments_log` is ready
- Test credentials are configured

### 2. Add Razorpay Script to Your Frontend
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 3. Create Simple Integration

```javascript
// After order is created (you get orderId)
const handlePayment = async (orderId) => {
  // Step 1: Create Razorpay order
  const res = await fetch('/api/payment/create-razorpay-order', {
    method: 'POST',
    body: JSON.stringify({ existingOrderId: orderId })
  });
  
  const data = await res.json();
  
  // Step 2: Open checkout
  const rzp = new Razorpay({
    key: data.razorpay_key,
    order_id: data.razorpay_order_id,
    amount: data.amount,
    handler: async (response) => {
      // Step 3: Verify on backend
      const verify = await fetch('/api/payment/verify', {
        method: 'POST',
        body: JSON.stringify({
          existingOrderId: orderId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature
        })
      });
      
      const result = await verify.json();
      if (result.success) alert('✅ Payment Successful!');
    }
  });
  
  rzp.open();
};
```

---

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payment/create-razorpay-order` | POST | Create Razorpay order for existing order |
| `/api/payment/verify` | POST | Verify payment signature |
| `/api/payment/webhook` | POST | Razorpay webhook handler |

---

## Key Concepts

### Original Order vs Payment Log

```
┌─────────────────────────┐
│   Original Order        │
│  (unchanged by payment) │
│  - id                   │
│  - total                │
│  - status               │  
│  - items                │
└─────────────────────────┘
          ↓ (payment adapter reads only)
┌─────────────────────────┐
│   Payment Log           │
│  (new, isolated table)  │
│  - existingOrderId      │
│  - razorpayOrderId      │
│  - razorpayPaymentId    │
│  - status               │
└─────────────────────────┘
```

**Important**: Payment Log tracks payments. Original order is never modified by payment system.

---

## Request/Response Examples

### Create Razorpay Order

**Request**:
```javascript
{
  "existingOrderId": "507f1f77bcf86cd799439011",
  "amount": 499.99  // optional
}
```

**Response**:
```javascript
{
  "success": true,
  "razorpay_order_id": "order_1Aa00000000001",
  "razorpay_key": "rzp_test_Sfj4ep6wqxAupk",
  "amount": 49999,          // in paise
  "currency": "INR",
  "paymentLogId": "507f1f77bcf86cd799439012"
}
```

### Verify Payment

**Request**:
```javascript
{
  "existingOrderId": "507f1f77bcf86cd799439011",
  "razorpayPaymentId": "pay_1Aa00000000001",
  "razorpayOrderId": "order_1Aa00000000001",
  "razorpaySignature": "9ef4dffbfd84f1318f..."
}
```

**Response (Success)**:
```javascript
{
  "success": true,
  "message": "Payment verified successfully",
  "paymentId": "pay_1Aa00000000001"
}
```

**Response (Failure)**:
```javascript
{
  "success": false,
  "message": "Payment verification failed"
}
```

---

## Testing Checklist

- [ ] Can create order via `/api/orders` → get orderId
- [ ] Call `/api/payment/create-razorpay-order` with orderId
- [ ] Receive razorpay_order_id and checkout key
- [ ] Razorpay modal opens
- [ ] Try test card: 4111 1111 1111 1111
- [ ] OTP: 123456
- [ ] Call `/api/payment/verify` with payment details
- [ ] Get success response
- [ ] Check `payments_log` table in MongoDB

### Test Cards (From Razorpay)

| Card Number | Expiry | CVV | Status |
|------------|--------|-----|--------|
| 4111 1111 1111 1111 | Any future | Any 3 digits | SUCCESS |
| 4444 3333 2222 1111 | Any future | Any 3 digits | FAIL |

---

## Security Points

✅ **Signature Verification**: All payments verified with HMAC SHA256  
✅ **No Secrets in Frontend**: API keys never exposed to client  
✅ **Database Isolation**: Payment data in separate table  
✅ **Webhook Security**: Webhook signature verified  
✅ **No Order Modification**: Original orders never touched by payment system  

---

## Common Issues

### Order not found
```
Solution: Ensure order exists before calling payment endpoint
Debug: Check orderId format (24-char MongoDB ObjectId)
```

### Invalid signature error
```
Solution: Verify RAZORPAY_KEY_SECRET in .env.local
Debug: Check that signature comes directly from Razorpay
```

### Amount not matching
```
Solution: Either provide amount in request OR ensure order.total is set
Debug: Check order.total field in database
```

---

## What's New vs What's Unchanged

### ✅ Unchanged (Not Affected)
- `/api/orders` endpoint - still works same way
- Order creation logic - no changes
- Order database schema - not modified
- Authentication - no changes
- Existing UI/frontend - compatible

### 🆕 New (Added)
- `/api/payment/create-razorpay-order` endpoint
- `/api/payment/verify` endpoint
- `/api/payment/webhook` endpoint
- `payments_log` database table
- Razorpay adapter service
- Payment validators

---

## Integration Flow

```
User fills order form
         ↓
Click "Proceed to Payment"
         ↓
Order created at /api/orders
         ↓ (get orderId)
↓
Call /api/payment/create-razorpay-order
         ↓ (get razorpay_order_id)
↓
Open Razorpay Checkout Modal
         ↓
User completes payment
         ↓
Call /api/payment/verify
         ↓
SUCCESS → Show confirmation
FAILED → Show error
```

---

## Next Steps (Optional Enhancements)

1. **Auto-update Order Status**
   - On payment success, auto-mark order as CONFIRMED
   - Requires additional logic in frontend or backend

2. **Send Confirmation Email**
   - After payment verification
   - Include invoice, tracking info, etc.

3. **Payment Dashboard**
   - Show payment status in user dashboard
   - Query `payments_log` table

4. **Refund Handling**
   - Process refunds via Razorpay API
   - Update payment log status to REFUNDED

5. **Analytics**
   - Track payment success rate
   - Monitor failed payments

---

## File Locations

```
Backend Code:
  lib/razorpay.ts                  - Razorpay service
  lib/payment-adapter.ts           - Payment adapter logic
  app/api/payment/*/route.ts       - API endpoints

Database:
  prisma/schema.prisma             - PaymentLog model (added)

Validation:
  src/lib/validators.ts            - Payment schemas (added)

Documentation:
  docs/RAZORPAY_INTEGRATION_GUIDE.md  - Full guide
  docs/RAZORPAY_QUICK_REFERENCE.md   - This file

Config:
  .env.local                        - Razorpay credentials
```

---

## Support

- **Documentation**: See `RAZORPAY_INTEGRATION_GUIDE.md`
- **API Docs**: https://razorpay.com/docs/
- **Dashboard**: https://dashboard.razorpay.com
- **Status**: Check server logs for details
