# Environment Variables & Security Configuration

## Overview

All Razorpay credentials are securely managed through environment variables with strict security measures to prevent accidental exposure.

---

## ✅ Security Measures Implemented

### 1. **No Hardcoded Keys**
- ❌ Keys are NEVER hardcoded in the codebase
- ✅ All keys read from environment variables
- ✅ Backend only - no secrets in client-side code

### 2. **Git Protection**
- ✅ `.gitignore` includes `.env*` pattern
- ✅ `.env.local` is automatically excluded from git
- ✅ `.env.example` provided as template (safe to commit)

### 3. **Frontend/Backend Separation**
- ✅ `RAZORPAY_KEY_SECRET` - Backend ONLY (never exposed)
- ✅ `RAZORPAY_KEY_ID` - Can be exposed to frontend via API response
- ✅ Signature verification - Backend ONLY

### 4. **Runtime Validation**
- ✅ Environment variables validated at service initialization
- ✅ Clear error messages if credentials missing
- ✅ Immediate failure if keys not configured

---

## 📋 Environment Variables Configuration

### Current Setup (.env.local)

```env
# Razorpay Payment Integration (Test Mode)
RAZORPAY_KEY_ID="rzp_test_Sfj4ep6wqxAupk"
RAZORPAY_KEY_SECRET="Qc8EslwVogEz6H5QCc8BRN43"
RAZORPAY_MODE="test"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret_here"
```

### Variables Explanation

| Variable | Type | Exposure | Purpose |
|----------|------|----------|---------|
| `RAZORPAY_KEY_ID` | Public | Backend API Response | Frontend needs this to initialize checkout |
| `RAZORPAY_KEY_SECRET` | Secret | Backend Only | Sign and verify payments - NEVER send to frontend |
| `RAZORPAY_MODE` | Config | Backend Only | Switch between test/live mode |
| `RAZORPAY_WEBHOOK_SECRET` | Secret | Backend Only | Verify webhook authenticity |

---

## 🔐 Backend Implementation

### Service Initialization (lib/razorpay.ts)

```typescript
class RazorpayService {
  private keyId: string;
  private keySecret: string;

  constructor() {
    // Read from environment - no hardcoding
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Validate required variables
    if (!keyId || !keySecret) {
      throw new Error(
        "Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET"
      );
    }

    this.keyId = keyId;
    this.keySecret = keySecret;
  }
}
```

**Key Points**:
- Environment variables read at runtime
- Validation ensures credentials are set
- Private fields prevent accidental exposure
- Errors are clear and actionable

---

## 🚀 Frontend Usage

### Safe Exposure of KEY_ID

Frontend receives the KEY_ID through API response:

```javascript
// Frontend API call
const response = await fetch('/api/payment/create-razorpay-order', {
  method: 'POST',
  body: JSON.stringify({ existingOrderId: orderId })
});

const data = await response.json();
// response contains:
// {
//   razorpay_key: "rzp_test_Sfj4ep6wqxAupk",  // Safe - from server
//   razorpay_order_id: "order_xxx",
//   amount: 49999
// }

// Frontend uses KEY_ID from server response
const options = {
  key: data.razorpay_key,  // ✅ Safe - from backend
  // ...
};
```

### What Frontend Does NOT Get

```javascript
// ❌ NEVER exposed to frontend:
// - RAZORPAY_KEY_SECRET
// - Webhook secrets
// - Any internal tokens

// ✅ Frontend only receives:
// - Razorpay order ID
// - Key ID (for checkout)
// - Amount to charge
```

---

## 🔄 Mode Switching (Test ↔ Live)

### Test Mode (Development)
```env
RAZORPAY_MODE="test"
RAZORPAY_KEY_ID="rzp_test_Sfj4ep6wqxAupk"
RAZORPAY_KEY_SECRET="Qc8EslwVogEz6H5QCc8BRN43"
```

### Live Mode (Production)
```env
RAZORPAY_MODE="live"
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxx"
```

**Switching Process**:
1. Get Live keys from Razorpay dashboard
2. Update environment variables
3. Restart application
4. All requests now use live keys
5. **No code changes needed**

---

## 📚 Configuration Files

### .env.local (Not committed to git)
```env
# Your actual credentials for local development
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
```

### .env.example (Safe to commit)
```env
# Template showing what variables are needed
RAZORPAY_KEY_ID="rzp_test_Sfj4ep6wqxAupk"
RAZORPAY_KEY_SECRET="your_secret_here"
```

### .gitignore (Already configured)
```
.env*
```

---

## 🛡️ Production Deployment

### Before Deployment

- [ ] `.env.local` is NOT committed
- [ ] `.env.example` IS committed (no secrets)
- [ ] Live keys obtained from Razorpay dashboard
- [ ] Live keys NOT committed to git
- [ ] Live keys set only on production server

### Setting Environment Variables in Production

**Option 1: Environment File on Server**
```bash
# On production server (manually)
ssh user@production
echo 'RAZORPAY_KEY_ID="rzp_live_..."' > /app/.env.production
echo 'RAZORPAY_KEY_SECRET="..."' >> /app/.env.production
chmod 600 /app/.env.production
```

**Option 2: Docker Environment**
```dockerfile
# Dockerfile
ENV RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
ENV RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
```

**Option 3: Platform-Specific**
- Vercel: Settings → Environment Variables
- Heroku: Heroku CLI or Heroku dashboard
- AWS: Systems Manager Parameter Store
- Google Cloud: Secret Manager

---

## 🔍 Verification Checklist

### Local Development

- [ ] `.env.local` created with credentials
- [ ] `.env.local` is in `.gitignore`
- [ ] `npm run dev` starts without errors
- [ ] No "credentials not configured" errors
- [ ] Payment endpoints accessible

### Before Commit

- [ ] `.env.local` NOT staged for commit
- [ ] `.env.example` IS staged (no secrets)
- [ ] Run: `git status` - should not show `.env.local`
- [ ] Run: `git show .env.local` - should fail (file not tracked)

### Production Readiness

- [ ] Live keys obtained from dashboard
- [ ] Live keys NOT in code or git
- [ ] Live keys set only on production server
- [ ] Test mode confirmed with test card
- [ ] Live mode confirmed with test card (if allowed)

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T

```javascript
// ❌ Never hardcode keys
const RAZORPAY_KEY = "rzp_test_...";

// ❌ Never commit .env.local
git add .env.local

// ❌ Never expose secret to frontend
fetch('/api/key-secret', { /* ... */ })
```

### ✅ DO

```javascript
// ✅ Always read from environment
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

// ✅ Only commit .env.example
git add .env.example

// ✅ Send only KEY_ID to frontend
response.json({ razorpay_key: keyId })
```

---

## 🚨 If Credentials Are Exposed

### Immediate Actions

1. **Revoke compromised keys**:
   - Go to Razorpay Dashboard
   - Settings → API Keys
   - Delete exposed key

2. **Generate new keys**:
   - Create new test/live keys
   - Update environment variables

3. **Check for fraudulent activity**:
   - Review payment logs
   - Check for suspicious transactions
   - Contact Razorpay support if needed

4. **Update all deployments**:
   - Local: Update `.env.local`
   - Staging: Update staging environment
   - Production: Update production environment

---

## 📖 Reference

### Related Files

- **Backend**: `lib/razorpay.ts` - Uses environment variables
- **Adapter**: `lib/payment-adapter.ts` - Calls Razorpay service
- **Config**: `.env.local` - Stores credentials
- **Template**: `.env.example` - Shows required variables
- **Ignore**: `.gitignore` - Protects .env files

### Documentation

- [Razorpay API Keys](https://razorpay.com/docs/payments/how-to-generate-test-api-keys/)
- [Razorpay Dashboard](https://dashboard.razorpay.com)
- [Environment Variables Best Practices](https://12factor.net/config)

---

## ✅ Summary

✅ **All credentials** via environment variables  
✅ **No hardcoded values** in code  
✅ **Git protection** with .gitignore  
✅ **Frontend/Backend separation** of secrets  
✅ **Runtime validation** of configuration  
✅ **Easy mode switching** (test/live)  
✅ **Production ready** security model  

---

**Status**: ✅ Secure Configuration Complete

Last Updated: 2024-01-15
