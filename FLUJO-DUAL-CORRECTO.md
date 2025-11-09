# 🎯 FLUJO DUAL CORRECTO - UN BOLETO ENTRA A AMBAS LOTERIAS

**Fecha**: 2025-10-23
**Blockchain**: BASE
**Sistema**: DUAL LOTTERY (Daily + Weekly)

---

## ✅ CONCEPTO CORRECTO

### UN BOLETO = 2 PARTICIPACIONES

Cuando usuario compra **1 ticket por $0.25 USDC**:

```
$0.25 USDC se DIVIDE automáticamente:

├─ X% → DAILY LOTTERY pool
│  ├─ 70% BTC
│  ├─ 25% ETH
│  └─ 5% Token del mes
│
└─ Y% → WEEKLY LOTTERY pool
   ├─ 70% BTC
   ├─ 25% ETH
   └─ 5% Token del mes

Usuario participa en AMBOS sorteos con mismos números
```

---

## ❓ PREGUNTA CRÍTICA PARA TI, SOCIO:

### ¿Cuál es el PORCENTAJE de división entre Daily y Weekly?

**OPCIÓN A: 50% Daily + 50% Weekly**
```
Ticket $0.25 USDC:
├─ $0.125 (50%) → Daily Pool
└─ $0.125 (50%) → Weekly Pool
```

**OPCIÓN B: 30% Daily + 70% Weekly**
```
Ticket $0.25 USDC:
├─ $0.075 (30%) → Daily Pool
└─ $0.175 (70%) → Weekly Pool
```

**OPCIÓN C: 20% Daily + 80% Weekly**
```
Ticket $0.25 USDC:
├─ $0.05 (20%) → Daily Pool
└─ $0.20 (80%) → Weekly Pool
```

**OPCIÓN D: Otro porcentaje?**
```
Dime tú cuál es el correcto
```

---

## 🎫 FLUJO COMPLETO (asumiendo Opción A: 50/50)

### PASO 1: Usuario Compra Ticket

```
FRONTEND:
1. Usuario selecciona números: [5, 12, 23, 45, 67] Power: 8
2. Click "ADD TO CART"
3. Click "BUY TICKET"
4. Paga: $0.25 USDC

SMART CONTRACT:
5. Recibe $0.25 USDC
6. Divide automáticamente:

   ┌────────────────────────────────────────┐
   │ DAILY POOL (50% = $0.125)             │
   ├────────────────────────────────────────┤
   │ Swap $0.0875 (70%) → cbBTC            │
   │ Swap $0.03125 (25%) → wETH            │
   │ Swap $0.00625 (5%) → MATIC            │
   │                                        │
   │ Guardar en dailyVault                 │
   └────────────────────────────────────────┘

   ┌────────────────────────────────────────┐
   │ WEEKLY POOL (50% = $0.125)            │
   ├────────────────────────────────────────┤
   │ Swap $0.0875 (70%) → cbBTC            │
   │ Swap $0.03125 (25%) → wETH            │
   │ Swap $0.00625 (5%) → MATIC            │
   │                                        │
   │ Guardar en weeklyVault                │
   └────────────────────────────────────────┘

7. Registrar ticket:
   - ID: 12345
   - Owner: 0xUser...
   - Numbers: [5,12,23,45,67] Power: 8
   - Month Token: MATIC
   - Participa en: DAILY + WEEKLY ✅
```

---

### PASO 2: Sorteos SEPARADOS

```
┌─────────────────────────────────────────┐
│ DAILY DRAW (cada día @ 00:00 UTC)     │
├─────────────────────────────────────────┤
│ Chainlink VRF genera:                  │
│ → [12, 23, 34, 45, 56] Power: 9       │
│                                         │
│ Ticket #12345: [5,12,23,45,67] Pow:8  │
│ → Matches: 2                            │
│ → Result: NO WINNER ❌                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ WEEKLY DRAW (cada domingo @ 20:00)    │
├─────────────────────────────────────────┤
│ Chainlink VRF genera:                  │
│ → [5, 12, 23, 45, 67] Power: 8        │
│                                         │
│ Ticket #12345: [5,12,23,45,67] Pow:8  │
│ → Matches: 5 + Power ✅                │
│ → Result: JACKPOT! (Tier 5+1) 🎉      │
└─────────────────────────────────────────┘

Usuario puede GANAR EN AMBOS sorteos
O solo en uno
O en ninguno
```

---

### PASO 3: Usuario Gana Weekly Jackpot

```
Weekly Pool State:
├─ cbBTC: 10.0 cbBTC ($1,080,000)
├─ wETH: 40.0 wETH ($157,600)
└─ MATIC: 2000 MATIC ($2,000)

TOTAL Weekly Pool: $1,239,600

Tier 5+1 (Jackpot) = 50% del pool
Winners en tier 5+1: 2 personas

Usuario recibe:
├─ cbBTC: (10.0 × 50%) / 2 = 2.5 cbBTC ($270,000)
├─ wETH: (40.0 × 50%) / 2 = 10.0 wETH ($39,400)
└─ MATIC: (2000 × 50%) / 2 = 500 MATIC ($500)

TOTAL: $309,900
```

---

## 📊 EJEMPLO CON 1,000 TICKETS VENDIDOS

### Asumiendo 50% Daily + 50% Weekly:

```
VENTAS TOTALES:
1,000 tickets × $0.25 = $250 USDC

DIVISIÓN AUTOMÁTICA:
├─ $125 (50%) → DAILY POOL
│  ├─ $87.50 (70%) → cbBTC
│  ├─ $31.25 (25%) → wETH
│  └─ $6.25 (5%) → MATIC
│
└─ $125 (50%) → WEEKLY POOL
   ├─ $87.50 (70%) → cbBTC
   ├─ $31.25 (25%) → wETH
   └─ $6.25 (5%) → MATIC

DAILY POOL acumula:
- ~0.00081 cbBTC (asumiendo $108K/BTC)
- ~0.0079 wETH (asumiendo $3,940/ETH)
- ~6.25 MATIC (asumiendo $1/MATIC)

WEEKLY POOL acumula:
- ~0.00081 cbBTC
- ~0.0079 wETH
- ~6.25 MATIC

Después de 30 días (30 daily + 4 weekly draws):
- Daily pool: Pequeño (renovado diario)
- Weekly pool: GRANDE (acumulado 7 días)
```

---

## 🔄 ACUMULACIÓN POR MES

```
MES DE MARZO (30 días):

DAILY LOTTERY:
├─ Se ejecuta 30 veces
├─ Cada día acumula ~$8.33 (si 100 tickets/día)
├─ Pool al final del día: ~$8.33
└─ Se reparte y RESETEA cada día

WEEKLY LOTTERY:
├─ Se ejecuta 4 veces (4 domingos)
├─ Cada semana acumula ~$437.50 (si 700 tickets/semana)
├─ Pool al final de semana: ~$437.50
└─ Se reparte y RESETEA cada domingo

IMPORTANTE:
- Los pools NO se acumulan entre draws
- Cada draw reparte lo acumulado desde el último draw
- Si nadie gana un tier, ese % se queda para el siguiente draw
```

---

## 🎯 SMART CONTRACT STRUCTURE

```solidity
struct Vault {
    uint256 cbBTC;
    uint256 wETH;
    mapping(string => uint256) tokenOfMonth; // MATIC, UNI, etc.
}

Vault public dailyVault;
Vault public weeklyVault;

function buyTicket(
    uint8[5] memory numbers,
    uint8 powerNumber
) external {
    // 1. Recibir $0.25 USDC
    IERC20(USDC).transferFrom(msg.sender, address(this), 0.25e6);

    // 2. DIVIDIR entre DAILY y WEEKLY
    uint256 dailyAmount = 0.25e6 * DAILY_PERCENT / 100;  // Ej: 50%
    uint256 weeklyAmount = 0.25e6 * WEEKLY_PERCENT / 100; // Ej: 50%

    // 3. Swap para DAILY pool
    uint256 dailyBTC = swapUSDC_to_cbBTC(dailyAmount * 70 / 100);
    uint256 dailyETH = swapUSDC_to_wETH(dailyAmount * 25 / 100);
    uint256 dailyToken = swapUSDC_to_Token(dailyAmount * 5 / 100);

    dailyVault.cbBTC += dailyBTC;
    dailyVault.wETH += dailyETH;
    dailyVault.tokenOfMonth[currentMonthToken] += dailyToken;

    // 4. Swap para WEEKLY pool
    uint256 weeklyBTC = swapUSDC_to_cbBTC(weeklyAmount * 70 / 100);
    uint256 weeklyETH = swapUSDC_to_wETH(weeklyAmount * 25 / 100);
    uint256 weeklyToken = swapUSDC_to_Token(weeklyAmount * 5 / 100);

    weeklyVault.cbBTC += weeklyBTC;
    weeklyVault.wETH += weeklyETH;
    weeklyVault.tokenOfMonth[currentMonthToken] += weeklyToken;

    // 5. Registrar ticket (participa en AMBOS)
    tickets[nextTicketId] = Ticket({
        id: nextTicketId,
        owner: msg.sender,
        numbers: numbers,
        powerNumber: powerNumber,
        monthToken: currentMonthToken,
        // NO hay "drawType" porque participa en AMBOS
        currentDailyDrawId: dailyDrawId,
        currentWeeklyDrawId: weeklyDrawId,
        isWinnerDaily: false,
        isWinnerWeekly: false,
        dailyTier: "",
        weeklyTier: "",
        dailyClaimed: false,
        weeklyClaimed: false
    });
}
```

---

## 🏆 USUARIO PUEDE GANAR EN AMBOS

```
Ticket #12345: [5,12,23,45,67] Power: 8

DAILY DRAW #365:
→ Números: [5, 12, 23, 99, 88] Power: 1
→ Matches: 3
→ Result: WINNER! Tier 3+0
→ Premio: X% del daily pool ÷ ganadores

WEEKLY DRAW #52:
→ Números: [5, 12, 23, 45, 67] Power: 8
→ Matches: 5 + Power
→ Result: JACKPOT! Tier 5+1
→ Premio: 50% del weekly pool ÷ ganadores

USUARIO GANA EN AMBOS:
✅ Prize from Daily (small)
✅ Prize from Weekly (HUGE)
```

---

## 💡 VENTAJAS DE ESTE SISTEMA

### Para el Usuario:
```
✅ Compra 1 ticket → participa en 2 loterias
✅ Más chances de ganar
✅ Puede ganar en ambos sorteos
✅ Más emocionante (draws diarios)
```

### Para el Negocio:
```
✅ Daily draws mantienen engagement
✅ Weekly draws tienen jackpots grandes
✅ Balance entre frecuencia y premios
✅ Más razones para comprar tickets
```

---

## ❓ PREGUNTAS QUE NECESITO RESPONDER:

1. **¿Cuál es el porcentaje EXACTO de división?**
   - A) 50% Daily + 50% Weekly
   - B) 30% Daily + 70% Weekly
   - C) 20% Daily + 80% Weekly
   - D) Otro?

2. **¿El usuario puede ganar en AMBOS sorteos con el mismo ticket?**
   - A) SÍ - puede ganar daily Y weekly
   - B) NO - solo puede ganar en uno

3. **¿Los tokens del mes se acumulan igual en ambos vaults?**
   - A) SÍ - cada vault tiene su propio mapping de tokens
   - B) NO - comparten el mismo vault de tokens

4. **¿Hay alguna diferencia en prize tiers entre Daily y Weekly?**
   - A) NO - mismos tiers (5+1, 5+0, 4+1, etc.)
   - B) SÍ - dime cuál es la diferencia

---

## 🚨 LO QUE NECESITO DE TI AHORA:

**SOCIO, DIME:**

1. ¿Cuál es el % de división? (Daily vs Weekly)
2. ¿Confirmamos que usuario puede ganar en AMBOS?
3. ¿Hay algo más que esté MAL en este flujo?

**DAME LAS RESPUESTAS Y HAGO EL FLUJO FINAL COMPLETO PROFESIONAL** 🚀

---

**Sin inventar nada. Solo lo que TÚ me digas.** ✅
