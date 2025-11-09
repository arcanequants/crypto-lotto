-- =====================================================
-- CRITICAL SECURITY TABLES
-- =====================================================
-- Tables needed for security fixes:
-- 1. admins - Admin authentication registry
-- 2. admin_actions - Audit trail for admin actions
-- 3. used_nonces - Nonce tracking for replay protection
-- =====================================================

-- =====================================================
-- TABLE: admins
-- =====================================================
-- Stores list of authorized admin wallets
-- Used by: /lib/auth/admin.ts

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL UNIQUE CHECK (wallet_address = LOWER(wallet_address)),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'moderator')),
  permissions JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES admins(id),
  notes TEXT
);

-- Indexes for admins table
CREATE INDEX IF NOT EXISTS idx_admins_wallet ON admins(wallet_address);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- Enable RLS on admins table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admins
CREATE POLICY "Admins view all admins"
ON admins FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    AND active = true
  )
);

CREATE POLICY "Only owners can modify admins"
ON admins FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    AND role = 'owner'
    AND active = true
  )
);

-- Service role has full access (bypass RLS)
CREATE POLICY "Service role full access to admins"
ON admins FOR ALL
USING (auth.role() = 'service_role');

-- Insert default owner (TESTING WALLET - Replace when deploying to mainnet)
INSERT INTO admins (wallet_address, role, permissions, notes)
VALUES (
  '0x26f4cb52656d16eb3781f0f50cc4b88f85351a7f',  -- ✅ TESTING WALLET
  'owner',
  '{
    "can_execute_draws": true,
    "can_mark_expired": true,
    "can_manage_admins": true,
    "can_emergency_withdraw": true,
    "can_update_params": true
  }'::jsonb,
  'Testing owner account - created 2025-11-01 for development'
)
ON CONFLICT (wallet_address) DO NOTHING;

-- =====================================================
-- TABLE: admin_actions
-- =====================================================
-- Audit trail for all admin actions
-- Used by: /lib/auth/admin.ts -> logAdminAction()

CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_wallet TEXT NOT NULL CHECK (admin_wallet = LOWER(admin_wallet)),
  action TEXT NOT NULL,
  endpoint TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for admin_actions
CREATE INDEX IF NOT EXISTS idx_admin_actions_wallet ON admin_actions(admin_wallet);
CREATE INDEX IF NOT EXISTS idx_admin_actions_timestamp ON admin_actions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action ON admin_actions(action);
CREATE INDEX IF NOT EXISTS idx_admin_actions_success ON admin_actions(success);

-- Enable RLS on admin_actions
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_actions
CREATE POLICY "Admins view all actions"
ON admin_actions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    AND active = true
  )
);

CREATE POLICY "Service role full access to admin_actions"
ON admin_actions FOR ALL
USING (auth.role() = 'service_role');

-- Function to log admin actions (called from backend)
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_wallet TEXT,
  p_action TEXT,
  p_endpoint TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_action_id UUID;
BEGIN
  INSERT INTO admin_actions (
    admin_wallet,
    action,
    endpoint,
    details,
    ip_address,
    user_agent,
    success,
    error_message,
    timestamp
  ) VALUES (
    LOWER(p_admin_wallet),
    p_action,
    p_endpoint,
    p_details,
    p_ip_address,
    p_user_agent,
    p_success,
    p_error_message,
    NOW()
  )
  RETURNING id INTO v_action_id;

  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TABLE: used_nonces
-- =====================================================
-- Tracks used nonces to prevent replay attacks
-- Used by: /app/api/withdraw/gasless/route.ts

CREATE TABLE IF NOT EXISTS used_nonces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL CHECK (wallet_address = LOWER(wallet_address)),
  nonce BIGINT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tx_hash TEXT,
  action_type TEXT NOT NULL DEFAULT 'withdrawal',
  UNIQUE(wallet_address, nonce, action_type)
);

-- Indexes for used_nonces
CREATE INDEX IF NOT EXISTS idx_used_nonces_wallet ON used_nonces(wallet_address);
CREATE INDEX IF NOT EXISTS idx_used_nonces_lookup ON used_nonces(wallet_address, nonce);
CREATE INDEX IF NOT EXISTS idx_used_nonces_timestamp ON used_nonces(used_at DESC);

-- Enable RLS on used_nonces
ALTER TABLE used_nonces ENABLE ROW LEVEL SECURITY;

-- RLS Policies for used_nonces
CREATE POLICY "Service role full access to used_nonces"
ON used_nonces FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Users view own nonces"
ON used_nonces FOR SELECT
USING (
  wallet_address = LOWER(current_setting('request.jwt.claims', true)::json->>'wallet_address')
);

-- Function to check and mark nonce as used (atomic operation)
CREATE OR REPLACE FUNCTION check_and_use_nonce(
  p_wallet_address TEXT,
  p_nonce BIGINT,
  p_action_type TEXT DEFAULT 'withdrawal'
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if nonce already used (with lock to prevent race conditions)
  SELECT EXISTS (
    SELECT 1 FROM used_nonces
    WHERE wallet_address = LOWER(p_wallet_address)
    AND nonce = p_nonce
    AND action_type = p_action_type
    FOR UPDATE
  ) INTO v_exists;

  IF v_exists THEN
    -- Nonce already used
    RETURN FALSE;
  END IF;

  -- Mark nonce as used
  INSERT INTO used_nonces (wallet_address, nonce, action_type, used_at)
  VALUES (LOWER(p_wallet_address), p_nonce, p_action_type, NOW());

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update tx_hash after transaction confirms
CREATE OR REPLACE FUNCTION update_nonce_tx_hash(
  p_wallet_address TEXT,
  p_nonce BIGINT,
  p_tx_hash TEXT,
  p_action_type TEXT DEFAULT 'withdrawal'
) RETURNS VOID AS $$
BEGIN
  UPDATE used_nonces
  SET tx_hash = p_tx_hash
  WHERE wallet_address = LOWER(p_wallet_address)
  AND nonce = p_nonce
  AND action_type = p_action_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old nonces (run daily via CRON)
-- Keeps last 30 days for audit purposes
CREATE OR REPLACE FUNCTION cleanup_old_nonces() RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM used_nonces
  WHERE used_at < NOW() - INTERVAL '30 days'
  RETURNING COUNT(*) INTO v_deleted_count;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Get admin permissions
CREATE OR REPLACE FUNCTION get_admin_permissions(p_wallet_address TEXT)
RETURNS JSONB AS $$
DECLARE
  v_permissions JSONB;
BEGIN
  SELECT permissions INTO v_permissions
  FROM admins
  WHERE wallet_address = LOWER(p_wallet_address)
  AND active = true;

  RETURN COALESCE(v_permissions, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if address is admin
CREATE OR REPLACE FUNCTION is_admin(p_wallet_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE wallet_address = LOWER(p_wallet_address)
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if address is owner
CREATE OR REPLACE FUNCTION is_owner(p_wallet_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE wallet_address = LOWER(p_wallet_address)
    AND role = 'owner'
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_use_nonce TO authenticated;
GRANT EXECUTE ON FUNCTION update_nonce_tx_hash TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_owner TO authenticated;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION log_admin_action TO service_role;
GRANT EXECUTE ON FUNCTION check_and_use_nonce TO service_role;
GRANT EXECUTE ON FUNCTION update_nonce_tx_hash TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_nonces TO service_role;
GRANT EXECUTE ON FUNCTION get_admin_permissions TO service_role;
GRANT EXECUTE ON FUNCTION is_admin TO service_role;
GRANT EXECUTE ON FUNCTION is_owner TO service_role;

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE admins IS 'Registry of authorized admin wallets with role-based permissions';
COMMENT ON TABLE admin_actions IS 'Audit trail for all administrative actions';
COMMENT ON TABLE used_nonces IS 'Tracks used nonces to prevent signature replay attacks';

COMMENT ON FUNCTION log_admin_action IS 'Logs admin action to audit trail with full context';
COMMENT ON FUNCTION check_and_use_nonce IS 'Atomically checks if nonce is unused and marks it as used';
COMMENT ON FUNCTION update_nonce_tx_hash IS 'Updates nonce record with confirmed transaction hash';
COMMENT ON FUNCTION cleanup_old_nonces IS 'Deletes nonce records older than 30 days';
COMMENT ON FUNCTION get_admin_permissions IS 'Returns permissions JSON for admin wallet';
COMMENT ON FUNCTION is_admin IS 'Checks if wallet address is an active admin';
COMMENT ON FUNCTION is_owner IS 'Checks if wallet address is the owner';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify tables were created correctly:

-- SELECT * FROM admins;
-- SELECT * FROM admin_actions ORDER BY timestamp DESC LIMIT 10;
-- SELECT * FROM used_nonces ORDER BY used_at DESC LIMIT 10;

-- SELECT is_admin('0xYOUR_WALLET_HERE');
-- SELECT is_owner('0xYOUR_WALLET_HERE');
-- SELECT get_admin_permissions('0xYOUR_WALLET_HERE');
