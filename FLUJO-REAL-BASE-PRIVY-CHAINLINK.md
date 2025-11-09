# 🎯 FLUJO REAL: BASE + Privy + Chainlink VRF

**Fecha**: 2025-10-23
**Blockchain**: BASE (Ethereum L2)
**Wallet**: Privy (embedded wallets)
**Random Numbers**: Chainlink VRF v2.5

---

## ✅ LO QUE YA TENÍAMOS DECIDIDO (que olvidé, perdón)

1. **Blockchain**: BASE ✅
2. **Wallet**: Privy ✅
3. **Random**: Chainlink VRF ✅
4. **NO custodiamos nada**: Smart contract holds everything ✅

---

## 🔍 PRIVY SOPORTA (investigación real)

**Fuente**: https://www.privy.io/ + web search 2025-10-23

### Networks Soportadas:
- ✅ **BASE** (nuestro blockchain)
- ✅ Ethereum (mainnet)
- ✅ Arbitrum
- ✅ Polygon
- ✅ Solana
- ✅ Bitcoin
- ✅ Y más...

### Tokens Soportados:
- ✅ **Millones de tokens** en EVM chains
- ✅ **Millones de tokens** en Solana
- ✅ **cbBTC en BASE** (wrapped Bitcoin) ← LO QUE USAREMOS
- ✅ **wETH en BASE** (wrapped Ethereum)
- ✅ **Cualquier ERC-20** en BASE

### ¿Privy tiene swap integrado?
- ❌ **NO** - Privy NO tiene swap integrado
- Privy es solo wallet + autenticación
- Para swaps necesitamos usar DEXs externos:
  - **Uniswap** (en BASE)
  - **1inch**
  - **Matcha**

---

## 💰 CHAINLINK VRF - ACLARACIÓN REAL

### ¿En qué pagamos Chainlink VRF?

**Respuesta**: **LINK token** (preferible) O **ETH** (60% más caro)

**Fuente**: https://docs.chain.link/vrf/v2-5/billing

```
Opción A: Pagar en LINK
- Costo: ~$1.00 por sorteo (promedio)
- Más barato

Opción B: Pagar en ETH (native token de BASE)
- Costo: ~$1.60 por sorteo (60% premium)
- Más caro
```

### ¿Cómo funciona el pago?

```
1. Creamos SUBSCRIPTION en Chainlink
   ↓
2. Fondeamos subscription con LINK tokens
   ↓
3. Smart contract usa LINK de la subscription
   ↓
4. Cada random number request consume LINK
```

---

## 💼 TREASURY WALLET - LO QUE HABÍAMOS PLANEADO

### Concept Original (que olvidé):

```
TREASURY WALLET (nuestra)
├─> Controla: Smart contract admin functions
├─> Fondea: Chainlink VRF subscription con LINK
├─> Recibe: Fees del smart contract
└─> Paga: Gas fees para operaciones admin
```

### ACLARACIÓN:

**Treasury Wallet NO custodia premios** - solo:
1. Fondea Chainlink subscription con LINK
2. Recibe fees operacionales
3. Paga gas para admin tasks

**Smart Contract custodia premios** - TODO el dinero de users está ahí.

---

## 🎯 FLUJO COMPLETO REAL (sin mentiras)

### 1️⃣ USUARIO COMPRA TICKET ($0.25)

```
FRONTEND (Next.js):
1. Usuario conecta Privy wallet (email/Google login)
   ↓
2. Usuario selecciona números + agrega al carrito
   ↓
3. Click "BUY TICKETS"
   ↓
4. Privy wallet prompt: "Pay $0.25 in ETH"
   ↓
BLOCKCHAIN (BASE):
5. Smart contract recibe $0.25 en ETH
   ↓
6. Smart contract automáticamente:
   - Swappea 70% ($0.175) → cbBTC via Uniswap
   - Swappea 25% ($0.0625) → wETH (o guarda ETH directo)
   - Swappea 5% ($0.0125) → Token del mes via Uniswap
   ↓
7. Smart contract GUARDA en sus vaults:
   vault.btc_balance += cbBTC_amount
   vault.eth_balance += wETH_amount
   vault.token_balance += token_amount
   ↓
8. Ticket registrado on-chain con números del usuario
```

**Gas cost**: ~$0.008 USD (usuario paga)

---

### 2️⃣ SORTEO CON CHAINLINK VRF

```
BACKEND (Vercel CRON):
1. CRON triggers daily @ 00:00 UTC
   ↓
2. API llama smart contract: requestRandomWords()
   ↓
BLOCKCHAIN (BASE):
3. Smart contract llama Chainlink VRF Coordinator
   ↓
4. Chainlink genera números random verificables
   ↓
5. Chainlink COBRA de nuestra subscription:
   - Consume ~$1.00 de LINK (si pagamos con LINK)
   - Consume ~$1.60 de ETH (si pagamos con ETH)
   ↓
6. Callback: Smart contract recibe números random
   ↓
7. Smart contract determina ganadores
   ↓
8. Actualiza estado: ticket.isWinner = true
```

**Costo Chainlink**: $1.00 USD por sorteo (pagamos nosotros con LINK)

---

### 3️⃣ USUARIO GANA Y HACE CLAIM

```
FRONTEND:
1. Usuario ve notificación: "🎉 YOU WON!"
   ↓
2. Click "CLAIM PRIZE"
   ↓
BLOCKCHAIN (BASE):
3. Smart contract verifica:
   - ✅ Usuario es ganador
   - ✅ No ha claimed antes
   - ✅ Sorteo está cerrado
   ↓
4. Smart contract calcula premio:
   - Tier 5+1 (jackpot) = 50% del pool
   - Ej: 0.05 cbBTC + 0.2 wETH + 100 JUP
   ↓
5. Smart contract TRANSFIERE directo a Privy wallet:
   transfer(vault.cbBTC, user.wallet, 0.05 cbBTC)
   transfer(vault.wETH, user.wallet, 0.2 wETH)
   transfer(vault.token, user.wallet, 100 JUP)
   ↓
6. Usuario recibe en Privy wallet:
   ✅ 0.05 cbBTC (wrapped Bitcoin en BASE)
   ✅ 0.2 wETH (wrapped Ethereum en BASE)
   ✅ 100 JUP (token del mes)
```

**Gas cost**: ~$0.015 USD (usuario paga)

---

### 4️⃣ USUARIO QUIERE CONVERTIR cbBTC → Otra cosa

#### OPCIÓN A: Usuario swappea cbBTC → USDC (manual en Privy)

```
PROBLEMA: Privy NO tiene swap integrado ❌

SOLUCIÓN: Integramos UI de Uniswap en nuestro frontend

FLUJO:
1. Usuario en dashboard ve: "You have 0.05 cbBTC"
   ↓
2. Click "SWAP TO USDC"
   ↓
3. Modal aparece con Uniswap widget integrado:
   ┌────────────────────────────────────┐
   │ Swap cbBTC → USDC                  │
   │                                    │
   │ From: 0.05 cbBTC                   │
   │ To:   ~$5,400 USDC                 │
   │                                    │
   │ Fee: ~$2.50 (0.05%)                │
   │ Slippage: 0.5%                     │
   │                                    │
   │ [SWAP NOW]                         │
   └────────────────────────────────────┘
   ↓
4. Usuario approve + swap via Uniswap
   ↓
5. Usuario ahora tiene USDC en Privy wallet
   ↓
6. Usuario puede:
   - Enviar USDC a Coinbase
   - Usar USDC en otras apps
   - Guardar USDC
```

#### OPCIÓN B: Nosotros integramos link directo a exchange

```
FLUJO SIMPLE:
1. Usuario click "SEND TO COINBASE"
   ↓
2. Tutorial aparece:
   ┌────────────────────────────────────┐
   │ Send cbBTC to Coinbase             │
   │                                    │
   │ 1. Copy your Coinbase deposit      │
   │    address for BASE network        │
   │                                    │
   │ 2. Paste here:                     │
   │    [0x...] 📋                      │
   │                                    │
   │ 3. We'll send your cbBTC           │
   │    Coinbase will show it as BTC    │
   │                                    │
   │ [SEND NOW]                         │
   └────────────────────────────────────┘
   ↓
3. Transferimos cbBTC a Coinbase
   ↓
4. Coinbase acepta cbBTC en BASE ✅
   ↓
5. Usuario puede vender por USD en Coinbase
```

---

## 🏦 TREASURY WALLET - SETUP REAL

### Qué necesita Treasury Wallet:

```
1. ETH (para gas fees en BASE)
   - Admin operations
   - Emergency withdrawals
   - Contract upgrades

2. LINK tokens (para Chainlink VRF)
   - Fondear subscription
   - ~$34/mes para dual lottery
```

### Cómo fondeamos Treasury:

```
PASO 1: Crear Treasury wallet
- Usar Privy (embedded) o MetaMask
- Guardar private key en vault seguro

PASO 2: Fondear con ETH
- Comprar $100 USD de ETH en Coinbase
- Enviar a Treasury wallet en BASE

PASO 3: Comprar LINK tokens
- Ir a Uniswap en BASE
- Swap $50 USD de ETH → LINK
- Ahora tenemos ~$50 de LINK

PASO 4: Fondear Chainlink subscription
- Crear subscription en Chainlink
- Depositar LINK a subscription
- Link subscription a smart contract
```

### Flujo mensual:

```
Mes 1:
- Treasury tiene $50 LINK
- Chainlink consume $34 LINK en sorteos
- Sobran $16 LINK
- Refondeamos con $20 LINK

Mes 2:
- Treasury tiene $36 LINK ($16 + $20)
- Chainlink consume $34 LINK
- Sobran $2 LINK
- ...
```

---

## 💡 PROPUESTA: Swap Helper para Usuarios

### Concepto: Ayudar a usuarios a convertir wrapped → USDC/fiat

#### OPCIÓN A: Integrar Uniswap Widget

```tsx
// app/components/SwapHelper.tsx

import { SwapWidget } from '@uniswap/widgets'

export function SwapHelper({ userWallet }: { userWallet: string }) {
  return (
    <div className="swap-container">
      <h2>Convert your prizes to USDC</h2>

      <SwapWidget
        provider={privy.provider} // Privy provider
        defaultInputTokenAddress={CBBTC_ADDRESS} // cbBTC en BASE
        defaultOutputTokenAddress={USDC_ADDRESS} // USDC en BASE
        defaultInputAmount="0.05"
      />

      <Tutorial>
        <h3>After swapping to USDC:</h3>
        <ul>
          <li>✅ Send to Coinbase → Sell for USD</li>
          <li>✅ Send to Binance → Trade</li>
          <li>✅ Keep in wallet → Use in DeFi</li>
        </ul>
      </Tutorial>
    </div>
  )
}
```

**Ventajas**:
- ✅ Usuario hace swap EN NUESTRA APP (no sale)
- ✅ Privy wallet ya conectada (1 click)
- ✅ Uniswap widget oficial (seguro)

**Desventajas**:
- ⚠️ Usuario paga swap fee (~$2-5)
- ⚠️ Slippage en premios grandes

---

#### OPCIÓN B: Link directo a Coinbase con tutorial

```tsx
// app/components/CashOutHelper.tsx

export function CashOutHelper({ prize }) {
  return (
    <div className="cashout-options">
      <h2>How to cash out your prizes</h2>

      <Option recommended>
        <Icon>🏦</Icon>
        <Title>Send to Coinbase (Recommended)</Title>
        <Description>
          Coinbase accepts cbBTC on BASE network.
          You can sell for USD immediately.
        </Description>

        <Steps>
          1. Open Coinbase → Deposit → Bitcoin
          2. Select "BASE" network
          3. Copy deposit address
          4. Come back and paste here:
             [Address input]
          5. Click "Send Prize"
        </Steps>

        <Button onClick={sendToCoinbase}>
          SEND TO COINBASE
        </Button>
      </Option>

      <Option>
        <Icon>💱</Icon>
        <Title>Swap to USDC first</Title>
        <Description>
          Convert to USDC, then send anywhere.
        </Description>

        <Button onClick={openSwapWidget}>
          SWAP TO USDC
        </Button>
      </Option>
    </div>
  )
}
```

---

## 🔧 IMPLEMENTACIÓN: Fondeamos Chainlink con LINK

### PASO 1: Setup Treasury Wallet

```typescript
// lib/treasury.ts

export const TREASURY_CONFIG = {
  // Treasury wallet address (nuestra)
  address: '0xYourTreasuryAddress',

  // Chainlink VRF Subscription ID
  subscriptionId: 123,

  // Tokens en Treasury
  eth_balance: 0.05, // Para gas
  link_balance: 50,   // Para VRF
}

// Función para verificar balance LINK
export async function checkLinkBalance() {
  const linkContract = new ethers.Contract(
    LINK_TOKEN_ADDRESS,
    LINK_ABI,
    provider
  )

  const balance = await linkContract.balanceOf(TREASURY_CONFIG.address)

  if (balance < ethers.utils.parseEther('30')) {
    // Alert: Necesitamos refondear
    console.warn('⚠️ Low LINK balance! Need to refund.')
  }
}
```

---

### PASO 2: Fondear Chainlink Subscription

```typescript
// scripts/fund-chainlink.ts

import { ethers } from 'ethers'

async function fundChainlinkSubscription() {
  const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL)
  const wallet = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider)

  // LINK token contract en BASE
  const linkToken = new ethers.Contract(
    LINK_TOKEN_ADDRESS_BASE,
    LINK_ABI,
    wallet
  )

  // VRF Coordinator contract
  const coordinator = new ethers.Contract(
    VRF_COORDINATOR_ADDRESS_BASE,
    VRF_COORDINATOR_ABI,
    wallet
  )

  // Fondear con 50 LINK
  const amount = ethers.utils.parseEther('50') // 50 LINK

  // 1. Approve LINK to coordinator
  await linkToken.approve(VRF_COORDINATOR_ADDRESS_BASE, amount)

  // 2. Fund subscription
  await coordinator.fundSubscription(
    SUBSCRIPTION_ID, // Nuestra subscription
    amount
  )

  console.log('✅ Funded Chainlink subscription with 50 LINK')
}

// Ejecutar mensualmente
fundChainlinkSubscription()
```

---

### PASO 3: CRON Job para verificar balance

```typescript
// app/api/cron/check-link-balance/route.ts

export async function GET(request: Request) {
  // Verificar auth
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check LINK balance en subscription
  const balance = await getSubscriptionBalance(SUBSCRIPTION_ID)

  const linkInUSD = balance * LINK_PRICE // ~$15/LINK

  if (linkInUSD < 30) {
    // Enviar alerta
    await sendAlert({
      type: 'LOW_LINK_BALANCE',
      balance: linkInUSD,
      message: '⚠️ Need to refund Chainlink subscription!',
      action: 'Add more LINK to subscription'
    })
  }

  return Response.json({
    success: true,
    balance_link: balance,
    balance_usd: linkInUSD
  })
}
```

**Vercel CRON**: Ejecuta cada semana para verificar balance.

---

## ✅ RESUMEN FINAL - SIN MENTIRAS

### Sistema Completo:

```
1. USUARIO COMPRA TICKET:
   - Paga en ETH via Privy wallet
   - Smart contract swappea a cbBTC + wETH + token
   - Todo guardado en smart contract vaults
   - Costo: $0.008 gas (usuario paga)

2. SORTEO (CHAINLINK VRF):
   - CRON trigger → Smart contract request
   - Chainlink genera números random
   - Consume LINK de nuestra subscription
   - Costo: $1.00 LINK (nosotros pagamos)

3. USUARIO GANA:
   - Hace claim via smart contract
   - Recibe cbBTC + wETH + token en Privy wallet
   - Costo: $0.015 gas (usuario paga)

4. USUARIO CONVIERTE A CASH:
   OPCIÓN A: Swap cbBTC → USDC en Uniswap (integrado)
   OPCIÓN B: Enviar cbBTC a Coinbase → Vender por USD
```

### Costos Reales:

```
USUARIO paga:
- Compra ticket: $0.008
- Claim premio: $0.015
Total: ~$0.023 por ciclo completo

NOSOTROS pagamos:
- Chainlink VRF: $34/mes (LINK)
- Treasury gas: ~$5/mes (ETH)
Total: ~$39/mes
```

### Criptos Involucradas:

```
USUARIO maneja:
- ETH (para pagar tickets y gas)
- cbBTC (premio en wrapped Bitcoin)
- wETH (premio en wrapped Ethereum)
- Token del mes (premio en token votado)
- USDC (si swappea)

NOSOTROS (Treasury) manejamos:
- ETH (para gas fees admin)
- LINK (para pagar Chainlink VRF)
```

---

## 🔗 FUENTES REALES

1. **Privy networks**: https://www.privy.io/ + web search
2. **Chainlink VRF billing**: https://docs.chain.link/vrf/v2-5/billing
3. **Chainlink BASE support**: https://docs.chain.link/vrf/v2-5/supported-networks
4. **BASE fees**: https://docs.base.org/base-chain/network-fees

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Crear Treasury wallet
2. ✅ Comprar LINK tokens (~$50)
3. ✅ Crear Chainlink VRF subscription
4. ✅ Fondear subscription con LINK
5. ✅ Integrar Uniswap widget para swaps
6. ✅ Implementar "Send to Coinbase" helper

**¿Procedemos con la implementación, socio?** 🚀

---

**Sin más mentiras. Este es el flujo REAL.** ✅
