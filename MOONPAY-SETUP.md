# 🌙 MoonPay Setup Guide

Esta guía te muestra cómo configurar MoonPay para permitir que los usuarios compren USDC y USDT con tarjeta de crédito.

---

## 📋 Prerrequisitos

- Cuenta de MoonPay (sandbox para testing, live para producción)
- Acceso al dashboard de MoonPay
- Verificación de negocio completada (para live keys)

---

## 🚀 Paso 1: Crear Cuenta en MoonPay

1. Ve a [MoonPay Dashboard](https://www.moonpay.com/dashboard/getting-started)
2. Regístrate o inicia sesión
3. Completa el proceso de verificación:
   - Información de negocio
   - KYC/KYB si es necesario
   - Configuración de cuenta

---

## 🔑 Paso 2: Obtener API Keys

### Test Keys (para desarrollo)

1. En el dashboard, ve a **Settings > API Keys**
2. Copia tus **Test Keys**:
   - `Publishable Key (Test)` → empieza con `pk_test_`
   - `Secret Key (Test)` → empieza con `sk_test_`

### Production Keys (para deployment)

1. Completa la verificación de negocio
2. En el dashboard, ve a **Settings > API Keys**
3. Copia tus **Live Keys**:
   - `Publishable Key (Live)` → empieza con `pk_live_`
   - `Secret Key (Live)` → empieza con `sk_live_`

---

## ⚙️ Paso 3: Configurar Variables de Entorno

1. Copia `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edita `.env.local` y agrega tus keys:

   **Para Testing (Sandbox)**:
   ```bash
   MOONPAY_PUBLIC_KEY=pk_test_abc123...
   MOONPAY_SECRET_KEY=sk_test_xyz789...
   ```

   **Para Producción**:
   ```bash
   MOONPAY_PUBLIC_KEY=pk_live_abc123...
   MOONPAY_SECRET_KEY=sk_live_xyz789...
   ```

---

## 🎯 Paso 4: Configurar Webhook (Opcional)

Si quieres recibir notificaciones cuando un usuario completa una compra:

1. En MoonPay Dashboard → **Settings > Webhooks**
2. Agrega tu URL de webhook:
   ```
   https://your-app.com/api/moonpay-webhook
   ```
3. Selecciona eventos:
   - `transaction_created`
   - `transaction_updated`
   - `transaction_completed`

---

## 🧪 Paso 5: Testing con MoonPay Sandbox

### Tarjetas de Prueba

MoonPay proporciona tarjetas de prueba para el ambiente sandbox:

**Tarjeta que APRUEBA**:
- Número: `4000 0000 0000 0002`
- CVV: Cualquier 3 dígitos
- Fecha: Cualquier fecha futura
- Nombre: Cualquier nombre

**Tarjeta que RECHAZA**:
- Número: `4000 0000 0000 0101`
- CVV: Cualquier 3 dígitos
- Fecha: Cualquier fecha futura
- Nombre: Cualquier nombre

### Flujo de Testing

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Ve a la página de compra de tickets
3. Click en "Buy USDC/USDT with Card"
4. Se abre ventana de MoonPay
5. Usa tarjeta de prueba
6. Completa el flujo

**Nota**: En sandbox, los tokens NO llegarán realmente a tu wallet. Solo se simula el flujo.

---

## 🌐 Paso 6: Configuración de Producción

### Currencies Soportadas

Asegúrate de habilitar estas currencies en tu dashboard:

- ✅ `usdc_base` - USDC en BASE network
- ✅ `usdt_base` - USDT en BASE network

### Configuración de Currencies

1. Dashboard → **Settings > Currencies**
2. Busca "BASE" en el selector de network
3. Habilita:
   - USDC (BASE)
   - USDT (BASE)

### Límites de Transacción

Configura límites según tu negocio:

- Mínimo: $10 USD (recomendado)
- Máximo: $2,000 USD (ajustable según verificación)

---

## 🔒 Seguridad

### Protección de Secret Key

⚠️ **NUNCA** expongas tu `MOONPAY_SECRET_KEY` en el frontend.

- ✅ Úsala solo en backend (`/app/api/onramp/route.ts`)
- ✅ Agrega `.env.local` a `.gitignore`
- ✅ Rota las keys periódicamente
- ✅ Usa variables de entorno en Vercel/servidor

### Validación de Firma

Nuestro código ya implementa firma HMAC-SHA256:

```typescript
const urlSignature = crypto
  .createHmac('sha256', MOONPAY_SECRET_KEY)
  .update(moonpayUrl.search)
  .digest('base64');
```

Esto previene que usuarios modifiquen los parámetros de la URL.

---

## 📊 Monitoreo de Transacciones

### Dashboard de MoonPay

Ve todas las transacciones en:
- Dashboard → **Transactions**

Información disponible:
- Estado de la transacción
- Monto en fiat
- Monto en crypto
- Wallet de destino
- Método de pago
- Timestamps

### Logs en tu App

El hook `useFundWallet` loguea:

```typescript
console.log('Opening MoonPay for:', {
  wallet: walletAddress,
  amount: amount || 'user choice',
  asset: asset.toUpperCase(),
  provider: data.provider,
  currency: data.currency
});
```

Revisa la consola del navegador para debugging.

---

## 💰 Comisiones de MoonPay

MoonPay cobra comisiones al usuario final:

- **Tarjeta de crédito**: ~3.5% + $0.99
- **Tarjeta de débito**: ~3.5% + $0.99
- **Bank Transfer**: ~1% (más lento, 3-5 días)
- **Apple Pay**: ~3.5% + $0.99
- **Google Pay**: ~3.5% + $0.99

**Nota**: Tú NO pagas estas comisiones. Las paga el usuario al completar la compra.

---

## 🛠️ Troubleshooting

### Error: "Payment service not configured"

**Causa**: Las environment variables no están configuradas.

**Solución**:
1. Verifica que `.env.local` existe
2. Verifica que `MOONPAY_PUBLIC_KEY` y `MOONPAY_SECRET_KEY` están definidas
3. Reinicia el servidor de desarrollo

### Error: "Please allow popups"

**Causa**: El navegador bloqueó el popup de MoonPay.

**Solución**:
1. Permite popups para tu dominio
2. O abre MoonPay en la misma pestaña (modificar código)

### Sandbox no funciona

**Causa**: Estás usando production keys en desarrollo.

**Solución**:
1. Asegúrate de usar `pk_test_*` y `sk_test_*`
2. Verifica que estás en modo sandbox en el dashboard

### Tokens no llegan a wallet (Sandbox)

**Esperado**: En sandbox, los tokens NO se envían realmente. Es solo simulación.

**Solución**: Para testing real, usa production keys y tarjetas reales.

---

## 📞 Soporte

- **Documentación**: [MoonPay Docs](https://docs.moonpay.com)
- **API Reference**: [MoonPay API](https://docs.moonpay.com/api-reference)
- **Support**: support@moonpay.com
- **Status Page**: [status.moonpay.com](https://status.moonpay.com)

---

## ✅ Checklist Final

Antes de hacer deploy a producción:

- [ ] Cuenta de MoonPay verificada
- [ ] Production keys obtenidas
- [ ] Variables de entorno configuradas en Vercel/servidor
- [ ] Currencies habilitadas (usdc_base, usdt_base)
- [ ] Testing completo en sandbox
- [ ] Webhook configurado (opcional)
- [ ] Límites de transacción configurados
- [ ] Políticas de reembolso definidas
- [ ] Soporte al cliente preparado

---

## 🎉 ¡Listo!

Ahora tus usuarios pueden comprar USDC y USDT con tarjeta de crédito directamente desde tu app.

**Flujo del usuario**:
1. Conecta wallet
2. Agrega tickets al carrito
3. Click "Buy USDC/USDT with Card"
4. Completa compra en MoonPay
5. Espera 5-15 minutos
6. USDC/USDT llega a wallet
7. Compra tickets

**¡Éxito!** 🚀
