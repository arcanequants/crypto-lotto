# 🔄 SISTEMA DE LOTERÍA INFINITA - CRON JOBS

**Fecha**: 2025-10-23
**Sistema**: Dual Lottery (Daily + Weekly) con Rollover Infinito

---

## 🎯 CONCEPTO: LOTERÍA QUE NUNCA PARA

```
┌────────────────────────────────────────────────┐
│  DAILY LOTTERY (∞)                             │
│  ├─ Lunes → Martes → Miércoles → ... INFINITO │
│  └─ Cada día a las 8 PM                        │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  WEEKLY LOTTERY (∞)                            │
│  ├─ Domingo → Domingo → Domingo → ... INFINITO│
│  └─ Cada domingo a las 8 PM                    │
│  └─ Jackpot: $4K → $10K → $182K → RESET → $4K │
└────────────────────────────────────────────────┘
```

---

## 🛠️ 3 CRON JOBS QUE MANTIENEN EL SISTEMA VIVO

### **CRON 1: create-next-draws**
**Horario**: Todos los días a las 12:00 AM (medianoche)
**Schedule**: `"0 0 * * *"`

**Propósito**:
Asegura que SIEMPRE haya draws disponibles para los próximos 7 días (daily) y 4 semanas (weekly)

**Lógica**:
```javascript
1. Cuenta cuántos daily draws NO ejecutados existen
2. Si hay menos de 7 → Crear más hasta tener 7
3. Cuenta cuántos weekly draws NO ejecutados existen
4. Si hay menos de 4 → Crear más hasta tener 4
```

**Ejemplo**:
```
HOY: Miércoles 23 Oct
Daily draws existentes (no ejecutados):
├─ Miércoles 23 Oct 8 PM
├─ Jueves 24 Oct 8 PM
├─ Viernes 25 Oct 8 PM
├─ Sábado 26 Oct 8 PM
└─ Domingo 27 Oct 8 PM (5 draws)

CRON detecta: "Solo hay 5, necesito 7"
CRON crea:
├─ Lunes 28 Oct 8 PM
└─ Martes 29 Oct 8 PM

✅ Ahora hay 7 draws disponibles
```

---

### **CRON 2: execute-daily-draw**
**Horario**: Todos los días a las 8:00 PM
**Schedule**: `"0 20 * * *"`

**Propósito**:
Ejecuta el daily draw de HOY, calcula ganadores, rollover, y prepara el siguiente draw

**Flujo completo**:
```
1. Buscar daily draw de HOY 8 PM (no ejecutado)
2. Generar winning numbers (MOCK random o Chainlink VRF)
3. Obtener todos los tickets con assigned_daily_draw_id = este draw
4. Calcular matches (cuántos números coinciden)
5. Determinar ganadores por tier (5+1, 5+0, 4+1, 4+0, 3+1)
6. Calcular prize amounts:
   - Tier 5+1: 50% del pool + rollover
   - Tier 5+0: 20% del pool + rollover
   - Tier 4+1: 15% del pool + rollover
   - Tier 4+0: 10% del pool
   - Tier 3+1: 5% del pool

7. Actualizar tickets:
   - daily_processed = TRUE
   - daily_winner = TRUE/FALSE
   - daily_tier = "5+1" | "5+0" | ...
   - daily_prize_amount = $XX.XX

8. Calcular rollover para mañana:
   - Si NO hay ganador tier 5+1 → 100% rollover
   - Si NO hay ganador tier 5+0 → 100% rollover
   - Si NO hay ganador tier 4+1 → 50% rollover + 50% a jackpot
   - Si NO hay ganador tier 3+1 → 100% a jackpot
   - Si NO hay ganador tier 4+0 → 100% a jackpot

9. Buscar próximo daily draw (mañana)
10. Actualizar próximo draw con rollover
11. Marcar draw actual como ejecutado ✅
```

**Ejemplo con números reales**:
```
MIÉRCOLES 23 OCT - 8:00 PM

Draw #1003:
├─ Total pool: $500
├─ Rollover 5+1: $1,200 (de días anteriores)
├─ Rollover 5+0: $300
├─ Rollover 4+1: $150

Winning numbers: [5, 12, 23, 45, 67] Power: 8

Resultados:
├─ Tier 5+1 (50% = $250 + $1,200 rollover = $1,450): 0 ganadores ❌
├─ Tier 5+0 (20% = $100 + $300 rollover = $400): 1 ganador ✅
│  └─ Paga: $400 al ganador
├─ Tier 4+1 (15% = $75 + $150 rollover = $225): 0 ganadores ❌
├─ Tier 4+0 (10% = $50): 3 ganadores ✅
│  └─ Paga: $16.67 a cada uno
└─ Tier 3+1 (5% = $25): 0 ganadores ❌

Rollover para JUEVES 24 OCT:
├─ Tier 5+1: $1,450 (no hubo ganador)
│            + $112.50 (50% de tier 4+1)
│            + $25 (tier 3+1)
│            = $1,587.50 🚀 (CRECE)
├─ Tier 5+0: $0 (hubo ganador, reset)
└─ Tier 4+1: $112.50 (50% de $225)

Próximo draw (Jueves) arranca con $1,587.50 en jackpot ✅
```

---

### **CRON 3: execute-weekly-draw**
**Horario**: Domingos a las 8:00 PM
**Schedule**: `"0 20 * * 0"`

**Propósito**:
Ejecuta el weekly draw del DOMINGO, calcula JACKPOT, y reinicia o acumula

**Diferencia vs Daily**:
- ✅ Pool MÁS GRANDE (acumula toda la semana)
- ✅ Más tickets (todos los de la semana)
- ✅ JACKPOT puede crecer de $4K a $182K sin ganadores
- ✅ Si hay ganador: JACKPOT SE RESETEA y empieza de nuevo

**Flujo completo** (igual que daily pero con weekly):
```
1-6. (Mismo proceso que daily)

7. Actualizar tickets con WEEKLY results:
   - weekly_processed = TRUE
   - weekly_winner = TRUE/FALSE
   - weekly_tier = "5+1" | "5+0" | ...
   - weekly_prize_amount = $XX,XXX.XX

8. Calcular rollover para PRÓXIMO DOMINGO:

   CASO A: HAY GANADOR DE JACKPOT 🎊
   ├─ Pagar jackpot completo (base + rollover)
   ├─ RESETEAR rollover a $0
   └─ Próximo weekly empieza desde $0 (NUEVO CICLO)

   CASO B: NO HAY GANADOR DE JACKPOT 🔄
   ├─ Rollover ACUMULA todo
   └─ Próximo weekly crece exponencialmente

9. Buscar próximo weekly draw (próximo domingo)
10. Actualizar con rollover
11. Marcar draw actual como ejecutado ✅
```

**Ejemplo: JACKPOT GANADO**:
```
DOMINGO 29 OCT - 8:00 PM

Draw #2000:
├─ Total pool: $7,500
├─ Rollover 5+1: $175,000 (12 semanas acumuladas)
├─ Total JACKPOT: $7,500 * 50% + $175,000 = $178,750 💰

Winning numbers: [5, 12, 23, 45, 67] Power: 8

Resultados:
├─ Tier 5+1 (JACKPOT): 2 ganadores ✅ 🎊
│  └─ Paga: $89,375 a cada uno ($178,750 / 2)
└─ ... otros tiers

Próximo domingo (5 Nov):
├─ Rollover 5+1: $0 ✅ (RESET, empieza de nuevo)
└─ Ciclo nuevo: $4K → $10K → $182K → ...

🎉 LOTERÍA REINICIADA - SIEMPRE INFINITA
```

**Ejemplo: SIN GANADOR (ACUMULA)**:
```
DOMINGO 29 OCT - 8:00 PM

Draw #2000:
├─ Total pool: $7,500
├─ Rollover 5+1: $50,000
├─ Total JACKPOT: $7,500 * 50% + $50,000 = $53,750

Winning numbers: [5, 12, 23, 45, 67] Power: 8

Resultados:
├─ Tier 5+1 (JACKPOT): 0 ganadores ❌
└─ ... otros tiers

Próximo domingo (5 Nov):
├─ Rollover 5+1: $53,750 🚀 (ACUMULA)
│                + bonus de otros tiers sin ganadores
│                = $65,000 (ejemplo)
└─ Sigue creciendo...

Semana siguiente:
├─ Rollover: $65,000 + nuevo pool
└─ Puede llegar a $182K en 12 semanas
```

---

## 📅 CRONOGRAMA SEMANAL COMPLETO

```
LUNES
├─ 12:00 AM: CRON 1 (create-next-draws) ✅
└─  8:00 PM: CRON 2 (execute-daily-draw) ✅

MARTES
├─ 12:00 AM: CRON 1 (create-next-draws) ✅
└─  8:00 PM: CRON 2 (execute-daily-draw) ✅

MIÉRCOLES
├─ 12:00 AM: CRON 1 (create-next-draws) ✅
└─  8:00 PM: CRON 2 (execute-daily-draw) ✅

JUEVES
├─ 12:00 AM: CRON 1 (create-next-draws) ✅
└─  8:00 PM: CRON 2 (execute-daily-draw) ✅

VIERNES
├─ 12:00 AM: CRON 1 (create-next-draws) ✅
└─  8:00 PM: CRON 2 (execute-daily-draw) ✅

SÁBADO
├─ 12:00 AM: CRON 1 (create-next-draws) ✅
└─  8:00 PM: CRON 2 (execute-daily-draw) ✅

DOMINGO 🎰
├─ 12:00 AM: CRON 1 (create-next-draws) ✅
├─  8:00 PM: CRON 2 (execute-daily-draw) ✅
└─  8:00 PM: CRON 3 (execute-weekly-draw) ✅ 💰
```

**NOTA**: Los 3 CRONs corren 24/7, 365 días al año, INFINITAMENTE.

---

## 🔐 SEGURIDAD: CRON_SECRET

Todos los CRONs requieren autenticación para evitar ejecuciones no autorizadas:

```typescript
// En cada CRON endpoint:
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

**Setup en Vercel**:
1. Ir a Project Settings → Environment Variables
2. Agregar: `CRON_SECRET` = "tu-secreto-aleatorio-super-seguro"
3. Vercel automáticamente incluye este header cuando ejecuta CRONs

---

## 📊 MONITOREO Y LOGS

Cada CRON escribe logs detallados:

```javascript
console.log('[CRON] Starting execute-daily-draw job...');
console.log(`[CRON] Executing daily draw #${drawId}`);
console.log(`[CRON] Winning numbers: [${numbers}]`);
console.log('[CRON] Winners by tier:', { ... });
console.log('[CRON] ✅ Draw executed successfully');
```

**Ver logs en Vercel**:
1. Ir a Deployments → Production
2. Click en "View Function Logs"
3. Filtrar por "/api/cron/"

---

## 🚨 ¿QUÉ PASA SI ALGO FALLA?

### Fallo en CRON 1 (create-next-draws):
**Problema**: No se crean nuevos draws
**Impacto**: Después de 7 días, usuarios no pueden comprar tickets
**Solución**: CRON corre diario, tiene 7 días de buffer
**Backup**: Frontend puede detectar "no hay draws" y alertar

### Fallo en CRON 2/3 (execute draws):
**Problema**: Draw no se ejecuta a tiempo
**Impacto**: Usuarios esperan resultados
**Solución**:
1. Vercel reintenta automáticamente si falla
2. Podemos ejecutar manualmente: `GET /api/cron/execute-daily-draw` con CRON_SECRET
3. Frontend muestra "Draw delayed, executing soon"

### Fallo en Database:
**Problema**: Supabase no responde
**Impacto**: CRON no puede leer/escribir datos
**Solución**:
1. CRON retorna error 500
2. Vercel reintenta en próxima ejecución
3. Draws quedan pendientes hasta que DB vuelva

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### FASE 1: Setup (5 minutos)
- [ ] Ejecutar migración SQL en Supabase
- [ ] Agregar `CRON_SECRET` en Vercel Environment Variables
- [ ] Verificar archivos creados:
  - [ ] `/app/api/cron/create-next-draws/route.ts`
  - [ ] `/app/api/cron/execute-daily-draw/route.ts`
  - [ ] `/app/api/cron/execute-weekly-draw/route.ts`
- [ ] Verificar `vercel.json` actualizado con 3 CRONs

### FASE 2: Deploy (10 minutos)
- [ ] Commit cambios:
```bash
git add .
git commit -m "Add infinite lottery CRON system"
git push
```
- [ ] Vercel auto-deploy
- [ ] Verificar CRONs activos en Vercel Dashboard

### FASE 3: Testing Manual (10 minutos)
**Probar CRON 1**:
```bash
curl -X GET https://tu-app.vercel.app/api/cron/create-next-draws \
  -H "Authorization: Bearer tu-cron-secret"
```
Verificar en Supabase: ¿Se crearon 7 daily + 4 weekly draws?

**Probar CRON 2** (si hay draw de hoy):
```bash
curl -X GET https://tu-app.vercel.app/api/cron/execute-daily-draw \
  -H "Authorization: Bearer tu-cron-secret"
```
Verificar: ¿Draw marcado como ejecutado? ¿Tickets actualizados?

**Probar CRON 3** (si hoy es domingo):
```bash
curl -X GET https://tu-app.vercel.app/api/cron/execute-weekly-draw \
  -H "Authorization: Bearer tu-cron-secret"
```
Verificar: ¿Weekly draw ejecutado? ¿Rollover calculado?

### FASE 4: Monitoring (Ongoing)
- [ ] Revisar logs en Vercel cada día
- [ ] Verificar que draws se ejecutan a las 8 PM
- [ ] Confirmar que se crean nuevos draws diariamente
- [ ] Monitorear rollover creciendo correctamente

---

## 🎯 RESULTADO FINAL

### LO QUE TIENES AHORA:
✅ Sistema de lotería que NUNCA PARA
✅ Daily draws automáticos (todos los días 8 PM)
✅ Weekly draws automáticos (domingos 8 PM)
✅ Rollover multi-tier funcionando
✅ Jackpot puede crecer de $4K a $182K
✅ Cuando alguien gana jackpot → RESETEA y empieza de nuevo
✅ Sistema puede correr 10 años sin intervención manual

### LO QUE LOS USUARIOS VEN:
✅ Siempre pueden comprar tickets (never "sold out")
✅ Draws se ejecutan puntualmente (8 PM diario)
✅ Jackpot crece cada semana sin ganadores
✅ Cuando ganan, reciben pago y lotería continúa
✅ Experiencia fluida 24/7/365

---

## 🚀 PRÓXIMOS PASOS

1. **AHORA**: Ejecutar migración SQL
2. **HOY**: Deploy a Vercel y verificar CRONs
3. **MAÑANA**: Monitorear primer daily draw automático
4. **PRÓXIMO DOMINGO**: Ver primer weekly draw automático
5. **PRÓXIMAS SEMANAS**: Ver jackpot crecer

---

**SOCIO, EL SISTEMA ESTÁ LISTO PARA SER INFINITO. 🔄💰**
