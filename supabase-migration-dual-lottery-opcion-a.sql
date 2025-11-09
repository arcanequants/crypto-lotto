-- MIGRACIÓN: DUAL LOTTERY SYSTEM (OPCIÓN A)
-- Fecha: 2025-10-23
-- Cambios: Agregar soporte para Daily + Weekly con ticket lifecycle

-- ============================================
-- PASO 1: Modificar tabla DRAWS
-- ============================================

-- Agregar columnas para dual lottery
ALTER TABLE draws
  ADD COLUMN IF NOT EXISTS draw_type TEXT CHECK (draw_type IN ('daily', 'weekly')),
  ADD COLUMN IF NOT EXISTS rollover_tier_5_1 DECIMAL(18, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rollover_tier_5_0 DECIMAL(18, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rollover_tier_4_1 DECIMAL(18, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS month_token TEXT DEFAULT 'MATIC',
  ADD COLUMN IF NOT EXISTS cbbtc_amount DECIMAL(18, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weth_amount DECIMAL(18, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS platform_fee_collected DECIMAL(18, 8) DEFAULT 0;

-- Actualizar draws existentes como 'weekly' por defecto
UPDATE draws SET draw_type = 'weekly' WHERE draw_type IS NULL;

-- Hacer draw_type NOT NULL después de setear defaults
ALTER TABLE draws ALTER COLUMN draw_type SET NOT NULL;

-- ============================================
-- PASO 2: Modificar tabla TICKETS
-- ============================================

-- Agregar columnas para dual lottery lifecycle
ALTER TABLE tickets
  -- Draw assignment
  ADD COLUMN IF NOT EXISTS assigned_daily_draw_id INTEGER REFERENCES draws(id),
  ADD COLUMN IF NOT EXISTS assigned_weekly_draw_id INTEGER REFERENCES draws(id),

  -- Daily lottery results
  ADD COLUMN IF NOT EXISTS daily_processed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS daily_winner BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS daily_tier TEXT,
  ADD COLUMN IF NOT EXISTS daily_prize_amount DECIMAL(18, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_claimed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS daily_claimed_at TIMESTAMPTZ,

  -- Weekly lottery results
  ADD COLUMN IF NOT EXISTS weekly_processed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS weekly_winner BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS weekly_tier TEXT,
  ADD COLUMN IF NOT EXISTS weekly_prize_amount DECIMAL(18, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weekly_claimed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS weekly_claimed_at TIMESTAMPTZ;

-- ============================================
-- PASO 3: Crear índices para performance
-- ============================================

-- Índices para daily/weekly filtering
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_daily ON tickets(assigned_daily_draw_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_weekly ON tickets(assigned_weekly_draw_id);
CREATE INDEX IF NOT EXISTS idx_tickets_daily_processed ON tickets(daily_processed);
CREATE INDEX IF NOT EXISTS idx_tickets_weekly_processed ON tickets(weekly_processed);
CREATE INDEX IF NOT EXISTS idx_tickets_daily_winner ON tickets(daily_winner);
CREATE INDEX IF NOT EXISTS idx_tickets_weekly_winner ON tickets(weekly_winner);
CREATE INDEX IF NOT EXISTS idx_draws_type ON draws(draw_type);

-- ============================================
-- PASO 4: Crear función helper para asignar draws
-- ============================================

CREATE OR REPLACE FUNCTION get_next_daily_draw_id(purchase_time TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  today_draw_time TIMESTAMPTZ;
  today_draw_id INTEGER;
  tomorrow_draw_id INTEGER;
BEGIN
  -- Obtener el draw de hoy a las 8 PM
  today_draw_time := DATE_TRUNC('day', purchase_time) + INTERVAL '20 hours';

  -- Si la compra es ANTES de las 8 PM de hoy
  IF purchase_time < today_draw_time THEN
    -- Buscar el draw de HOY
    SELECT id INTO today_draw_id
    FROM draws
    WHERE draw_type = 'daily'
      AND end_time::DATE = purchase_time::DATE
    ORDER BY end_time ASC
    LIMIT 1;

    RETURN COALESCE(today_draw_id, NULL);
  ELSE
    -- Buscar el draw de MAÑANA
    SELECT id INTO tomorrow_draw_id
    FROM draws
    WHERE draw_type = 'daily'
      AND end_time::DATE = (purchase_time + INTERVAL '1 day')::DATE
    ORDER BY end_time ASC
    LIMIT 1;

    RETURN COALESCE(tomorrow_draw_id, NULL);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_next_weekly_draw_id(purchase_time TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_weekly_id INTEGER;
BEGIN
  -- Obtener el próximo weekly draw (próximo domingo 8 PM)
  SELECT id INTO next_weekly_id
  FROM draws
  WHERE draw_type = 'weekly'
    AND end_time > purchase_time
    AND executed = FALSE
  ORDER BY end_time ASC
  LIMIT 1;

  RETURN COALESCE(next_weekly_id, NULL);
END;
$$;

-- ============================================
-- PASO 5: Crear draws iniciales (daily + weekly)
-- ============================================

-- Crear próximos 7 daily draws (próximos 7 días a las 8 PM)
INSERT INTO draws (draw_id, draw_type, end_time, executed, total_tickets, prize_pool, month_token)
SELECT
  1000 + n,
  'daily',
  DATE_TRUNC('day', NOW() + (n || ' days')::INTERVAL) + INTERVAL '20 hours',
  FALSE,
  0,
  0,
  'MATIC'
FROM generate_series(0, 6) AS n
ON CONFLICT (draw_id) DO NOTHING;

-- Crear próximos 4 weekly draws (próximos 4 domingos a las 8 PM)
INSERT INTO draws (draw_id, draw_type, end_time, executed, total_tickets, prize_pool, month_token)
SELECT
  2000 + n,
  'weekly',
  DATE_TRUNC('week', NOW() + (n || ' weeks')::INTERVAL) + INTERVAL '6 days' + INTERVAL '20 hours',
  FALSE,
  0,
  0,
  'MATIC'
FROM generate_series(0, 3) AS n
ON CONFLICT (draw_id) DO NOTHING;

-- ============================================
-- PASO 6: Crear función RPC para actualizar prize pools DUAL
-- ============================================

CREATE OR REPLACE FUNCTION update_dual_draw_prize_pools(
  p_daily_draw_id INTEGER,
  p_weekly_draw_id INTEGER,
  p_ticket_price DECIMAL,
  p_platform_fee_percent DECIMAL,  -- 25
  p_daily_percent DECIMAL,          -- 20
  p_weekly_percent DECIMAL,         -- 80
  p_btc_percent DECIMAL,            -- 70
  p_eth_percent DECIMAL,            -- 25
  p_token_percent DECIMAL,          -- 5
  p_btc_price DECIMAL,
  p_eth_price DECIMAL,
  p_token_price DECIMAL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  platform_fee DECIMAL;
  prize_pool_amount DECIMAL;
  daily_amount DECIMAL;
  weekly_amount DECIMAL;

  daily_btc DECIMAL;
  daily_eth DECIMAL;
  daily_token DECIMAL;

  weekly_btc DECIMAL;
  weekly_eth DECIMAL;
  weekly_token DECIMAL;
BEGIN
  -- Calcular platform fee y prize pool
  platform_fee := p_ticket_price * (p_platform_fee_percent / 100);
  prize_pool_amount := p_ticket_price - platform_fee;

  -- Dividir entre daily y weekly
  daily_amount := prize_pool_amount * (p_daily_percent / 100);
  weekly_amount := prize_pool_amount * (p_weekly_percent / 100);

  -- DAILY POOL: Dividir entre BTC/ETH/Token
  daily_btc := (daily_amount * (p_btc_percent / 100)) / p_btc_price;
  daily_eth := (daily_amount * (p_eth_percent / 100)) / p_eth_price;
  daily_token := (daily_amount * (p_token_percent / 100)) / p_token_price;

  -- WEEKLY POOL: Dividir entre BTC/ETH/Token
  weekly_btc := (weekly_amount * (p_btc_percent / 100)) / p_btc_price;
  weekly_eth := (weekly_amount * (p_eth_percent / 100)) / p_eth_price;
  weekly_token := (weekly_amount * (p_token_percent / 100)) / p_token_price;

  -- Actualizar DAILY draw
  UPDATE draws
  SET
    cbbtc_amount = cbbtc_amount + daily_btc,
    weth_amount = weth_amount + daily_eth,
    token_amount = token_amount + daily_token,
    total_tickets = total_tickets + 1,
    prize_pool = prize_pool + daily_amount,
    total_prize_usd = total_prize_usd + daily_amount
  WHERE id = p_daily_draw_id;

  -- Actualizar WEEKLY draw
  UPDATE draws
  SET
    cbbtc_amount = cbbtc_amount + weekly_btc,
    weth_amount = weth_amount + weekly_eth,
    token_amount = token_amount + weekly_token,
    total_tickets = total_tickets + 1,
    prize_pool = prize_pool + weekly_amount,
    total_prize_usd = total_prize_usd + weekly_amount
  WHERE id = p_weekly_draw_id;

  -- Acumular platform fee (podemos crear tabla separada después)
  -- Por ahora solo lo sumamos al weekly draw para tracking
  UPDATE draws
  SET platform_fee_collected = platform_fee_collected + platform_fee
  WHERE id = p_weekly_draw_id;

  -- Return summary
  RETURN json_build_object(
    'platform_fee', platform_fee,
    'daily_pool', daily_amount,
    'weekly_pool', weekly_amount,
    'daily_btc', daily_btc,
    'daily_eth', daily_eth,
    'daily_token', daily_token,
    'weekly_btc', weekly_btc,
    'weekly_eth', weekly_eth,
    'weekly_token', weekly_token
  );
END;
$$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT 'Dual Lottery Migration completed successfully! ✅' AS message;
SELECT 'Created 7 daily draws and 4 weekly draws' AS info;
SELECT 'Added draw assignment functions: get_next_daily_draw_id(), get_next_weekly_draw_id()' AS functions;
SELECT 'Added dual prize pool update function: update_dual_draw_prize_pools()' AS rpc;
