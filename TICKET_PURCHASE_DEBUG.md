# Ticket Purchase Debugging - Nov 8, 2025

## Current Error

```
Execution reverted for an unknown reason.
callData: 0xb61d27f6000000000000000000000000424b72aaca06d494de1d89c9778d533104786648...
```

## Issue Diagnosis

The error shows the transaction is being sent to the lottery contract but reverting. This could be caused by:

1. ❌ **ABI Mismatch** - FIXED! Updated ABI to only pass `_number` parameter
2. ⏳ **Missing Approval** - Need to verify USDC approval was successful
3. ⏳ **Insufficient Balance** - Need to verify which wallet has the USDC
4. ⏳ **Wrong Wallet** - USDC might be in embedded wallet instead of smart wallet

## Wallet Addresses from Debug Panel

From your screenshot:
- `wallets[0]?.address`: `0xE97d6dd8ad4D5ba95a40F5Efc4B84BBC14C04cE` (Embedded wallet)
- `user.wallet?.address`: `0xBE456D42C0f345F3bF818cd5FDdF08cAC3C67146` (Smart wallet)
- `smartWalletClient?.account?.address`: `0xBE456D42C0f345F3bF818cd5FDdF08cAC3C67146` (Smart wallet)

**Transaction is being sent FROM**: `0xBE456D42C0f345F3bF818cd5FDdF08cAC3C67146` (Smart wallet)

## Critical Question

**WHERE IS THE $0.90 USDC?**

The USDC balance showing $0.90 - which wallet does it belong to?

### Check USDC Balance for Both Wallets

1. **Smart Wallet** (`0xBE456D42C0f345F3bF818cd5FDdF08cAC3C67146`):
   - Check on BaseScan: https://basescan.org/address/0xBE456D42C0f345F3bF818cd5FDdF08cAC3C67146
   - Look for USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) balance

2. **Embedded Wallet** (`0xE97d6dd8ad4D5ba95a40F5Efc4B84BBC14C04cE`):
   - Check on BaseScan: https://basescan.org/address/0xE97d6dd8ad4D5ba95a40F5Efc4B84BBC14C04cE
   - Look for USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) balance

## Most Likely Issue

Based on past work, the USDC is probably in the **embedded wallet** (`0xE97d...`), but the transaction is being sent from the **smart wallet** (`0xBE45...`).

### Solution: Transfer USDC from Embedded Wallet to Smart Wallet

If USDC is in embedded wallet:

1. Open browser console (F12)
2. Run this command to transfer:

```javascript
// This will transfer USDC from embedded wallet to smart wallet
// (Already implemented in useContract.ts as transferToSmartWallet function)
```

OR use the `transferToSmartWallet` function in code.

## Alternative: Verify Approval

Even if balance is correct, the approval might have failed. Check:

1. **USDC Approval on BaseScan**:
   - Go to: https://basescan.org/token/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913?a=0xBE456D42C0f345F3bF818cd5FDdF08cAC3C67146
   - Look for "Approvals" tab
   - Verify lottery contract (`0x424B72AAcA06D494De1D89C9778D533104786648`) has approval

2. **If No Approval**:
   - The PaymentModal should automatically request approval
   - If it didn't, there might be an issue with the approval transaction

## Testing Steps

### Step 1: Refresh Page
```bash
# Reload http://localhost:3000 to get latest code changes
```

### Step 2: Open Browser Console
Press F12 and check for errors

### Step 3: Try Ticket Purchase Again
1. Select a number (1-100)
2. Add to cart
3. Click "BUY ALL 1 TICKET - $0.10"
4. Select USDC
5. Click "Pay with USDC"

### Step 4: Watch Console Logs

You should see:
```
💎 Approving infinite allowance for USDC
✅ Infinite approval confirmed!
✅ Approval complete! All future purchases will be instant.
🎫 Buying ticket with Privy smart wallet (gas sponsored by Coinbase Paymaster)
   Number: [your number]
   Smart Wallet: 0xBE456D42C0f345F3bF818cd5FDdF08cAC3C67146
✅ Ticket purchased successfully!
```

### Step 5: If Error Persists

Check the exact error message in console. Common errors:

1. **"Insufficient allowance"** → Approval didn't work
2. **"Insufficient balance"** → USDC is in wrong wallet
3. **"Execution reverted"** → Contract issue (usually means wrong parameters or conditions not met)
4. **"User rejected"** → User canceled transaction in wallet

## Contract Requirements Check

The LotteryDualCrypto contract requires:

1. ✅ Number must be 1-100 (frontend validated)
2. ✅ USDC transfer approved (PaymentModal handles this)
3. ⏳ User has >= 0.10 USDC in smart wallet (need to verify)
4. ⏳ Contract is not paused (should be active)

## BaseScan Links

- **Smart Wallet**: https://basescan.org/address/0xBE456D42C0f345F3bF818cd5FDdF08cAC3C67146
- **Embedded Wallet**: https://basescan.org/address/0xE97d6dd8ad4D5ba95a40F5Efc4B84BBC14C04cE
- **Lottery Contract**: https://basescan.org/address/0x424B72AAcA06D494De1D89C9778D533104786648
- **USDC Contract**: https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

## Next Steps

1. Check which wallet has the $0.90 USDC on BaseScan
2. If in embedded wallet, transfer to smart wallet
3. If in smart wallet, check approval status
4. Try purchase again and check console logs
5. If still fails, share the exact console error message

---

**Status**: Waiting for wallet balance verification

