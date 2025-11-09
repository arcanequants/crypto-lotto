# 🔍 DIAGNÓSTICO: Error al Comprar Tickets

**Problema:** Los tickets no se guardan en Supabase, muestra "Failed to save ticket to database"

**Estado:** RLS desactivado ✅, Migración ejecutada ✅, pero error persiste ❌

---

## 📋 PLAN DE ACCIÓN (3 pasos rápidos)

### ✅ PASO 1: Ver error completo (1 minuto)

**Ya lo hice:** Actualicé el código para mostrar el error completo.

**Tú debes:**
1. Refresca tu navegador (Cmd+R / Ctrl+R)
2. Intenta comprar un ticket otra vez
3. Abre la consola del navegador (F12 → Console)
4. Busca el mensaje **"=== SUPABASE ERROR COMPLETO ==="**
5. **Toma screenshot de TODO el error** (especialmente las líneas que dicen "Error code", "Error message", "Error details", "Error hint")

Este paso es CRÍTICO porque el error completo nos dirá exactamente qué está mal.

---

### ✅ PASO 2: Verificar estructura real de la tabla (2 minutos)

**Ve a Supabase SQL Editor** y corre este comando:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tickets'
ORDER BY ordinal_position;
```

**Esto te dirá:**
- Qué columnas REALMENTE existen en tu tabla
- El tipo de datos de cada columna
- Si tienen valores por defecto

**Toma screenshot del resultado completo.**

---

### ✅ PASO 3: Test manual de insert (1 minuto)

**Ve a Supabase SQL Editor** y corre el contenido del archivo:
```
TEST-INSERT-TICKET.sql
```

Ese archivo tiene un INSERT de prueba con valores reales. Si funciona, sabremos que el problema es en el código. Si falla, sabremos que es un problema de la base de datos.

**Copia el resultado** (si funciona o si da error).

---

## 🎯 ¿QUÉ VOY A HACER DESPUÉS?

Una vez que me mandes los 3 resultados:
1. Screenshot del error completo (PASO 1)
2. Screenshot de la estructura de la tabla (PASO 2)
3. Resultado del test insert manual (PASO 3)

Podré:
- Identificar el problema exacto
- Arreglar el código o la base de datos según corresponda
- Verificar que la compra funcione

---

## 🧐 POSIBLES CAUSAS (teorías)

### Teoría 1: Mismatch de schema
El archivo `lib/supabase.ts` tiene tipos que NO coinciden con `supabase-schema.sql`:
- Types dice `draw_number`, schema dice `draw_id`
- Types dice `draw_date`, schema dice `end_time`
- Types dice `status`, schema dice `executed`

**Posible solución:** La tabla real en Supabase podría tener nombres de columnas diferentes.

### Teoría 2: Foreign key constraint
Aunque el schema no muestra foreign key, Supabase podría haber agregado uno automáticamente al draw_id.

**Posible solución:** Verificar que existe un draw con id=1.

### Teoría 3: Array format
PostgreSQL puede ser quisquilloso con el formato de arrays. El código envía `ticket.numbers` (JavaScript array), pero PostgreSQL espera `INTEGER[]`.

**Posible solución:** Puede que necesitemos enviar el array en un formato específico.

### Teoría 4: Trigger o policy oculta
Aunque desactivamos RLS, podría haber un trigger o policy a nivel de columna que está bloqueando.

**Posible solución:** Los logs completos (PASO 1) nos lo dirán.

---

## 📝 RESUMEN RÁPIDO

**Lo que funciona:**
- ✅ Login con Privy
- ✅ Seleccionar números
- ✅ Agregar al cart
- ✅ Conexión a Supabase (no da error de auth)
- ✅ RLS desactivado
- ✅ Columnas claim_status y prize_amount existen

**Lo que NO funciona:**
- ❌ El INSERT a la tabla tickets

**Próximo paso:**
- 📸 Corre los 3 pasos arriba y mándame screenshots/resultados
- 🔧 Yo arreglo el problema con la info que me des
- ✅ Verificamos que funcione

---

## ⚡ ATAJOS RÁPIDOS

**Supabase Dashboard:**
https://supabase.com/dashboard

**SQL Editor:**
Dashboard → SQL Editor (menú izquierdo)

**Table Editor:**
Dashboard → Table Editor → tickets

**Navegador Console:**
F12 → Console tab

---

**¡Con estos 3 datos voy a poder arreglar el problema en menos de 5 minutos!** 🚀
