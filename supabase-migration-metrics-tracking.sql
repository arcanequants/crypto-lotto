-- ============================================
-- MIGRATION: METRICS TRACKING SYSTEM
-- Purpose: Enable historical tracking for dashboard real data
-- Created: 2025-11-14
-- ============================================

-- ============================================
-- 1. DAILY METRICS - Historical tracking
-- ============================================
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,

  -- Revenue metrics
  revenue_usdc NUMERIC(20, 6) NOT NULL DEFAULT 0,
  hourly_vault_usdc NUMERIC(20, 6) NOT NULL DEFAULT 0,
  daily_vault_usdc NUMERIC(20, 6) NOT NULL DEFAULT 0,
  platform_fee_usdc NUMERIC(20, 6) NOT NULL DEFAULT 0,

  -- User metrics
  new_users INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  total_users INTEGER NOT NULL DEFAULT 0,

  -- Draw metrics
  tickets_sold INTEGER NOT NULL DEFAULT 0,
  hourly_draws_executed INTEGER NOT NULL DEFAULT 0,
  daily_draws_executed INTEGER NOT NULL DEFAULT 0,
  draws_failed INTEGER NOT NULL DEFAULT 0,

  -- Winners & prizes
  winners_count INTEGER NOT NULL DEFAULT 0,
  prizes_claimed_usdc NUMERIC(20, 6) NOT NULL DEFAULT 0,
  prizes_pending_usdc NUMERIC(20, 6) NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_daily_metrics_date ON daily_metrics(date DESC);

-- ============================================
-- 2. PRODUCTS - Platform product catalog
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('live', 'coming_soon', 'deprecated')),
  description TEXT,
  launch_date TIMESTAMP,
  icon TEXT,
  order_index INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial products
INSERT INTO products (name, slug, status, description, launch_date, order_index) VALUES
  ('Dual Lottery', 'dual-lottery', 'live', 'Hourly + Daily draws with crypto prizes', NOW(), 1),
  ('Coin Flip', 'coin-flip', 'coming_soon', 'Instant 50/50 betting game', NULL, 2),
  ('Dice Game', 'dice-game', 'coming_soon', 'Roll the dice, win crypto', NULL, 3),
  ('Tournaments', 'tournaments', 'coming_soon', 'Weekly championships with big prizes', NULL, 4),
  ('NFT Marketplace', 'nft-marketplace', 'coming_soon', '5% fee on NFT trades', NULL, 5),
  ('Premium Subscriptions', 'premium', 'coming_soon', 'Monthly recurring revenue', NULL, 6),
  ('White Label', 'white-label', 'coming_soon', 'License the platform to others', NULL, 7),
  ('API Access', 'api', 'coming_soon', 'Developer API for integrations', NULL, 8),
  ('Ad Revenue', 'ads', 'coming_soon', 'Display ads on platform', NULL, 9),
  ('Token Launch', 'token', 'coming_soon', 'Platform token with utility', NULL, 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 3. PRODUCT METRICS - Per-product tracking
-- ============================================
CREATE TABLE IF NOT EXISTS product_metrics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Usage metrics
  daily_users INTEGER NOT NULL DEFAULT 0,
  transactions INTEGER NOT NULL DEFAULT 0,

  -- Revenue metrics
  revenue_usdc NUMERIC(20, 6) NOT NULL DEFAULT 0,
  costs_usdc NUMERIC(20, 6) NOT NULL DEFAULT 0,
  margin_usdc NUMERIC(20, 6) NOT NULL DEFAULT 0,
  margin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(product_id, date)
);

CREATE INDEX idx_product_metrics_product_date ON product_metrics_daily(product_id, date DESC);
CREATE INDEX idx_product_metrics_date ON product_metrics_daily(date DESC);

-- ============================================
-- 4. CRON EXECUTIONS - Monitor automation
-- ============================================
CREATE TABLE IF NOT EXISTS cron_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name TEXT NOT NULL,
  execution_time TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'timeout', 'skipped')),
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cron_executions_job_name ON cron_executions(job_name, execution_time DESC);
CREATE INDEX idx_cron_executions_status ON cron_executions(status);
CREATE INDEX idx_cron_executions_time ON cron_executions(execution_time DESC);

-- ============================================
-- 5. EVENT LOG - System alerts & events
-- ============================================
CREATE TABLE IF NOT EXISTS event_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,

  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_event_log_created_at ON event_log(created_at DESC);
CREATE INDEX idx_event_log_severity ON event_log(severity);
CREATE INDEX idx_event_log_resolved ON event_log(resolved);
CREATE INDEX idx_event_log_category ON event_log(category);

-- ============================================
-- 6. USER ACTIVITY LOG - Retention tracking
-- ============================================
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_activity_log_user_id ON user_activity_log(user_id, created_at DESC);
CREATE INDEX idx_user_activity_log_created_at ON user_activity_log(created_at DESC);
CREATE INDEX idx_user_activity_log_type ON user_activity_log(activity_type);

-- ============================================
-- 7. USER GEOLOCATIONS - Geographic tracking
-- ============================================
CREATE TABLE IF NOT EXISTS user_geolocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  country TEXT,
  country_code TEXT,
  region TEXT,
  city TEXT,
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  timezone TEXT,

  ip_address TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_geolocations_country ON user_geolocations(country);
CREATE INDEX idx_user_geolocations_region ON user_geolocations(region);
CREATE INDEX idx_user_geolocations_country_code ON user_geolocations(country_code);

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function to calculate MoM growth
CREATE OR REPLACE FUNCTION calculate_mom_growth(
  metric_name TEXT,
  current_value NUMERIC,
  previous_value NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  IF previous_value = 0 THEN
    RETURN 100; -- Infinite growth, return 100%
  END IF;

  RETURN ROUND(((current_value - previous_value) / previous_value) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get last month's metrics
CREATE OR REPLACE FUNCTION get_last_month_metric(
  metric_column TEXT
) RETURNS NUMERIC AS $$
DECLARE
  last_month_date DATE;
  result NUMERIC;
BEGIN
  last_month_date := (CURRENT_DATE - INTERVAL '1 month')::DATE;

  EXECUTE format('SELECT %I FROM daily_metrics WHERE date = $1', metric_column)
  INTO result
  USING last_month_date;

  RETURN COALESCE(result, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_metrics_updated_at
  BEFORE UPDATE ON daily_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_metrics_updated_at
  BEFORE UPDATE ON product_metrics_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_geolocations_updated_at
  BEFORE UPDATE ON user_geolocations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Metrics tracking system installed successfully!';
  RAISE NOTICE '   - 7 tables created';
  RAISE NOTICE '   - 10 products seeded';
  RAISE NOTICE '   - Helper functions installed';
  RAISE NOTICE '   - Triggers configured';
END $$;
