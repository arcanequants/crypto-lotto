# 🧪 EDGE CASES TESTING - SEMANA 4

**Objetivo:** Probar escenarios límite y manejo de errores

**Tiempo estimado:** 15-20 minutos

---

## 🎯 CASO 1: Usuario Sin Tickets Ganadores

**Objetivo:** Verificar que el sistema maneja correctamente usuarios que NO ganaron premios.

### Pasos:
1. Ve a `/my-tickets`
2. Si todos tus tickets son ganadores, compra nuevos tickets con números diferentes a los ganadores
3. Refresca la página
4. **Verificar:**
   - ✅ Tickets sin premio muestran "No prize" (en gris)
   - ✅ NO muestran badge "WINNER!"
   - ✅ NO tienen botón "CLAIM PRIZE"

5. Ve a `/prizes`
6. **Verificar:**
   - ✅ Si NO tienes tickets ganadores sin reclamar, muestra: "No Prizes Yet"
   - ✅ Botón "BUY TICKETS" aparece
   - ✅ PrizeBalance NO aparece en header

### Resultado esperado:
✅ El sistema distingue correctamente entre tickets ganadores y perdedores.

---

## 🔒 CASO 2: Usuario No Autenticado

**Objetivo:** Verificar que páginas protegidas requieren autenticación.

### Pasos:
1. **Desconecta tu wallet:**
   - En el header, desconecta (logout) de Privy

2. **Prueba `/my-tickets`:**
   - Ve a http://localhost:3000/my-tickets
   - **Verificar:**
     - ✅ Muestra: "🔒 Authentication Required"
     - ✅ Mensaje: "Please connect your wallet to view your tickets"
     - ✅ Botón LoginButton aparece

3. **Prueba `/prizes`:**
   - Ve a http://localhost:3000/prizes
   - **Verificar:**
     - ✅ Muestra: "🔒 Authentication Required"
     - ✅ Mensaje: "Please connect your wallet to view your prizes"
     - ✅ Botón LoginButton aparece

4. **Prueba comprar tickets sin auth:**
   - Ve a http://localhost:3000/
   - Selecciona números
   - Add to cart
   - Click "BUY ALL TICKETS"
   - **Verificar:**
     - ✅ Toast: "Please connect your wallet first"
     - ✅ Privy login modal aparece automáticamente

5. **Reconecta tu wallet** para continuar con los demás tests

### Resultado esperado:
✅ El sistema protege rutas sensibles y solicita autenticación donde es necesaria.

---

## 🚫 CASO 3: Intentar Reclamar Ticket Ya Reclamado

**Objetivo:** Verificar que NO se puede reclamar un premio dos veces.

### Pasos:
1. Ve a `/my-tickets`
2. Encuentra un ticket que ya reclamaste (badge "✓ CLAIMED")
3. **Verificar:**
   - ✅ NO tiene botón "CLAIM PRIZE"
   - ✅ Solo muestra badge "✓ CLAIMED"

4. Ve a `/prizes`
5. **Verificar:**
   - ✅ Tickets reclamados están en sección "CLAIMED PRIZES" (abajo)
   - ✅ NO tienen botón "CLAIM PRIZE"
   - ✅ Solo badge "✓ CLAIMED"

### Test adicional (Manual - SOLO si quieres probar a nivel DB):
Si quieres verificar que la DB también lo previene:

```sql
-- En Supabase SQL Editor, intenta actualizar un ticket ya reclamado
UPDATE tickets
SET claim_status = 'pending'
WHERE id = [TU_TICKET_ID] AND claim_status = 'claimed';

-- Luego intenta reclamarlo de nuevo desde la UI
-- Debería funcionar porque lo volviste a "pending"
```

### Resultado esperado:
✅ No se puede reclamar un premio dos veces desde la UI.

---

## 🔄 CASO 4: Refresh Durante Claiming

**Objetivo:** Verificar comportamiento si el usuario refresca durante el proceso de claim.

### Pasos:
1. Ve a `/my-tickets` o `/prizes`
2. Encuentra un ticket ganador NO reclamado
3. Click en **"CLAIM PRIZE"**
4. **INMEDIATAMENTE** mientras ves "⏳ CLAIMING..." (antes de 1.5 segundos):
   - Refresca la página (Cmd+R / Ctrl+R)

5. **Verificar:**
   - ✅ El ticket sigue con botón "CLAIM PRIZE" (no se reclamó)
   - ✅ claim_status en DB sigue siendo 'pending'
   - ✅ No hay errores en consola

### Resultado esperado:
✅ Si se interrumpe el proceso, el claim NO se ejecuta (evita claims parciales).

---

## 🛒 CASO 5: Cart Vacío

**Objetivo:** Verificar que no se puede comprar con cart vacío.

### Pasos:
1. Ve a `/` (home)
2. **SIN** agregar tickets al cart, scroll hasta encontrar el botón de compra
3. Si NO hay botón (porque cart está vacío), eso es correcto ✅
4. Si hay manera de intentar comprar sin cart:
   - **Verificar:**
     - ✅ Toast: "Cart is empty!"
     - ✅ NO se hace llamada a Supabase
     - ✅ No se cobra nada

### Resultado esperado:
✅ No se puede proceder a compra sin items en cart.

---

## 🔢 CASO 6: Selección Incompleta de Números

**Objetivo:** Verificar validación de selección de números.

### Pasos:
1. Ve a `/` (home)
2. **Selecciona solo 3 main numbers** (en vez de 5)
3. Click "ADD TO CART"
4. **Verificar:**
   - ✅ Toast: "Please select exactly 5 main numbers!"
   - ✅ NO se agrega al cart

5. **Selecciona 5 main numbers** pero NO selecciones power number
6. Click "ADD TO CART"
7. **Verificar:**
   - ✅ Toast: "Please select 1 power number!"
   - ✅ NO se agrega al cart

8. **Selecciona 6 main numbers** (intenta seleccionar más de 5)
9. **Verificar:**
   - ✅ Toast: "Maximum 5 main numbers allowed!"
   - ✅ El 6to número NO se selecciona

### Resultado esperado:
✅ Sistema valida correctamente la selección de números.

---

## 📊 CASO 7: Múltiples Ganadores del Mismo Tier

**Objetivo:** Verificar que el premio se divide correctamente entre múltiples ganadores.

### Pasos:
1. Si aún tienes múltiples tickets ganadores del mismo tier (ej: dos tickets con "3 + PowerBall"):
   - Ve a `/prizes` o `/my-tickets`
   - **Verificar:**
     - ✅ Cada ticket muestra el MISMO monto (premio dividido)
     - ✅ Ejemplo: Si hay 2 ganadores de "3 + PowerBall" ($250 total):
       - Cada uno debe mostrar $125.00

2. Si NO tienes múltiples ganadores del mismo tier, puedes crear otro:
   ```sql
   -- En Supabase SQL Editor
   INSERT INTO tickets (ticket_id, draw_id, wallet_address, numbers, power_number, price_paid, claim_status, prize_amount)
   VALUES (
     999999999,
     1,
     '[TU_WALLET_ADDRESS]',
     ARRAY[2, 11, 29],  -- 3 números que coinciden con winning numbers
     20,                 -- PowerBall que coincide
     0.25,
     'pending',
     0
   );
   ```

3. Refresca `/my-tickets`
4. **Verificar:**
   - ✅ Ahora hay 2 (o más) tickets con el mismo tier
   - ✅ El prize amount de cada uno es: (Total tier ÷ # ganadores)

### Resultado esperado:
✅ Sistema divide premios correctamente entre múltiples ganadores.

---

## 🎯 CHECKLIST COMPLETO

Marca cada caso que completaste:

- [ ] **Caso 1:** Usuario sin tickets ganadores
- [ ] **Caso 2:** Usuario no autenticado
- [ ] **Caso 3:** Intentar reclamar ticket ya reclamado
- [ ] **Caso 4:** Refresh durante claiming
- [ ] **Caso 5:** Cart vacío
- [ ] **Caso 6:** Selección incompleta de números
- [ ] **Caso 7:** Múltiples ganadores del mismo tier

---

## ✅ RESULTADO FINAL

Si todos los casos pasan:
**✅ SEMANA 4 ESTÁ 100% TESTEADA Y LISTA**

Si alguno falla:
**❌ Reporta cuál falló y lo arreglamos**

---

## 📝 NOTAS IMPORTANTES

- Estos tests son para el **MOCK** (simulación)
- En SEMANA 6 con blockchain real, algunos comportamientos cambiarán:
  - Claims requerirán wallet signature
  - Habrá gas fees
  - Transactions serán irreversibles
  - Habrá transaction hashes reales

---

**¡Empieza con Caso 1 y ve marcando cada uno!** 🚀
