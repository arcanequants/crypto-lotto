# Tareas POST-PRODUCCIÓN

## ANTES de hacer deploy a producción:

### 0. Modificar contrato de lotería dual para draws automáticos
- **Ubicación:** `/Users/albertosorno/crypto-lotto/contracts-mvp/src/LotteryAPI3Dual.sol` (o el contrato que vayamos a usar)
- **Cambio necesario:** Igual que hicimos en LotteryTestingUltraSimple, modificar `fulfillUint256()` para crear automáticamente el siguiente draw
- **Razón:** Los draws deben ser automáticos, no requerir llamar manualmente `createNextDraw()`
- **Status:** ⚠️ CRÍTICO - Hacer ANTES del deploy final

---

## DESPUÉS de hacer deploy a producción:

### 1. Aplicar para $15k en Gas Credits de Coinbase Paymaster
- **Formulario:** https://docs.google.com/forms/d/1yPnBFW0bVUNLUN_w3ctCqYM9sjdIQO3Typ53KXlsS5g/viewform
- **Requisito:** Necesitamos tener la página funcionando en producción
- **Beneficio:** Hasta $15,000 USD en gas credits gratis para sponsorear transacciones
- **Status:** PENDIENTE hasta que tengamos todo funcionando en producción

### 2. Hacer draws automáticos en LotteryTestingUltraSimple
- **Ubicación:** `/Users/albertosorno/crypto-lotto/contracts-mvp/src/LotteryTestingUltraSimple.sol`
- **Problema actual:** Los draws requieren llamar manualmente `executeDraw()` y luego `createNextDraw()`
- **Solución:** Modificar `fulfillUint256()` para crear automáticamente el siguiente draw
- **Código necesario:**
  ```solidity
  function fulfillUint256(bytes32 requestId, bytes calldata data) external {
      require(msg.sender == airnodeRrp, "Only Airnode RRP");
      require(expectingRequestWithIdToBeFulfilled[requestId], "Invalid request");

      expectingRequestWithIdToBeFulfilled[requestId] = false;

      uint256 drawId = requestIdToDrawId[requestId];
      Draw storage draw = draws[drawId];

      // Decode quantum random number
      uint256 qrngUint256 = abi.decode(data, (uint256));
      uint8 winningNumber = uint8((qrngUint256 % 10) + 1);

      draw.winningNumber = winningNumber;
      draw.executed = true;

      // Count winners
      uint256 winnersCount = 0;
      for (uint256 i = 1; i <= ticketCounter; i++) {
          Ticket storage ticket = tickets[i];
          if (ticket.drawId == drawId && ticket.selectedNumber == winningNumber) {
              ticket.isWinner = true;
              winnersCount++;
          }
      }

      draw.winnersCount = winnersCount;

      emit DrawExecuted(
          drawId,
          winningNumber,
          draw.totalTickets,
          draw.prizePoolUSDC,
          draw.prizePoolUSDT,
          winnersCount
      );

      // ✨ NUEVO: Crear siguiente draw automáticamente
      currentDrawId++;
      draws[currentDrawId] = Draw({
          id: currentDrawId,
          endTime: _getNextDrawTime(block.timestamp),
          executed: false,
          winningNumber: 0,
          totalTickets: 0,
          prizePoolUSDC: 0,
          prizePoolUSDT: 0,
          totalPrizesAwardedUSDC: 0,
          totalPrizesAwardedUSDT: 0,
          winnersCount: 0
      });
  }
  ```

### 3. Agregar función buyTicketsBulk al contrato LotteryTestingUltraSimple
- **Ubicación:** `/Users/albertosorno/crypto-lotto/contracts-mvp/src/LotteryTestingUltraSimple.sol`
- **Razón:** Actualmente solo tiene `buyTicket(uint8, address)` para compra individual. Necesitamos `buyTicketsBulk(uint8[], address)` para comprar múltiples tickets en 1 transacción
- **Beneficio:** Ahorro masivo en gas fees - comprar 100 tickets en 1 transacción vs 100 transacciones
- **Status:** PENDIENTE - Por ahora solo se puede comprar 1 ticket a la vez
- **Código necesario:**
  ```solidity
  function buyTicketsBulk(
      uint8[] calldata _selectedNumbers,
      address _paymentToken
  ) external nonReentrant whenNotPaused notInEmergencyMode {
      require(_selectedNumbers.length > 0, "No numbers provided");
      require(_selectedNumbers.length <= 1000, "Max 1000 tickets");
      require(_paymentToken == address(USDC) || _paymentToken == address(USDT), "Invalid token");

      Draw storage draw = draws[currentDrawId];
      require(block.timestamp < draw.endTime, "Draw ended");
      require(draw.totalTickets + _selectedNumbers.length <= MAX_TICKETS_PER_DRAW, "Draw full");

      uint256 ticketPrice = _paymentToken == address(USDC) ? TICKET_PRICE_USDC : TICKET_PRICE_USDT;
      uint256 totalCost = ticketPrice * _selectedNumbers.length;
      uint256 platformFee = (totalCost * PLATFORM_FEE_PERCENT) / 100;
      uint256 prizePoolAmount = totalCost - platformFee;

      // Transfer total payment from user
      IERC20(_paymentToken).safeTransferFrom(msg.sender, address(this), totalCost);

      // Update prize pool
      if (_paymentToken == address(USDC)) {
          draw.prizePoolUSDC += prizePoolAmount;
          totalPlatformFeesUSDC += platformFee;
      } else {
          draw.prizePoolUSDT += prizePoolAmount;
          totalPlatformFeesUSDT += platformFee;
      }

      // Create tickets
      for (uint256 i = 0; i < _selectedNumbers.length; i++) {
          require(_selectedNumbers[i] >= MIN_NUMBER && _selectedNumbers[i] <= MAX_NUMBER, "Invalid number");

          ticketCounter++;
          tickets[ticketCounter] = Ticket({
              id: ticketCounter,
              owner: msg.sender,
              selectedNumber: _selectedNumbers[i],
              drawId: currentDrawId,
              paymentToken: _paymentToken,
              pricePaid: ticketPrice,
              isWinner: false,
              claimed: false
          });

          draw.totalTickets++;

          emit TicketPurchased(
              ticketCounter,
              msg.sender,
              _selectedNumbers[i],
              currentDrawId,
              _paymentToken,
              ticketPrice
          );
      }
  }
  ```

### 4. Sistema de registro de tickets desde blockchain a base de datos
- **Problema actual:** Los tickets comprados directamente en el blockchain se guardan en `localStorage` (solo para testing)
- **Solución para producción:** Implementar event listener para `TicketPurchased` event
- **Beneficio:** Los tickets persisten permanentemente y pueden verse desde cualquier dispositivo
- **Status:** ⚠️ TEMPORAL - localStorage funciona solo para testing local
- **Implementación recomendada:**
  1. **Opción A (Más robusta):** Backend service que escucha eventos del blockchain
     - Usar librería como `viem` o `ethers.js` con `watchContractEvent`
     - Escuchar evento `TicketPurchased(uint256 indexed ticketId, address indexed buyer, uint8 selectedNumber, uint256 drawId, address paymentToken, uint256 amount)`
     - Guardar automáticamente en base de datos (Supabase o PostgreSQL)
     - Requiere servidor backend siempre corriendo

  2. **Opción B (Más simple):** Client-side con The Graph Protocol
     - Crear subgraph para indexar eventos del contrato
     - Usar GraphQL queries desde el frontend
     - No requiere backend propio pero sí configurar The Graph

  3. **Opción C (Híbrida - RECOMENDADA para inicio):**
     - Crear endpoint API `/api/sync-tickets` que se llama al cargar página
     - Endpoint usa `publicClient.getContractEvents()` para leer eventos históricos
     - Guarda eventos nuevos en base de datos
     - Pros: Simple, no requiere servicio 24/7
     - Contras: Ligero delay al sincronizar primera vez

- **Código de referencia (Opción C):**
  ```typescript
  // app/api/sync-tickets/route.ts
  export async function POST(request: NextRequest) {
    const { walletAddress } = await request.json();

    const publicClient = createPublicClient({
      chain: base,
      transport: http(ALCHEMY_RPC_URL)
    });

    // Get TicketPurchased events for this wallet
    const events = await publicClient.getContractEvents({
      address: LOTTERY_CONTRACT_ADDRESS,
      abi: LOTTERY_ABI,
      eventName: 'TicketPurchased',
      args: { buyer: walletAddress },
      fromBlock: CONTRACT_DEPLOYMENT_BLOCK,
      toBlock: 'latest'
    });

    // Insert into database (upsert to avoid duplicates)
    for (const event of events) {
      await supabase.from('blockchain_tickets').upsert({
        ticket_id: event.args.ticketId,
        buyer: event.args.buyer,
        selected_number: event.args.selectedNumber,
        draw_id: event.args.drawId,
        payment_token: event.args.paymentToken,
        price_paid: event.args.amount,
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        timestamp: event.block.timestamp
      });
    }

    return NextResponse.json({ success: true, synced: events.length });
  }
  ```

### 5. Página unificada de "My Tickets"
- **Problema actual:** Hay dos páginas separadas:
  - `/my-tickets` - Lee de Supabase (sistema dual lottery legacy)
  - `/my-tickets-blockchain` - Lee de localStorage (sistema blockchain ULTRA SIMPLE)
- **Solución:** Unificar en una sola página `/my-tickets` que:
  1. Lee tickets del blockchain (después de implementar tarea #4)
  2. Muestra estado del draw actual
  3. Muestra si ganaron después de que el draw se ejecuta
  4. Permite reclamar premios
- **Status:** PENDIENTE - Después de resolver tarea #4

### 6. Sistema de notificaciones de ganadores
- **Descripción:** Cuando un draw se ejecuta y hay ganadores, notificar a los usuarios
- **Opciones:**
  1. Email notifications (usando Resend o SendGrid)
  2. Web push notifications
  3. Discord/Telegram bot notifications
- **Status:** NICE-TO-HAVE - No crítico para MVP

---

**Fecha creada:** 2025-11-03
**Última actualización:** 2025-11-03 21:30 UTC
**Razón:** Para aplicar al programa de gas credits necesitamos demostrar que tenemos una aplicación funcional en producción

## LOGROS COMPLETADOS ✅

### Gas Sponsorship FUNCIONANDO (2025-11-03)
- ✅ Configurado Coinbase Smart Wallet v1.1 con Privy SDK 3.5.1
- ✅ Gas sponsorship verificado - usuarios pueden comprar tickets SIN tener ETH
- ✅ Privy crea smart wallets (ERC-4337) automáticamente con Coinbase Paymaster
- ✅ Todos los componentes usan consistentemente `smartWalletClient.account.address`
- ✅ Sistema de draws automáticos con cron job (cada 30 minutos)
- ✅ Fix de nonce errors en execute-draw endpoint
- ✅ Sistema temporal de registro de tickets con localStorage (para testing)
