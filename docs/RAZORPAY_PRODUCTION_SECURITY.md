# Razorpay Payment Integration - Production Security Guide

## Overview

This document outlines the secure Razorpay payment integration with environment variable separation and production-safe practices.

---

## Environment Variables Setup

### Required Environment Variables

```bash
# Backend Secret (NEVER expose to frontend)
RAZORPAY_KEY_SECRET="hl60BiIemCpru6fxU08yS0zQ"

# Frontend Public Key (safe to expose)
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_SflLZwa8pVCg31"

# Optional Configuration
RAZORPAY_MODE="test"  # or "live" for production
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret_here"
```

### Environment Variable Naming Convention

| Variable | Scope | Purpose | Exposed? |
|----------|-------|---------|----------|
| `RAZORPAY_KEY_SECRET` | Backend Only | API authentication, signature verification | ❌ NO |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Frontend Safe | Razorpay checkout initialization | ✅ YES |
| `RAZORPAY_MODE` | Backend Only | test/live mode switching | ❌ NO |
| `RAZORPAY_WEBHOOK_SECRET` | Backend Only | Webhook signature verification | ❌ NO |

---

## Security Architecture

### Payment Flow (Secure Design)

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (Browser/Client)                                       │
│                                                                  │
│  1. User creates order                                          │
│  2. Calls /api/payment/create-razorpay-order                   │
│  3. Receives: razorpay_order_id + razorpay_key (public)        │
│  4. Opens Razorpay checkout with PUBLIC KEY ONLY               │
│  5. User completes payment → Receives payment details          │
│  6. Calls /api/payment/verify with payment details            │
│  7. Receives: success/failure response                         │
└──────────────────────────────────────────────────────────────────┘
                            ↕ API Calls
┌──────────────────────────────────────────────────────────────────┐
│ BACKEND (Node.js/Next.js)                                        │
│                                                                   │
│  /api/payment/create-razorpay-order:                            │
│    - Uses RAZORPAY_KEY_SECRET for Razorpay API auth            │
│    - Creates order                                              │
│    - Returns ONLY public key to frontend                        │
│                                                                   │
│  /api/payment/verify:                                           │
│    - Uses RAZORPAY_KEY_SECRET for signature verification       │
│    - Never exposes secret to frontend                           │
│    - Returns only success/failure status                        │
└──────────────────────────────────────────────────────────────────┘
                            ↕ Credentials
┌──────────────────────────────────────────────────────────────────┐
│ RAZORPAY API (Secured)                                           │
│                                                                   │
│  Backend authenticates using:                                    │
│    Authorization: Basic base64(keyId:keySecret)                │
│                                                                   │
│  Secret key NEVER transmitted to frontend                       │
└──────────────────────────────────────────────────────────────────┘
```

### Key Security Principles

1. **No Secret Exposure**: `RAZORPAY_KEY_SECRET` is processed only in backend API routes
2. **Public Key Segregation**: Frontend receives `NEXT_PUBLIC_RAZORPAY_KEY_ID` safely
3. **Signature Verification**: Backend verifies all payment signatures using secret key
4. **API Response Control**: Backend determines what data frontend receives
5. **No Credential Caching**: Keys are fetched fresh from environment each request

---

## Implementation Details

### Backend: Create Order Endpoint

**File**: `app/api/payment/create-razorpay-order/route.ts`

```typescript
// Secure pattern:
// 1. Receive order ID from frontend (no credentials)
// 2. Backend uses RAZORPAY_KEY_SECRET for API auth
// 3. Create Razorpay order securely
// 4. Return ONLY the public key to frontend
// 5. NEVER return RAZORPAY_KEY_SECRET

export async function POST(request: NextRequest) {
  // ... validation ...
  
  const paymentAdapter = getPaymentAdapterService();
  const result = await paymentAdapter.createRazorpayOrder({
    existingOrderId,
    amount: orderAmount,
    // ... other params ...
  });

  // Response returned to frontend
  return NextResponse.json({
    success: true,
    razorpay_order_id: result.razorpay_order_id,
    razorpay_key: result.razorpay_key,  // PUBLIC KEY ONLY
    amount: result.amount,
    currency: result.currency,
  });
}
```

### Backend: Payment Adapter Service

**File**: `src/lib/payment-adapter.ts`

```typescript
async createRazorpayOrder(params: CreatePaymentParams) {
  // Create order using backend's Razorpay service
  const razorpayService = getRazorpayService();  // Has access to KEY_SECRET
  const razorpayOrder = await razorpayService.createOrder({
    // Uses Basic Auth with keyId:keySecret internally
    // This is NEVER exposed in the response
  });

  // Return response with PUBLIC KEY only
  const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID 
    || process.env.RAZORPAY_KEY_ID;
    
  return {
    razorpay_order_id: razorpayOrder.id,
    razorpay_key: publicKeyId,  // PUBLIC KEY
    // SECRET NEVER RETURNED
  };
}
```

### Backend: Razorpay Service

**File**: `src/lib/razorpay.ts`

```typescript
class RazorpayService {
  private keyId: string;
  private keySecret: string;  // KEPT PRIVATE

  constructor() {
    // Reads from environment
    this.keyId = process.env.RAZORPAY_KEY_ID?.trim() || 
                 process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
    this.keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    
    if (!this.keyId || !this.keySecret) {
      throw new Error("Razorpay credentials not configured");
    }
  }

  async createOrder(params: RazorpayOrderParams) {
    // Uses keyId:keySecret for Basic Auth
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`)
      .toString("base64");
      
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,  // Credentials used here only
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body,  // Order params
    });
    
    // Process response...
  }

  verifyPaymentSignature(params: PaymentVerificationParams): boolean {
    // Uses keySecret to verify HMAC signature
    const expectedSignature = crypto
      .createHmac("sha256", this.keySecret)
      .update(`${params.razorpay_order_id}|${params.razorpay_payment_id}`)
      .digest("hex");
      
    return expectedSignature === params.razorpay_signature;
  }
}
```

### Frontend: Payment Hook

**File**: `src/hooks/useRazorpayPayment.ts`

```typescript
export function useRazorpayPayment() {
  const initiatePayment = useCallback(async (data: PaymentOrderData) => {
    // Step 1: Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    
    // Step 2: Request Razorpay order from backend
    // Frontend sends: order ID (no credentials needed)
    const response = await fetch('/api/payment/create-razorpay-order', {
      method: 'POST',
      body: JSON.stringify({
        existingOrderId: data.existingOrderId,
        amount: data.amount,
        userEmail: data.userEmail,
      }),
    });
    
    const orderData = await response.json();
    
    // Step 3: Open Razorpay checkout with PUBLIC KEY ONLY
    const options = {
      key: orderData.razorpay_key,  // Comes from backend response
      order_id: orderData.razorpay_order_id,
      amount: orderData.amount,
      // ... other options ...
      
      handler: async (response: any) => {
        // Step 4: Verify payment with backend
        // Frontend sends: payment details (no access to secret)
        const verificationResult = await fetch('/api/payment/verify', {
          method: 'POST',
          body: JSON.stringify({
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          }),
        });
        
        // Backend verifies signature using KEY_SECRET
        // Frontend receives only success/failure
      },
    };
    
    // Open checkout with Razorpay widget
    const rzp = new Razorpay(options);
    rzp.open();
  }, []);

  return { initiatePayment, isLoading, error };
}
```

---

## Production Deployment Checklist

### Local Development

- [ ] Copy `.env.example` to `.env.local`
- [ ] Add your Razorpay test credentials to `.env.local`
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Test payment flow end-to-end
- [ ] Check browser console for security warnings

### Vercel Deployment

- [ ] Create environment variables in Vercel project settings:
  - `RAZORPAY_KEY_SECRET` (Production)
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID` (Production)
  - `RAZORPAY_MODE=live`
  
- [ ] Do NOT commit credentials to Git
- [ ] Use Vercel's Secrets Manager for sensitive variables
- [ ] Verify environment variables are set before deploying

### Security Verification

- [ ] RAZORPAY_KEY_SECRET is NOT in any frontend build output
- [ ] RAZORPAY_KEY_SECRET is NOT in browser DevTools Network tab
- [ ] NEXT_PUBLIC_RAZORPAY_KEY_ID is available to frontend
- [ ] SSL/TLS is enforced (https only)
- [ ] API routes validate all inputs
- [ ] Payment signature verification passes
- [ ] No credentials in logs or error messages

### Monitoring

- [ ] Monitor Razorpay dashboard for API activity
- [ ] Set up payment failure alerts
- [ ] Log all payment transactions (without credentials)
- [ ] Regular security audits of payment flow
- [ ] Monitor for unusual payment patterns

---

## Troubleshooting

### Error: "Razorpay credentials not configured"

**Cause**: `RAZORPAY_KEY_SECRET` not set in environment

**Solution**:
1. Check `.env.local` has `RAZORPAY_KEY_SECRET` set
2. Verify the value matches Razorpay dashboard
3. Check for leading/trailing spaces
4. Restart the development server

### Error: "Unauthorized" from Razorpay API

**Cause**: Invalid credentials or authentication header issue

**Solution**:
1. Verify `RAZORPAY_KEY_SECRET` is correct
2. Ensure Basic Auth header is properly formatted
3. Check Razorpay API documentation for current endpoints
4. Verify you're using the correct environment (test vs live)

### Error: "Signature verification failed"

**Cause**: Payment signature doesn't match expected value

**Solution**:
1. Verify `RAZORPAY_KEY_SECRET` is correct (same used for verification)
2. Check signature calculation includes correct order and payment IDs
3. Ensure HMAC algorithm matches Razorpay specification (sha256)
4. Verify frontend sends complete payment details

### Key Not Appearing in Frontend

**Cause**: API response not returning public key

**Solution**:
1. Check `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set in environment
2. Verify API route returns `razorpay_key` in response
3. Check browser Network tab to see API response
4. Verify error messages in API logs

---

## Best Practices

### 1. Credential Rotation

```bash
# Annually rotate credentials:
# 1. Generate new keys in Razorpay dashboard
# 2. Update RAZORPAY_KEY_SECRET in all environments
# 3. Monitor old key for usage decline
# 4. Disable old key after verification period
```

### 2. Environment Separation

```
Development:   RAZORPAY_MODE=test   (test credentials)
Staging:       RAZORPAY_MODE=test   (test credentials)
Production:    RAZORPAY_MODE=live   (live credentials)

NEVER mix test and live credentials
```

### 3. Error Handling

```typescript
// Good: Log error without credentials
console.error("Payment creation failed", { orderId, error });

// Bad: Don't log credentials
console.error("Payment failed", { ...credentials, error });
```

### 4. API Security Headers

```typescript
// Implement security headers
export async function POST(request: NextRequest) {
  // Validate request origin
  // Check authentication token
  // Rate limit requests
  // Validate input data
}
```

### 5. Webhook Security

```typescript
// When handling webhooks:
// 1. Verify webhook signature using RAZORPAY_WEBHOOK_SECRET
// 2. Don't trust data without signature verification
// 3. Log webhook for auditing
// 4. Handle idempotent webhook processing
```

---

## Summary

✅ **Secure Setup Implemented**:
- Backend-only secret key: `RAZORPAY_KEY_SECRET`
- Frontend-safe public key: `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- Keys separated by environment variable naming
- Payment flow keeps secret key in backend only
- Production-ready environment configuration
- Comprehensive error handling and logging
- Ready for Vercel deployment

✅ **Production Safety**:
- No secrets exposed to frontend
- API authentication secured with Basic Auth
- Payment signatures verified server-side
- Environment variables properly scoped
- Deployment checklist provided
- Best practices documented

---

## Additional Resources

- [Razorpay API Documentation](https://razorpay.com/docs/api/)
- [Razorpay Dashboard](https://dashboard.razorpay.com/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
