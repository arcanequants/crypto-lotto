# 📜 Contract Deployment & Update Guide

This guide explains how to deploy a new lottery contract and update the entire application automatically.

## 🎯 Overview

The system uses a **centralized configuration** approach:
- Single source of truth: `/lib/contracts/lottery-contract.ts`
- All endpoints, pages, and components import from this file
- Change contract once → everything updates automatically

---

## 🚀 Quick Start: Deploy New Contract

### Step 1: Deploy Smart Contract

```bash
# In the smart contract directory
cd ../contracts  # Or wherever your Solidity code is

# Compile
forge build

# Deploy to BASE Mainnet
forge create src/LotteryDualCrypto.sol:LotteryDualCrypto \
  --constructor-args "0xUSDT_ADDRESS" "0xPRICE_FEED_ADDRESS" \
  --private-key "$PRIVATE_KEY" \
  --rpc-url "https://base-mainnet.g.alchemy.com/v2/YOUR_KEY"

# Save the deployed address!
# Example: 0xF3f6f3452513C6101D2EeA45BB8d4f552131B2C7
```

### Step 2: Update ABI

```bash
# Copy ABI from Foundry output
cat out/LotteryDualCrypto.sol/LotteryDualCrypto.json | jq '.abi' > /tmp/new-abi.json

# Update the official ABI file
# Edit: web/lib/abi/lottery-dual-crypto.ts
```

**Example:**
```typescript
// web/lib/abi/lottery-dual-crypto.ts
export const LOTTERY_DUAL_CRYPTO_ABI = [
  {
    name: 'currentHourlyDrawId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  // ... rest of ABI
] as const;
```

### Step 3: Update Contract Address

**Option A: Environment Variable (Recommended)**
```bash
# Update .env.local
echo "NEXT_PUBLIC_LOTTERY_CONTRACT=0xYOUR_NEW_ADDRESS" >> .env.local

# Update Vercel environment variables
vercel env add NEXT_PUBLIC_LOTTERY_CONTRACT
# Paste: 0xYOUR_NEW_ADDRESS
# Select: Production, Preview, Development
```

**Option B: Hardcoded (Fallback)**
```typescript
// web/lib/contracts/lottery-contract.ts
export const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_LOTTERY_CONTRACT ||
  '0xYOUR_NEW_ADDRESS'  // ← Update this line
) as Address;
```

### Step 4: Validate Configuration

```bash
cd web

# Install dependencies if needed
npm install

# Run validation script
npx tsx scripts/validate-contract.ts
```

You should see:
```
✅ ALL VALIDATIONS PASSED!
```

If you see errors, check:
- Contract address is correct
- ABI matches deployed contract
- Environment variables are set
- RPC endpoint is accessible

### Step 5: Deploy to Vercel

```bash
git add .
git commit -m "feat: upgrade to LotteryDualCrypto v3.0.0

- New contract: 0xYOUR_NEW_ADDRESS
- Updated ABI with new features
- All endpoints auto-updated via centralized config"

git push
```

Vercel will automatically:
1. Build the app
2. Use new contract address from env var
3. Import latest ABI from `/lib/abi/lottery-dual-crypto.ts`
4. Update all 15+ endpoints and pages ✅

### Step 6: Verify Deployment

```bash
# Check contract endpoint
curl https://your-app.vercel.app/api/verify-contract | jq .

# Should show new contract address
{
  "success": true,
  "contract": "0xYOUR_NEW_ADDRESS",
  "data": { ... }
}
```

---

## 📁 File Structure

```
web/
├── lib/
│   ├── abi/
│   │   └── lottery-dual-crypto.ts      # ← Single ABI source of truth
│   └── contracts/
│       └── lottery-contract.ts         # ← Centralized config
├── app/
│   ├── api/
│   │   └── cron/
│   │       ├── execute-hourly-draw/
│   │       ├── execute-daily-draw/     # ← Auto-imports from central config
│   │       └── ...
│   ├── results/
│   │   └── page.tsx                    # ← Auto-imports from central config
│   └── ...
├── scripts/
│   └── validate-contract.ts            # ← Validation script
└── docs/
    └── CONTRACT_DEPLOYMENT_GUIDE.md    # ← This file
```

---

## 🔄 What Gets Updated Automatically?

When you update `/lib/contracts/lottery-contract.ts`, these files auto-update:

### API Endpoints (12 files)
- ✅ `/api/cron/execute-hourly-draw`
- ✅ `/api/cron/execute-daily-draw`
- ✅ `/api/cron/close-hourly-draw`
- ✅ `/api/cron/close-daily-draw`
- ✅ `/api/verify-contract`
- ✅ `/api/tickets/*`
- ✅ `/api/prizes/*`
- ✅ All other contract-dependent endpoints

### Pages & Components (8 files)
- ✅ `/results` - Draw results page
- ✅ `/my-tickets` - User tickets page
- ✅ `/prizes` - Prize claiming page
- ✅ `BuyTicketForm` component
- ✅ `PrizeBalance` component
- ✅ All other contract-dependent components

**Total:** 20+ files update with 1 change! 🎉

---

## 🧪 Testing New Contract

### 1. Test Reads

```bash
# Test from validation script
npx tsx scripts/validate-contract.ts

# Or manually
node -e "
  const lc = require('./lib/contracts/lottery-contract.ts').default;
  lc.getCurrentDrawIds().then(console.log);
"
```

### 2. Test Draws

```bash
# Execute hourly draw (requires executor private key)
curl -X GET https://your-app.vercel.app/api/cron/execute-hourly-draw \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Check results page
open https://your-app.vercel.app/results
```

### 3. Test Ticket Purchase

1. Go to app homepage
2. Connect wallet
3. Buy a test ticket ($0.25 USDT)
4. Verify ticket appears in "My Tickets"

---

## 🔧 Troubleshooting

### Problem: "Contract address not configured"

**Solution:**
```bash
# Check env var
echo $NEXT_PUBLIC_LOTTERY_CONTRACT

# Set in Vercel
vercel env add NEXT_PUBLIC_LOTTERY_CONTRACT
```

### Problem: "Cannot read from contract"

**Possible causes:**
1. Wrong contract address
2. Contract not deployed on BASE Mainnet
3. ABI doesn't match contract
4. RPC endpoint down

**Solution:**
```bash
# Verify contract exists on-chain
cast code 0xYOUR_ADDRESS --rpc-url https://mainnet.base.org

# Should return bytecode (not 0x)
```

### Problem: "Function not found in ABI"

**Solution:**
1. Get latest ABI from contract:
   ```bash
   cast interface 0xYOUR_ADDRESS --rpc-url https://mainnet.base.org > new-abi.json
   ```
2. Compare with `/lib/abi/lottery-dual-crypto.ts`
3. Update ABI to match deployed contract

### Problem: Cron jobs failing

**Solution:**
```bash
# Check executor has funds
cast balance 0xEXECUTOR_ADDRESS --rpc-url https://mainnet.base.org

# Check executor private key is set
vercel env ls | grep WITHDRAWAL_EXECUTOR

# Test cron endpoint manually
curl https://your-app.vercel.app/api/cron/execute-hourly-draw \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📊 Validation Checklist

Before deploying to production, verify:

- [ ] Contract deployed to BASE Mainnet
- [ ] Contract address saved
- [ ] ABI extracted from Foundry output
- [ ] ABI updated in `/lib/abi/lottery-dual-crypto.ts`
- [ ] Contract address updated (env var or hardcoded)
- [ ] Validation script passes: `npx tsx scripts/validate-contract.ts`
- [ ] Git committed and pushed
- [ ] Vercel environment variables updated
- [ ] Vercel deployment successful
- [ ] `/api/verify-contract` returns new address
- [ ] `/results` page shows draws
- [ ] Ticket purchase works
- [ ] Cron jobs execute successfully

---

## 🎓 Advanced: Custom Validation

Add custom checks to `scripts/validate-contract.ts`:

```typescript
// Example: Verify prize pools are funded
const { hourly, daily } = await lotteryContract.getVaultBalances();
if (Number(hourly.usdc) < 1000000) {  // < $1 USDC
  throw new Error('Hourly vault not funded!');
}
```

---

## 📞 Support

If you encounter issues:

1. Check validation script output
2. Review Vercel deployment logs
3. Check browser console on `/results` page
4. Verify contract on [BaseScan](https://basescan.org)
5. Test RPC endpoint manually with `cast`

---

## 🔐 Security Notes

- **Never commit private keys** to git
- **Always use environment variables** for secrets
- **Validate contract** before deploying to production
- **Test on testnet first** for major upgrades
- **Keep executor wallet funded** for cron jobs

---

## 🎉 Benefits of This System

✅ **One update → everything works**
✅ **Type-safe** with TypeScript
✅ **Validated** before deployment
✅ **Scalable** - add new contracts easily
✅ **Maintainable** - single source of truth
✅ **Fast** - no manual find/replace needed

---

**Happy deploying! 🚀**
