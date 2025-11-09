-- ============================================
-- MULTI-LOTTERY SYSTEM MIGRATION
-- ============================================
-- Date: November 5, 2025
-- Purpose: Add support for multiple lottery types
-- VIBECODERS: Hermano AI + Hermano Humano
--
-- This migration:
-- 1. Creates lotteries registry table
-- 2. Adds lottery_id to draws and tickets
-- 3. Migrates existing data to lottery_id = 1
-- 4. Adds necessary indexes
-- ============================================

-- ============================================
-- STEP 1: CREATE LOTTERIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS lotteries (
  lottery_id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contract_address TEXT UNIQUE NOT NULL,
  ticket_price DECIMAL(18, 6) NOT NULL,
  description TEXT,
  draw_duration TEXT NOT NULL,
  number_range TEXT NOT NULL,
  lottery_type TEXT NOT NULL CHECK (lottery_type IN ('simple', 'powerball', 'custom')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  deactivation_reason TEXT,
  total_volume DECIMAL(18, 6) DEFAULT 0,
  total_tickets INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE lotteries IS 'Registry of all lottery contracts in the multi-lottery system';

-- ============================================
-- STEP 2: ADD lottery_id TO EXISTING TABLES
-- ============================================

-- Add lottery_id to draws (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'draws' AND column_name = 'lottery_id'
  ) THEN
    ALTER TABLE draws ADD COLUMN lottery_id BIGINT;
  END IF;
END $$;

-- Add lottery_id to tickets (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'lottery_id'
  ) THEN
    ALTER TABLE tickets ADD COLUMN lottery_id BIGINT;
  END IF;
END $$;

-- ============================================
-- STEP 3: INSERT ORIGINAL LOTTERY
-- ============================================

-- Insert existing lottery as lottery_id = 1
INSERT INTO lotteries (
  lottery_id,
  name,
  contract_address,
  ticket_price,
  description,
  draw_duration,
  number_range,
  lottery_type,
  active,
  created_at
) VALUES (
  1,
  'Simple 1-10 (Original)',
  '0x5de4d58cD84738D10300a5873970b64D0FF43E3d',
  0.10,
  'Pick 1 number from 1-10. Match the winning number to win your share of the prize pool!',
  '30 minutes',
  '1-10',
  'simple',
  true,
  '2025-11-04 00:00:00+00'  -- Original deployment date
)
ON CONFLICT (lottery_id) DO NOTHING;

-- ============================================
-- STEP 4: MIGRATE EXISTING DATA
-- ============================================

-- Migrate existing draws to lottery_id = 1
UPDATE draws
SET lottery_id = 1
WHERE lottery_id IS NULL;

-- Migrate existing tickets to lottery_id = 1
UPDATE tickets
SET lottery_id = 1
WHERE lottery_id IS NULL;

-- ============================================
-- STEP 5: ADD FOREIGN KEY CONSTRAINTS
-- ============================================

-- Add foreign key from draws to lotteries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'draws_lottery_id_fkey'
  ) THEN
    ALTER TABLE draws
    ADD CONSTRAINT draws_lottery_id_fkey
    FOREIGN KEY (lottery_id) REFERENCES lotteries(lottery_id);
  END IF;
END $$;

-- Add foreign key from tickets to lotteries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tickets_lottery_id_fkey'
  ) THEN
    ALTER TABLE tickets
    ADD CONSTRAINT tickets_lottery_id_fkey
    FOREIGN KEY (lottery_id) REFERENCES lotteries(lottery_id);
  END IF;
END $$;

-- ============================================
-- STEP 6: UPDATE PRIMARY KEYS (COMPOSITE)
-- ============================================

-- Note: We keep existing primary keys but add indexes
-- Changing PKs can cause issues with existing foreign keys

-- ============================================
-- STEP 7: ADD INDEXES FOR PERFORMANCE
-- ============================================

-- Lotteries indexes
CREATE INDEX IF NOT EXISTS idx_lotteries_active ON lotteries(active);
CREATE INDEX IF NOT EXISTS idx_lotteries_contract ON lotteries(contract_address);

-- Draws indexes (lottery-specific)
CREATE INDEX IF NOT EXISTS idx_draws_lottery_id ON draws(lottery_id);
CREATE INDEX IF NOT EXISTS idx_draws_lottery_executed ON draws(lottery_id, executed);
CREATE INDEX IF NOT EXISTS idx_draws_lottery_end_time ON draws(lottery_id, end_time);
CREATE INDEX IF NOT EXISTS idx_draws_lottery_draw_id ON draws(lottery_id, draw_id);

-- Tickets indexes (lottery-specific)
CREATE INDEX IF NOT EXISTS idx_tickets_lottery_id ON tickets(lottery_id);
CREATE INDEX IF NOT EXISTS idx_tickets_lottery_draw ON tickets(lottery_id, draw_id);
CREATE INDEX IF NOT EXISTS idx_tickets_lottery_wallet ON tickets(lottery_id, wallet_address);
CREATE INDEX IF NOT EXISTS idx_tickets_lottery_status ON tickets(lottery_id, claim_status);

-- ============================================
-- STEP 8: ADD NOT NULL CONSTRAINTS
-- ============================================

-- Make lottery_id required (after migration)
ALTER TABLE draws ALTER COLUMN lottery_id SET NOT NULL;
ALTER TABLE tickets ALTER COLUMN lottery_id SET NOT NULL;

-- ============================================
-- STEP 9: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get active lotteries
CREATE OR REPLACE FUNCTION get_active_lotteries()
RETURNS TABLE (
  lottery_id BIGINT,
  name TEXT,
  contract_address TEXT,
  ticket_price DECIMAL,
  description TEXT,
  draw_duration TEXT,
  number_range TEXT,
  total_volume DECIMAL,
  total_tickets INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.lottery_id,
    l.name,
    l.contract_address,
    l.ticket_price,
    l.description,
    l.draw_duration,
    l.number_range,
    l.total_volume,
    l.total_tickets
  FROM lotteries l
  WHERE l.active = true
  ORDER BY l.lottery_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update lottery stats
CREATE OR REPLACE FUNCTION update_lottery_stats(p_lottery_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE lotteries
  SET
    total_tickets = (
      SELECT COUNT(*)
      FROM tickets
      WHERE lottery_id = p_lottery_id
    ),
    total_volume = (
      SELECT COALESCE(SUM(price_paid), 0)
      FROM tickets
      WHERE lottery_id = p_lottery_id
    ),
    last_updated = NOW()
  WHERE lottery_id = p_lottery_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get lottery stats
CREATE OR REPLACE FUNCTION get_lottery_stats(p_lottery_id BIGINT)
RETURNS TABLE (
  total_draws INTEGER,
  total_tickets INTEGER,
  total_volume DECIMAL,
  total_winners INTEGER,
  total_prizes_claimed DECIMAL,
  avg_tickets_per_draw DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT d.draw_id)::INTEGER as total_draws,
    COUNT(t.id)::INTEGER as total_tickets,
    COALESCE(SUM(t.price_paid), 0) as total_volume,
    COUNT(CASE WHEN t.claim_status = 'claimed' THEN 1 END)::INTEGER as total_winners,
    COALESCE(SUM(CASE WHEN t.claim_status = 'claimed' THEN t.prize_amount ELSE 0 END), 0) as total_prizes_claimed,
    CASE
      WHEN COUNT(DISTINCT d.draw_id) > 0
      THEN COUNT(t.id)::DECIMAL / COUNT(DISTINCT d.draw_id)
      ELSE 0
    END as avg_tickets_per_draw
  FROM draws d
  LEFT JOIN tickets t ON d.lottery_id = t.lottery_id AND d.draw_id = t.draw_id
  WHERE d.lottery_id = p_lottery_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- STEP 10: CREATE VIEWS FOR EASY QUERYING
-- ============================================

-- View: Lottery overview with stats
CREATE OR REPLACE VIEW lottery_overview AS
SELECT
  l.lottery_id,
  l.name,
  l.contract_address,
  l.ticket_price,
  l.description,
  l.active,
  l.created_at,
  COUNT(DISTINCT d.draw_id) as total_draws,
  COUNT(DISTINCT t.id) as total_tickets,
  COALESCE(SUM(d.prize_pool), 0) as total_prize_pool,
  COUNT(DISTINCT t.wallet_address) as unique_players
FROM lotteries l
LEFT JOIN draws d ON l.lottery_id = d.lottery_id
LEFT JOIN tickets t ON d.lottery_id = t.lottery_id AND d.draw_id = t.draw_id
GROUP BY l.lottery_id, l.name, l.contract_address, l.ticket_price, l.description, l.active, l.created_at;

-- View: Current active draws per lottery
CREATE OR REPLACE VIEW current_draws AS
SELECT
  l.lottery_id,
  l.name as lottery_name,
  l.contract_address,
  d.draw_id,
  d.end_time,
  d.executed,
  d.prize_pool,
  d.total_tickets,
  CASE
    WHEN d.executed THEN 'completed'
    WHEN d.end_time < NOW() THEN 'pending_execution'
    ELSE 'active'
  END as draw_status
FROM lotteries l
INNER JOIN draws d ON l.lottery_id = d.lottery_id
WHERE l.active = true
  AND (
    (NOT d.executed AND d.end_time > NOW() - INTERVAL '7 days')
    OR (d.executed AND d.end_time > NOW() - INTERVAL '24 hours')
  )
ORDER BY l.lottery_id, d.draw_id DESC;

-- ============================================
-- STEP 11: ADD RLS POLICIES (if not exists)
-- ============================================

-- Enable RLS on lotteries table
ALTER TABLE lotteries ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active lotteries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lotteries' AND policyname = 'Anyone can view active lotteries'
  ) THEN
    CREATE POLICY "Anyone can view active lotteries"
    ON lotteries FOR SELECT
    TO public
    USING (active = true);
  END IF;
END $$;

-- ============================================
-- STEP 12: VERIFY MIGRATION
-- ============================================

DO $$
DECLARE
  lottery_count INTEGER;
  draw_count INTEGER;
  ticket_count INTEGER;
BEGIN
  -- Count lotteries
  SELECT COUNT(*) INTO lottery_count FROM lotteries WHERE lottery_id = 1;

  -- Count draws with lottery_id = 1
  SELECT COUNT(*) INTO draw_count FROM draws WHERE lottery_id = 1;

  -- Count tickets with lottery_id = 1
  SELECT COUNT(*) INTO ticket_count FROM tickets WHERE lottery_id = 1;

  -- Output verification
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION VERIFICATION';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Lotteries registered: %', lottery_count;
  RAISE NOTICE 'Draws migrated: %', draw_count;
  RAISE NOTICE 'Tickets migrated: %', ticket_count;
  RAISE NOTICE '============================================';

  IF lottery_count = 0 THEN
    RAISE EXCEPTION 'MIGRATION FAILED: No lottery registered';
  END IF;

  IF draw_count > 0 AND NOT EXISTS (SELECT 1 FROM draws WHERE lottery_id IS NULL) THEN
    RAISE NOTICE '✅ All draws have lottery_id';
  END IF;

  IF ticket_count > 0 AND NOT EXISTS (SELECT 1 FROM tickets WHERE lottery_id IS NULL) THEN
    RAISE NOTICE '✅ All tickets have lottery_id';
  END IF;

  RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '============================================';
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT
  '✅ Multi-Lottery Migration Complete!' as status,
  COUNT(*) as active_lotteries,
  (SELECT COUNT(*) FROM draws WHERE lottery_id = 1) as migrated_draws,
  (SELECT COUNT(*) FROM tickets WHERE lottery_id = 1) as migrated_tickets
FROM lotteries
WHERE active = true;

-- ============================================
-- NEXT STEPS
-- ============================================

/*
NEXT STEPS:

1. Run this migration in Supabase SQL Editor
2. Verify all data migrated correctly
3. Update backend APIs to use lottery_id
4. Update frontend to read from lotteries table
5. Deploy new lottery contracts
6. Register new lotteries in this table

Example: Register new lottery
INSERT INTO lotteries (
  name, contract_address, ticket_price,
  description, draw_duration, number_range, lottery_type
) VALUES (
  'Powerball 5+1',
  '0x...',
  2.00,
  'Pick 5 numbers + powerball',
  '24 hours',
  '5+1 (1-69, 1-26)',
  'powerball'
);
*/
