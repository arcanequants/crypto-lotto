# 🚀 PASOS FÁCILES ANTES DE TESTEAR

**Tiempo total: 2-3 minutos**

---

## ✅ PASO 1: Abrir Supabase (30 segundos)

1. Ve a: https://supabase.com/dashboard
2. Haz login (si no estás ya)
3. Click en tu proyecto **"crypto-lotto-mvp"**

---

## ✅ PASO 2: Abrir SQL Editor (10 segundos)

En el menú lateral izquierdo, busca y haz click en:

```
📊 SQL Editor
```

Debe estar entre "Database" y "Edge Functions"

---

## ✅ PASO 3: Copiar el código SQL (20 segundos)

1. En tu VS Code, abre el archivo:
   ```
   supabase-migration-prize-claiming.sql
   ```

2. Selecciona TODO el contenido (Cmd+A / Ctrl+A)

3. Copia (Cmd+C / Ctrl+C)

**El archivo está aquí**: `/Users/albertosorno/crypto-lotto/web/supabase-migration-prize-claiming.sql`

---

## ✅ PASO 4: Pegar y ejecutar en Supabase (30 segundos)

1. Regresa a Supabase SQL Editor

2. Click en el botón **"+ New query"** (arriba a la derecha)

3. En el editor que aparece, **pega el código** (Cmd+V / Ctrl+V)

4. Click en el botón verde **"Run"** (o presiona Cmd+Enter)

5. **ESPERA** a que aparezca el mensaje:
   ```
   ✅ Prize claiming migration completed!
   ```

6. También deberías ver una tabla con:
   ```
   total_tickets | pending_claims | claimed_prizes
   ```

---

## ✅ PASO 5: Verificar que funcionó (30 segundos)

1. En el menú lateral, click en **"Table Editor"**

2. Click en la tabla **"tickets"**

3. Mira las columnas de la tabla (header)

4. **Verifica que existan estas 3 columnas NUEVAS**:
   - `claim_status`
   - `claimed_at`
   - `prize_amount`

Si las ves, **¡LISTO!** ✅

---

## ✅ PASO 6: Listo para testear (1 segundo)

Ahora SÍ puedes testear. Regresa a tu navegador:

```
http://localhost:3000
```

---

## 🎯 RESUMEN ULTRA RÁPIDO

1. Supabase Dashboard → SQL Editor
2. New query
3. Pegar código de `supabase-migration-prize-claiming.sql`
4. Run
5. Verificar mensaje de éxito
6. Table Editor → tickets → ver nuevas columnas

---

## 🐛 ¿ALGO SALIÓ MAL?

### Error: "column already exists"
✅ **Solución**: Ya corriste la migración antes. ¡Estás listo para testear!

### No veo las columnas nuevas
✅ **Solución**:
1. Refresca la página de Supabase (F5)
2. Vuelve a abrir Table Editor → tickets

### El SQL no corre / da error
✅ **Solución**:
1. Asegúrate de copiar TODO el archivo
2. Verifica que estés en el proyecto correcto
3. Mándame screenshot del error

---

## ✨ DESPUÉS DE ESTO

Ya puedes seguir la guía de testing en:
```
GUIA-TESTING-PREMIO-CLAIMING.md
```

O simplemente:
1. Abre http://localhost:3000
2. Compra tickets
3. Ve a `/results` para ver números ganadores
4. Compra más tickets que coincidan
5. Ve a `/my-tickets` para ver tus premios
6. Click "CLAIM PRIZE"

**¡ESO ES TODO!** 🎉
