-- FIX: Actualizar funciones RPC para que retornen draw_id en lugar de id
-- El problema: tickets.draw_id hace FK a draws.draw_id, NO a draws.id

-- ============================================
-- FIX get_next_daily_draw_id - Retornar draw_id
-- ============================================

CREATE OR REPLACE FUNCTION get_next_daily_draw_id(purchase_time TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  today_draw_time TIMESTAMPTZ;
  today_draw_id_value INTEGER;
  tomorrow_draw_id_value INTEGER;
BEGIN
  -- Obtener el draw de hoy a las 2 AM UTC
  today_draw_time := DATE_TRUNC('day', purchase_time) + INTERVAL '2 hours';

  -- Si la compra es ANTES de las 2 AM de hoy
  IF purchase_time < today_draw_time THEN
    -- Buscar el draw_id de HOY (retornar draw_id, NO id)
    SELECT draw_id INTO today_draw_id_value
    FROM draws
    WHERE draw_type = 'daily'
      AND end_time::DATE = purchase_time::DATE
    ORDER BY end_time ASC
    LIMIT 1;

    RETURN COALESCE(today_draw_id_value, NULL);
  ELSE
    -- Buscar el draw_id de MAÑANA (retornar draw_id, NO id)
    SELECT draw_id INTO tomorrow_draw_id_value
    FROM draws
    WHERE draw_type = 'daily'
      AND end_time::DATE = (purchase_time + INTERVAL '1 day')::DATE
    ORDER BY end_time ASC
    LIMIT 1;

    RETURN COALESCE(tomorrow_draw_id_value, NULL);
  END IF;
END;
$$;

-- ============================================
-- FIX get_next_weekly_draw_id - Retornar draw_id
-- ============================================

CREATE OR REPLACE FUNCTION get_next_weekly_draw_id(purchase_time TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_weekly_id_value INTEGER;
BEGIN
  -- Obtener el próximo weekly draw_id (retornar draw_id, NO id)
  SELECT draw_id INTO next_weekly_id_value
  FROM draws
  WHERE draw_type = 'weekly'
    AND end_time > purchase_time
    AND executed = FALSE
  ORDER BY end_time ASC
  LIMIT 1;

  RETURN COALESCE(next_weekly_id_value, NULL);
END;
$$;

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT 'RPC functions fixed to return draw_id instead of id ✅' AS message;
