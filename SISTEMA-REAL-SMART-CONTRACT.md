# 🎯 Sistema REAL con Smart Contract - Solana

**IMPORTANTE**: No guardamos cryptos nosotros - TODO lo maneja el smart contract automáticamente

---

## ✅ CÓMO FUNCIONA REALMENTE (Smart Contract)

### 🎫 1. Usuario Compra Ticket ($0.25)

```rust
// Smart Contract en Solana
pub fn buy_ticket(
    ctx: Context<BuyTicket>,
    numbers: [u8; 5],
    power_number: u8
) -> Result<()> {
    // Usuario paga $0.25 en SOL
    let ticket_price_sol = 0.25 / sol_price; // ej: 0.001 SOL

    // Smart contract recibe el pago y LO DIVIDE automáticamente:
    let btc_vault_amount = ticket_price_sol * 0.70; // 70% BTC
    let eth_vault_amount = ticket_price_sol * 0.25; // 25% ETH
    let token_vault_amount = ticket_price_sol * 0.05; // 5% Token del mes

    // Compra cryptos automáticamente via Jupiter Aggregator:
    swap_sol_to_btc(btc_vault_amount)?; // cbBTC
    swap_sol_to_eth(eth_vault_amount)?; // wETH
    swap_sol_to_token(token_vault_amount, token_symbol)?; // Token votado

    // GUARDA en vaults del smart contract (NO en nuestra wallet)
    vault.btc_balance += btc_amount;
    vault.eth_balance += eth_amount;
    vault.token_balance += token_amount;

    Ok(())
}
```

**KEY POINT**: ✅ El smart contract COMPRA y GUARDA las cryptos automáticamente!

---

### 🎁 2. Usuario Gana Premio

```rust
pub fn claim_prize(
    ctx: Context<ClaimPrize>,
    ticket_id: u64
) -> Result<()> {
    let ticket = &ctx.accounts.ticket;
    let vault = &mut ctx.accounts.vault;

    // Verificar que ganó
    require!(ticket.is_winner, ErrorCode::NotWinner);
    require!(!ticket.claimed, ErrorCode::AlreadyClaimed);

    // Calcular premio según tier
    let tier = calculate_tier(ticket);
    let prize_btc = vault.btc_balance * tier_percentage / winners_count;
    let prize_eth = vault.eth_balance * tier_percentage / winners_count;
    let prize_token = vault.token_balance * tier_percentage / winners_count;

    // TRANSFERIR directamente del vault al usuario (automático!)
    transfer_spl_token(vault.btc_account, user.btc_account, prize_btc)?;
    transfer_spl_token(vault.eth_account, user.eth_account, prize_eth)?;
    transfer_spl_token(vault.token_account, user.token_account, prize_token)?;

    // Marcar como claimed
    ticket.claimed = true;
    ticket.claimed_at = Clock::get()?.unix_timestamp;

    Ok(())
}
```

**KEY POINT**: ✅ El smart contract transfiere DIRECTAMENTE al ganador!

---

## 🔍 LO QUE RECIBE EL USUARIO

### Usuario gana Jackpot (Tier 5+1):

```
Premio Total: 50% del pool

Si pool tiene:
- 5 cbBTC (wrapped Bitcoin)
- 20 wETH (wrapped Ethereum)
- 1000 JUP (Jupiter token)

Usuario recibe EN SU WALLET:
✅ 2.5 cbBTC (50% de 5)
✅ 10 wETH (50% de 20)
✅ 500 JUP (50% de 1000)

TODO llega automáticamente vía smart contract!
```

---

## 🚨 EL "PROBLEMA" DEL WRAPPED

### Lo que pasa:

```
Usuario cree que ganó: "5 BTC"

Realidad en su wallet Solana:
✅ 5 cbBTC (Coinbase wrapped Bitcoin)

Usuario: "¿Y esto qué es? ¿No es BTC?"
```

### Las 3 opciones que propuse antes:

#### OPCIÓN 1: Esconder la complejidad (UX)
```
Frontend muestra: "🪙 5 Bitcoin (BTC)"
Wallet contiene: 5 cbBTC
Usuario piensa: "Tengo BTC!"

Ventaja: Usuario feliz, no sabe que es wrapped
Desventaja: Técnicamente es cbBTC (pero funciona igual)
```

#### OPCIÓN 2: Auto-swap en smart contract
```
pub fn claim_prize(...) -> Result<()> {
    // Calcula premio
    let prize_btc = 5.0 cbBTC;

    // ❌ PROBLEMA: No podemos convertir cbBTC → BTC nativo en Solana!
    // BTC nativo solo existe en Bitcoin blockchain

    // Solo podríamos:
    // a) Enviar cbBTC (wrapped)
    // b) Enviar SOL equivalente
    // c) Enviar USDC equivalente
}
```

**REVELACIÓN**: ¡No hay forma de dar BTC "nativo" desde Solana! 😅

#### OPCIÓN 3: Smart contract paga en SOL/USDC
```
pub fn claim_prize(...) -> Result<()> {
    // En lugar de BTC/ETH/Token, paga equivalente en SOL o USDC
    let total_value_usd = calculate_prize_value();
    let sol_amount = total_value_usd / sol_price;

    // Usuario recibe SOL
    transfer(vault_sol, user_wallet, sol_amount)?;

    // Usuario decide si swappea a BTC/ETH/etc
}
```

---

## 💡 SOLUCIÓN FINAL RECOMENDADA

### Sistema Híbrido con Smart Contract:

```rust
pub struct LotteryVault {
    // Vaults de cryptos wrapped (lo que compra el smart contract)
    btc_vault: Account<'info, TokenAccount>,    // cbBTC
    eth_vault: Account<'info, TokenAccount>,    // wETH
    token_vault: Account<'info, TokenAccount>,  // Token del mes

    // Vault de USDC (para cash settlement)
    usdc_vault: Account<'info, TokenAccount>,

    // Config
    current_month_token: String, // "JUP", "BONK", etc.
}

pub fn buy_ticket(
    ctx: Context<BuyTicket>,
    numbers: [u8; 5],
    power_number: u8
) -> Result<()> {
    // Usuario paga en SOL
    let payment_sol = 0.001; // $0.25 worth

    // Smart contract hace swaps vía Jupiter:
    // 70% → cbBTC
    // 25% → wETH
    // 5% → Token del mes (JUP, BONK, whatever)

    // GUARDA en vaults
    vault.btc_balance += btc_swapped;
    vault.eth_balance += eth_swapped;
    vault.token_balance += token_swapped;

    Ok(())
}

pub fn claim_prize(
    ctx: Context<ClaimPrize>,
    prefer_usdc: bool // ⭐ NUEVO: Usuario elige!
) -> Result<()> {
    let prize_value_usd = calculate_prize_usd();

    if prefer_usdc {
        // Opción A: Recibe USDC inmediato
        transfer_usdc(vault, user, prize_value_usd)?;
    } else {
        // Opción B: Recibe tokens wrapped
        transfer_spl(vault.btc, user, prize_btc)?;
        transfer_spl(vault.eth, user, prize_eth)?;
        transfer_spl(vault.token, user, prize_token)?;
    }

    Ok(())
}
```

---

### Frontend muestra al usuario:

```tsx
// Pantalla de claim
<ClaimModal>
  <h1>🎉 You Won!</h1>
  <Prize>
    5 BTC + 20 ETH + 1000 JUP
    Total value: $540,000 USD
  </Prize>

  <ClaimOptions>
    <Option onClick={() => claimWithUSDE(true)}>
      💵 Instant: Receive $540,000 USDC
      (Available immediately, use anywhere)
    </Option>

    <Option onClick={() => claimWithUSDE(false)}>
      🪙 Crypto: Receive BTC + ETH + JUP
      (Wrapped versions on Solana)
      <Tooltip>
        ℹ️ You'll receive cbBTC, wETH, and JUP
        Can swap to native anytime on exchanges
      </Tooltip>
    </Option>
  </ClaimOptions>
</ClaimModal>
```

---

## ✅ RESUMEN DEL SISTEMA REAL

### Compra de Ticket:

```
1. Usuario paga $0.25 en SOL
   ↓
2. Smart contract AUTOMÁTICAMENTE:
   - Swappea 70% → cbBTC via Jupiter
   - Swappea 25% → wETH via Jupiter
   - Swappea 5% → Token del mes via Jupiter
   - GUARDA en vaults del smart contract
   ↓
3. ✅ Prize pool crece automáticamente
```

### Claim de Premio:

```
1. Usuario gana y hace click "CLAIM"
   ↓
2. Frontend pregunta: "¿USDC o Cryptos?"
   ↓
3. Smart contract AUTOMÁTICAMENTE:

   Si elige USDC:
   - Calcula valor total en USD
   - Transfiere USDC del vault → user wallet
   - ✅ Usuario recibe dinero líquido

   Si elige Cryptos:
   - Transfiere cbBTC + wETH + Token → user wallet
   - ✅ Usuario recibe wrapped tokens
   ↓
4. Usuario ve cryptos en su Phantom wallet
```

---

## 🎯 VENTAJAS DE ESTE SISTEMA

### ✅ Para el Proyecto:

- No custodiamos nada (smart contract lo hace)
- Todo es trustless y descentralizado
- Auditable on-chain
- No podemos "robar" fondos

### ✅ Para el Usuario:

- Claim instantáneo vía smart contract
- Elige entre USDC (simple) o cryptos (wrapped)
- Sin intermediarios, todo blockchain
- Transparente y verificable

### ✅ Para el Negocio:

- Baratísimo ($0.00025 por tx en Solana)
- Escalable sin límites
- Sin regulaciones de custody
- Marketing: "100% descentralizado"

---

## 🚨 RESPUESTA A TU PREGUNTA

> "ningún momento nosotros vamos a holdear criptos del premio, todo es por smart contract"

**EXACTO!** ✅

El smart contract en Solana:
1. **Recibe** SOL cuando usuario compra ticket
2. **Swappea** automáticamente a cbBTC + wETH + Token del mes
3. **Guarda** en sus propios vaults (PDAs en Solana)
4. **Transfiere** directamente al ganador cuando hace claim

**Nosotros NO tocamos nada** - Todo lo hace el contrato! 🎉

---

## 💭 CONCLUSIÓN

**El "problema" del wrapped NO se puede evitar** porque:
- BTC nativo solo existe en Bitcoin blockchain
- ETH nativo solo existe en Ethereum blockchain
- Desde Solana, SIEMPRE serán wrapped (cbBTC, wETH)

**Solución UX**:
- Dar opción al usuario: USDC o Cryptos wrapped
- Mostrar nombres simples (Bitcoin, Ethereum)
- Educación gradual sobre wrapped tokens

**¿Qué dices socio? ¿Quedamos en Solana con esta estrategia?** 🚀
