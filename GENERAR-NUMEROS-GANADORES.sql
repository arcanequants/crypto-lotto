-- ================================================================
-- GENERAR NÚMEROS GANADORES PARA DRAW #1
-- ================================================================
-- Ejecuta esto en Supabase SQL Editor para generar números ganadores
-- y poder probar el sistema de premios

-- OPCIÓN 1: Generar números aleatorios
-- (Reemplaza estos números si quieres otros específicos)
UPDATE draws
SET
  winning_numbers = ARRAY[7, 14, 21, 35, 42],  -- 5 números aleatorios entre 1-50
  power_number = 9,                             -- 1 número aleatorio entre 1-20
  executed = TRUE
WHERE id = 1;

-- Verificar que se actualizó correctamente
SELECT
  id,
  draw_id,
  winning_numbers,
  power_number,
  executed,
  end_time
FROM draws
WHERE id = 1;

-- ================================================================
-- IMPORTANTE:
-- ================================================================
-- Si quieres garantizar un ganador, primero ve a /my-tickets,
-- mira los números que compraste, y luego actualiza winning_numbers
-- para que coincidan parcialmente.
--
-- Ejemplo: Si compraste [5, 12, 23, 34, 45] + PowerBall 10
-- Puedes hacer:
--
-- UPDATE draws
-- SET
--   winning_numbers = ARRAY[5, 12, 23, 34, 45],  -- Coinciden 5
--   power_number = 10,                            -- PowerBall coincide
--   executed = TRUE
-- WHERE id = 1;
--
-- Esto crearía un JACKPOT (5 + PowerBall = 50% del prize pool)
-- ================================================================
