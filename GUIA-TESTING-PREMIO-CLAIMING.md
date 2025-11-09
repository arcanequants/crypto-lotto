# 🧪 Guía de Testing - Prize Claiming (SEMANA 4)

## ⚠️ PASO IMPORTANTE ANTES DE EMPEZAR

**Debes correr la migración de Supabase PRIMERO** para agregar los campos necesarios para prize claiming.

### 📋 Migración de Supabase

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Abre el **SQL Editor**
3. Copia y pega el contenido de `supabase-migration-prize-claiming.sql`
4. Haz click en **Run** para ejecutar la migración
5. Verifica que veas el mensaje: "Prize claiming migration completed! ✅"

La migración agrega estos campos a la tabla `tickets`:
- `claim_status` (TEXT, default: 'pending')
- `claimed_at` (TIMESTAMPTZ, nullable)
- `prize_amount` (DECIMAL, default: 0)

---

## 🎯 Flow de Testing Completo

### 1️⃣ PREPARACIÓN: Crear Tickets Ganadores

Para probar el flow de prize claiming, necesitas tickets que hayan ganado premios.

**Pasos:**
1. Abre el app en http://localhost:3000
2. Conecta tu wallet (Privy)
3. Compra al menos 2-3 tickets usando "QUICK PICK" para números aleatorios
4. Ve a la página **/results** (o haz click en "VIEW RESULTS")
5. **Observa los números ganadores** que se generaron automáticamente
6. Compra más tickets seleccionando números que coincidan parcialmente con los ganadores para crear tickets con premios

**Tipos de premios según matches:**
- `5 + PowerBall` = 50% del prize pool (Jackpot)
- `5 números` = 20% del prize pool
- `4 + PowerBall` = 15% del prize pool
- `4 números` = 10% del prize pool
- `3 + PowerBall` = 5% del prize pool

**Total Prize Pool:** $5,000

---

### 2️⃣ VERIFICAR TICKETS GANADORES

**Página: /my-tickets**

1. Ve a **"MY TICKETS"** en el nav
2. Verifica que los tickets ganadores muestren:
   - ✅ Badge "WINNER!" con fondo dorado
   - 💰 Monto del premio en grande (ej: "$1,250.00")
   - 🎯 Tier del premio (ej: "5 + PowerBall")
   - 📊 Matches (ej: "5 numbers + PowerBall")
   - 🔘 Botón **"CLAIM PRIZE"** (si no ha sido reclamado)
   - ✓ Badge **"CLAIMED"** (si ya fue reclamado)

3. Tickets sin premio deben mostrar:
   - "No prize" en gris

---

### 3️⃣ PROBAR EL FLOW DE CLAIMING

**Opción A: Desde /my-tickets**

1. Ve a **MY TICKETS** (`/my-tickets`)
2. Encuentra un ticket ganador (con badge "WINNER!")
3. Haz click en el botón **"CLAIM PRIZE"**
4. Observa:
   - 🔄 El botón cambia a "⏳ CLAIMING..." por 1.5 segundos (simulando blockchain tx)
   - 🎉 Toast notification verde: "Prize of $XXX.XX claimed successfully!"
   - ✓ El botón se reemplaza por badge "CLAIMED"
   - La página se recarga automáticamente

**Opción B: Desde /prizes**

1. Ve a **PRIZES** en el nav
2. Verifica la sección **"TOTAL UNCLAIMED BALANCE"**:
   - Muestra el total de premios sin reclamar
   - Cuenta de tickets sin reclamar
3. Sección **"CLAIMABLE PRIZES"**:
   - Lista todos los tickets ganadores no reclamados
   - Muestra números del ticket
   - Muestra monto del premio
   - Botón "CLAIM PRIZE" para cada ticket
4. Haz click en **"CLAIM PRIZE"** en cualquier ticket
5. Observa el mismo comportamiento que en opción A
6. Después de reclamar:
   - El ticket desaparece de "CLAIMABLE PRIZES"
   - Aparece en la sección **"CLAIMED PRIZES"** al final
   - El balance total se actualiza

---

### 4️⃣ VERIFICAR PRIZE BALANCE COMPONENT

**Visible en todas las páginas del nav**

1. El componente **PrizeBalance** aparece en el header si tienes premios sin reclamar
2. Muestra:
   - 🎁 Emoji de regalo
   - "Unclaimed" label
   - Monto total en dorado (ej: "$2,500.00")
3. Comportamiento:
   - Hover: Scale up + glow effect
   - Click: Te lleva a `/prizes`
   - Desaparece automáticamente cuando no hay premios sin reclamar

---

### 5️⃣ VERIFICAR NAVEGACIÓN

Todas las páginas deben tener navegación consistente:

**Header Nav Links:**
- **CryptoLotto** (logo) → Home
- **BUY TICKETS** → Home (`/`)
- **MY TICKETS** → `/my-tickets`
- **PRIZES** → `/prizes` (nuevo)
- **RESULTS** → `/results` (en algunas páginas)
- **PrizeBalance** component (solo si hay premios)
- **LoginButton**

---

### 6️⃣ PROBAR EDGE CASES

**A. Usuario sin tickets ganadores:**
- Ve a `/prizes` sin tener tickets ganadores
- Debe mostrar: "No Prizes Yet" con botón "BUY TICKETS"

**B. Usuario no autenticado:**
- Desconecta wallet
- Ve a `/prizes` o `/my-tickets`
- Debe mostrar: "Authentication Required" con LoginButton

**C. Claiming múltiples prizes:**
- Compra múltiples tickets ganadores
- Reclama uno por uno desde `/prizes`
- Verifica que el balance se actualice después de cada claim

**D. Refresh durante claiming:**
- Inicia un claim pero refresca la página antes de que termine
- El ticket debe permanecer en estado "pending" (no claimed)

---

## 🗄️ VERIFICAR EN SUPABASE

Después de reclamar un premio, verifica en Supabase:

1. Ve a tu proyecto → Table Editor → `tickets`
2. Encuentra el ticket reclamado
3. Verifica campos:
   - `claim_status` = `'claimed'`
   - `claimed_at` = timestamp del momento del claim
   - `prize_amount` = monto exacto del premio

---

## 📊 DATOS DE PRUEBA

**Generar tickets ganadores rápidamente:**

Si tienes acceso al SQL Editor de Supabase, puedes insertar tickets ganadores directamente:

```sql
-- Ver winning numbers actuales
SELECT winning_numbers, power_number FROM draws WHERE id = 1;

-- Insertar ticket ganador (ajusta los números según tu draw)
INSERT INTO tickets (draw_id, user_wallet, selected_numbers, power_number, purchase_date, price_paid, claim_status)
VALUES (
  1,
  'TU_WALLET_ADDRESS',
  ARRAY[5, 12, 23, 34, 45], -- Ajusta para que coincidan
  10, -- Ajusta según power_number del draw
  NOW(),
  0.25,
  'pending'
);
```

---

## ✅ CHECKLIST DE TESTING

- [ ] Migración de Supabase ejecutada exitosamente
- [ ] Tickets ganadores muestran badge "WINNER!" correctamente
- [ ] Prize amount se calcula y muestra correctamente
- [ ] Botón "CLAIM PRIZE" funciona en `/my-tickets`
- [ ] Botón "CLAIM PRIZE" funciona en `/prizes`
- [ ] Toast notifications aparecen después de claim
- [ ] Estado cambia a "CLAIMED" después de claim exitoso
- [ ] PrizeBalance component aparece cuando hay premios
- [ ] PrizeBalance se actualiza después de cada claim
- [ ] PrizeBalance desaparece cuando no hay premios
- [ ] Navegación funciona en todas las páginas
- [ ] Edge cases: usuario no autenticado
- [ ] Edge cases: usuario sin premios
- [ ] Datos en Supabase se actualizan correctamente

---

## 🐛 PROBLEMAS COMUNES

### "No prizes showing"
✅ Verifica que compraste tickets DESPUÉS de que se generaron los winning numbers
✅ Ve a `/results` para ver los números ganadores
✅ Compra nuevos tickets que coincidan parcialmente

### "Claim button doesn't work"
✅ Verifica que corriste la migración de Supabase
✅ Revisa la consola del navegador para errores
✅ Verifica que la columna `claim_status` existe en Supabase

### "PrizeBalance no aparece"
✅ Debe estar autenticado
✅ Debe tener al menos un ticket ganador no reclamado
✅ Verifica que importaste `<PrizeBalance />` en el header

---

## 🎉 FEATURES IMPLEMENTADAS - SEMANA 4

✅ **Prize Calculation System**
- Cálculo automático de premios según tier
- División de premios entre ganadores del mismo tier
- Utilities en `lib/lottery.ts`

✅ **Prize Claiming Flow (MOCK)**
- Botón "Claim Prize" en tickets ganadores
- Simulación de transacción blockchain (1.5s delay)
- Actualización de estado en Supabase
- Toast notifications

✅ **Prizes Page (`/prizes`)**
- Total unclaimed balance display
- Lista de claimable prizes
- Historial de claimed prizes
- Claim functionality integrada

✅ **My Tickets Enhancement**
- Muestra premio amount en tickets ganadores
- Botón de claim integrado
- Estado "CLAIMED" visual
- Recarga automática después de claim

✅ **PrizeBalance Component**
- Muestra total unclaimed en header
- Link a `/prizes` page
- Auto-hide cuando no hay premios
- Animaciones hover

✅ **Navigation Updates**
- Link "PRIZES" agregado a todas las páginas
- Navegación consistente
- PrizeBalance integrado en header

✅ **Database Schema Updates**
- `claim_status` field
- `claimed_at` timestamp
- `prize_amount` field
- Migración SQL documentada

---

## 📝 NOTAS IMPORTANTES

- ⚠️ Este es un **MOCK** - no hay transacciones blockchain reales
- ⚠️ Los prizes se guardan en Supabase, no en smart contracts
- ⚠️ En SEMANA 6 se reemplazará con blockchain real
- 💰 Prize pool actual: $5,000 (hardcoded)
- 🎫 Todos los tickets son para Draw #1

---

**¿Listo para SEMANA 5?**

Después de completar este testing, el siguiente paso es:
- **SEMANA 5**: Testing exhaustivo, optimización de performance, fixes de bugs, mejoras de UX
