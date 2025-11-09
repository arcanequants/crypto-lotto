# 🗺️ ROADMAP FINAL - DUAL LOTTERY CON HORARIOS CONFIGURABLES

**Fecha**: 2025-10-23
**Sistema**: Dual Lottery (Daily + Weekly) + Sistema Infinito + Admin Panel
**Distribución**: 25% Platform Fee + 20% Daily + 80% Weekly
**Horarios**: Configurables desde admin panel (defaults: 2 AM UTC daily, 0 AM UTC weekly)

---

## ✅ COMPLETADO HOY (2025-10-23)

### **1. Sistema de Configuración confirmado**
- [x] Distribución ticket: 25% platform fee + 75% prize pools
- [x] Split prize pools: 20% daily + 80% weekly
- [x] Prize tiers: IGUALES para daily y weekly
- [x] Ticket lifecycle: Rolling daily window (Opción A)
- [x] Usuario puede ganar en AMBOS sorteos

### **2. Sistema Infinito con CRON Jobs**
- [x] Archivo: `/app/api/cron/create-next-draws/route.ts` (crea draws automáticamente)
- [x] Archivo: `/app/api/cron/execute-daily-draw/route.ts` (ejecuta daily, calcula rollover)
- [x] Archivo: `/app/api/cron/execute-weekly-draw/route.ts` (ejecuta weekly, maneja jackpot)
- [x] Archivo: `vercel.json` (configuración de CRONs)
- [x] Documentación: `SISTEMA-INFINITO-CRON-JOBS.md`

### **3. Admin Panel para Horarios**
- [x] Archivo SQL: `supabase-migration-draw-config.sql` (tabla de configuración)
- [x] Archivo: `/app/admin/draw-config/page.tsx` (UI admin para cambiar horarios)
- [x] CRONs actualizados para leer configuración dinámica
- [x] Preview multi-timezone en tiempo real (7 zonas)
- [x] Documentación: `HORARIOS-ADMIN-CONFIGURABLES.md`

### **4. Investigación de Horarios Óptimos**
- [x] Análisis de mercados crypto globales (USA 40%, Europa 25%, Asia 20%)
- [x] Benchmark de loterías tradicionales (Powerball, EuroMillions)
- [x] **Recomendación final**: Daily 2 AM UTC, Weekly 0 AM UTC (domingo)
- [x] Cobertura: 60-70% del mercado crypto (Américas)

### **5. Migraciones SQL Creadas**
- [x] `supabase-migration-dual-lottery-opcion-a.sql` (dual lottery con ticket lifecycle)
- [x] `supabase-migration-draw-config.sql` (configuración de horarios)

### **6. Documentación Completa**
- [x] `ANALISIS-CAMBIOS-OPCION-A.md` (todos los cambios requeridos)
- [x] `PREGUNTAS-CRITICAS-DUAL-LOTTERY.md` (respuestas confirmadas)
- [x] `SISTEMA-INFINITO-CRON-JOBS.md` (flujo completo de CRONs)
- [x] `HORARIOS-ADMIN-CONFIGURABLES.md` (análisis de horarios + admin panel)

---

## 📅 PRÓXIMOS PASOS - OPCIÓN A (BACKEND FIRST)

### **MAÑANA - DÍA 1: Database Setup** (1-2 horas)

#### **Tarea 1: Ejecutar migraciones SQL**
```sql
-- En Supabase SQL Editor:

-- 1. Ejecutar: supabase-migration-dual-lottery-opcion-a.sql
--    ✅ Agrega campos dual lottery (daily/weekly)
--    ✅ Agrega rollover fields
--    ✅ Agrega platform fee tracking
--    ✅ Crea funciones RPC (get_next_daily_draw_id, get_next_weekly_draw_id)
--    ✅ Crea 7 daily draws + 4 weekly draws iniciales

-- 2. Ejecutar: supabase-migration-draw-config.sql
--    ✅ Crea tabla draw_config
--    ✅ Defaults: daily 2 AM UTC, weekly 0 AM UTC (domingo)
```

#### **Tarea 2: Verificar en Supabase**
- [ ] Tabla `draws` tiene nuevas columnas:
  - `draw_type` ('daily' | 'weekly')
  - `rollover_tier_5_1`, `rollover_tier_5_0`, `rollover_tier_4_1`
  - `platform_fee_collected`
- [ ] Tabla `tickets` tiene nuevas columnas:
  - `assigned_daily_draw_id`, `assigned_weekly_draw_id`
  - `daily_processed`, `daily_winner`, `daily_tier`, `daily_prize_amount`, `daily_claimed`
  - `weekly_processed`, `weekly_winner`, `weekly_tier`, `weekly_prize_amount`, `weekly_claimed`
- [ ] Tabla `draw_config` creada con 4 rows (daily_hour, weekly_hour, weekly_day, timezone_reference)
- [ ] 7 daily draws creados (próximos 7 días, 2 AM UTC)
- [ ] 4 weekly draws creados (próximos 4 domingos, 0 AM UTC)

#### **Tarea 3: Agregar CRON_SECRET a Vercel**
```bash
# En Vercel Dashboard:
Project Settings → Environment Variables → Add New

Name: CRON_SECRET
Value: [genera un string aleatorio seguro, ej: "crypto-lotto-cron-secret-2025-abc123xyz"]
```

---

### **DÍA 2-3: Backend API Updates** (4-6 horas)

#### **Tarea 1: Actualizar `/app/api/tickets/purchase/route.ts`**

**Cambios necesarios** (ver `ANALISIS-CAMBIOS-OPCION-A.md` líneas 108-164):
- [ ] Importar constantes: `PLATFORM_FEE_PERCENT = 25`, `DAILY_PERCENT = 20`, `WEEKLY_PERCENT = 80`
- [ ] Llamar RPC `get_next_daily_draw_id(purchase_time)` para cada ticket
- [ ] Llamar RPC `get_next_weekly_draw_id(purchase_time)` para cada ticket
- [ ] Actualizar `ticketsToInsert` con campos dual lottery:
  ```typescript
  {
    assigned_daily_draw_id: dailyDrawId,
    assigned_weekly_draw_id: weeklyDrawId,
    daily_processed: false,
    weekly_processed: false,
    // ... otros campos
  }
  ```
- [ ] Reemplazar `update_draw_prize_pool` con `update_dual_draw_prize_pools`
- [ ] Pasar parámetros: platform_fee_percent, daily_percent, weekly_percent

#### **Tarea 2: Testing de compra**
```bash
# En dev (http://localhost:3000):
1. Comprar 1 ticket con números [5, 12, 23, 45, 67] Power: 8
2. Verificar en Supabase tabla tickets:
   - ✅ assigned_daily_draw_id está lleno (ej: 1001)
   - ✅ assigned_weekly_draw_id está lleno (ej: 2000)
   - ✅ daily_processed = false
   - ✅ weekly_processed = false

3. Verificar en Supabase tabla draws:
   - ✅ Daily draw #1001 tiene prize_pool actualizado
   - ✅ Weekly draw #2000 tiene prize_pool actualizado
   - ✅ Ambos tienen platform_fee_collected incrementado
```

---

### **DÍA 4: Frontend - My Tickets Update** (3-4 horas)

#### **Tarea 1: Actualizar `lib/supabase.ts` types**
- [ ] Agregar campos dual lottery a type `Ticket` (ver `ANALISIS-CAMBIOS-OPCION-A.md` líneas 226-265)
- [ ] Agregar campos dual lottery a type `Draw`

#### **Tarea 2: Actualizar `app/my-tickets/page.tsx`**
- [ ] Agregar sección "Daily Status" que muestra:
  - Draw asignado (`assigned_daily_draw_id`)
  - Estado: "Waiting", "Winner Tier X", "No win"
  - Botón "CLAIM DAILY PRIZE" si ganó y no ha claimed
  - Badge "CLAIMED" si ya claimed
- [ ] Agregar sección "Weekly Status" (similar)
- [ ] CSS para diferenciar daily vs weekly (colores diferentes)

#### **Tarea 3: Testing visual**
- [ ] Abrir `/my-tickets`
- [ ] Verificar que muestra 2 secciones por ticket (Daily + Weekly)
- [ ] Verificar que dice "Waiting for daily draw..." y "Waiting for weekly draw..."

---

### **DÍA 5: Frontend - Dual Pools Display** (3-4 horas)

#### **Tarea 1: Crear componente `components/DualPoolDisplay.tsx`**
```tsx
// Muestra ambos pools lado a lado con countdown timers
// Daily pool: próximo draw hoy/mañana
// Weekly pool: próximo draw domingo + jackpot con rollover
```

#### **Tarea 2: Actualizar `app/page.tsx`**
- [ ] Reemplazar sección "Current Lottery" con `<DualPoolDisplay />`
- [ ] Mostrar mensaje: "ONE ticket ($0.25) enters BOTH lotteries! 🎰"

#### **Tarea 3: Testing visual**
- [ ] Ver homepage
- [ ] Verificar se muestran ambos pools
- [ ] Verificar countdown timers funcionan

---

### **DÍA 6: Admin Panel Testing** (1-2 horas)

#### **Tarea 1: Probar admin panel**
- [ ] Ir a `/admin/draw-config`
- [ ] Ver horarios actuales (2 AM UTC daily, 0 AM UTC weekly domingo)
- [ ] Ver preview de 7 zonas horarias
- [ ] Cambiar daily hour a 15:00 UTC
- [ ] Guardar cambios
- [ ] Verificar en Supabase que `draw_config` se actualizó

#### **Tarea 2: Probar CRONs manualmente**
```bash
# Testing local:
curl http://localhost:3000/api/cron/create-next-draws \
  -H "Authorization: Bearer tu-cron-secret"

# Verificar en Supabase:
# - Se crearon más draws si había menos de 7 daily o 4 weekly
# - Nuevos draws usan la hora configurada en draw_config
```

---

### **DÍA 7: CRON Testing End-to-End** (2-3 horas)

#### **Tarea 1: Testing de execute-daily-draw (MOCK)**
```bash
# Ejecutar manualmente:
curl http://localhost:3000/api/cron/execute-daily-draw \
  -H "Authorization: Bearer tu-cron-secret"

# Verificar:
# 1. Draw de hoy se marcó como executed = true
# 2. Winning numbers generados (random MOCK)
# 3. Tickets procesados (daily_processed = true)
# 4. Ganadores detectados (si hay matches)
# 5. Rollover calculado y transferido al próximo draw
```

#### **Tarea 2: Testing de execute-weekly-draw (MOCK)**
```bash
# Solo funciona si HOY es domingo, sino esperar
curl http://localhost:3000/api/cron/execute-weekly-draw \
  -H "Authorization: Bearer tu-cron-secret"

# Verificar:
# 1. Weekly draw ejecutado
# 2. Jackpot calculado (base + rollover)
# 3. Si no hay ganador → rollover acumula
# 4. Si hay ganador → rollover resetea a $0
```

---

## 🎯 ESTADO FINAL ESPERADO (Después de 7 días)

### **Backend**
- ✅ Supabase con dual lottery completo
- ✅ API purchase actualizada (25% fee, 20/80 split, dual draw assignment)
- ✅ API execute draws con rollover multi-tier
- ✅ Admin panel para horarios funcionando
- ✅ CRONs creando y ejecutando draws automáticamente

### **Frontend**
- ✅ My Tickets muestra daily y weekly separados
- ✅ Homepage muestra dual pools
- ✅ Admin puede cambiar horarios sin código

### **Sistema Infinito**
- ✅ Draws se crean automáticamente (nunca se acaban)
- ✅ Draws se ejecutan automáticamente (daily 2 AM UTC, weekly domingo 0 AM UTC)
- ✅ Rollover funciona (jackpot crece sin ganadores, resetea con ganador)

---

## 📊 DESPUÉS DE COMPLETAR BACKEND (OPCIÓN A)

### **DECISIÓN REQUERIDA**:

**OPCIÓN 1: Continuar con Smart Contracts**
- Seguir `ROADMAP-PROPUESTA-2-UPDATED.md` SEMANA 1-6
- Desarrollar smart contracts en Hardhat
- Integrar Uniswap + Chainlink VRF
- Deploy a BASE mainnet
- **Tiempo**: 4-6 semanas

**OPCIÓN 2: Pulir Frontend con MOCK**
- Agregar más visualizaciones
- Mejorar UX
- Probar con usuarios reales (MOCK prizes)
- **Tiempo**: 1-2 semanas

**OPCIÓN 3: Marketing Early Launch**
- Launch en testnet con MOCK draws
- Validar product-market fit
- Recolectar feedback
- **Tiempo**: Ongoing

---

## 📁 ARCHIVOS CLAVE PARA MAÑANA

### **SQL Migrations (ejecutar en orden)**:
1. `supabase-migration-dual-lottery-opcion-a.sql`
2. `supabase-migration-draw-config.sql`

### **Documentación de referencia**:
- `ANALISIS-CAMBIOS-OPCION-A.md` (todos los cambios detallados)
- `SISTEMA-INFINITO-CRON-JOBS.md` (cómo funcionan los CRONs)
- `HORARIOS-ADMIN-CONFIGURABLES.md` (análisis de horarios)

### **Código ya creado**:
- `/app/api/cron/create-next-draws/route.ts` ✅
- `/app/api/cron/execute-daily-draw/route.ts` ✅
- `/app/api/cron/execute-weekly-draw/route.ts` ✅
- `/app/admin/draw-config/page.tsx` ✅
- `vercel.json` (con 3 CRONs configurados) ✅

### **Código que NECESITAS modificar**:
- `/app/api/tickets/purchase/route.ts` (agregar dual draw assignment)
- `/lib/supabase.ts` (actualizar types)
- `/app/my-tickets/page.tsx` (mostrar dual wins)
- `/app/page.tsx` (mostrar dual pools)

---

## ⚙️ CONFIGURACIÓN RECOMENDADA (Ya en defaults)

### **Horarios de Draws**:
- **Daily**: 2:00 AM UTC = 6 PM PST / 9 PM EST (prime time USA) ✅
- **Weekly**: 0:00 AM UTC (domingo) = Sábado noche USA / Domingo mañana Asia ✅

### **Distribución de Ticket ($0.25 USDC)**:
- Platform fee: $0.0625 (25%) → Revenue ✅
- Daily pool: $0.0375 (20% de 75%) → 70% BTC, 25% ETH, 5% Token ✅
- Weekly pool: $0.1500 (80% de 75%) → 70% BTC, 25% ETH, 5% Token ✅

### **Prize Tiers (IGUALES para daily y weekly)**:
- Tier 5+1: 50% del pool (JACKPOT)
- Tier 5+0: 20% del pool
- Tier 4+1: 15% del pool
- Tier 4+0: 10% del pool
- Tier 3+1: 5% del pool

### **Rollover Multi-Tier**:
- Tier 5+1: 100% rollover si no hay ganadores
- Tier 5+0: 100% rollover si no hay ganadores
- Tier 4+1: 50% rollover + 50% a jackpot
- Tier 3+1 y 4+0: 100% a jackpot (alimentan tier 5+1)

---

## 🚀 RESUMEN PARA MAÑANA

1. **Ejecutar 2 migraciones SQL en Supabase** (5 min)
2. **Agregar CRON_SECRET a Vercel** (2 min)
3. **Modificar `/app/api/tickets/purchase/route.ts`** (1 hora)
4. **Probar compra de ticket** (10 min)
5. **Actualizar My Tickets page** (1-2 horas)
6. **Actualizar Homepage con dual pools** (1 hora)
7. **Probar admin panel** (30 min)
8. **Probar CRONs manualmente** (30 min)

**Total estimado**: 5-7 horas de trabajo efectivo

---

## 📌 NOTAS IMPORTANTES

- Todos los CRONs usan MOCK random numbers (Math.random) por ahora
- Smart contracts vendrán después (Opción B del roadmap original)
- Sistema funcionará 100% en MOCK mode para validar lógica
- 25% platform fee ya considerado en todo
- Horarios configurables sin tocar código ✅
- Sistema infinito (nunca se queda sin draws) ✅

---

**NOS VEMOS MAÑANA, SOCIO! 🚀**

**Empieza con las migraciones SQL y después modificar el API purchase. Todo está documentado paso a paso.**
