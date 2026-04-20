# Razorpay Integration - Complete Testing & Verification Guide

Complete end-to-end testing guide for Razorpay payment integration with the order page.

---

## Pre-Test Checklist

Before starting tests, verify:

- [ ] Node.js dev server is running (`npm run dev`)
- [ ] MongoDB is running and accessible
- [ ] `.env.local` has Razorpay credentials set
- [ ] Prisma migration has been run (`npx prisma migrate dev`)
- [ ] No errors in server console

---

## Test Suite

### Test 1: Environment Setup Verification

**Objective**: Verify all environment variables are configured correctly

**Steps**:
```bash
# Check if env vars are accessible
node -e "
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✓ SET' : '✗ MISSING');
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✓ SET' : '✗ MISSING');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ SET' : '✗ MISSING');
"
```

**Expected Result**:
```
RAZORPAY_KEY_ID: ✓ SET
RAZORPAY_KEY_SECRET: ✓ SET
DATABASE_URL: ✓ SET
```

**Pass/Fail**: ✅ PASS if all are SET | ❌ FAIL if any MISSING

---

### Test 2: Database Connection & Migration

**Objective**: Verify database is connected and `payments_log` collection exists

**Steps**:

**Option A - MongoDB CLI**:
```javascript
// Connect to MongoDB
mongo your_connection_string

// Use the correct database
use taxiapp

// Check if payments_log exists
db.payments_log.stats()
```

**Option B - Prisma CLI**:
```bash
npx prisma db execute --stdin < check_db.sql
```

**Expected Result**:
```
{
  "ns": "taxiapp.payments_log",
  "size": 0,
  "count": 0,
  "indexSizes": { "_id_": 2048, ... }
}
```

**Pass/Fail**: ✅ PASS if collection exists | ❌ FAIL if not found

---

### Test 3: API Endpoints Available

**Objective**: Verify all payment API endpoints are accessible

**Endpoint 1**: Health check
```bash
curl -X GET http://localhost:3000/api/health
```

Expected response:
```json
{ "status": "ok" }
```

**Endpoint 2**: Create Razorpay Order
```bash
curl -X OPTIONS http://localhost:3000/api/payment/create-razorpay-order -v
```

Expected: HTTP 200 with CORS headers

**Endpoint 3**: Verify Payment
```bash
curl -X OPTIONS http://localhost:3000/api/payment/verify -v
```

Expected: HTTP 200 with CORS headers

**Pass/Fail**: ✅ PASS if all endpoints respond | ❌ FAIL if 404 or timeout

---

### Test 4: Create Test Order

**Objective**: Create a test order using existing `/api/orders` endpoint

**Request**:
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9999999999",
    "cardType": "Premium NFC Card",
    "price": 499.99,
    "profileData": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }'
```

**Expected Response** (200 OK):
```json
{
  "id": "507f1f77bcf86cd799439011",
  "orderNumber": "ORD-ABC1DEF-XYZ",
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "total": 499.99,
  "status": "PENDING",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Important**: Save the `id` value for next tests!

**Pass/Fail**: ✅ PASS if order created | ❌ FAIL if error

---

### Test 5: Create Razorpay Order (Payment Adapter)

**Objective**: Create Razorpay order linked to the test order

**Request**:
```bash
curl -X POST http://localhost:3000/api/payment/create-razorpay-order \
  -H "Content-Type: application/json" \
  -d '{
    "existingOrderId": "507f1f77bcf86cd799439011",
    "amount": 499.99,
    "userEmail": "john@example.com",
    "userPhone": "9999999999",
    "userName": "John Doe"
  }'
```

Replace `507f1f77bcf86cd799439011` with the order ID from Test 4.

**Expected Response** (200 OK):
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

**Important**: Save `razorpay_order_id` and `paymentLogId` for next tests!

**Pass/Fail**: ✅ PASS if Razorpay order created | ❌ FAIL if error

**Troubleshooting**:
- If "Order not found": Check order ID is correct
- If "Invalid amount": Ensure amount > 0

---

### Test 6: Database - Verify Payment Log Entry

**Objective**: Verify payment log was created in MongoDB

**Method 1 - MongoDB CLI**:
```javascript
db.payments_log.findOne({
  razorpayOrderId: "order_1Aa00000000001"
})
```

Replace with actual razorpay_order_id from Test 5.

**Expected Response**:
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "existingOrderId": "507f1f77bcf86cd799439011",
  "razorpayOrderId": "order_1Aa00000000001",
  "razorpayPaymentId": null,
  "razorpaySignature": null,
  "amount": 499.99,
  "currency": "INR",
  "status": "PENDING",
  "userEmail": "john@example.com",
  "userPhone": "9999999999",
  "userName": "John Doe",
  "metadata": { "razorpayResponse": { ... } },
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z")
}
```

**Pass/Fail**: ✅ PASS if record exists and matches | ❌ FAIL if not found

---

### Test 7: Frontend Integration (Manual)

**Objective**: Test actual Razorpay checkout flow

**Setup HTML**:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Razorpay Payment Test</title>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
    <h1>Payment Test</h1>
    <button id="payBtn">Pay Now</button>
    
    <script>
    let orderId = "507f1f77bcf86cd799439011"; // From Test 4
    
    document.getElementById("payBtn").onclick = async () => {
        // Step 1: Create Razorpay order
        const res = await fetch("/api/payment/create-razorpay-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                existingOrderId: orderId,
                amount: 499.99
            })
        });
        
        const data = await res.json();
        console.log("Razorpay order created:", data);
        
        // Step 2: Open checkout
        const options = {
            key: data.razorpay_key,
            order_id: data.razorpay_order_id,
            amount: data.amount,
            currency: data.currency,
            handler: async (response) => {
                console.log("Payment response:", response);
                
                // Step 3: Verify on backend
                const verify = await fetch("/api/payment/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        existingOrderId: orderId,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpayOrderId: response.razorpay_order_id,
                        razorpaySignature: response.razorpay_signature
                    })
                });
                
                const result = await verify.json();
                console.log("Verification result:", result);
                
                if (result.success) {
                    alert("✅ Payment successful!");
                } else {
                    alert("❌ Payment failed: " + result.message);
                }
            }
        };
        
        const rzp = new window.Razorpay(options);
        rzp.open();
    };
    </script>
</body>
</html>
```

**Test Steps**:
1. Save as `test-payment.html` in project root
2. Open `http://localhost:3000/test-payment.html`
3. Click "Pay Now" button
4. Use test card: `4111 1111 1111 1111`
5. Enter OTP: `123456` (auto-filled usually)
6. Complete payment

**Expected Result**:
- Razorpay modal opens
- Payment processes
- Success alert appears
- Check console for payment details

**Pass/Fail**: ✅ PASS if payment succeeds | ❌ FAIL if error

---

### Test 8: Payment Verification

**Objective**: Verify payment verification endpoint works correctly

**Real Verification** (from Test 7):
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

Use actual payment details from Test 7.

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "paymentId": "pay_1Aa00000000001"
}
```

**Pass/Fail**: ✅ PASS if payment verified | ❌ FAIL if verification fails

**Note**: Signature must match exactly. If using manually created test data, signature won't match and will return false.

---

### Test 9: Database - Verify Payment Update

**Objective**: Verify payment log was updated with payment details

**Query**:
```javascript
db.payments_log.findOne({
  razorpayOrderId: "order_1Aa00000000001"
})
```

**Expected Response**:
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "existingOrderId": "507f1f77bcf86cd799439011",
  "razorpayOrderId": "order_1Aa00000000001",
  "razorpayPaymentId": "pay_1Aa00000000001",
  "razorpaySignature": "9ef4dffbfd84f1318f...",
  "status": "SUCCESS",  // ← Changed from PENDING
  "amount": 499.99,
  "currency": "INR",
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-15T10:35:00Z")  // ← Updated
}
```

**Key Checks**:
- [ ] `razorpayPaymentId` is populated
- [ ] `razorpaySignature` is populated
- [ ] `status` changed to "SUCCESS"
- [ ] `updatedAt` is newer than `createdAt`
- [ ] Original order is NOT modified

**Pass/Fail**: ✅ PASS if all checks pass | ❌ FAIL if any check fails

---

### Test 10: Failed Payment Verification

**Objective**: Test that failed payments are handled correctly

**Invalid Signature Test**:
```bash
curl -X POST http://localhost:3000/api/payment/verify \
  -H "Content-Type: application/json" \
  -d '{
    "existingOrderId": "507f1f77bcf86cd799439011",
    "razorpayPaymentId": "pay_invalid",
    "razorpayOrderId": "order_1Aa00000000001",
    "razorpaySignature": "invalid_signature_here"
  }'
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Payment verification failed"
}
```

**Database Check**:
```javascript
db.payments_log.findOne({
  razorpayOrderId: "order_1Aa00000000001"
})
```

The record should have:
- `status`: "FAILED"
- `razorpayPaymentId`: "pay_invalid"

**Pass/Fail**: ✅ PASS if failure is handled correctly | ❌ FAIL if not

---

### Test 11: Original Order Integrity

**Objective**: Verify that payment system doesn't modify original order

**Check Original Order**:
```bash
curl -X GET http://localhost:3000/api/orders/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer your_token_if_needed"
```

**Expected Response**:
```json
{
  "order": {
    "id": "507f1f77bcf86cd799439011",
    "status": "PENDING",      // ← Should still be PENDING
    "paymentStatus": "PENDING", // ← Should still be PENDING
    "total": 499.99,
    "guestName": "John Doe",
    "guestEmail": "john@example.com",
    // ... all original fields unchanged
  }
}
```

**Key Point**: The original order order is NOT modified by the payment system. Payment status is tracked separately in `payments_log`.

**Pass/Fail**: ✅ PASS if order unchanged | ❌ FAIL if order modified

---

### Test 12: Error Handling

**Objective**: Test various error scenarios

**Test A - Missing Order**:
```bash
curl -X POST http://localhost:3000/api/payment/create-razorpay-order \
  -H "Content-Type: application/json" \
  -d '{"existingOrderId": "invalid_id_12345678901234"}'
```

Expected: 404 with "Order not found"

**Test B - Invalid Amount**:
```bash
curl -X POST http://localhost:3000/api/payment/create-razorpay-order \
  -H "Content-Type: application/json" \
  -d '{"existingOrderId": "507f1f77bcf86cd799439011", "amount": -100}'
```

Expected: 400 with validation error

**Test C - Missing Required Fields**:
```bash
curl -X POST http://localhost:3000/api/payment/verify \
  -H "Content-Type: application/json" \
  -d '{"existingOrderId": "507f1f77bcf86cd799439011"}'
```

Expected: 400 with "razorpayPaymentId is required"

**Pass/Fail**: ✅ PASS if all errors handled | ❌ FAIL if errors not caught

---

## Test Summary Report

After completing all tests, fill out this summary:

```
TEST RESULTS
============

✓ Test 1: Environment Setup             [PASS/FAIL]
✓ Test 2: Database Connection           [PASS/FAIL]
✓ Test 3: API Endpoints Available       [PASS/FAIL]
✓ Test 4: Create Test Order             [PASS/FAIL]
✓ Test 5: Create Razorpay Order         [PASS/FAIL]
✓ Test 6: Database Payment Log Entry    [PASS/FAIL]
✓ Test 7: Frontend Integration          [PASS/FAIL]
✓ Test 8: Payment Verification          [PASS/FAIL]
✓ Test 9: Database Payment Update       [PASS/FAIL]
✓ Test 10: Failed Payment Handling      [PASS/FAIL]
✓ Test 11: Original Order Integrity     [PASS/FAIL]
✓ Test 12: Error Handling               [PASS/FAIL]

OVERALL: [ALL PASS / SOME FAILURES / ALL FAIL]

Issues Found:
- [List any issues]

Notes:
- [Any additional observations]
```

---

## Debugging Tips

### Check Server Logs
```bash
# Watch for errors
npm run dev 2>&1 | grep -i "payment\|error"
```

### Query Payment Logs
```javascript
// MongoDB - get all payments
db.payments_log.find().pretty()

// Get by status
db.payments_log.find({ status: "PENDING" }).pretty()

// Get by order
db.payments_log.find({ existingOrderId: "507f1f77bcf86cd799439011" }).pretty()
```

### Verify Razorpay Credentials
```bash
# In node shell
node
> const crypto = require('crypto');
> const sig = crypto.createHmac('sha256', 'key_secret').update('order_id|payment_id').digest('hex');
> console.log(sig);
// Should match the signature from Razorpay
```

### Clear Test Data
```javascript
// Delete all test payments
db.payments_log.deleteMany({})

// Delete specific payment
db.payments_log.deleteOne({ razorpayOrderId: "order_xxx" })
```

---

## Production Testing Checklist

Before deploying to production:

- [ ] All 12 tests pass with TEST keys
- [ ] Switch to LIVE keys in `.env`
- [ ] Test with real card: `4111 1111 1111 1111` (test still works on live)
- [ ] Monitor first 10 real payments
- [ ] Verify success email notifications
- [ ] Test refund flow (if applicable)
- [ ] Monitor payment logs for errors
- [ ] Set up alerts for failed payments
- [ ] Document any issues found
- [ ] Team sign-off

---

## Support

If tests fail:

1. Check error message carefully
2. Review server logs
3. Verify environment variables
4. Check MongoDB connectivity
5. See troubleshooting sections in RAZORPAY_INTEGRATION_GUIDE.md

---

**Last Updated**: 2024-01-15  
**Status**: Ready for Testing
