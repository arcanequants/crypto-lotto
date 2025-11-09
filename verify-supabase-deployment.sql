-- =====================================================
-- SCRIPT DE VERIFICACIÓN: SUPABASE DEPLOYMENT
-- =====================================================
-- Ejecuta este script DESPUÉS de los 3 scripts principales
-- para verificar que todo está correctamente instalado
-- =====================================================

-- =====================================================
-- 1. VERIFICAR TABLAS CREADAS
-- =====================================================
\echo '=== VERIFICANDO TABLAS ==='

SELECT
  table_name,
  CASE
    WHEN table_name IN ('admins', 'admin_actions', 'used_nonces', 'cron_executions')
    THEN '✅ NUEVA'
    ELSE '✓ Existente'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected: admins, admin_actions, cron_executions, draws, tickets, used_nonces, votes, winners, etc.

-- =====================================================
-- 2. VERIFICAR RLS HABILITADO
-- =====================================================
\echo ''
\echo '=== VERIFICANDO ROW LEVEL SECURITY ==='

SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✅ Habilitado' ELSE '❌ DESHABILITADO' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: TODAS las tablas críticas deben tener RLS habilitado

-- =====================================================
-- 3. VERIFICAR FUNCIONES CREADAS
-- =====================================================
\echo ''
\echo '=== VERIFICANDO FUNCIONES ==='

SELECT
  routine_name as function_name,
  CASE
    WHEN routine_name IN (
      'acquire_cron_lock',
      'release_cron_lock',
      'is_cron_locked',
      'get_cron_execution_stats',
      'check_and_use_nonce',
      'update_nonce_tx_hash',
      'log_admin_action',
      'is_admin',
      'is_owner',
      'get_admin_permissions',
      'cleanup_old_nonces'
    ) THEN '✅ Security Function'
    ELSE '✓ Existing Function'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Expected: Todas las 11 funciones de security deben aparecer

-- =====================================================
-- 4. VERIFICAR POLICIES CREADAS
-- =====================================================
\echo ''
\echo '=== VERIFICANDO RLS POLICIES ==='

SELECT
  tablename,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Expected: Todas las tablas críticas deben tener al menos 1 policy

-- =====================================================
-- 5. VERIFICAR ADMINS REGISTRY
-- =====================================================
\echo ''
\echo '=== VERIFICANDO ADMIN REGISTRY ==='

SELECT
  wallet_address,
  role,
  active,
  jsonb_pretty(permissions) as permissions,
  created_at
FROM admins
ORDER BY created_at;

-- Expected: Al menos 1 admin (el owner) debe existir

-- =====================================================
-- 6. VERIFICAR INDEXES
-- =====================================================
\echo ''
\echo '=== VERIFICANDO INDEXES ==='

SELECT
  tablename,
  indexname,
  CASE
    WHEN indexname LIKE 'idx_admin%' OR
         indexname LIKE 'idx_used%' OR
         indexname LIKE 'idx_cron%'
    THEN '✅ Security Index'
    ELSE '✓ Existing Index'
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
AND (
  tablename IN ('admins', 'admin_actions', 'used_nonces', 'cron_executions')
  OR indexname LIKE 'idx_admin%'
  OR indexname LIKE 'idx_used%'
  OR indexname LIKE 'idx_cron%'
)
ORDER BY tablename, indexname;

-- Expected: Múltiples indexes para performance

-- =====================================================
-- 7. TEST FUNCIONAL: ADMIN
-- =====================================================
\echo ''
\echo '=== TESTING: ADMIN FUNCTIONS ==='

-- Reemplaza con TU wallet address:
DO $$
DECLARE
  test_wallet TEXT := '0xYOUR_WALLET_HERE';  -- ← ACTUALIZAR ESTO
  is_admin_result BOOLEAN;
  is_owner_result BOOLEAN;
  permissions_result JSONB;
BEGIN
  -- Test is_admin
  SELECT is_admin(test_wallet) INTO is_admin_result;
  RAISE NOTICE 'is_admin(%): %', test_wallet, is_admin_result;

  -- Test is_owner
  SELECT is_owner(test_wallet) INTO is_owner_result;
  RAISE NOTICE 'is_owner(%): %', test_wallet, is_owner_result;

  -- Test get_admin_permissions
  SELECT get_admin_permissions(test_wallet) INTO permissions_result;
  RAISE NOTICE 'Permissions: %', permissions_result;
END $$;

-- =====================================================
-- 8. TEST FUNCIONAL: NONCE
-- =====================================================
\echo ''
\echo '=== TESTING: NONCE REPLAY PROTECTION ==='

DO $$
DECLARE
  test_wallet TEXT := '0xtest1234567890abcdef1234567890abcdef1234';
  first_attempt BOOLEAN;
  second_attempt BOOLEAN;
BEGIN
  -- Primera vez debe permitir
  SELECT check_and_use_nonce(test_wallet, 999, 'test') INTO first_attempt;
  RAISE NOTICE 'First nonce attempt (should be TRUE): %', first_attempt;

  -- Segunda vez debe rechazar (replay attack)
  SELECT check_and_use_nonce(test_wallet, 999, 'test') INTO second_attempt;
  RAISE NOTICE 'Second nonce attempt (should be FALSE): %', second_attempt;

  -- Cleanup test data
  DELETE FROM used_nonces WHERE wallet_address = test_wallet AND nonce = 999;
END $$;

-- =====================================================
-- 9. TEST FUNCIONAL: CRON LOCK
-- =====================================================
\echo ''
\echo '=== TESTING: CRON IDEMPOTENCY ==='

DO $$
DECLARE
  lock_result1 RECORD;
  lock_result2 RECORD;
  release_result BOOLEAN;
BEGIN
  -- Adquirir lock (primera vez)
  SELECT * INTO lock_result1 FROM acquire_cron_lock('test-job', 'exec-123', 300);
  RAISE NOTICE 'First lock attempt - Acquired: %, UUID: %',
    lock_result1.acquired, lock_result1.execution_uuid;

  -- Intentar adquirir mismo lock (debe fallar)
  SELECT * INTO lock_result2 FROM acquire_cron_lock('test-job', 'exec-456', 300);
  RAISE NOTICE 'Second lock attempt - Acquired: %, Message: %',
    lock_result2.acquired, lock_result2.message;

  -- Liberar lock
  IF lock_result1.acquired THEN
    SELECT * INTO release_result FROM release_cron_lock(
      lock_result1.execution_uuid,
      'completed',
      NULL,
      NULL
    );
    RAISE NOTICE 'Lock released: %', release_result;
  END IF;

  -- Cleanup test data
  DELETE FROM cron_executions WHERE job_name = 'test-job';
END $$;

-- =====================================================
-- 10. RESUMEN FINAL
-- =====================================================
\echo ''
\echo '=== RESUMEN DE DEPLOYMENT ==='

SELECT
  'Tablas Críticas' as category,
  COUNT(*) as total,
  string_agg(table_name, ', ') as items
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('admins', 'admin_actions', 'used_nonces', 'cron_executions')

UNION ALL

SELECT
  'Funciones Security' as category,
  COUNT(*) as total,
  CASE WHEN COUNT(*) >= 11 THEN '✅ Completo' ELSE '❌ Faltante' END as items
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'acquire_cron_lock',
  'release_cron_lock',
  'is_cron_locked',
  'get_cron_execution_stats',
  'check_and_use_nonce',
  'update_nonce_tx_hash',
  'log_admin_action',
  'is_admin',
  'is_owner',
  'get_admin_permissions',
  'cleanup_old_nonces'
)

UNION ALL

SELECT
  'RLS Policies' as category,
  COUNT(*) as total,
  CASE WHEN COUNT(*) > 10 THEN '✅ Completo' ELSE '⚠️ Verificar' END as items
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT
  'Admins Registrados' as category,
  COUNT(*) as total,
  string_agg(wallet_address, ', ') as items
FROM admins
WHERE active = true;

-- =====================================================
-- ✅ DEPLOYMENT COMPLETO SI:
-- =====================================================
-- 1. Todas las tablas críticas existen (4/4)
-- 2. Todas las funciones security existen (11/11)
-- 3. RLS habilitado en todas las tablas críticas
-- 4. Al menos 1 admin registrado (el owner)
-- 5. Todos los tests funcionales pasan ✅
-- =====================================================

\echo ''
\echo '=== DEPLOYMENT VERIFICADO ==='
\echo '✅ Si todo aparece OK arriba, el deployment fue exitoso!'
\echo ''
