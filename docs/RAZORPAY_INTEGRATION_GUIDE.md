# Razorpay Payment Adapter Integration Guide

## Overview

This document describes the Razorpay payment adapter layer that has been added to the system. This adapter is **completely isolated** from the existing order system and can be removed without affecting any existing functionality.

### Key Principles

✅ **Non-Invasive**: Does not modify any existing APIs, controllers, services, or database structures  
✅ **Additive Only**: All new code is isolated in `/app/api/payment/` directory  
✅ **Independent**: Can be removed entirely without breaking the core system  
✅ **Test Mode**: Uses Razorpay TEST MODE keys for development  

---

## Architecture

```
Frontend Application
         ↓
    Order Created (existing flow unchanged)
         ↓
  [New Payment Layer]
         ↓
  /api/payment/create-razorpay-order ← Creates Razorpay order
         ↓
  Razorpay Checkout Modal
         ↓
  Payment Success/Failure
         ↓
  /api/payment/verify ← Verifies signature & logs payment
         ↓
  payments_log table (new, isolated)
```

### Data Flow

1. **Order Creation** (existing, unchanged)
   - Frontend calls `/api/orders` with order data
   - Returns `order_id` (internal system)
   - Original order stored in `orders` collection

2. **Payment Setup** (new, optional)
   - Frontend calls `/api/payment/create-razorpay-order` with `order_id`
   - Backend fetches order details (read-only)
   - Creates Razorpay order
   - Stores mapping in `payments_log` table
   - Returns `razorpay_order_id` and Razorpay key

3. **Razorpay Checkout**
   - Frontend opens Razorpay checkout modal
   - User completes payment

4. **Payment Verification** (new, optional)
   - Frontend calls `/api/payment/verify` with payment details
   - Backend verifies signature cryptographically
   - Updates `payments_log` with status (SUCCESS/FAILED)
   - **Does NOT modify original order**

---

## API Endpoints

### 1. Create Razorpay Order

**Endpoint**: `POST /api/payment/create-razorpay-order`

**Purpose**: Create a Razorpay order linked to an existing internal order

**Request Body**:
```json
{
  "existingOrderId": "507f1f77bcf86cd799439011",
  "amount": 499.99,
  "userEmail": "customer@example.com",
  "userPhone": "+919999999999",
  "userName": "John Doe"
}
```

**Parameters**:
- `existingOrderId` (required): MongoDB ObjectId of the order created via `/api/orders`
- `amount` (optional): Amount in INR. If not provided, fetches from order total
- `userEmail` (optional): Customer email (if not provided, uses order's guestEmail)
- `userPhone` (optional): Customer phone (if not provided, uses order's guestPhone)
- `userName` (optional): Customer name (if not provided, uses order's guestName)

**Response**:
```json
{
  "success": true,
  "razorpay_order_id": "order_1Aa00000000001",
  "razorpay_key": "rzp_test_Sfj4ep6wqxAupk",
  "amount": 49999,
  "currency": "INR",
  "paymentLogId": "507f1f77bcf86cd799439012"
}
```

**Error Cases**:
```json
{ "error": "Order not found" }
{ "error": "Invalid amount. Please provide a valid amount..." }
{ "error": "Failed to create Razorpay order" }
```

---

### 2. Verify Payment

**Endpoint**: `POST /api/payment/verify`

**Purpose**: Verify the payment signature and update payment log

**Request Body**:
```json
{
  "existingOrderId": "507f1f77bcf86cd799439011",
  "razorpayPaymentId": "pay_1Aa00000000001",
  "razorpayOrderId": "order_1Aa00000000001",
  "razorpaySignature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
}
```

**Parameters**:
- `existingOrderId` (required): Internal order ID
- `razorpayPaymentId` (required): Payment ID from Razorpay
- `razorpayOrderId` (required): Order ID from Razorpay
- `razorpaySignature` (required): Signature from Razorpay checkout

**Response (Success)**:
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "paymentId": "pay_1Aa00000000001"
}
```

**Response (Failure)**:
```json
{
  "success": false,
  "message": "Payment verification failed"
}
```

**Important**: This endpoint verifies the signature cryptographically. It does NOT modify the original order, only updates the payment log.

---

### 3. Webhook (Optional)

**Endpoint**: `POST /api/payment/webhook`

**Purpose**: Receive payment events directly from Razorpay servers

**Headers Required**:
```
X-Razorpay-Signature: <HMAC SHA256 signature>
Content-Type: application/json
```

**Handled Events**:
- `payment.authorized`: Payment successful
- `payment.captured`: Payment captured
- `payment.failed`: Payment failed
- `order.paid`: Order fully paid

**Note**: This endpoint is optional for development. Configure it in Razorpay dashboard under Webhooks settings.

---

## Frontend Implementation

### Step 1: Create Order (Existing Flow - No Changes)

```javascript
// This is your existing order creation - NO CHANGES NEEDED
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '9999999999',
    cardType: 'Premium NFC Card',
    price: 499.99,
    // ... other order fields
  })
});

const { id: orderId, total } = await response.json();
console.log('Order created:', orderId);
```

### Step 2: Create Razorpay Order (New)

```javascript
// Call the new payment adapter endpoint
const paymentResponse = await fetch('/api/payment/create-razorpay-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    existingOrderId: orderId,
    // amount is optional, will use order.total if not provided
    userEmail: 'john@example.com',
    userPhone: '9999999999',
    userName: 'John Doe'
  })
});

const paymentData = await paymentResponse.json();
console.log('Razorpay order created:', paymentData.razorpay_order_id);
```

### Step 3: Open Razorpay Checkout (New)

```javascript
// Load Razorpay checkout script
const script = document.createElement('script');
script.src = 'https://checkout.razorpay.com/v1/checkout.js';
document.body.appendChild(script);

script.onload = () => {
  const options = {
    key: paymentData.razorpay_key,
    amount: paymentData.amount,
    currency: paymentData.currency,
    order_id: paymentData.razorpay_order_id,
    handler: function (response) {
      // Payment successful - verify on backend
      verifyPayment(response);
    },
    prefill: {
      email: 'john@example.com',
      contact: '9999999999'
    },
    theme: {
      color: '#3399cc'
    }
  };

  const rzp1 = new window.Razorpay(options);
  rzp1.open();
};
```

### Step 4: Verify Payment (New)

```javascript
async function verifyPayment(response) {
  const verifyResponse = await fetch('/api/payment/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      existingOrderId: orderId,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpayOrderId: response.razorpay_order_id,
      razorpaySignature: response.razorpay_signature
    })
  });

  const result = await verifyResponse.json();
  
  if (result.success) {
    console.log('✅ Payment verified successfully!');
    // Now you can:
    // - Show success message
    // - Send confirmation email
    // - Update UI
    // - Redirect to success page
  } else {
    console.log('❌ Payment verification failed');
    // Handle failure
  }
}
```

### Complete Integration Example

```javascript
async function handleOrderCheckout() {
  try {
    // Step 1: Create order (your existing code)
    const orderResponse = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9999999999',
        cardType: 'Premium NFC Card',
        price: 499.99
      })
    });

    const order = await orderResponse.json();
    const orderId = order.id;

    // Step 2: Create Razorpay order
    const paymentResponse = await fetch('/api/payment/create-razorpay-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        existingOrderId: orderId,
        userEmail: 'john@example.com',
        userPhone: '9999999999'
      })
    });

    const paymentData = await paymentResponse.json();

    // Step 3: Load Razorpay and open checkout
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    
    script.onload = () => {
      const options = {
        key: paymentData.razorpay_key,
        amount: paymentData.amount,
        currency: 'INR',
        order_id: paymentData.razorpay_order_id,
        handler: async (response) => {
          // Step 4: Verify payment
          const verifyResponse = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              existingOrderId: orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            })
          });

          const result = await verifyResponse.json();
          if (result.success) {
            // Show success message
            alert('✅ Payment successful!');
            // Redirect or update UI
            window.location.href = '/order-success?orderId=' + orderId;
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    };

    document.body.appendChild(script);
  } catch (error) {
    console.error('Checkout error:', error);
  }
}
```

---

## Database Schema

### New Table: `payments_log`

This table tracks all payment transactions. **It does NOT modify existing order records**.

```javascript
// Prisma Schema (already added to schema.prisma)
model PaymentLog {
  id String @id @default(auto()) @map("_id") @db.ObjectId

  // Link to existing order
  existingOrderId String @db.ObjectId
  
  // Razorpay payment details
  razorpayOrderId   String @unique
  razorpayPaymentId String?
  razorpaySignature String?

  // Payment info
  amount   Float
  currency String @default("INR")
  status   String @default("PENDING") // PENDING, SUCCESS, FAILED

  // Optional user details
  userEmail  String?
  userPhone  String?
  userName   String?

  // Metadata
  metadata Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([existingOrderId])
  @@index([razorpayOrderId])
  @@index([status])
  @@map("payments_log")
}
```

**Example Document**:
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "existingOrderId": "507f1f77bcf86cd799439011",
  "razorpayOrderId": "order_1Aa00000000001",
  "razorpayPaymentId": "pay_1Aa00000000001",
  "razorpaySignature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d",
  "amount": 499.99,
  "currency": "INR",
  "status": "SUCCESS",
  "userEmail": "john@example.com",
  "userPhone": "+919999999999",
  "userName": "John Doe",
  "metadata": { ... },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

---

## Environment Variables

Add these to your `.env.local` file:

```env
# Razorpay Payment Integration (Test Mode)
RAZORPAY_KEY_ID="rzp_test_Sfj4ep6wqxAupk"
RAZORPAY_KEY_SECRET="your_razorpay_secret_key_here"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret_here"
```

**To get these credentials**:
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to Settings → API Keys
3. Copy TEST KEY ID and SECRET
4. For webhooks, go to Settings → Webhooks → Create Webhook

---

## Important Notes

### ✅ What's Preserved

- **Original order flow** remains 100% unchanged
- **Existing database** is not modified (new PaymentLog table is additive)
- **All existing APIs** work exactly as before
- **No breaking changes** to frontend or backend

### ⚠️ Payment Flow Assumptions

1. Payment is **optional** - you can still create orders without payment
2. Payment log only tracks payment transactions, **not order status**
3. Original order status is independent of payment status
4. You may want to add additional logic to auto-update order status on payment success

### 🔒 Security

- Payment verification uses HMAC SHA256 signature verification
- Signatures are cryptographically verified on the backend
- Webhook signatures are also verified
- Private key is never exposed to frontend
- All sensitive operations happen on the backend only

### 🚀 Production Checklist

- [ ] Replace TEST KEY with LIVE KEY when ready
- [ ] Configure webhook URL in Razorpay dashboard
- [ ] Test payment flow end-to-end
- [ ] Set up email notifications on payment success
- [ ] Consider adding order status auto-update on payment success
- [ ] Add payment status display on dashboard
- [ ] Test refund flow (if needed)
- [ ] Monitor payment logs for issues
- [ ] Set up payment failure notifications

---

## Troubleshooting

### "Order not found" Error

**Cause**: Order ID doesn't exist or is incorrect format  
**Solution**: Verify order was created successfully before calling payment endpoint

### "Invalid amount" Error

**Cause**: Amount is 0, negative, or not provided and order has no total  
**Solution**: Ensure amount is positive or order has a valid total field

### "Invalid signature" Error

**Cause**: Signature verification failed  
**Solution**:
- Verify RAZORPAY_KEY_SECRET is correct
- Ensure all payment details match (order_id, payment_id, signature)
- Check that signature matches exactly from Razorpay response

### Payment verified but order not updated

**This is expected behavior!** The payment adapter only logs payment status in `payments_log` table. It doesn't modify the original order. You may want to:
- Auto-update order status on payment success
- Send confirmation email
- Create fulfillment workflow
- Add custom logic as needed

---

## API Response Mappings

### Successful Payment Creation
```
Frontend Call:    POST /api/payment/create-razorpay-order
Backend Returns:  razorpay_order_id, amount, currency
Frontend Next:    Open Razorpay Checkout with this data
```

### Successful Payment Verification
```
Frontend Call:    POST /api/payment/verify
Backend Does:     Verify signature, Update payments_log
Backend Returns:  { success: true, paymentId: "pay_xxx" }
Frontend Next:    Show success, Redirect to confirmation page
```

### Failed Payment Verification
```
Frontend Call:    POST /api/payment/verify
Backend Does:     Verify signature (fails), Update payments_log with FAILED
Backend Returns:  { success: false, message: "Payment verification failed" }
Frontend Next:    Show error message, Retry or Cancel
```

---

## File Structure

```
app/
  api/
    payment/                          ← New Payment Adapter Layer
      create-razorpay-order/
        route.ts                       ← Create Razorpay order
      verify/
        route.ts                       ← Verify payment
      webhook/
        route.ts                       ← Razorpay webhook handler

lib/
  razorpay.ts                         ← Razorpay service (new)
  payment-adapter.ts                  ← Payment adapter service (new)

prisma/
  schema.prisma                       ← Updated with PaymentLog model

src/
  lib/
    validators.ts                     ← Updated with payment schemas
```

---

## Support & Questions

This payment adapter is:
- **Completely isolated** from core system
- **Non-breaking** - can be removed without affecting existing code
- **Well-documented** - with examples and guides
- **Production-ready** - but using TEST MODE by default

For issues or questions, refer to:
1. This documentation
2. Razorpay API docs: https://razorpay.com/docs/
3. Backend logs: Check server console for detailed error messages
