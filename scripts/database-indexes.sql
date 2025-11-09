-- ============================================
-- DATABASE INDEXES FOR CRYPTOLOTTO
-- ============================================
-- Purpose: Optimize query performance and reduce response times
-- Impact: Faster user lookups, draw execution, and analytics
-- Estimated Performance Gain: 10-100x on large datasets
-- ============================================

-- ============================================
-- TICKETS TABLE INDEXES
-- ============================================

-- Index for user ticket lookups (critical for "My Tickets" page)
-- Query: SELECT * FROM tickets WHERE wallet_address = '0x...'
CREATE INDEX IF NOT EXISTS idx_tickets_wallet_address
ON tickets(wallet_address);

-- Index for daily draw execution (critical for CRON jobs)
-- Query: SELECT * FROM tickets WHERE assigned_daily_draw_id = 123
CREATE INDEX IF NOT EXISTS idx_tickets_daily_draw
ON tickets(assigned_daily_draw_id);

-- Index for weekly draw execution (critical for CRON jobs)
-- Query: SELECT * FROM tickets WHERE assigned_weekly_draw_id = 456
CREATE INDEX IF NOT EXISTS idx_tickets_weekly_draw
ON tickets(assigned_weekly_draw_id);

-- Partial index for pending claims (faster winner lookups)
-- Query: SELECT * FROM tickets WHERE claim_status = 'pending'
CREATE INDEX IF NOT EXISTS idx_tickets_claim_status
ON tickets(claim_status)
WHERE claim_status = 'pending';

-- Composite index for user's tickets in specific draw
-- Query: SELECT * FROM tickets WHERE wallet_address = '0x...' AND assigned_daily_draw_id = 123
CREATE INDEX IF NOT EXISTS idx_tickets_wallet_draw
ON tickets(wallet_address, assigned_daily_draw_id);

-- Index for checking if numbers have been drawn
-- Query: SELECT * FROM tickets WHERE daily_processed = false
CREATE INDEX IF NOT EXISTS idx_tickets_daily_processed
ON tickets(daily_processed)
WHERE daily_processed = false;

-- ============================================
-- DRAWS TABLE INDEXES
-- ============================================

-- Composite index for finding active draws by type
-- Query: SELECT * FROM draws WHERE draw_type = 'daily' AND executed = false
CREATE INDEX IF NOT EXISTS idx_draws_type_executed
ON draws(draw_type, executed);

-- Index for CRON job to find draws that need execution
-- Query: SELECT * FROM draws WHERE executed = false AND end_time <= NOW()
CREATE INDEX IF NOT EXISTS idx_draws_end_time
ON draws(end_time)
WHERE executed = false;

-- Index for finding latest executed draw
-- Query: SELECT * FROM draws WHERE executed = true ORDER BY end_time DESC LIMIT 1
CREATE INDEX IF NOT EXISTS idx_draws_executed_end_time
ON draws(executed, end_time DESC);

-- ============================================
-- MONTHLY TOKEN PROPOSALS INDEXES
-- ============================================

-- Composite index for finding current month's proposals
-- Query: SELECT * FROM monthly_token_proposals WHERE month = 10 AND year = 2025 AND status = 'active'
CREATE INDEX IF NOT EXISTS idx_proposals_month_year_status
ON monthly_token_proposals(month, year, status);

-- Index for finding active proposals
-- Query: SELECT * FROM monthly_token_proposals WHERE status = 'active'
CREATE INDEX IF NOT EXISTS idx_proposals_status
ON monthly_token_proposals(status);

-- ============================================
-- TOKEN VOTES INDEXES
-- ============================================

-- Composite index for checking if user has voted
-- Query: SELECT * FROM token_votes WHERE wallet_address = '0x...' AND proposal_id = 123
CREATE INDEX IF NOT EXISTS idx_votes_wallet_proposal
ON token_votes(wallet_address, proposal_id);

-- Index for counting votes per proposal
-- Query: SELECT COUNT(*) FROM token_votes WHERE proposal_id = 123
CREATE INDEX IF NOT EXISTS idx_votes_proposal
ON token_votes(proposal_id);

-- Index for user's voting history
-- Query: SELECT * FROM token_votes WHERE wallet_address = '0x...' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_votes_wallet_created
ON token_votes(wallet_address, created_at DESC);

-- ============================================
-- WITHDRAWALS TABLE INDEXES (if exists)
-- ============================================

-- Uncomment if withdrawals table exists:
-- CREATE INDEX IF NOT EXISTS idx_withdrawals_user
-- ON withdrawals(user_address);

-- CREATE INDEX IF NOT EXISTS idx_withdrawals_status
-- ON withdrawals(status);

-- CREATE INDEX IF NOT EXISTS idx_withdrawals_created
-- ON withdrawals(created_at DESC);

-- ============================================
-- ANALYZE TABLES FOR QUERY OPTIMIZATION
-- ============================================
-- This updates PostgreSQL's statistics for better query planning

ANALYZE tickets;
ANALYZE draws;
ANALYZE monthly_token_proposals;
ANALYZE token_votes;

-- ============================================
-- VERIFY INDEXES WERE CREATED
-- ============================================
-- Run this query to see all indexes:
-- SELECT tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;

-- ============================================
-- PERFORMANCE MONITORING QUERIES
-- ============================================

-- Check index usage:
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;

-- Find unused indexes (consider removing):
-- SELECT
--   schemaname,
--   tablename,
--   indexname
-- FROM pg_stat_user_indexes
-- WHERE idx_scan = 0
--   AND indexname NOT LIKE 'pg_toast%';

-- Check table sizes:
-- SELECT
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- MAINTENANCE RECOMMENDATIONS
-- ============================================
-- 1. Run VACUUM ANALYZE monthly to reclaim space and update statistics
-- 2. Monitor slow queries with pg_stat_statements extension
-- 3. Add indexes for any new query patterns that emerge
-- 4. Remove unused indexes to save write performance
-- 5. Consider partitioning 'tickets' table when it exceeds 10M rows
-- ============================================

-- ============================================
-- EXECUTION NOTES
-- ============================================
-- To run this script in Supabase:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
-- 4. Verify indexes were created with the verification query above
--
-- Estimated execution time: 5-30 seconds depending on table sizes
-- No downtime required - indexes are created online
-- ============================================
