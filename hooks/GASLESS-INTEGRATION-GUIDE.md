# Gasless Lottery Integration Guide

## 📦 Implementación Completa de Gasless Meta-Transactions (EIP-2771)

### Resumen del Sistema

Este sistema permite a los usuarios comprar tickets de lotería **SIN pagar gas fees** directamente. El gas es pagado por un relayer backend y reembolsado automáticamente por el smart contract.

**User Experience:**
- Usuario: Paga solo **$0.25 por ticket** (gas incluido)
- Backend: Recibe **$0.01 reimbursement por ticket** (~$0.0097 profit después de gas)
- Gas real en BASE: ~$0.0003 por TX

---

## 🏗️ Arquitectura

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Frontend  │ Sign    │   Backend    │ Execute │ Smart Contract  │
│             │ EIP-712 │   Relayer    │ TX      │   (on-chain)    │
│  useLottery │────────▶│ /api/tickets │────────▶│ LotteryAPI3Dual │
│  Gasless    │         │ /buy-gasless │         │ Gasless.sol     │
└─────────────┘         └──────────────┘         └─────────────────┘
      │                        │                         │
      │ 1. Sign offline        │ 2. Validate signature   │ 3. Verify + Execute
      │ (no gas paid)          │    Execute TX           │    Reimburse relayer
      │                        │    (pays gas)           │    4% of ticket price
```

---

## 🚀 Uso Básico (Frontend)

### Ejemplo: Comprar Tickets Gasless

```tsx
'use client';

import { useState } from 'react';
import { useLotteryGasless, Ticket } from '@/hooks/useLotteryGasless';

export default function TicketPurchaseGasless() {
  const { buyTicketsGasless, isLoading, error, clearError } = useLotteryGasless();
  const [tickets, setTickets] = useState<Ticket[]>([
    { numbers: [1, 2, 3, 4, 5], powerNumber: 10 },
  ]);

  const handlePurchase = async () => {
    const result = await buyTicketsGasless(tickets);

    if (result.success) {
      console.log('✅ Tickets purchased!', result);
      alert(`Success! Ticket IDs: ${result.ticketIds.join(', ')}`);
    } else {
      console.error('❌ Purchase failed:', result.message);
      alert(`Error: ${result.message}`);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Buy Tickets (Gasless)</h2>

      {/* Ticket Selection UI */}
      <div className="mb-4">
        {tickets.map((ticket, idx) => (
          <div key={idx} className="border p-4 rounded mb-2">
            <p>Numbers: {ticket.numbers.join(', ')}</p>
            <p>Power: {ticket.powerNumber}</p>
          </div>
        ))}
      </div>

      {/* Purchase Button */}
      <button
        onClick={handlePurchase}
        disabled={isLoading}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : `Buy ${tickets.length} Ticket(s) - $${tickets.length * 0.25}`}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">{error}</p>
          <button onClick={clearError} className="text-red-500 underline">
            Clear Error
          </button>
        </div>
      )}

      {/* Important Note */}
      <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
        <p className="text-green-800 font-bold">✅ NO GAS FEES!</p>
        <p className="text-sm text-green-700">
          You only pay $0.25 per ticket. Gas fees are included and handled automatically.
        </p>
      </div>
    </div>
  );
}
```

---

## 🔧 Setup Required

### 1. Environment Variables (.env.local)

```bash
# Smart Contract Address (Gasless Version)
NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS_GASLESS=0x...

# Chain ID (BASE Mainnet = 8453, BASE Sepolia = 84532)
NEXT_PUBLIC_CHAIN_ID=8453

# BASE RPC URL
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org

# Backend Relayer Private Key (KEEP SECRET!)
RELAYER_PRIVATE_KEY=0x...

# Lottery Contract Address for backend (same as above)
LOTTERY_CONTRACT_ADDRESS_GASLESS=0x...
```

### 2. Supabase Database Migration

Run this SQL in Supabase to add gasless metadata columns:

```sql
-- Add gasless metadata columns to tickets table
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS is_gasless BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tx_hash TEXT,
ADD COLUMN IF NOT EXISTS relayer_address TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_is_gasless ON tickets(is_gasless);
CREATE INDEX IF NOT EXISTS idx_tickets_tx_hash ON tickets(tx_hash);
CREATE INDEX IF NOT EXISTS idx_tickets_relayer_address ON tickets(relayer_address);
```

### 3. Smart Contract Deployment

Deploy `LotteryAPI3DualGasless.sol` to BASE network:

```bash
cd contracts-mvp
forge script script/DeployGasless.s.sol --rpc-url $BASE_RPC_URL --broadcast --verify
```

---

## 📊 Flow Diagram

### User Flow

```
1. User selects numbers (frontend)
   ↓
2. User clicks "Buy Ticket"
   ↓
3. Hook calls getNonce() from smart contract
   ↓
4. Hook creates EIP-712 message with nonce
   ↓
5. User signs message (Metamask/Privy popup - NO GAS)
   ↓
6. Frontend sends signature to /api/tickets/buy-gasless
   ↓
7. Backend validates signature
   ↓
8. Backend executes buyTicketGasless() on-chain (pays gas)
   ↓
9. Smart contract validates signature on-chain
   ↓
10. Smart contract creates ticket (buyer = signer, NOT relayer)
   ↓
11. Smart contract reimburses relayer 4% of ticket price
   ↓
12. Backend inserts ticket into database
   ↓
13. Backend returns success + ticket IDs
   ↓
14. Frontend shows success message
```

---

## 🔐 Security Features

### Smart Contract Level
✅ **EIP-712 Signature Validation**: Prevents tampering with messages
✅ **Nonce Management**: Prevents replay attacks (each nonce can only be used once)
✅ **Deadline Expiration**: Signatures expire in 15 minutes
✅ **Only Trusted Relayer**: Only whitelisted relayer can execute TXs
✅ **Buyer Verification**: Ticket owner = signature signer (NOT relayer)

### Backend Level
✅ **Request Validation**: Zod schema validation on all inputs
✅ **On-chain Nonce Verification**: Backend checks nonce matches before executing
✅ **Rate Limiting**: API rate limits to prevent spam
✅ **Error Rollback**: Failed TXs don't corrupt database state

---

## 💰 Economics

### Per Ticket (Single Purchase)

**User Pays:** $0.25 (all-inclusive)
**Distribution:**
- 4% ($0.01) → Gas Reimbursement to Relayer
- 24% ($0.06) → Platform Fee
- 72% ($0.18) → Prize Pool (30% daily, 70% weekly)

**Relayer Economics:**
- Spends: ~$0.0003 in gas (BASE is cheap!)
- Receives: $0.01 reimbursement
- **Profit: $0.0097 per ticket**

### Bulk Purchase (100 tickets)

**User Pays:** $25.00 total
**Relayer:**
- Spends: ~$0.03 in gas (100 TXs)
- Receives: $1.00 reimbursement
- **Profit: $0.97 per 100 tickets**

---

## 🧪 Testing

### Test on Testnet First

1. Deploy contract to BASE Sepolia (testnet)
2. Fund relayer wallet with test ETH
3. Update `.env.local` with testnet addresses
4. Test with small amounts first

### Manual Test

```bash
# Test purchase with curl
curl -X POST http://localhost:3000/api/tickets/buy-gasless \
  -H "Content-Type: application/json" \
  -d '{
    "buyer": "0x...",
    "tickets": [{"numbers": [1,2,3,4,5], "powerNumber": 10}],
    "nonce": 0,
    "deadline": 1234567890,
    "v": 28,
    "r": "0x...",
    "s": "0x..."
  }'
```

---

## 🚨 Common Issues

### Issue: "Invalid nonce"
**Solution:** Nonce must match on-chain nonce. Backend auto-fetches correct nonce before executing.

### Issue: "Signature expired"
**Solution:** Deadline is 15 minutes. Increase if needed in `useLotteryGasless.ts` (line 178).

### Issue: "Transaction failed on-chain"
**Solution:** Check relayer has enough ETH. Check contract is not paused.

### Issue: "No Ethereum provider found"
**Solution:** Ensure Privy wallet is initialized. Check `usePrivy()` returns `ready: true`.

---

## 📚 API Reference

### Hook: `useLotteryGasless()`

**Returns:**
```ts
{
  buyTicketsGasless: (tickets: Ticket[]) => Promise<GaslessPurchaseResult>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}
```

**Ticket Interface:**
```ts
interface Ticket {
  numbers: number[]; // 5 numbers between 1-50
  powerNumber: number; // 1 number between 1-20
}
```

**GaslessPurchaseResult:**
```ts
interface GaslessPurchaseResult {
  success: boolean;
  ticketIds: number[];
  txHashes: string[];
  totalCost: number;
  message: string;
}
```

---

## 🎯 Next Steps

1. ✅ Smart Contract (LotteryAPI3DualGasless.sol) - DONE
2. ✅ Tests (LotteryAPI3DualGasless.t.sol) - DONE
3. ✅ Backend Relayer API (/api/tickets/buy-gasless) - DONE
4. ✅ Frontend Hook (useLotteryGasless) - DONE
5. ⏳ Deploy to BASE Sepolia Testnet
6. ⏳ End-to-End Testing
7. ⏳ Deploy to BASE Mainnet (PRODUCTION)

---

## 📞 Support

For questions or issues, check:
- Smart Contract: `/Users/albertosorno/crypto-lotto/contracts-mvp/src/LotteryAPI3DualGasless.sol`
- Tests: `/Users/albertosorno/crypto-lotto/contracts-mvp/test/LotteryAPI3DualGasless.t.sol`
- Backend API: `/Users/albertosorno/crypto-lotto/web/app/api/tickets/buy-gasless/route.ts`
- Frontend Hook: `/Users/albertosorno/crypto-lotto/web/hooks/useLotteryGasless.ts`
- EIP-712 Types: `/Users/albertosorno/crypto-lotto/web/lib/eip712/types.ts`

---

**🎉 That's it! Your lottery now supports gasless purchases!**
