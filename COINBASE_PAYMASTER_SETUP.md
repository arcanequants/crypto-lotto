# Coinbase Paymaster Setup - Contract Allowlist

## Issue: Contract Not Whitelisted

When trying to buy a ticket, you're getting this error:

```
request denied - called address not in allowlist: 0x424B72AAcA06D494De1D89C9778D533104786648
```

**What this means:**
The Coinbase Paymaster (which sponsors gas fees for transactions) is rejecting the transaction because the LotteryDualCrypto contract address is not in its allowlist.

**Why this happens:**
Coinbase Paymaster requires you to explicitly whitelist smart contract addresses that can receive sponsored (gasless) transactions. This is a security feature to prevent abuse.

## Solution: Add Contract to Privy Dashboard Allowlist

### Step 1: Access Privy Dashboard

1. Go to https://dashboard.privy.io/
2. Log in with your Privy account
3. Select your project: **CryptoLotto**

### Step 2: Navigate to Smart Wallets Settings

1. In the left sidebar, click on **"Smart Wallets"**
2. Look for **"Paymaster"** or **"Gas Sponsorship"** section
3. Click on **"Coinbase Paymaster Settings"** or **"Configure Paymaster"**

### Step 3: Add Contract Addresses to Allowlist

You need to add these 3 contract addresses to the allowlist:

#### 1. LotteryDualCrypto Contract (MAIN CONTRACT)
```
0x424B72AAcA06D494De1D89C9778D533104786648
```
**Purpose:** This is your lottery contract. Users need gasless transactions to buy tickets and claim prizes.

#### 2. USDC Contract
```
0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```
**Purpose:** Users need to approve USDC spending. Without this, approvals won't be gasless.

#### 3. USDT Contract (Optional, if you support USDT)
```
0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2
```
**Purpose:** Same as USDC, for USDT approvals.

### Step 4: Configure Paymaster Policies

In the Privy Dashboard, you should see a section like:

```
Allowed Contract Addresses:
[Add Contract Address]
```

Add each of the 3 addresses above, one at a time.

### Step 5: Save and Apply Changes

1. Click **"Save"** or **"Apply"** button
2. Wait for changes to propagate (may take a few minutes)
3. Test the ticket purchase again

## Alternative: Privy Configuration API

If the dashboard doesn't have a UI for this (some Privy plans), you may need to:

1. **Contact Privy Support** at support@privy.io
2. **Request**: "Please add these contract addresses to the Coinbase Paymaster allowlist for my project"
3. **Provide**:
   - Your Privy App ID: `cmgyczp6p01wdl90bh8v20dua`
   - Contract addresses listed above
   - Network: BASE Mainnet (Chain ID 8453)

## Verification After Setup

### Test the Fix

1. Refresh your browser at http://localhost:3000
2. Try to buy a ticket again
3. You should now see:
   - Approval transaction succeeds (gasless)
   - Ticket purchase succeeds (gasless)
   - NO MORE "not in allowlist" errors

### Check Console Logs

You should see logs like:
```
✅ Approval complete! All future purchases will be instant.
🎫 Buying ticket with Privy smart wallet (gas sponsored by Coinbase Paymaster)
✅ Ticket purchased successfully!
```

## Important Notes

### About Coinbase Paymaster

1. **Free Tier**: Coinbase provides some free gas credits for testing
2. **Production Credits**: You need to apply for the $15K credit program (see APPLICATION.md)
3. **Rate Limits**: If you exceed free tier, you'll start paying for gas or transactions will fail

### Contract Addresses on BASE Mainnet

All contracts are on BASE Mainnet (Chain ID 8453):

| Contract | Address | Purpose |
|----------|---------|---------|
| LotteryDualCrypto | `0x424B72AAcA06D494De1D89C9778D533104786648` | Main lottery contract |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | Official USDC on BASE |
| USDT | `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` | Official USDT on BASE |

### Gas Sponsorship Flow

When a user buys a ticket:

1. **Approval (gasless)**:
   - User calls: `USDC.approve(lotteryContract, MAX_UINT256)`
   - Paymaster pays gas: ~$0.50
   - User pays: $0.00

2. **Ticket Purchase (gasless)**:
   - User calls: `lotteryContract.buyTicket(number)`
   - Paymaster pays gas: ~$0.60
   - User pays: $0.00

3. **Prize Claim (gasless)**:
   - User calls: `lotteryContract.claimHourlyPrize(ticketId)`
   - Paymaster pays gas: ~$0.50
   - User pays: $0.00

**Total gas savings per user**: ~$1.60 per complete flow

## Troubleshooting

### If error persists after adding to allowlist:

1. **Wait 5-10 minutes** for changes to propagate
2. **Clear browser cache** and cookies
3. **Try in incognito mode**
4. **Check Privy Dashboard** to confirm addresses were saved
5. **Contact Privy Support** if issue continues

### If you can't find Paymaster settings in Dashboard:

Your Privy plan may not include UI access to paymaster configuration. In that case:

1. Email support@privy.io
2. Request manual configuration
3. Provide your App ID and contract addresses
4. They usually respond within 24 hours

### Alternative: Disable Gas Sponsorship (NOT RECOMMENDED)

If you can't get Paymaster working and need to test:

1. Users will pay their own gas (~$1.60 per ticket purchase)
2. This defeats the purpose of gasless UX
3. You'll lose users due to high friction

To disable (if absolutely necessary):
- This would require significant code changes
- You'd need to handle gas payments in the frontend
- Not recommended for production

## Next Steps

1. ✅ Add contracts to Privy Dashboard allowlist
2. ✅ Test ticket purchase
3. ✅ Apply for $15K Coinbase Paymaster credits (see APPLICATION.md)
4. ✅ Monitor gas usage in Privy Dashboard
5. ✅ Set up alerts for when you're close to limits

## Support Resources

- **Privy Docs**: https://docs.privy.io/
- **Privy Support**: support@privy.io
- **Coinbase Paymaster Docs**: https://docs.cdp.coinbase.com/paymaster/
- **Discord**: Privy has a Discord server for developer support

---

**Hermano AI - November 8, 2025**
*Configure the paymaster and get those gasless transactions working! 🚀*
