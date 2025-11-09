# 🎁 Flujo de Claim de Premio - Perspectiva del Usuario

**Pregunta clave**: ¿Qué recibe el usuario y cómo lo reclama?

---

## 🎯 OPCIÓN 1: Auto-Swap a Token Nativo (RECOMENDADA)

### Concepto: Usuario Recibe Token "Normal" Automáticamente

**Lo que pasa detrás de escenas**:

```
1. Usuario gana 0.05 BTC en el jackpot
   ↓
2. Smart contract tiene 0.05 cbBTC (wrapped)
   ↓
3. Usuario hace click en "CLAIM PRIZE"
   ↓
4. Bot automático hace:
   a) Toma 0.05 cbBTC del vault
   b) Lo swappea en Raydium/Jupiter → BTC nativo
   c) Envía BTC nativo a wallet del usuario
   ↓
5. Usuario recibe BTC REAL en su wallet de Bitcoin
```

### Ventajas:
- ✅ **Usuario recibe BTC REAL** (no wrapped)
- ✅ **Cero pasos extra** (todo automático)
- ✅ **Cero fricción** (click y listo)
- ✅ **Funciona con cualquier wallet** (Phantom, Ledger, etc.)

### Desventajas:
- ⚠️ **Costo de swap**: ~$0.50-$5 por premio (nosotros pagamos)
- ⚠️ **Slippage**: En premios grandes (>$10K) podría haber pérdida del 0.1-0.5%

---

## 🎯 OPCIÓN 2: Usuario Recibe Wrapped + Tutorial Simple

### Concepto: Usuario Recibe Wrapped pero con Guía Paso a Paso

**Flujo del usuario**:

```
1. Usuario gana 0.05 BTC
   ↓
2. Click en "CLAIM PRIZE"
   ↓
3. Popup aparece:
   ┌────────────────────────────────────────┐
   │ 🎉 Congratulations!                    │
   │                                        │
   │ You won: 0.05 BTC ($5,400)            │
   │                                        │
   │ Choose how to receive:                 │
   │                                        │
   │ ○ Direct to Bitcoin wallet (BTC)      │
   │   Fee: $2.50 | Time: ~5 min           │
   │                                        │
   │ ○ To Solana wallet (cbBTC)            │
   │   Fee: $0.01 | Time: Instant          │
   │   (You can swap later on any DEX)     │
   │                                        │
   │ [CLAIM NOW]                            │
   └────────────────────────────────────────┘
```

### Si elige "Direct to Bitcoin wallet":
```
4. Bot hace swap automático cbBTC → BTC
   ↓
5. Usuario recibe BTC en su Bitcoin wallet (Ledger, Coinbase, etc.)
   ✅ DONE! BTC real, listo para usar
```

### Si elige "To Solana wallet":
```
4. Usuario recibe cbBTC en Phantom wallet
   ↓
5. Puede usar cbBTC en Solana DeFi inmediatamente, O
   ↓
6. Tutorial aparece:
   ┌────────────────────────────────────────┐
   │ 📚 How to convert cbBTC → BTC:        │
   │                                        │
   │ Option A: Use Jupiter (Recommended)   │
   │ 1. Go to jup.ag                       │
   │ 2. Connect wallet                     │
   │ 3. Swap cbBTC → BTC                   │
   │ 4. Send to your Bitcoin wallet        │
   │ Total time: 2 minutes                 │
   │                                        │
   │ Option B: Use Coinbase               │
   │ 1. Send cbBTC to Coinbase             │
   │ 2. They auto-convert to BTC           │
   │ 3. Withdraw to any wallet             │
   │ Total time: 5 minutes                 │
   │                                        │
   │ [WATCH VIDEO TUTORIAL]                │
   └────────────────────────────────────────┘
```

### Ventajas:
- ✅ **Usuario elige** (control total)
- ✅ **Barato si elige wrapped** (casi gratis)
- ✅ **Fácil si elige auto-swap** (nosotros lo hacemos)

### Desventajas:
- ⚠️ **Dos opciones pueden confundir** a usuarios novatos
- ⚠️ **Tutorial necesario** si eligen wrapped

---

## 🎯 OPCIÓN 3: Stablecoin + Voucher (MÁS SIMPLE)

### Concepto: Todos los Premios se Pagan en USDC + Voucher para Comprar Token

**Flujo ultra-simplificado**:

```
1. Usuario gana "0.05 BTC" ($5,400)
   ↓
2. Smart contract convierte a USDC: $5,400 USDC
   ↓
3. Usuario hace click "CLAIM"
   ↓
4. Recibe en Phantom wallet:
   - $5,400 USDC (líquido, puede usar YA)
   - 1 Voucher: "Redeem 0.05 BTC"
   ↓
5. Usuario decide qué hacer:

   OPCIÓN A: Quedarse con USDC
   ✅ Usa USDC donde quiera

   OPCIÓN B: Canjear voucher por BTC
   → Va a nuestra página de redeem
   → Click "Redeem BTC Voucher"
   → Bot compra 0.05 BTC en Coinbase
   → Envía BTC a wallet del usuario
   → Toma ~5 minutos

   OPCIÓN C: Canjear voucher + extra bonus
   → Canjea voucher por token nativo
   → Le damos 2% extra (ej: 0.051 BTC en vez de 0.05)
   → Incentivo para que espere
```

### Ventajas:
- ✅ **SÚPER SIMPLE**: Usuario siempre recibe USDC (entienden dinero)
- ✅ **Cero fricción inmediata**: USDC es líquido al instante
- ✅ **Flexibilidad total**: Usuario decide si quiere token o cash
- ✅ **Incentivos**: Bonus si esperan el token nativo

### Desventajas:
- ⚠️ **No es "real crypto"**: Usuario técnicamente no ganó BTC, ganó valor equivalente
- ⚠️ **Sistema de vouchers**: Requiere más desarrollo

---

## 📊 COMPARACIÓN DE LAS 3 OPCIONES

| Característica | Opción 1: Auto-Swap | Opción 2: Choice | Opción 3: USDC + Voucher |
|----------------|---------------------|------------------|--------------------------|
| **Simplicidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Costo** | Alto ($2-5/premio) | Variable | Bajo ($0.01) |
| **Velocidad** | Media (5 min) | Variable | Instantáneo |
| **Usuario recibe token real** | ✅ SÍ | ✅ SÍ (si elige) | ⚠️ Después de redeem |
| **Fricción** | Cero | Baja | Cero (USDC) |
| **Educación requerida** | Ninguna | Media | Ninguna |

---

## 🎯 MI RECOMENDACIÓN: **OPCIÓN 3 (USDC + Voucher)**

### ¿Por qué?

1. **Usuario novato**: Recibe USDC, entiende que es dinero, lo usa donde quiera
2. **Usuario crypto**: Puede redeem voucher por token nativo cuando quiera
3. **Cero fricción**: USDC es instantáneo, no hay esperas
4. **Incentivos**: Les damos 2% extra si esperan el redeem

---

## 🛠️ IMPLEMENTACIÓN: OPCIÓN 3 (USDC + Voucher)

### Smart Contract:

```rust
pub struct Prize {
    user: Pubkey,
    amount_usd: u64,        // $5,400
    token_symbol: String,   // "BTC"
    token_amount: f64,      // 0.05
    usdc_claimed: bool,
    token_claimed: bool,
    voucher_id: String,     // "VOUCHER-BTC-12345"
}

pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
    let prize = &mut ctx.accounts.prize;

    // 1. Enviar USDC inmediatamente
    transfer_usdc(
        prize.user,
        prize.amount_usd
    )?;

    // 2. Crear voucher NFT
    mint_voucher_nft(
        prize.user,
        prize.token_symbol,
        prize.token_amount,
        prize.voucher_id
    )?;

    prize.usdc_claimed = true;

    Ok(())
}

pub fn redeem_voucher(ctx: Context<RedeemVoucher>) -> Result<()> {
    let voucher = &ctx.accounts.voucher;

    // Trigger off-chain bot para comprar token nativo
    emit!(RedeemEvent {
        user: voucher.user,
        token: voucher.token_symbol,
        amount: voucher.token_amount,
        bonus: voucher.amount * 0.02, // 2% extra
    });

    Ok(())
}
```

### Frontend:

```tsx
// Claim screen
<ClaimPrizeModal>
  <h1>🎉 You Won!</h1>

  <PrizeDisplay>
    <div>Prize: 0.05 BTC</div>
    <div>Value: $5,400 USD</div>
  </PrizeDisplay>

  <InstantReward>
    ✅ Instant: Receive $5,400 USDC now
    (Available immediately in your wallet)
  </InstantReward>

  <VoucherReward>
    🎟️ Bonus: Redeem for 0.051 BTC later
    (2% bonus if you wait for native BTC)

    [CLAIM USDC NOW]
  </VoucherReward>
</ClaimPrizeModal>

// After claiming USDC
<VoucherScreen>
  <h2>Your Vouchers</h2>

  <VoucherCard>
    <Icon>🪙</Icon>
    <Title>0.051 BTC Voucher</Title>
    <Value>Worth: $5,508 USD</Value>
    <Status>Ready to redeem</Status>

    <Actions>
      [REDEEM NOW] → Get BTC in 5 minutes
      [KEEP VOUCHER] → Trade or save for later
    </Actions>
  </VoucherCard>
</VoucherScreen>
```

---

## 💰 EJEMPLO PRÁCTICO COMPLETO

### Escenario: Juan gana 0.05 BTC ($5,400)

#### DÍA 1 - CLAIM (Inmediato):

```
1. Juan ve notificación: "🎉 YOU WON 0.05 BTC!"

2. Juan hace click en "CLAIM PRIZE"

3. Aparece modal:
   ┌────────────────────────────────────┐
   │ 🎉 Prize Claimed!                  │
   │                                    │
   │ ✅ $5,400 USDC                    │
   │    Sent to your Phantom wallet    │
   │                                    │
   │ 🎟️ 1 Voucher NFT                 │
   │    Redeem for 0.051 BTC           │
   │    (includes 2% bonus!)            │
   │                                    │
   │ [VIEW IN WALLET]                   │
   └────────────────────────────────────┘

4. Juan abre Phantom wallet:
   ✅ Balance: $5,400 USDC (puede usar YA)
   ✅ NFTs: 1 voucher "BTC Redeem Voucher"
```

#### OPCIÓN A: Juan usa el USDC inmediatamente

```
5. Juan envía $5,400 USDC a Coinbase
6. Compra cosas, paga bills, etc.
7. Guarda el voucher NFT para después
```

#### OPCIÓN B: Juan quiere BTC nativo

```
5. Juan va a cryptolotto.com/redeem

6. Conecta wallet → Voucher detectado automáticamente

7. Modal aparece:
   ┌────────────────────────────────────┐
   │ Redeem BTC Voucher                 │
   │                                    │
   │ You'll receive: 0.051 BTC          │
   │ (includes 2% bonus!)               │
   │                                    │
   │ Enter your Bitcoin address:        │
   │ [bc1q...] 📋                       │
   │                                    │
   │ Estimated time: 5 minutes          │
   │ Fee: FREE (we cover it!)           │
   │                                    │
   │ [REDEEM NOW]                       │
   └────────────────────────────────────┘

8. Juan hace click → Bot procesa:
   - Quema voucher NFT
   - Compra 0.051 BTC en Coinbase
   - Envía a wallet de Juan
   - ✅ DONE en 5 minutos

9. Juan recibe BTC REAL en su Ledger wallet
```

---

## ✅ VENTAJAS DEL SISTEMA USDC + VOUCHER

### Para Usuario Novato:
```
✅ Recibe dinero real (USDC) que puede usar HOY
✅ No necesita entender "wrapped" o "native"
✅ Cero fricción, cero pasos complicados
✅ Puede ignorar el voucher si quiere
```

### Para Usuario Crypto:
```
✅ Redeem voucher para token nativo cuando quiera
✅ 2% bonus por esperar (incentivo)
✅ Puede tradear el voucher NFT si quiere
✅ Total control y flexibilidad
```

### Para Nosotros:
```
✅ Baratísimo: USDC transfer = $0.01
✅ Solo compramos token nativo si usuario redeem
✅ Podemos hacer batch buys (más barato)
✅ Menos complejidad en smart contract
```

---

## 🚨 COMPARACIÓN CON COMPETENCIA

### Polymarket (competidor):
```
- Pagan en USDC
- Usuario tiene que swap manualmente si quiere otra crypto
- Fricción: Alta
```

### Nosotros (con USDC + Voucher):
```
- Pagamos en USDC (inmediato)
- Voucher para redeem a token nativo (opcional)
- Bonus 2% si esperan
- Fricción: Cero
```

**Ganamos!** 🏆

---

## 🎯 DECISIÓN FINAL

**Sistema Recomendado**: **USDC + Voucher NFT**

**Flujo del usuario**:
1. Gana premio → Recibe USDC inmediato + Voucher NFT
2. Usa USDC donde quiera (cero fricción)
3. Opcional: Redeem voucher por token nativo + 2% bonus
4. Redeem toma 5 min, nosotros hacemos todo

**Ventajas**:
- ✅ Cero fricción para novatos
- ✅ Flexibilidad para expertos
- ✅ Barato para nosotros
- ✅ Marketing: "Get paid instantly in USDC + bonus vouchers!"

**¿Qué dices socio? ¿Te late esta solución?** 🚀

Con esto eliminamos TODA la fricción del wrapped y el usuario está súper feliz!