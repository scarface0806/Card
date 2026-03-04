# 🔧 SYSTEM VERIFICATION - MONGODB CLUSTER RECOVERY GUIDE

**Status**: MongoDB Atlas cluster is unreachable  
**Issue**: Server selection timeout with InternalError on all 3 replica nodes  
**Time to Resolution**: 5-15 minutes  

---

## 🚨 QUICK DIAGNOSIS

### Error Details
```
Kind: Server selection timeout: No available servers
Topology: { Type: ReplicaSetNoPrimary, ... }
All 3 Nodes: InternalError (fatal alert)
Cluster: atlas-daa9k4-shard-0
```

### What This Means
- ❌ All 3 MongoDB servers in the cluster are down or unreachable
- ❌ Cluster has no primary node (ReplicaSetNoPrimary state)
- ❌ Not a configuration issue - it's a cluster infrastructure problem
- ⏱️ Usually recovers within 5-30 minutes automatically
- 🔧 May require manual intervention if it persists

---

## 🔍 STEP-BY-STEP TROUBLESHOOTING

### Step 1: Check MongoDB Atlas Dashboard
```
1. Go to: https://cloud.mongodb.com
2. Sign in with your MongoDB Atlas account
3. Select your organization + project
4. Click on "Clusters" in the left sidebar
5. Look for "cluster0" status
   ✅ Green = Working
   🟡 Yellow = Warning
   🔴 Red = Issues
```

**What to look for**:
- Alerts section (top of page)
- Maintenance window notice
- Billing/quota exceeded message
- Network status indicator

### Step 2: Check Network Whitelist
```
1. Select cluster0
2. Go to "Security" → "Network Access"
3. Find your IP address in the IP Whitelist
4. If missing, add it:
   - Click "Add IP Address"
   - Enter your IP (find it at https://whatismyipaddress.com)
   - Or use "Allow Access from Anywhere" (0.0.0.0/0) for dev
```

### Step 3: Verify Database Credentials
```
1. Go to "Security" → "Database Access"
2. Find user: "santhoshuxui2023_db_user"
3. Check if user is:
   ✅ Active (not disabled)
   ✅ Has correct password
   ✅ Has proper permissions
4. If credentials changed, update in .env
```

### Step 4: Check Billing Status
```
1. Go to: https://cloud.mongodb.com/v2/billing/settings
2. Verify:
   ✅ Billing method is valid
   ✅ No overdue payments
   ✅ Cluster is within quota limits
3. If billing issue: Update payment method
```

### Step 5: Monitor Cluster Status
```
1. Go to cluster0 → "Monitoring"
2. Check graphs for:
   - Server connection status
   - Replication lag (should be 0ms)
   - Memory usage
3. If still red after 10 minutes → contact MongoDB support
```

### Step 6: Check Email Alerts
```
1. Check your email: santhosh@example.com (associated with MongoDB)
2. Look for alerts from MongoDB
3. Read: "Your cluster has been paused" or "Cluster is unavailable"
4. Follow instructions in the email
```

---

## 🔧 SOLUTIONS BY ROOT CAUSE

### Cause #1: Cluster Temporarily Down (Most Common)
**Duration**: Usually 5-15 minutes  
**Fix**:
```bash
# Wait 10 minutes
sleep 600
# Then retry
npm run prisma:seed
```

### Cause #2: Network Access Blocked
**Duration**: Immediate fix  
**Fix**:
```
1. Go to Security → Network Access
2. Check your IP is whitelisted
3. If not, add it
4. Retry: npm run prisma:seed
```

### Cause #3: Billing Issue / Quota Exceeded
**Duration**: 1-5 minutes after fix  
**Fix**:
```
1. Check billing at https://cloud.mongodb.com/v2/billing
2. Update payment method if needed
3. Or increase cluster tier (M10 → M20)
4. Wait 1-2 minutes for cluster to restart
5. Retry: npm run prisma:seed
```

### Cause #4: Cluster Paused
**Duration**: Immediate  
**Fix**:
```
1. Go to cluster0 → Overview
2. If paused, click "Resume"
3. Wait 2-3 minutes
4. Retry: npm run prisma:seed
```

### Cause #5: Password Changed
**Duration**: Immediate  
**Fix**:
```
1. Go to Security → Database Access
2. Reset password for "santhoshuxui2023_db_user"
3. Copy new password
4. Update .env: DATABASE_URL=mongodb+srv://USER:PASSWORD@cluster...
5. Retry: npm run prisma:seed
```

---

## 📞 IF PROBLEM PERSISTS

### Contact MongoDB Support
1. Go to: https://cloud.mongodb.com → Support
2. Create a ticket with:
   - **Issue**: "Cluster unreachable - Server selection timeout"
   - **Cluster**: cluster0 (atlas-daa9k4-shard-0)
   - **Error**: "InternalError on all 3 nodes"
   - **Your IP**: (from whatismyipaddress.com)
3. MongoDB usually responds within 30 minutes

### Temporary Workaround: Use Local MongoDB
```bash
# If you have MongoDB installed locally:

# 1. Start local MongoDB
mongod --dbpath "C:\data\db"

# 2. Update .env
# Change: DATABASE_URL="mongodb://localhost:27017/tapvyo-nfc?directConnection=true"

# 3. Run seed
npm run prisma:seed

# 4. Start dev server
npm run dev
```

---

## ✅ VERIFICATION AFTER FIX

### Test 1: Prisma Connection
```bash
npx prisma db push --skip-generate
# Expected: ✔ Datasource "db": MongoDB database "tapvyo-nfc" at "cluster0.8ud9zng.mongodb.net"
```

### Test 2: Create Admin
```bash
npm run prisma:seed
# Expected:
# 🔐 Starting admin user seed...
# ✅ ADMIN USER CREATED SUCCESSFULLY
# 📧 Email:    admin@tapvyo.com
# 🔐 Password: admin123
```

### Test 3: Start Dev Server
```bash
npm run dev
# Expected:
# ▲ Next.js 16.1.6
# - Local:        http://localhost:3000
# - Environments: .env
```

### Test 4: Admin Login
```
1. Open: http://localhost:3000/login
2. Email: admin@tapvyo.com
3. Password: admin123
4. Expected: Redirects to http://localhost:3000/admin
5. Dashboard loads with stats
```

---

## 💡 PREVENTION TIPS

### For Future Development
1. **Monitor Billing**: Never let MongoDB Atlas quota exceed
2. **Whitelist Your IP**: Often changes if using VPN/mobile
3. **Keep Credentials Safe**: Don't commit to git
4. **Use Local Dev**: For initial development, use local MongoDB
5. **Backup Regularly**: Export data periodically
6. **Test Connections**: Before starting major work

---

## 📊 STATUS TRACKING

### Current Status
- **Last Check**: 2026-03-04 @ Connection failed
- **Cluster State**: ReplicaSetNoPrimary (all nodes down)
- **Action Taken**: Documented in SYSTEM_VERIFICATION_REPORT.md
- **Waiting For**: Manual MongoDB intervention

### When Fixed, Run
```bash
# Full system startup
npx prisma db push --skip-generate && npm run prisma:seed && npm run dev
```

---

**Next Step**: Monitor MongoDB Atlas dashboard and wait for automatic recovery,  
or follow the solutions above based on the root cause.
