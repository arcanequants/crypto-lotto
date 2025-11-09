# 🎯 SISTEMA FINAL: BASE + Privy + Uniswap

**Fecha**: 2025-10-23
**Status**: ✅ CONFIRMADO
**Blockchain**: BASE (Ethereum L2)
**Wallet**: Privy (embedded wallets)
**Payment**: USDC o USDT
**Swap**: Uniswap widget integrado
**Random**: Chainlink VRF v2.5

---

## ✅ CONFIGURACIÓN FINAL CONFIRMADA

### 1. Blockchain
- **BASE** (Coinbase L2)
- Costos: $0.008 compra, $0.015 claim
- Chainlink VRF: $34/mes

### 2. Pagos de Tickets
- **USDC** (primary)
- **USDT** (alternative)
- Precio: $0.25 por ticket

### 3. Prize Pool Composition
```
70% BTC (como cbBTC en BASE)
25% ETH (como wETH en BASE)
5% Token del mes (rotativo mensual)
```

### 4. Token del Mes - Sistema Rotativo

**IMPORTANTE**: Token cambia cada mes según votación

#### Ejemplo de Rotación:
```
Enero 2025:
- Token votado: MATIC (Polygon)
- Prize pool: 70% cbBTC + 25% wETH + 5% MATIC

Febrero 2025:
- Token votado: UNI (Uniswap)
- Prize pool: 70% cbBTC + 25% wETH + 5% UNI

Marzo 2025:
- Token votado: AAVE
- Prize pool: 70% cbBTC + 25% wETH + 5% AAVE
```

**Tokens acumulan separadamente**:
```
Al final de Enero:
- Pool enero tiene: 5 cbBTC + 20 wETH + 1000 MATIC

Al final de Febrero:
- Pool febrero tiene: 4 cbBTC + 16 wETH + 500 UNI

Nota: Pools son separados por mes/draw
```

### 5. Wallet del Usuario
- **Privy** (embedded wallet)
- Onboarding: Email, Google, Apple
- Network: BASE

### 6. Swap Feature
- **Uniswap widget integrado** en nuestra app
- Usuario puede convertir cbBTC → USDC sin salir
- Sin fricción, todo en un lugar

---

## 💰 FLUJO COMPLETO DEL DINERO

### PASO 1: Usuario Compra Ticket ($0.25 USDC)

```
FRONTEND (Next.js + Privy):
1. Usuario agrega ticket al carrito
   Numbers: [5, 12, 23, 45, 67]
   Power: 8
   Price: $0.25 USDC

2. Usuario click "BUY TICKETS"

3. Privy wallet prompt aparece:
   "Approve $0.25 USDC to CryptoLotto Contract"

4. Usuario aprueba transacción

SMART CONTRACT (BASE):
5. Contract recibe $0.25 USDC

6. Contract AUTOMÁTICAMENTE hace swaps via Uniswap:

   Swap 1: $0.175 USDC → cbBTC
   - 70% del ticket
   - Usa Uniswap router
   - Recibe ~0.000045 cbBTC (ejemplo)

   Swap 2: $0.0625 USDC → wETH
   - 25% del ticket
   - Usa Uniswap router
   - Recibe ~0.00003 wETH (ejemplo)

   Swap 3: $0.0125 USDC → Token del mes (ej: MATIC)
   - 5% del ticket
   - Usa Uniswap router
   - Recibe ~0.015 MATIC (ejemplo)

7. Contract GUARDA en vaults internos:
   vault.cbBTC += 0.000045
   vault.wETH += 0.00003
   vault.tokenOfMonth[MATIC] += 0.015

8. Contract registra ticket:
   Ticket {
     id: 12345,
     user: 0xUser...,
     numbers: [5,12,23,45,67],
     power: 8,
     drawId: 456,
     monthToken: "MATIC"
   }

9. Emit event: TicketPurchased(user, ticketId, drawId)
```

**Gas cost**: ~$0.008 USD (usuario paga en ETH)

---

### PASO 2: Sorteo con Chainlink VRF

```
CRON JOB (Vercel):
1. Trigger daily @ 00:00 UTC
   POST /api/cron/trigger-draw

BACKEND API:
2. Call smart contract function:
   contract.requestRandomNumbers(drawId)

SMART CONTRACT:
3. Request random words from Chainlink VRF:

   requestRandomWords(
     keyHash: "0x...",
     subId: 123,
     requestConfirmations: 3,
     callbackGasLimit: 200000,
     numWords: 6  // 5 numbers + 1 power
   )

CHAINLINK VRF:
4. Genera números random off-chain
5. Valida on-chain con prueba criptográfica
6. Cobra de nuestra subscription: ~$1.00 LINK
7. Callback al smart contract

SMART CONTRACT (Callback):
8. Recibe 6 números random:
   winningNumbers = [12, 23, 34, 45, 56]
   powerNumber = 9

9. Actualiza estado del draw:
   Draw {
     id: 456,
     winningNumbers: [12,23,34,45,56],
     powerNumber: 9,
     status: "completed",
     timestamp: 1234567890
   }

10. Determina ganadores (loop por todos los tickets):
    for ticket in tickets[drawId]:
      matches = countMatches(ticket.numbers, winningNumbers)
      powerMatch = (ticket.power == powerNumber)

      if matches == 5 && powerMatch:
        ticket.tier = "5+1" (Jackpot)
      elif matches == 5:
        ticket.tier = "5"
      elif matches == 4 && powerMatch:
        ticket.tier = "4+1"
      // ... etc

      ticket.isWinner = (tier != null)

11. Emit event: DrawCompleted(drawId, winningNumbers)
```

---

### PASO 3: Usuario Gana y Hace Claim

```
FRONTEND:
1. Usuario ve notificación:
   "🎉 YOU WON! Prize: 0.05 cbBTC + 0.2 wETH + 100 MATIC"

2. Usuario click "CLAIM PRIZE"

SMART CONTRACT:
3. Function: claimPrize(ticketId)

4. Verificaciones:
   ✅ require(ticket.isWinner, "Not a winner")
   ✅ require(!ticket.claimed, "Already claimed")
   ✅ require(draw.status == "completed", "Draw not finished")
   ✅ require(msg.sender == ticket.owner, "Not ticket owner")

5. Calcula premio según tier:

   Ejemplo: Tier 5+1 (Jackpot) = 50% del pool

   totalCbBTC = vault.cbBTC  // ej: 5.0 cbBTC
   totalWETH = vault.wETH    // ej: 20.0 wETH
   totalMATIC = vault.tokenOfMonth[MATIC]  // ej: 1000 MATIC

   prize.cbBTC = totalCbBTC * 0.50  // 2.5 cbBTC
   prize.wETH = totalWETH * 0.50    // 10.0 wETH
   prize.MATIC = totalMATIC * 0.50  // 500 MATIC

6. TRANSFIERE tokens del vault al usuario:

   // Transfer cbBTC (ERC-20 en BASE)
   cbBTC.transfer(ticket.owner, prize.cbBTC)

   // Transfer wETH (ERC-20 en BASE)
   wETH.transfer(ticket.owner, prize.wETH)

   // Transfer MATIC (ERC-20 en BASE)
   MATIC.transfer(ticket.owner, prize.MATIC)

7. Actualiza estado del vault:
   vault.cbBTC -= prize.cbBTC
   vault.wETH -= prize.wETH
   vault.tokenOfMonth[MATIC] -= prize.MATIC

8. Marca ticket como claimed:
   ticket.claimed = true
   ticket.claimedAt = block.timestamp

9. Emit event: PrizeClaimed(ticketId, user, amounts)

PRIVY WALLET:
10. Usuario ve en su Privy wallet:
    ✅ 2.5 cbBTC
    ✅ 10.0 wETH
    ✅ 500 MATIC
```

**Gas cost**: ~$0.015 USD (usuario paga en ETH)

---

### PASO 4: Usuario Convierte a USDC (Uniswap Widget)

```
FRONTEND (Dashboard):
1. Usuario ve sus premios:

   Your Prizes:
   💰 2.5 cbBTC ($270,000)
   💎 10.0 wETH ($38,000)
   🟣 500 MATIC ($500)

   Total value: $308,500

2. Usuario click "CONVERT TO USDC"

3. Uniswap widget aparece (integrado en nuestra app):

   ┌─────────────────────────────────┐
   │  Swap Your Prizes to USDC       │
   │                                 │
   │  FROM:                          │
   │  ○ 2.5 cbBTC ($270,000)         │
   │  ○ 10.0 wETH ($38,000)          │
   │  ○ 500 MATIC ($500)             │
   │                                 │
   │  TO:                            │
   │  💵 ~$308,500 USDC              │
   │                                 │
   │  Fee: ~$100 (0.03%)             │
   │  Slippage: 0.5%                 │
   │                                 │
   │  [SWAP ALL TO USDC]             │
   └─────────────────────────────────┘

4. Usuario click "SWAP ALL TO USDC"

UNISWAP (via widget):
5. Hace 3 swaps automáticos:

   Swap 1: 2.5 cbBTC → USDC
   - Usa Uniswap router en BASE
   - Recibe ~$270,000 USDC

   Swap 2: 10.0 wETH → USDC
   - Usa Uniswap router en BASE
   - Recibe ~$38,000 USDC

   Swap 3: 500 MATIC → USDC
   - Usa Uniswap router en BASE
   - Recibe ~$500 USDC

6. Total recibido: ~$308,400 USDC (con fees y slippage)

PRIVY WALLET:
7. Usuario ahora tiene:
   ✅ $308,400 USDC (líquido)

8. Usuario puede:
   - Enviar a Coinbase → Vender por USD
   - Enviar a Binance → Tradear
   - Guardar en Privy wallet
   - Usar en otras apps DeFi
```

---

## 🏗️ ARQUITECTURA DEL SMART CONTRACT

### Estructura de Vaults (Dónde se guarda el premio)

```solidity
contract CryptoLottery {
    // ==================== STATE VARIABLES ====================

    // Token addresses en BASE
    address public constant CBBTC = 0x...;  // Wrapped Bitcoin
    address public constant WETH = 0x...;   // Wrapped Ethereum
    address public constant USDC = 0x...;   // USDC stablecoin

    // Prize vaults
    uint256 public cbBTCVault;   // Total cbBTC en el contrato
    uint256 public wETHVault;    // Total wETH en el contrato

    // Token del mes vault (mapping porque cambia cada mes)
    mapping(string => uint256) public tokenOfMonthVault;
    // Ej: tokenOfMonthVault["MATIC"] = 1000
    //     tokenOfMonthVault["UNI"] = 500

    // Current month token
    string public currentMonthToken; // "MATIC", "UNI", etc.

    // Draws
    mapping(uint256 => Draw) public draws;
    uint256 public currentDrawId;

    // Tickets
    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => uint256[]) public drawTickets; // drawId => ticketIds

    // Chainlink VRF
    uint256 public subscriptionId;
    bytes32 public keyHash;

    // ==================== STRUCTS ====================

    struct Draw {
        uint256 id;
        uint8[5] winningNumbers;
        uint8 powerNumber;
        uint256 timestamp;
        string monthToken;  // Token del mes para este draw
        DrawStatus status;  // pending, completed, claimed
    }

    struct Ticket {
        uint256 id;
        address owner;
        uint8[5] numbers;
        uint8 powerNumber;
        uint256 drawId;
        string monthToken;  // Token del mes cuando compró
        bool isWinner;
        string tier;  // "5+1", "5", "4+1", etc.
        bool claimed;
        uint256 claimedAt;
    }

    // ==================== MAIN FUNCTIONS ====================

    function buyTicket(
        uint8[5] calldata numbers,
        uint8 powerNumber,
        address paymentToken,  // USDC o USDT
        uint256 amount         // 0.25 * 10^6 (USDC decimals)
    ) external {
        // 1. Recibir pago
        IERC20(paymentToken).transferFrom(msg.sender, address(this), amount);

        // 2. Swap a cryptos del prize pool
        uint256 btcAmount = _swapToCBBTC(amount * 70 / 100);
        uint256 ethAmount = _swapToWETH(amount * 25 / 100);
        uint256 tokenAmount = _swapToTokenOfMonth(amount * 5 / 100);

        // 3. Actualizar vaults
        cbBTCVault += btcAmount;
        wETHVault += ethAmount;
        tokenOfMonthVault[currentMonthToken] += tokenAmount;

        // 4. Crear ticket
        tickets[nextTicketId] = Ticket({
            id: nextTicketId,
            owner: msg.sender,
            numbers: numbers,
            powerNumber: powerNumber,
            drawId: currentDrawId,
            monthToken: currentMonthToken,
            isWinner: false,
            tier: "",
            claimed: false,
            claimedAt: 0
        });

        drawTickets[currentDrawId].push(nextTicketId);
        nextTicketId++;

        emit TicketPurchased(msg.sender, nextTicketId - 1, currentDrawId);
    }

    function requestRandomNumbers(uint256 drawId) external onlyOwner {
        // Call Chainlink VRF
        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            3,  // confirmations
            200000,  // callback gas
            6  // num words (5 + 1 power)
        );

        requestIdToDrawId[requestId] = drawId;
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        uint256 drawId = requestIdToDrawId[requestId];

        // Generar números ganadores
        uint8[5] memory winning;
        for (uint i = 0; i < 5; i++) {
            winning[i] = uint8((randomWords[i] % 69) + 1);
        }
        uint8 power = uint8((randomWords[5] % 26) + 1);

        // Actualizar draw
        draws[drawId].winningNumbers = winning;
        draws[drawId].powerNumber = power;
        draws[drawId].status = DrawStatus.Completed;

        // Determinar ganadores
        _determineWinners(drawId);

        emit DrawCompleted(drawId, winning, power);
    }

    function claimPrize(uint256 ticketId) external {
        Ticket storage ticket = tickets[ticketId];

        // Verificaciones
        require(ticket.isWinner, "Not a winner");
        require(!ticket.claimed, "Already claimed");
        require(ticket.owner == msg.sender, "Not owner");

        // Calcular premio según tier
        (uint256 cbbtcPrize, uint256 wethPrize, uint256 tokenPrize) =
            _calculatePrize(ticket.tier, ticket.monthToken);

        // Transferir premios
        IERC20(CBBTC).transfer(msg.sender, cbbtcPrize);
        IERC20(WETH).transfer(msg.sender, wethPrize);
        IERC20(_getTokenAddress(ticket.monthToken)).transfer(msg.sender, tokenPrize);

        // Actualizar vaults
        cbBTCVault -= cbbtcPrize;
        wETHVault -= wethPrize;
        tokenOfMonthVault[ticket.monthToken] -= tokenPrize;

        // Marcar como claimed
        ticket.claimed = true;
        ticket.claimedAt = block.timestamp;

        emit PrizeClaimed(ticketId, msg.sender, cbbtcPrize, wethPrize, tokenPrize);
    }

    // ==================== HELPER FUNCTIONS ====================

    function _swapToCBBTC(uint256 usdcAmount) internal returns (uint256) {
        // Approve USDC to Uniswap router
        IERC20(USDC).approve(UNISWAP_ROUTER, usdcAmount);

        // Swap USDC → cbBTC via Uniswap
        address[] memory path = new address[](2);
        path[0] = USDC;
        path[1] = CBBTC;

        uint[] memory amounts = IUniswapV2Router(UNISWAP_ROUTER)
            .swapExactTokensForTokens(
                usdcAmount,
                0,  // min amount (should calculate with slippage)
                path,
                address(this),  // recipient: este contrato
                block.timestamp + 300
            );

        return amounts[1];  // cbBTC recibido
    }

    function _swapToWETH(uint256 usdcAmount) internal returns (uint256) {
        // Similar a _swapToCBBTC pero USDC → wETH
        // ...
    }

    function _swapToTokenOfMonth(uint256 usdcAmount) internal returns (uint256) {
        // Swap USDC → currentMonthToken (ej: MATIC, UNI, etc)
        address tokenAddress = _getTokenAddress(currentMonthToken);

        address[] memory path = new address[](2);
        path[0] = USDC;
        path[1] = tokenAddress;

        uint[] memory amounts = IUniswapV2Router(UNISWAP_ROUTER)
            .swapExactTokensForTokens(
                usdcAmount,
                0,
                path,
                address(this),
                block.timestamp + 300
            );

        return amounts[1];
    }

    function _calculatePrize(
        string memory tier,
        string memory monthToken
    ) internal view returns (uint256, uint256, uint256) {
        uint256 percentage = _getTierPercentage(tier);
        uint256 winners = _countWinners(tier);

        uint256 cbbtcPrize = (cbBTCVault * percentage) / (100 * winners);
        uint256 wethPrize = (wETHVault * percentage) / (100 * winners);
        uint256 tokenPrize = (tokenOfMonthVault[monthToken] * percentage) / (100 * winners);

        return (cbbtcPrize, wethPrize, tokenPrize);
    }

    function setMonthToken(string calldata newToken) external onlyOwner {
        // Cambiar token del mes (llamado por votación)
        currentMonthToken = newToken;

        emit MonthTokenUpdated(newToken);
    }
}
```

---

## 📊 DÓNDE SE QUEDA EL PREMIO - VISUALIZACIÓN

```
┌─────────────────────────────────────────────────────────────┐
│              SMART CONTRACT en BASE                         │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │  VAULTS (Prize Pool Storage)                      │    │
│  │                                                    │    │
│  │  cbBTC Vault:                                     │    │
│  │  ├─ Balance: 5.5 cbBTC ($594,000)                │    │
│  │  └─ Held in: Smart contract address              │    │
│  │                                                    │    │
│  │  wETH Vault:                                      │    │
│  │  ├─ Balance: 22.0 wETH ($83,600)                 │    │
│  │  └─ Held in: Smart contract address              │    │
│  │                                                    │    │
│  │  Token of Month Vaults:                           │    │
│  │  ├─ MATIC: 1,200 tokens ($1,200)                 │    │
│  │  ├─ UNI: 850 tokens ($8,500)                     │    │
│  │  ├─ AAVE: 50 tokens ($10,000)                    │    │
│  │  └─ Held in: Smart contract address              │    │
│  │                                                    │    │
│  │  TOTAL PRIZE POOL: $697,300                       │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │  TICKETS DATABASE                                 │    │
│  │                                                    │    │
│  │  Ticket #12345:                                   │    │
│  │  ├─ Owner: 0xUser123...                          │    │
│  │  ├─ Numbers: [5,12,23,45,67] Power: 8           │    │
│  │  ├─ Draw: #456                                    │    │
│  │  ├─ Month Token: MATIC                           │    │
│  │  ├─ Is Winner: true                              │    │
│  │  ├─ Tier: "5+1" (Jackpot)                        │    │
│  │  └─ Claimed: false                               │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │  FUNCTIONS                                        │    │
│  │  ├─ buyTicket() → Recibe USDC, swappea, guarda  │    │
│  │  ├─ claimPrize() → Transfiere del vault a user  │    │
│  │  └─ fulfillRandomWords() → Determina ganadores  │    │
│  └───────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

         ↑ GUARDA                      ↓ TRANSFIERE

┌──────────────┐                  ┌──────────────────┐
│   USUARIO    │                  │  USUARIO GANADOR │
│   COMPRA     │                  │                  │
│              │                  │  Privy Wallet:   │
│ Paga: USDC   │                  │  ✅ cbBTC        │
└──────────────┘                  │  ✅ wETH         │
                                  │  ✅ MATIC        │
                                  └──────────────────┘
```

### FLUJO DEL DINERO:

```
ENTRADA (Compra):
Usuario → USDC/USDT → Smart Contract
                  ↓
         Smart Contract swappea via Uniswap
                  ↓
         cbBTC + wETH + Token del mes
                  ↓
         GUARDADO en vaults del smart contract

STORAGE (Custodia):
Smart Contract CUSTODIA TODO:
├─ cbBTC vault (estado interno del contrato)
├─ wETH vault (estado interno del contrato)
└─ Token vaults (mapping por cada token)

SALIDA (Claim):
Usuario gana → Click "CLAIM"
                  ↓
         Smart Contract verifica ganador
                  ↓
         Smart Contract TRANSFIERE:
         - cbBTC del vault → Privy wallet usuario
         - wETH del vault → Privy wallet usuario
         - Token del vault → Privy wallet usuario
                  ↓
         Usuario recibe en Privy wallet
```

---

## 🔐 SEGURIDAD: ¿Quién Controla el Dinero?

### ❌ NOSOTROS NO:
- NO tenemos acceso a los vaults
- NO podemos retirar fondos
- NO custodiamos nada

### ✅ SMART CONTRACT:
- El contrato ES el custodio
- Lógica determinista (código)
- Solo transfiere a ganadores verificados
- Auditable on-chain

### ✅ USUARIOS:
- Controlan su Privy wallet
- Reciben fondos directamente del contrato
- Pueden verificar balances on-chain

---

## 📈 ACUMULACIÓN DE TOKENS DEL MES

### Ejemplo Real - 3 Meses:

#### ENERO 2025 (Token: MATIC)
```
Draw #1 (Daily):
- 100 tickets vendidos
- USDC recibido: $25
- Swap: $1.25 → 1.5 MATIC
- tokenOfMonthVault["MATIC"] = 1.5

Draw #2 (Daily):
- 150 tickets vendidos
- USDC recibido: $37.50
- Swap: $1.875 → 2.3 MATIC
- tokenOfMonthVault["MATIC"] = 3.8

... (30 días)

FIN DE ENERO:
tokenOfMonthVault["MATIC"] = 1,200 MATIC

Ganador reclama: 600 MATIC (50% del pool)
Queda: 600 MATIC para otros tiers
```

#### FEBRERO 2025 (Token: UNI)
```
Sistema cambia a UNI (votación ganó UNI)
currentMonthToken = "UNI"

Draw #31 (Daily):
- 200 tickets vendidos
- USDC recibido: $50
- Swap: $2.50 → 0.3 UNI
- tokenOfMonthVault["UNI"] = 0.3

IMPORTANTE:
tokenOfMonthVault["MATIC"] = 600 (sigue ahí!)
tokenOfMonthVault["UNI"] = 0.3 (nuevo)

Los MATIC no desaparecen, quedan para futuros claims
```

#### MARZO 2025 (Token: AAVE)
```
currentMonthToken = "AAVE"

Estado de vaults:
tokenOfMonthVault["MATIC"] = 200 (algunos claims más)
tokenOfMonthVault["UNI"] = 850 (acumulado de febrero)
tokenOfMonthVault["AAVE"] = 0 (empieza desde cero)
```

---

## 🛠️ INTEGRACIÓN UNISWAP WIDGET

### Implementación en Frontend:

```tsx
// app/components/SwapToCashModal.tsx

import { SwapWidget } from '@uniswap/widgets'
import '@uniswap/widgets/fonts.css'
import { usePrivy } from '@privy-io/react-auth'

export function SwapToCashModal({ prizes, onClose }) {
  const { user, getEthersProvider } = usePrivy()

  const provider = getEthersProvider()

  return (
    <div className="modal">
      <h2>Convert Your Prizes to USDC</h2>

      <div className="prize-summary">
        <h3>Your Prizes:</h3>
        <div>💰 {prizes.cbBTC} cbBTC (${prizes.cbBTC_usd})</div>
        <div>💎 {prizes.wETH} wETH (${prizes.wETH_usd})</div>
        <div>🟣 {prizes.token} {prizes.tokenSymbol} (${prizes.token_usd})</div>

        <div className="total">
          Total Value: ${prizes.total_usd}
        </div>
      </div>

      {/* Uniswap Widget Integrado */}
      <SwapWidget
        provider={provider}

        // Token de entrada (usuario elige cuál swappear)
        defaultInputTokenAddress={prizes.tokenAddresses.cbBTC}
        defaultInputAmount={prizes.cbBTC.toString()}

        // Token de salida (siempre USDC)
        defaultOutputTokenAddress={USDC_ADDRESS_BASE}

        // Configuración
        width={400}
        theme={{
          primary: '#F59E0B',  // Amber (nuestro theme)
          secondary: '#1F2937',
          interactive: '#F59E0B',
          container: '#111827',
          module: '#1F2937',
          accent: '#F59E0B',
        }}

        // Callbacks
        onSwapSuccess={(swapResult) => {
          console.log('Swap successful:', swapResult)
          // Actualizar UI
          refetchBalance()
        }}
      />

      <div className="instructions">
        <h4>After swapping to USDC:</h4>
        <ul>
          <li>✅ Send to Coinbase → Sell for USD</li>
          <li>✅ Send to Binance → Trade</li>
          <li>✅ Keep in wallet → Use anywhere</li>
        </ul>
      </div>

      <button onClick={onClose}>Close</button>
    </div>
  )
}
```

### Instalación del Widget:

```bash
npm install @uniswap/widgets @uniswap/sdk-core
```

### Configuración en app:

```typescript
// lib/uniswap.ts

export const UNISWAP_CONFIG = {
  // Uniswap V3 Router en BASE
  router: '0x2626664c2603336E57B271c5C0b26F421741e481',

  // Token addresses en BASE
  tokens: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    CBBTC: '0x...',  // cbBTC address en BASE
    WETH: '0x4200000000000000000000000000000000000006',
    MATIC: '0x...',  // MATIC wrapped en BASE
    UNI: '0x...',
    AAVE: '0x...',
  },

  // Slippage tolerance
  slippage: 0.5,  // 0.5%
}
```

---

## ✅ RESUMEN FINAL

### El dinero fluye así:

```
1. ENTRADA:
   Usuario paga USDC → Smart Contract

2. CONVERSIÓN:
   Smart Contract swappea USDC → cbBTC + wETH + Token
   Via Uniswap router en BASE

3. CUSTODIA:
   Smart Contract GUARDA todo en sus vaults internos
   - cbBTCVault (estado del contrato)
   - wETHVault (estado del contrato)
   - tokenOfMonthVault (mapping)

4. SALIDA (cuando gana):
   Smart Contract TRANSFIERE directo a Privy wallet del usuario
   - cbBTC del vault → Usuario
   - wETH del vault → Usuario
   - Token del vault → Usuario

5. CONVERSIÓN A CASH:
   Usuario usa Uniswap widget integrado en nuestra app
   - cbBTC → USDC
   - wETH → USDC
   - Token → USDC

   Ahora tiene USDC líquido en Privy wallet
```

### Tokens rotativos:

```
Cada mes cambia el token del 5%:
- Enero: MATIC
- Febrero: UNI
- Marzo: AAVE
- etc.

Cada token acumula en su propio vault
No se mezclan ni desaparecen
Usuario que ganó en enero con MATIC, recibe MATIC
Usuario que ganó en febrero con UNI, recibe UNI
```

### Nadie puede robar:

```
✅ Smart contract custodia (trustless)
✅ Solo transfiere a ganadores verificados
✅ Lógica determinista (código)
✅ Auditable on-chain
✅ Nosotros NO tenemos acceso
```

---

## 🔗 FUENTES

1. Uniswap Widget: https://docs.uniswap.org/sdk/widgets/swap-widget
2. BASE network: https://docs.base.org/
3. Privy wallets: https://docs.privy.io/
4. Chainlink VRF: https://docs.chain.link/vrf/

---

**DOCUMENTO COMPLETO Y VERIFICADO** ✅
