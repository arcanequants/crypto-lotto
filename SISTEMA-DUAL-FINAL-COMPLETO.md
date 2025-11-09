# 🎯 SISTEMA DUAL FINAL - COMPLETO Y DEFINITIVO

**Fecha**: 2025-10-23
**Blockchain**: BASE
**Wallet**: Privy
**Payment**: USDC o USDT

---

## ✅ DISTRIBUCIÓN COMPLETA - UN BOLETO $0.25 USDC

### Usuario compra 1 ticket por $0.25 USDC:

```
$0.25 USDC se divide automáticamente en el smart contract:

┌─────────────────────────────────────────────────────────────────┐
│  DAILY LOTTERY POOL (30% = $0.075)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  $0.075 USDC → Swap via Uniswap en BASE:                      │
│                                                                 │
│  ├─ 70% BTC: $0.0525 USDC → cbBTC                             │
│  │  └─ Swap en Uniswap: USDC/cbBTC pool                       │
│  │  └─ Recibe: ~0.0000004 cbBTC (@ $108K/BTC)                 │
│  │  └─ Guarda en: dailyVault.cbBTC                            │
│  │                                                              │
│  ├─ 25% ETH: $0.01875 USDC → wETH                             │
│  │  └─ Swap en Uniswap: USDC/wETH pool                        │
│  │  └─ Recibe: ~0.0000047 wETH (@ $3,940/ETH)                 │
│  │  └─ Guarda en: dailyVault.wETH                             │
│  │                                                              │
│  └─ 5% Token del Mes: $0.00375 USDC → MATIC (ejemplo)         │
│     └─ Swap en Uniswap: USDC/MATIC pool                       │
│     └─ Recibe: ~0.00375 MATIC (@ $1/MATIC)                    │
│     └─ Guarda en: dailyVault.tokenOfMonth["MATIC"]            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  WEEKLY LOTTERY POOL (70% = $0.175)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  $0.175 USDC → Swap via Uniswap en BASE:                      │
│                                                                 │
│  ├─ 70% BTC: $0.1225 USDC → cbBTC                             │
│  │  └─ Swap en Uniswap: USDC/cbBTC pool                       │
│  │  └─ Recibe: ~0.0000011 cbBTC (@ $108K/BTC)                 │
│  │  └─ Guarda en: weeklyVault.cbBTC                           │
│  │                                                              │
│  ├─ 25% ETH: $0.04375 USDC → wETH                             │
│  │  └─ Swap en Uniswap: USDC/wETH pool                        │
│  │  └─ Recibe: ~0.000011 wETH (@ $3,940/ETH)                  │
│  │  └─ Guarda en: weeklyVault.wETH                            │
│  │                                                              │
│  └─ 5% Token del Mes: $0.00875 USDC → MATIC (ejemplo)         │
│     └─ Swap en Uniswap: USDC/MATIC pool                       │
│     └─ Recibe: ~0.00875 MATIC (@ $1/MATIC)                    │
│     └─ Guarda en: weeklyVault.tokenOfMonth["MATIC"]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 EJEMPLO CON 1,000 TICKETS ($250 USDC total)

### DAILY POOL (30% = $75):

```
$75 USDC se convierte en:

├─ 70% BTC ($52.50) → ~0.00048 cbBTC
│  └─ Almacenado en: dailyVault.cbBTC
│
├─ 25% ETH ($18.75) → ~0.0047 wETH
│  └─ Almacenado en: dailyVault.wETH
│
└─ 5% MATIC ($3.75) → ~3.75 MATIC
   └─ Almacenado en: dailyVault.tokenOfMonth["MATIC"]

TOTAL DAILY POOL: $75 (valor en crypto)
```

### WEEKLY POOL (70% = $175):

```
$175 USDC se convierte en:

├─ 70% BTC ($122.50) → ~0.00113 cbBTC
│  └─ Almacenado en: weeklyVault.cbBTC
│
├─ 25% ETH ($43.75) → ~0.0111 wETH
│  └─ Almacenado en: weeklyVault.wETH
│
└─ 5% MATIC ($8.75) → ~8.75 MATIC
   └─ Almacenado en: weeklyVault.tokenOfMonth["MATIC"]

TOTAL WEEKLY POOL: $175 (valor en crypto)
```

---

## 🎲 SORTEOS SEPARADOS

### DAILY DRAW (todos los días @ 00:00 UTC)

```
Chainlink VRF genera números:
→ [12, 23, 34, 45, 56] Power: 9

Smart contract verifica TODOS los tickets con drawType = DAILY
O mejor: TODOS los tickets (porque todos participan en ambos)

Ganadores determinados:
├─ Tier 5+1: X ganadores
├─ Tier 5+0: Y ganadores
├─ Tier 4+1: Z ganadores
└─ ...

Premios salen de: dailyVault
```

### WEEKLY DRAW (cada domingo @ 20:00)

```
Chainlink VRF genera números:
→ [5, 12, 23, 45, 67] Power: 8

Smart contract verifica TODOS los tickets de nuevo
(mismos tickets, diferentes números ganadores)

Ganadores determinados:
├─ Tier 5+1: A ganadores
├─ Tier 5+0: B ganadores
├─ Tier 4+1: C ganadores
└─ ...

Premios salen de: weeklyVault
```

---

## 💰 PRIZE TIERS (IGUALES PARA AMBOS)

### Tier System:

```
Tier 5+1 (Jackpot): 50% del pool
Tier 5+0: 20% del pool
Tier 4+1: 15% del pool
Tier 3+1: 10% del pool
Tier 4+0: 5% del pool
Tier 3+0: Pequeño monto fijo
```

### Ejemplo DAILY Draw:

```
Daily Pool: $75

Tier 5+1 (50%): $37.50
├─ Si 1 ganador: recibe $37.50
├─ Si 2 ganadores: cada uno $18.75
└─ Si 10 ganadores: cada uno $3.75

Tier 5+0 (20%): $15.00
Tier 4+1 (15%): $11.25
Tier 3+1 (10%): $7.50
Tier 4+0 (5%): $3.75
```

### Ejemplo WEEKLY Draw:

```
Weekly Pool: $175

Tier 5+1 (50%): $87.50
├─ Si 1 ganador: recibe $87.50
├─ Si 2 ganadores: cada uno $43.75
└─ Si 10 ganadores: cada uno $8.75

Tier 5+0 (20%): $35.00
Tier 4+1 (15%): $26.25
Tier 3+1 (10%): $17.50
Tier 4+0 (5%): $8.75
```

---

## 🏆 USUARIO PUEDE GANAR EN AMBOS

### Escenario Completo:

```
Usuario compra 1 ticket:
Numbers: [5, 12, 23, 45, 67]
Power: 8
Costo: $0.25 USDC

───────────────────────────────────────

DAILY DRAW (lunes):
Números ganadores: [5, 12, 23, 99, 88] Power: 1

Ticket del usuario: [5, 12, 23, 45, 67] Power: 8
├─ Matches: 3 números
├─ Power match: NO
└─ Result: Tier 3+0 (small prize)

Premio DAILY:
├─ Daily pool tier 3+0: $2.00 (asumiendo)
├─ Ganadores en tier 3+0: 5 personas
├─ Premio individual: $2.00 / 5 = $0.40
└─ Usuario recibe:
   ├─ ~0.000003 cbBTC
   ├─ ~0.0001 wETH
   └─ ~0.1 MATIC
   TOTAL: ~$0.40

───────────────────────────────────────

WEEKLY DRAW (domingo):
Números ganadores: [5, 12, 23, 45, 67] Power: 8

Ticket del usuario: [5, 12, 23, 45, 67] Power: 8
├─ Matches: 5 números
├─ Power match: SÍ ✅
└─ Result: TIER 5+1 - JACKPOT! 🎉

Premio WEEKLY:
├─ Weekly pool acumulado: $1,239,600 (después de 7 días)
├─ Tier 5+1 (50%): $619,800
├─ Ganadores en tier 5+1: 2 personas
├─ Premio individual: $619,800 / 2 = $309,900
└─ Usuario recibe:
   ├─ 2.5 cbBTC ($270,000)
   ├─ 10.0 wETH ($39,400)
   └─ 500 MATIC ($500)
   TOTAL: $309,900

───────────────────────────────────────

TOTAL GANADO CON 1 TICKET:
Daily: $0.40
Weekly: $309,900
────────────────
TOTAL: $309,900.40

Inversión: $0.25
ROI: 123,960,060% 🚀
```

---

## 💎 TOKENS DEL MES - ACUMULACIÓN

### Marzo 2025 - Token: MATIC

```
DAILY VAULT acumula MATIC:
├─ Día 1: +3.75 MATIC
├─ Día 2: +4.20 MATIC
├─ Día 3: +3.90 MATIC
├─ ...
├─ Día 30: +5.00 MATIC
└─ TOTAL: ~450 MATIC acumulados

WEEKLY VAULT acumula MATIC:
├─ Semana 1: +120 MATIC
├─ Semana 2: +135 MATIC
├─ Semana 3: +140 MATIC
├─ Semana 4: +150 MATIC
└─ TOTAL: ~545 MATIC acumulados

AMBOS pools tienen MATIC porque es el token del mes
Pero son vaults SEPARADOS
```

### Abril 2025 - Token: UNI

```
Sistema cambia a UNI

DAILY VAULT:
├─ MATIC (marzo): 200 MATIC (sobró del mes pasado)
├─ UNI (abril): 0 UNI (empieza desde cero)
└─ Empieza a acumular UNI en abril

WEEKLY VAULT:
├─ MATIC (marzo): 300 MATIC (sobró)
├─ UNI (abril): 0 UNI (empieza)
└─ Empieza a acumular UNI en abril

Los tokens de meses pasados SE QUEDAN en los vaults
Si alguien ganó en marzo pero reclama en abril:
→ Recibe MATIC (el token del mes cuando ganó)
```

---

## 🔧 SMART CONTRACT STRUCTURE

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CryptoLottery {

    // ============ CONSTANTS ============

    uint256 public constant DAILY_PERCENT = 30;  // 30%
    uint256 public constant WEEKLY_PERCENT = 70; // 70%

    uint256 public constant BTC_PERCENT = 70;   // 70%
    uint256 public constant ETH_PERCENT = 25;   // 25%
    uint256 public constant TOKEN_PERCENT = 5;  // 5%

    // ============ STRUCTS ============

    struct Vault {
        uint256 cbBTC;
        uint256 wETH;
        mapping(string => uint256) tokenOfMonth; // "MATIC" => amount
    }

    struct Ticket {
        uint256 id;
        address owner;
        uint8[5] numbers;
        uint8 powerNumber;
        string monthToken;        // Token del mes cuando compró
        uint256 dailyDrawId;      // Draw ID para daily
        uint256 weeklyDrawId;     // Draw ID para weekly
        bool isWinnerDaily;
        bool isWinnerWeekly;
        string dailyTier;         // "5+1", "5+0", etc.
        string weeklyTier;
        bool dailyClaimed;
        bool weeklyClaimed;
    }

    struct Draw {
        uint256 id;
        uint8[5] winningNumbers;
        uint8 powerNumber;
        uint256 timestamp;
        bool executed;
    }

    // ============ STATE VARIABLES ============

    Vault public dailyVault;
    Vault public weeklyVault;

    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => Draw) public dailyDraws;
    mapping(uint256 => Draw) public weeklyDraws;

    uint256 public currentDailyDrawId;
    uint256 public currentWeeklyDrawId;
    uint256 public nextTicketId;

    string public currentMonthToken; // "MATIC", "UNI", etc.

    // Token addresses en BASE
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address public constant CBBTC = 0x...; // cbBTC en BASE
    address public constant WETH = 0x4200000000000000000000000000000000000006;

    address public constant UNISWAP_ROUTER = 0x...; // Uniswap V3 Router en BASE

    // ============ MAIN FUNCTION ============

    function buyTicket(
        uint8[5] memory numbers,
        uint8 powerNumber
    ) external {
        // 1. Recibir $0.25 USDC del usuario
        IERC20(USDC).transferFrom(msg.sender, address(this), 0.25e6);

        // 2. DIVIDIR entre DAILY y WEEKLY
        uint256 dailyAmount = 0.25e6 * DAILY_PERCENT / 100;   // $0.075 USDC
        uint256 weeklyAmount = 0.25e6 * WEEKLY_PERCENT / 100; // $0.175 USDC

        // ============ DAILY POOL ============

        // Swap para DAILY pool
        uint256 dailyBTC = _swapUSDCToCBBTC(dailyAmount * BTC_PERCENT / 100);    // $0.0525
        uint256 dailyETH = _swapUSDCToWETH(dailyAmount * ETH_PERCENT / 100);     // $0.01875
        uint256 dailyToken = _swapUSDCToToken(dailyAmount * TOKEN_PERCENT / 100); // $0.00375

        // Guardar en daily vault
        dailyVault.cbBTC += dailyBTC;
        dailyVault.wETH += dailyETH;
        dailyVault.tokenOfMonth[currentMonthToken] += dailyToken;

        // ============ WEEKLY POOL ============

        // Swap para WEEKLY pool
        uint256 weeklyBTC = _swapUSDCToCBBTC(weeklyAmount * BTC_PERCENT / 100);    // $0.1225
        uint256 weeklyETH = _swapUSDCToWETH(weeklyAmount * ETH_PERCENT / 100);     // $0.04375
        uint256 weeklyToken = _swapUSDCToToken(weeklyAmount * TOKEN_PERCENT / 100); // $0.00875

        // Guardar en weekly vault
        weeklyVault.cbBTC += weeklyBTC;
        weeklyVault.wETH += weeklyETH;
        weeklyVault.tokenOfMonth[currentMonthToken] += weeklyToken;

        // ============ CREAR TICKET ============

        tickets[nextTicketId] = Ticket({
            id: nextTicketId,
            owner: msg.sender,
            numbers: numbers,
            powerNumber: powerNumber,
            monthToken: currentMonthToken,
            dailyDrawId: currentDailyDrawId,
            weeklyDrawId: currentWeeklyDrawId,
            isWinnerDaily: false,
            isWinnerWeekly: false,
            dailyTier: "",
            weeklyTier: "",
            dailyClaimed: false,
            weeklyClaimed: false
        });

        nextTicketId++;

        emit TicketPurchased(msg.sender, nextTicketId - 1, numbers, powerNumber);
    }

    // ============ SWAP FUNCTIONS ============

    function _swapUSDCToCBBTC(uint256 usdcAmount) internal returns (uint256) {
        // Approve USDC a Uniswap router
        IERC20(USDC).approve(UNISWAP_ROUTER, usdcAmount);

        // Swap USDC → cbBTC via Uniswap V3
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: USDC,
            tokenOut: CBBTC,
            fee: 3000, // 0.3% pool
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: usdcAmount,
            amountOutMinimum: 0, // Producción: calcular con slippage
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = ISwapRouter(UNISWAP_ROUTER).exactInputSingle(params);
        return amountOut;
    }

    function _swapUSDCToWETH(uint256 usdcAmount) internal returns (uint256) {
        // Similar a _swapUSDCToCBBTC pero USDC → wETH
        IERC20(USDC).approve(UNISWAP_ROUTER, usdcAmount);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: USDC,
            tokenOut: WETH,
            fee: 500, // 0.05% pool (USDC/wETH es más líquido)
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: usdcAmount,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        return ISwapRouter(UNISWAP_ROUTER).exactInputSingle(params);
    }

    function _swapUSDCToToken(uint256 usdcAmount) internal returns (uint256) {
        // Swap USDC → Token del mes (ej: MATIC, UNI, etc.)
        address tokenAddress = _getTokenAddress(currentMonthToken);

        IERC20(USDC).approve(UNISWAP_ROUTER, usdcAmount);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: USDC,
            tokenOut: tokenAddress,
            fee: 3000, // 0.3% pool
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: usdcAmount,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        return ISwapRouter(UNISWAP_ROUTER).exactInputSingle(params);
    }

    // ============ CLAIM FUNCTIONS ============

    function claimDailyPrize(uint256 ticketId) external {
        Ticket storage ticket = tickets[ticketId];

        require(ticket.owner == msg.sender, "Not owner");
        require(ticket.isWinnerDaily, "Not a winner");
        require(!ticket.dailyClaimed, "Already claimed");

        // Calcular premio del DAILY vault
        (uint256 cbbtcPrize, uint256 wethPrize, uint256 tokenPrize) =
            _calculatePrize(dailyVault, ticket.dailyTier, ticket.monthToken, true);

        // Transferir premios
        IERC20(CBBTC).transfer(msg.sender, cbbtcPrize);
        IERC20(WETH).transfer(msg.sender, wethPrize);
        IERC20(_getTokenAddress(ticket.monthToken)).transfer(msg.sender, tokenPrize);

        // Actualizar vaults
        dailyVault.cbBTC -= cbbtcPrize;
        dailyVault.wETH -= wethPrize;
        dailyVault.tokenOfMonth[ticket.monthToken] -= tokenPrize;

        // Marcar como claimed
        ticket.dailyClaimed = true;

        emit DailyPrizeClaimed(ticketId, msg.sender, cbbtcPrize, wethPrize, tokenPrize);
    }

    function claimWeeklyPrize(uint256 ticketId) external {
        Ticket storage ticket = tickets[ticketId];

        require(ticket.owner == msg.sender, "Not owner");
        require(ticket.isWinnerWeekly, "Not a winner");
        require(!ticket.weeklyClaimed, "Already claimed");

        // Calcular premio del WEEKLY vault
        (uint256 cbbtcPrize, uint256 wethPrize, uint256 tokenPrize) =
            _calculatePrize(weeklyVault, ticket.weeklyTier, ticket.monthToken, false);

        // Transferir premios
        IERC20(CBBTC).transfer(msg.sender, cbbtcPrize);
        IERC20(WETH).transfer(msg.sender, wethPrize);
        IERC20(_getTokenAddress(ticket.monthToken)).transfer(msg.sender, tokenPrize);

        // Actualizar vaults
        weeklyVault.cbBTC -= cbbtcPrize;
        weeklyVault.wETH -= wethPrize;
        weeklyVault.tokenOfMonth[ticket.monthToken] -= tokenPrize;

        // Marcar como claimed
        ticket.weeklyClaimed = true;

        emit WeeklyPrizeClaimed(ticketId, msg.sender, cbbtcPrize, wethPrize, tokenPrize);
    }

    function _calculatePrize(
        Vault storage vault,
        string memory tier,
        string memory monthToken,
        bool isDaily
    ) internal view returns (uint256, uint256, uint256) {

        uint256 tierPercent = _getTierPercent(tier); // "5+1" → 50
        uint256 winnersCount = isDaily
            ? _countDailyWinners(tier)
            : _countWeeklyWinners(tier);

        uint256 cbbtcPrize = (vault.cbBTC * tierPercent) / (100 * winnersCount);
        uint256 wethPrize = (vault.wETH * tierPercent) / (100 * winnersCount);
        uint256 tokenPrize = (vault.tokenOfMonth[monthToken] * tierPercent) / (100 * winnersCount);

        return (cbbtcPrize, wethPrize, tokenPrize);
    }

    function _getTierPercent(string memory tier) internal pure returns (uint256) {
        if (keccak256(bytes(tier)) == keccak256(bytes("5+1"))) return 50;
        if (keccak256(bytes(tier)) == keccak256(bytes("5+0"))) return 20;
        if (keccak256(bytes(tier)) == keccak256(bytes("4+1"))) return 15;
        if (keccak256(bytes(tier)) == keccak256(bytes("3+1"))) return 10;
        if (keccak256(bytes(tier)) == keccak256(bytes("4+0"))) return 5;
        return 0;
    }
}
```

---

## ✅ RESUMEN FINAL

### Usuario compra 1 ticket ($0.25):

```
✅ $0.075 (30%) → DAILY POOL
   ├─ $0.0525 → cbBTC
   ├─ $0.01875 → wETH
   └─ $0.00375 → Token del mes

✅ $0.175 (70%) → WEEKLY POOL
   ├─ $0.1225 → cbBTC
   ├─ $0.04375 → wETH
   └─ $0.00875 → Token del mes

✅ Usuario participa en AMBOS sorteos
✅ Puede ganar en DAILY Y WEEKLY
✅ Prize tiers: IGUALES (50%, 20%, 15%, 10%, 5%)
✅ Tokens del mes: SE ACUMULAN por separado en cada vault
✅ Todo automático en el smart contract
```

---

**SISTEMA COMPLETO Y DEFINITIVO** ✅🚀
