# 💎 Live Prize Pools - Contexto y Progreso

**Fecha**: 2025-10-20
**Estado**: En diseño - Esperando decisión del usuario

---

## 📋 Resumen

El usuario pidió implementar la feature **"Live Prize Pools"** con auto-refresh cada 10 segundos mostrando:
- Prize pool total en USD
- Countdown timer hasta el próximo draw
- Prize composition (BTC 70%, ETH 25%, SOL 5%)
- Tickets vendidos
- Datos actualizados en tiempo real

### ✅ Completado hasta ahora:

1. **Database Layer** ✅
   - Creada tabla `prize_pool_snapshots` para histórico
   - Modificada tabla `draws` con campos: `wbtc_amount`, `eth_amount`, `token_amount`, `token_symbol`, `status`, `draw_type`
   - Insertado test data (Daily: 0.05 BTC + 0.5 ETH + 100 SOL, Weekly: 0.35 BTC + 2.8 ETH + 850 SOL)

2. **API Layer** ✅
   - `/api/prices/crypto` - Fetches BTC/ETH/SOL prices from Coinbase (~300-400ms)
   - `/api/prizes/live?type=daily|weekly` - Returns prize composition with live USD values (~500-600ms)

3. **Frontend Components** ✅
   - `LivePrizePool.tsx` - Main component with auto-refresh (10s)
   - `CryptoRow.tsx` - Individual crypto display
   - Integrado en homepage después del Hero section

4. **Diseño** 🎨
   - Primera versión implementada con estilo cyberpunk
   - Usuario la vio funcional pero **no le gustó el diseño inicial** (muy grande)
   - Solicitó **versiones más compactas** y eficientes

---

## 🎨 Mockups Creados

### Serie Original (Full-size)

#### **Propuesta 1: Combo Power**
- **Archivo**: `propuesta-1-combo-power.html`
- **Concepto**: Grid de 2 cards (Daily + Weekly) lado a lado
- **Características**:
  - Prize pool total destacado
  - Countdown completo (4 dígitos)
  - Prize composition detallada (3 cryptos)
  - Tickets sold + last updated
  - Botón "VIEW RESULTS"
- **Ventajas**: Toda la info visible, fácil comparación
- **Desventajas**: Ocupa más espacio vertical

#### **Propuesta 2: Redesign #2**
- **Archivo**: `propuesta-2-redesign.html`
- **Concepto**: Card único grande con tabs (Daily | Weekly)
- **Características**:
  - Layout vertical minimalista
  - Tabs interactivos
  - Prize amount MUY grande (96px)
  - Prize composition completa
  - Stats grid
- **Ventajas**: Diseño premium enfocado, mejor para mobile
- **Desventajas**: Requiere click para cambiar entre Daily/Weekly

#### **Propuesta 3: Split Hero**
- **Archivo**: `propuesta-3-split-hero.html`
- **Concepto**: Layout horizontal 50/50 - Info izquierda, Composition derecha
- **Características**:
  - Tabs arriba
  - Layout split dashboard-style
  - Izquierda: Prize, countdown, stats, CTA
  - Derecha: Prize composition con barra de color lateral
- **Ventajas**: Organización clara, profesional, buen uso del espacio horizontal
- **Desventajas**: En mobile requiere stack vertical

---

### Serie Compacta (Optimizada)

#### **Compact 1: Combo Power**
- **Archivo**: `compact-propuesta-1.html`
- **Tamaño**: ~400px altura por card
- **Optimizaciones**:
  - Prize: 42px (antes 72px)
  - Countdown: 24px (antes 36px)
  - Padding: 25px (antes 40px)
  - Info condensada en una línea
- **Mejor para**: Mostrar ambos jackpots simultáneamente

#### **Compact 2: Redesign #2**
- **Archivo**: `compact-propuesta-2.html`
- **Tamaño**: ~450px altura total
- **Optimizaciones**:
  - Prize: 56px (antes 96px)
  - Countdown: 28px (antes 48px)
  - **Cryptos en grid 3 columnas** (más compacto)
  - Padding: 30px (antes 60px)
- **Mejor para**: Tabs + diseño vertical elegante

#### **Compact 3: Split Hero**
- **Archivo**: `compact-propuesta-3.html`
- **Tamaño**: ~400px altura
- **Optimizaciones**:
  - Prize: 42px
  - Countdown: 24px
  - Sections con menos padding
  - Crypto items más pequeños
- **Mejor para**: Layout split profesional compacto

#### **⚡ Propuesta 4: Ultra Compact (NUEVA!)**
- **Archivo**: `propuesta-4-ultra-compact.html`
- **Tamaño**: ~90px collapsed, ~280px expanded
- **Concepto ÚNICO**: Cards horizontales expandibles
- **Características**:
  - Layout horizontal (todo en una fila)
  - Expandible con botón "Details ▼"
  - Super eficiente: 90px altura cuando colapsado
  - Prize + Countdown siempre visible
  - Detalles on-demand
  - Daily y Weekly apilados (2 rows)
- **Ventajas**: Máxima eficiencia (70% menos altura), moderno, interactivo
- **Mejor para**: Máxima eficiencia de espacio

---

## 🔄 Estado Actual del Código

### Archivos Implementados:

```
/app/api/prices/crypto/route.ts          ✅ Funcionando
/app/api/prizes/live/route.ts            ✅ Funcionando
/components/prizes/LivePrizePool.tsx     ✅ Implementado (diseño inicial)
/components/prizes/CryptoRow.tsx         ✅ Implementado (diseño inicial)
/components/prizes/AnimatedNumber.tsx    ⚠️  Creado pero no usado
/lib/supabase.ts                         ✅ Actualizado con tipos
```

### Datos de Prueba en Supabase:

```sql
-- Draw #1 (Weekly)
draw_id: 1
status: 'open'
draw_type: 'weekly'
wbtc_amount: 0.35
eth_amount: 2.8
token_amount: 850
token_symbol: 'SOL'
total_tickets: 0

-- Draw #2 (Daily)
draw_id: 2
status: 'open'
draw_type: 'daily'
wbtc_amount: 0.05
eth_amount: 0.5
token_amount: 100
token_symbol: 'SOL'
total_tickets: 1250
```

### Precios Actuales (últimos conocidos):
- BTC: $109,653.71
- ETH: $3,941.07
- SOL: $186.31

### Prize Pool Totals:
- Daily: $26,096.11
- Weekly: $207,888.80

---

## 🤔 Problema Identificado por el Usuario

**Feedback original**:
> "mira me encanto pero ahora tengo un pensamiento ayudame a proponer algo sobre esto tenjemos [Image #1] esta seccion donde se muestra el premio pero tambien tenemos esta seccion [Image #2] los dos diseno me encantan digo a la imagen 2 le falta la informacion de la imagen 1, no creo que deberiamos tener los dos entonces quiero ver si me propones dos maneras de ponerlas..."

**Interpretación**:
- El usuario tiene 2 secciones mostrando prizes en la página
- Imagen #1: Live Prize Pools (con auto-refresh, composition, etc.)
- Imagen #2: Sección estática existente (Lottery #001 con countdown y VIEW RESULTS)
- Quiere **unificar ambas secciones** en una sola más eficiente

**Segunda solicitud**:
> "ahora puedes hacer mas pequenos estos mock ups porque no me gustaria que representen tanto espacio en la pagina , que se vean bien y claro pero no que sea tan grande , piensa de que manera seria lo mas eficiente y cool"

**Resultado**: Creadas 4 versiones compactas optimizadas

---

## 📊 Comparación de Tamaños

| Propuesta | Tamaño Original | Tamaño Compacto | Reducción |
|-----------|----------------|-----------------|-----------|
| Combo Power | ~650px | ~400px | 38% |
| Redesign #2 | ~700px | ~450px | 36% |
| Split Hero | ~650px | ~400px | 38% |
| Ultra Compact | N/A | ~90px (collapsed) | N/A |

---

## 🎯 Próximos Pasos

### Pendiente - Decisión del Usuario:

1. **Elegir diseño preferido** de los 7 mockups disponibles
2. **Implementar el diseño elegido** en Next.js/TypeScript
3. **Reemplazar o modificar** la sección existente de lottery
4. **Testing completo**:
   - Auto-refresh funcionando
   - Responsive design (mobile/tablet/desktop)
   - Performance optimization
   - Verificar que countdown y precios actualizan correctamente

### Opcionales (no solicitados aún):

- Crear cron job para snapshots horarios
- Implementar animaciones de transición en cambios de precio
- Agregar gráficos históricos de prize pool
- Notificaciones cuando el prize pool alcanza ciertos milestones

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15.5.6, React, TypeScript
- **Styling**: Inline styles (para control preciso), Orbitron + Inter fonts
- **Database**: Supabase (PostgreSQL)
- **API Externa**: Coinbase API (precios crypto)
- **Features**: Auto-refresh (client-side polling), Real-time price updates

---

## 💡 Recomendaciones

### Mi Top 3:

1. **Propuesta 4 (Ultra Compact)** - Para máxima eficiencia de espacio
   - Más moderno y interactivo
   - Ideal si el usuario quiere "above the fold" content
   - 70% menos espacio que versiones originales

2. **Compact 2 (Redesign #2)** - Para elegancia y claridad
   - Mejor balance entre info y espacio
   - Crypto grid es muy visual
   - Excelente para mobile

3. **Compact 1 (Combo Power)** - Para comparación directa
   - Si el usuario valora ver Daily y Weekly simultáneamente
   - Más tradicional pero efectivo

---

## 📝 Notas Técnicas

### Auto-refresh Implementation:
```typescript
useEffect(() => {
  fetchPrizePool(); // Initial fetch
  const interval = setInterval(fetchPrizePool, 10000); // Every 10s
  return () => clearInterval(interval); // Cleanup
}, [drawType, refreshInterval]);
```

### API Response Format:
```json
{
  "drawType": "daily" | "weekly",
  "totalUSD": 26096.11,
  "composition": {
    "btc": { "amount": 0.05, "usd": 5479.55, "percentage": 70 },
    "eth": { "amount": 0.5, "usd": 1968.56, "percentage": 25 },
    "token": { "amount": 100, "usd": 648.00, "symbol": "SOL", "percentage": 5 }
  },
  "totalTickets": 1250,
  "lastUpdate": 1729472054000
}
```

### Design System Colors:
- Primary (Cyan): `#00f0ff`
- Secondary (Magenta): `#ff00ff`
- Accent (Gold): `#ffd700`
- BTC: `#f7931a`
- ETH: `#627eea`
- SOL: `#00ffa3`

---

## 🔗 Enlaces Útiles

- Supabase Dashboard: https://supabase.com/dashboard/project/fjxbuyxephlfoivcpckd
- Coinbase API Docs: https://docs.cloud.coinbase.com/sign-in-with-coinbase/docs/api-prices
- Localhost: http://localhost:3000

---

## 📌 Recordatorios

- NO eliminar los mockups HTML - el usuario aún está decidiendo
- Mantener los datos de prueba en Supabase hasta producción
- El auto-refresh está configurado para 10 segundos (puede ajustarse)
- Todos los diseños usan Orbitron para headings, Inter para body text
- Glassmorphism backgrounds con `linear-gradient(135deg, rgba(10, 14, 39, 0.8), ...)`

---

**Última actualización**: 2025-10-20
**Próxima acción**: Esperar decisión del usuario sobre diseño preferido
