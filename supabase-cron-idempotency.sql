-- =====================================================
-- CRITICAL FIX C-10: CRON Job Idempotency
-- =====================================================
-- CVSS: 9.0/10 (CRITICAL)
-- Prevents duplicate execution of CRON jobs
-- Uses PostgreSQL advisory locks for distributed locking
-- =====================================================

-- =====================================================
-- TABLE: cron_executions
-- =====================================================
-- Tracks all CRON job executions for audit and idempotency

CREATE TABLE IF NOT EXISTS cron_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name TEXT NOT NULL,
  execution_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  UNIQUE(job_name, execution_id)
);

-- Indexes for cron_executions
CREATE INDEX IF NOT EXISTS idx_cron_executions_job_name ON cron_executions(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_executions_status ON cron_executions(status);
CREATE INDEX IF NOT EXISTS idx_cron_executions_started_at ON cron_executions(started_at DESC);

-- Enable RLS
ALTER TABLE cron_executions ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to cron_executions"
ON cron_executions FOR ALL
USING (auth.role() = 'service_role');

-- Admins can view
CREATE POLICY "Admins view cron executions"
ON cron_executions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    AND active = true
  )
);

-- =====================================================
-- FUNCTION: acquire_cron_lock
-- =====================================================
-- Acquires a distributed lock for a CRON job
-- Uses PostgreSQL advisory locks (session-level)
-- Returns TRUE if lock acquired, FALSE if already locked

CREATE OR REPLACE FUNCTION acquire_cron_lock(
  p_job_name TEXT,
  p_execution_id TEXT,
  p_timeout_seconds INTEGER DEFAULT 300
) RETURNS TABLE (
  acquired BOOLEAN,
  execution_uuid UUID,
  message TEXT
) AS $$
DECLARE
  v_lock_id BIGINT;
  v_existing_execution UUID;
  v_existing_started TIMESTAMPTZ;
  v_execution_uuid UUID;
BEGIN
  -- Generate lock ID from job name (convert to bigint hash)
  v_lock_id := ('x' || md5(p_job_name))::bit(64)::bigint;

  -- Try to acquire advisory lock (non-blocking)
  -- This lock is automatically released when transaction ends or connection closes
  IF NOT pg_try_advisory_lock(v_lock_id) THEN
    -- Lock already held - check if by stale execution
    SELECT id, started_at INTO v_existing_execution, v_existing_started
    FROM cron_executions
    WHERE job_name = p_job_name
      AND status = 'running'
    ORDER BY started_at DESC
    LIMIT 1;

    -- If execution is stale (older than timeout), force-complete it and retry
    IF v_existing_execution IS NOT NULL
       AND v_existing_started < NOW() - (p_timeout_seconds || ' seconds')::INTERVAL THEN

      -- Mark stale execution as failed
      UPDATE cron_executions
      SET status = 'failed',
          completed_at = NOW(),
          error_message = 'Execution timed out and was force-completed'
      WHERE id = v_existing_execution;

      -- Release the lock and try again
      PERFORM pg_advisory_unlock(v_lock_id);

      -- Try to acquire lock again
      IF NOT pg_try_advisory_lock(v_lock_id) THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Lock held by another process'::TEXT;
        RETURN;
      END IF;
    ELSE
      -- Lock is held by active execution
      RETURN QUERY SELECT FALSE, NULL::UUID, 'Job already running'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Lock acquired! Create execution record
  INSERT INTO cron_executions (
    job_name,
    execution_id,
    started_at,
    status
  ) VALUES (
    p_job_name,
    p_execution_id,
    NOW(),
    'running'
  )
  RETURNING id INTO v_execution_uuid;

  -- Return success
  RETURN QUERY SELECT TRUE, v_execution_uuid, 'Lock acquired successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: release_cron_lock
-- =====================================================
-- Releases the distributed lock and marks execution as completed

CREATE OR REPLACE FUNCTION release_cron_lock(
  p_execution_uuid UUID,
  p_status TEXT DEFAULT 'completed',
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_lock_id BIGINT;
  v_job_name TEXT;
BEGIN
  -- Get job name from execution
  SELECT job_name INTO v_job_name
  FROM cron_executions
  WHERE id = p_execution_uuid;

  IF v_job_name IS NULL THEN
    RAISE EXCEPTION 'Execution not found: %', p_execution_uuid;
  END IF;

  -- Update execution record
  UPDATE cron_executions
  SET status = p_status,
      completed_at = NOW(),
      error_message = p_error_message,
      metadata = COALESCE(p_metadata, metadata)
  WHERE id = p_execution_uuid;

  -- Release advisory lock
  v_lock_id := ('x' || md5(v_job_name))::bit(64)::bigint;
  PERFORM pg_advisory_unlock(v_lock_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: is_cron_locked
-- =====================================================
-- Checks if a CRON job is currently locked (without acquiring lock)

CREATE OR REPLACE FUNCTION is_cron_locked(
  p_job_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_running BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM cron_executions
    WHERE job_name = p_job_name
      AND status = 'running'
      AND started_at > NOW() - INTERVAL '5 minutes'
  ) INTO v_is_running;

  RETURN v_is_running;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_cron_execution_stats
-- =====================================================
-- Returns statistics about CRON job executions

CREATE OR REPLACE FUNCTION get_cron_execution_stats(
  p_job_name TEXT DEFAULT NULL,
  p_hours INTEGER DEFAULT 24
) RETURNS TABLE (
  job_name TEXT,
  total_executions BIGINT,
  successful_executions BIGINT,
  failed_executions BIGINT,
  running_executions BIGINT,
  avg_duration_seconds NUMERIC,
  last_execution_at TIMESTAMPTZ,
  last_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.job_name,
    COUNT(*) as total_executions,
    COUNT(*) FILTER (WHERE ce.status = 'completed') as successful_executions,
    COUNT(*) FILTER (WHERE ce.status = 'failed') as failed_executions,
    COUNT(*) FILTER (WHERE ce.status = 'running') as running_executions,
    AVG(EXTRACT(EPOCH FROM (ce.completed_at - ce.started_at)))::NUMERIC as avg_duration_seconds,
    MAX(ce.started_at) as last_execution_at,
    (
      SELECT status FROM cron_executions
      WHERE job_name = ce.job_name
      ORDER BY started_at DESC
      LIMIT 1
    ) as last_status
  FROM cron_executions ce
  WHERE (p_job_name IS NULL OR ce.job_name = p_job_name)
    AND ce.started_at > NOW() - (p_hours || ' hours')::INTERVAL
  GROUP BY ce.job_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: cleanup_old_cron_executions
-- =====================================================
-- Removes old execution records (keep last 30 days)

CREATE OR REPLACE FUNCTION cleanup_old_cron_executions() RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM cron_executions
  WHERE started_at < NOW() - INTERVAL '30 days'
    AND status != 'running'
  RETURNING COUNT(*) INTO v_deleted_count;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION acquire_cron_lock TO service_role;
GRANT EXECUTE ON FUNCTION release_cron_lock TO service_role;
GRANT EXECUTE ON FUNCTION is_cron_locked TO service_role;
GRANT EXECUTE ON FUNCTION get_cron_execution_stats TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_cron_executions TO service_role;

-- Also grant to authenticated for monitoring
GRANT EXECUTE ON FUNCTION get_cron_execution_stats TO authenticated;
GRANT EXECUTE ON FUNCTION is_cron_locked TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE cron_executions IS 'Tracks CRON job executions for idempotency and auditing';
COMMENT ON FUNCTION acquire_cron_lock IS 'Acquires distributed lock for CRON job using advisory locks';
COMMENT ON FUNCTION release_cron_lock IS 'Releases lock and marks execution as completed/failed';
COMMENT ON FUNCTION is_cron_locked IS 'Checks if CRON job is currently running';
COMMENT ON FUNCTION get_cron_execution_stats IS 'Returns execution statistics for CRON jobs';
COMMENT ON FUNCTION cleanup_old_cron_executions IS 'Removes execution records older than 30 days';

-- =====================================================
-- USAGE EXAMPLE
-- =====================================================
/*
-- In CRON endpoint:

1. Acquire lock:
SELECT * FROM acquire_cron_lock('execute-daily-draw', 'exec-123', 300);

2. If acquired = true, proceed with job execution

3. On completion:
SELECT release_cron_lock('execution-uuid', 'completed', NULL, '{"draws_executed": 5}'::jsonb);

4. On error:
SELECT release_cron_lock('execution-uuid', 'failed', 'Error message here', NULL);

5. Check stats:
SELECT * FROM get_cron_execution_stats('execute-daily-draw', 24);
*/
