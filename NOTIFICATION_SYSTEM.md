# CryptoLotto Notification System

## 🎯 Overview

Sistema completo de notificaciones que combina emails y toasts, con consolidación inteligente para evitar spam.

## ✨ Features Implementadas

### 1. **Smart Consolidation (Opción 1 + 4)**

El sistema automáticamente detecta cuántos tickets compró un usuario y adapta el email:

- **1 ticket** → Email detallado individual
- **2-10 tickets** → Email con lista de ticket IDs
- **11+ tickets** → Email resumido con estadísticas

### 2. **Rotating Draw Result Templates**

5 templates diferentes que rotan aleatoriamente para mantener cada email fresco:

1. **Unstoppable** (⚡) - Energía explosiva con VS display
2. **Matrix** (🎰) - Terminal hacker style
3. **Fortune** (🔮) - Místico fortune teller
4. **Rocket** (🚀) - Espacial "to the moon"
5. **Lightning** (⚡) - Rayo dorado eléctrico

Cada template tiene frases motivacionales únicas.

### 3. **Toast Notifications**

Sistema de toasts estilizados que aparecen en la app:
- Diseño cyberpunk matching el sitio
- Colores: cyan (#00f0ff), gold (#ffd700), red (#ff6464)
- Fuentes: Orbitron + Inter
- Backdrop blur effect

### 4. **Database Tracking**

Tabla Supabase `notifications` que guarda:
- Historial completo de notificaciones
- Template usado (para stats)
- Estado (pending/sent/failed)
- Email ID de Resend (para tracking)
- Datos JSON flexibles

## 📁 Estructura de Archivos

```
/lib/
  /email-templates/
    ├── index.tsx                       # Exports principales
    ├── README.md                       # Documentación de templates
    ├── deposit-confirmed.tsx           # 1 ticket
    ├── deposit-bulk.tsx                # 2+ tickets
    ├── prize-won-premium.tsx           # Premio ganado
    └── /draw-results/
        ├── index.tsx                   # Selector aleatorio
        ├── unstoppable.tsx             # Template 1
        ├── matrix.tsx                  # Template 2
        ├── fortune.tsx                 # Template 3
        ├── rocket.tsx                  # Template 4
        └── lightning.tsx               # Template 5

  /database/
    ├── notifications-schema.sql        # Schema SQL
    └── notifications.ts                # Helpers TypeScript

  /notifications/
    ├── notification-manager.ts         # Sistema de consolidación
    └── toast-notifications.tsx         # Toast helpers

/components/
  └── ToastProvider.tsx                 # Provider de react-hot-toast

/app/
  ├── providers.tsx                     # Incluye ToastProvider
  └── /api/notifications/send/
      └── route.ts                      # API endpoint
```

## 🚀 Cómo Usar

### Enviar Notificación de Depósito

```typescript
import { showDepositConfirmedToast } from '@/lib/notifications/toast-notifications';

// 1. Mostrar toast inmediatamente
showDepositConfirmedToast(ticketCount, amount);

// 2. Enviar email (async)
await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'deposit_confirmed',
    data: {
      userAddress: '0x...',
      amount: '10.00',
      transactionHash: '0x...',
      timestamp: 'Nov 8, 2025 5:43 PM',
      tickets: [
        { ticketId: 0, ticketNumber: 42, drawId: 1 },
        { ticketId: 1, ticketNumber: 56, drawId: 1 },
        // ... más tickets si aplica
      ],
      emailAddress: 'user@example.com', // opcional
    },
  }),
});
```

### Enviar Notificación de Draw Result

```typescript
import { showDrawResultToast } from '@/lib/notifications/toast-notifications';

// 1. Mostrar toast
showDrawResultToast(drawId, won, prizeCount);

// 2. Enviar email
await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'draw_result',
    data: {
      userAddress: '0x...',
      drawId: 1,
      drawDate: 'November 8, 2025',
      drawTime: '5:43 PM',
      winningNumber: 42,
      tickets: [
        { ticketId: 0, ticketNumber: 56, won: false },
        { ticketId: 1, ticketNumber: 89, won: false },
      ],
      emailAddress: 'user@example.com',
    },
  }),
});
```

### Enviar Notificación de Premio

```typescript
import { showPrizeClaimedToast } from '@/lib/notifications/toast-notifications';

// 1. Mostrar toast
showPrizeClaimedToast(totalValueUSD);

// 2. Enviar email
await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'prize_won',
    data: {
      userAddress: '0x...',
      drawId: 1,
      drawDate: 'November 8, 2025',
      winningTickets: [
        {
          ticketId: 5,
          ticketNumber: 42,
          prize: {
            btc: '0.00042',
            eth: '0.0056',
            usdc: '2.50',
            totalUSD: '50.25',
          },
        },
      ],
      emailAddress: 'user@example.com',
    },
  }),
});
```

## 🎨 Lógica de Consolidación

### Deposits

```
if (tickets.length === 1) {
  → Envía "deposit-confirmed.tsx" (simple)
} else {
  → Envía "deposit-bulk.tsx" (con contador y lista)

  if (tickets.length <= 10) {
    → Muestra IDs individuales de tickets
  } else {
    → Solo muestra total count
  }
}
```

### Draw Results

```
// SIEMPRE envía UN solo email por draw

if (user.wonTickets.length > 0) {
  → Envía email de "prize_won" (no draw result)
} else {
  → Envía email de "draw_result"
  → Selecciona 1 template aleatorio de los 5
  → Muestra 1 ticket random (solo para display)
}
```

### Prize Won

```
// Consolida TODOS los tickets ganadores en UN email

totalPrizes = sum(allWinningTickets)

if (winningTickets.length === 1) {
  → Mensaje: "You won a prize!"
} else {
  → Mensaje: "You won X prizes!"
}

→ Muestra total agregado de BTC + ETH + USDC
```

## 📊 Stats y Analytics

```typescript
import { getTemplateStats } from '@/lib/database/notifications';

// Ver qué templates se usan más
const stats = await getTemplateStats();
// { unstoppable: 45, matrix: 38, fortune: 52, rocket: 41, lightning: 47 }
```

## 🔧 Configuración Requerida

### Variables de Entorno

```bash
# Resend (email service)
RESEND_API_KEY=re_...

# Supabase (database)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Crear Tabla en Supabase

Ejecutar el SQL en `/lib/database/notifications-schema.sql` en Supabase SQL Editor.

### Configurar Resend

1. Crear cuenta en https://resend.com
2. Verificar dominio `cryptolotto.app`
3. Copiar API key
4. Agregar a `.env.local`

## 📱 Ejemplos de Uso en la App

### En el componente de compra de tickets:

```typescript
'use client';

import { showDepositConfirmedToast } from '@/lib/notifications/toast-notifications';

function BuyTicketsButton() {
  const handlePurchase = async () => {
    // ... lógica de compra ...

    // Mostrar toast inmediatamente
    showDepositConfirmedToast(ticketCount, amount);

    // Enviar email en background
    fetch('/api/notifications/send', {
      method: 'POST',
      body: JSON.stringify({
        type: 'deposit_confirmed',
        data: { /* ... */ },
      }),
    }).catch(console.error); // No bloquear UI si falla
  };

  return <button onClick={handlePurchase}>Buy Tickets</button>;
}
```

### Monitoreo de depósitos:

```typescript
// Polling o websocket para detectar cuando el depósito se confirma
useEffect(() => {
  const checkDeposit = async () => {
    const confirmed = await checkBlockchain(txHash);

    if (confirmed) {
      // Toast
      showDepositConfirmedToast(tickets.length, amount);

      // Email
      await fetch('/api/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          type: 'deposit_confirmed',
          data: depositData,
        }),
      });
    }
  };

  const interval = setInterval(checkDeposit, 5000);
  return () => clearInterval(interval);
}, [txHash]);
```

## 🎯 Próximos Pasos

1. ✅ Sistema implementado
2. ⏳ Agregar monitoreo de depósitos (polling blockchain)
3. ⏳ Integrar con eventos del contrato
4. ⏳ Testing con usuarios reales
5. ⏳ A/B testing de templates
6. ⏳ Analytics de open rates

## 💡 Tips

- Los toasts son **instantáneos** → se muestran de inmediato
- Los emails son **async** → no bloquean la UI
- Si el email falla, el usuario igual ve el toast
- Todas las notificaciones se guardan en DB para auditoría
- Los templates rotan aleatoriamente → más engagement
