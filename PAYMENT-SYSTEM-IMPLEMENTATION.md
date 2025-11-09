# 💳 SISTEMA DE PAGOS HÍBRIDO - Análisis y Plan de Implementación

**Fecha**: 2025-10-27
**Blockchain**: BASE (Ethereum L2)
**Wallet**: Privy (embedded wallets)
**Objetivo**: Aceptar pagos en crypto (USDC, USDT, DAI) Y tarjeta de crédito/débito

---

## 📊 ANÁLISIS COMPLETO DEL ESTADO ACTUAL

### ✅ LO QUE YA EXISTE

#### 1. **Smart Contract MVP** (`/contracts-mvp/src/LotteryMVP.sol`)
**Status**: ✅ Compilado y testeado (15 tests passing)

**Características actuales**:
- ✅ Acepta ETH como pago ($0.25/ticket)
- ✅ Integra Chainlink VRF para randomness
- ✅ 6 tiers de premios
- ✅ Límites de seguridad (1000 tickets, $10K max prize pool)
- ⚠️ **NO soporta stablecoins** (USDC, USDT, DAI)

**Código relevante**:
```solidity
uint256 public constant TICKET_PRICE = 0.00015625 ether; // ~$0.25
function buyTicket(uint8[5] calldata _numbers, uint8 _powerNumber)
    external payable {
    require(msg.value == TICKET_PRICE, "Wrong ETH amount");
    // ... rest of logic
}
```

#### 2. **Frontend con Privy** (`/web/app/page.tsx`)
**Status**: ✅ Funcional con auth y wallet connect

**Características actuales**:
- ✅ Privy authentication (email, Google, wallet)
- ✅ Bulk purchase (hasta 50,000 tickets)
- ✅ Cart system
- ⚠️ **NO tiene integración de pagos** - actualmente MOCK
- ⚠️ **NO tiene Privy Funding** configurado

#### 3. **Backend APIs** (`/web/app/api/`)
**Status**: ✅ Funcionando con Supabase

**Características actuales**:
- ✅ `/api/tickets/purchase` - Registra tickets en DB (MOCK payment)
- ✅ `/api/cron/*` - Sistema automatizado de draws
- ✅ Dual lottery system (daily + weekly)
- ✅ Sistema de votación de token del mes
- ⚠️ **NO valida pagos reales on-chain**

### ❌ LO QUE FALTA

1. **Smart contract NO acepta stablecoins** - Solo ETH
2. **Frontend NO tiene UI de pago** - No hay botón "Pay with Card" ni selector de token
3. **Privy Funding NO configurado** - No hay integración con MoonPay/Coinbase Onramp
4. **Backend NO verifica transacciones** - No valida que el pago se hizo on-chain

---

## 🔍 INVESTIGACIÓN: PRIVY FUNDING

### ✅ CAPACIDADES CONFIRMADAS

**Fuente**: https://docs.privy.io/guide/react/wallets/usage/funding/configuration

#### 1. **Payment Methods Soportados** ✅
- ✅ Credit/Debit Cards
- ✅ Apple Pay
- ✅ Google Pay
- ✅ Bank Transfer (ACH)

#### 2. **Providers Disponibles** ✅
Privy integra con:
- ✅ **MoonPay** (default)
- ✅ **Coinbase Onramp**
- ✅ Ramp
- ✅ Sardine
- ✅ Stripe
- ✅ Onramper
- ✅ Poko

**Privy automáticamente selecciona el mejor provider** según:
- Método de pago del usuario
- Ubicación geográfica
- Token que quiere comprar

#### 3. **Tokens Soportados** ✅
- ✅ **USDC** (confirmado en docs)
- ✅ **ETH**
- ⚠️ **USDT** - Soportado via MoonPay/Coinbase pero no explícitamente mencionado en Privy docs
- ⚠️ **DAI** - Soportado via MoonPay/Coinbase pero no explícitamente mencionado en Privy docs

**IMPORTANTE**: Privy permite configurar **cualquier ERC-20** que el provider soporte.

#### 4. **Blockchains Soportados** ✅
- ✅ **BASE** (confirmado explícitamente)
- ✅ Ethereum mainnet
- ✅ Arbitrum
- ✅ Polygon
- ✅ Optimism
- ✅ Solana

#### 5. **Cómo Funciona** ✅

```typescript
// Configuración en Privy Dashboard
// O via código:
import { useFundWallet } from '@privy-io/react-auth';

const { fundWallet } = useFundWallet();

// Trigger funding modal
fundWallet(walletAddress, {
  chain: 'base', // BASE network
  asset: 'USDC', // Token a comprar
  amount: '0.25' // Amount en USD
});
```

**Flujo**:
1. Usuario click "Buy with Card"
2. Privy modal aparece con MoonPay/Coinbase
3. Usuario paga con tarjeta ($0.25 USD)
4. Provider compra USDC en BASE
5. Envía USDC a Privy wallet del usuario
6. Usuario ya tiene USDC en su wallet
7. Usuario aprueba USDC al smart contract
8. Usuario compra ticket con USDC

---

## 🎯 ARQUITECTURA PROPUESTA: SISTEMA HÍBRIDO

### **OPCIÓN A: Privy Funding + Stablecoin Payments** (RECOMENDADO)

```
┌─────────────────────────────────────────────────────────────────┐
│                       USUARIO                                   │
│                                                                 │
│  ┌─────────────────┐         ┌─────────────────┐              │
│  │  YA TIENE CRYPTO│         │  COMPRA CON CARD│              │
│  │  (USDC/USDT/DAI)│         │  (Privy Funding)│              │
│  └────────┬────────┘         └────────┬────────┘              │
└───────────┼─────────────────────────────┼──────────────────────┘
            │                             │
            │                             ↓
            │                   ┌─────────────────────┐
            │                   │  MOONPAY/COINBASE  │
            │                   │  User pays $0.25   │
            │                   │  Gets USDC in BASE │
            │                   └──────────┬──────────┘
            │                              │
            └──────────────┬───────────────┘
                           │
                           ↓
                  ┌────────────────────┐
                  │   PRIVY WALLET     │
                  │   (Embedded)       │
                  │                    │
                  │  Balance:          │
                  │  - USDC: $1.25     │
                  │  - USDT: $5.00     │
                  │  - DAI: $10.00     │
                  │  - ETH: 0.01       │
                  └─────────┬──────────┘
                            │
                            ↓
                  ┌────────────────────┐
                  │  APPROVE TOKEN     │
                  │  to Smart Contract │
                  └─────────┬──────────┘
                            │
                            ↓
                  ┌────────────────────┐
                  │  SMART CONTRACT    │
                  │  (BASE)            │
                  │                    │
                  │  buyTicket(        │
                  │    token: USDC,    │
                  │    amount: 0.25    │
                  │  )                 │
                  └─────────┬──────────┘
                            │
                            ↓
                  ┌────────────────────┐
                  │  SWAP to PRIZES    │
                  │  (via Uniswap)     │
                  │                    │
                  │  70% → cbBTC       │
                  │  25% → wETH        │
                  │  5% → Token Mes    │
                  └────────────────────┘
```

#### **Ventajas**:
- ✅ Usuario puede usar crypto que ya tiene
- ✅ Usuario puede comprar con tarjeta (via Privy Funding)
- ✅ Flexibilidad: acepta USDC, USDT, DAI
- ✅ Privy maneja la complejidad del onramp
- ✅ Smart contract hace swaps automáticos

#### **Desventajas**:
- ⚠️ Requiere 2 transacciones si compra con tarjeta: (1) Buy USDC, (2) Buy ticket
- ⚠️ Usuario necesita ETH para gas fees (~$0.01)
- ⚠️ Más complejo de implementar

---

### **OPCIÓN B: Solo ETH + Privy Funding** (MÁS SIMPLE)

```
┌─────────────────────────────────────────────────────────────────┐
│                       USUARIO                                   │
│                                                                 │
│  ┌─────────────────┐         ┌─────────────────┐              │
│  │  YA TIENE ETH   │         │  COMPRA CON CARD│              │
│  │  en BASE        │         │  (Privy Funding)│              │
│  └────────┬────────┘         └────────┬────────┘              │
└───────────┼─────────────────────────────┼──────────────────────┘
            │                             │
            │                             ↓
            │                   ┌─────────────────────┐
            │                   │  MOONPAY/COINBASE  │
            │                   │  User pays $0.50   │
            │                   │  Gets ETH in BASE  │
            │                   │  (~$0.25 + gas)    │
            │                   └──────────┬──────────┘
            │                              │
            └──────────────┬───────────────┘
                           │
                           ↓
                  ┌────────────────────┐
                  │   PRIVY WALLET     │
                  │   (Embedded)       │
                  │                    │
                  │  Balance:          │
                  │  - ETH: 0.05       │
                  └─────────┬──────────┘
                            │
                            ↓
                  ┌────────────────────┐
                  │  SMART CONTRACT    │
                  │  (BASE)            │
                  │                    │
                  │  buyTicket()       │
                  │  payable ETH       │
                  └─────────┬──────────┘
                            │
                            ↓
                  ┌────────────────────┐
                  │  SWAP to PRIZES    │
                  │  (via Uniswap)     │
                  │                    │
                  │  70% → cbBTC       │
                  │  25% → wETH        │
                  │  5% → Token Mes    │
                  └────────────────────┘
```

#### **Ventajas**:
- ✅ MÁS SIMPLE de implementar
- ✅ Solo 1 transacción
- ✅ Smart contract YA funciona (solo acepta ETH)
- ✅ ETH cubre tickets + gas fees
- ✅ Frontend más simple

#### **Desventajas**:
- ❌ Solo acepta ETH (no stablecoins)
- ⚠️ Usuario paga volatilidad de ETH
- ⚠️ Menos flexible

---

## 🏆 RECOMENDACIÓN FINAL

### **Implementar OPCIÓN A (Stablecoins + Privy Funding)**

**Por qué**:
1. **Usuarios prefieren stablecoins** - Precio estable, no volatilidad
2. **Más opciones = más conversión** - USDC, USDT, DAI son más usados que ETH para pagos
3. **Privy lo hace fácil** - Ellos manejan toda la complejidad del onramp
4. **BASE tiene fees bajísimos** - El costo de 2 transacciones es mínimo (~$0.02 total)
5. **Escalable** - Podemos agregar más tokens en el futuro

**Trade-off aceptable**: 2 transacciones en vez de 1, pero mejor UX general.

---

## 📋 PLAN DE IMPLEMENTACIÓN (5 FASES)

### **FASE 1: Actualizar Smart Contract** (2-3 días)

#### Tarea 1.1: Agregar soporte para ERC-20 tokens

**Archivo**: `/contracts-mvp/src/LotteryMVP.sol`

**Cambios**:
```solidity
// AGREGAR: Import IERC20
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// AGREGAR: Direcciones de tokens en BASE
address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
address public constant USDT = 0x...; // TODO: Get BASE address
address public constant DAI = 0x...;  // TODO: Get BASE address

// MODIFICAR: buyTicket para aceptar token
function buyTicketWithToken(
    uint8[5] calldata _numbers,
    uint8 _powerNumber,
    address _token,  // NUEVO: USDC, USDT, o DAI
    uint256 _amount  // NUEVO: amount en decimales del token
) external nonReentrant whenNotPaused {
    // Validar token aceptado
    require(
        _token == USDC || _token == USDT || _token == DAI,
        "Token not accepted"
    );

    // Validar amount (ajustar por decimales)
    uint256 expectedAmount = TICKET_PRICE_USD; // $0.25 en unidades del token
    require(_amount == expectedAmount, "Wrong amount");

    // Transferir tokens del usuario al contrato
    IERC20(_token).transferFrom(msg.sender, address(this), _amount);

    // Swap a prize pool tokens (cbBTC, wETH, token del mes)
    _swapToBTC(_token, _amount * 70 / 100);
    _swapToETH(_token, _amount * 25 / 100);
    _swapToMonthToken(_token, _amount * 5 / 100);

    // ... rest of ticket creation logic (igual que antes)
}

// AGREGAR: Swap functions usando Uniswap
function _swapToBTC(address fromToken, uint256 amount) internal {
    // Approve token to Uniswap router
    IERC20(fromToken).approve(UNISWAP_ROUTER, amount);

    // Swap via Uniswap (simplified - use actual Uniswap interface)
    // ...
}

// MANTENER: buyTicket con ETH (backward compatibility)
function buyTicket(
    uint8[5] calldata _numbers,
    uint8 _powerNumber
) external payable nonReentrant whenNotPaused {
    // ... existing ETH logic
}
```

#### Tarea 1.2: Testing del nuevo contract

```bash
cd /Users/albertosorno/crypto-lotto/contracts-mvp

# Write tests
forge test -vv

# Verificar que pasan:
# - buyTicketWithToken (USDC)
# - buyTicketWithToken (USDT)
# - buyTicketWithToken (DAI)
# - buyTicket (ETH) - backward compatibility
```

#### Tarea 1.3: Deploy a BASE Sepolia (testnet)

```bash
# Get testnet tokens
# - ETH (faucet)
# - USDC testnet
# - USDT testnet
# - DAI testnet

# Deploy
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC --broadcast

# Verify
forge verify-contract <ADDRESS> --chain base-sepolia
```

**Entregables**:
- ✅ LotteryMVP.sol con soporte multi-token
- ✅ Tests passing (20+ tests)
- ✅ Deployed a BASE Sepolia
- ✅ Contract verified en Basescan

---

### **FASE 2: Configurar Privy Funding** (1 día)

#### Tarea 2.1: Habilitar Privy Funding en Dashboard

1. Ir a https://dashboard.privy.io
2. Seleccionar tu proyecto
3. Settings → Funding
4. Enable "Fiat On-Ramp"
5. Configurar:
   - **Provider**: MoonPay (default)
   - **Chains**: BASE
   - **Assets**: USDC, ETH
   - **Min/Max amounts**: $0.25 - $1000

#### Tarea 2.2: Instalar dependencias

```bash
cd /Users/albertosorno/crypto-lotto/web

# Ya instalado: @privy-io/react-auth ^3.4.1
# Verificar que está actualizado
npm install @privy-io/react-auth@latest
```

#### Tarea 2.3: Crear hook personalizado

**Archivo**: `/web/lib/hooks/useFundWallet.ts`

```typescript
import { useFundWallet as usePrivyFundWallet } from '@privy-io/react-auth';

export function useFundWallet() {
  const { fundWallet } = usePrivyFundWallet();

  const fundForTicket = async (walletAddress: string, token: 'USDC' | 'USDT' | 'DAI' | 'ETH') => {
    await fundWallet(walletAddress, {
      chain: 'base',
      asset: token,
      // Privy calculará el amount basado en el token
    });
  };

  return { fundForTicket };
}
```

**Entregables**:
- ✅ Privy Funding habilitado en dashboard
- ✅ Hook `useFundWallet` creado
- ✅ Testear manualmente que modal aparece

---

### **FASE 3: Crear UI de Pagos** (2-3 días)

#### Tarea 3.1: Componente de selección de método de pago

**Archivo**: `/web/app/components/PaymentMethodSelector.tsx`

```typescript
'use client';

import { useState } from 'react';

type PaymentMethod = 'crypto' | 'card';
type TokenType = 'USDC' | 'USDT' | 'DAI' | 'ETH';

interface Props {
  onPaymentMethodChange: (method: PaymentMethod, token?: TokenType) => void;
}

export function PaymentMethodSelector({ onPaymentMethodChange }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('crypto');
  const [selectedToken, setSelectedToken] = useState<TokenType>('USDC');

  const handleMethodChange = (newMethod: PaymentMethod) => {
    setMethod(newMethod);
    onPaymentMethodChange(newMethod, newMethod === 'crypto' ? selectedToken : undefined);
  };

  const handleTokenChange = (token: TokenType) => {
    setSelectedToken(token);
    onPaymentMethodChange('crypto', token);
  };

  return (
    <div style={{
      background: 'rgba(0, 240, 255, 0.05)',
      border: '1px solid rgba(0, 240, 255, 0.3)',
      borderRadius: '20px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{
        marginBottom: '15px',
        color: '#00f0ff'
      }}>
        💳 Choose Payment Method
      </h3>

      {/* Payment Method Selection */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button
          onClick={() => handleMethodChange('crypto')}
          style={{
            flex: 1,
            padding: '15px',
            background: method === 'crypto'
              ? 'linear-gradient(135deg, #00f0ff, #0080ff)'
              : 'rgba(255, 255, 255, 0.1)',
            border: method === 'crypto'
              ? '2px solid #00f0ff'
              : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: method === 'crypto' ? 'bold' : 'normal'
          }}
        >
          <div>💎 Pay with Crypto</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
            Use USDC, USDT, or DAI
          </div>
        </button>

        <button
          onClick={() => handleMethodChange('card')}
          style={{
            flex: 1,
            padding: '15px',
            background: method === 'card'
              ? 'linear-gradient(135deg, #f59e0b, #f97316)'
              : 'rgba(255, 255, 255, 0.1)',
            border: method === 'card'
              ? '2px solid #f59e0b'
              : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: method === 'card' ? 'bold' : 'normal'
          }}
        >
          <div>💳 Pay with Card</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
            Credit/Debit, Apple/Google Pay
          </div>
        </button>
      </div>

      {/* Token Selection (only if crypto) */}
      {method === 'crypto' && (
        <div>
          <div style={{ marginBottom: '10px', opacity: 0.8 }}>
            Select Token:
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(['USDC', 'USDT', 'DAI'] as TokenType[]).map(token => (
              <button
                key={token}
                onClick={() => handleTokenChange(token)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: selectedToken === token
                    ? 'rgba(0, 240, 255, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedToken === token
                    ? '2px solid #00f0ff'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: selectedToken === token ? 'bold' : 'normal'
                }}
              >
                {token}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info boxes */}
      {method === 'crypto' && (
        <div style={{
          marginTop: '15px',
          padding: '12px',
          background: 'rgba(0, 240, 255, 0.1)',
          borderRadius: '10px',
          fontSize: '13px',
          opacity: 0.9
        }}>
          ℹ️ You'll need {selectedToken} in your wallet to complete the purchase.
          Gas fees: ~$0.01 in ETH
        </div>
      )}

      {method === 'card' && (
        <div style={{
          marginTop: '15px',
          padding: '12px',
          background: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '10px',
          fontSize: '13px',
          opacity: 0.9
        }}>
          ℹ️ We'll first fund your wallet with USDC, then purchase your tickets.
          Total time: ~2 minutes
        </div>
      )}
    </div>
  );
}
```

#### Tarea 3.2: Integrar en homepage

**Archivo**: `/web/app/page.tsx`

Agregar:
```typescript
import { PaymentMethodSelector } from './components/PaymentMethodSelector';
import { useFundWallet } from '@/lib/hooks/useFundWallet';

// Inside HomePage component:
const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'card'>('crypto');
const [selectedToken, setSelectedToken] = useState<'USDC' | 'USDT' | 'DAI' | 'ETH'>('USDC');
const { fundForTicket } = useFundWallet();

const handlePaymentChange = (method: 'crypto' | 'card', token?: TokenType) => {
  setPaymentMethod(method);
  if (token) setSelectedToken(token);
};

// In JSX, before cart section:
<PaymentMethodSelector onPaymentMethodChange={handlePaymentChange} />
```

#### Tarea 3.3: Actualizar lógica de compra

```typescript
const handlePurchase = async () => {
  if (!user || !walletAddress) {
    showToast('Please connect wallet first', 'error');
    return;
  }

  if (paymentMethod === 'card') {
    // FLOW 1: Buy with Card (Privy Funding)
    try {
      // Step 1: Fund wallet with USDC
      showToast('Opening payment modal...', 'info');
      await fundForTicket(walletAddress, 'USDC');

      // Wait for user to complete purchase (polling or event)
      showToast('Waiting for payment confirmation...', 'info');
      await waitForBalance(walletAddress, 'USDC', totalCost);

      // Step 2: Continue with normal purchase flow
      await purchaseWithCrypto('USDC');
    } catch (error) {
      showToast('Payment cancelled or failed', 'error');
    }
  } else {
    // FLOW 2: Pay with Crypto (Direct)
    await purchaseWithCrypto(selectedToken);
  }
};

const purchaseWithCrypto = async (token: TokenType) => {
  // 1. Check balance
  const balance = await checkTokenBalance(walletAddress, token);
  if (balance < totalCost) {
    showToast(`Insufficient ${token} balance`, 'error');
    return;
  }

  // 2. Approve token to smart contract
  showToast(`Approving ${token}...`, 'info');
  await approveToken(token, LOTTERY_CONTRACT_ADDRESS, totalCost);

  // 3. Buy tickets
  showToast('Buying tickets...', 'info');
  const tx = await lotteryContract.buyTicketWithToken(
    numbers,
    powerNumber,
    getTokenAddress(token),
    totalCostInTokenUnits
  );

  await tx.wait();

  // 4. Record in Supabase
  await fetch('/api/tickets/purchase', {
    method: 'POST',
    body: JSON.stringify({
      tickets: cart,
      walletAddress,
      txHash: tx.hash,
      token
    })
  });

  showToast('✅ Tickets purchased successfully!', 'success');
  setCart([]);
};
```

**Entregables**:
- ✅ PaymentMethodSelector component
- ✅ Integrado en homepage
- ✅ Lógica de compra con ambos métodos
- ✅ Validaciones y loading states

---

### **FASE 4: Integración con Smart Contract** (2 días)

#### Tarea 4.1: Crear hooks de Web3

**Archivo**: `/web/lib/hooks/useContract.ts`

```typescript
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import LotteryABI from '@/contracts/LotteryMVP.json';

const LOTTERY_ADDRESS = process.env.NEXT_PUBLIC_LOTTERY_CONTRACT;
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
// ... other token addresses

export function useContract() {
  const { user, getEthersProvider } = usePrivy();

  const getLotteryContract = async () => {
    const provider = await getEthersProvider();
    const signer = provider.getSigner();
    return new ethers.Contract(LOTTERY_ADDRESS, LotteryABI, signer);
  };

  const getTokenContract = async (token: 'USDC' | 'USDT' | 'DAI') => {
    const provider = await getEthersProvider();
    const signer = provider.getSigner();

    const tokenAddress = {
      USDC: USDC_ADDRESS,
      USDT: USDT_ADDRESS,
      DAI: DAI_ADDRESS
    }[token];

    return new ethers.Contract(
      tokenAddress,
      ['function approve(address spender, uint256 amount) returns (bool)'],
      signer
    );
  };

  const checkTokenBalance = async (address: string, token: string) => {
    // Implementation
  };

  const approveToken = async (token: string, spender: string, amount: string) => {
    const tokenContract = await getTokenContract(token);
    const tx = await tokenContract.approve(spender, ethers.utils.parseUnits(amount, 6)); // USDC has 6 decimals
    await tx.wait();
  };

  const buyTicketWithToken = async (
    numbers: number[],
    powerNumber: number,
    token: string,
    amount: string
  ) => {
    const contract = await getLotteryContract();
    const tokenAddress = getTokenAddress(token);
    const amountInUnits = ethers.utils.parseUnits(amount, 6);

    const tx = await contract.buyTicketWithToken(
      numbers,
      powerNumber,
      tokenAddress,
      amountInUnits
    );

    return tx.wait();
  };

  return {
    checkTokenBalance,
    approveToken,
    buyTicketWithToken
  };
}
```

#### Tarea 4.2: Actualizar backend API

**Archivo**: `/web/app/api/tickets/purchase/route.ts`

Modificar para:
- Verificar que `txHash` existe en blockchain
- Validar que el pago fue con el token correcto
- Validar el amount correcto

```typescript
// Verificar transacción on-chain
const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
const receipt = await provider.getTransactionReceipt(txHash);

if (!receipt || receipt.status !== 1) {
  return Response.json({ error: 'Transaction failed' }, { status: 400 });
}

// Validar que fue a nuestro contract
if (receipt.to !== LOTTERY_CONTRACT_ADDRESS) {
  return Response.json({ error: 'Invalid contract' }, { status: 400 });
}

// Continue con insert a Supabase...
```

**Entregables**:
- ✅ useContract hook completo
- ✅ Backend API actualizado con validación on-chain
- ✅ Testing manual end-to-end

---

### **FASE 5: Testing & Polish** (2 días)

#### Test Cases a Cubrir

**Testnet (BASE Sepolia)**:
1. ✅ Comprar con USDC (tiene balance)
2. ✅ Comprar con USDT (tiene balance)
3. ✅ Comprar con DAI (tiene balance)
4. ✅ Comprar con tarjeta (Privy Funding → USDC → Ticket)
5. ✅ Intentar comprar sin balance (debe fallar)
6. ✅ Verificar tickets en Supabase
7. ✅ Verificar prizes se calculan correctamente
8. ✅ Bulk purchase con 100+ tickets
9. ✅ Testing de gas fees (~$0.02 total)

#### Polish UI

1. Loading states claros
2. Error messages específicos
3. Success animations
4. Transaction links (Basescan)
5. Token balances mostrados
6. Gas estimates

**Entregables**:
- ✅ Todos los test cases passing
- ✅ UI pulido con feedback visual
- ✅ Documentation actualizado
- ✅ Ready for mainnet

---

## 📊 COSTOS Y CONSIDERACIONES

### Costos para Usuario

**FLOW 1: Ya tiene USDC**
- Approve: ~$0.005 gas
- BuyTicket: ~$0.008 gas
- **Total: ~$0.013 (+ $0.25 ticket)**

**FLOW 2: Compra con tarjeta**
- Privy Funding fee: ~3% ($0.0075)
- Moonpay fee: ~4% ($0.01)
- Approve gas: ~$0.005
- BuyTicket gas: ~$0.008
- **Total: ~$0.28 ($0.25 + $0.03 fees)**

**FLOW 3: Ya tiene ETH** (Opción B)
- BuyTicket: ~$0.008 gas
- **Total: ~$0.008 (+ $0.25 ticket)**

### Costos para Nosotros (Operación)

**Chainlink VRF**:
- $34/mes (dual lottery)

**Infrastructure**:
- Vercel hosting: FREE (hobby)
- Supabase: FREE (hasta 500MB DB)
- Privy: FREE (hasta 1000 MAU)

**Total mensual**: ~$34

**A partir de 1000 usuarios**:
- Privy: $99/mes (hasta 10K MAU)
- Supabase: $25/mes (Pro)
- **Total: ~$158/mes**

---

## 🎯 TIMELINE ESTIMADO

```
SEMANA 1 (Días 1-3): Smart Contract
├─ Día 1: Agregar soporte multi-token
├─ Día 2: Testing + fixes
└─ Día 3: Deploy a testnet + verify

SEMANA 1 (Días 4-5): Privy Funding
├─ Día 4: Configurar Privy + crear hooks
└─ Día 5: Testing manual del funding

SEMANA 2 (Días 6-8): Frontend
├─ Día 6: PaymentMethodSelector component
├─ Día 7: Integrar en homepage + lógica de compra
└─ Día 8: Polish UI + loading states

SEMANA 2 (Días 9-10): Integración Web3
├─ Día 9: useContract hook + approval flow
└─ Día 10: Backend API validation

SEMANA 3 (Días 11-14): Testing & Launch
├─ Días 11-12: Testing exhaustivo en testnet
├─ Día 13: Fixes + polish
└─ Día 14: Deploy a mainnet + monitoring
```

**Total: ~3 semanas** (asumiendo trabajo full-time)

---

## ✅ DECISIONES FINALES

### ¿USDC, USDT, DAI - Todos o solo USDC?

**RECOMENDACIÓN**: **Empezar solo con USDC**, luego agregar USDT y DAI.

**Por qué**:
1. USDC es el más usado en BASE
2. Simplifica testing inicial
3. Privy Funding default es USDC
4. Podemos agregar USDT/DAI en 1-2 días después

**Plan**:
- MVP (Semana 3): Solo USDC
- Post-launch (Semana 4): + USDT
- Post-launch (Semana 5): + DAI

### ¿Privy Funding obligatorio o opcional?

**RECOMENDACIÓN**: **Opcional** - Mostrar ambas opciones.

**Por qué**:
1. Usuarios crypto-nativos prefieren usar lo que tienen
2. Nuevos usuarios prefieren tarjeta
3. Más opciones = más conversión
4. Costo de implementación es el mismo

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

**HOY (Sesión 1):**
1. ✅ Confirmar arquitectura con socio
2. ✅ Verificar addresses de USDC/USDT/DAI en BASE
3. ✅ Setup Foundry environment para smart contract
4. ✅ Crear branch `feature/payment-system`

**MAÑANA (Sesión 2):**
1. Start FASE 1: Smart Contract
2. Implementar `buyTicketWithToken()`
3. Testing básico

**Esta Semana:**
- Completar FASE 1 + FASE 2
- Testing en testnet
- Review con socio

---

## 📚 RECURSOS

### Token Addresses en BASE Mainnet
```
USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
USDT: 0x... (TODO: Verificar)
DAI: 0x...  (TODO: Verificar)
cbBTC: 0x... (Prize pool)
wETH: 0x4200000000000000000000000000000000000006
```

### Links Útiles
- Privy Docs: https://docs.privy.io/guide/react/wallets/usage/funding/configuration
- BASE Docs: https://docs.base.org/
- Uniswap V3: https://docs.uniswap.org/contracts/v3/overview
- Chainlink VRF: https://docs.chain.link/vrf/v2-5/supported-networks

---

**¿Procedemos con la implementación, socio? 🚀**

---

**Última actualización:** 2025-10-27
**Status:** ✅ PLAN COMPLETO - READY TO START
