-- ================================================================
-- TEST: Insertar ticket manualmente en Supabase
-- ================================================================
-- Corre este SQL en Supabase SQL Editor para probar si el insert funciona

-- PASO 1: Ver la estructura actual de la tabla tickets
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tickets'
ORDER BY ordinal_position;

-- PASO 2: Ver si hay algún constraint o trigger
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'tickets';

-- PASO 3: Intentar insertar un ticket de prueba
-- (Ajusta el user_wallet con tu dirección real de wallet/email)
INSERT INTO tickets (
  draw_id,
  user_wallet,
  selected_numbers,
  power_number,
  purchase_date,
  transaction_hash,
  price_paid,
  claim_status,
  prize_amount
) VALUES (
  1,
  'test@test.com',
  ARRAY[5, 12, 23, 34, 45],
  10,
  NOW(),
  NULL,
  0.25,
  'pending',
  0
) RETURNING *;

-- Si el INSERT funciona, verás el ticket insertado
-- Si falla, verás el error exacto

-- PASO 4: Si funcionó, borra el ticket de prueba
-- DELETE FROM tickets WHERE user_wallet = 'test@test.com';
