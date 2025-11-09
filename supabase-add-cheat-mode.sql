-- ============================================
-- ADD CHEAT MODE COLUMNS TO DRAWS TABLE
-- ============================================
-- This migration adds columns to support "cheat mode" testing
-- where winning numbers can be pre-set for testing purposes.
--
-- ONLY USE IN TESTING MODE!
-- ============================================

-- Add columns for pre-set winning numbers (cheat mode)
ALTER TABLE draws
ADD COLUMN IF NOT EXISTS cheat_mode_winning_numbers integer[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cheat_mode_power_number integer DEFAULT NULL;

-- Add comment explaining these columns
COMMENT ON COLUMN draws.cheat_mode_winning_numbers IS 'Pre-set winning numbers for testing (cheat mode). Only used when TESTING_MODE=true';
COMMENT ON COLUMN draws.cheat_mode_power_number IS 'Pre-set power number for testing (cheat mode). Only used when TESTING_MODE=true';

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✅ Cheat mode columns added to draws table';
  RAISE NOTICE '   - cheat_mode_winning_numbers (integer[])';
  RAISE NOTICE '   - cheat_mode_power_number (integer)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: These columns are ONLY for testing!';
  RAISE NOTICE '   Remove or disable cheat mode before production deployment.';
END $$;
