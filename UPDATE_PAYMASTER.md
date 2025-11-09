# URGENT: Update Coinbase Paymaster Allowlist

## New Contract Deployed - Nov 8, 2025

**New LotteryDualCrypto Address:** `0xfC8DAD31B467d7fB3A15c082c2c61fC2bC0049f9`

### What Changed:
- **Fix**: MIN_SWAP_AMOUNT changed from $10 → $1 USDC
- **Why**: Small swaps (<$1) were causing Uniswap V3 tick spacing reverts
- **Impact**: First ticket purchase will now work! Swaps execute after ~14 tickets instead of failing

### CRITICAL: Add to Coinbase Paymaster Allowlist

**You MUST add this new contract to Coinbase Paymaster allowlist or transactions will fail!**

## Steps to Update:

### 1. Go to Coinbase Developer Platform
https://portal.cdp.coinbase.com/

### 2. Navigate to Paymaster Settings
- Click on your project
- Go to **"Paymaster"** section
- Find **"Contract Allowlist"** or **"Allowed Addresses"**

### 3. Add New Contract Address
Add this address to the allowlist:
```
0xfC8DAD31B467d7fB3A15c082c2c61fC2bC0049f9
```

**Network:** BASE Mainnet (Chain ID 8453)

### 4. Verify on BaseScan
Check the contract is deployed:
https://basescan.org/address/0xfC8DAD31B467d7fB3A15c082c2c61fC2bC0049f9

### 5. Test Ticket Purchase
After adding to allowlist:
1. Refresh http://localhost:3000
2. Try buying a ticket
3. Should work now! ✅

## Why This Fixes the Issue:

### Before (OLD contract - 0x424B...):
```
User buys ticket #1 → Pending: $0.0225 USDC
Contract tries swap → $0.0225 < $10 MIN but time passed
Swap executes → Uniswap rejects (too small)
❌ TRANSACTION FAILS
```

### After (NEW contract - 0xfC8D...):
```
User buys ticket #1 → Pending: $0.0225 USDC
Check: $0.0225 < $1 MIN → NO SWAP, store as USDC
✅ TRANSACTION SUCCESS

...tickets 2-13...

User buys ticket #14 → Pending: $1.05 USDC
Check: $1.05 >= $1 MIN → SWAP EXECUTES
✅ BTC + ETH + USDC stored in vault
```

## Contract Details:

| Property | Value |
|----------|-------|
| **Address** | `0xfC8DAD31B467d7fB3A15c082c2c61fC2bC0049f9` |
| **Network** | BASE Mainnet (8453) |
| **Compiler** | Solc 0.8.30 |
| **MIN_SWAP_AMOUNT** | $1.00 USDC (1000000 with 6 decimals) |
| **Ticket Price** | $0.10 USDC |
| **Swap Frequency** | Every ~14 tickets OR every 5 minutes |

## Also Keep These in Allowlist:

Make sure these are ALSO still in the allowlist:

1. **USDC Contract** (for approvals):
   ```
   0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
   ```

2. **Old Lottery Contract** (for backward compatibility, can remove later):
   ```
   0x424B72AAcA06D494De1D89C9778D533104786648
   ```

## Expected Behavior After Fix:

### First 14 Tickets:
- Users can buy tickets ✅
- USDC accumulates in contract (no swap yet)
- Prize pool grows as 100% USDC

### Ticket 14+:
- Swap triggers automatically
- 70% USDC → cbBTC
- 20% USDC → WETH
- 10% stays as USDC
- Future prizes are BTC + ETH + USDC mix

### Draw Execution:
- If <14 tickets sold → Winner gets 100% USDC
- If ≥14 tickets sold → Winner gets BTC + ETH + USDC

## Verification:

After updating Paymaster allowlist, verify in browser console:

```javascript
// Should see these logs:
✅ Infinite approval confirmed!
✅ Approval complete! All future purchases will be instant.
🎫 Buying ticket with Privy smart wallet (gas sponsored by Coinbase Paymaster)
✅ Ticket purchased successfully!
```

## Troubleshooting:

If you still get "not in allowlist" error:
1. Wait 5-10 minutes for changes to propagate
2. Clear browser cache
3. Try in incognito mode
4. Verify address was saved correctly in Coinbase dashboard
5. Contact Coinbase support if issue persists

---

**Status**: Frontend updated ✅ | Paymaster update pending ⏳

**Next**: Add `0xfC8DAD31B467d7fB3A15c082c2c61fC2bC0049f9` to Coinbase Paymaster allowlist!
