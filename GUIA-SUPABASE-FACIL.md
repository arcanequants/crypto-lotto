# 🚀 Guía Súper Fácil para Configurar Supabase

**Tiempo estimado**: 5-10 minutos
**Nivel**: Principiante total (nunca he usado Supabase)

---

## 📝 ¿Qué es Supabase?

Supabase es como una base de datos en la nube, super fácil de usar. Es GRATIS para proyectos pequeños como este. Piénsalo como un Excel en internet que tu app puede leer y escribir.

---

## PASO 1: Crear Cuenta (2 minutos)

### 1.1 Ir a Supabase
- Abre tu navegador
- Ve a: **https://supabase.com**
- Haz clic en el botón verde **"Start your project"** (arriba a la derecha)

### 1.2 Registrarte
Puedes elegir una de estas opciones:
- ✅ **Opción más fácil**: "Continue with GitHub" (usa tu cuenta de GitHub)
- ✅ **También fácil**: "Continue with Google" (usa tu cuenta de Gmail)
- ⚠️ **O con email**: Pero tendrás que verificar tu correo

**Recomendación**: Usa GitHub si ya tienes cuenta, es 1 clic.

---

## PASO 2: Crear tu Proyecto (3 minutos)

### 2.1 Después de iniciar sesión
Verás una pantalla que dice "New project" o "Create a new project"

### 2.2 Llenar el formulario
Te pedirá:

1. **Name** (Nombre del proyecto):
   - Escribe: `crypto-lotto-mvp`

2. **Database Password** (Contraseña):
   - Haz clic en "Generate a password" (el botón con un candado)
   - **⚠️ IMPORTANTE**: Copia esta contraseña y guárdala en un lugar seguro
   - Puedes pegarla en un archivo de texto temporal

3. **Region** (Región):
   - Selecciona la más cercana a ti:
     - Si estás en México: **"West US (North California)"**
     - Si estás en USA: **"East US (North Virginia)"** o **"West US"**

4. **Pricing Plan**:
   - Déjalo en **"Free"** (es gratis, perfecto para el MVP)

### 2.3 Crear el proyecto
- Haz clic en el botón verde **"Create new project"**
- Espera 1-2 minutos mientras Supabase configura todo
- Verás una barra de progreso

---

## PASO 3: Obtener tus Credenciales (2 minutos)

### 3.1 Cuando termine de crear el proyecto
Estarás en el "Dashboard" (panel de control)

### 3.2 Ir a Settings
- En el menú de la izquierda, busca el ícono de engranaje ⚙️
- Haz clic en **"Settings"** (hasta abajo del menú)
- Luego haz clic en **"API"** (en el submenú de Settings)

### 3.3 Copiar tus credenciales
Verás dos secciones importantes:

**📍 Project URL**
- Busca donde dice "Project URL"
- Verá algo como: `https://abcdefghijk.supabase.co`
- Haz clic en el botón de copiar (📋) al lado
- **Guárdalo** en un archivo de texto temporal

**🔑 Project API keys**
- Busca la sección "Project API keys"
- Encontrarás varias keys, necesitas la **"anon" "public"**
- Dice algo como: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (es MUY largo)
- Haz clic en el botón de copiar (📋) al lado
- **Guárdalo** también en tu archivo de texto temporal

**AHORA TIENES:**
```
URL: https://tuproyecto.supabase.co
KEY: eyJhbGciOiJIUzI1NiIsInR...
```

---

## PASO 4: Crear las Tablas de la Base de Datos (3 minutos)

### 4.1 Ir al SQL Editor
- En el menú de la izquierda, busca el ícono **"SQL Editor"** (parece </>)
- Haz clic en **"SQL Editor"**

### 4.2 Abrir el archivo SQL
**EN TU COMPUTADORA** (no en Supabase todavía):
- Ve a la carpeta: `/Users/albertosorno/crypto-lotto/web/`
- Busca el archivo: **`supabase-schema.sql`**
- Ábrelo con TextEdit o cualquier editor de texto
- Selecciona TODO el contenido (Cmd+A)
- Cópialo (Cmd+C)

### 4.3 Pegar y ejecutar el SQL
**DE VUELTA EN SUPABASE**:
- Haz clic en **"New query"** (botón arriba a la derecha)
- Verás un editor de texto grande vacío
- Pega el SQL que copiaste (Cmd+V)
- Haz clic en el botón **"Run"** (abajo a la derecha, o presiona Cmd+Enter)

### 4.4 Verificar que funcionó
- Si todo salió bien, verás un mensaje:
  ```
  ✅ Supabase schema created successfully!
  ```
- Si ves este mensaje, ¡PERFECTO! Las tablas están creadas.

### 4.5 Ver tus tablas (opcional pero recomendado)
- En el menú de la izquierda, haz clic en **"Table Editor"** (ícono de tabla)
- Deberías ver 2 tablas:
  - **draws** (sorteos de lotería)
  - **tickets** (tickets de usuarios)
- Haz clic en **draws** y verás 1 fila (el primer sorteo MOCK)

---

## PASO 5: Actualizar tu Proyecto (2 minutos)

### 5.1 Abrir el archivo de configuración
**EN TU COMPUTADORA**:
- Ve a: `/Users/albertosorno/crypto-lotto/web/`
- Busca el archivo: **`.env.local`**
- Ábrelo con tu editor de código (VS Code, Cursor, etc.)

### 5.2 Pegar tus credenciales
Verás algo como:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Cámbialo por tus credenciales REALES:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE**:
- NO pongas espacios
- NO pongas comillas
- Pega exactamente como está arriba

### 5.3 Guardar el archivo
- Guarda el archivo `.env.local` (Cmd+S)

---

## ✅ PASO 6: Verificar que Todo Funciona

### 6.1 Si tu servidor está corriendo
Si ya tienes `npm run dev` corriendo:
- Ve a la terminal
- Presiona **Ctrl+C** para detenerlo
- Vuelve a ejecutar: `npm run dev`
- Esto cargará las nuevas credenciales

### 6.2 Dile a Claude que verifique
Una vez que hayas hecho todo esto, escribe:
```
"Claude, ya configuré Supabase. Verifica que la conexión funcione."
```

Claude creará un pequeño test para verificar que todo está conectado correctamente.

---

## 🎉 ¡LISTO!

**Si llegaste hasta aquí, FELICIDADES**, ya tienes Supabase configurado.

### ¿Qué acabas de hacer?
1. ✅ Creaste una base de datos en la nube (GRATIS)
2. ✅ Creaste 2 tablas: `draws` y `tickets`
3. ✅ Conectaste tu app de Next.js a Supabase
4. ✅ Ahora tu app puede guardar y leer tickets de lotería

### Próximo paso
Después de esto, Claude configurará **Privy** (autenticación con email/Google/wallet) para que los usuarios puedan comprar tickets.

---

## 🆘 Problemas Comunes

### "No veo el archivo .env.local"
- Es un archivo oculto. En tu editor de código debería aparecer
- Si no lo ves, busca "show hidden files" en tu sistema operativo

### "El SQL me da error"
- Asegúrate de copiar TODO el contenido de `supabase-schema.sql`
- Asegúrate de NO tener texto extra antes o después

### "¿Dónde está el SQL Editor?"
- Menú izquierdo → Busca el ícono **</>** → "SQL Editor"

### "Mi URL/Key no funciona"
- Asegúrate de copiar la **"anon" "public"** key (NO la "service_role")
- Asegúrate de NO tener espacios al inicio o final

### "Necesito ayuda"
- Dile a Claude: "Tengo un problema en el paso X" y describe qué ves

---

**Creado para**: Alberto
**Proyecto**: Crypto Lotto MVP
**Fecha**: 2025-10-19
**Dificultad**: ⭐ Muy Fácil (para principiantes totales)
