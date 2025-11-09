-- Migration: Add gasless metadata columns to tickets table
-- Description: Adds columns to track gasless transactions (meta-transactions)
-- Date: 2025-10-29

-- Add gasless metadata columns to tickets table
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS is_gasless BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tx_hash TEXT,
ADD COLUMN IF NOT EXISTS relayer_address TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_is_gasless ON tickets(is_gasless);
CREATE INDEX IF NOT EXISTS idx_tickets_tx_hash ON tickets(tx_hash);
CREATE INDEX IF NOT EXISTS idx_tickets_relayer_address ON tickets(relayer_address);

-- Add comment to document purpose
COMMENT ON COLUMN tickets.is_gasless IS 'True if ticket was purchased via gasless meta-transaction (EIP-2771)';
COMMENT ON COLUMN tickets.tx_hash IS 'Blockchain transaction hash for gasless purchases';
COMMENT ON COLUMN tickets.relayer_address IS 'Address of relayer who executed the gasless transaction';

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tickets'
AND column_name IN ('is_gasless', 'tx_hash', 'relayer_address')
ORDER BY column_name;
