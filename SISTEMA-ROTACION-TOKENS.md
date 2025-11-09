# 🎰 Sistema de Rotación Automática de Tokens

**Objetivo**: Sistema justo, divertido y automático para elegir qué tokens se proponen cada mes para votación.

---

## 🎯 3 PROPUESTAS DE SISTEMA

### 📊 OPCIÓN A: "Bracket System" (Recomendada)

**Concepto**: Como un torneo deportivo - tokens compiten en brackets y rotan automáticamente.

#### Cómo funciona:

1. **División en Tiers por Market Cap**:
   ```
   Tier 1 (Top 5):     SOL, XRP, DOGE, ADA, AVAX
   Tier 2 (Top 10):    SHIB, DOT, LINK, MATIC, UNI
   Tier 3 (Top 15):    LTC, NEAR, APT, ARB, FTM
   Tier 4 (Wildcards): AAVE, ATOM, OP, INJ, PEPE
   ```

2. **Cada mes se proponen 4 tokens** (uno de cada tier):
   ```
   Enero:  SOL (T1), DOT (T2), NEAR (T3), AAVE (T4)
   Febrero: XRP (T1), LINK (T2), APT (T3), ATOM (T4)
   Marzo: DOGE (T1), MATIC (T2), ARB (T3), OP (T4)
   Abril: ADA (T1), UNI (T2), FTM (T3), INJ (T4)
   Mayo: AVAX (T1), SHIB (T2), LTC (T3), PEPE (T4)
   Junio: (vuelve a empezar)
   ```

3. **Votación simple**: Usuarios votan entre los 4 tokens propuestos

4. **Token ganador** se usa en el prize pool del siguiente mes

#### ✅ Ventajas:
- **Equitativo**: Cada tier tiene representación
- **Simple**: Solo 4 opciones cada mes
- **Predecible**: Puedes saber qué tokens vienen
- **Justo**: Tokens grandes y pequeños tienen chances
- **Automático**: Rotación cíclica sin intervención manual

#### ❌ Desventajas:
- Menos sorpresa (rotación predecible)

---

### 🎲 OPCIÓN B: "Random Lottery"

**Concepto**: Cada mes se sortean aleatoriamente 4 tokens de la pool completa.

#### Cómo funciona:

1. **Pool total**: 20 tokens soportados

2. **Cada mes**: Sistema elige 4 tokens al azar

3. **Restricción**: Un token no puede repetirse en 3 meses consecutivos

4. **Pesos por tier**:
   ```
   Tier 1: 30% probabilidad
   Tier 2: 30% probabilidad
   Tier 3: 25% probabilidad
   Tier 4: 15% probabilidad
   ```

#### ✅ Ventajas:
- **Divertido**: Nunca sabes qué tokens vendrán
- **Sorpresa**: Cada mes es diferente
- **Justo**: Todos tienen chance pero ponderado por market cap

#### ❌ Desventajas:
- Menos predecible
- Podría repetir tokens similares

---

### 🏆 OPCIÓN C: "Performance-Based" (Más compleja)

**Concepto**: Tokens que ganaron recientemente tienen cooldown. Los que nunca ganaron tienen boost.

#### Cómo funciona:

1. **Sistema de puntos**:
   ```
   - Nunca ganó: +3 puntos
   - Ganó hace >6 meses: +2 puntos
   - Ganó hace 3-6 meses: +1 punto
   - Ganó hace <3 meses: -2 puntos (cooldown)
   ```

2. **Cada mes**:
   - Calcula puntos de cada token
   - Propone los 4 tokens con más puntos
   - Si hay empate, usa market cap como tiebreaker

3. **Después de votación**:
   - Token ganador entra en cooldown
   - Otros tokens mantienen puntos

#### ✅ Ventajas:
- **Súper justo**: Garantiza rotación
- **Balanceado**: Tokens nuevos tienen chances
- **Dinámico**: Se adapta al historial

#### ❌ Desventajas:
- Más complejo de entender
- Requiere tracking de historial

---

## 💡 MI RECOMENDACIÓN: **OPCIÓN A (Bracket System)**

### ¿Por qué?

1. ✅ **Simple de entender**: "Este mes toca un token grande, uno mediano, uno pequeño, y un wildcard"
2. ✅ **Justo**: Todos rotan equitativamente
3. ✅ **Predecible**: Usuarios pueden anticipar qué tokens vienen
4. ✅ **Fácil de implementar**: Solo necesitas un contador de mes
5. ✅ **Marketing**: "Next month: LINK vs SHIB vs NEAR vs PEPE!"

---

## 🛠️ IMPLEMENTACIÓN: Bracket System

### 1. Estructura de Base de Datos

```sql
-- Tabla para definir tiers
CREATE TABLE token_tiers (
  id SERIAL PRIMARY KEY,
  token_symbol TEXT UNIQUE NOT NULL,
  tier INTEGER NOT NULL, -- 1, 2, 3, 4
  position_in_tier INTEGER NOT NULL, -- Orden dentro del tier
  name TEXT NOT NULL,
  description TEXT,
  market_cap_rank INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla para propuestas mensuales
CREATE TABLE monthly_token_proposals (
  id SERIAL PRIMARY KEY,
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  proposed_tokens JSONB NOT NULL, -- ["SOL", "DOT", "NEAR", "AAVE"]
  winning_token TEXT,
  total_votes INTEGER DEFAULT 0,
  votes_breakdown JSONB, -- {"SOL": 150, "DOT": 300, "NEAR": 50, "AAVE": 100}
  status TEXT DEFAULT 'active', -- 'active' | 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(month, year)
);

-- Tabla para votos de usuarios
CREATE TABLE token_votes (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER REFERENCES monthly_token_proposals(id),
  wallet_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  voted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(proposal_id, wallet_address) -- Un voto por usuario por mes
);
```

### 2. Script de Inicialización

```sql
-- Insertar tokens en tiers
INSERT INTO token_tiers (token_symbol, tier, position_in_tier, name, market_cap_rank) VALUES
  -- Tier 1
  ('SOL', 1, 1, 'Solana', 5),
  ('XRP', 1, 2, 'Ripple', 6),
  ('DOGE', 1, 3, 'Dogecoin', 8),
  ('ADA', 1, 4, 'Cardano', 9),
  ('AVAX', 1, 5, 'Avalanche', 10),

  -- Tier 2
  ('SHIB', 2, 1, 'Shiba Inu', 11),
  ('DOT', 2, 2, 'Polkadot', 12),
  ('LINK', 2, 3, 'Chainlink', 13),
  ('MATIC', 2, 4, 'Polygon', 14),
  ('UNI', 2, 5, 'Uniswap', 15),

  -- Tier 3
  ('LTC', 3, 1, 'Litecoin', 16),
  ('NEAR', 3, 2, 'NEAR Protocol', 17),
  ('APT', 3, 3, 'Aptos', 18),
  ('ARB', 3, 4, 'Arbitrum', 19),
  ('FTM', 3, 5, 'Fantom', 20),

  -- Tier 4 (Wildcards)
  ('AAVE', 4, 1, 'Aave', 25),
  ('ATOM', 4, 2, 'Cosmos', 28),
  ('OP', 4, 3, 'Optimism', 30),
  ('INJ', 4, 4, 'Injective', 32),
  ('PEPE', 4, 5, 'Pepe', 35);
```

### 3. API: Generar Propuestas Automáticas

**Archivo**: `/app/api/admin/generate-monthly-proposals/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/admin/generate-monthly-proposals
 *
 * Genera automáticamente las propuestas del mes usando Bracket System
 *
 * Lógica:
 * - Calcula el "rotation cycle" basado en el mes
 * - Selecciona 1 token de cada tier
 * - Crea propuesta en monthly_token_proposals
 */
export async function POST(request: NextRequest) {
  try {
    const { month, year } = await request.json();

    // Default a mes/año actual
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    // Verificar si ya existe propuesta para este mes
    const { data: existing } = await supabase
      .from('monthly_token_proposals')
      .select('id')
      .eq('month', targetMonth)
      .eq('year', targetYear)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Proposal for this month already exists' },
        { status: 400 }
      );
    }

    // Calcular "cycle position" (0-4) basado en el mes
    // Esto hace que rote cada 5 meses
    const cyclePosition = (targetMonth - 1) % 5;

    // Obtener tokens de cada tier en la posición del ciclo
    const { data: tier1Tokens } = await supabase
      .from('token_tiers')
      .select('token_symbol')
      .eq('tier', 1)
      .order('position_in_tier');

    const { data: tier2Tokens } = await supabase
      .from('token_tiers')
      .select('token_symbol')
      .eq('tier', 2)
      .order('position_in_tier');

    const { data: tier3Tokens } = await supabase
      .from('token_tiers')
      .select('token_symbol')
      .eq('tier', 3)
      .order('position_in_tier');

    const { data: tier4Tokens } = await supabase
      .from('token_tiers')
      .select('token_symbol')
      .eq('tier', 4)
      .order('position_in_tier');

    // Seleccionar token de cada tier según cycle position
    const proposedTokens = [
      tier1Tokens?.[cyclePosition]?.token_symbol || 'SOL',
      tier2Tokens?.[cyclePosition]?.token_symbol || 'LINK',
      tier3Tokens?.[cyclePosition]?.token_symbol || 'NEAR',
      tier4Tokens?.[cyclePosition]?.token_symbol || 'AAVE',
    ];

    // Crear propuesta
    const { data: proposal, error } = await supabase
      .from('monthly_token_proposals')
      .insert({
        month: targetMonth,
        year: targetYear,
        proposed_tokens: proposedTokens,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      proposal: {
        id: proposal.id,
        month: targetMonth,
        year: targetYear,
        tokens: proposedTokens,
      },
      message: `Proposals generated for ${targetMonth}/${targetYear}: ${proposedTokens.join(', ')}`,
    });

  } catch (error) {
    console.error('Error generating proposals:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate proposals',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

### 4. API: Votar por Token

**Archivo**: `/app/api/tokens/vote/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/tokens/vote
 *
 * Permite a usuarios votar por su token favorito del mes
 *
 * Body: {
 *   walletAddress: "0x123...",
 *   tokenSymbol: "SOL"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, tokenSymbol } = await request.json();

    if (!walletAddress || !tokenSymbol) {
      return NextResponse.json(
        { error: 'Wallet address and token symbol required' },
        { status: 400 }
      );
    }

    // Obtener propuesta activa del mes actual
    const now = new Date();
    const { data: proposal, error: proposalError } = await supabase
      .from('monthly_token_proposals')
      .select('*')
      .eq('month', now.getMonth() + 1)
      .eq('year', now.getFullYear())
      .eq('status', 'active')
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json(
        { error: 'No active proposal found for this month' },
        { status: 404 }
      );
    }

    // Verificar que el token está en las propuestas
    const proposedTokens = proposal.proposed_tokens as string[];
    if (!proposedTokens.includes(tokenSymbol)) {
      return NextResponse.json(
        { error: `${tokenSymbol} is not a valid option for this month` },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya votó
    const { data: existingVote } = await supabase
      .from('token_votes')
      .select('id')
      .eq('proposal_id', proposal.id)
      .eq('wallet_address', walletAddress)
      .single();

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted this month' },
        { status: 400 }
      );
    }

    // Registrar voto
    const { error: voteError } = await supabase
      .from('token_votes')
      .insert({
        proposal_id: proposal.id,
        wallet_address: walletAddress,
        token_symbol: tokenSymbol,
      });

    if (voteError) {
      throw voteError;
    }

    // Actualizar conteo de votos
    const votesBreakdown = (proposal.votes_breakdown || {}) as Record<string, number>;
    votesBreakdown[tokenSymbol] = (votesBreakdown[tokenSymbol] || 0) + 1;

    await supabase
      .from('monthly_token_proposals')
      .update({
        total_votes: proposal.total_votes + 1,
        votes_breakdown: votesBreakdown,
      })
      .eq('id', proposal.id);

    return NextResponse.json({
      success: true,
      message: `Vote registered for ${tokenSymbol}!`,
      currentVotes: votesBreakdown,
    });

  } catch (error) {
    console.error('Error voting:', error);
    return NextResponse.json(
      {
        error: 'Failed to register vote',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

### 5. CRON Job: Auto-seleccionar ganador

**Archivo**: `/app/api/cron/finalize-monthly-vote/route.ts`

```typescript
/**
 * GET /api/cron/finalize-monthly-vote
 *
 * Se ejecuta automáticamente el último día del mes
 * Cuenta votos y asigna token ganador al siguiente mes
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Obtener propuesta del mes actual
    const { data: proposal } = await supabase
      .from('monthly_token_proposals')
      .select('*')
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .eq('status', 'active')
      .single();

    if (!proposal) {
      return NextResponse.json({ error: 'No active proposal' }, { status: 404 });
    }

    // Determinar ganador
    const votes = (proposal.votes_breakdown || {}) as Record<string, number>;
    let winningToken = '';
    let maxVotes = 0;

    for (const [token, count] of Object.entries(votes)) {
      if (count > maxVotes) {
        maxVotes = count;
        winningToken = token;
      }
    }

    // Si no hay votos, elegir el primero propuesto
    if (!winningToken) {
      winningToken = (proposal.proposed_tokens as string[])[0];
    }

    // Marcar propuesta como completada
    await supabase
      .from('monthly_token_proposals')
      .update({
        winning_token: winningToken,
        status: 'completed',
      })
      .eq('id', proposal.id);

    // Actualizar todos los draws del siguiente mes con el token ganador
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    await supabase
      .from('draws')
      .update({ token_symbol: winningToken })
      .gte('draw_date', `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`)
      .lt('draw_date', `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-01`);

    return NextResponse.json({
      success: true,
      winningToken,
      votes: maxVotes,
      message: `${winningToken} won with ${maxVotes} votes! Applied to all draws in ${nextMonth}/${nextYear}`,
    });

  } catch (error) {
    console.error('Error finalizing vote:', error);
    return NextResponse.json(
      { error: 'Failed to finalize vote' },
      { status: 500 }
    );
  }
}
```

---

## 📅 CALENDARIO DE ROTACIÓN (Bracket System)

| Mes | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Cycle |
|-----|--------|--------|--------|--------|-------|
| Ene | SOL | SHIB | LTC | AAVE | 0 |
| Feb | XRP | DOT | NEAR | ATOM | 1 |
| Mar | DOGE | LINK | APT | OP | 2 |
| Abr | ADA | MATIC | ARB | INJ | 3 |
| May | AVAX | UNI | FTM | PEPE | 4 |
| Jun | SOL | SHIB | LTC | AAVE | 0 (repite) |

---

## 🎮 FLUJO COMPLETO DEL USUARIO

```
DÍA 1 DEL MES
    ↓
Sistema genera propuestas automáticas
POST /api/admin/generate-monthly-proposals
    ↓
Usuarios ven 4 tokens para votar
GET /api/tokens/proposals (obtener propuestas del mes)
    ↓
Usuario vota por su favorito
POST /api/tokens/vote { tokenSymbol: "SOL" }
    ↓
(Durante todo el mes, usuarios siguen votando)
    ↓
ÚLTIMO DÍA DEL MES
    ↓
CRON Job cuenta votos automáticamente
GET /api/cron/finalize-monthly-vote
    ↓
Token ganador se aplica a todos los draws del siguiente mes
UPDATE draws SET token_symbol = 'SOL' WHERE ...
    ↓
NUEVO MES COMIENZA
    ↓
Prize pool usa token ganador automáticamente! 🎉
```

---

## ⚙️ CONFIGURACIÓN

### Opción 1: Totalmente Automático (Recomendado)

1. Sistema genera propuestas el día 1 de cada mes (CRON job)
2. Usuarios votan durante todo el mes
3. Sistema finaliza votación el último día del mes
4. Token ganador se aplica automáticamente

### Opción 2: Manual Override (Admin)

Admin puede override manualmente:

```typescript
// POST /api/admin/set-monthly-token
{
  "month": 2,
  "year": 2025,
  "tokenSymbol": "LINK" // Override manual
}
```

---

## 🎯 RESUMEN

**Sistema Recomendado**: Bracket System (Opción A)

**Por qué es perfecto**:
- ✅ Justo: Todos los tokens rotan equitativamente
- ✅ Simple: Usuarios entienden fácilmente
- ✅ Automático: Funciona solo sin intervención
- ✅ Divertido: Votación mensual crea engagement
- ✅ Predecible: Marketing puede planear con anticipación

**Implementación**:
1. Crear tablas en Supabase
2. Insertar tokens en tiers
3. Crear APIs de propuesta y votación
4. Setup CRON jobs
5. ✅ Sistema funciona solo!

---

¿Te gusta esta propuesta socio? ¿Quieres que implemente el Bracket System (Opción A)?
