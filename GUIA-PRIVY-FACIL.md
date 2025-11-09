# 🔐 Guía Súper Fácil para Configurar Privy

**Tiempo estimado**: 5-10 minutos
**Nivel**: Principiante total (nunca he usado Privy)

---

## 📝 ¿Qué es Privy?

Privy es un servicio de autenticación (login) para apps Web3. Permite que los usuarios:
- 🔑 Hagan login con email o Google (como cualquier app normal)
- 💳 Tengan una wallet embebida (invisible, automática)
- 🦊 O conecten MetaMask si ya tienen wallet

**Es GRATIS** para proyectos pequeños (hasta 1,000 usuarios/mes).

---

## PASO 1: Crear Cuenta (2 minutos)

### 1.1 Ir a Privy
- Abre tu navegador
- Ve a: **https://privy.io**
- Haz clic en **"Get Started"** o **"Sign Up"** (arriba a la derecha)

### 1.2 Registrarte
Puedes elegir:
- ✅ **Opción más fácil**: "Continue with Google" (usa tu cuenta de Gmail)
- ✅ **También fácil**: "Continue with GitHub" (si tienes cuenta)
- ⚪ **O con email**: Pero tendrás que verificar tu correo

**Recomendación**: Usa Google si tienes Gmail, es 1 clic.

---

## PASO 2: Crear tu App (3 minutos)

### 2.1 Después de iniciar sesión
Verás el Dashboard de Privy. Probablemente te pregunte si quieres crear un nuevo app.

### 2.2 Crear nuevo app
- Haz clic en **"Create App"** o **"New App"**

### 2.3 Llenar el formulario

Te pedirá:

**1. App Name** (Nombre de la app):
   - Escribe: `Crypto Lotto MVP`

**2. App URL** (Opcional para desarrollo):
   - Puedes dejarlo vacío por ahora
   - O escribir: `http://localhost:3000`

**3. Allowed Origins** (Orígenes permitidos):
   - Agregar: `http://localhost:3000`
   - Esto permite que tu app local se conecte a Privy

### 2.4 Crear el app
- Haz clic en el botón **"Create"** o **"Create App"**
- El app se creará inmediatamente

---

## PASO 3: Obtener tu APP ID (2 minutos)

### 3.1 Dashboard del App
Después de crear el app, estarás en el dashboard del mismo.

### 3.2 Encontrar el App ID
Busca en la pantalla:
- Puede estar en la esquina superior
- O en una sección llamada **"Settings"** → **"API Keys"** o **"App Settings"**
- Verás algo como:

```
App ID: clp5xxxxxxxxxxxxxxxx
```

Es un string que empieza con `clp` y tiene letras/números aleatorios.

### 3.3 Copiar el App ID
- Haz clic en el botón de copiar (📋) al lado del App ID
- **Guárdalo** en un archivo de texto temporal

---

## PASO 4: Configurar Login Methods (3 minutos)

Privy te permite elegir cómo los usuarios pueden hacer login.

### 4.1 Ir a "Login Methods" o "Configuration"
- En el menú de la izquierda, busca **"Login Methods"** o **"Configuration"**
- Haz clic ahí

### 4.2 Habilitar métodos de login
Asegúrate de que estén habilitados:
- ✅ **Email** (login con email + código)
- ✅ **Google** (login con cuenta de Google)
- ✅ **Wallet** (para conectar MetaMask)

**Cómo habilitar**:
- Normalmente hay un toggle (interruptor) al lado de cada método
- Si está en gris, haz clic para activarlo (debe ponerse azul/verde)

### 4.3 Embedded Wallets (IMPORTANTE)
Busca una sección que diga **"Embedded Wallets"** o **"Smart Wallets"**

Activa:
- ✅ **Create embedded wallet on login** (Crear wallet automática al hacer login)

Esto es MUY importante porque permite que usuarios SIN wallet (señora de 70 años) puedan usar tu app.

---

## PASO 5: Configurar Redes (Blockchain Networks) (2 minutos)

### 5.1 Ir a "Networks" o "Chains"
- Busca en el menú una sección llamada **"Networks"**, **"Chains"** o **"Supported Networks"**

### 5.2 Agregar BASE
- Busca **"BASE"** en la lista de redes
- Si no está habilitado, actívalo
- También puedes agregar **"BASE Sepolia"** (testnet) para testing

**Redes recomendadas para MVP**:
- ✅ **BASE** (mainnet) - Producción
- ✅ **BASE Sepolia** (testnet) - Testing

### 5.3 Default Network (Opcional)
- Puedes seleccionar **BASE** como la red por defecto
- Esto significa que cuando un usuario crea una wallet embebida, será en BASE

---

## PASO 6: Actualizar tu Proyecto (2 minutos)

### 6.1 Abrir el archivo de configuración
**EN TU COMPUTADORA**:
- Ve a: `/Users/albertosorno/crypto-lotto/web/`
- Busca el archivo: **`.env.local`**
- Ábrelo con tu editor de código (VS Code, Cursor, TextEdit, etc.)

### 6.2 Agregar el App ID
Verás algo como esto:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://fjxbuyxephlfoivcpckd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Smart Contract (will be filled in Week 6)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Privy (will be filled in Day 11-12)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
```

**Cambia la última línea** de:
```bash
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
```

A:
```bash
NEXT_PUBLIC_PRIVY_APP_ID=clp5xxxxxxxxxx
```

(Usa tu App ID real que copiaste)

### 6.3 Guardar el archivo
- Guarda el archivo `.env.local` (Cmd+S)

---

## ✅ PASO 7: Verificar que Todo Está Listo

### Checklist:
- [x] Cuenta de Privy creada ✅
- [x] App "Crypto Lotto MVP" creada ✅
- [x] App ID obtenido (empieza con `clp`) ✅
- [x] Login methods habilitados (Email, Google, Wallet) ✅
- [x] Embedded wallets activadas ✅
- [x] BASE network agregada ✅
- [x] `.env.local` actualizado con App ID ✅

---

## 🎉 ¡LISTO!

Si completaste todos los pasos, **Privy está configurado**.

### ✋ Avísale a Claude
Escribe:
```
"Claude, ya configuré Privy con el App ID"
```

Claude va a:
1. Configurar el código de autenticación
2. Implementar login con email y Google
3. Conectar wallets (MetaMask + embedded wallets)
4. Verificar que todo funciona

---

## 🆘 Problemas Comunes

### "No veo dónde crear el app"
- Busca un botón que diga "Create App", "New App" o "Get Started"
- Debería estar en el dashboard principal después de registrarte

### "No encuentro el App ID"
- Ve a Settings → API Keys
- O mira en la esquina superior del dashboard del app
- El App ID siempre empieza con `clp`

### "¿Qué pongo en App URL?"
- Para desarrollo local: `http://localhost:3000`
- Luego cuando hagas deploy, agregrarás la URL de Vercel

### "¿Qué es 'Allowed Origins'?"
- Son las URLs que pueden usar Privy
- Agrega: `http://localhost:3000` (para desarrollo)
- Luego agregarás tu dominio de producción

### "¿Cuánto cuesta Privy?"
- **GRATIS** hasta 1,000 usuarios activos/mes
- Perfecto para tu MVP
- Solo pagas si creces más de 1,000 usuarios

---

## 📝 Configuraciones Importantes

### Login Methods (Métodos de login):
```
✅ Email (con código de verificación)
✅ Google (OAuth)
✅ Wallet (MetaMask, Rainbow, etc.)
⚠️ NO necesitas SMS (cuesta dinero)
⚠️ NO necesitas Twitter/Discord (por ahora)
```

### Embedded Wallets:
```
✅ Create on login: YES
✅ Custodial: YES (más fácil para usuarios)
⚠️ Non-custodial: NO (más complejo)
```

### Networks:
```
✅ BASE (mainnet)
✅ BASE Sepolia (testnet)
⚠️ NO necesitas Ethereum mainnet (gas caro)
⚠️ NO necesitas Polygon/Optimism (por ahora)
```

---

## 🎯 Próximo Paso

Una vez que tengas el App ID y lo agregues a `.env.local`:

**Claude configurará**:
1. `app/providers.tsx` - PrivyProvider
2. Componente de login
3. Botón "Connect Wallet"
4. Embedded wallets automáticas
5. Integración con wagmi/viem

**Tiempo estimado**: 2 horas de código (Claude)

---

**Creado para**: Alberto
**Proyecto**: Crypto Lotto MVP
**Fecha**: 2025-10-19
**Dificultad**: ⭐ Fácil (5-10 minutos)
