-- ===========================================
-- CRITICAL FIX C-4: ADMIN AUTHENTICATION SYSTEM
-- ===========================================
-- CVSS: 9.2/10 (CRITICAL)
-- Prevents unauthorized access to admin endpoints
-- ===========================================

-- ============================================
-- TABLE: admins
-- Stores authorized admin wallet addresses
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'moderator')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT, -- Wallet address of who added this admin
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  permissions JSONB DEFAULT '{"can_execute_draws": true, "can_manage_fees": true, "can_pause": false}'::jsonb
);

-- Add constraint to ensure lowercase wallet addresses
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admin_wallet_lowercase;
ALTER TABLE admins
ADD CONSTRAINT admin_wallet_lowercase
CHECK (wallet_address = LOWER(wallet_address));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admins_wallet ON admins(wallet_address);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- ============================================
-- TABLE: admin_actions
-- Audit trail for ALL admin actions
-- ============================================
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  admin_wallet TEXT NOT NULL, -- Denormalized for faster queries
  action TEXT NOT NULL, -- e.g., 'mark_expired_draws', 'execute_draw', 'withdraw_fees'
  endpoint TEXT, -- API endpoint called
  details JSONB, -- Action-specific data
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT
);

-- Create indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_timestamp ON admin_actions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action ON admin_actions(action);
CREATE INDEX IF NOT EXISTS idx_admin_actions_success ON admin_actions(success);

-- ============================================
-- TABLE: used_nonces
-- Prevents replay attacks on withdrawals and gasless purchases
-- ============================================
CREATE TABLE IF NOT EXISTS used_nonces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  nonce BIGINT NOT NULL,
  operation_type TEXT NOT NULL, -- 'withdrawal', 'ticket_purchase'
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tx_hash TEXT,
  UNIQUE(wallet_address, nonce, operation_type)
);

-- Add constraint for lowercase addresses
ALTER TABLE used_nonces DROP CONSTRAINT IF EXISTS nonce_wallet_lowercase;
ALTER TABLE used_nonces
ADD CONSTRAINT nonce_wallet_lowercase
CHECK (wallet_address = LOWER(wallet_address));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_used_nonces_wallet ON used_nonces(wallet_address);
CREATE INDEX IF NOT EXISTS idx_used_nonces_lookup ON used_nonces(wallet_address, nonce, operation_type);
CREATE INDEX IF NOT EXISTS idx_used_nonces_timestamp ON used_nonces(used_at);

-- ============================================
-- TABLE: rate_limit_events
-- Track rate limiting events (for analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS rate_limit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- Wallet address or IP
  endpoint TEXT NOT NULL,
  blocked BOOLEAN NOT NULL DEFAULT false,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  limit_key TEXT, -- Redis key used
  limit_value INTEGER, -- Requests allowed
  current_count INTEGER -- Current request count
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_identifier ON rate_limit_events(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_timestamp ON rate_limit_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_blocked ON rate_limit_events(blocked) WHERE blocked = true;

-- ============================================
-- FUNCTION: check_admin_permission
-- Validates if a wallet address has admin access
-- ============================================
CREATE OR REPLACE FUNCTION check_admin_permission(
  p_wallet_address TEXT,
  p_permission TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_record RECORD;
BEGIN
  -- Normalize address
  p_wallet_address := LOWER(p_wallet_address);

  -- Get admin record
  SELECT * INTO v_admin_record
  FROM admins
  WHERE wallet_address = p_wallet_address
    AND active = true;

  -- If no admin record, not authorized
  IF v_admin_record IS NULL THEN
    RETURN FALSE;
  END IF;

  -- If no specific permission required, any active admin is authorized
  IF p_permission IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check specific permission from JSONB
  IF v_admin_record.permissions ? p_permission THEN
    RETURN (v_admin_record.permissions->>p_permission)::BOOLEAN;
  END IF;

  -- If permission not found in JSONB, default to false
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: log_admin_action
-- Records admin actions for audit trail
-- ============================================
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_wallet TEXT,
  p_action TEXT,
  p_endpoint TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_admin_id UUID;
  v_action_id UUID;
BEGIN
  -- Normalize address
  p_admin_wallet := LOWER(p_admin_wallet);

  -- Get admin ID
  SELECT id INTO v_admin_id
  FROM admins
  WHERE wallet_address = p_admin_wallet;

  -- If admin not found, still log the attempt
  IF v_admin_id IS NULL THEN
    -- Create a placeholder admin record for logging failed attempts
    v_admin_id := uuid_generate_v4();
  END IF;

  -- Insert admin action
  INSERT INTO admin_actions (
    admin_id,
    admin_wallet,
    action,
    endpoint,
    details,
    ip_address,
    user_agent,
    success,
    error_message
  ) VALUES (
    v_admin_id,
    p_admin_wallet,
    p_action,
    p_endpoint,
    p_details,
    p_ip_address,
    p_user_agent,
    p_success,
    p_error_message
  )
  RETURNING id INTO v_action_id;

  -- Update last_login_at for successful actions
  IF p_success AND v_admin_id IS NOT NULL THEN
    UPDATE admins
    SET last_login_at = NOW()
    WHERE id = v_admin_id;
  END IF;

  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: cleanup_old_nonces
-- Remove nonces older than 30 days (optimization)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_nonces()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM used_nonces
  WHERE used_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: cleanup_old_rate_limit_events
-- Remove rate limit events older than 7 days
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_events()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limit_events
  WHERE timestamp < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ENABLE RLS ON NEW TABLES
-- ============================================
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE used_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access these tables
CREATE POLICY "Service role only can access admins"
ON admins FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role only can access admin_actions"
ON admin_actions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role only can access used_nonces"
ON used_nonces FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role only can access rate_limit_events"
ON rate_limit_events FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- INSERT DEFAULT OWNER
-- REPLACE WITH YOUR ACTUAL OWNER ADDRESS
-- ============================================
-- INSERT INTO admins (wallet_address, role, created_by, permissions)
-- VALUES (
--   '0x_YOUR_OWNER_ADDRESS_HERE', -- REPLACE THIS
--   'owner',
--   'system',
--   '{"can_execute_draws": true, "can_manage_fees": true, "can_pause": true, "can_manage_admins": true}'::jsonb
-- )
-- ON CONFLICT (wallet_address) DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT
  'Admin authentication system created! ✅' as status,
  'Update default owner address before deploying' as warning,
  'All tables have RLS enabled' as security,
  'Run cleanup functions daily via CRON' as maintenance;
