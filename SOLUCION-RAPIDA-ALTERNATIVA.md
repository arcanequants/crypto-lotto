# ⚡ SOLUCIÓN RÁPIDA ALTERNATIVA

**Problema encontrado:** La columna `price_paid` no existe en la tabla `tickets`

---

## 🎯 SOLUCIÓN PREFERIDA (1 minuto)

**Ve a Supabase → SQL Editor** y corre esto:

```sql
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS price_paid DECIMAL(18, 8) DEFAULT 0.25;
```

**Luego verifica:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tickets';
```

Deberías ver `price_paid` en la lista.

---

## 🚀 SOLUCIÓN ALTERNATIVA (si lo anterior no funciona)

Si prefieres no agregar la columna, puedo **quitar `price_paid` del código** y dejar que se maneje de otra forma.

Pero la **SOLUCIÓN PREFERIDA** es mejor porque el schema original la incluye.

---

## 🤔 ¿Por qué pasó esto?

Probablemente cuando creaste la tabla `tickets` por primera vez, algo falló o no se ejecutó completo el schema.

La migración de prize claiming solo agregó 3 columnas:
- claim_status ✅
- claimed_at ✅
- prize_amount ✅

Pero asumió que las columnas originales ya existían, incluyendo `price_paid`.

---

## ✅ PRÓXIMO PASO

1. Corre la query de arriba para agregar `price_paid`
2. Refresca el navegador
3. Intenta comprar un ticket
4. **¡Debería funcionar!** 🎉

---

**Mándame confirmación cuando la ejecutes y te digo si necesitamos algo más.**
