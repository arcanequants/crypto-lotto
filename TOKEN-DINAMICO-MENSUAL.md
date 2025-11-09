# 🎯 Sistema de Token Din ámico Mensual

**Estado**: ✅ Implementado y funcionando
**Fecha**: 2025-10-22

---

## 📋 Concepto

Los usuarios votan mensualmente para elegir 1 token que representa el **5% del prize pool**.

- **70% BTC** (fijo)
- **25% ETH** (fijo)
- **5% TOKEN DEL MES** (dinámico - votado por comunidad)

---

## 🪙 Tokens Soportados

Los siguientes tokens están disponibles para votación mensual:

| Token | Símbolo | Descripción |
|-------|---------|-------------|
| Solana | SOL | Layer-1 blockchain |
| Chainlink | LINK | Oracle network |
| Dogecoin | DOGE | Meme coin original |
| Avalanche | AVAX | Smart contracts platform |
| Polygon | MATIC | Ethereum scaling |
| Uniswap | UNI | DEX protocol |
| Aave | AAVE | DeFi lending protocol |

**Ubicación en código**: `/app/api/prices/crypto/route.ts:15`
```typescript
const SUPPORTED_MONTHLY_TOKENS = ['SOL', 'LINK', 'DOGE', 'AVAX', 'MATIC', 'UNI', 'AAVE'];
```

---

## 🔧 Cómo Funciona

### 1. Configuración del Draw

Cada draw tiene un campo `token_symbol` en la tabla `draws`:

```sql
CREATE TABLE draws (
  id BIGSERIAL PRIMARY KEY,
  draw_number INTEGER NOT NULL,
  draw_type TEXT NOT NULL, -- 'daily' | 'weekly'
  token_symbol TEXT DEFAULT 'SOL', -- ⭐ Token del mes votado
  wbtc_amount DECIMAL(18, 8) DEFAULT 0,
  eth_amount DECIMAL(18, 8) DEFAULT 0,
  token_amount DECIMAL(18, 8) DEFAULT 0, -- Cantidad del token dinámico
  ...
);
```

**Ejemplo**:
```sql
-- Enero 2025: SOL ganó la votación
UPDATE draws SET token_symbol = 'SOL' WHERE draw_number = 1;

-- Febrero 2025: LINK ganó la votación
UPDATE draws SET token_symbol = 'LINK' WHERE draw_number = 5;
```

---

### 2. Compra de Tickets

Cuando un usuario compra tickets (`/api/tickets/purchase`):

1. **Lee el `token_symbol` del draw actual**
   ```typescript
   const { data: currentDraw } = await supabase
     .from('draws')
     .select('token_symbol')
     .eq('id', drawId)
     .single();

   const tokenSymbol = currentDraw.token_symbol || 'SOL';
   ```

2. **Obtiene el precio del token dinámico**
   ```typescript
   const pricesRes = await fetch(`/api/prices/crypto?symbols=${tokenSymbol}`);
   const prices = await pricesRes.json();
   const tokenPrice = prices[tokenSymbol.toLowerCase()];
   ```

3. **Calcula cuánto token agregar al prize pool**
   ```typescript
   const tokenUSD = totalCost * 0.05; // 5% del ticket price
   const tokenAmount = tokenUSD / tokenPrice;
   ```

4. **Actualiza el draw usando RPC**
   ```sql
   SELECT update_draw_prize_pool(
     p_draw_id := 1,
     p_btc_delta := 0.00001,
     p_eth_delta := 0.00005,
     p_token_delta := 0.5,  -- Cantidad del token dinámico
     p_ticket_delta := 1,
     p_usd_delta := 0.25
   );
   ```

---

### 3. Visualización en Tiempo Real

El componente `/api/prizes/live` muestra el token actual:

```typescript
// Respuesta del API
{
  "drawType": "weekly",
  "totalUSD": 284523.45,
  "composition": {
    "btc": { "amount": 0.3421, "usd": 182450, "percentage": 70 },
    "eth": { "amount": 1.8521, "usd": 58231, "percentage": 25 },
    "token": {
      "amount": 245,
      "usd": 43842,
      "symbol": "LINK",  // ⭐ Token del mes actual
      "percentage": 5
    }
  },
  "totalTickets": 45200,
  "lastUpdate": 1729459200000
}
```

---

## 📊 Flujo Completo del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│ INICIO DE MES: Votación de Token                           │
│ - Usuarios votan entre SOL, LINK, DOGE, AVAX, MATIC, etc. │
│ - Token ganador se guarda en `draws.token_symbol`          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ USUARIO COMPRA TICKET ($0.25)                               │
│ - Sistema lee `token_symbol` del draw actual               │
│ - Obtiene precio del token desde Coinbase API              │
│ - Calcula: 70% BTC + 25% ETH + 5% TOKEN DINÁMICO          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ RPC FUNCTION: update_draw_prize_pool()                      │
│ - Incrementa wbtc_amount (70%)                             │
│ - Incrementa eth_amount (25%)                              │
│ - Incrementa token_amount (5% del token votado)            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND MUESTRA PRIZE POOL                                 │
│ - Prize total en USD                                        │
│ - Desglose: BTC (70%), ETH (25%), TOKEN_DEL_MES (5%)      │
│ - Token symbol visible para usuarios                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 APIs Modificadas

### 1. `/api/prices/crypto` - Precios Dinámicos

**Antes** (hardcoded a SOL):
```typescript
interface CryptoPrices {
  btc: number;
  eth: number;
  sol: number; // ❌ Solo SOL
}
```

**Después** (soporta cualquier token):
```typescript
interface CryptoPrices {
  btc: number;
  eth: number;
  sol: number;
  [key: string]: number; // ✅ Cualquier token adicional
}

// GET /api/prices/crypto?symbols=LINK
// Devuelve: { btc: 109000, eth: 3900, sol: 186, link: 14.5 }
```

---

### 2. `/api/tickets/purchase` - Compra con Token Dinámico

**Antes** (asumía SOL):
```typescript
const solPrice = prices.sol; // ❌ Hardcoded
const solAmount = solUSD / solPrice;
```

**Después** (usa token del draw):
```typescript
const tokenSymbol = currentDraw.token_symbol || 'SOL'; // ✅ Dinámico
const tokenPrice = prices[tokenSymbol.toLowerCase()];
const tokenAmount = tokenUSD / tokenPrice;

// RPC call con parámetro genérico
await supabase.rpc('update_draw_prize_pool', {
  p_token_delta: tokenAmount, // ✅ Ya no dice "p_sol_delta"
});
```

---

### 3. `/api/prizes/live` - Visualización Dinámica

**Antes**:
```typescript
const tokenUSD = tokenAmount * prices.sol; // TODO: Dynamic lookup ❌
```

**Después**:
```typescript
const tokenSymbol = draw.token_symbol || 'SOL';
const pricesRes = await fetch(`/api/prices/crypto?symbols=${tokenSymbol}`);
const tokenPrice = prices[tokenSymbol.toLowerCase()];
const tokenUSD = tokenAmount * (tokenPrice || 0); // ✅ FIXED
```

---

## 🛠️ Función RPC Actualizada

**Archivo**: `/supabase-update-prize-pool.sql`

```sql
CREATE OR REPLACE FUNCTION update_draw_prize_pool(
  p_draw_id INTEGER,
  p_btc_delta DECIMAL(18, 8),
  p_eth_delta DECIMAL(18, 8),
  p_token_delta DECIMAL(18, 8),  -- ✅ Genérico (antes era p_sol_delta)
  p_ticket_delta INTEGER,
  p_usd_delta DECIMAL(18, 8)
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE draws
  SET
    wbtc_amount = COALESCE(wbtc_amount, 0) + p_btc_delta,
    eth_amount = COALESCE(eth_amount, 0) + p_eth_delta,
    token_amount = COALESCE(token_amount, 0) + p_token_delta,
    total_tickets = COALESCE(total_tickets, 0) + p_ticket_delta,
    total_prize_usd = COALESCE(total_prize_usd, 0) + p_usd_delta
  WHERE id = p_draw_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draw with id % not found', p_draw_id;
  END IF;
END;
$$;
```

**Cambio clave**: `p_token_delta` en lugar de `p_sol_delta` para soportar cualquier token.

---

## 📝 Testing del Sistema

### Escenario 1: Mes de SOL

```sql
-- Configurar draw con SOL
UPDATE draws SET token_symbol = 'SOL' WHERE id = 1;

-- Comprar ticket
POST /api/tickets/purchase
{
  "tickets": [{ "numbers": [1,2,3,4,5], "powerNumber": 10 }],
  "walletAddress": "0x123...",
  "drawId": 1
}

-- Resultado esperado:
-- wbtc_amount aumenta 70%
-- eth_amount aumenta 25%
-- token_amount aumenta 5% (en SOL)
```

### Escenario 2: Mes de LINK

```sql
-- Configurar draw con LINK
UPDATE draws SET token_symbol = 'LINK' WHERE id = 2;

-- Comprar ticket
POST /api/tickets/purchase
{
  "tickets": [{ "numbers": [1,2,3,4,5], "powerNumber": 10 }],
  "walletAddress": "0x123...",
  "drawId": 2
}

-- Resultado esperado:
-- wbtc_amount aumenta 70%
-- eth_amount aumenta 25%
-- token_amount aumenta 5% (en LINK) ✅
```

---

## ⚠️ Importante: Precios de Coinbase

El sistema usa **Coinbase Spot Prices API** para obtener precios:

```
https://api.coinbase.com/v2/prices/{SYMBOL}-USD/spot
```

Todos los tokens soportados deben tener un par `{SYMBOL}-USD` en Coinbase:
- ✅ BTC-USD
- ✅ ETH-USD
- ✅ SOL-USD
- ✅ LINK-USD
- ✅ DOGE-USD
- ✅ AVAX-USD
- ✅ MATIC-USD
- ✅ UNI-USD
- ✅ AAVE-USD

Si un token no está en Coinbase, debe ser agregado manualmente con otra fuente de precios.

---

## 🎯 Próximos Pasos

### Feature: Sistema de Votación

**Archivo a crear**: `/app/vote/page.tsx`

```typescript
// Permitir a usuarios votar por el token del próximo mes
export default function VotePage() {
  const tokens = ['SOL', 'LINK', 'DOGE', 'AVAX', 'MATIC', 'UNI', 'AAVE'];

  return (
    <div>
      <h1>Vote for Next Month's Token</h1>
      {tokens.map(token => (
        <button onClick={() => vote(token)}>
          Vote for {token}
        </button>
      ))}
    </div>
  );
}
```

**Backend**: Guardar votos en Supabase y actualizar `token_symbol` del próximo draw según ganador.

---

## 📚 Archivos Modificados

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `supabase-update-prize-pool.sql` | `p_sol_delta` → `p_token_delta` | ✅ |
| `/app/api/prices/crypto/route.ts` | Soporta `?symbols=` query param | ✅ |
| `/app/api/tickets/purchase/route.ts` | Lee `token_symbol` del draw | ✅ |
| `/app/api/prizes/live/route.ts` | Usa precio dinámico del token | ✅ |

---

## ✅ Resumen

El sistema ahora:

1. ✅ **Lee el `token_symbol`** de cada draw (votado mensualmente)
2. ✅ **Obtiene precios dinámicamente** desde Coinbase API
3. ✅ **Calcula prize pool** con el token correcto
4. ✅ **Actualiza la base de datos** usando RPC genérico
5. ✅ **Muestra el token actual** en el frontend

**No más hardcoded SOL** - cada mes puede ser un token diferente votado por la comunidad! 🎉

---

**Última actualización**: 2025-10-22
**Próxima feature**: Sistema de votación UI para seleccionar token del mes
