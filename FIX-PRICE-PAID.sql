-- ================================================================
-- FIX: Agregar columna price_paid que falta en la tabla tickets
-- ================================================================

-- OPCIÓN 1: Si la columna NO existe, agrégala
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS price_paid DECIMAL(18, 8) DEFAULT 0.25;

-- OPCIÓN 2: Si existe pero Supabase no la ve, refresca el schema cache
-- (Esto lo hace automáticamente al agregar la columna)

-- Verificar que funcionó
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tickets'
ORDER BY ordinal_position;

-- Deberías ver price_paid en la lista con tipo "numeric" y default "0.25"
