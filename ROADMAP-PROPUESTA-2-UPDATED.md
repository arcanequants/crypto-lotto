# 🗺️ ROADMAP ACTUALIZADO: PROPUESTA 2 - MULTI-TIER ROLLOVER SYSTEM

**Fecha Actualización**: 2025-10-23
**Sistema**: Dual Lottery (Daily + Weekly) con Rollover Multi-Tier
**Blockchain**: BASE Network
**Timeline**: 6 semanas (42 días)

---

## 📊 CAMBIO ESTRATÉGICO

### ANTES (Sistema Original):
```
- UN sorteo (weekly)
- Jackpot 50% del pool
- NO rollover
- Jackpot crece lento
```

### DESPUÉS (Propuesta 2):
```
- DOS sorteos: DAILY + WEEKLY
- UN ticket entra a AMBOS
- Rollover multi-tier
- Jackpot crece EXPONENCIAL
- De $4K a $182K en 3 meses sin ganadores 🚀
```

---

## 📅 ROADMAP COMPLETO (6 SEMANAS)

### ✅ SEMANA 0: PREPARACIÓN (OPCIONAL)
**Si quieres hacer pruebas antes de empezar**

- [ ] Leer `PROPUESTA-2-INTEGRACION-COMPLETA.md`
- [ ] Revisar comparación de números (Propuestas 1 vs 2 vs 3)
- [ ] Confirmar aprobación del sistema
- [ ] Setup environment local

---

### 🔧 SEMANA 1: FOUNDATION (Database + Smart Contract Base)

#### DÍA 1: Supabase Schema Migration

**Tareas**:
- [ ] Ejecutar migración SQL para dual lottery
- [ ] Agregar campos a tabla `draws`:
  - `draw_type` (TEXT): 'daily' | 'weekly'
  - `rollover_tier_5_1` (DECIMAL)
  - `rollover_tier_5_0` (DECIMAL)
  - `rollover_tier_4_1` (DECIMAL)
  - `month_token` (TEXT)
- [ ] Agregar campos a tabla `tickets`:
  - `enters_daily`, `enters_weekly` (BOOLEAN)
  - `daily_winner`, `weekly_winner` (BOOLEAN)
  - `daily_tier`, `weekly_tier` (TEXT)
  - `daily_prize_amount`, `weekly_prize_amount` (DECIMAL)
  - `daily_claimed`, `weekly_claimed` (BOOLEAN)
- [ ] Crear indexes para performance
- [ ] Verificar en Supabase dashboard

**Archivo SQL**:
```sql
-- Ver archivo: supabase-migration-propuesta-2.sql
```

**Entregables**:
- ✅ Schema actualizado en Supabase
- ✅ Indexes creados
- ✅ Tests básicos pasando

**Tiempo estimado**: 4 horas

---

#### DÍA 2-3: Hardhat Setup

**Tareas**:
- [ ] Crear carpeta `/contracts-v2` en el proyecto
- [ ] Instalar Hardhat:
```bash
cd /Users/albertosorno/crypto-lotto/web
mkdir contracts-v2
cd contracts-v2
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```
- [ ] Configurar `hardhat.config.js` para BASE:
```javascript
module.exports = {
  solidity: "0.8.20",
  networks: {
    baseTestnet: {
      url: "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 84532
    },
    baseMainnet: {
      url: "https://mainnet.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 8453
    }
  }
};
```
- [ ] Instalar dependencias:
```bash
npm install @chainlink/contracts @openzeppelin/contracts @uniswap/v3-periphery
```

**Entregables**:
- ✅ Hardhat configurado
- ✅ BASE testnet conectado
- ✅ Wallet funded con ETH testnet (faucet)

**Tiempo estimado**: 6 horas

---

#### DÍA 4-5: Smart Contract Base Structure

**Tareas**:
- [ ] Crear `contracts-v2/contracts/CryptoLotteryDual.sol`
- [ ] Implementar structs:
  - `Vault` (cbBTC, wETH, tokenOfMonth mapping)
  - `Draw` (id, type, winningNumbers, rollover fields)
  - `Ticket` (números, owner, dual draw IDs, dual winner flags)
- [ ] Implementar state variables:
  - `dailyVault`, `weeklyVault`
  - Token addresses (USDC, cbBTC, wETH)
  - Percentages (30/70, 70/25/5)
- [ ] Implementar `buyTicket()` básico (sin swaps aún)
- [ ] Escribir tests en `test/CryptoLotteryDual.test.js`:
```javascript
describe("CryptoLotteryDual", function () {
  it("Should split ticket price 30/70", async function () {
    // Test logic
  });

  it("Should create ticket entering both lotteries", async function () {
    // Test logic
  });
});
```

**Entregables**:
- ✅ Smart contract compilando sin errores
- ✅ Tests básicos pasando
- ✅ Estructura de vaults funcionando

**Tiempo estimado**: 10 horas

---

### 🔄 SEMANA 2: UNISWAP INTEGRATION

#### DÍA 6-7: Uniswap Swap Functions

**Tareas**:
- [ ] Implementar `_swapUSDCToCBBTC()`:
```solidity
function _swapUSDCToCBBTC(uint256 usdcAmount) internal returns (uint256) {
    IERC20(USDC).approve(UNISWAP_ROUTER, usdcAmount);

    ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
        .ExactInputSingleParams({
            tokenIn: USDC,
            tokenOut: CBBTC,
            fee: 3000,  // 0.3%
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: usdcAmount,
            amountOutMinimum: 0,  // Will calculate slippage later
            sqrtPriceLimitX96: 0
        });

    return ISwapRouter(UNISWAP_ROUTER).exactInputSingle(params);
}
```
- [ ] Implementar `_swapUSDCToWETH()` (similar)
- [ ] Implementar `_swapUSDCToToken()` con parámetro dinámico
- [ ] Agregar slippage protection (0.5%)

**Testing en testnet**:
- [ ] Deploy a BASE testnet (Sepolia)
- [ ] Obtener USDC testnet (faucet)
- [ ] Probar swap $1 USDC → cbBTC
- [ ] Probar swap $1 USDC → wETH
- [ ] Probar swap $1 USDC → MATIC
- [ ] Verificar gas fees (debe ser < $0.01)

**Entregables**:
- ✅ Swaps funcionando en testnet
- ✅ Gas optimizado
- ✅ Slippage protection activo

**Tiempo estimado**: 12 horas

---

#### DÍA 8-9: Dual Vault Storage

**Tareas**:
- [ ] Integrar swaps en `buyTicket()`:
```solidity
function buyTicket(...) external {
    // 1. Receive USDC
    IERC20(USDC).transferFrom(msg.sender, address(this), 250000);

    // 2. Calculate splits
    uint256 dailyAmount = 75000;  // 30%
    uint256 weeklyAmount = 175000; // 70%

    // 3. DAILY pool swaps
    uint256 dailyBTC = _swapUSDCToCBBTC((dailyAmount * 70) / 100);
    uint256 dailyETH = _swapUSDCToWETH((dailyAmount * 25) / 100);
    uint256 dailyToken = _swapUSDCToToken((dailyAmount * 5) / 100, currentMonthToken);

    dailyVault.cbBTC += dailyBTC;
    dailyVault.wETH += dailyETH;
    dailyVault.tokenOfMonth[currentMonthToken] += dailyToken;

    // 4. WEEKLY pool swaps (same logic)
    // ...

    // 5. Create ticket
    // ...
}
```
- [ ] Testing: Comprar 10 tickets
- [ ] Verificar vaults acumulan correctamente
- [ ] Verificar separación daily vs weekly

**Entregables**:
- ✅ buyTicket() completo funcionando
- ✅ Vaults separados acumulando
- ✅ Balances verificados on-chain

**Tiempo estimado**: 8 horas

---

#### DÍA 10: Token Rotation System

**Tareas**:
- [ ] Implementar `setMonthToken()`:
```solidity
function setMonthToken(string calldata newToken) external onlyOwner {
    currentMonthToken = newToken;
    emit MonthTokenUpdated(newToken);
}
```
- [ ] Testing: Cambiar token en medio de mes
- [ ] Verificar tokens NO se mezclan:
```
Mes 1 (MATIC): tokenOfMonth["MATIC"] = 100
Mes 2 (UNI): tokenOfMonth["UNI"] = 50
→ Verificar que MATIC sigue = 100
```

**Entregables**:
- ✅ Token rotation funcionando
- ✅ Tokens acumulan separadamente

**Tiempo estimado**: 4 horas

---

### 🎲 SEMANA 3: CHAINLINK VRF + ROLLOVER LOGIC

#### DÍA 11-12: Chainlink VRF Setup

**Tareas**:
- [ ] Crear subscription en Chainlink (BASE testnet):
  - Ir a https://vrf.chain.link/
  - Conectar wallet
  - Create subscription
  - Fund con LINK (testnet faucet)
- [ ] Heredar de `VRFConsumerBaseV2Plus`:
```solidity
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2Plus.sol";

contract CryptoLotteryDual is VRFConsumerBaseV2Plus {
    // ... contract code
}
```
- [ ] Implementar `requestRandomWords()`:
```solidity
function executeDraw(uint256 drawId, DrawType drawType) external onlyOwner {
    uint256 requestId = COORDINATOR.requestRandomWords(
        keyHash,
        subscriptionId,
        3,  // confirmations
        200000,  // callback gas limit
        6  // num words (5 numbers + 1 power)
    );

    requestIdToDrawInfo[requestId] = (drawId, drawType);
}
```
- [ ] Implementar callback `fulfillRandomWords()`:
```solidity
function fulfillRandomWords(
    uint256 requestId,
    uint256[] memory randomWords
) internal override {
    (uint256 drawId, DrawType drawType) = requestIdToDrawInfo[requestId];

    // Generate winning numbers
    uint8[5] memory winning;
    for (uint i = 0; i < 5; i++) {
        winning[i] = uint8((randomWords[i] % 50) + 1);
    }
    uint8 power = uint8((randomWords[5] % 20) + 1);

    draws[drawId].winningNumbers = winning;
    draws[drawId].powerNumber = power;
    draws[drawId].executed = true;

    emit DrawExecuted(drawId, drawType, winning, power);
}
```

**Testing**:
- [ ] Trigger draw en testnet
- [ ] Verificar números random generados
- [ ] Verificar callback ejecutado
- [ ] Check gas cost

**Entregables**:
- ✅ Chainlink VRF funcionando
- ✅ Draws ejecutándose con random real
- ✅ Gas fees < $2 por draw

**Tiempo estimado**: 10 horas

---

#### DÍA 13-14: Winner Determination

**Tareas**:
- [ ] Implementar `_determineWinners()`:
```solidity
function _determineWinners(uint256 drawId, DrawType drawType) internal {
    uint256[] memory ticketIds = drawTickets[drawId];
    Draw storage draw = draws[drawId];

    for (uint i = 0; i < ticketIds.length; i++) {
        Ticket storage ticket = tickets[ticketIds[i]];

        uint8 matches = _countMatches(ticket.numbers, draw.winningNumbers);
        bool powerMatch = (ticket.powerNumber == draw.powerNumber);

        string memory tier = "";
        bool isWinner = false;

        if (matches == 5 && powerMatch) {
            tier = "5+1";
            isWinner = true;
        } else if (matches == 5) {
            tier = "5+0";
            isWinner = true;
        } else if (matches == 4 && powerMatch) {
            tier = "4+1";
            isWinner = true;
        }
        // ... más tiers

        if (drawType == DrawType.DAILY) {
            ticket.isDailyWinner = isWinner;
            ticket.dailyTier = tier;
        } else {
            ticket.isWeeklyWinner = isWinner;
            ticket.weeklyTier = tier;
        }
    }
}
```

**Testing**:
- [ ] Comprar 100 tickets con números variados
- [ ] Ejecutar draw
- [ ] Verificar ganadores detectados correctamente
- [ ] Verificar tiers asignados

**Entregables**:
- ✅ Winner determination funcionando
- ✅ Tiers asignados correctamente

**Tiempo estimado**: 8 horas

---

#### DÍA 15: Multi-Tier Rollover Logic

**Tareas**:
- [ ] Implementar `_calculateRollover()`:
```solidity
function _calculateRollover(uint256 drawId, DrawType drawType) internal {
    Draw storage draw = draws[drawId];
    Vault storage vault = (drawType == DrawType.DAILY) ? dailyVault : weeklyVault;

    uint256 totalPool = vault.cbBTC + vault.wETH + vault.tokenOfMonth[draw.monthToken];

    // Count winners per tier
    (uint256 w51, uint256 w50, uint256 w41, uint256 w31, uint256 w40) =
        _countWinnersByTier(drawId, drawType);

    uint256 newRollover51 = 0;
    uint256 newRollover50 = 0;
    uint256 newRollover41 = 0;
    uint256 extraForJackpot = 0;

    // TIER 5+1: 50% + rollover
    if (w51 == 0) {
        newRollover51 = (totalPool * 5000) / 10000 + draw.rolloverTier51;
    }

    // TIER 5+0: 20% + rollover
    if (w50 == 0) {
        newRollover50 = (totalPool * 2000) / 10000 + draw.rolloverTier50;
    }

    // TIER 4+1: 15% → 50% rollover, 50% to jackpot
    if (w41 == 0) {
        uint256 tier41Amount = (totalPool * 1500) / 10000 + draw.rolloverTier41;
        newRollover41 = tier41Amount / 2;
        extraForJackpot += tier41Amount / 2;
    }

    // TIER 3+1: 10% → 100% to jackpot
    if (w31 == 0) {
        extraForJackpot += (totalPool * 1000) / 10000;
    }

    // TIER 4+0: 5% → 100% to jackpot
    if (w40 == 0) {
        extraForJackpot += (totalPool * 500) / 10000;
    }

    // Update next draw rollover
    uint256 nextDrawId = (drawType == DrawType.DAILY) ?
        currentDailyDrawId + 1 : currentWeeklyDrawId + 1;

    draws[nextDrawId].rolloverTier51 = newRollover51 + extraForJackpot;
    draws[nextDrawId].rolloverTier50 = newRollover50;
    draws[nextDrawId].rolloverTier41 = newRollover41;

    emit RolloverCalculated(nextDrawId, drawType, newRollover51 + extraForJackpot, newRollover50, newRollover41);
}
```

**Testing**:
- [ ] Simular 12 semanas sin ganadores tier 5+1
- [ ] Verificar jackpot crece según tabla:
```
Week 1: $4,375
Week 2: $10,719
Week 3: $19,032
...
Week 12: $182,442 ✅
```

**Entregables**:
- ✅ Rollover multi-tier funcionando
- ✅ Jackpot creciendo exponencialmente
- ✅ Números verificados vs simulación

**Tiempo estimado**: 10 horas

---

### 🎨 SEMANA 4: FRONTEND INTEGRATION

#### DÍA 16-17: Dual Pool Display Components

**Tareas**:
- [ ] Crear `components/DualPoolDisplay.tsx`:
```tsx
export function DualPoolDisplay() {
  const { dailyPool, weeklyPool } = useLivePools();

  return (
    <div className="dual-pools">
      <div className="daily-pool">
        <h3>DAILY LOTTERY</h3>
        <div className="pool-value">${dailyPool.total}</div>
        <div className="breakdown">
          <span>BTC: {dailyPool.cbBTC}</span>
          <span>ETH: {dailyPool.wETH}</span>
          <span>Token: {dailyPool.token}</span>
        </div>
        <div className="next-draw">Next: {dailyPool.nextDraw}</div>
      </div>

      <div className="weekly-pool">
        <h3>WEEKLY LOTTERY</h3>
        <div className="pool-value">${weeklyPool.total}</div>
        <div className="jackpot">
          <span>Jackpot: ${weeklyPool.jackpot}</span>
          <span className="rollover">+${weeklyPool.rollover} rollover</span>
        </div>
        <div className="next-draw">Next: {weeklyPool.nextDraw}</div>
      </div>
    </div>
  );
}
```

- [ ] Crear `components/RolloverJackpotTracker.tsx`:
```tsx
export function RolloverJackpotTracker() {
  const { weeklyDraw } = useCurrentDraw();

  return (
    <div className="jackpot-tracker">
      <div className="current-jackpot">
        <h2>WEEKLY JACKPOT</h2>
        <div className="amount">${weeklyDraw.jackpot}</div>
      </div>

      <div className="rollover-breakdown">
        <div className="row">
          <span>Base (50% pool):</span>
          <span>${weeklyDraw.baseJackpot}</span>
        </div>
        <div className="row rollover">
          <span>Rollover from last draw:</span>
          <span>+${weeklyDraw.rollover51}</span>
        </div>
        <div className="row extra">
          <span>Bonus from unclaimed tiers:</span>
          <span>+${weeklyDraw.extraBonus}</span>
        </div>
      </div>

      <div className="history">
        <h4>Jackpot Growth</h4>
        <LineChart data={weeklyDraw.history} />
      </div>
    </div>
  );
}
```

**Testing**:
- [ ] Verificar pools mostrados correctamente
- [ ] Verificar countdown timer actualiza
- [ ] Verificar rollover tracker en tiempo real

**Entregables**:
- ✅ UI dual pools funcionando
- ✅ Jackpot tracker con breakdown
- ✅ Responsive design

**Tiempo estimado**: 10 horas

---

#### DÍA 18: Update My Tickets Page

**Tareas**:
- [ ] Actualizar `app/my-tickets/page.tsx`:
```tsx
export default function MyTicketsPage() {
  const { tickets } = useUserTickets();

  return (
    <div className="my-tickets">
      {tickets.map(ticket => (
        <div key={ticket.id} className="ticket-card">
          <div className="numbers">{/* ... */}</div>

          <div className="dual-status">
            {/* DAILY STATUS */}
            <div className="daily-status">
              <h4>Daily Draw #{ticket.dailyDrawId}</h4>
              {ticket.isDailyWinner ? (
                <div className="winner">
                  🎉 WINNER! Tier {ticket.dailyTier}
                  <div className="prize">${ticket.dailyPrizeAmount}</div>
                  {!ticket.dailyClaimed && (
                    <button onClick={() => claimDailyPrize(ticket.id)}>
                      CLAIM DAILY PRIZE
                    </button>
                  )}
                </div>
              ) : (
                <div className="no-win">No win in daily</div>
              )}
            </div>

            {/* WEEKLY STATUS */}
            <div className="weekly-status">
              <h4>Weekly Draw #{ticket.weeklyDrawId}</h4>
              {ticket.isWeeklyWinner ? (
                <div className="winner jackpot">
                  🚀 JACKPOT! Tier {ticket.weeklyTier}
                  <div className="prize huge">${ticket.weeklyPrizeAmount}</div>
                  {!ticket.weeklyClaimed && (
                    <button onClick={() => claimWeeklyPrize(ticket.id)}>
                      CLAIM WEEKLY PRIZE
                    </button>
                  )}
                </div>
              ) : (
                <div className="no-win">No win in weekly</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Entregables**:
- ✅ My Tickets muestra dual wins
- ✅ Claim buttons separados para daily + weekly
- ✅ UI clara y premium

**Tiempo estimado**: 6 horas

---

#### DÍA 19-20: Uniswap Widget Integration

**Tareas**:
- [ ] Instalar Uniswap widget:
```bash
npm install @uniswap/widgets @uniswap/sdk-core
```

- [ ] Crear `components/UniswapSwapModal.tsx`:
```tsx
import { SwapWidget } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';

export function UniswapSwapModal({ prizes, onClose }) {
  const { getEthersProvider } = usePrivy();

  return (
    <div className="swap-modal">
      <h2>Convert Your Prizes to USDC</h2>

      <div className="prize-summary">
        <div>💰 {prizes.cbBTC} cbBTC (${prizes.cbBTC_usd})</div>
        <div>💎 {prizes.wETH} wETH (${prizes.wETH_usd})</div>
        <div>🟣 {prizes.token} {prizes.tokenSymbol} (${prizes.token_usd})</div>
        <div className="total">Total: ${prizes.total_usd}</div>
      </div>

      <SwapWidget
        provider={getEthersProvider()}
        defaultInputTokenAddress={prizes.tokenAddresses.cbBTC}
        defaultInputAmount={prizes.cbBTC.toString()}
        defaultOutputTokenAddress={USDC_ADDRESS_BASE}
        width={400}
        theme={{
          primary: '#F59E0B',  // Gold
          secondary: '#1F2937',
          container: '#111827',
        }}
        onSwapSuccess={(result) => {
          console.log('Swapped!', result);
          onClose();
        }}
      />
    </div>
  );
}
```

**Testing**:
- [ ] Claim prize → Modal opens
- [ ] Swap cbBTC → USDC
- [ ] Swap wETH → USDC
- [ ] Swap token → USDC
- [ ] Verificar USDC recibido en wallet

**Entregables**:
- ✅ Uniswap widget integrado
- ✅ Swap flow funcionando end-to-end
- ✅ Theme matching nuestra app

**Tiempo estimado**: 8 horas

---

### 🧪 SEMANA 5: TESTING + OPTIMIZATION

#### DÍA 21-22: End-to-End Testing

**Test Cases**:

1. **Buy Ticket Flow**:
- [ ] Usuario conecta wallet
- [ ] Usuario selecciona números
- [ ] Usuario compra ticket ($0.25 USDC)
- [ ] Smart contract divide 30/70
- [ ] Swaps ejecutan correctamente
- [ ] Vaults acumulan
- [ ] Ticket registrado en ambos draws
- [ ] Supabase actualizado

2. **Daily Draw Flow**:
- [ ] Trigger daily draw (admin)
- [ ] Chainlink VRF genera números
- [ ] Winners determinados
- [ ] Rollover calculado
- [ ] Next draw rollover actualizado
- [ ] Frontend muestra resultados

3. **Weekly Draw Flow**:
- [ ] Trigger weekly draw (admin)
- [ ] VRF genera números
- [ ] Winners determinados (incluyendo jackpot)
- [ ] Rollover calculado (multi-tier)
- [ ] Jackpot actualizado
- [ ] Frontend muestra

4. **Claim Prize Flow**:
- [ ] Usuario ve prizes en My Tickets
- [ ] Click "CLAIM DAILY PRIZE"
- [ ] Transaction ejecuta
- [ ] Crypto transferido a wallet
- [ ] Supabase actualizado
- [ ] UI actualiza
- [ ] Repeat para weekly prize

5. **Swap to Cash Flow**:
- [ ] Usuario tiene cbBTC + wETH + token
- [ ] Click "CONVERT TO USDC"
- [ ] Uniswap widget aparece
- [ ] Swap all to USDC
- [ ] USDC en wallet
- [ ] Usuario puede enviar a exchange

**Entregables**:
- ✅ Todos los flows testeados
- ✅ Bugs encontrados documentados
- ✅ Test report completo

**Tiempo estimado**: 12 horas

---

#### DÍA 23-24: Bug Fixes + Optimization

**Tareas**:
- [ ] Fix bugs encontrados en testing
- [ ] Optimize gas en smart contract:
  - Minimize storage operations
  - Batch operations where possible
  - Use uint256 instead of smaller uints
- [ ] Optimize frontend performance:
  - Lazy load components
  - Memoize expensive calculations
  - Optimize re-renders
- [ ] Security review:
  - Reentrancy checks
  - Access control verified
  - Input validation

**Entregables**:
- ✅ Zero bugs conocidos
- ✅ Gas optimizado (< $0.01 por compra)
- ✅ Frontend smooth
- ✅ Security checklist completo

**Tiempo estimado**: 10 horas

---

#### DÍA 25: CRON Jobs + Admin Functions

**Tareas**:
- [ ] Crear `app/api/cron/trigger-daily-draw/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Execute daily draw via smart contract
  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
  const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  const tx = await contract.executeDraw(currentDailyDrawId, DrawType.DAILY);
  await tx.wait();

  return NextResponse.json({ success: true, drawId: currentDailyDrawId });
}
```

- [ ] Crear `app/api/cron/trigger-weekly-draw/route.ts` (similar)
- [ ] Configurar Vercel CRON en `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/trigger-daily-draw",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/trigger-weekly-draw",
      "schedule": "0 20 * * 0"
    }
  ]
}
```

**Entregables**:
- ✅ CRON jobs configurados
- ✅ Draws automáticos funcionando
- ✅ Alertas si falla

**Tiempo estimado**: 6 horas

---

### 🚀 SEMANA 6: DEPLOYMENT + LAUNCH

#### DÍA 26-27: Pre-deployment

**Tareas**:
- [ ] Smart contract audit:
  - Manualmente revisar TODO el código
  - Verificar no hay vulnerabilidades obvias
  - Testing exhaustivo en testnet
- [ ] Gas optimization final
- [ ] Security checklist:
  - [ ] Reentrancy protection
  - [ ] Access control (onlyOwner)
  - [ ] Input validation
  - [ ] Integer overflow checks
  - [ ] External call safety
- [ ] Setup mainnet wallet:
  - [ ] Wallet privado con ETH ($100)
  - [ ] Comprar LINK ($50)
  - [ ] Verificar fondos

**Entregables**:
- ✅ Audit completo
- ✅ Security verified
- ✅ Mainnet wallet ready

**Tiempo estimado**: 10 horas

---

#### DÍA 28: Deploy to BASE Mainnet

**Tareas**:
- [ ] Deploy smart contract:
```bash
cd contracts-v2
npx hardhat run scripts/deploy.js --network baseMainnet
```
- [ ] Verificar contract en BaseScan:
```bash
npx hardhat verify --network baseMainnet <CONTRACT_ADDRESS>
```
- [ ] Setup Chainlink subscription (mainnet):
  - Create subscription en https://vrf.chain.link/
  - Add contract como consumer
  - Fund con $50 LINK
- [ ] Update frontend `.env`:
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... (mainnet address)
NEXT_PUBLIC_CHAINLINK_SUBSCRIPTION_ID=...
```
- [ ] Deploy frontend a Vercel:
```bash
vercel --prod
```

**Entregables**:
- ✅ Contract deployed a mainnet
- ✅ Verified en BaseScan
- ✅ Chainlink configured
- ✅ Frontend en producción

**Tiempo estimado**: 6 horas

---

#### DÍA 29: Testing en Mainnet + Launch

**Tareas**:
- [ ] Buy first ticket con dinero real ($0.25 USDC)
- [ ] Verificar:
  - USDC recibido por contract
  - Swaps ejecutados
  - Vaults acumularon
  - Ticket registrado
- [ ] Trigger first daily draw (manual):
  - Execute draw via admin
  - Verificar Chainlink genera números
  - Winners determinados
  - Rollover calculado
- [ ] Si hay ganador, test claim:
  - Claim prize
  - Crypto transferido
  - Swap to USDC
- [ ] Monitor gas fees en producción
- [ ] Setup alertas:
  - Low LINK balance
  - Failed transactions
  - Unusual activity

**Entregables**:
- ✅ First ticket comprado exitoso
- ✅ First draw ejecutado exitoso
- ✅ Todo funcionando en mainnet
- ✅ Monitoring activo

**Tiempo estimado**: 8 horas

---

#### DÍA 30: LAUNCH DAY 🚀

**Tareas**:
- [ ] Final testing en producción
- [ ] Open to public
- [ ] Marketing announcement
- [ ] Monitor primeras compras
- [ ] Support users
- [ ] Fix cualquier issue menor

**Entregables**:
- ✅ LIVE en producción
- ✅ Users comprando tickets
- ✅ Sistema estable

**Tiempo estimado**: Ongoing

---

## 📊 RESUMEN DE TIMELINE

| Semana | Fase | Tiempo | Entregables |
|--------|------|--------|-------------|
| **1** | Foundation | 20h | Database + SC base |
| **2** | Uniswap | 24h | Swaps + dual vaults |
| **3** | Chainlink + Rollover | 28h | VRF + rollover logic |
| **4** | Frontend | 24h | UI + Uniswap widget |
| **5** | Testing | 28h | E2E tests + optimization |
| **6** | Deploy | 24h | Mainnet + launch |
| **TOTAL** | | **148 horas** | **MVP COMPLETO** |

---

## 💰 PRESUPUESTO FINAL

### Desarrollo:
- **$0** (tu tiempo, socio!)

### Deployment:
- Deploy contract: **$50**
- Chainlink LINK: **$50**
- Testing: **$20**
- **Total**: **$120**

### Operación Mensual:
- Chainlink VRF: **$34/mes**
- Gas fees admin: **$5/mes**
- **Total**: **$39/mes**

### Con 1,000 tickets/mes:
- Revenue: **$250/mes**
- Costs: **$39/mes**
- **Profit**: **$211/mes** (84%)

---

## ✅ MÉTRICAS DE ÉXITO

### Semana 1:
- ✅ Contract compilando
- ✅ Database actualizado
- ✅ buyTicket() funcionando local

### Semana 2:
- ✅ Swaps en testnet funcionando
- ✅ Vaults acumulando
- ✅ Gas fees < $0.01

### Semana 3:
- ✅ VRF generando números
- ✅ Winners detectados
- ✅ Rollover calculando correctamente

### Semana 4:
- ✅ UI mostrando dual pools
- ✅ Jackpot tracker funcionando
- ✅ Uniswap widget integrado

### Semana 5:
- ✅ Todos los flows testeados
- ✅ Zero bugs
- ✅ Performance optimizado

### Semana 6:
- ✅ Deployed a mainnet
- ✅ Primera compra exitosa
- ✅ **LIVE! 🚀**

---

## 🚨 RIESGOS Y MITIGACIONES

### Riesgo 1: Rollover logic complejo
**Mitigación**: Testing exhaustivo con simulaciones de 100+ draws

### Riesgo 2: Gas fees altos
**Mitigación**: Optimización constante, target < $0.01 por operación

### Riesgo 3: Chainlink subscription vacío
**Mitigación**: Alertas automáticas, auto-refill si < $30

### Riesgo 4: Bug en smart contract
**Mitigación**: Audit pre-deploy, testing en testnet, start con límite de $10K en vaults

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **HOY**:
   - [ ] Alberto lee `PROPUESTA-2-INTEGRACION-COMPLETA.md`
   - [ ] Alberto aprueba plan
   - [ ] Setup Hardhat (si quiere empezar ya)

2. **MAÑANA**:
   - [ ] Ejecutar migración Supabase
   - [ ] Empezar smart contract base

3. **ESTA SEMANA**:
   - [ ] Completar Semana 1 (Foundation)

4. **PRÓXIMAS 5 SEMANAS**:
   - [ ] Seguir roadmap paso a paso

5. **SEMANA 6**:
   - [ ] **DEPLOY Y LAUNCH** 🚀

---

**¿LISTO PARA EMPEZAR, SOCIO?** 🎯
