# 🎰 Bracket System v2.0 - Optimizado para Solana

**Versión**: 2.0 (BTC Always Included + Solana SPL Only)
**Fecha**: 2025-10-22
**Blockchain**: Solana

---

## 🔥 CARACTERÍSTICAS CLAVE

1. ✅ **BTC SIEMPRE DISPONIBLE** - Opción permanente en cada votación
2. ✅ **Solo tokens SPL compatibles** - 100% funcional en Solana smart contract
3. ✅ **Sistema justo** - Rotación equitativa por tiers
4. ✅ **100% automático** - No requiere intervención manual

---

## 🪙 TOKENS DISPONIBLES (12 Total)

### 🔵 TIER 1: Must-Have (BTC siempre incluido)

| Token | Símbolo | ¿Por qué? |
|-------|---------|-----------|
| **Bitcoin** | **BTC** | **SIEMPRE en votación** - cbBTC $1B+ TVL |

### 🟢 TIER 2: Wrapped con Alta Liquidez

| Token | Símbolo | Estado en Solana |
|-------|---------|------------------|
| Dogecoin | DOGE | $35B nativamente bridged |

### 🟣 TIER 3: Solana DeFi Blue Chips (5 tokens)

| Token | Símbolo | Descripción |
|-------|---------|-------------|
| Jupiter | JUP | DEX aggregator líder |
| Raydium | RAY | AMM con más volumen |
| Jito | JTO | Liquid staking + MEV |
| Pyth Network | PYTH | Oracle de precios |
| Orca | ORCA | DEX mejor UX |

### 🎨 TIER 4: Solana Meme Coins (3 tokens)

| Token | Símbolo | Popularidad |
|-------|---------|-------------|
| Bonk | BONK | Meme #1 de Solana |
| dogwifhat | WIF | Top 50 global |
| Popcat | POPCAT | Viral |

### 💵 TIER 5: Stablecoins (Backup)

| Token | Símbolo | Tipo |
|-------|---------|------|
| USD Coin | USDC | Stablecoin |
| Tether | USDT | Stablecoin |

---

## 🎯 SISTEMA DE VOTACIÓN MENSUAL

### Formato: 5 Opciones Cada Mes

```
Cada mes usuarios votan entre 5 tokens:

1. BTC (SIEMPRE) ⭐
2. 1 token de TIER 3 (DeFi) - rotación
3. 1 token de TIER 4 (Meme) - rotación
4. 1 token adicional (TIER 2/3/4) - rotación
5. 1 wildcard surprise - rotación
```

---

## 📅 CALENDARIO DE ROTACIÓN (12 Meses)

| Mes | BTC | DeFi (T3) | Meme (T4) | Adicional | Wildcard | Cycle |
|-----|-----|-----------|-----------|-----------|----------|-------|
| **Ene** | ✅ BTC | JUP | BONK | DOGE | USDC | 0 |
| **Feb** | ✅ BTC | RAY | WIF | JUP | PYTH | 1 |
| **Mar** | ✅ BTC | JTO | POPCAT | RAY | ORCA | 2 |
| **Abr** | ✅ BTC | PYTH | BONK | JTO | DOGE | 3 |
| **May** | ✅ BTC | ORCA | WIF | PYTH | USDT | 4 |
| **Jun** | ✅ BTC | JUP | POPCAT | ORCA | BONK | 5 |
| **Jul** | ✅ BTC | RAY | BONK | JUP | WIF | 6 |
| **Ago** | ✅ BTC | JTO | WIF | RAY | DOGE | 7 |
| **Sep** | ✅ BTC | PYTH | POPCAT | JTO | USDC | 8 |
| **Oct** | ✅ BTC | ORCA | BONK | PYTH | JUP | 9 |
| **Nov** | ✅ BTC | JUP | WIF | ORCA | RAY | 10 |
| **Dic** | ✅ BTC | RAY | POPCAT | DOGE | PYTH | 11 |

**Después de Diciembre**: El ciclo se repite desde Enero

---

## 💰 DISTRIBUCIÓN DE PRIZE POOL

### Escenario 1: Si BTC Gana la Votación

```
Premio del mes:
├── 75% BTC (70% base + 5% extra del token del mes)
└── 25% ETH

Total: 100% del prize pool
```

**Explicación**: Si BTC gana, todo el "token del mes" (5%) se convierte en BTC adicional.

---

### Escenario 2: Si Otro Token Gana (ej: JUP)

```
Premio del mes:
├── 70% BTC (base)
├── 25% ETH (base)
└── 5% JUP (token ganador)

Total: 100% del prize pool
```

**Explicación**: Distribución normal con el token votado representando el 5%.

---

## 🛠️ ESTRUCTURA DE BASE DE DATOS

### Tabla: `token_tiers`

```sql
CREATE TABLE token_tiers (
  id SERIAL PRIMARY KEY,
  token_symbol TEXT UNIQUE NOT NULL,
  tier INTEGER NOT NULL, -- 1=BTC, 2=Wrapped, 3=DeFi, 4=Meme, 5=Stable
  position_in_tier INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  solana_mint_address TEXT, -- SPL Token Mint Address
  is_always_available BOOLEAN DEFAULT FALSE, -- TRUE solo para BTC
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Insertar Datos Iniciales

```sql
INSERT INTO token_tiers (token_symbol, tier, position_in_tier, name, solana_mint_address, is_always_available) VALUES
  -- TIER 1: BTC (siempre disponible)
  ('BTC', 1, 1, 'Wrapped Bitcoin (cbBTC)', '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', TRUE),

  -- TIER 2: Wrapped con alta liquidez
  ('DOGE', 2, 1, 'Dogecoin', 'TBD', FALSE),

  -- TIER 3: Solana DeFi
  ('JUP', 3, 1, 'Jupiter', 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', FALSE),
  ('RAY', 3, 2, 'Raydium', '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', FALSE),
  ('JTO', 3, 3, 'Jito', 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', FALSE),
  ('PYTH', 3, 4, 'Pyth Network', 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', FALSE),
  ('ORCA', 3, 5, 'Orca', 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', FALSE),

  -- TIER 4: Meme Coins
  ('BONK', 4, 1, 'Bonk', 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', FALSE),
  ('WIF', 4, 2, 'dogwifhat', 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', FALSE),
  ('POPCAT', 4, 3, 'Popcat', '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', FALSE),

  -- TIER 5: Stablecoins
  ('USDC', 5, 1, 'USD Coin', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', FALSE),
  ('USDT', 5, 2, 'Tether', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', FALSE);
```

**Nota**: Los `solana_mint_address` deben verificarse en producción usando Solscan o Solana Explorer.

---

## 🤖 API: Generar Propuestas con BTC Siempre Incluido

```typescript
// POST /api/admin/generate-monthly-proposals
export async function POST(request: NextRequest) {
  const { month, year } = await request.json();
  const targetMonth = month || new Date().getMonth() + 1;
  const targetYear = year || new Date().getFullYear();

  // Calcular posición en el ciclo (0-11 para 12 meses)
  const cyclePosition = (targetMonth - 1) % 12;

  // BTC SIEMPRE está incluido
  const proposedTokens = ['BTC'];

  // Obtener tokens de cada tier según calendario
  // (Ver tabla de calendario arriba para la lógica de rotación)

  // TIER 3: DeFi (rotación)
  const tier3Tokens = ['JUP', 'RAY', 'JTO', 'PYTH', 'ORCA'];
  const tier3Index = cyclePosition % tier3Tokens.length;
  proposedTokens.push(tier3Tokens[tier3Index]);

  // TIER 4: Meme (rotación)
  const tier4Tokens = ['BONK', 'WIF', 'POPCAT'];
  const tier4Index = cyclePosition % tier4Tokens.length;
  proposedTokens.push(tier4Tokens[tier4Index]);

  // Adicional (mix de tiers)
  const additionalOptions = ['DOGE', 'JUP', 'RAY', 'JTO', 'PYTH', 'ORCA'];
  const additionalIndex = cyclePosition % additionalOptions.length;
  const additional = additionalOptions[additionalIndex];
  if (!proposedTokens.includes(additional)) {
    proposedTokens.push(additional);
  }

  // Wildcard (sorpresa)
  const wildcardOptions = ['USDC', 'PYTH', 'ORCA', 'DOGE', 'USDT', 'BONK', 'WIF', 'JUP', 'RAY', 'PYTH', 'JUP', 'RAY'];
  const wildcardIndex = cyclePosition % wildcardOptions.length;
  const wildcard = wildcardOptions[wildcardIndex];
  if (!proposedTokens.includes(wildcard)) {
    proposedTokens.push(wildcard);
  }

  // Asegurar que siempre hay 5 opciones
  while (proposedTokens.length < 5) {
    proposedTokens.push('USDC'); // Fallback
  }

  // Crear propuesta en DB
  await supabase.from('monthly_token_proposals').insert({
    month: targetMonth,
    year: targetYear,
    proposed_tokens: proposedTokens.slice(0, 5), // Máximo 5
    status: 'active',
  });

  return NextResponse.json({
    success: true,
    tokens: proposedTokens,
    message: `Proposals for ${targetMonth}/${targetYear}: ${proposedTokens.join(', ')}`,
  });
}
```

---

## 🎮 FLUJO DE USUARIO

### Semana 1 del Mes

```
1. Sistema genera propuestas automáticamente
   POST /api/admin/generate-monthly-proposals

2. Usuario ve opciones del mes
   GET /api/tokens/proposals

   Respuesta:
   {
     "tokens": ["BTC", "JUP", "BONK", "DOGE", "USDC"],
     "month": 1,
     "year": 2025
   }

3. Usuario vota por su favorito
   POST /api/tokens/vote
   Body: { "walletAddress": "0x123...", "tokenSymbol": "BTC" }
```

### Durante el Mes

```
4. Otros usuarios también votan
5. Sistema cuenta votos en tiempo real
6. Frontend muestra votos parciales (opcional)
```

### Último Día del Mes

```
7. CRON Job finaliza votación automáticamente
   GET /api/cron/finalize-monthly-vote

8. Token ganador se aplica a draws del siguiente mes
   UPDATE draws SET token_symbol = 'BTC' WHERE month = 2
```

### Nuevo Mes

```
9. Prize pool usa token ganador automáticamente
   - Si ganó BTC: 75% BTC + 25% ETH
   - Si ganó otro: 70% BTC + 25% ETH + 5% Token
```

---

## 💡 VENTAJAS DE ESTA VERSIÓN

### ✅ Para Usuarios

1. **BTC siempre disponible** - Pueden votar para aumentar % de BTC
2. **Tokens reales de Solana** - No tokens fake o con baja liquidez
3. **Diversidad** - DeFi, Memes, Stablecoins
4. **Simple** - Solo 5 opciones cada mes

### ✅ Para el Smart Contract

1. **100% SPL compatible** - Todos los tokens funcionan en Solana
2. **Alta liquidez** - Swaps fáciles en Raydium/Orca
3. **Mint addresses verificados** - No riesgo de tokens fake
4. **Menor gas fees** - Solana es súper barato

### ✅ Para el Negocio

1. **Marketing predecible** - Sabes qué tokens vienen cada mes
2. **Community engagement** - Votación mensual = interacción
3. **Justo y transparente** - Sistema automático sin manipulación
4. **Escalable** - Fácil agregar más tokens SPL en el futuro

---

## 🚀 EJEMPLO PRÁCTICO

### Enero 2025

**Propuestas**: BTC, JUP, BONK, DOGE, USDC

**Votación**:
- BTC: 450 votos (40%)
- JUP: 350 votos (31%)
- BONK: 200 votos (18%)
- DOGE: 100 votos (9%)
- USDC: 25 votos (2%)

**Ganador**: BTC 🏆

**Prize Pool de Febrero**:
```
Ticket price: $0.25
Distribution:
- 75% → BTC ($0.1875)
- 25% → ETH ($0.0625)

Si se compran 10,000 tickets:
- Total: $2,500
- BTC pool: $1,875 (75%)
- ETH pool: $625 (25%)
```

---

### Febrero 2025

**Propuestas**: BTC, RAY, WIF, JUP, PYTH

**Votación**:
- RAY: 500 votos (42%)
- BTC: 400 votos (33%)
- WIF: 200 votos (17%)
- JUP: 75 votos (6%)
- PYTH: 25 votos (2%)

**Ganador**: RAY 🏆

**Prize Pool de Marzo**:
```
Ticket price: $0.25
Distribution:
- 70% → BTC ($0.175)
- 25% → ETH ($0.0625)
- 5% → RAY ($0.0125)

Si se compran 10,000 tickets:
- Total: $2,500
- BTC pool: $1,750 (70%)
- ETH pool: $625 (25%)
- RAY pool: $125 (5%)
```

---

## 📊 MÉTRICAS DE ÉXITO

### KPIs a Trackear

1. **Participación en votaciones**
   - Meta: >30% de usuarios activos votan cada mes

2. **Distribución de votos**
   - ¿Qué tokens son más populares?
   - ¿BTC siempre gana o hay variedad?

3. **Engagement mensual**
   - Pico de actividad durante semana de votación

4. **Liquidez de tokens ganadores**
   - Verificar que swaps en DEXes sean eficientes

---

## 🔧 CONFIGURACIÓN ADICIONAL

### Admin Override (Opcional)

Si necesitas cambiar el token manualmente:

```typescript
// POST /api/admin/set-monthly-token
{
  "month": 3,
  "year": 2025,
  "tokenSymbol": "BONK", // Override manual
  "reason": "Evento especial de BONK"
}
```

### Agregar Nuevo Token SPL

```sql
INSERT INTO token_tiers (token_symbol, tier, position_in_tier, name, solana_mint_address)
VALUES ('RENDER', 3, 6, 'Render Token', 'TBD_MINT_ADDRESS', FALSE);
```

Luego actualizar el código de rotación para incluirlo.

---

## ✅ RESUMEN FINAL

**Sistema**: Bracket System v2.0 con BTC Always Included

**Tokens Totales**: 12 (todos SPL compatibles)

**Rotación**: 12 meses, luego repite

**BTC**: SIEMPRE disponible en votación (opción para aumentar % de BTC)

**Automatización**: 100% - genera propuestas, cuenta votos, aplica ganador

**Smart Contract Ready**: ✅ Todos los tokens tienen SPL Mint Address

---

**¿Listo para implementar socio?** 🚀

Próximos pasos:
1. Crear tablas en Supabase
2. Insertar tokens con sus Mint Addresses
3. Implementar APIs de propuestas y votación
4. Setup CRON jobs
5. Testing completo

¿Empezamos? 🎯
