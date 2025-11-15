-- ADMIN METRICS FUNCTIONS
-- Efficient RPC functions for dashboard metrics
-- These bypass RLS and are optimized for performance

-- ============================================
-- 1. GET UNIQUE USER COUNT
-- ============================================
CREATE OR REPLACE FUNCTION get_unique_user_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypasses RLS
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT LOWER(user_wallet))
  INTO user_count
  FROM tickets;

  RETURN COALESCE(user_count, 0);
END;
$$;

-- ============================================
-- 2. GET ACTIVE USERS (last 7 days)
-- ============================================
CREATE OR REPLACE FUNCTION get_active_user_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_count INTEGER;
  seven_days_ago TIMESTAMPTZ;
BEGIN
  seven_days_ago := NOW() - INTERVAL '7 days';

  SELECT COUNT(DISTINCT LOWER(user_wallet))
  INTO active_count
  FROM tickets
  WHERE created_at >= seven_days_ago;

  RETURN COALESCE(active_count, 0);
END;
$$;

-- ============================================
-- 3. GET NEW USERS TODAY
-- ============================================
CREATE OR REPLACE FUNCTION get_new_users_today()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
  today_start TIMESTAMPTZ;
BEGIN
  today_start := DATE_TRUNC('day', NOW());

  -- Count wallets whose first ticket was today
  SELECT COUNT(DISTINCT user_wallet)
  INTO new_count
  FROM (
    SELECT LOWER(user_wallet) as user_wallet, MIN(created_at) as first_ticket
    FROM tickets
    GROUP BY LOWER(user_wallet)
    HAVING MIN(created_at) >= today_start
  ) first_tickets;

  RETURN COALESCE(new_count, 0);
END;
$$;

-- ============================================
-- 4. GET ALL USER METRICS AT ONCE
-- ============================================
CREATE OR REPLACE FUNCTION get_user_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', get_unique_user_count(),
    'active', get_active_user_count(),
    'new_today', get_new_users_today()
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================
-- 5. GRANT EXECUTE PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION get_unique_user_count() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_active_user_count() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_new_users_today() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_metrics() TO anon, authenticated, service_role;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Admin metrics functions created successfully! ✅' AS message;
SELECT '- get_unique_user_count()' AS function;
SELECT '- get_active_user_count()' AS function;
SELECT '- get_new_users_today()' AS function;
SELECT '- get_user_metrics() [Returns all at once]' AS function;
