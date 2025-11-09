-- FIX: Actualizar funciones RPC para retornar AMBOS: id y draw_id
-- Retornamos JSON con ambos valores

-- ============================================
-- FIX get_next_daily_draw_id - Retornar JSON con id y draw_id
-- ============================================

CREATE OR REPLACE FUNCTION get_next_daily_draw_info(purchase_time TIMESTAMPTZ)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  today_draw_time TIMESTAMPTZ;
  draw_info JSON;
BEGIN
  -- Obtener el draw de hoy a las 2 AM UTC
  today_draw_time := DATE_TRUNC('day', purchase_time) + INTERVAL '2 hours';

  -- Si la compra es ANTES de las 2 AM de hoy
  IF purchase_time < today_draw_time THEN
    -- Buscar el draw de HOY
    SELECT json_build_object('id', id, 'draw_id', draw_id) INTO draw_info
    FROM draws
    WHERE draw_type = 'daily'
      AND end_time::DATE = purchase_time::DATE
    ORDER BY end_time ASC
    LIMIT 1;
  ELSE
    -- Buscar el draw de MAÑANA
    SELECT json_build_object('id', id, 'draw_id', draw_id) INTO draw_info
    FROM draws
    WHERE draw_type = 'daily'
      AND end_time::DATE = (purchase_time + INTERVAL '1 day')::DATE
    ORDER BY end_time ASC
    LIMIT 1;
  END IF;

  RETURN draw_info;
END;
$$;

-- ============================================
-- FIX get_next_weekly_draw_id - Retornar JSON con id y draw_id
-- ============================================

CREATE OR REPLACE FUNCTION get_next_weekly_draw_info(purchase_time TIMESTAMPTZ)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  draw_info JSON;
BEGIN
  -- Obtener el próximo weekly draw
  SELECT json_build_object('id', id, 'draw_id', draw_id) INTO draw_info
  FROM draws
  WHERE draw_type = 'weekly'
    AND end_time > purchase_time
    AND executed = FALSE
  ORDER BY end_time ASC
  LIMIT 1;

  RETURN draw_info;
END;
$$;

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT 'RPC functions updated to return JSON with both id and draw_id ✅' AS message;

-- Test
SELECT get_next_daily_draw_info(NOW()) as daily_info;
SELECT get_next_weekly_draw_info(NOW()) as weekly_info;
