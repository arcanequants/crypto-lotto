# 🚀 ROADMAP PRE-PRODUCCIÓN - CRYPTO LOTTO
**Fecha de inicio**: 2025-10-24
**Objetivo**: MVP completo en producción (Vercel)
**Tiempo estimado**: 8-10 horas de trabajo efectivo

---

## 📊 ESTADO ACTUAL

### ✅ COMPLETADO
- [x] Dual Lottery System (backend + frontend)
- [x] Homepage con DualPoolDisplay premium
- [x] My Tickets page con dual status
- [x] Privy authentication
- [x] CRONs creados (create-draws, execute-daily, execute-weekly)
- [x] Admin panel para horarios
- [x] Supabase migrations ejecutadas

### ❌ PENDIENTE
- [ ] Build exitoso (actualmente falla)
- [ ] CRONs testeados
- [ ] Error handling robusto
- [ ] Loading states optimizados
- [ ] Console.logs limpiados
- [ ] Documentation completa
- [ ] Deploy a Vercel

---

## 🎯 ROADMAP COMPLETO

---

# FASE 1: FIX BLOQUEADORES CRÍTICOS (1-2 horas)

## ✅ TAREA 1.1: Fix Build Error - Crear Supabase Server Client
**Tiempo**: 30 minutos
**Prioridad**: 🔴 CRÍTICA - BLOQUEA TODO

### Problema
```
Module not found: Can't resolve '@/lib/supabase/server'
```

Archivos afectados (Sistema de Votación de Token del Mes):
- `/app/api/cron/finalize-vote/route.ts`
- `/app/api/tokens/proposals/current/route.ts`
- `/app/api/tokens/proposals/generate/route.ts`
- `/app/api/tokens/vote/route.ts`
- `/app/vote/page.tsx`

### Contexto del Sistema de Votación
El sistema de votación del token del mes es una feature importante:
- Permite a usuarios votar por el token del mes (5% del prize pool)
- Opciones: MATIC, LINK, UNI, AAVE, etc.
- La votación se cierra el día 25 de cada mes
- El ganador se usa en el próximo mes
- CRON `finalize-vote` cuenta votos automáticamente

### Solución: Crear `/lib/supabase/server.ts`

Este archivo es necesario para server-side rendering y API routes que necesitan acceso a Supabase sin exponer keys en el cliente.

### Pasos

**1. Crear `/lib/supabase/server.ts`**:
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
```

**2. Instalar dependencia necesaria**:
```bash
npm install @supabase/ssr
```

**3. Verificar build**:
```bash
npm run build
```

### Verificación
- [ ] `/lib/supabase/server.ts` creado
- [ ] `@supabase/ssr` instalado
- [ ] `npm run build` completa sin errores
- [ ] Build size mostrado
- [ ] No hay errores de módulos faltantes
- [ ] Sistema de votación funcional

---

## ✅ TAREA 1.2: Fix Metadata Warnings Next.js 15
**Tiempo**: 15 minutos
**Prioridad**: 🟡 ALTA

### Problema
```
Unsupported metadata themeColor/viewport is configured in metadata export
```

### Solución
Mover `themeColor` y `viewport` de `metadata` export a `generateViewport` export

### Pasos
1. Buscar en `/app/layout.tsx` o `/app/page.tsx`
2. Extraer `themeColor` y `viewport` del objeto `metadata`
3. Crear nuevo export `generateViewport`
4. Verificar warnings desaparecen

### Código esperado
```typescript
// ANTES (incorrecto)
export const metadata = {
  title: 'CryptoLotto',
  themeColor: '#0a0e27',
  viewport: 'width=device-width, initial-scale=1'
}

// DESPUÉS (correcto)
export const metadata = {
  title: 'CryptoLotto'
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0e27'
}
```

### Verificación
- [ ] Warnings de metadata desaparecen
- [ ] Build limpio
- [ ] App funciona igual

---

## ✅ TAREA 1.3: Fix Workspace Lockfile Warning
**Tiempo**: 5 minutos
**Prioridad**: 🟡 MEDIA

### Problema
```
Warning: Next.js inferred your workspace root
```

### Solución
Eliminar lockfile duplicado o configurar `next.config.js`

### Pasos
```bash
# OPCIÓN A: Eliminar lockfile duplicado
rm /Users/albertosorno/package-lock.json

# OPCIÓN B: Configurar next.config.js
# Agregar: outputFileTracingRoot: path.join(__dirname, '../../')
```

### Verificación
- [ ] Warning desaparece
- [ ] Build sigue funcionando

---

## ✅ TAREA 1.4: Verificar Build Completo
**Tiempo**: 10 minutos
**Prioridad**: 🔴 CRÍTICA

### Pasos
```bash
1. npm run build
2. Verificar output:
   - ✓ Creating an optimized production build
   - ✓ Compiled successfully
   - ✓ Route sizes mostrados
3. Verificar bundle size < 1MB total
4. npm run start (test production local)
5. Abrir http://localhost:3000
6. Verificar todo funciona
```

### Verificación
- [ ] Build completa sin errores
- [ ] Production server inicia
- [ ] Homepage carga correctamente
- [ ] DualPoolDisplay muestra datos
- [ ] My Tickets funciona
- [ ] Privy login funciona

---

# FASE 2: SISTEMA DE VOTACIÓN DE TOKEN DEL MES (1 hora)

## ✅ TAREA 2.0: Verificar Sistema de Votación Completo
**Tiempo**: 1 hora
**Prioridad**: 🟡 ALTA (Feature importante)

### Contexto
El sistema permite que los usuarios voten por el "Token del Mes" que será usado en el 5% del prize pool. Es una feature de gobernanza descentralizada que da poder a la comunidad.

### Componentes del Sistema

**Backend APIs**:
- ✅ `/app/api/tokens/vote/route.ts` - Votar + verificar voto
- ✅ `/app/api/tokens/proposals/current/route.ts` - Obtener propuesta activa
- ✅ `/app/api/tokens/proposals/generate/route.ts` - Generar propuesta (manual)
- ✅ `/app/api/cron/finalize-vote/route.ts` - Finalizar votación automáticamente

**Frontend**:
- ✅ `/app/vote/page.tsx` - Página de votación

**Database** (ya existe en Supabase):
- `monthly_token_proposals` - Propuestas mensuales
- `token_votes` - Votos de usuarios

### Testing del Sistema

**PASO 1: Verificar Propuesta Activa**
```bash
# Abrir Supabase SQL Editor
SELECT * FROM monthly_token_proposals
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 1;

# Si NO hay propuesta activa, crear una:
INSERT INTO monthly_token_proposals (
  month,
  year,
  proposed_tokens,
  voting_start_date,
  voting_end_date,
  status,
  total_votes
) VALUES (
  10,  -- Octubre
  2025,
  ARRAY['MATIC', 'LINK', 'UNI', 'AAVE', 'CRV'],
  '2025-10-01 00:00:00+00',
  '2025-10-25 23:59:59+00',
  'active',
  0
);
```

**PASO 2: Test Voting API**
```bash
# 1. Test GET - Verificar si usuario ya votó
curl http://localhost:3001/api/tokens/vote?wallet_address=0xTEST123

# Response esperado (no ha votado):
{
  "success": true,
  "has_voted": false,
  "vote": null
}

# 2. Test POST - Registrar voto
curl -X POST http://localhost:3001/api/tokens/vote \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "0xTEST123",
    "token_symbol": "LINK"
  }'

# Response esperado:
{
  "success": true,
  "message": "Vote registered successfully",
  "vote": {
    "id": 1,
    "proposal_id": 1,
    "wallet_address": "0xtest123",
    "token_symbol": "LINK",
    "voted_at": "2025-10-24T..."
  }
}

# 3. Test GET de nuevo - Verificar voto registrado
curl http://localhost:3001/api/tokens/vote?wallet_address=0xTEST123

# Response esperado (ya votó):
{
  "success": true,
  "has_voted": true,
  "vote": {
    "token_symbol": "LINK",
    "voted_at": "2025-10-24T..."
  }
}

# 4. Test votar dos veces (debe fallar)
curl -X POST http://localhost:3001/api/tokens/vote \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "0xTEST123",
    "token_symbol": "UNI"
  }'

# Response esperado (error):
{
  "success": false,
  "error": "Already voted",
  "message": "You already voted for LINK this month"
}
```

**PASO 3: Test Current Proposal API**
```bash
curl http://localhost:3001/api/tokens/proposals/current

# Response esperado:
{
  "success": true,
  "proposal": {
    "id": 1,
    "month": 10,
    "year": 2025,
    "proposed_tokens": ["MATIC", "LINK", "UNI", "AAVE", "CRV"],
    "voting_start_date": "2025-10-01T00:00:00Z",
    "voting_end_date": "2025-10-25T23:59:59Z",
    "status": "active",
    "total_votes": 1
  }
}
```

**PASO 4: Test Frontend - Página de Votación**
```bash
# 1. Abrir http://localhost:3001/vote
# 2. Verificar que muestra:
#    - Lista de tokens propuestos
#    - Botones para votar
#    - Mensaje si ya votaste
# 3. Conectar wallet con Privy
# 4. Votar por un token
# 5. Verificar mensaje de éxito
# 6. Verificar que ya no puede votar de nuevo
```

**PASO 5: Test Finalize Vote CRON (Manual)**
```bash
# Este CRON se ejecuta el día 25 de cada mes a las 23:59 UTC
# Para testing, ejecutar manualmente:

curl http://localhost:3001/api/cron/finalize-vote \
  -H "Authorization: Bearer crypto-lotto-cron-2025-base-secure-xyz789" \
  -v

# Response esperado:
{
  "success": true,
  "message": "Vote finalized successfully",
  "proposal_id": 1,
  "winner_token": "LINK",
  "total_votes": 15,
  "vote_counts": {
    "LINK": 8,
    "MATIC": 4,
    "UNI": 2,
    "AAVE": 1,
    "CRV": 0
  }
}

# Verificar en Supabase:
SELECT * FROM monthly_token_proposals WHERE id = 1;
# ✓ status = 'completed'
# ✓ winner_token = 'LINK'
# ✓ finalized_at tiene timestamp
```

### Verificación Completa
- [ ] Propuesta activa existe en DB
- [ ] GET /api/tokens/vote funciona (verificar voto)
- [ ] POST /api/tokens/vote funciona (registrar voto)
- [ ] No permite votar 2 veces
- [ ] GET /api/tokens/proposals/current funciona
- [ ] Página /vote carga correctamente
- [ ] Frontend permite votar
- [ ] Frontend muestra mensaje si ya votaste
- [ ] CRON finalize-vote cuenta votos correctamente
- [ ] CRON marca ganador y cierra votación

### Integración con Prize Pools
Una vez que la votación se finaliza:
1. El `winner_token` se guarda en `monthly_token_proposals`
2. Los nuevos `weekly draws` deben usar `month_token = winner_token`
3. El CRON `create-next-draws` debe leer el ganador del mes actual
4. Los prizes del 5% se distribuyen en ese token

**NOTA**: Verificar que `create-next-draws` usa el token ganador:
```typescript
// En /app/api/cron/create-next-draws/route.ts
// Al crear weekly draws, debe:
// 1. Buscar propuesta del mes actual
// 2. Si está completed, usar winner_token
// 3. Si no, usar default (MATIC)
```

---

# FASE 3: TESTING DE CRONs DE DRAWS (1-2 horas)

## ✅ TAREA 2.1: Setup CRON Testing
**Tiempo**: 10 minutos
**Prioridad**: 🔴 CRÍTICA

### Pasos
1. Verificar CRON_SECRET en `.env.local`
2. Si no existe, agregarlo:
```bash
CRON_SECRET=crypto-lotto-cron-2025-base-secure-xyz789
```
3. Reiniciar dev server

### Verificación
- [ ] CRON_SECRET presente en .env.local
- [ ] Dev server corriendo

---

## ✅ TAREA 2.2: Test CREATE-NEXT-DRAWS CRON
**Tiempo**: 20 minutos
**Prioridad**: 🔴 CRÍTICA

### Objetivo
Verificar que el CRON crea draws automáticamente cuando quedan menos de 7 daily o 4 weekly

### Pasos
```bash
# 1. Verificar draws actuales en Supabase
SELECT draw_type, COUNT(*)
FROM draws
WHERE executed = false
GROUP BY draw_type;

# 2. Ejecutar CRON manualmente
curl http://localhost:3001/api/cron/create-next-draws \
  -H "Authorization: Bearer crypto-lotto-cron-2025-base-secure-xyz789" \
  -v

# 3. Verificar response
# Debe retornar: { success: true, dailyCreated: X, weeklyCreated: Y }

# 4. Verificar en Supabase
# - Se crearon nuevos draws
# - Tienen horarios correctos (2 AM UTC daily, 0 AM UTC weekly)
# - draw_type correcto
# - executed = false
```

### Verificación
- [ ] CRON responde con success: true
- [ ] Se crearon draws faltantes
- [ ] Horarios correctos según draw_config
- [ ] Total de draws: 7 daily + 4 weekly pendientes

---

## ✅ TAREA 2.3: Test EXECUTE-DAILY-DRAW CRON
**Tiempo**: 30 minutos
**Prioridad**: 🔴 CRÍTICA

### Objetivo
Verificar que el CRON ejecuta daily draws, genera números ganadores, procesa tickets y calcula rollover

### Setup
```sql
-- 1. Crear un daily draw para HOY (para poder ejecutarlo)
INSERT INTO draws (
  draw_id, draw_type, end_time, executed,
  total_prize_usd, cbbtc_amount, weth_amount, token_amount,
  month_token
) VALUES (
  9999, 'daily', NOW() - INTERVAL '1 hour', false,
  100.00, 0.00092593, 0.02538071, 5.00,
  'MATIC'
);

-- 2. Crear tickets de prueba para este draw
INSERT INTO tickets (
  ticket_id, wallet_address, numbers, power_number,
  price_paid, assigned_daily_draw_id, daily_processed
) VALUES
(111111, '0xTEST1', ARRAY[5,12,23,45,67], 8, 0.25,
 (SELECT id FROM draws WHERE draw_id = 9999), false),
(222222, '0xTEST2', ARRAY[1,2,3,4,5], 1, 0.25,
 (SELECT id FROM draws WHERE draw_id = 9999), false);
```

### Pasos
```bash
# 1. Ejecutar CRON
curl http://localhost:3001/api/cron/execute-daily-draw \
  -H "Authorization: Bearer crypto-lotto-cron-2025-base-secure-xyz789" \
  -v

# 2. Verificar response
# Debe retornar: {
#   success: true,
#   drawsExecuted: 1,
#   winningNumbers: [X, X, X, X, X],
#   powerNumber: X,
#   winnersFound: X,
#   rolloverTransferred: X
# }
```

### Verificación en Supabase
```sql
-- 1. Draw marcado como executed
SELECT * FROM draws WHERE draw_id = 9999;
-- ✓ executed = true
-- ✓ winning_numbers tiene 5 números
-- ✓ power_number tiene 1 número
-- ✓ executed_at tiene timestamp

-- 2. Tickets procesados
SELECT * FROM tickets WHERE assigned_daily_draw_id = (SELECT id FROM draws WHERE draw_id = 9999);
-- ✓ daily_processed = true
-- ✓ daily_winner = true/false (dependiendo de match)
-- ✓ daily_tier tiene valor si ganó
-- ✓ daily_prize_amount > 0 si ganó

-- 3. Rollover calculado (si no hubo ganadores en tier 5+1, 5+0, 4+1)
SELECT * FROM draws WHERE draw_id = (SELECT MIN(draw_id) FROM draws WHERE draw_type = 'daily' AND executed = false);
-- ✓ rollover_tier_5_1, rollover_tier_5_0, rollover_tier_4_1 actualizados
```

### Verificación
- [ ] Draw ejecutado correctamente
- [ ] Winning numbers generados (5 números + 1 power)
- [ ] Tickets procesados
- [ ] Winners detectados (si hay match)
- [ ] Rollover calculado y transferido al próximo draw

---

## ✅ TAREA 2.4: Test EXECUTE-WEEKLY-DRAW CRON
**Tiempo**: 30 minutos
**Prioridad**: 🔴 CRÍTICA

### Objetivo
Verificar que el CRON ejecuta weekly draws, maneja jackpot y rollover acumulado

### Setup
```sql
-- 1. Crear un weekly draw para HOY (domingo o forzar)
INSERT INTO draws (
  draw_id, draw_type, end_time, executed,
  total_prize_usd, cbbtc_amount, weth_amount, token_amount,
  month_token, rollover_tier_5_1
) VALUES (
  8888, 'weekly', NOW() - INTERVAL '1 hour', false,
  500.00, 0.00462963, 0.12690355, 25.00,
  'MATIC', 100.00  -- Rollover acumulado de draws anteriores
);

-- 2. Crear tickets de prueba
INSERT INTO tickets (
  ticket_id, wallet_address, numbers, power_number,
  price_paid, assigned_weekly_draw_id, weekly_processed
) VALUES
(333333, '0xTEST3', ARRAY[10,20,30,40,50], 10, 0.25,
 (SELECT id FROM draws WHERE draw_id = 8888), false);
```

### Pasos
```bash
# 1. Ejecutar CRON
curl http://localhost:3001/api/cron/execute-weekly-draw \
  -H "Authorization: Bearer crypto-lotto-cron-2025-base-secure-xyz789" \
  -v

# 2. Verificar response
```

### Verificación en Supabase
```sql
-- 1. Draw ejecutado
SELECT * FROM draws WHERE draw_id = 8888;
-- ✓ executed = true
-- ✓ winning_numbers generados
-- ✓ power_number generado

-- 2. Tickets procesados
SELECT * FROM tickets WHERE assigned_weekly_draw_id = (SELECT id FROM draws WHERE draw_id = 8888);
-- ✓ weekly_processed = true
-- ✓ weekly_winner = true/false
-- ✓ weekly_tier tiene valor si ganó

-- 3. Jackpot manejado
-- Si NO hubo ganador 5+1:
SELECT * FROM draws WHERE draw_id = (SELECT MIN(draw_id) FROM draws WHERE draw_type = 'weekly' AND executed = false);
-- ✓ rollover_tier_5_1 = rollover anterior + premio tier 5+1 no ganado

-- Si SÍ hubo ganador 5+1:
-- ✓ rollover_tier_5_1 = 0 (resetea)
```

### Verificación
- [ ] Weekly draw ejecutado
- [ ] Jackpot calculado (base + rollover)
- [ ] Si no hay ganador → rollover acumula
- [ ] Si hay ganador → rollover resetea a $0

---

# FASE 3: ERROR HANDLING & POLISH (2-3 horas)

## ✅ TAREA 3.1: Crear Error Boundaries
**Tiempo**: 30 minutos
**Prioridad**: 🟡 ALTA

### Objetivo
Evitar que la app crashee completamente si hay un error

### Archivos a crear
```typescript
// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: 'rgba(255, 0, 0, 0.1)',
          borderRadius: '20px',
          margin: '20px'
        }}>
          <h2 style={{ color: '#ff6b6b', marginBottom: '20px' }}>
            ⚠️ Something went wrong
          </h2>
          <p style={{ opacity: 0.8 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: 'var(--primary)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            🔄 Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Archivos a actualizar
Wrap páginas principales con ErrorBoundary:

**app/my-tickets/page.tsx**:
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function MyTicketsPage() {
  return (
    <ErrorBoundary>
      {/* ... contenido existente */}
    </ErrorBoundary>
  );
}
```

**app/prizes/page.tsx**: Igual
**app/results/page.tsx**: Igual

### Verificación
- [ ] ErrorBoundary.tsx creado
- [ ] Páginas principales wrapped
- [ ] Test: Lanzar error intencional → muestra fallback
- [ ] Test: Reload button funciona

---

## ✅ TAREA 3.2: Limpiar Console.logs
**Tiempo**: 20 minutos
**Prioridad**: 🟡 ALTA

### Objetivo
Remover todos los console.log/error innecesarios de producción

### Archivos a revisar
```bash
# Buscar todos los console.log/error
grep -r "console\." app/ --include="*.ts" --include="*.tsx"
```

### Reglas
- **MANTENER**: console.error en catch blocks (errors críticos)
- **REMOVER**: console.log de debug
- **REMOVER**: console.error de validaciones (usar throw Error en su lugar)

### Archivos principales
1. `app/page.tsx` - Remover logs de Supabase errors
2. `app/api/tickets/purchase/route.ts` - Mantener solo errors críticos
3. `app/api/cron/**` - Mantener logs de ejecución (útil para debugging)
4. `components/**` - Remover todos los logs

### Verificación
- [ ] No hay console.log en archivos de producción
- [ ] Solo console.error para errores críticos
- [ ] Build warnings limpios

---

## ✅ TAREA 3.3: Agregar Loading Skeletons
**Tiempo**: 1 hora
**Prioridad**: 🟡 MEDIA

### Objetivo
Mejor UX mostrando layout mientras carga en vez de spinners

### Componente a crear
```typescript
// components/SkeletonCard.tsx
export function SkeletonCard() {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '20px',
      padding: '20px',
      animation: 'pulse 1.5s ease-in-out infinite'
    }}>
      <div style={{
        height: '20px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        marginBottom: '15px',
        width: '60%'
      }} />
      <div style={{
        height: '40px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        marginBottom: '10px'
      }} />
      <div style={{
        height: '20px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        width: '40%'
      }} />
    </div>
  );
}
```

### Donde agregar
1. **My Tickets page**: Skeleton de ticket cards
   ```tsx
   {loading && (
     <div style={{ display: 'grid', gap: '20px' }}>
       {[1,2,3].map(i => <SkeletonCard key={i} />)}
     </div>
   )}
   ```

2. **Prizes page**: Skeleton de prize cards
3. **DualPoolDisplay**: Ya tiene loading state, mejorar con skeleton

### Verificación
- [ ] SkeletonCard.tsx creado
- [ ] My Tickets muestra skeletons mientras carga
- [ ] Prizes muestra skeletons mientras carga
- [ ] Transición suave skeleton → data

---

## ✅ TAREA 3.4: Optimizar Supabase Queries
**Tiempo**: 30 minutos
**Prioridad**: 🟡 MEDIA

### Objetivo
Queries más rápidas y eficientes

### Cambios a hacer

**app/my-tickets/page.tsx**:
```typescript
// ANTES
const { data: tickets } = await supabase
  .from('tickets')
  .select('*')
  .eq('wallet_address', walletAddress);

// DESPUÉS (solo selecciona lo necesario)
const { data: tickets } = await supabase
  .from('tickets')
  .select(`
    ticket_id,
    numbers,
    power_number,
    created_at,
    assigned_daily_draw_id,
    assigned_weekly_draw_id,
    daily_processed,
    daily_winner,
    daily_tier,
    daily_prize_amount,
    weekly_processed,
    weekly_winner,
    weekly_tier,
    weekly_prize_amount
  `)
  .eq('wallet_address', walletAddress)
  .order('created_at', { ascending: false })
  .limit(50); // Limitar a últimos 50 tickets
```

**components/DualPoolDisplay.tsx**:
```typescript
// Ya está optimizado, pero agregar:
.select('id, draw_id, total_prize_usd, end_time, total_tickets, cbbtc_amount, weth_amount, token_amount, month_token')
// En vez de .select('*')
```

### Verificación
- [ ] Queries tienen .select() específico
- [ ] Queries tienen .limit() donde apropiado
- [ ] Queries tienen .order() para consistencia
- [ ] Tiempo de carga mejorado

---

## ✅ TAREA 3.5: Agregar Try-Catch en todas las APIs
**Tiempo**: 30 minutos
**Prioridad**: 🟡 MEDIA

### Objetivo
Error handling robusto en todos los endpoints

### Template
```typescript
export async function POST(request: NextRequest) {
  try {
    // ... lógica

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Error in /api/endpoint:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### Archivos a revisar
- [ ] `/app/api/tickets/purchase/route.ts` - Ya tiene
- [ ] `/app/api/cron/create-next-draws/route.ts` - Agregar
- [ ] `/app/api/cron/execute-daily-draw/route.ts` - Agregar
- [ ] `/app/api/cron/execute-weekly-draw/route.ts` - Agregar
- [ ] `/app/api/prizes/live/route.ts` - Agregar

### Verificación
- [ ] Todos los endpoints tienen try-catch
- [ ] Errors retornan JSON válido
- [ ] Status codes apropiados (400, 500)

---

# FASE 4: DOCUMENTATION (30 min - 1 hora)

## ✅ TAREA 4.1: Crear README.md Principal
**Tiempo**: 20 minutos
**Prioridad**: 🟡 ALTA

### Archivo a crear
```markdown
# 🎰 CryptoLotto - Blockchain Lottery on BASE

The world's most transparent lottery powered by blockchain technology.

## 🚀 Features

- **Dual Lottery System**: Every $0.25 ticket enters BOTH daily and weekly draws
- **100% On-Chain**: Verifiable by anyone, impossible to manipulate
- **Crypto Prizes**: Win in cbBTC, wETH, and MATIC
- **Infinite System**: Draws created and executed automatically via CRONs
- **Admin Panel**: Configure draw times without touching code

## 🏗️ Tech Stack

- **Frontend**: Next.js 15.5, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Auth**: Privy (wallet connect + email)
- **Blockchain**: BASE L2 (Ethereum)
- **Deployment**: Vercel

## 📦 Installation

```bash
# Clone repo
git clone https://github.com/your-repo/crypto-lotto.git
cd crypto-lotto/web

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Fill in:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - NEXT_PUBLIC_PRIVY_APP_ID
# - CRON_SECRET

# Run development server
npm run dev
```

## 🌐 Environment Variables

### Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `NEXT_PUBLIC_PRIVY_APP_ID` - Privy app ID
- `CRON_SECRET` - Secret for CRON authentication

### Optional
- `NEXT_PUBLIC_APP_URL` - Your app URL (default: http://localhost:3000)

## 🗄️ Database Setup

1. Create a Supabase project
2. Run migrations in order:
   ```sql
   -- Execute in Supabase SQL Editor
   1. supabase-schema.sql
   2. supabase-migration-dual-lottery-opcion-a.sql
   3. supabase-migration-draw-config.sql
   ```

## ⚙️ CRON Jobs (Vercel)

The system has 3 automated CRONs:

1. **Create Next Draws** - Every hour
   - Ensures always 7 daily + 4 weekly draws pending

2. **Execute Daily Draw** - Daily at 2:00 AM UTC
   - Generates winning numbers (MOCK)
   - Processes tickets
   - Calculates winners
   - Transfers rollover to next draw

3. **Execute Weekly Draw** - Weekly Sunday 12:00 AM UTC
   - Generates winning numbers (MOCK)
   - Processes tickets
   - Handles jackpot + rollover

## 🎮 How to Use

### As a User
1. Connect wallet (or email via Privy)
2. Pick 5 numbers (1-50) + 1 power number (1-20)
3. Buy ticket ($0.25 USDC)
4. Your ticket enters BOTH daily and weekly draws!
5. Check "My Tickets" to see results
6. Claim prizes when you win

### As an Admin
1. Go to `/admin/draw-config`
2. Change draw times (Daily/Weekly)
3. Preview in multiple timezones
4. Save changes
5. Future draws will use new schedule

## 📁 Project Structure

```
/app
  /api
    /cron          # CRON jobs
    /tickets       # Ticket purchase
    /prizes        # Prize claiming
  /my-tickets      # User tickets page
  /prizes          # Prizes page
  /results         # Winning numbers
  /admin           # Admin panel
/components
  DualPoolDisplay  # Homepage pools
  ErrorBoundary    # Error handling
  LoginButton      # Privy auth
/lib
  supabase.ts      # Supabase client
  analytics.ts     # Analytics
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy
5. Vercel will auto-configure CRONs from `vercel.json`

## 📊 System Architecture

```
User → Frontend (Next.js)
  ↓
API Routes (Next.js)
  ↓
Supabase (PostgreSQL)
  ↓
CRONs (Vercel) → Execute Draws
  ↓
Future: Smart Contracts (BASE)
```

## 🔮 Roadmap

- [x] Dual Lottery MVP
- [x] CRON automation
- [x] Admin panel
- [ ] Real crypto integration (currently MOCK)
- [ ] Smart contracts on BASE
- [ ] Chainlink VRF for random numbers
- [ ] Prize claiming via wallet signatures
- [ ] Token governance voting

## 📄 License

MIT

## 🤝 Contributing

PRs welcome! Please read CONTRIBUTING.md first.

## 📧 Contact

For support: support@cryptolotto.xyz
```

### Verificación
- [ ] README.md creado
- [ ] Todas las secciones completas
- [ ] Instructions claras

---

## ✅ TAREA 4.2: Crear .env.example
**Tiempo**: 5 minutos
**Prioridad**: 🟡 MEDIA

### Archivo a crear
```bash
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Privy (Authentication)
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id

# App URL (for production)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# CRON Secret (generate a random secure string)
CRON_SECRET=your-secure-random-string-here

# Optional: Analytics
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Verificación
- [ ] .env.example creado
- [ ] Todas las variables requeridas listadas
- [ ] Comentarios explicativos

---

## ✅ TAREA 4.3: Documentar API Endpoints
**Tiempo**: 15 minutos
**Prioridad**: 🟢 BAJA

### Archivo a crear
```markdown
# API-ENDPOINTS.md

## POST /api/tickets/purchase

Purchase lottery tickets (dual lottery - enters both daily and weekly)

**Request**:
```json
{
  "tickets": [
    {
      "numbers": [5, 12, 23, 45, 67],
      "powerNumber": 8
    }
  ],
  "walletAddress": "0x1234..."
}
```

**Response**:
```json
{
  "success": true,
  "ticketCount": 1,
  "totalCost": 0.25,
  "dailyDrawId": 1001,
  "weeklyDrawId": 2000,
  "message": "Successfully purchased 1 ticket(s)..."
}
```

## POST /api/cron/create-next-draws

Creates next draws if less than 7 daily or 4 weekly pending

**Headers**:
- `Authorization: Bearer {CRON_SECRET}`

**Response**:
```json
{
  "success": true,
  "dailyCreated": 3,
  "weeklyCreated": 1
}
```

## POST /api/cron/execute-daily-draw

Executes daily draws that have ended

**Headers**:
- `Authorization: Bearer {CRON_SECRET}`

**Response**:
```json
{
  "success": true,
  "drawsExecuted": 1,
  "winningNumbers": [5, 12, 23, 45, 67],
  "powerNumber": 8
}
```

## POST /api/cron/execute-weekly-draw

Executes weekly draws (Sundays)

**Headers**:
- `Authorization: Bearer {CRON_SECRET}`

**Response**: Similar to daily

## GET /api/prizes/live?type=daily

Get live prize pool data

**Response**:
```json
{
  "drawType": "daily",
  "totalUSD": 100.50,
  "composition": {
    "btc": { "amount": 0.00092, "usd": 70 },
    "eth": { "amount": 0.025, "usd": 25 },
    "token": { "amount": 5, "usd": 5 }
  }
}
```
```

### Verificación
- [ ] API-ENDPOINTS.md creado
- [ ] Todos los endpoints documentados

---

# FASE 5: DEPLOYMENT A VERCEL (30 min - 1 hora)

## ✅ TAREA 5.1: Preparar Deployment
**Tiempo**: 15 minutos
**Prioridad**: 🔴 CRÍTICA

### Pre-deployment Checklist
```bash
# 1. Verificar build local
npm run build
npm run start

# 2. Test todas las páginas principales
- Homepage (/)
- My Tickets (/my-tickets)
- Prizes (/prizes)
- Results (/results)
- Admin (/admin/draw-config)

# 3. Verificar .gitignore
node_modules/
.next/
.env.local
*.log

# 4. Commit final
git add .
git commit -m "Pre-production: All fixes and optimizations complete"
git push origin main
```

### Verificación
- [ ] Build exitoso localmente
- [ ] Todas las páginas funcionan
- [ ] .gitignore correcto
- [ ] Código en GitHub/GitLab

---

## ✅ TAREA 5.2: Deploy a Vercel
**Tiempo**: 20 minutos
**Prioridad**: 🔴 CRÍTICA

### Pasos

**1. Crear proyecto en Vercel**
```bash
# Opción A: CLI
npm i -g vercel
vercel login
vercel

# Opción B: Dashboard
# 1. Ir a vercel.com
# 2. "Add New Project"
# 3. Import Git Repository
# 4. Select your repo
```

**2. Configurar Environment Variables en Vercel**

Settings → Environment Variables → Add:

```
NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJxxx...
NEXT_PUBLIC_PRIVY_APP_ID = clxxx...
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
CRON_SECRET = crypto-lotto-cron-2025-base-secure-xyz789
```

**IMPORTANTE**: Agregar a todos los environments (Production, Preview, Development)

**3. Deploy**
```bash
# Vercel auto-deploys on git push
# O manualmente:
vercel --prod
```

**4. Verificar CRONs**
- Vercel auto-configura CRONs desde `vercel.json`
- Ir a: Project → Settings → Cron Jobs
- Verificar 3 CRONs están activos:
  - create-next-draws (hourly)
  - execute-daily-draw (daily 2 AM UTC)
  - execute-weekly-draw (weekly Sunday 12 AM UTC)

### Verificación
- [ ] Proyecto deployed en Vercel
- [ ] Environment variables configuradas
- [ ] App funciona en URL de producción
- [ ] CRONs configurados automáticamente

---

## ✅ TAREA 5.3: Post-Deployment Testing
**Tiempo**: 20 minutos
**Prioridad**: 🔴 CRÍTICA

### Tests en Producción

**1. Homepage**
```
https://your-app.vercel.app
- ✓ DualPoolDisplay carga
- ✓ Countdown timers funcionan
- ✓ Privy login funciona
- ✓ Number picker funciona
```

**2. Comprar Ticket**
```
- ✓ Seleccionar números
- ✓ Add to cart
- ✓ Connect wallet
- ✓ Buy ticket
- ✓ Verificar en Supabase que ticket se creó
- ✓ Verificar assigned_daily_draw_id y assigned_weekly_draw_id
```

**3. My Tickets**
```
https://your-app.vercel.app/my-tickets
- ✓ Muestra tickets del usuario
- ✓ Muestra dual status (daily + weekly)
- ✓ Pending/Winner states funcionan
```

**4. Admin Panel** (si tienes acceso)
```
https://your-app.vercel.app/admin/draw-config
- ✓ Muestra configuración actual
- ✓ Preview timezones funciona
- ✓ Cambiar horario funciona
```

**5. Verificar CRONs en Vercel Logs**
```
# Ir a: Vercel Dashboard → Your Project → Deployments → Latest → Functions
# Verificar logs de CRONs cuando se ejecuten
# Próxima ejecución: Top of each hour (create-next-draws)
```

### Verificación
- [ ] Homepage funciona en producción
- [ ] Ticket purchase funciona
- [ ] My Tickets muestra datos
- [ ] Admin panel accesible
- [ ] No console errors en producción

---

## ✅ TAREA 5.4: Monitor First 24 Hours
**Tiempo**: Ongoing
**Prioridad**: 🟡 ALTA

### Qué monitorear

**1. Vercel Logs**
```
# Check every few hours
Vercel Dashboard → Functions → View Logs

Buscar:
- Errores 500
- CRON executions
- Ticket purchases
```

**2. Supabase Dashboard**
```
# Verificar queries
Supabase → Database → Query Performance

# Verificar tickets
SELECT COUNT(*) FROM tickets WHERE created_at > NOW() - INTERVAL '24 hours';

# Verificar draws ejecutándose
SELECT * FROM draws WHERE executed = true ORDER BY executed_at DESC LIMIT 5;
```

**3. User Reports**
```
# Si tienes usuarios testeando
- ¿Logran comprar tickets?
- ¿Ven sus tickets en My Tickets?
- ¿Algún error?
```

### Verificación
- [ ] Monitoring setup
- [ ] Primeros tickets comprados
- [ ] Primer CRON ejecutado exitosamente

---

# FASE 6: POST-PRODUCTION IMPROVEMENTS (OPCIONAL)

## ✅ TAREA 6.1: Agregar Analytics
**Tiempo**: 30 minutos
**Prioridad**: 🟢 BAJA

### Setup Posthog (Free, Privacy-First)

**1. Crear cuenta**: posthog.com
**2. Agregar a proyecto**:

```bash
npm install posthog-js
```

**3. Crear `/lib/posthog.ts`**:
```typescript
import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init('YOUR_PROJECT_KEY', {
    api_host: 'https://app.posthog.com'
  });
}

export { posthog };
```

**4. Track events**:
```typescript
// En app/page.tsx - Purchase
posthog.capture('ticket_purchased', {
  count: cart.length,
  total: totalCost
});

// En app/my-tickets - View
posthog.capture('my_tickets_viewed', {
  ticket_count: tickets.length
});
```

### Verificación
- [ ] Posthog configurado
- [ ] Events tracked
- [ ] Dashboard muestra datos

---

## ✅ TAREA 6.2: PWA Support
**Tiempo**: 30 minutos
**Prioridad**: 🟢 BAJA

### Crear manifest.json

**public/manifest.json**:
```json
{
  "name": "CryptoLotto",
  "short_name": "CryptoLotto",
  "description": "The world's most transparent lottery",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0e27",
  "theme_color": "#00f0ff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**app/layout.tsx**:
```typescript
export const metadata = {
  manifest: '/manifest.json'
}
```

### Verificación
- [ ] manifest.json creado
- [ ] Icons added
- [ ] Chrome muestra "Install App"

---

## ✅ TAREA 6.3: Optimizar Bundle Size
**Tiempo**: 30 minutos
**Prioridad**: 🟡 MEDIA

### Análisis

```bash
# Install analyzer
npm install @next/bundle-analyzer

# Configurar next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... existing config
});

# Analizar
ANALYZE=true npm run build
```

### Optimizaciones
- Lazy load heavy components
- Dynamic imports para páginas no-críticas
- Tree shake librerías no usadas

### Verificación
- [ ] Bundle analyzer instalado
- [ ] Bundle size < 500KB
- [ ] First Load JS optimizado

---

# 📊 RESUMEN DE TAREAS

## BLOQUEADORES (HOY - SESIÓN 1)
- [ ] 1.1 Fix Build Error - Crear /lib/supabase/server.ts (30 min)
- [ ] 1.2 Fix Metadata Warnings (15 min)
- [ ] 1.3 Fix Lockfile Warning (5 min)
- [ ] 1.4 Verificar Build (10 min)

**Total Sesión 1**: ~1 hora

---

## SISTEMA DE VOTACIÓN (HOY - SESIÓN 2)
- [ ] 2.0 Verificar Sistema de Votación Completo (1 hora)
  - [ ] Test Voting API (GET/POST)
  - [ ] Test Current Proposal API
  - [ ] Test Frontend /vote page
  - [ ] Test Finalize Vote CRON
  - [ ] Verificar integración con prize pools

**Total Sesión 2**: ~1 hora

---

## CRÍTICO - CRONs DE DRAWS (HOY - SESIÓN 3)
- [ ] 3.1 Setup CRON Testing (10 min)
- [ ] 3.2 Test CREATE-NEXT-DRAWS (20 min)
- [ ] 3.3 Test EXECUTE-DAILY (30 min)
- [ ] 3.4 Test EXECUTE-WEEKLY (30 min)

**Total Sesión 3**: ~1.5 horas

---

## POLISH (HOY - SESIÓN 4)
- [ ] 4.1 Error Boundaries (30 min)
- [ ] 4.2 Limpiar Console.logs (20 min)
- [ ] 4.3 Loading Skeletons (1 hora)
- [ ] 4.4 Optimizar Queries (30 min)
- [ ] 4.5 Try-Catch APIs (30 min)

**Total Sesión 4**: ~3 horas

---

## DOCUMENTATION (HOY - SESIÓN 5)
- [ ] 5.1 README.md (20 min)
- [ ] 5.2 .env.example (5 min)
- [ ] 5.3 API Docs (15 min)

**Total Sesión 5**: ~40 min

---

## DEPLOYMENT (HOY/MAÑANA - SESIÓN 6)
- [ ] 6.1 Pre-deployment (15 min)
- [ ] 6.2 Deploy Vercel (20 min)
- [ ] 6.3 Post-deployment Testing (20 min)
- [ ] 6.4 Monitor (ongoing)

**Total Sesión 6**: ~1 hora

---

## OPCIONAL (POST-LAUNCH)
- [ ] 7.1 Analytics (30 min)
- [ ] 7.2 PWA (30 min)
- [ ] 7.3 Bundle Optimization (30 min)

**Total Opcional**: ~1.5 horas

---

# 🎯 TOTAL TIME ESTIMATE (ACTUALIZADO CON SISTEMA DE VOTACIÓN)

**Mínimo viable**: 4-5 horas (Sesiones 1, 2, 3, 6)
- SESIÓN 1: Fix bloqueadores (1h)
- SESIÓN 2: Sistema votación (1h)
- SESIÓN 3: CRONs draws (1.5h)
- SESIÓN 6: Deploy (1h)

**Con polish completo**: 8-9 horas (Sesiones 1-6)
- Todo lo anterior +
- SESIÓN 4: Error handling & polish (3h)
- SESIÓN 5: Documentation (40min)

**Con opcionales**: 10-11 horas (Todo)

---

# 🚀 ORDEN RECOMENDADO PARA HOY (ACTUALIZADO)

**SESIÓN 1 - AHORA (1 hora)**:
1. Crear /lib/supabase/server.ts → 15 min
2. Instalar @supabase/ssr → 5 min
3. Fix metadata warnings → 15 min
4. Fix lockfile warning → 5 min
5. Verify build pasa → 10 min
6. Buffer para issues → 10 min

**SESIÓN 2 - SISTEMA VOTACIÓN (1 hora)**:
1. Crear propuesta activa en Supabase → 10 min
2. Test Voting API (GET/POST) → 20 min
3. Test Current Proposal API → 10 min
4. Test Frontend /vote page → 15 min
5. Test Finalize Vote CRON → 5 min

**SESIÓN 3 - CRONs DRAWS (1.5 horas)**:
1. Setup CRON testing → 10 min
2. Test CREATE-NEXT-DRAWS → 20 min
3. Test EXECUTE-DAILY → 30 min
4. Test EXECUTE-WEEKLY → 30 min

**SESIÓN 4 - POLISH (2 horas)** [OPCIONAL pero recomendado]:
1. Error Boundaries → 30 min
2. Limpiar logs → 20 min
3. Loading skeletons → 1 hora
4. Buffer para issues → 10 min

**SESIÓN 5 - DOCUMENTATION (40 min)** [OPCIONAL]:
1. README → 20 min
2. .env.example → 5 min
3. API docs → 15 min

**SESIÓN 6 - DEPLOY (1 hora)**:
1. Pre-deployment checks → 15 min
2. Deploy a Vercel → 20 min
3. Testing producción → 20 min
4. Setup monitoring → 5 min

---

**TOTAL MÍNIMO HOY**: ~4.5 horas (Sesiones 1, 2, 3, 6) → **MVP en producción**
**TOTAL COMPLETO HOY**: ~8 horas (Sesiones 1-6) → **MVP pulido en producción**

---

# ✅ CHECKLIST FINAL PRE-PRODUCCIÓN (ACTUALIZADO)

Antes de marcar como "READY FOR PRODUCTION":

**FASE 1 - BLOQUEADORES**:
- [ ] /lib/supabase/server.ts creado
- [ ] @supabase/ssr instalado
- [ ] Build pasa sin errores
- [ ] No warnings en build

**FASE 2 - SISTEMA DE VOTACIÓN**:
- [ ] Propuesta activa en Supabase
- [ ] Voting API testeada (GET/POST)
- [ ] Current Proposal API testeada
- [ ] Frontend /vote funciona
- [ ] Finalize Vote CRON funciona
- [ ] Integración con prize pools verificada

**FASE 3 - CRONs DE DRAWS**:
- [ ] CRON create-next-draws testeado
- [ ] CRON execute-daily-draw testeado
- [ ] CRON execute-weekly-draw testeado
- [ ] Rollover multi-tier funciona

**FASE 4 - POLISH** (Opcional):
- [ ] Error Boundaries agregados
- [ ] Console.logs limpiados
- [ ] Loading skeletons implementados
- [ ] Queries optimizadas
- [ ] Try-catch en todas las APIs

**FASE 5 - DOCUMENTATION** (Opcional):
- [ ] README completo
- [ ] .env.example creado
- [ ] API endpoints documentados

**FASE 6 - DEPLOYMENT**:
- [ ] Deployed a Vercel
- [ ] Environment variables configuradas
- [ ] CRONs activos en Vercel (4 CRONs)
- [ ] Testing en producción exitoso
- [ ] Primer ticket comprado en prod
- [ ] Sistema de votación funciona en prod
- [ ] Monitoring setup

---

# 🎉 DESPUÉS DE COMPLETAR TODO

**TENDRÁS**:
- ✅ MVP funcional en producción
- ✅ Sistema infinito con CRONs automáticos
- ✅ Error handling robusto
- ✅ UX pulido con skeletons
- ✅ Documentation completa
- ✅ Monitoring activo

**PRÓXIMOS PASOS**:
1. Marketing & user testing
2. Feedback collection
3. Smart contracts (Semanas 6-12)
4. Real crypto integration
5. Chainlink VRF
6. Token governance

---

**¡VAMOS CON TODO! 🚀🚀🚀**
