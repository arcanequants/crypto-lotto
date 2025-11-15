# 🔐 ADMIN DASHBOARD - OPCIONES DE SEGURIDAD

## 📍 PREGUNTA CLAVE: ¿Dónde poner el dashboard?

Tienes **3 opciones** principales. Aquí te explico cada una con sus pros/contras:

---

## OPCIÓN 1: 🌐 DENTRO DE LA WEB PÚBLICA (Recomendado para empezar)

### ¿Cómo funciona?
El dashboard está en la misma app de Vercel, pero protegido con autenticación:
- URL: `https://crypto-lotto-six.vercel.app/admin`
- Solo TÚ puedes acceder (autenticación por wallet)
- Los usuarios normales ni siquiera lo ven

### Estructura:
```
/app
  /admin                    ← Dashboard (protegido)
    /dashboard
    /draws
    /finance
  /                         ← Homepage pública
  /my-tickets               ← Página de usuarios
  /results                  ← Página de usuarios
```

### Seguridad:
```typescript
// Middleware de autenticación
export async function middleware(req: NextRequest) {
  // Si la ruta es /admin/*
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // Verificar que la wallet conectada sea la tuya
    const wallet = getWalletFromSession(req);
    const ADMIN_WALLET = '0x778f6cf70bce995d25f7de728cd54198ba892e1a'; // TU WALLET

    if (wallet !== ADMIN_WALLET) {
      return NextResponse.redirect('/'); // Redirigir a home
    }
  }

  return NextResponse.next();
}
```

### ✅ PROS:
1. **Fácil de implementar** - Todo en un solo proyecto
2. **Sin costos extra** - Mismo hosting de Vercel
3. **Acceso desde cualquier lugar** - Solo necesitas internet
4. **Actualizaciones automáticas** - Deploy una vez, funciona en todos lados
5. **Un solo dominio** - No necesitas configurar otro
6. **Logs centralizados** - Todo en Vercel logs

### ❌ CONTRAS:
1. **Expuesto a internet** - Aunque protegido, alguien podría intentar atacar
2. **Depende de Vercel** - Si Vercel cae, pierdes acceso
3. **Riesgo de error** - Si falla el middleware, alguien podría ver el dashboard

### 🔒 Medidas de seguridad OBLIGATORIAS:
```env
# .env.local y Vercel
ADMIN_WALLET_ADDRESS=0x778f6cf70bce995d25f7de728cd54198ba892e1a
ADMIN_API_SECRET=tu-secret-muy-largo-y-random-12345
RATE_LIMIT_ADMIN=10  # Máximo 10 requests por minuto
```

```typescript
// Protección adicional
- Rate limiting: Máximo 10 requests/minuto desde una IP
- 2FA opcional: Código de Google Authenticator
- IP Whitelist: Solo permitir acceso desde tu IP de casa/oficina
- Session timeout: Logout automático después de 30 mins de inactividad
- Audit log: Registrar TODAS las acciones de admin
```

---

## OPCIÓN 2: 💻 APP LOCAL (Solo en tu computadora)

### ¿Cómo funciona?
El dashboard corre SOLO en tu laptop/PC, nunca se sube a internet:
- URL: `http://localhost:3001/admin`
- Solo accesible desde tu máquina
- Nadie más puede verlo ni acceder

### Estructura:
```
/crypto-lotto
  /web                      ← App pública (Vercel)
  /admin-dashboard          ← App local (SOLO en tu compu)
    package.json
    .env.local              ← Secrets SOLO aquí
    /app
      /page.tsx             ← Dashboard local
```

### Cómo usar:
```bash
# En tu computadora
cd /crypto-lotto/admin-dashboard
npm run dev

# Dashboard corre en localhost:3001
# NUNCA se sube a GitHub ni Vercel
```

### ✅ PROS:
1. **Máxima seguridad** - No está en internet, imposible de hackear remotamente
2. **Sin límites de rate** - Puedes hacer todas las requests que quieras
3. **Secretos seguros** - Private keys nunca salen de tu máquina
4. **Control total** - No depende de servicios externos
5. **Sin costos** - No pagas hosting extra

### ❌ CONTRAS:
1. **Solo desde tu computadora** - No puedes acceder desde el cel o trabajo
2. **Requiere setup** - Tienes que instalar y configurar
3. **Backups manuales** - Si tu compu se daña, pierdes todo
4. **No updates automáticos** - Tienes que hacer `git pull` manual
5. **Requiere mantener la compu prendida** - Para ver datos en tiempo real

### 🔒 Medidas de seguridad OBLIGATORIAS:
```bash
# .env.local (NUNCA commitear a git)
WITHDRAWAL_EXECUTOR_PRIVATE_KEY=0xTU_PRIVATE_KEY
ADMIN_WALLET_ADDRESS=0x778f6cf70bce995d25f7de728cd54198ba892e1a

# .gitignore (asegurar que esto esté)
.env.local
.env.*.local
secrets/
```

---

## OPCIÓN 3: 🔐 SUBDOMINIO PRIVADO (Opción PRO)

### ¿Cómo funciona?
Un dashboard separado en un subdominio con seguridad extra:
- URL: `https://admin.crypto-lotto.com` (subdominio privado)
- Autenticación robusta con Clerk o Auth0
- Infraestructura separada de la app principal

### Estructura:
```
crypto-lotto.com              ← App pública (usuarios)
admin.crypto-lotto.com        ← Dashboard admin (solo tú)
  - Auth con Clerk/Auth0
  - IP Whitelist en Vercel
  - 2FA obligatorio
```

### ✅ PROS:
1. **Separación total** - Si hackean la app pública, el admin está seguro
2. **Autenticación profesional** - Clerk/Auth0 con 2FA, biometrics, etc
3. **Acceso desde cualquier lado** - Con seguridad robusta
4. **Escalable** - Si contratas más admins, fácil de dar acceso
5. **Auditoría avanzada** - Logs profesionales de quién hace qué
6. **Custom domain** - Se ve profesional

### ❌ CONTRAS:
1. **Más complejo** - Requiere configurar Auth0/Clerk ($$$)
2. **Costos extra** - Auth0 cuesta ~$25/mes, dominio ~$12/año
3. **Más tiempo de setup** - 2-3 días de implementación
4. **Overkill para 1 admin** - Si solo eres tú, es mucho

### 🔒 Medidas de seguridad OBLIGATORIAS:
```bash
# Vercel Firewall
- IP Whitelist: Solo tus IPs
- Country blocking: Solo tu país
- DDoS protection: Auto-enabled

# Auth0/Clerk
- 2FA obligatorio
- Biometric login opcional
- Session management
- Activity logs
```

---

## 🎯 MI RECOMENDACIÓN SEGÚN TU CASO

### Si es tu PRIMER proyecto y eres el ÚNICO admin:

**👉 Empieza con OPCIÓN 1 (Web pública protegida)**

**¿Por qué?**
1. Es la más rápida de implementar (1 día)
2. Te permite iterar rápido y aprender
3. Puedes acceder desde cualquier lugar
4. Si lo proteges bien, es suficientemente seguro
5. Más adelante puedes migrar a Opción 3 si crece

**Seguridad mínima necesaria:**
```typescript
// 1. Middleware de autenticación
// 2. Rate limiting (10 req/min)
// 3. Audit logs (quién hizo qué)
// 4. Session timeout (30 mins)
// 5. HTTPS obligatorio (Vercel lo da gratis)
```

---

### Si necesitas MÁXIMA seguridad AHORA:

**👉 Usa OPCIÓN 2 (App local)**

**¿Por qué?**
1. Secrets nunca salen de tu máquina
2. Imposible de hackear remotamente
3. Sin costos de Auth0/Clerk
4. Perfecto para aprender sin riesgos

**Trade-off:**
- Solo accesible desde tu compu
- No puedes checarlo desde el cel mientras estás fuera

---

### Si el proyecto va a CRECER (contratar más admins):

**👉 Invierte en OPCIÓN 3 (Subdominio privado)**

**¿Por qué?**
1. Fácil dar acceso a nuevos admins
2. Auditoría profesional de acciones
3. 2FA y seguridad enterprise-grade
4. Se ve profesional ante inversores

**Costos:**
- Auth0: $25/mes
- Dominio: $12/año
- Setup inicial: 2-3 días de dev

---

## 🚀 PLAN RECOMENDADO (Por fases)

### FASE 1: MVP (Ahora - Primera semana)
**→ OPCIÓN 1: Web pública protegida**
- Implementar dashboard básico
- Auth con wallet (Privy ya lo tienes)
- Middleware simple
- Rate limiting básico

**Tiempo:** 2-3 días
**Costo:** $0 (ya tienes Vercel Pro)

### FASE 2: Producción (Semana 2-4)
**→ Mejorar seguridad OPCIÓN 1**
- Agregar 2FA con Google Authenticator
- IP whitelist
- Audit logs completos
- Alertas automáticas

**Tiempo:** 1-2 días
**Costo:** $0

### FASE 3: Escalamiento (Mes 2-3)
**→ Si crece, migrar a OPCIÓN 3**
- Contratar Auth0/Clerk
- Configurar subdominio
- Migrar usuarios admin
- Setup avanzado

**Tiempo:** 3-4 días
**Costo:** ~$300/año

---

## 🔒 CHECKLIST DE SEGURIDAD (Independiente de la opción)

### ✅ Obligatorio en TODAS las opciones:

1. **Autenticación:**
   - [ ] Solo tu wallet puede acceder
   - [ ] Session expira después de 30 mins
   - [ ] Re-autenticación para acciones críticas

2. **Rate Limiting:**
   - [ ] Máximo 10 requests/minuto por IP
   - [ ] Máximo 100 requests/hora por usuario
   - [ ] Block automático después de 5 intentos fallidos

3. **Logging:**
   - [ ] Log de TODAS las acciones de admin
   - [ ] Timestamp + IP + Action + Result
   - [ ] Exportar logs a CSV cada semana

4. **Secrets Management:**
   - [ ] Private keys NUNCA en código
   - [ ] Variables de entorno encriptadas
   - [ ] Rotar secrets cada 3 meses

5. **Monitoring:**
   - [ ] Alertas si alguien intenta acceder sin permiso
   - [ ] Notificación si executor wallet < 0.01 ETH
   - [ ] Email si un draw falla

---

## 📊 COMPARACIÓN RÁPIDA

| Feature                  | Opción 1 (Web) | Opción 2 (Local) | Opción 3 (Pro) |
|--------------------------|----------------|------------------|----------------|
| Seguridad                | ⭐⭐⭐⭐         | ⭐⭐⭐⭐⭐          | ⭐⭐⭐⭐⭐       |
| Facilidad de uso         | ⭐⭐⭐⭐⭐       | ⭐⭐⭐            | ⭐⭐⭐⭐        |
| Costo                    | $0             | $0               | $300/año       |
| Tiempo de setup          | 2-3 días       | 1 día            | 3-4 días       |
| Acceso remoto            | ✅              | ❌                | ✅              |
| Escalabilidad            | ⭐⭐⭐          | ⭐               | ⭐⭐⭐⭐⭐       |
| Mantenimiento            | Bajo           | Medio            | Bajo           |
| Recomendado para MVP     | ✅              | ✅                | ❌              |

---

## 🎯 RESPUESTA DIRECTA A TU PREGUNTA

**"¿Dónde recomiendas ponerlo y por qué?"**

### Para tu primer proyecto, te recomiendo:

**🥇 OPCIÓN 1: Dentro de la web pública (protegido)**

**Razones:**
1. **Aprendizaje rápido:** Ves resultados en 2-3 días
2. **Sin inversión:** $0 de costo adicional
3. **Flexibilidad:** Accedes desde cualquier lugar
4. **Suficientemente seguro:** Si lo haces bien (sigue el checklist)
5. **Fácil de mejorar:** Más adelante migras a Opción 3 si crece

**Seguridad que DEBES implementar:**
```typescript
1. Middleware de auth (solo tu wallet)
2. Rate limiting (10 req/min)
3. Session timeout (30 mins)
4. Audit logs (registrar todo)
5. HTTPS (Vercel lo da automático)
```

**Estructura:**
```
https://crypto-lotto-six.vercel.app/
  ├─ /                      ← Usuarios
  ├─ /my-tickets            ← Usuarios
  ├─ /results               ← Usuarios
  └─ /admin                 ← SOLO TÚ (protegido)
       ├─ /dashboard
       ├─ /draws
       ├─ /finance
       └─ /health
```

---

## 🚀 SIGUIENTE PASO

¿Empezamos con la **Opción 1**? Te implemento:

1. **Middleware de autenticación** (solo tu wallet)
2. **Dashboard Overview** (KPIs principales)
3. **Draws Monitor** (ver estado en tiempo real)
4. **System Health** (crons, blockchain, errores)

Tiempo estimado: **2-3 días de desarrollo**

**¿Vamos con esto?** 🎯
