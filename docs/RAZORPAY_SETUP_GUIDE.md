# Razorpay Payment Adapter - Setup & Migration Guide

## Overview

This guide walks through setting up the Razorpay payment adapter layer in your existing system.

## Prerequisites

- Node.js 16+
- MongoDB database
- Prisma CLI installed
- Razorpay account (get test keys from dashboard)

## Setup Steps

### Step 1: Update Environment Variables

Edit `.env.local` and add:

```env
# Razorpay Payment Integration (Test Mode)
RAZORPAY_KEY_ID="rzp_test_Sfj4ep6wqxAupk"
RAZORPAY_KEY_SECRET="your_razorpay_secret_key_here"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret_here"
```

**To get these values**:
1. Go to https://dashboard.razorpay.com/signin
2. Navigate to Settings → API Keys
3. Copy TEST KEY ID
4. Copy TEST KEY SECRET
5. For webhook secret, go to Settings → Webhooks and note the secret

### Step 2: Apply Database Migration

The `PaymentLog` model has been added to `prisma/schema.prisma`. Now migrate the database:

```bash
# Generate Prisma Client with new schema
npx prisma generate

# Create migration
npx prisma migrate dev --name add_payment_log_table

# Or just sync schema (if using db push)
npx prisma db push
```

This will:
- ✅ Create the `payments_log` collection in MongoDB
- ✅ Add indexes for efficient queries
- ✅ Update Prisma Client with new types

### Step 3: Verify Installation

Check that all files are in place:

```bash
# Backend services
ls app/api/payment/
  create-razorpay-order/
  verify/
  webhook/

# Libraries
ls lib/
  razorpay.ts                 (new)
  payment-adapter.ts          (new)
  payment.types.ts            (new)

# Documentation
ls docs/
  RAZORPAY_INTEGRATION_GUIDE.md    (new)
  RAZORPAY_QUICK_REFERENCE.md      (new)
```

### Step 4: Start Development Server

```bash
npm run dev
```

The payment endpoints should now be available at:
- `http://localhost:3000/api/payment/create-razorpay-order`
- `http://localhost:3000/api/payment/verify`
- `http://localhost:3000/api/payment/webhook`

### Step 5: Test the Integration

Use the test checklist below or import the test collection into Postman.

---

## Testing the Integration

### Test 1: Check if Backend is Running

```bash
curl http://localhost:3000/api/health
# Should return: { "status": "ok" }
```

### Test 2: Create a Test Order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9999999999",
    "cardType": "Premium Card",
    "price": 499.99
  }'
```

Expected response:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "orderNumber": "ORD-ABC1DEF-XYZ",
  "total": 499.99,
  "status": "PENDING",
  ...
}
```

Save the `id` for the next test.

### Test 3: Create Razorpay Order

```bash
curl -X POST http://localhost:3000/api/payment/create-razorpay-order \
  -H "Content-Type: application/json" \
  -d '{
    "existingOrderId": "507f1f77bcf86cd799439011",
    "amount": 499.99
  }'
```

Expected response:
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

### Test 4: Simulate Payment Verification

This requires actual Razorpay checkout (can't fully test in curl). Instead:

1. Integrate frontend with Razorpay checkout script
2. Use test card: `4111 1111 1111 1111`
3. OTP: `123456`
4. Payment verification will happen automatically

Or use Postman to simulate:

```bash
curl -X POST http://localhost:3000/api/payment/verify \
  -H "Content-Type: application/json" \
  -d '{
    "existingOrderId": "507f1f77bcf86cd799439011",
    "razorpayPaymentId": "pay_1Aa00000000001",
    "razorpayOrderId": "order_1Aa00000000001",
    "razorpaySignature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
  }'
```

**Note**: Signature must be valid. Use a real Razorpay response for testing.

### Test 5: Check Database

Connect to MongoDB and verify:

```javascript
// In MongoDB client
use taxiapp;
db.payments_log.findOne();

// Should return a document like:
{
  "_id": ObjectId("..."),
  "existingOrderId": "507f1f77bcf86cd799439011",
  "razorpayOrderId": "order_1Aa00000000001",
  "amount": 499.99,
  "currency": "INR",
  "status": "PENDING",
  "createdAt": ISODate("2024-01-15T10:30:00.000Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00.000Z")
}
```

---

## Postman Collection

Import this collection to test all endpoints:

```json
{
  "info": {
    "name": "Razorpay Payment Adapter",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Order",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Test User\",\n  \"email\": \"test@example.com\",\n  \"phone\": \"9999999999\",\n  \"cardType\": \"Premium Card\",\n  \"price\": 499.99\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/orders",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "orders"]
        }
      }
    },
    {
      "name": "Create Razorpay Order",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"existingOrderId\": \"507f1f77bcf86cd799439011\",\n  \"amount\": 499.99,\n  \"userEmail\": \"test@example.com\",\n  \"userPhone\": \"9999999999\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/payment/create-razorpay-order",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "payment", "create-razorpay-order"]
        }
      }
    },
    {
      "name": "Verify Payment",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"existingOrderId\": \"507f1f77bcf86cd799439011\",\n  \"razorpayPaymentId\": \"pay_1Aa00000000001\",\n  \"razorpayOrderId\": \"order_1Aa00000000001\",\n  \"razorpaySignature\": \"9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/payment/verify",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "payment", "verify"]
        }
      }
    }
  ]
}
```

---

## Troubleshooting Setup Issues

### Issue: "Razorpay credentials not configured"

**Solution**: 
- Check `.env.local` has `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Restart the dev server after adding env vars
- Verify keys are not empty strings

### Issue: "payments_log collection not found"

**Solution**:
```bash
# Re-run migration
npx prisma migrate dev

# Or sync schema
npx prisma db push
```

### Issue: Order not found error

**Solution**:
- Verify order was created successfully
- Check order ID is correct MongoDB ObjectId (24 hex chars)
- Look in MongoDB to confirm order exists

### Issue: "Cannot find module 'razorpay'"

**Solution**:
```bash
# Razorpay is not needed as a dependency (we make HTTP calls)
# But verify lib/razorpay.ts exists
ls lib/razorpay.ts
```

---

## Production Deployment Checklist

### Before Going Live

- [ ] Replace TEST KEY with LIVE KEY
- [ ] Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in production `.env`
- [ ] Configure webhook in Razorpay dashboard
- [ ] Set webhook URL to `https://yourdomain.com/api/payment/webhook`
- [ ] Test end-to-end payment flow with real cards
- [ ] Set up payment failure notifications
- [ ] Monitor payment logs for errors
- [ ] Test refund process (if applicable)
- [ ] Set up automated backups of `payments_log` data
- [ ] Configure payment success email notifications
- [ ] Add payment status display to user dashboard

### Environment Variables (Production)

```env
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxx"
RAZORPAY_WEBHOOK_SECRET="webhook_secret_here"
```

---

## Database Schema Details

### payments_log Collection Structure

```javascript
{
  _id: ObjectId,                    // MongoDB ID
  existingOrderId: String,          // Reference to orders._id
  razorpayOrderId: String (unique), // Razorpay order ID
  razorpayPaymentId: String,        // Razorpay payment ID (null until paid)
  razorpaySignature: String,        // Payment signature (null until verified)
  amount: Float,                    // Amount in INR
  currency: String,                 // Default: "INR"
  status: String,                   // PENDING | SUCCESS | FAILED
  userEmail: String,                // Customer email (optional)
  userPhone: String,                // Customer phone (optional)
  userName: String,                 // Customer name (optional)
  metadata: Object,                 // Additional data (optional)
  createdAt: Date,                  // Creation timestamp
  updatedAt: Date                   // Last update timestamp
}

// Indexes
{
  "existingOrderId": 1    // For querying by order
  "razorpayOrderId": 1    // Unique index
  "status": 1             // For filtering by status
}
```

---

## API Documentation

### Health Check

```bash
GET /api/health
Response: { "status": "ok" }
```

### Create Razorpay Order

```bash
POST /api/payment/create-razorpay-order
Content-Type: application/json

Request Body:
{
  "existingOrderId": "string (required)",
  "amount": "number (optional)",
  "userEmail": "string (optional)",
  "userPhone": "string (optional)",
  "userName": "string (optional)"
}

Success Response (200):
{
  "success": true,
  "razorpay_order_id": "string",
  "razorpay_key": "string",
  "amount": "number",
  "currency": "string",
  "paymentLogId": "string"
}

Error Response (400/404/500):
{
  "error": "string (error message)"
}
```

### Verify Payment

```bash
POST /api/payment/verify
Content-Type: application/json

Request Body:
{
  "existingOrderId": "string (required)",
  "razorpayPaymentId": "string (required)",
  "razorpayOrderId": "string (required)",
  "razorpaySignature": "string (required)"
}

Success Response (200):
{
  "success": true,
  "message": "Payment verified successfully",
  "paymentId": "string"
}

Failure Response (400):
{
  "success": false,
  "message": "Payment verification failed"
}
```

### Webhook

```bash
POST /api/payment/webhook
Content-Type: application/json
X-Razorpay-Signature: <signature>

(Razorpay sends this automatically)

Response (200):
{
  "status": "received",
  "event": "string",
  "timestamp": "number"
}
```

---

## Support & Debugging

### Enable Verbose Logging

Check server console for detailed logs:
```bash
npm run dev 2>&1 | grep -i payment
```

### Query Payment Logs

```javascript
// MongoDB query
db.payments_log.find({
  status: "PENDING"
}).sort({ createdAt: -1 }).limit(10)

// Or via Prisma in Node
const payments = await prisma.paymentLog.findMany({
  where: { status: "PENDING" },
  orderBy: { createdAt: "desc" },
  take: 10
})
```

### Clear Test Data

```javascript
// Clear all test payments
db.payments_log.deleteMany({})
```

---

## Next Steps

1. **Test Integration**: Follow testing steps above
2. **Read Documentation**: See [RAZORPAY_INTEGRATION_GUIDE.md](./RAZORPAY_INTEGRATION_GUIDE.md)
3. **Integrate Frontend**: Use the examples in the guide
4. **Configure Webhooks**: Set up Razorpay webhooks (optional but recommended)
5. **Deploy**: Follow production checklist
