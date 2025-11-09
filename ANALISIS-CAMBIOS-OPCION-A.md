# 🔍 ANÁLISIS COMPLETO: CAMBIOS PARA OPCIÓN A

**Fecha**: 2025-10-23
**Sistema actual**: Single lottery (weekly) con MOCK data
**Sistema nuevo**: Dual lottery (daily + weekly) con 25% platform fee

---

## 📊 RESPUESTAS CONFIRMADAS DEL SOCIO

```
✅ RESPUESTA 1: 20% Daily + 80% Weekly
✅ RESPUESTA 2: SÍ - puede ganar en AMBOS sorteos
✅ RESPUESTA 3: IGUALES - mismos tiers y porcentajes
✅ PLATFORM FEE: 25%
```

---

## 💰 DISTRIBUCIÓN FINAL DEL TICKET ($0.25 USDC)

```
$0.25 USDC:
├─ $0.0625 (25%) → PLATFORM FEE 💰
└─ $0.1875 (75%) → PRIZE POOLS
   ├─ $0.0375 (20% de 75%) → DAILY POOL
   │  ├─ $0.02625 (70%) → cbBTC
   │  ├─ $0.009375 (25%) → wETH
   │  └─ $0.001875 (5%) → MATIC/token del mes
   │
   └─ $0.1500 (80% de 75%) → WEEKLY POOL
      ├─ $0.105 (70%) → cbBTC
      ├─ $0.0375 (25%) → wETH
      └─ $0.0075 (5%) → MATIC/token del mes
```

---

## 🎫 LIFECYCLE DEL TICKET (OPCIÓN A)

### EJEMPLO: Compra Lunes 9 PM, Daily Draw a las 10 PM

```
TICKET #12345: [5, 12, 23, 45, 67] Power: 8
Comprado: Lunes 9:00 PM

ASIGNACIÓN AUTOMÁTICA:
├─ assigned_daily_draw_id: Draw #1001 (Lunes 10 PM) ✅
└─ assigned_weekly_draw_id: Draw #2001 (Sábado 10 PM) ✅

LUNES 10 PM - DAILY DRAW:
- Draw ejecuta con Chainlink VRF
- Números ganadores: [5, 12, 23, 99, 88] Power: 1
- Ticket matches: 3 números, 0 power
- Resultado: WINNER Tier 3+0 ($50)
- daily_processed = TRUE ✅
- daily_winner = TRUE ✅
- daily_tier = "3+0"
- daily_prize_amount = $50
- ⏰ TICKET YA NO PUEDE PARTICIPAR EN MÁS DAILIES

SÁBADO 10 PM - WEEKLY DRAW:
- Draw ejecuta con Chainlink VRF
- Números ganadores: [5, 12, 23, 45, 67] Power: 8
- Ticket matches: 5 números + power
- Resultado: JACKPOT Tier 5+1 ($182,442)
- weekly_processed = TRUE ✅
- weekly_winner = TRUE ✅
- weekly_tier = "5+1"
- weekly_prize_amount = $182,442

TOTAL GANADO: $50 (daily) + $182,442 (weekly) = $182,492 🚀
```

### EJEMPLO 2: Compra Lunes 11 PM (después del daily)

```
TICKET #12346: [1, 2, 3, 4, 5] Power: 10
Comprado: Lunes 11:00 PM (daily de hoy ya pasó)

ASIGNACIÓN AUTOMÁTICA:
├─ assigned_daily_draw_id: Draw #1002 (MARTES 10 PM) ✅
└─ assigned_weekly_draw_id: Draw #2001 (Sábado 10 PM) ✅

MARTES 10 PM - DAILY DRAW:
- Entra al daily del MARTES (no del lunes)
- ...

SÁBADO 10 PM - WEEKLY DRAW:
- Entra normalmente
- ...
```

---

## 🗄️ CAMBIOS REQUERIDOS POR CATEGORÍA

### 1️⃣ **BASE DE DATOS (Supabase)** - CRÍTICO

#### ✅ YA CREADO:
- `supabase-migration-dual-lottery-opcion-a.sql`

#### NECESITAS EJECUTAR:
```sql
-- En Supabase SQL Editor:
-- 1. Copiar todo el contenido de supabase-migration-dual-lottery-opcion-a.sql
-- 2. Pegar en SQL Editor
-- 3. Run
```

#### LO QUE HACE LA MIGRACIÓN:
- ✅ Agrega `draw_type` a tabla `draws` ('daily' | 'weekly')
- ✅ Agrega rollover fields (`rollover_tier_5_1`, `rollover_tier_5_0`, `rollover_tier_4_1`)
- ✅ Agrega `platform_fee_collected` para tracking del 25%
- ✅ Agrega campos dual lottery a `tickets`:
  - `assigned_daily_draw_id`
  - `assigned_weekly_draw_id`
  - `daily_processed`, `daily_winner`, `daily_tier`, `daily_prize_amount`, `daily_claimed`
  - `weekly_processed`, `weekly_winner`, `weekly_tier`, `weekly_prize_amount`, `weekly_claimed`
- ✅ Crea función `get_next_daily_draw_id(purchase_time)` → devuelve draw de HOY o MAÑANA
- ✅ Crea función `get_next_weekly_draw_id(purchase_time)` → devuelve próximo weekly
- ✅ Crea función `update_dual_draw_prize_pools()` → actualiza ambos pools con 25% fee
- ✅ Crea 7 daily draws (próximos 7 días a las 10 PM)
- ✅ Crea 4 weekly draws (próximos 4 sábados a las 10 PM)

---

### 2️⃣ **BACKEND (API Routes)** - MODIFICAR

#### A. `/app/api/tickets/purchase/route.ts` - REEMPLAZAR COMPLETAMENTE

**ANTES** (líneas 68-98):
```typescript
const TICKET_PRICE = 0.25;
const ticketCount = tickets.length;
const totalCost = ticketCount * TICKET_PRICE;

const ticketsToInsert = tickets.map((ticket) => ({
  ticket_id: ticketId,
  draw_id: drawId,  // ❌ SINGLE DRAW
  wallet_address: walletAddress,
  numbers: ticket.numbers,
  power_number: ticket.powerNumber,
  price_paid: TICKET_PRICE,
  claim_status: 'pending',
  prize_amount: 0,
}));
```

**DESPUÉS** (NUEVO):
```typescript
const TICKET_PRICE = 0.25;
const PLATFORM_FEE_PERCENT = 25;
const DAILY_PERCENT = 20; // 20% del prize pool
const WEEKLY_PERCENT = 80; // 80% del prize pool

const ticketCount = tickets.length;
const totalCost = ticketCount * TICKET_PRICE;

// Obtener draw assignments para CADA ticket
const ticketsToInsert = await Promise.all(
  tickets.map(async (ticket) => {
    const ticketId = parseInt(Date.now().toString().slice(-9)) + Math.floor(Math.random() * 100);
    const purchaseTime = new Date().toISOString();

    // Llamar función RPC para obtener daily y weekly draw IDs
    const { data: dailyDrawData } = await supabase
      .rpc('get_next_daily_draw_id', { purchase_time: purchaseTime });

    const { data: weeklyDrawData } = await supabase
      .rpc('get_next_weekly_draw_id', { purchase_time: purchaseTime });

    return {
      ticket_id: ticketId,
      wallet_address: walletAddress,
      numbers: ticket.numbers,
      power_number: ticket.powerNumber,
      price_paid: TICKET_PRICE,

      // ✅ DUAL DRAW ASSIGNMENT
      assigned_daily_draw_id: dailyDrawData,
      assigned_weekly_draw_id: weeklyDrawData,

      // Daily lottery defaults
      daily_processed: false,
      daily_winner: false,
      daily_prize_amount: 0,
      daily_claimed: false,

      // Weekly lottery defaults
      weekly_processed: false,
      weekly_winner: false,
      weekly_prize_amount: 0,
      weekly_claimed: false,
    };
  })
);
```

**DESPUÉS** (líneas 140-160 - Actualizar prize pools):
```typescript
// ANTES: Single pool update
const { error: updateError } = await supabase.rpc('update_draw_prize_pool', {
  p_draw_id: drawId,
  p_btc_delta: btcAmount,
  p_eth_delta: ethAmount,
  p_token_delta: tokenAmount,
  p_ticket_delta: ticketCount,
  p_usd_delta: totalCost,
});

// DESPUÉS: Dual pool update con platform fee
const { data: updateResult, error: updateError } = await supabase.rpc(
  'update_dual_draw_prize_pools',
  {
    p_daily_draw_id: ticketsToInsert[0].assigned_daily_draw_id,
    p_weekly_draw_id: ticketsToInsert[0].assigned_weekly_draw_id,
    p_ticket_price: TICKET_PRICE * ticketCount,
    p_platform_fee_percent: PLATFORM_FEE_PERCENT,
    p_daily_percent: DAILY_PERCENT,
    p_weekly_percent: WEEKLY_PERCENT,
    p_btc_percent: 70,
    p_eth_percent: 25,
    p_token_percent: 5,
    p_btc_price: btcPrice,
    p_eth_price: ethPrice,
    p_token_price: tokenPrice,
  }
);
```

---

#### B. **CREAR NUEVO**: `/app/api/draws/execute/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/draws/execute
 *
 * Ejecuta un draw (daily o weekly) y calcula ganadores
 *
 * Body:
 * {
 *   drawId: 1001,
 *   drawType: 'daily',
 *   winningNumbers: [5, 12, 23, 45, 67],
 *   powerNumber: 8
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { drawId, drawType, winningNumbers, powerNumber } = await request.json();

    // 1. Actualizar draw con winning numbers
    const { error: updateError } = await supabase
      .from('draws')
      .update({
        winning_numbers: winningNumbers,
        power_number: powerNumber,
        executed: true,
        executed_at: new Date().toISOString(),
      })
      .eq('id', drawId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 2. Obtener todos los tickets asignados a este draw
    const ticketField = drawType === 'daily' ? 'assigned_daily_draw_id' : 'assigned_weekly_draw_id';

    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq(ticketField, drawId);

    if (ticketsError) {
      return NextResponse.json({ error: ticketsError.message }, { status: 500 });
    }

    // 3. Calcular ganadores
    const winners = tickets.map(ticket => {
      const matches = ticket.numbers.filter((n: number) =>
        winningNumbers.includes(n)
      ).length;

      const powerMatch = ticket.power_number === powerNumber;

      let tier = null;
      let isWinner = false;

      if (matches === 5 && powerMatch) {
        tier = '5+1';
        isWinner = true;
      } else if (matches === 5) {
        tier = '5+0';
        isWinner = true;
      } else if (matches === 4 && powerMatch) {
        tier = '4+1';
        isWinner = true;
      } else if (matches === 4) {
        tier = '4+0';
        isWinner = true;
      } else if (matches === 3 && powerMatch) {
        tier = '3+1';
        isWinner = true;
      }

      return {
        id: ticket.id,
        isWinner,
        tier,
        matches,
        powerMatch,
      };
    });

    // 4. Actualizar tickets con resultados
    const updateFields = drawType === 'daily'
      ? { daily_processed: true, daily_winner: '{{isWinner}}', daily_tier: '{{tier}}' }
      : { weekly_processed: true, weekly_winner: '{{isWinner}}', weekly_tier: '{{tier}}' };

    for (const winner of winners) {
      await supabase
        .from('tickets')
        .update({
          ...(drawType === 'daily' ? {
            daily_processed: true,
            daily_winner: winner.isWinner,
            daily_tier: winner.tier,
          } : {
            weekly_processed: true,
            weekly_winner: winner.isWinner,
            weekly_tier: winner.tier,
          })
        })
        .eq('id', winner.id);
    }

    // 5. Calcular rollover (si no hay ganadores en tier 5+1, 5+0, 4+1)
    // TODO: Implementar lógica de rollover multi-tier

    return NextResponse.json({
      success: true,
      drawId,
      drawType,
      totalTickets: tickets.length,
      winners: winners.filter(w => w.isWinner).length,
    });

  } catch (error) {
    console.error('Error executing draw:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

### 3️⃣ **FRONTEND** - MODIFICAR

#### A. `lib/supabase.ts` - Actualizar Types

```typescript
export type Ticket = {
  id: number;
  ticket_id?: string;
  wallet_address: string;
  numbers: number[];
  power_number: number;
  price_paid: number;
  created_at: string;

  // ✅ DUAL LOTTERY FIELDS
  assigned_daily_draw_id: number;
  assigned_weekly_draw_id: number;

  // Daily lottery
  daily_processed: boolean;
  daily_winner: boolean;
  daily_tier: string | null;
  daily_prize_amount: number;
  daily_claimed: boolean;
  daily_claimed_at: string | null;

  // Weekly lottery
  weekly_processed: boolean;
  weekly_winner: boolean;
  weekly_tier: string | null;
  weekly_prize_amount: number;
  weekly_claimed: boolean;
  weekly_claimed_at: string | null;

  // Optional draw info
  dailyDraw?: Draw;
  weeklyDraw?: Draw;
};

export type Draw = {
  id: number;
  draw_id: number;
  draw_type: 'daily' | 'weekly';
  end_time: string;
  executed: boolean;
  winning_numbers: number[] | null;
  power_number: number | null;
  total_tickets: number;
  prize_pool: number;

  // Rollover fields
  rollover_tier_5_1: number;
  rollover_tier_5_0: number;
  rollover_tier_4_1: number;

  // Crypto amounts
  cbbtc_amount: number;
  weth_amount: number;
  token_amount: number;
  month_token: string;
  total_prize_usd: number;
  platform_fee_collected: number;

  created_at: string;
  executed_at: string | null;
};
```

---

#### B. `app/my-tickets/page.tsx` - Mostrar Dual Wins

**AGREGAR DESPUÉS DE LÍNEA 50** (dentro del map de tickets):

```tsx
<div className="dual-lottery-status">
  {/* DAILY STATUS */}
  <div className="daily-status">
    <h4>Daily Draw #{ticket.assigned_daily_draw_id}</h4>
    {ticket.daily_processed ? (
      ticket.daily_winner ? (
        <div className="winner">
          🎉 WINNER! Tier {ticket.daily_tier}
          <div className="prize">${ticket.daily_prize_amount}</div>
          {!ticket.daily_claimed && (
            <button
              onClick={() => claimDailyPrize(ticket.id)}
              className="claim-btn"
            >
              CLAIM DAILY PRIZE
            </button>
          )}
          {ticket.daily_claimed && (
            <div className="claimed-badge">✅ CLAIMED</div>
          )}
        </div>
      ) : (
        <div className="no-win">No win in daily draw</div>
      )
    ) : (
      <div className="pending">Waiting for daily draw...</div>
    )}
  </div>

  {/* WEEKLY STATUS */}
  <div className="weekly-status">
    <h4>Weekly Draw #{ticket.assigned_weekly_draw_id}</h4>
    {ticket.weekly_processed ? (
      ticket.weekly_winner ? (
        <div className="winner jackpot">
          🚀 JACKPOT! Tier {ticket.weekly_tier}
          <div className="prize huge">${ticket.weekly_prize_amount}</div>
          {!ticket.weekly_claimed && (
            <button
              onClick={() => claimWeeklyPrize(ticket.id)}
              className="claim-btn"
            >
              CLAIM WEEKLY PRIZE
            </button>
          )}
          {ticket.weekly_claimed && (
            <div className="claimed-badge">✅ CLAIMED</div>
          )}
        </div>
      ) : (
        <div className="no-win">No win in weekly draw</div>
      )
    ) : (
      <div className="pending">Waiting for weekly draw...</div>
    )}
  </div>
</div>
```

---

#### C. `app/page.tsx` - Mostrar Dual Pools

**REEMPLAZAR LÍNEAS ~200-250** (Current Lottery section):

```tsx
<section className="dual-lottery-section">
  <div className="dual-pools">
    {/* DAILY POOL */}
    <div className="daily-pool">
      <h3>DAILY LOTTERY</h3>
      <div className="countdown">
        <div className="next-draw">Next draw: Today 10:00 PM</div>
        <div className="time-left">{/* countdown timer */}</div>
      </div>
      <div className="pool-breakdown">
        <div className="total-pool">${dailyPool.total_prize_usd}</div>
        <div className="crypto-breakdown">
          <div>🟠 {dailyPool.cbbtc_amount} cbBTC</div>
          <div>💎 {dailyPool.weth_amount} wETH</div>
          <div>🟣 {dailyPool.token_amount} {dailyPool.month_token}</div>
        </div>
      </div>
    </div>

    {/* WEEKLY POOL */}
    <div className="weekly-pool">
      <h3>WEEKLY LOTTERY</h3>
      <div className="countdown">
        <div className="next-draw">Next draw: Saturday 10:00 PM</div>
        <div className="time-left">{/* countdown timer */}</div>
      </div>
      <div className="jackpot-display">
        <div className="label">JACKPOT (Tier 5+1)</div>
        <div className="amount huge">${weeklyPool.jackpot}</div>
        <div className="rollover-info">
          <div>Base: ${weeklyPool.base}</div>
          <div className="rollover">Rollover: +${weeklyPool.rollover_tier_5_1}</div>
        </div>
      </div>
      <div className="pool-breakdown">
        <div className="total-pool">${weeklyPool.total_prize_usd}</div>
        <div className="crypto-breakdown">
          <div>🟠 {weeklyPool.cbbtc_amount} cbBTC</div>
          <div>💎 {weeklyPool.weth_amount} wETH</div>
          <div>🟣 {weeklyPool.token_amount} {weeklyPool.month_token}</div>
        </div>
      </div>
    </div>
  </div>

  <div className="purchase-info">
    <p>ONE ticket ($0.25) enters BOTH lotteries! 🎰</p>
    <p>Win in daily, weekly, or BOTH! 🚀</p>
  </div>
</section>
```

---

### 4️⃣ **SMART CONTRACTS** - CREAR DESDE CERO

**ESTADO ACTUAL**: No existen smart contracts funcionales (solo draft viejo en Foundry)

**NECESITAS CREAR**:
- ❌ `CryptoLotteryDual.sol` (Hardhat o Foundry)
- ❌ Integración con Uniswap V3 (swaps)
- ❌ Integración con Chainlink VRF v2.5 (random numbers)
- ❌ Deploy a BASE testnet
- ❌ Deploy a BASE mainnet

**DECISIÓN REQUERIDA**:
- ¿Hardhat o Foundry?
- ¿Cuándo empezar con smart contracts?

---

## 📅 DÓNDE ESTAMOS EN EL ROADMAP

### ✅ COMPLETADO (SEMANAS 1-4 del MVP original):
- ✅ Frontend Next.js + React
- ✅ Privy authentication
- ✅ Supabase database
- ✅ Shopping cart
- ✅ My Tickets page
- ✅ Prize claiming (MOCK)
- ✅ Draw results (MOCK)
- ✅ Live prize pools display

### 🔄 EN PROGRESO:
- 🔄 Migrar a dual lottery system
- 🔄 Agregar 25% platform fee
- 🔄 Implementar ticket lifecycle (Opción A)

### ❌ PENDIENTE:
- ❌ Smart contracts (TOTALMENTE PENDIENTE)
- ❌ Chainlink VRF integration
- ❌ Uniswap swaps integration
- ❌ Rollover multi-tier logic
- ❌ Deploy a BASE network

---

## 🎯 ROADMAP ACTUALIZADO CON OPCIÓN A

### FASE 1: BACKEND (Database + API) - 2-3 días
1. ✅ Ejecutar `supabase-migration-dual-lottery-opcion-a.sql` en Supabase
2. ✅ Modificar `/app/api/tickets/purchase/route.ts`
3. ✅ Crear `/app/api/draws/execute/route.ts`
4. ✅ Testing de funciones RPC

### FASE 2: FRONTEND (UI Updates) - 2-3 días
1. ✅ Actualizar `lib/supabase.ts` types
2. ✅ Modificar `app/my-tickets/page.tsx` para dual wins
3. ✅ Modificar `app/page.tsx` para dual pools
4. ✅ Crear componente `DualPoolDisplay`
5. ✅ Crear componente `RolloverJackpotTracker`
6. ✅ CSS styling

### FASE 3: SMART CONTRACTS (FROM SCRATCH) - 3-4 semanas
1. ❌ Setup Hardhat/Foundry
2. ❌ Crear `CryptoLotteryDual.sol`
3. ❌ Integrar Uniswap V3
4. ❌ Integrar Chainlink VRF
5. ❌ Implementar rollover logic
6. ❌ Testing en local
7. ❌ Deploy a BASE testnet
8. ❌ Testing en testnet
9. ❌ Deploy a BASE mainnet

### FASE 4: INTEGRATION (Frontend + Contracts) - 1 semana
1. ❌ Conectar frontend con smart contracts
2. ❌ Replace MOCK data con real blockchain data
3. ❌ Testing end-to-end

### FASE 5: LAUNCH - 1 semana
1. ❌ Final testing
2. ❌ Deploy production
3. ❌ Marketing
4. ❌ Monitor

---

## 💡 MI RECOMENDACIÓN: POR DÓNDE EMPEZAR

### OPCIÓN 1: BACKEND FIRST (RECOMENDADO)
**Por qué**: Podemos seguir usando MOCK data para testear la lógica dual antes de hacer smart contracts

**Pasos**:
1. **HOY**: Ejecutar migración SQL
2. **HOY**: Modificar `/app/api/tickets/purchase/route.ts`
3. **HOY**: Testing de compra con dual assignment
4. **MAÑANA**: Modificar `app/my-tickets/page.tsx`
5. **MAÑANA**: Modificar `app/page.tsx` con dual pools
6. **PASADO**: Testing completo del flujo
7. **PRÓXIMA SEMANA**: Decidir si empezar smart contracts o seguir puliendo UI

**Ventajas**:
- ✅ Puedes VER el sistema dual funcionando YA
- ✅ No necesitas smart contracts todavía
- ✅ Puedes testear la UX antes de invertir en blockchain
- ✅ Menos riesgo

### OPCIÓN 2: SMART CONTRACTS FIRST
**Por qué**: Si quieres ir directo a blockchain y después adaptar frontend

**Pasos**:
1. **ESTA SEMANA**: Setup Hardhat + Uniswap + Chainlink
2. **PRÓXIMAS 2 SEMANAS**: Desarrollar `CryptoLotteryDual.sol`
3. **SEMANA 3**: Deploy testnet + testing
4. **SEMANA 4**: Integrar frontend

**Ventajas**:
- ✅ Smart contract listo antes
- ✅ No hay "doble trabajo" (no usas MOCK)

**Desventajas**:
- ❌ No puedes ver nada funcionando hasta que termines contracts (3-4 semanas)
- ❌ Más riesgo si hay problemas

---

## 🚨 PREGUNTA CRÍTICA PARA TI, SOCIO

**¿Qué prefieres hacer PRIMERO?**

### A) BACKEND + FRONTEND (MOCK data) - 1 semana
→ Tendrás el sistema dual funcionando visualmente en 1 semana
→ Puedes testear UX y lógica
→ Smart contracts después

### B) SMART CONTRACTS - 3-4 semanas
→ Vas directo a blockchain
→ Frontend después
→ Más tiempo pero sin "doble trabajo"

---

## 📋 CHECKLIST PARA EMPEZAR

### SI ELIGES OPCIÓN A (Backend First):

#### DÍA 1:
- [ ] Abrir Supabase SQL Editor
- [ ] Copiar contenido de `supabase-migration-dual-lottery-opcion-a.sql`
- [ ] Ejecutar SQL (Run)
- [ ] Verificar que se crearon:
  - [ ] 7 daily draws
  - [ ] 4 weekly draws
  - [ ] Nuevas columnas en `tickets`
  - [ ] Funciones RPC `get_next_daily_draw_id()`, `get_next_weekly_draw_id()`

#### DÍA 2:
- [ ] Modificar `/app/api/tickets/purchase/route.ts`
- [ ] Testing: Comprar 1 ticket
- [ ] Verificar en Supabase:
  - [ ] Ticket tiene `assigned_daily_draw_id`
  - [ ] Ticket tiene `assigned_weekly_draw_id`
  - [ ] Daily draw se actualizó con crypto amounts
  - [ ] Weekly draw se actualizó con crypto amounts

#### DÍA 3:
- [ ] Modificar `app/my-tickets/page.tsx`
- [ ] Probar UI con tickets duales
- [ ] Verificar se muestra "Daily" y "Weekly" separados

#### DÍA 4-5:
- [ ] Modificar `app/page.tsx` con dual pools
- [ ] Crear componentes `DualPoolDisplay`
- [ ] CSS styling

#### DÍA 6-7:
- [ ] Testing completo end-to-end
- [ ] Fixes de bugs
- [ ] Decidir próximos pasos

### SI ELIGES OPCIÓN B (Smart Contracts First):

- [ ] Leer `ROADMAP-PROPUESTA-2-UPDATED.md`
- [ ] Decidir: Hardhat o Foundry
- [ ] Setup proyecto de contracts
- [ ] Empezar con `CryptoLotteryDual.sol`

---

## 🎯 SOCIO, DIME:

1. **¿Opción A (Backend First) o Opción B (Smart Contracts First)?**
2. **¿Cuándo quieres empezar?**
3. **¿Tienes dudas sobre algún cambio?**

YO ESTOY LISTO PARA EMPEZAR CUANDO TÚ DIGAS. 🚀
