# 🚀 CryptoLotto Notification System - Setup Guide

## ✅ Sistema 100% Completado!

El sistema de notificaciones está completamente implementado con:
- ✅ Email templates (deposit, draw, prizes)
- ✅ Smart consolidation (batch emails)
- ✅ Toast notifications
- ✅ Deposit monitoring
- ✅ Database tracking
- ✅ API routes

---

## 📋 Paso 1: Configurar Variables de Entorno

Agrega estas variables a tu `.env.local`:

```bash
# Resend (Email Service)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Para server-side
```

---

## 📋 Paso 2: Configurar Resend

### 2.1. Crear Cuenta en Resend

1. Ve a: https://resend.com
2. Crea una cuenta
3. Verifica tu email

### 2.2. Agregar y Verificar Dominio

1. Ve a **Settings > Domains**
2. Click **Add Domain**
3. Ingresa: `cryptolotto.app`
4. Copia los registros DNS que te da Resend:

```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all

Type: CNAME
Name: resend._domainkey
Value: resend._domainkey.u... (copiar de Resend)

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:...
```

5. Agrega estos registros en tu proveedor de DNS (Namecheap, Cloudflare, etc.)
6. Espera 10-30 minutos para verificación
7. Verifica el dominio en Resend (debe aparecer checkmark verde ✅)

### 2.3. Generar API Key

1. Ve a **API Keys**
2. Click **Create API Key**
3. Nombre: "CryptoLotto Production"
4. Permisos: "Sending access"
5. Copia la key: `re_xxxxxxxxxxxxx`
6. Agrégala a `.env.local` como `RESEND_API_KEY`

---

## 📋 Paso 3: Configurar Supabase

### 3.1. Crear Tabla de Notificaciones

1. Ve a tu proyecto en Supabase
2. Click **SQL Editor** en sidebar
3. Click **New Query**
4. Copia y pega el contenido de `/lib/database/notifications-schema.sql`
5. Click **Run** (botón verde)
6. Verifica que la tabla se creó: **Table Editor > notifications**

### 3.2. Configurar RLS (Row Level Security)

Para permitir que el API pueda escribir en la tabla:

```sql
-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything
CREATE POLICY "Service role can do everything"
ON notifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Users can read their own notifications
CREATE POLICY "Users can read own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_address);
```

### 3.3. Obtener Service Role Key

1. Ve a **Settings > API**
2. Copia el **service_role key** (NO el anon key)
3. Agrégala a `.env.local` como `SUPABASE_SERVICE_ROLE_KEY`

---

## 📋 Paso 4: Verificar que Todo Funciona

### 4.1. Verificar Dev Server

```bash
npm run dev
```

Debes ver en consola:
```
✓ Ready in XXXms
○ Compiling / ...
✓ Compiled / in XXXms
```

### 4.2. Test de API de Notificaciones

```bash
curl http://localhost:3000/api/notifications/send
```

Debes recibir:
```json
{
  "status": "ok",
  "message": "Notifications API is running",
  "version": "1.0.0"
}
```

### 4.3. Test de Toasts

1. Abre http://localhost:3000
2. Conecta tu wallet
3. Debes ver en la esquina inferior derecha:
   ```
   📡 Notification Monitor
   Status: 🟢 Active
   ```

### 4.4. Test de Email (Opcional)

Puedes enviar un email de prueba:

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "deposit_confirmed",
    "data": {
      "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "amount": "10.00",
      "transactionHash": "0x123...",
      "timestamp": "Nov 8, 2025 5:43 PM",
      "tickets": [
        {"ticketId": 0, "ticketNumber": 42, "drawId": 1}
      ],
      "emailAddress": "tu-email@example.com"
    }
  }'
```

---

## 🎯 Cómo Funciona en Producción

### Flujo Automático

1. **Usuario compra tickets**
   - El contrato emite evento `TicketPurchased`

2. **Hook detecta el evento** (`useTicketPurchaseMonitor`)
   - Escucha eventos del contrato
   - Agrupa tickets comprados en 5 segundos

3. **Se disparan notificaciones**
   - **Toast**: Aparece inmediatamente en la app
   - **Email**: Se envía async vía API

4. **Smart Consolidation**
   - 1 ticket → Email simple
   - 2-10 tickets → Email con lista
   - 11+ tickets → Email resumido

5. **Tracking en BD**
   - Guarda registro en Supabase
   - Marca como `sent` o `failed`
   - Guarda email ID de Resend

---

## 🔍 Monitoreo y Debug

### Ver Logs de Emails Enviados

En Resend Dashboard:
1. Ve a **Logs**
2. Verás todos los emails enviados
3. Status: delivered, bounced, opened, clicked

### Ver Notificaciones en Supabase

```sql
-- Ver todas las notificaciones
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100;

-- Ver notificaciones fallidas
SELECT * FROM notifications WHERE status = 'failed';

-- Ver stats de templates usados
SELECT template_name, COUNT(*) as count
FROM notifications
WHERE type = 'draw_result'
GROUP BY template_name;
```

### Ver Logs en Consola del Browser

Cuando el monitoring esté activo verás:
```
🔍 Starting ticket purchase monitoring for: 0x...
🎟️ New ticket purchased: { ticketId: 0, ticketNumber: 42 }
🎫 Processing ticket batch: { count: 1, amount: '0.10' }
```

---

## ⚙️ Configuración Avanzada

### Cambiar Intervalo de Polling

En `/hooks/useTicketPurchaseMonitor.ts`:

```typescript
pollingInterval: 3000, // 3 segundos (default)
// Cámbialo a 1000 para 1 segundo (más rápido pero más requests)
```

### Cambiar Ventana de Consolidación

```typescript
const timeout = setTimeout(() => {
  // ...
}, 5000); // 5 segundos (default)
// Cámbialo a 10000 para dar más tiempo a agrupar tickets
```

### Deshabilitar Monitoring Visual (Production)

El componente `NotificationMonitor` solo muestra el indicador en development.
En production es invisible (solo corre en background).

Para ocultarlo completamente, comenta la línea en `app/page.tsx`:

```typescript
// <NotificationMonitor />
```

El monitoring seguirá funcionando via el hook `useTicketPurchaseMonitor`.

---

## 🎨 Personalización

### Cambiar From Email

En `/app/api/notifications/send/route.ts`:

```typescript
from: 'CryptoLotto <noreply@cryptolotto.app>'
// Cambia a:
from: 'CryptoLotto <hello@cryptolotto.app>'
```

### Agregar Más Templates

1. Crea nuevo archivo en `/lib/email-templates/draw-results/`
2. Agrega a `/lib/email-templates/draw-results/index.tsx`:
   ```typescript
   import { NewTemplateEmail } from './new-template';

   const templates = {
     // ...
     newtemplate: NewTemplateEmail,
   };
   ```

### Personalizar Frases Motivacionales

Edita cada template en `/lib/email-templates/draw-results/`:
- `unstoppable.tsx`: "Fortune favors the bold"
- `matrix.tsx`: "The best hackers never quit"
- `fortune.tsx`: "Luck is what happens..."
- Etc.

---

## 🐛 Troubleshooting

### Email No Llega

1. ✅ Verifica que el dominio esté verificado en Resend
2. ✅ Revisa los logs en Resend Dashboard
3. ✅ Checa la carpeta de spam
4. ✅ Verifica que `RESEND_API_KEY` esté correcto

### Toast No Aparece

1. ✅ Verifica que `react-hot-toast` esté instalado
2. ✅ Checa que `ToastProvider` esté en `providers.tsx`
3. ✅ Abre consola del browser para ver errores

### Monitor No Detecta Compras

1. ✅ Verifica que el contract address sea correcto
2. ✅ Checa que Alchemy API key funcione
3. ✅ Revisa consola para ver logs del evento
4. ✅ Verifica que el wallet esté conectado

### Error de Supabase

1. ✅ Verifica que las 3 env vars estén configuradas
2. ✅ Checa que la tabla `notifications` exista
3. ✅ Verifica RLS policies
4. ✅ Usa service_role key (no anon key) en el API

---

## 📊 Métricas de Éxito

Después de implementar, monitorea:

- **Email open rate**: En Resend Dashboard > Analytics
- **Notification success rate**: En Supabase
  ```sql
  SELECT
    status,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
  FROM notifications
  GROUP BY status;
  ```
- **Template performance**: Cual template se usa más
- **Consolidation stats**: Cuántos emails batch vs individuales

---

## ✅ Checklist Final

Antes de ir a producción:

- [ ] Dominio verificado en Resend ✅
- [ ] DNS records configurados ✅
- [ ] API key de Resend en `.env.local` ✅
- [ ] Tabla `notifications` creada en Supabase ✅
- [ ] RLS policies configuradas ✅
- [ ] Service role key configurada ✅
- [ ] Dev server corre sin errores ✅
- [ ] Test de email enviado exitosamente ✅
- [ ] Toast notifications funcionan ✅
- [ ] Monitor detecta compras de tickets ✅

---

## 🎉 Todo Listo!

El sistema está 100% funcional y listo para producción.

**Próximos pasos sugeridos:**
1. Deploy a Vercel/producción
2. Test con usuarios reales
3. Monitorear métricas de emails
4. A/B testing de templates
5. Agregar más tipos de notificaciones

¿Preguntas? Revisa `/NOTIFICATION_SYSTEM.md` para documentación completa.
