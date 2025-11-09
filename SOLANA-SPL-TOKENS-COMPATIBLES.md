# 🟣 Tokens Compatibles con Solana Smart Contract

**Fecha**: 2025-10-22
**Blockchain**: Solana (SPL Token Standard)

---

## ✅ TOKENS 100% COMPATIBLES CON SOLANA

### 🪙 Wrapped Tokens (Bridged desde otras chains)

Estos tokens existen en otras blockchains pero tienen versiones **SPL** en Solana:

| Token | Símbolo | Tipo | Estado en Solana 2025 |
|-------|---------|------|------------------------|
| Wrapped Bitcoin | WBTC | Wrapped | ✅ Nativo (Coinbase cbBTC) - $1B+ TVL |
| Wrapped Ethereum | wETH | Wrapped | ✅ Disponible via Wormhole |
| Dogecoin | DOGE | Native Bridge | ✅ $35B supply nativo (Wormhole NTT) |

**Nota**: En 2025, WBTC y DOGE son **nativos en Solana** gracias a Wormhole Native Token Transfers (NTT).

---

### 🌟 Tokens NATIVOS de Solana (100% SPL)

Estos tokens nacieron en Solana y son **perfectos para nuestro smart contract**:

#### DeFi Tokens

| Token | Símbolo | Descripción | Market Cap Rank |
|-------|---------|-------------|-----------------|
| Jupiter | JUP | DEX Aggregator líder | Top 50 |
| Raydium | RAY | AMM/DEX | Top 100 |
| Orca | ORCA | DEX con mejor UX | Top 150 |
| Jito | JTO | Liquid staking + MEV | Top 100 |
| Pyth Network | PYTH | Oracle de precios | Top 100 |

#### Meme Coins (Súper Populares)

| Token | Símbolo | Descripción | Market Cap |
|-------|---------|-------------|------------|
| Bonk | BONK | Meme coin #1 de Solana | Top 100 |
| dogwifhat | WIF | Perro con gorro | Top 50 |
| Popcat | POPCAT | Meme cat | Top 150 |
| Fartcoin | FARTCOIN | Meme | Viral |

#### Stablecoins

| Token | Símbolo | Tipo |
|-------|---------|------|
| USD Coin | USDC | Stablecoin |
| Tether | USDT | Stablecoin |

---

## ❌ TOKENS NO COMPATIBLES DIRECTAMENTE

Estos tokens están en **otras blockchains** y NO tienen versión SPL:

| Token | Blockchain Original | ¿Compatible? |
|-------|---------------------|--------------|
| XRP | XRP Ledger | ❌ No hay bridge estable |
| ADA | Cardano | ❌ No hay versión SPL |
| AVAX | Avalanche | ⚠️ Posible via Wormhole (no verificado) |
| SHIB | Ethereum | ⚠️ Posible via Wormhole (bajo volumen) |
| DOT | Polkadot | ❌ No hay bridge |
| LINK | Ethereum | ⚠️ Posible via Wormhole (bajo volumen) |
| MATIC | Polygon | ⚠️ Posible via Wormhole (bajo volumen) |
| UNI | Ethereum | ⚠️ Posible via Wormhole (bajo volumen) |
| LTC | Litecoin | ❌ No hay bridge |
| NEAR | NEAR Protocol | ❌ No hay bridge confiable |
| APT | Aptos | ❌ Blockchain separado |
| ARB | Arbitrum (Ethereum L2) | ⚠️ Posible via Wormhole |
| FTM | Fantom | ❌ No hay bridge |
| AAVE | Ethereum | ⚠️ Posible via Wormhole (bajo volumen) |
| ATOM | Cosmos | ❌ No hay bridge directo |
| OP | Optimism (Ethereum L2) | ⚠️ Posible via Wormhole |
| INJ | Injective | ❌ Blockchain separado |
| PEPE | Ethereum | ⚠️ Posible via Wormhole (bajo volumen) |

**Problema**: Wormhole permite wrappear tokens de Ethereum, pero tokens con **bajo volumen** pueden tener poca liquidez en Solana.

---

## 🎯 RECOMENDACIÓN FINAL

### Lista Actualizada para el Sistema de Votación

**TIER 1: Wrapped Major Assets** (Siempre disponibles)
- ✅ WBTC (Wrapped Bitcoin) - Nativo en Solana
- ✅ wETH (Wrapped Ethereum) - Via Wormhole
- ✅ DOGE (Dogecoin) - Nativo en Solana

**TIER 2: Solana DeFi Blue Chips**
- ✅ JUP (Jupiter)
- ✅ RAY (Raydium)
- ✅ JTO (Jito)
- ✅ PYTH (Pyth Network)
- ✅ ORCA (Orca)

**TIER 3: Solana Meme Coins**
- ✅ BONK (Bonk)
- ✅ WIF (dogwifhat)
- ✅ POPCAT (Popcat)

**TIER 4: Stablecoins** (Por si acaso)
- ✅ USDC
- ✅ USDT

---

## 🚀 PROPUESTA MEJORADA: Bracket System v2.0

### Configuración con BTC Siempre Incluido

```
Cada mes se proponen 5 tokens para votación:

1. BTC (Wrapped Bitcoin) - SIEMPRE DISPONIBLE ⭐
2. 1 token de TIER 2 (DeFi) - rotación
3. 1 token de TIER 3 (Meme) - rotación
4. 1 token adicional (TIER 2 o wrapped) - rotación
5. 1 wildcard - rotación
```

### Ejemplo de Calendario

| Mes | BTC | DeFi (T2) | Meme (T3) | Adicional | Wildcard |
|-----|-----|-----------|-----------|-----------|----------|
| Ene | ✅ WBTC | JUP | BONK | wETH | USDC |
| Feb | ✅ WBTC | RAY | WIF | DOGE | PYTH |
| Mar | ✅ WBTC | JTO | POPCAT | wETH | ORCA |
| Abr | ✅ WBTC | PYTH | BONK | DOGE | JUP |
| May | ✅ WBTC | ORCA | WIF | wETH | RAY |

**BTC SIEMPRE está como opción** - Si gana, el 5% del prize pool será 100% BTC (en lugar de 70% BTC + 5% otro token).

---

## 💡 ALTERNATIVA: Prize Pool Dinámico

Si BTC gana la votación:

```
Premio del mes si gana BTC:
- 75% BTC (70% base + 5% extra)
- 25% ETH

Premio del mes si gana otro token (ej: JUP):
- 70% BTC
- 25% ETH
- 5% JUP
```

---

## 🛠️ TOKENS A USAR EN PRODUCCIÓN

### ✅ Recomendados (Alta Liquidez + SPL Nativo)

1. **WBTC** - cbBTC de Coinbase ($1B+ TVL)
2. **wETH** - Via Wormhole
3. **DOGE** - Nativo via Wormhole NTT
4. **JUP** - DeFi líder de Solana
5. **RAY** - AMM con más volumen
6. **BONK** - Meme coin #1
7. **WIF** - Meme coin top 50
8. **JTO** - Liquid staking
9. **PYTH** - Oracle network
10. **ORCA** - DEX con mejor UX

### ⚠️ Usar con Precaución (Wrapped vía Wormhole, menor liquidez)

- LINK, MATIC, UNI, AAVE, PEPE, SHIB, ARB, OP

### ❌ NO Usar (No compatible con Solana)

- XRP, ADA, AVAX, DOT, LTC, NEAR, APT, FTM, ATOM, INJ

---

## 📊 ESTADÍSTICAS 2025

**Wrapped Bitcoin en Solana**:
- TVL: $1B+
- Crecimiento: 5 meses consecutivos
- DEX pools: Raydium, Orca, Phoenix

**Dogecoin en Solana**:
- Supply total: $35B nativamente bridged
- Volume: $4.1B en un día (récord)
- Slippage: <10 bps en trades de $100K

**Solana DeFi Ecosystem**:
- JUP: DEX aggregator #1
- RAY: Beneficiado por volumen on-chain alto
- JTO: MEV rewards + governance

---

## 🎯 DECISIÓN FINAL

**Tokens 100% Seguros para Smart Contract**:

```typescript
const SOLANA_COMPATIBLE_TOKENS = [
  // Wrapped (con alta liquidez)
  'WBTC',  // cbBTC de Coinbase
  'wETH',  // Wormhole
  'DOGE',  // Wormhole NTT

  // Solana Native DeFi
  'JUP',   // Jupiter
  'RAY',   // Raydium
  'JTO',   // Jito
  'PYTH',  // Pyth Network
  'ORCA',  // Orca

  // Solana Meme Coins
  'BONK',  // Bonk
  'WIF',   // dogwifhat
  'POPCAT', // Popcat

  // Stablecoins
  'USDC',
  'USDT',
];
```

**Total**: 14 tokens completamente funcionales en Solana 🎉

---

## 🚨 IMPORTANTE PARA SMART CONTRACT

### Addresses de Tokens SPL

Cuando implementes el smart contract en Solana, necesitarás los **Mint Addresses** oficiales:

```rust
// Ejemplo de addresses (verificar en producción)
pub const WBTC_MINT: &str = "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh"; // cbBTC
pub const DOGE_MINT: &str = "...", // Wormhole DOGE
pub const JUP_MINT: &str = "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
pub const RAY_MINT: &str = "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
pub const BONK_MINT: &str = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
// ... etc
```

**Fuente oficial**: https://solscan.io o https://solana.fm

---

**Última actualización**: 2025-10-22
**Próximo paso**: Implementar Bracket System v2.0 con BTC siempre incluido
