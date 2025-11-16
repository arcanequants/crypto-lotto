-- ADMIN METRICS FUNCTIONS V2
-- Fixed version that finds the correct wallet column name dynamically
-- Run this if user_wallet column doesn't exist

-- First, let's check what columns exist in tickets table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tickets'
AND column_name LIKE '%wallet%'
ORDER BY ordinal_position;

-- If no wallet column exists, let's see all columns:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tickets'
ORDER BY ordinal_position;
