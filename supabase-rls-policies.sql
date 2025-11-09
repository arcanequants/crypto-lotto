-- ===========================================
-- CRITICAL FIX C-1: ROW LEVEL SECURITY (RLS)
-- ===========================================
-- Prevents unauthorized data access via Supabase anon key
-- CVSS: 9.8/10 (CRITICAL)
-- Estimated time: 4 hours
-- ===========================================

-- Enable RLS on ALL existing tables
ALTER TABLE IF EXISTS draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gas_reimbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS token_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS proposal_votes ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- POLICIES FOR: draws
-- ===========================================

-- Anyone can view executed draws (public info)
CREATE POLICY "Anyone can view executed draws"
ON draws FOR SELECT
USING (executed = true);

-- Service role can view ALL draws (backend needs this)
CREATE POLICY "Service role can view all draws"
ON draws FOR SELECT
USING (auth.role() = 'service_role');

-- Only service role can INSERT/UPDATE/DELETE draws
CREATE POLICY "Service role only can modify draws"
ON draws FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ===========================================
-- POLICIES FOR: tickets
-- ===========================================

-- Users can view own tickets only
CREATE POLICY "Users can view own tickets"
ON tickets FOR SELECT
USING (
  user_wallet = LOWER(current_setting('request.jwt.claims', true)::json->>'wallet_address')
  OR auth.role() = 'service_role'
);

-- Service role can INSERT tickets (backend creates tickets)
CREATE POLICY "Service role can insert tickets"
ON tickets FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Service role can UPDATE tickets (for claim status, prizes, etc)
CREATE POLICY "Service role can update tickets"
ON tickets FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- NO user can directly DELETE tickets
CREATE POLICY "No one can delete tickets"
ON tickets FOR DELETE
USING (false);

-- ===========================================
-- POLICIES FOR: users
-- ===========================================

-- Users can view own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (
  wallet_address = LOWER(current_setting('request.jwt.claims', true)::json->>'wallet_address')
  OR auth.role() = 'service_role'
);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (
  wallet_address = LOWER(current_setting('request.jwt.claims', true)::json->>'wallet_address')
)
WITH CHECK (
  wallet_address = LOWER(current_setting('request.jwt.claims', true)::json->>'wallet_address')
);

-- Service role can INSERT users (backend creates user records)
CREATE POLICY "Service role can insert users"
ON users FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ===========================================
-- POLICIES FOR: votes
-- ===========================================

-- Users can view own votes
CREATE POLICY "Users can view own votes"
ON votes FOR SELECT
USING (
  wallet_address = LOWER(current_setting('request.jwt.claims', true)::json->>'wallet_address')
  OR auth.role() = 'service_role'
);

-- Users can insert own votes
CREATE POLICY "Users can insert own votes"
ON votes FOR INSERT
WITH CHECK (
  wallet_address = LOWER(current_setting('request.jwt.claims', true)::json->>'wallet_address')
);

-- Service role can view/modify all votes
CREATE POLICY "Service role can modify all votes"
ON votes FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ===========================================
-- POLICIES FOR: gas_reimbursements
-- ===========================================

-- Only service role can access gas reimbursements
CREATE POLICY "Service role only can access gas_reimbursements"
ON gas_reimbursements FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ===========================================
-- POLICIES FOR: token_proposals
-- ===========================================

-- Anyone can view proposals (public governance)
CREATE POLICY "Anyone can view proposals"
ON token_proposals FOR SELECT
USING (true);

-- Only service role can create proposals
CREATE POLICY "Service role can create proposals"
ON token_proposals FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Only service role can update proposals (e.g., execute results)
CREATE POLICY "Service role can update proposals"
ON token_proposals FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ===========================================
-- POLICIES FOR: proposal_votes
-- ===========================================

-- Users can view all proposal votes (transparency)
CREATE POLICY "Anyone can view proposal votes"
ON proposal_votes FOR SELECT
USING (true);

-- Users can insert own votes
CREATE POLICY "Users can insert own proposal votes"
ON proposal_votes FOR INSERT
WITH CHECK (
  wallet_address = LOWER(current_setting('request.jwt.claims', true)::json->>'wallet_address')
);

-- Service role can view/modify all proposal votes
CREATE POLICY "Service role can modify all proposal votes"
ON proposal_votes FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ===========================================
-- ADMIN TABLES (if they exist)
-- ===========================================

-- If admins table exists, lock it down completely
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'admins') THEN
    ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

    -- Only service role can access
    CREATE POLICY "Service role only can access admins"
    ON admins FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- If admin_actions table exists, lock it down
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'admin_actions') THEN
    ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Service role only can access admin_actions"
    ON admin_actions FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- If used_nonces table exists, lock it down
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'used_nonces') THEN
    ALTER TABLE used_nonces ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Service role only can access used_nonces"
    ON used_nonces FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- ===========================================
-- WALLET ADDRESS NORMALIZATION CONSTRAINT
-- ===========================================

-- Add constraint to ensure all wallet addresses are lowercase
-- This prevents bypass via case variations (e.g., 0xABC vs 0xabc)

-- For tickets table
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS wallet_address_lowercase;
ALTER TABLE tickets
ADD CONSTRAINT wallet_address_lowercase
CHECK (user_wallet = LOWER(user_wallet));

-- For users table (if wallet_address column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'wallet_address'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS wallet_address_lowercase;
    ALTER TABLE users
    ADD CONSTRAINT wallet_address_lowercase
    CHECK (wallet_address = LOWER(wallet_address));
  END IF;
END $$;

-- For votes table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'votes' AND column_name = 'wallet_address'
  ) THEN
    ALTER TABLE votes DROP CONSTRAINT IF EXISTS wallet_address_lowercase;
    ALTER TABLE votes
    ADD CONSTRAINT wallet_address_lowercase
    CHECK (wallet_address = LOWER(wallet_address));
  END IF;
END $$;

-- For proposal_votes table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposal_votes' AND column_name = 'wallet_address'
  ) THEN
    ALTER TABLE proposal_votes DROP CONSTRAINT IF EXISTS wallet_address_lowercase;
    ALTER TABLE proposal_votes
    ADD CONSTRAINT wallet_address_lowercase
    CHECK (wallet_address = LOWER(wallet_address));
  END IF;
END $$;

-- ===========================================
-- MIGRATE EXISTING DATA TO LOWERCASE
-- ===========================================

-- Update existing records to lowercase
UPDATE tickets SET user_wallet = LOWER(user_wallet) WHERE user_wallet != LOWER(user_wallet);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'wallet_address') THEN
    UPDATE users SET wallet_address = LOWER(wallet_address) WHERE wallet_address != LOWER(wallet_address);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'votes' AND column_name = 'wallet_address') THEN
    UPDATE votes SET wallet_address = LOWER(wallet_address) WHERE wallet_address != LOWER(wallet_address);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proposal_votes' AND column_name = 'wallet_address') THEN
    UPDATE proposal_votes SET wallet_address = LOWER(wallet_address) WHERE wallet_address != LOWER(wallet_address);
  END IF;
END $$;

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================

SELECT
  'RLS enabled on ALL tables! ✅' as status,
  'Wallet addresses normalized to lowercase ✅' as normalization,
  'Execute this SQL in Supabase SQL Editor' as instructions;
