-- ====================================================================
-- MIGRACIÓN: LIVE PRIZE POOLS
-- Fecha: 20 Oct 2025
-- Descripción: Agrega soporte para prize pools en tiempo real con
--              composición de crypto (BTC, ETH, Token del Mes)
-- ====================================================================

-- 1. Agregar columna 'status' a la tabla draws (si no existe)
-- Valores: 'open', 'pending', 'drawn', 'completed'
ALTER TABLE draws ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
CREATE INDEX IF NOT EXISTS idx_draws_status ON draws(status);

-- 2. Agregar campos de crypto amounts a la tabla draws
ALTER TABLE draws ADD COLUMN IF NOT EXISTS wbtc_amount DECIMAL(18, 8) DEFAULT 0;
ALTER TABLE draws ADD COLUMN IF NOT EXISTS eth_amount DECIMAL(18, 8) DEFAULT 0;
ALTER TABLE draws ADD COLUMN IF NOT EXISTS token_amount DECIMAL(18, 8) DEFAULT 0;
ALTER TABLE draws ADD COLUMN IF NOT EXISTS token_symbol TEXT DEFAULT 'SOL';
ALTER TABLE draws ADD COLUMN IF NOT EXISTS total_prize_usd DECIMAL(18, 2) DEFAULT 0;

-- Agregar comentarios para documentar
COMMENT ON COLUMN draws.status IS 'Estado del draw: open (activo), pending (esperando ejecución), drawn (ejecutado), completed (completado y premios distribuidos)';
COMMENT ON COLUMN draws.wbtc_amount IS 'Cantidad de Wrapped BTC en el prize pool (70% del total)';
COMMENT ON COLUMN draws.eth_amount IS 'Cantidad de ETH en el prize pool (25% del total)';
COMMENT ON COLUMN draws.token_amount IS 'Cantidad del Token del Mes en el prize pool (5% del total)';
COMMENT ON COLUMN draws.token_symbol IS 'Símbolo del token del mes (ej: SOL, AVAX, MATIC)';
COMMENT ON COLUMN draws.total_prize_usd IS 'Valor total del prize pool en USD (calculado)';

-- 3. Agregar campo draw_type para diferenciar Daily vs Weekly
ALTER TABLE draws ADD COLUMN IF NOT EXISTS draw_type TEXT DEFAULT 'weekly';
CREATE INDEX IF NOT EXISTS idx_draws_type ON draws(draw_type);

COMMENT ON COLUMN draws.draw_type IS 'Tipo de sorteo: daily (diario) o weekly (semanal)';

-- 4. Crear tabla prize_pool_snapshots para histórico
CREATE TABLE IF NOT EXISTS prize_pool_snapshots (
  id BIGSERIAL PRIMARY KEY,
  draw_type TEXT NOT NULL CHECK (draw_type IN ('daily', 'weekly')),

  -- Totales
  total_usd DECIMAL(18, 2) NOT NULL,

  -- Crypto amounts
  wbtc_amount DECIMAL(18, 8) NOT NULL,
  eth_amount DECIMAL(18, 8) NOT NULL,
  token_of_month_amount DECIMAL(18, 8) NOT NULL,
  token_of_month_symbol TEXT NOT NULL DEFAULT 'SOL',

  -- Precios al momento del snapshot
  btc_price_usd DECIMAL(18, 2) NOT NULL,
  eth_price_usd DECIMAL(18, 2) NOT NULL,
  token_price_usd DECIMAL(18, 2) NOT NULL,

  -- Metadata
  total_tickets INTEGER NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_snapshots_draw_type ON prize_pool_snapshots(draw_type);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON prize_pool_snapshots(snapshot_at DESC);

-- Comentario para documentar
COMMENT ON TABLE prize_pool_snapshots IS
'Snapshots hourly del prize pool para mostrar crecimiento histórico y valores en tiempo real';

-- 5. Actualizar el draw existente con valores de prueba
-- Esto es para testing - en producción vendrán de las compras reales
UPDATE draws
SET
  status = 'open',
  draw_type = 'weekly',
  wbtc_amount = 0.35,      -- ~$23,500 @ $67,000/BTC
  eth_amount = 2.8,         -- ~$8,000 @ $2,850/ETH
  token_amount = 850,       -- ~$151,000 @ $178/SOL
  token_symbol = 'SOL',
  total_prize_usd = 182500.00
WHERE draw_id = 1;

-- 6. Insertar un draw DAILY para testing
INSERT INTO draws (
  draw_id,
  end_time,
  executed,
  status,
  draw_type,
  wbtc_amount,
  eth_amount,
  token_amount,
  token_symbol,
  total_tickets,
  prize_pool
)
VALUES (
  2,
  NOW() + INTERVAL '1 day',
  FALSE,
  'open',
  'daily',
  0.05,         -- ~$3,350 @ $67,000/BTC
  0.5,          -- ~$1,425 @ $2,850/ETH
  100,          -- ~$17,800 @ $178/SOL
  'SOL',
  1250,
  0.25 * 1250
)
ON CONFLICT (draw_id) DO NOTHING;

-- 7. Insertar snapshot de prueba
INSERT INTO prize_pool_snapshots (
  draw_type,
  total_usd,
  wbtc_amount,
  eth_amount,
  token_of_month_amount,
  token_of_month_symbol,
  btc_price_usd,
  eth_price_usd,
  token_price_usd,
  total_tickets
)
VALUES
  (
    'weekly',
    182500.00,
    0.35,
    2.8,
    850,
    'SOL',
    67000.00,
    2850.00,
    178.00,
    45200
  ),
  (
    'daily',
    22575.00,
    0.05,
    0.5,
    100,
    'SOL',
    67000.00,
    2850.00,
    178.00,
    1250
  );

-- ====================================================================
-- VERIFICACIÓN
-- ====================================================================

-- Verificar estructura de draws
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'draws'
ORDER BY ordinal_position;

-- Verificar draws de prueba
SELECT
  draw_id,
  draw_type,
  status,
  wbtc_amount,
  eth_amount,
  token_amount,
  token_symbol,
  total_prize_usd,
  end_time
FROM draws
ORDER BY draw_id;

-- Verificar snapshots
SELECT
  id,
  draw_type,
  total_usd,
  wbtc_amount,
  eth_amount,
  token_of_month_amount,
  snapshot_at
FROM prize_pool_snapshots
ORDER BY snapshot_at DESC;

-- Success message
SELECT '✅ Live Prize Pools migration completed successfully!' AS message;
SELECT '📊 Created prize_pool_snapshots table' AS message;
SELECT '💎 Added crypto amount fields to draws table' AS message;
SELECT '🎯 Inserted test data for daily and weekly draws' AS message;
