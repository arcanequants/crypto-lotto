# 💰 EJEMPLOS VISUALES - DISTRIBUCIÓN DE PREMIOS

**Fecha**: 2025-10-23
**Objetivo**: Explicar con NÚMEROS REALES cómo se reparten los premios

---

## 📊 ESCENARIO COMPLETO - WEEKLY LOTTERY

### PASO 1: Estado Inicial del Weekly Prize Pool

```
┌─────────────────────────────────────────────────────┐
│  WEEKLY PRIZE POOL (antes del sorteo)              │
│                                                     │
│  cbBTC:  10.0 cbBTC × $108,000/BTC = $1,080,000   │
│  wETH:   40.0 wETH  × $3,940/ETH   = $157,600     │
│  MATIC:  2,000 MATIC × $1.00       = $2,000       │
│                                                     │
│  💰 TOTAL PRIZE POOL = $1,239,600                  │
└─────────────────────────────────────────────────────┘
```

---

### PASO 2: Tickets Comprados Esta Semana

```
TOTAL TICKETS VENDIDOS: 10,000 tickets

Usuario A: Ticket #1234 → [5, 12, 23, 34, 45] Power: 8
Usuario B: Ticket #1235 → [5, 12, 23, 34, 45] Power: 8  (mismo!)
Usuario C: Ticket #1236 → [5, 12, 23, 34, 45] Power: 2  (sin power)
Usuario D: Ticket #1237 → [5, 12, 23, 34, 99] Power: 8  (4 números)
Usuario E: Ticket #1238 → [5, 12, 23, 99, 88] Power: 8  (3 números)
... (9,995 tickets más que no ganaron nada)
```

**Dinero recaudado esta semana**:
```
10,000 tickets × $0.25 = $2,500 total

Se convirtió en:
- 70% → $1,750 → cbBTC (agregado al pool)
- 25% → $625 → wETH (agregado al pool)
- 5% → $125 → MATIC (agregado al pool)
```

---

### PASO 3: Sorteo con Chainlink VRF

```
┌─────────────────────────────────────┐
│  NÚMEROS GANADORES                  │
│                                     │
│  Números: [5, 12, 23, 34, 45]     │
│  PowerBall: 8                      │
│                                     │
│  Draw ID: Weekly #52               │
│  Fecha: Domingo 8:00 PM            │
└─────────────────────────────────────┘
```

---

### PASO 4: Determinar Ganadores por Tier

```
┌────────────────────────────────────────────────────────────┐
│  TIER 5+1 (5 números + PowerBall) = JACKPOT              │
│  Premio asignado: 50% del pool total                      │
│                                                            │
│  Ganadores:                                                │
│  ✅ Usuario A (Ticket #1234): 5 matches + power ✓         │
│  ✅ Usuario B (Ticket #1235): 5 matches + power ✓         │
│                                                            │
│  Total ganadores tier 5+1: 2 personas                     │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  TIER 5+0 (5 números sin PowerBall)                       │
│  Premio asignado: 20% del pool total                      │
│                                                            │
│  Ganadores:                                                │
│  ✅ Usuario C (Ticket #1236): 5 matches, no power         │
│                                                            │
│  Total ganadores tier 5+0: 1 persona                      │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  TIER 4+1 (4 números + PowerBall)                         │
│  Premio asignado: 15% del pool total                      │
│                                                            │
│  Ganadores:                                                │
│  ✅ Usuario D (Ticket #1237): 4 matches + power ✓         │
│                                                            │
│  Total ganadores tier 4+1: 1 persona                      │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  TIER 3+1 (3 números + PowerBall)                         │
│  Premio asignado: 10% del pool total                      │
│                                                            │
│  Ganadores:                                                │
│  ✅ Usuario E (Ticket #1238): 3 matches + power ✓         │
│                                                            │
│  Total ganadores tier 3+1: 1 persona                      │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  TIER 4+0 (4 números sin PowerBall)                       │
│  Premio asignado: 5% del pool total                       │
│                                                            │
│  Ganadores: 0 personas                                     │
└────────────────────────────────────────────────────────────┘
```

**RESUMEN DE GANADORES**:
```
Tier 5+1: 2 ganadores (Usuario A y B)
Tier 5+0: 1 ganador (Usuario C)
Tier 4+1: 1 ganador (Usuario D)
Tier 3+1: 1 ganador (Usuario E)
Tier 4+0: 0 ganadores
Tier 3+0: 0 ganadores
```

---

### PASO 5: CALCULAR PREMIOS - TIER POR TIER

#### TIER 5+1 (JACKPOT) - 50% del pool

```
POOL TOTAL = $1,239,600

Tier 5+1 asignado = 50% de $1,239,600 = $619,800

Ganadores: 2 personas (Usuario A y Usuario B)

Premio por persona = $619,800 ÷ 2 = $309,900

┌──────────────────────────────────────────────────────────┐
│  PREMIO USUARIO A (Ticket #1234)                        │
│                                                          │
│  50% del pool ÷ 2 ganadores = 25% del pool cada uno    │
│                                                          │
│  cbBTC:  (10.0 × 0.50) ÷ 2 = 2.5 cbBTC ($270,000)     │
│  wETH:   (40.0 × 0.50) ÷ 2 = 10.0 wETH ($39,400)      │
│  MATIC:  (2000 × 0.50) ÷ 2 = 500 MATIC ($500)         │
│                                                          │
│  💰 TOTAL = $309,900                                    │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  PREMIO USUARIO B (Ticket #1235)                        │
│                                                          │
│  50% del pool ÷ 2 ganadores = 25% del pool cada uno    │
│                                                          │
│  cbBTC:  2.5 cbBTC ($270,000)                          │
│  wETH:   10.0 wETH ($39,400)                           │
│  MATIC:  500 MATIC ($500)                              │
│                                                          │
│  💰 TOTAL = $309,900                                    │
└──────────────────────────────────────────────────────────┘

📊 TIER 5+1 USADO:
- cbBTC: 5.0 de 10.0 (50% usado)
- wETH: 20.0 de 40.0 (50% usado)
- MATIC: 1000 de 2000 (50% usado)
```

---

#### TIER 5+0 - 20% del pool

```
Tier 5+0 asignado = 20% de $1,239,600 = $247,920

Ganadores: 1 persona (Usuario C)

Premio por persona = $247,920 ÷ 1 = $247,920

┌──────────────────────────────────────────────────────────┐
│  PREMIO USUARIO C (Ticket #1236)                        │
│                                                          │
│  20% del pool ÷ 1 ganador = 20% del pool               │
│                                                          │
│  cbBTC:  (10.0 × 0.20) ÷ 1 = 2.0 cbBTC ($216,000)     │
│  wETH:   (40.0 × 0.20) ÷ 1 = 8.0 wETH ($31,520)       │
│  MATIC:  (2000 × 0.20) ÷ 1 = 400 MATIC ($400)         │
│                                                          │
│  💰 TOTAL = $247,920                                    │
└──────────────────────────────────────────────────────────┘

📊 TIER 5+0 USADO:
- cbBTC: 2.0 de 10.0 (20% usado)
- wETH: 8.0 de 40.0 (20% usado)
- MATIC: 400 de 2000 (20% usado)
```

---

#### TIER 4+1 - 15% del pool

```
Tier 4+1 asignado = 15% de $1,239,600 = $185,940

Ganadores: 1 persona (Usuario D)

┌──────────────────────────────────────────────────────────┐
│  PREMIO USUARIO D (Ticket #1237)                        │
│                                                          │
│  cbBTC:  (10.0 × 0.15) ÷ 1 = 1.5 cbBTC ($162,000)     │
│  wETH:   (40.0 × 0.15) ÷ 1 = 6.0 wETH ($23,640)       │
│  MATIC:  (2000 × 0.15) ÷ 1 = 300 MATIC ($300)         │
│                                                          │
│  💰 TOTAL = $185,940                                    │
└──────────────────────────────────────────────────────────┘

📊 TIER 4+1 USADO:
- cbBTC: 1.5 de 10.0 (15% usado)
- wETH: 6.0 de 40.0 (15% usado)
- MATIC: 300 de 2000 (15% usado)
```

---

#### TIER 3+1 - 10% del pool

```
Tier 3+1 asignado = 10% de $1,239,600 = $123,960

Ganadores: 1 persona (Usuario E)

┌──────────────────────────────────────────────────────────┐
│  PREMIO USUARIO E (Ticket #1238)                        │
│                                                          │
│  cbBTC:  (10.0 × 0.10) ÷ 1 = 1.0 cbBTC ($108,000)     │
│  wETH:   (40.0 × 0.10) ÷ 1 = 4.0 wETH ($15,760)       │
│  MATIC:  (2000 × 0.10) ÷ 1 = 100 MATIC ($100)         │
│                                                          │
│  💰 TOTAL = $123,860                                    │
└──────────────────────────────────────────────────────────┘

📊 TIER 3+1 USADO:
- cbBTC: 1.0 de 10.0 (10% usado)
- wETH: 4.0 de 40.0 (10% usado)
- MATIC: 100 de 2000 (10% usado)
```

---

### PASO 6: ESTADO DEL POOL DESPUÉS DE TODOS LOS CLAIMS

```
┌─────────────────────────────────────────────────────────┐
│  WEEKLY POOL - ANTES DE CLAIMS                         │
│                                                         │
│  cbBTC:  10.0 cbBTC ($1,080,000)                      │
│  wETH:   40.0 wETH ($157,600)                         │
│  MATIC:  2,000 MATIC ($2,000)                         │
│                                                         │
│  TOTAL: $1,239,600                                     │
└─────────────────────────────────────────────────────────┘

          ⬇️ CLAIMS ⬇️

Tier 5+1: 5.0 cbBTC + 20.0 wETH + 1000 MATIC (2 ganadores)
Tier 5+0: 2.0 cbBTC + 8.0 wETH + 400 MATIC (1 ganador)
Tier 4+1: 1.5 cbBTC + 6.0 wETH + 300 MATIC (1 ganador)
Tier 3+1: 1.0 cbBTC + 4.0 wETH + 100 MATIC (1 ganador)

TOTAL REPARTIDO:
- cbBTC: 9.5 cbBTC (95% repartido)
- wETH: 38.0 wETH (95% repartido)
- MATIC: 1800 MATIC (90% repartido)

┌─────────────────────────────────────────────────────────┐
│  WEEKLY POOL - DESPUÉS DE CLAIMS                       │
│                                                         │
│  cbBTC:  0.5 cbBTC ($54,000) - QUEDA 5%              │
│  wETH:   2.0 wETH ($7,880) - QUEDA 5%                │
│  MATIC:  200 MATIC ($200) - QUEDA 10%                │
│                                                         │
│  TOTAL RESTANTE: $62,080                              │
│                                                         │
│  Este remanente se acumula para el siguiente weekly    │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 COMPARACIÓN: DAILY vs WEEKLY

### DAILY LOTTERY (más pequeña)

```
┌─────────────────────────────────────────────────────────┐
│  DAILY PRIZE POOL                                       │
│                                                         │
│  cbBTC:  0.5 cbBTC ($54,000)                          │
│  wETH:   2.0 wETH ($7,880)                            │
│  MATIC:  100 MATIC ($100)                             │
│                                                         │
│  💰 TOTAL = $61,980                                    │
└─────────────────────────────────────────────────────────┘

MISMO SISTEMA DE TIERS:

Tier 5+1: 50% = $30,990
Tier 5+0: 20% = $12,396
Tier 4+1: 15% = $9,297
Tier 3+1: 10% = $6,198
Tier 4+0: 5% = $3,099
```

**La diferencia**: El pool es más pequeño, pero el % es el mismo

---

## 🎯 RESPUESTA A TU PREGUNTA: "¿Qué significa 5+1 = 50%?"

### EXPLICACIÓN SIMPLE:

```
"Tier 5+1 = 50% del pool"

Significa:

1. El TIER (categoría de premio) recibe 50% del pool TOTAL

2. Ese 50% se DIVIDE entre TODOS los ganadores de ese tier

3. Ejemplo:

   Pool total: $1,000,000
   Tier 5+1 asignado: $500,000 (50%)

   Si hay 1 ganador:
   → Recibe $500,000 (todo el tier)

   Si hay 2 ganadores:
   → Cada uno recibe $250,000 ($500,000 ÷ 2)

   Si hay 10 ganadores:
   → Cada uno recibe $50,000 ($500,000 ÷ 10)
```

---

## 💡 EJEMPLO CON NÚMEROS MÁS SIMPLES

### Pool simplificado: $100

```
┌──────────────────────────────────┐
│  PRIZE POOL = $100               │
│                                  │
│  BTC: $70 (70%)                 │
│  ETH: $25 (25%)                 │
│  Token: $5 (5%)                 │
└──────────────────────────────────┘

TIER 5+1 (Jackpot) = 50% del pool

Tier asignado:
- BTC: $70 × 0.50 = $35
- ETH: $25 × 0.50 = $12.50
- Token: $5 × 0.50 = $2.50
Total tier: $50

┌────────────────────────────────────────┐
│  CASO 1: 1 GANADOR                    │
│                                        │
│  Ganador A recibe:                     │
│  - $35 BTC                             │
│  - $12.50 ETH                          │
│  - $2.50 Token                         │
│  TOTAL: $50 (100% del tier)           │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  CASO 2: 2 GANADORES                  │
│                                        │
│  Ganador A recibe:                     │
│  - $17.50 BTC ($35 ÷ 2)              │
│  - $6.25 ETH ($12.50 ÷ 2)            │
│  - $1.25 Token ($2.50 ÷ 2)           │
│  TOTAL: $25 (50% del tier)            │
│                                        │
│  Ganador B recibe:                     │
│  - $17.50 BTC                          │
│  - $6.25 ETH                           │
│  - $1.25 Token                         │
│  TOTAL: $25 (50% del tier)            │
│                                        │
│  AMBOS JUNTOS = $50 (100% del tier)   │
└────────────────────────────────────────┘
```

---

## 🔑 FÓRMULA EXACTA EN EL SMART CONTRACT

```solidity
function calculatePrize(
    DrawType drawType,  // DAILY o WEEKLY
    string tier,        // "5+1", "5+0", etc.
    uint256 winnersCount
) returns (uint256 cbbtcPrize, uint256 wethPrize, uint256 tokenPrize) {

    // 1. Seleccionar vault correcto
    Vault storage vault;
    if (drawType == DrawType.DAILY) {
        vault = dailyVault;
    } else {
        vault = weeklyVault;
    }

    // 2. Obtener % del tier
    uint256 tierPercentage = getTierPercentage(tier);
    // Ej: tier "5+1" → tierPercentage = 50

    // 3. Calcular premio individual
    cbbtcPrize = (vault.cbBTC * tierPercentage) / (100 * winnersCount);
    wethPrize = (vault.wETH * tierPercentage) / (100 * winnersCount);
    tokenPrize = (vault.token * tierPercentage) / (100 * winnersCount);

    return (cbbtcPrize, wethPrize, tokenPrize);
}

function getTierPercentage(string tier) returns (uint256) {
    if (tier == "5+1") return 50;  // Jackpot
    if (tier == "5+0") return 20;
    if (tier == "4+1") return 15;
    if (tier == "3+1") return 10;
    if (tier == "4+0") return 5;
    return 0;
}
```

---

## ✅ RESUMEN FINAL

### ¿Cómo se reparten los premios?

```
1. El pool total se divide en TIERS (categorías)

2. Cada tier recibe un % del pool:
   - Tier 5+1: 50%
   - Tier 5+0: 20%
   - Tier 4+1: 15%
   - Tier 3+1: 10%
   - Tier 4+0: 5%

3. El % de cada tier se DIVIDE entre sus ganadores:

   Premio individual = (Pool × Tier%) ÷ Número de ganadores

4. Si no hay ganadores en un tier, ese % se queda en el pool
   para acumularse al siguiente sorteo
```

### Ejemplo rápido:

```
Pool: $1,000,000
Tier 5+1: 50% = $500,000
Ganadores: 2

Cada ganador recibe: $500,000 ÷ 2 = $250,000
```

---

## 🎨 VISUALIZACIÓN FINAL

```
                    PRIZE POOL
                    $1,000,000
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    Tier 5+1        Tier 5+0        Tier 4+1...
     $500K            $200K           $150K
     (50%)            (20%)           (15%)
        │
    2 ganadores
        │
   ┌────┴────┐
   │         │
$250K     $250K
(cada uno)
```

---

**¿ESTÁ MÁS CLARO AHORA, SOCIO?** 🚀

**Dime si entendiste la distribución y respondo tu pregunta #1 sobre tokens de meses anteriores.**
