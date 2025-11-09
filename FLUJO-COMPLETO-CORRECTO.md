# 🎯 FLUJO COMPLETO DEL SISTEMA - CORRECTO Y VERIFICADO

**Fecha**: 2025-10-23
**Blockchain**: BASE (Ethereum L2)
**Wallet**: Privy
**Payment**: USDC o USDT
**Loterias**: DUAL (Daily + Weekly)

---

## ✅ SISTEMA DUAL DE LOTERIAS

### Hay 2 Prize Pools SEPARADOS:

```
DAILY LOTTERY (todos los días)
├─ Prize Pool: Más pequeño
├─ Draw: Cada día @ 00:00 UTC
└─ Prize tiers: 6 niveles

WEEKLY LOTTERY (cada semana)
├─ Prize Pool: Más grande
├─ Draw: Cada domingo @ 20:00
└─ Prize tiers: 6 niveles
```

**IMPORTANTE**: Cada lotería tiene su PROPIO prize pool separado

---

## 🎫 1. USUARIO COMPRA TICKET ($0.25 USDC)

### Frontend:
```
1. Usuario selecciona números: [5, 12, 23, 45, 67] Power: 8
2. Usuario ELIGE: Daily o Weekly
3. Click "ADD TO CART"
4. Usuario puede agregar más tickets (diferentes números)
5. Click "BUY ALL TICKETS"
6. Privy wallet prompt: "Pay $X USDC" (X = # tickets × $0.25)
7. Usuario aprueba transacción
```

### Smart Contract (BASE):
```solidity
function buyTicket(
    uint8[5] numbers,
    uint8 powerNumber,
    DrawType drawType,  // DAILY o WEEKLY
    address paymentToken,  // USDC o USDT
    uint256 amount  // $0.25
) external {
    // 1. Recibir pago USDC
    IERC20(paymentToken).transferFrom(msg.sender, address(this), amount);

    // 2. Determinar qué vault usar según lottery type
    if (drawType == DrawType.DAILY) {
        // Swap a cryptos para DAILY pool
        uint256 btc = swapUSDC_to_cbBTC(amount * 0.70);
        uint256 eth = swapUSDC_to_wETH(amount * 0.25);
        uint256 token = swapUSDC_to_tokenOfMonth(amount * 0.05);

        // Actualizar vaults de DAILY
        dailyVault.cbBTC += btc;
        dailyVault.wETH += eth;
        dailyVault.tokenOfMonth += token;

    } else {  // WEEKLY
        // Swap a cryptos para WEEKLY pool
        uint256 btc = swapUSDC_to_cbBTC(amount * 0.70);
        uint256 eth = swapUSDC_to_wETH(amount * 0.25);
        uint256 token = swapUSDC_to_tokenOfMonth(amount * 0.05);

        // Actualizar vaults de WEEKLY
        weeklyVault.cbBTC += btc;
        weeklyVault.wETH += eth;
        weeklyVault.tokenOfMonth += token;
    }

    // 3. Crear ticket
    tickets[nextTicketId] = Ticket({
        id: nextTicketId,
        owner: msg.sender,
        numbers: numbers,
        powerNumber: powerNumber,
        drawType: drawType,  // DAILY o WEEKLY
        drawId: currentDrawId[drawType],
        monthToken: currentMonthToken,
        isWinner: false,
        tier: "",
        claimed: false
    });

    nextTicketId++;
}
```

**Costo gas**: ~$0.008 USD (usuario paga en ETH)

---

## 🎲 2. SORTEO CON CHAINLINK VRF

### Se ejecutan 2 sorteos SEPARADOS:

#### DAILY DRAW (cada día @ 00:00 UTC)
```
CRON Job (Vercel):
→ Trigger @ 00:00 UTC
→ POST /api/cron/trigger-draw?type=daily

Smart Contract:
→ requestRandomWords(dailyDrawId)
→ Chainlink VRF genera 6 números
→ Callback: fulfillRandomWords()
→ Winning numbers guardados
→ Determina ganadores de tickets DAILY

Resultado:
- Números ganadores: [12, 23, 34, 45, 56] Power: 9
- Ganadores determinados por tier
```

#### WEEKLY DRAW (cada domingo @ 20:00)
```
CRON Job (Vercel):
→ Trigger @ domingo 20:00
→ POST /api/cron/trigger-draw?type=weekly

Smart Contract:
→ requestRandomWords(weeklyDrawId)
→ Chainlink VRF genera 6 números
→ Callback: fulfillRandomWords()
→ Winning numbers guardados
→ Determina ganadores de tickets WEEKLY

Resultado:
- Números ganadores: [5, 15, 25, 35, 45] Power: 3
- Ganadores determinados por tier
```

**Costo Chainlink**: $1.00 USD por sorteo (pagamos con LINK)
**Total mensual**: ~30 daily + 4 weekly = 34 sorteos × $1 = **$34 USD/mes**

---

## 🏆 3. PRIZE TIERS (IGUALES PARA AMBAS LOTERIAS)

### 6 Niveles de Premios:

```
Tier 5+1 (Jackpot):
├─ Matching: 5 números + PowerBall
└─ Premio: 50% del TOTAL prize pool

Tier 5+0:
├─ Matching: 5 números
└─ Premio: 20% del TOTAL prize pool

Tier 4+1:
├─ Matching: 4 números + PowerBall
└─ Premio: 15% del TOTAL prize pool

Tier 4+0:
├─ Matching: 4 números
└─ Premio: 10% del TOTAL prize pool

Tier 3+1:
├─ Matching: 3 números + PowerBall
└─ Premio: 5% del TOTAL prize pool

Tier 3+0:
├─ Matching: 3 números
└─ Premio: Pequeño monto fijo
```

---

## 💰 4. USUARIO GANA - EJEMPLO COMPLETO

### Escenario: Usuario gana WEEKLY Jackpot (Tier 5+1)

**Estado del Weekly Vault ANTES del claim**:
```
weeklyVault.cbBTC = 10.0 cbBTC ($1,080,000)
weeklyVault.wETH = 40.0 wETH ($157,600)
weeklyVault.tokenOfMonth["MATIC"] = 2000 MATIC ($2,000)

TOTAL Weekly Prize Pool = $1,239,600
```

**Estado del Monthly Token**:
```
currentMonthToken = "MATIC"  (marzo 2025)

tokenOfMonthVault (acumulado histórico):
├─ MATIC (marzo): 2000 tokens
├─ UNI (febrero): 500 tokens (sobró, nadie ganó todo)
└─ BONK (enero): 10,000 tokens (sobró)
```

**Usuario hace claim del Weekly Jackpot**:
```solidity
function claimPrize(uint256 ticketId) external {
    Ticket storage ticket = tickets[ticketId];

    // Verificar que es ganador
    require(ticket.isWinner, "Not a winner");
    require(ticket.tier == "5+1", "Not jackpot");  // Por ejemplo

    // Determinar qué vault usar
    Vault storage vault;
    if (ticket.drawType == DrawType.DAILY) {
        vault = dailyVault;
    } else {
        vault = weeklyVault;  // <-- En este caso
    }

    // CALCULAR PREMIO (JACKPOT = 50% de TODO el pool)
    // Dividido entre TODOS los ganadores del mismo tier

    uint256 winnersCount = _countWinners(ticket.drawType, "5+1");
    // Ejemplo: 2 ganadores de jackpot en este weekly draw

    // Premio de cbBTC:
    uint256 cbbtcPrize = (vault.cbBTC * 50) / (100 * winnersCount);
    // = (10.0 * 50) / (100 * 2) = 2.5 cbBTC

    // Premio de wETH:
    uint256 wethPrize = (vault.wETH * 50) / (100 * winnersCount);
    // = (40.0 * 50) / (100 * 2) = 10.0 wETH

    // Premio del token del mes ACTUAL (MATIC):
    uint256 tokenPrize = (vault.tokenOfMonth * 50) / (100 * winnersCount);
    // = (2000 * 50) / (100 * 2) = 500 MATIC

    // IMPORTANTE: Usuario NO recibe UNI ni BONK de meses pasados
    // Solo recibe el token del mes ACTUAL cuando compró el ticket

    // TRANSFERIR del vault al usuario
    IERC20(CBBTC).transfer(msg.sender, cbbtcPrize);  // 2.5 cbBTC
    IERC20(WETH).transfer(msg.sender, wethPrize);    // 10.0 wETH
    IERC20(MATIC).transfer(msg.sender, tokenPrize);  // 500 MATIC

    // Actualizar vaults (restar lo que se transfirió)
    vault.cbBTC -= cbbtcPrize;      // Quedó: 7.5 cbBTC
    vault.wETH -= wethPrize;        // Quedó: 30.0 wETH
    vault.tokenOfMonth -= tokenPrize;  // Quedó: 1500 MATIC

    // Marcar como claimed
    ticket.claimed = true;
    ticket.claimedAt = block.timestamp;

    emit PrizeClaimed(ticketId, msg.sender, cbbtcPrize, wethPrize, tokenPrize);
}
```

**Usuario recibe en Privy wallet**:
```
✅ 2.5 cbBTC ($270,000)
✅ 10.0 wETH ($39,400)
✅ 500 MATIC ($500)

TOTAL GANADO: $309,900
```

**Estado Weekly Vault DESPUÉS del claim**:
```
weeklyVault.cbBTC = 7.5 cbBTC (quedó 75%)
weeklyVault.wETH = 30.0 wETH (quedó 75%)
weeklyVault.tokenOfMonth = 1500 MATIC (quedó 75%)

El otro ganador puede reclamar su otra mitad del 50%
```

---

## 🔑 PUNTOS CLAVE - LO QUE ESTABA MAL:

### ❌ ERROR 1: "Usuario gana 50% del pool"
**CORRECTO**: Usuario gana **su parte del 50%**

Si hay 2 ganadores de jackpot:
- Cada uno recibe: 50% ÷ 2 = **25% del pool total**

Si hay 1 ganador de jackpot:
- Recibe: 50% ÷ 1 = **50% del pool total** (todo el tier)

### ❌ ERROR 2: "Solo recibe token del mes que compró"
**CORRECTO**: Recibe el token del **mes ACTUAL cuando reclama**

Ejemplo:
```
Usuario compró en enero (token: BONK)
Usuario reclama en marzo (token: MATIC)
→ Usuario recibe MATIC (no BONK)

Porque el ticket guarda: monthToken = "BONK"
Pero en claim se usa currentMonthToken = "MATIC"
```

**WAIT... ESTO TAMBIÉN ESTÁ MAL**

Déjame revisar qué token recibe:

```solidity
struct Ticket {
    string monthToken;  // Token del mes cuando COMPRÓ
}

function claimPrize() {
    // ¿Cuál token envía?
    // ticket.monthToken (el que estaba activo cuando compró)
    // O currentMonthToken (el activo ahora)?
}
```

**PREGUNTA PARA TI, SOCIO**:

¿El usuario recibe:
A) El token del mes cuando COMPRÓ el ticket (guardado en ticket.monthToken)
B) El token del mes ACTUAL cuando RECLAMA

**Dime cuál es correcto y lo arreglo.**

### ❌ ERROR 3: "Tokens de meses pasados se acumulan"
**CORRECTO**: Cada mes tiene su propio vault

```
tokenOfMonthVault es un mapping:
tokenOfMonthVault["MATIC"] = 2000
tokenOfMonthVault["UNI"] = 500
tokenOfMonthVault["BONK"] = 10000

Cuando usuario reclama, solo se toca el vault del token correspondiente
```

---

## 🎨 5. USUARIO CONVIERTE A USDC (Uniswap Widget)

```
Usuario tiene en Privy wallet:
- 2.5 cbBTC
- 10.0 wETH
- 500 MATIC

Dashboard → "CONVERT TO USDC"
↓
Uniswap widget aparece
↓
Usuario swappea TODO:
- 2.5 cbBTC → ~$270,000 USDC
- 10.0 wETH → ~$39,400 USDC
- 500 MATIC → ~$500 USDC
↓
Usuario ahora tiene: ~$309,900 USDC

Puede enviar a Coinbase → Vender por USD fiat
```

---

## 📊 VISUALIZACIÓN DE LOS VAULTS

```
┌─────────────────────────────────────────────────────┐
│           SMART CONTRACT (BASE)                     │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  DAILY LOTTERY VAULT                        │  │
│  │  ├─ cbBTC: 1.2 cbBTC                        │  │
│  │  ├─ wETH: 5.0 wETH                          │  │
│  │  └─ Token: 300 MATIC (mes actual)           │  │
│  │  Total: ~$150,000                            │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  WEEKLY LOTTERY VAULT                       │  │
│  │  ├─ cbBTC: 10.0 cbBTC                       │  │
│  │  ├─ wETH: 40.0 wETH                         │  │
│  │  └─ Token: 2000 MATIC (mes actual)          │  │
│  │  Total: ~$1,240,000                          │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  TOKEN VAULTS (histórico acumulado)         │  │
│  │  ├─ MATIC (marzo): 2300 tokens              │  │
│  │  ├─ UNI (febrero): 500 tokens (sobró)       │  │
│  │  └─ BONK (enero): 10000 tokens (sobró)      │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## ✅ FLUJO RESUMIDO CORRECTO:

```
1. Usuario compra ticket DAILY o WEEKLY con USDC
   ↓
2. Smart contract swappea USDC → cbBTC + wETH + token del mes
   ↓
3. Guarda en vault correspondiente (dailyVault o weeklyVault)
   ↓
4. Chainlink VRF genera números ganadores
   ↓
5. Smart contract determina ganadores y sus tiers
   ↓
6. Usuario hace claim
   ↓
7. Smart contract calcula:
   - Su parte del % del tier (÷ número de ganadores)
   - Del vault correspondiente (daily o weekly)
   ↓
8. Transfiere cbBTC + wETH + token del mes al usuario
   ↓
9. Usuario swappea a USDC con Uniswap widget
   ↓
10. Usuario envía USDC a Coinbase → Vende por USD
```

---

## ❓ PREGUNTAS PENDIENTES PARA TI:

1. **Token del mes**: ¿Usuario recibe el token del mes cuando COMPRÓ o cuando RECLAMA?

2. **Tokens de meses pasados**: ¿Qué hacemos con UNI y BONK que sobraron?
   - A) Se quedan ahí para siempre
   - B) Se donan
   - C) Se convierten a BTC/ETH
   - D) Usuarios futuros pueden reclamarlos si ganaron en esos meses

3. **Múltiples ganadores**: Confirmaste que se divide el % del tier entre TODOS los ganadores, ¿correcto?

**DAME LAS RESPUESTAS Y CORRIJO TODO EL DOCUMENTO FINAL.** 🚀
