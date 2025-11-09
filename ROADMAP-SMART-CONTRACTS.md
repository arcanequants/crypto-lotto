# 🗺️ ROADMAP: Smart Contracts + Integración Uniswap

**Fecha**: 2025-10-23
**Objetivo**: Implementar sistema completo de smart contracts en BASE con Uniswap swap

---

## 📋 SEMANA 6: Smart Contracts Foundation

### Fase 1: Setup Desarrollo (3 días)

#### Día 1: Environment Setup
- [ ] Instalar Hardhat para desarrollo Solidity
- [ ] Configurar network BASE testnet (Sepolia)
- [ ] Setup wallet de desarrollo con ETH testnet
- [ ] Configurar ethers.js en frontend

**Entregables**:
```bash
/contracts/
├── hardhat.config.js
├── .env.contracts
└── scripts/deploy.js
```

#### Día 2: Smart Contract Base Structure
- [ ] Crear contrato principal `CryptoLottery.sol`
- [ ] Implementar structs: Draw, Ticket
- [ ] Implementar vaults: cbBTC, wETH, tokenOfMonth
- [ ] Crear funciones básicas: buyTicket(), claimPrize()

**Entregables**:
```solidity
contracts/CryptoLottery.sol (v0.1)
- State variables
- Structs
- Basic functions (sin Chainlink aún)
```

#### Día 3: Testing Local
- [ ] Escribir tests unitarios con Hardhat
- [ ] Test: buyTicket con USDC mock
- [ ] Test: vaults actualizan correctamente
- [ ] Test: claimPrize transfiere tokens

**Entregables**:
```bash
test/CryptoLottery.test.js
✅ All tests passing
```

---

### Fase 2: Integración Uniswap (4 días)

#### Día 4: Uniswap Router Integration
- [ ] Estudiar Uniswap V3 en BASE
- [ ] Implementar `_swapToCBBTC()` function
- [ ] Implementar `_swapToWETH()` function
- [ ] Implementar `_swapToTokenOfMonth()` function

**Código**:
```solidity
function _swapToCBBTC(uint256 usdcAmount) internal returns (uint256) {
    // Approve + swap via Uniswap router
}
```

#### Día 5: Testing Swaps
- [ ] Deploy en BASE testnet
- [ ] Probar swap USDC → cbBTC (testnet)
- [ ] Probar swap USDC → wETH (testnet)
- [ ] Probar swap USDC → MATIC (testnet)
- [ ] Verificar slippage y fees

**Testing checklist**:
```
✅ Swap $1 USDC → cbBTC exitoso
✅ Swap $1 USDC → wETH exitoso
✅ Swap $1 USDC → MATIC exitoso
✅ Vaults actualizan correctamente
✅ Gas fees razonables (< $0.01)
```

#### Día 6-7: Token Rotation System
- [ ] Implementar `setMonthToken()` function
- [ ] Crear mapping `tokenOfMonthVault`
- [ ] Probar acumulación multi-mes
- [ ] Verificar que tokens no se mezclan

**Test scenario**:
```
Mes 1 (MATIC):
- 10 tickets → tokenOfMonthVault["MATIC"] = 15

Mes 2 (UNI):
- 10 tickets → tokenOfMonthVault["UNI"] = 1.5
- Verificar: tokenOfMonthVault["MATIC"] = 15 (sin cambios)

Claim:
- Usuario claim mes 1 → recibe MATIC
- Usuario claim mes 2 → recibe UNI
```

---

### Fase 3: Chainlink VRF Integration (3 días)

#### Día 8: Chainlink Setup
- [ ] Crear subscription en Chainlink (testnet)
- [ ] Fondear con LINK testnet
- [ ] Implementar `requestRandomWords()`
- [ ] Implementar `fulfillRandomWords()` callback

**Entregables**:
```solidity
// En CryptoLottery.sol
function requestRandomWords(uint256 drawId) external onlyOwner { }
function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override { }
```

#### Día 9: Winner Determination Logic
- [ ] Implementar `_determineWinners()` function
- [ ] Lógica de matching numbers
- [ ] Asignación de tiers (5+1, 5, 4+1, etc.)
- [ ] Actualizar tickets con `isWinner` y `tier`

**Algoritmo**:
```solidity
function _determineWinners(uint256 drawId) internal {
    uint256[] memory ticketIds = drawTickets[drawId];

    for (uint i = 0; i < ticketIds.length; i++) {
        uint matches = _countMatches(tickets[i], draws[drawId]);
        bool powerMatch = tickets[i].power == draws[drawId].power;

        if (matches == 5 && powerMatch) {
            tickets[i].tier = "5+1";
            tickets[i].isWinner = true;
        }
        // ... resto de tiers
    }
}
```

#### Día 10: Testing End-to-End
- [ ] Test completo: Compra → Draw → Claim
- [ ] Verificar randomness de Chainlink
- [ ] Probar múltiples ganadores
- [ ] Verificar distribución de premios

**E2E Test**:
```
1. 100 usuarios compran tickets
2. Trigger draw con Chainlink VRF
3. Verificar números random generados
4. Verificar ganadores determinados
5. Ganador hace claim
6. Verificar tokens transferidos
✅ All steps successful
```

---

## 📋 SEMANA 7: Frontend Integration

### Fase 4: Uniswap Widget (2 días)

#### Día 11: Widget Setup
- [ ] Instalar `@uniswap/widgets`
- [ ] Crear componente `SwapToCashModal.tsx`
- [ ] Integrar con Privy provider
- [ ] Configurar theme (amber/gold)

**Código**:
```tsx
import { SwapWidget } from '@uniswap/widgets'

<SwapWidget
  provider={privyProvider}
  defaultInputTokenAddress={CBBTC_ADDRESS}
  defaultOutputTokenAddress={USDC_ADDRESS}
  theme={{ primary: '#F59E0B' }}
/>
```

#### Día 12: User Flow
- [ ] Diseño UI para "Convert to USDC" button
- [ ] Modal con widget de Uniswap
- [ ] Mostrar resumen de prizes
- [ ] Callbacks de success/error

**UI Flow**:
```
Dashboard → User sees prizes
↓
Click "Convert to USDC"
↓
Modal opens with Uniswap widget
↓
User swaps cbBTC → USDC
↓
Success → Refresh balance
```

---

### Fase 5: Smart Contract Integration (3 días)

#### Día 13: Contract Calls - Buy Tickets
- [ ] Implementar `useBuyTicket()` hook
- [ ] Approve USDC antes de buy
- [ ] Call `contract.buyTicket()`
- [ ] Handle loading/error states

**Hook**:
```typescript
export function useBuyTicket() {
  const { getEthersProvider } = usePrivy()

  async function buyTicket(numbers, power) {
    // 1. Approve USDC
    await usdcContract.approve(LOTTERY_ADDRESS, '250000') // $0.25

    // 2. Buy ticket
    await lotteryContract.buyTicket(numbers, power, USDC_ADDRESS, '250000')
  }

  return { buyTicket, loading, error }
}
```

#### Día 14: Contract Calls - Claim Prize
- [ ] Implementar `useClaimPrize()` hook
- [ ] Call `contract.claimPrize(ticketId)`
- [ ] Handle success → Show swap modal
- [ ] Update user balance

**Hook**:
```typescript
export function useClaimPrize() {
  async function claimPrize(ticketId) {
    await lotteryContract.claimPrize(ticketId)

    // Después de claim exitoso
    // Mostrar SwapToCashModal automáticamente
  }
}
```

#### Día 15: Testing + Bug Fixes
- [ ] Test compra de tickets en testnet
- [ ] Test claim de premios en testnet
- [ ] Test swap en Uniswap widget
- [ ] Fix cualquier bug encontrado

---

### Fase 6: Admin Functions (2 días)

#### Día 16: Admin Panel
- [ ] Crear `/admin` page (protected)
- [ ] Función: Trigger draw manualmente
- [ ] Función: Change month token
- [ ] Función: Fund Chainlink subscription

**UI**:
```tsx
/admin
├─ Trigger Draw → Call requestRandomWords()
├─ Change Token → Call setMonthToken("UNI")
├─ Fund Chainlink → Send LINK to subscription
└─ View Stats → Total vaults, tickets, etc.
```

#### Día 17: CRON Jobs
- [ ] API: `/api/cron/trigger-draw`
- [ ] API: `/api/cron/check-link-balance`
- [ ] Vercel CRON config
- [ ] Testing automático

**CRON Schedule**:
```json
{
  "crons": [
    {
      "path": "/api/cron/trigger-draw",
      "schedule": "0 0 * * *"  // Daily @ 00:00 UTC
    },
    {
      "path": "/api/cron/check-link-balance",
      "schedule": "0 8 * * 1"  // Weekly @ Monday 8am
    }
  ]
}
```

---

## 📋 SEMANA 8: Deployment + Audit

### Fase 7: Mainnet Deployment (3 días)

#### Día 18: Pre-deployment
- [ ] Audit smart contract code
- [ ] Run gas optimization
- [ ] Setup mainnet wallet con ETH
- [ ] Comprar LINK para Chainlink subscription

**Checklist**:
```
✅ Code reviewed
✅ Tests passing (100% coverage)
✅ Gas optimizado (< $0.01 por tx)
✅ Wallet funded ($500 ETH + $100 LINK)
```

#### Día 19: Deploy to BASE Mainnet
- [ ] Deploy CryptoLottery.sol a BASE mainnet
- [ ] Verify contract en BaseScan
- [ ] Crear Chainlink subscription (mainnet)
- [ ] Fondear con LINK ($50)

**Commands**:
```bash
npx hardhat run scripts/deploy.js --network base

npx hardhat verify --network base <CONTRACT_ADDRESS>
```

#### Día 20: Post-deployment Testing
- [ ] Buy 1 ticket con dinero real ($0.25)
- [ ] Verificar swap USDC → tokens
- [ ] Trigger draw manual (admin)
- [ ] Test claim (si ganamos)
- [ ] Verificar Uniswap widget funciona

---

### Fase 8: Monitoring + Docs (2 días)

#### Día 21: Monitoring Setup
- [ ] BaseScan alerts para contract
- [ ] Sentry error tracking
- [ ] Analytics: Tickets sold, Claims, etc.
- [ ] Dashboard admin con stats

#### Día 22: Documentation
- [ ] Documentar funciones del contrato
- [ ] Guía para usuarios: Cómo claim + swap
- [ ] Guía admin: Cómo trigger draws
- [ ] FAQ sobre fees y tiempos

---

## 🎯 ENTREGABLES FINALES

### Smart Contracts:
```
✅ CryptoLottery.sol (deployed en BASE mainnet)
✅ Verificado en BaseScan
✅ Integrado con Chainlink VRF
✅ Integrado con Uniswap V3
✅ Tests 100% passing
```

### Frontend:
```
✅ Compra de tickets con USDC/USDT
✅ Claim de premios (cbBTC + wETH + token)
✅ Uniswap widget para swap a USDC
✅ Dashboard con balances en tiempo real
✅ Admin panel para draws
```

### Backend:
```
✅ CRON job para draws automáticos
✅ CRON job para verificar LINK balance
✅ APIs para admin functions
```

### Docs:
```
✅ User guide: Cómo jugar y claim
✅ Admin guide: Cómo operar draws
✅ Developer docs: Smart contract functions
✅ FAQ completo
```

---

## 📊 MÉTRICAS DE ÉXITO

### Semana 6:
- ✅ Smart contract compilando sin errores
- ✅ Tests unitarios passing
- ✅ Swaps funcionando en testnet

### Semana 7:
- ✅ Compra de tickets desde frontend
- ✅ Claim funcionando end-to-end
- ✅ Uniswap widget integrado

### Semana 8:
- ✅ Contract deployed en mainnet
- ✅ Primera compra real exitosa
- ✅ Primer draw ejecutado
- ✅ Monitoring activo

---

## 🚨 RIESGOS Y MITIGACIONES

### Riesgo 1: Slippage alto en swaps
**Mitigación**:
- Configurar slippage tolerance 0.5%
- Para compras grandes (>$100), hacer batch
- Usar Uniswap V3 (mejor pricing)

### Riesgo 2: Chainlink VRF falla
**Mitigación**:
- Tener LINK suficiente en subscription (>$50)
- Alertas automáticas si LINK < $30
- Fallback: Admin puede trigger manualmente

### Riesgo 3: Gas fees altos
**Mitigación**:
- Optimizar código Solidity
- Usar BASE (más barato que Ethereum)
- Batch operations donde sea posible

### Riesgo 4: Bug en smart contract
**Mitigación**:
- Audit completo pre-deployment
- Tests 100% coverage
- Start con límite de $10K en vaults (MVP)
- Aumentar gradualmente después de 1 mes

---

## 💰 PRESUPUESTO

### Desarrollo (3 semanas):
- Developer time: Gratis (tú, socio!)
- Gas fees (testnet): Gratis (faucets)
- Tools: Gratis (Hardhat, etc.)

### Deployment:
- ETH para deploy: $50
- LINK para Chainlink: $50
- ETH para gas (operaciones): $50
- **Total deployment**: $150

### Mensual (operación):
- Chainlink VRF: $34/mes
- Gas fees admin: $5/mes
- Refill LINK: $20/mes
- **Total mensual**: $59/mes

---

## ✅ PRÓXIMOS PASOS INMEDIATOS

1. **HOY**: Crear branch `feature/smart-contracts`
2. **Mañana**: Setup Hardhat + escribir primer test
3. **Esta semana**: Completar Fase 1 (Foundation)
4. **Próxima semana**: Completar Fase 2 (Uniswap)
5. **Semana 3**: Deploy a mainnet

---

**¿Empezamos con Fase 1 mañana, socio?** 🚀

**ROADMAP COMPLETO Y REALISTA** ✅
