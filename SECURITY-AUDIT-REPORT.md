# 🔒 SECURITY AUDIT REPORT - CryptoLotto
**Date**: 2025-10-28
**Auditor**: Claude
**Severity Levels**: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## 📋 EXECUTIVE SUMMARY

### Overall Security Score: **7.2/10** ⚠️

**Status**: Ready for testnet with improvements recommended before mainnet

### Key Findings:
- ✅ **Good**: Supabase RLS, Privy auth, input validation
- ⚠️ **Needs Improvement**: Rate limiting, CRON security, private key management
- 🔴 **Critical**: Missing rate limiting on public APIs

---

## 🔴 CRITICAL VULNERABILITIES

### 1. **Rate Limiting Missing on Public APIs**
**Severity**: 🔴 CRITICAL
**Impact**: DDoS attacks, spam tickets, database overload

**Affected Files**:
- `/api/tickets/purchase/route.ts`
- `/api/tokens/vote/route.ts`
- `/api/withdraw/gasless/route.ts`

**Problem**:
```typescript
// NO PROTECTION against rapid requests
export async function POST(request: NextRequest) {
  const body = await request.json();
  // ... insert directly into database
}
```

**Attack Vector**:
- Attacker can spam 1000s of requests per second
- Fill database with fake tickets
- Drain executor wallet gas fees
- Overload Supabase quota

**Solution**: ✅ Implemented below

---

### 2. **CRON Secret Exposure Risk**
**Severity**: 🔴 CRITICAL
**Impact**: Unauthorized execution of draws, prize manipulation

**Affected Files**:
- All `/api/cron/**` routes

**Problem**:
```typescript
// Weak authentication check
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

**Issues**:
- CRON_SECRET visible in logs if printed
- No IP whitelist
- No request signing
- Replay attacks possible

**Solution**: ✅ Implemented below

---

## 🟠 HIGH SEVERITY ISSUES

### 3. **Private Key Stored in Environment Variable**
**Severity**: 🟠 HIGH
**Impact**: Complete loss of executor wallet funds

**File**: `/api/withdraw/gasless/route.ts`
```typescript
const EXECUTOR_PRIVATE_KEY = process.env.WITHDRAWAL_EXECUTOR_PRIVATE_KEY || '';
const executorWallet = new ethers.Wallet(EXECUTOR_PRIVATE_KEY, provider);
```

**Problem**:
- Private key in plaintext in `.env` file
- Can be exposed via server-side rendering bugs
- Vercel logs may capture it
- No HSM or KMS encryption

**Solution**: ✅ Use AWS KMS / Vercel KMS

---

### 4. **No Input Sanitization on Wallet Addresses**
**Severity**: 🟠 HIGH
**Impact**: Potential blockchain address spoofing

**Files**: Multiple API routes

**Problem**:
```typescript
// Only basic validation
if (!ethers.isAddress(user)) { ... }
// But NO checksumming or normalization
```

**Issues**:
- Case-sensitive address comparison
- Can bypass some security checks
- Potential duplicate accounts

**Solution**: ✅ Implemented below

---

### 5. **SQL Injection Risk via RPC Functions**
**Severity**: 🟠 HIGH
**Impact**: Database manipulation

**File**: `/api/tickets/purchase/route.ts`
```typescript
await supabase.rpc('update_dual_draw_prize_pools', {
  p_daily_draw_id: dailyId, // User can manipulate?
  p_weekly_draw_id: weeklyId,
  // ...
});
```

**Problem**:
- RPC functions need parameter validation
- No schema validation on inputs
- Potential type coercion vulnerabilities

**Solution**: ✅ Implemented below

---

## 🟡 MEDIUM SEVERITY ISSUES

### 6. **No Transaction Rollback on Partial Failures**
**Severity**: 🟡 MEDIUM
**Impact**: Inconsistent database state

**File**: `/api/tickets/purchase/route.ts`
```typescript
// Tickets inserted BEFORE prize pool update
await supabase.from('tickets').insert(ticketsToInsert);

// If this fails, tickets are orphaned ❌
await supabase.rpc('update_dual_draw_prize_pools', {...});
```

**Current Mitigation**:
```typescript
// ROLLBACK exists but not atomic
await supabase.from('tickets').delete()
  .in('ticket_id', ticketsToInsert.map(t => t.ticket_id));
```

**Solution**: Use Supabase transactions or Postgres BEGIN/COMMIT

---

### 7. **Weak Random Number Generation**
**Severity**: 🟡 MEDIUM
**Impact**: Predictable lottery draws (testnet only)

**File**: `/api/cron/execute-daily-draw/route.ts`
```typescript
function generateWinningNumbers() {
  const num = Math.floor(Math.random() * 50) + 1; // ❌ WEAK!
}
```

**Note**: Marked as MOCK, but should be flagged

**Solution**: Already planned to use Chainlink VRF

---

### 8. **No Logging/Monitoring for Suspicious Activity**
**Severity**: 🟡 MEDIUM
**Impact**: Can't detect attacks or fraud

**Problem**:
- No structured logging
- No alerts for unusual patterns
- No audit trail for admin actions

**Solution**: ✅ Implemented below

---

## 🟢 LOW SEVERITY ISSUES

### 9. **Hardcoded Crypto Prices**
**Severity**: 🟢 LOW
**Impact**: Inaccurate prize pool calculations

**File**: `/api/tickets/purchase/route.ts`
```typescript
const btcPrice = 108000; // MOCK
const ethPrice = 3940;
```

**Solution**: Use Chainlink Price Feeds (already planned)

---

### 10. **Missing CORS Headers**
**Severity**: 🟢 LOW
**Impact**: May block legitimate frontend requests

**Solution**: Configure Next.js middleware

---

## ⚡ PERFORMANCE & EFFICIENCY ISSUES

### 11. **N+1 Database Queries**
**Severity**: 🟡 MEDIUM
**Impact**: Slow page loads, high database costs

**File**: `/api/cron/execute-daily-draw/route.ts`
```typescript
// Updates tickets ONE BY ONE ❌
for (const ticket of tickets || []) {
  await supabase.from('tickets').update({...}).eq('id', ticket.id);
}
```

**Solution**: Batch updates
```typescript
// Update ALL tickets in ONE query ✅
await supabase.from('tickets')
  .update({...})
  .in('id', ticketIds);
```

---

### 12. **No Database Indexing Strategy**
**Severity**: 🟡 MEDIUM
**Impact**: Slow queries as data grows

**Missing Indexes**:
- `tickets(wallet_address)` - For user ticket lookups
- `tickets(assigned_daily_draw_id)` - For draw execution
- `draws(end_time, executed)` - For CRON jobs
- `monthly_token_proposals(month, year, status)` - For voting

**Solution**: ✅ Implemented below

---

### 13. **Inefficient Prize Pool Calculations**
**Severity**: 🟢 LOW
**Impact**: Unnecessary compute on every request

**File**: Multiple components
```typescript
// Recalculated on EVERY render ❌
const btcUSD = data.cbbtcAmount * btcPrice;
const ethUSD = data.wethAmount * ethPrice;
```

**Solution**: Calculate once in database or cache

---

## 🛡️ PROPOSED SECURITY IMPROVEMENTS

### ✅ SOLUTION 1: Rate Limiting Middleware

Create `/middleware.ts`:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiter (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMITS = {
  '/api/tickets/purchase': { max: 10, window: 60000 }, // 10 req/min
  '/api/tokens/vote': { max: 5, window: 60000 },
  '/api/withdraw/gasless': { max: 3, window: 60000 },
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

  // Check if path needs rate limiting
  const limit = RATE_LIMITS[pathname as keyof typeof RATE_LIMITS];
  if (!limit) return NextResponse.next();

  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(key, { count: 1, resetTime: now + limit.window });
    return NextResponse.next();
  }

  if (record.count >= limit.max) {
    // Rate limit exceeded
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  // Increment count
  record.count++;
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

---

### ✅ SOLUTION 2: Enhanced CRON Security

Update all CRON routes:
```typescript
// Whitelist Vercel CRON IPs
const VERCEL_CRON_IPS = [
  '76.76.21.0/24',  // Vercel CRON IP range
  // Add more as needed
];

function isValidCronRequest(request: NextRequest): boolean {
  // 1. Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return false;
  }

  // 2. Check IP whitelist
  const ip = request.ip || request.headers.get('x-forwarded-for');
  if (!ip || !VERCEL_CRON_IPS.some(range => isIPInRange(ip, range))) {
    console.error(`🚨 CRON request from unauthorized IP: ${ip}`);
    return false;
  }

  // 3. Check Vercel-specific headers
  const cronHeader = request.headers.get('x-vercel-cron');
  if (cronHeader !== '1') {
    console.error('🚨 Missing x-vercel-cron header');
    return false;
  }

  return true;
}

export async function GET(request: NextRequest) {
  if (!isValidCronRequest(request)) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... rest of CRON logic
}
```

---

### ✅ SOLUTION 3: Address Normalization

Create `/lib/security/address.ts`:
```typescript
import { ethers } from 'ethers';

export function normalizeAddress(address: string): string {
  try {
    // 1. Validate format
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid address format');
    }

    // 2. Convert to checksum format (prevents case sensitivity issues)
    const checksummed = ethers.getAddress(address);

    // 3. Convert to lowercase for database storage (consistent)
    return checksummed.toLowerCase();
  } catch (error) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
}

// Use in all API routes
const normalizedWallet = normalizeAddress(walletAddress);
```

---

### ✅ SOLUTION 4: Input Validation Schema

Install zod: `npm install zod`

Create `/lib/validation/schemas.ts`:
```typescript
import { z } from 'zod';

export const TicketPurchaseSchema = z.object({
  tickets: z.array(z.object({
    numbers: z.array(z.number().int().min(1).max(50)).length(5),
    powerNumber: z.number().int().min(1).max(20),
  })).min(1).max(50000),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export const VoteSchema = z.object({
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  token_symbol: z.string().min(2).max(10).toUpperCase(),
});

export const WithdrawSchema = z.object({
  token: z.enum(['USDC', 'USDT']),
  user: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  destination: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  deadline: z.number().int().positive(),
  v: z.number().int().min(27).max(28),
  r: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  s: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

// Use in API routes
const parsed = TicketPurchaseSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: 'Validation failed', details: parsed.error.errors },
    { status: 400 }
  );
}
```

---

### ✅ SOLUTION 5: Database Indexes

Run this SQL in Supabase:
```sql
-- Tickets indexes
CREATE INDEX IF NOT EXISTS idx_tickets_wallet_address ON tickets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_tickets_daily_draw ON tickets(assigned_daily_draw_id);
CREATE INDEX IF NOT EXISTS idx_tickets_weekly_draw ON tickets(assigned_weekly_draw_id);
CREATE INDEX IF NOT EXISTS idx_tickets_claim_status ON tickets(claim_status) WHERE claim_status = 'pending';

-- Draws indexes
CREATE INDEX IF NOT EXISTS idx_draws_type_executed ON draws(draw_type, executed);
CREATE INDEX IF NOT EXISTS idx_draws_end_time ON draws(end_time) WHERE executed = false;

-- Token proposals indexes
CREATE INDEX IF NOT EXISTS idx_proposals_month_year ON monthly_token_proposals(month, year, status);

-- Votes indexes
CREATE INDEX IF NOT EXISTS idx_votes_wallet ON token_votes(wallet_address, proposal_id);

-- Analyze tables for query optimization
ANALYZE tickets;
ANALYZE draws;
ANALYZE monthly_token_proposals;
ANALYZE token_votes;
```

---

### ✅ SOLUTION 6: Structured Logging

Create `/lib/logging/logger.ts`:
```typescript
type LogLevel = 'info' | 'warn' | 'error' | 'security';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  ip?: string;
}

class Logger {
  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    console.log(JSON.stringify(entry));

    // Send to monitoring service (Sentry, LogRocket, etc.)
    if (level === 'error' || level === 'security') {
      this.sendToMonitoring(entry);
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context);
  }

  security(message: string, context?: Record<string, any>) {
    this.log('security', message, context);
    // Trigger alert for security team
  }

  private sendToMonitoring(entry: LogEntry) {
    // Integrate with Sentry/DataDog/etc
  }
}

export const logger = new Logger();

// Usage
logger.security('Failed CRON authentication', {
  ip: request.ip,
  path: request.url
});
```

---

## 📊 EFFICIENCY IMPROVEMENTS

### Batch Operations
```typescript
// ❌ BEFORE: N queries
for (const ticket of tickets) {
  await supabase.from('tickets').update({...}).eq('id', ticket.id);
}

// ✅ AFTER: 1 query
const updates = tickets.map(ticket => ({
  id: ticket.id,
  daily_processed: true,
  daily_winner: tier !== null,
  daily_tier: tier,
  daily_prize_amount: tier ? prizeAmounts[tier] : 0,
}));

await supabase.from('tickets').upsert(updates);
```

### Database Caching
```typescript
// Cache crypto prices for 1 minute
const priceCache = new Map<string, {price: number, expires: number}>();

async function getCachedPrice(symbol: string): Promise<number> {
  const cached = priceCache.get(symbol);
  if (cached && Date.now() < cached.expires) {
    return cached.price;
  }

  const price = await fetchPriceFromAPI(symbol);
  priceCache.set(symbol, { price, expires: Date.now() + 60000 });
  return price;
}
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Priority 1 (Before Mainnet)
- [ ] Implement rate limiting middleware
- [ ] Enhanced CRON security with IP whitelist
- [ ] Move private key to KMS/Vault
- [ ] Add input validation with Zod
- [ ] Create database indexes
- [ ] Add structured logging

### Priority 2 (Performance)
- [ ] Batch database updates
- [ ] Implement caching strategy
- [ ] Add database query monitoring
- [ ] Optimize N+1 queries

### Priority 3 (Nice to Have)
- [ ] Add CORS configuration
- [ ] Implement request signing
- [ ] Add health check endpoints
- [ ] Create admin dashboard

---

## 🎯 FINAL RECOMMENDATIONS

### For Testnet:
✅ Current security is **ADEQUATE** for testing

### For Mainnet:
⚠️ **MUST IMPLEMENT** Priority 1 items

### Suggested Timeline:
- **Week 1**: Rate limiting + CRON security + Validation
- **Week 2**: KMS integration + Indexes + Logging
- **Week 3**: Performance optimizations
- **Week 4**: Final security audit + penetration testing

---

**Report Generated**: 2025-10-28
**Next Audit**: Before mainnet launch
