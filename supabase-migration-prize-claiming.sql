-- Migration: Add Prize Claiming Fields to Tickets Table
-- SEMANA 4 - DÍA 22-24: Prize Claiming (MOCK)
-- Run this in Supabase SQL Editor to add prize claiming functionality

-- Add new columns to tickets table
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS claim_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS prize_amount DECIMAL(18, 8) DEFAULT 0;

-- Add index for claim_status for faster queries
CREATE INDEX IF NOT EXISTS idx_tickets_claim_status ON tickets(claim_status);

-- Update existing tickets to have 'pending' claim status
UPDATE tickets
SET claim_status = 'pending'
WHERE claim_status IS NULL;

-- Success message
SELECT 'Prize claiming migration completed! ✅' AS message;
SELECT COUNT(*) AS total_tickets,
       COUNT(*) FILTER (WHERE claim_status = 'pending') AS pending_claims,
       COUNT(*) FILTER (WHERE claim_status = 'claimed') AS claimed_prizes
FROM tickets;
