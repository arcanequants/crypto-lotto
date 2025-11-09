-- Crypto Lotto MVP - Supabase Schema
-- SEMANA 2 - DÍA 8-10: Basic tables for MOCK data
-- Note: No RLS (Row Level Security) for MVP - will add in production

-- Table: draws
-- Stores lottery draw information
CREATE TABLE IF NOT EXISTS draws (
  id BIGSERIAL PRIMARY KEY,
  draw_id INTEGER NOT NULL UNIQUE,
  end_time TIMESTAMPTZ NOT NULL,
  executed BOOLEAN DEFAULT FALSE,
  winning_numbers INTEGER[], -- Array of 5 numbers (1-50)
  power_number INTEGER, -- Single number (1-20)
  total_tickets INTEGER DEFAULT 0,
  prize_pool DECIMAL(18, 8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: tickets
-- Stores user ticket purchases
CREATE TABLE IF NOT EXISTS tickets (
  id BIGSERIAL PRIMARY KEY,
  draw_id INTEGER NOT NULL,
  user_wallet TEXT NOT NULL,
  selected_numbers INTEGER[] NOT NULL, -- Array of 5 numbers (1-50)
  power_number INTEGER NOT NULL, -- Single number (1-20)
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  transaction_hash TEXT,
  price_paid DECIMAL(18, 8) DEFAULT 0.25,
  claim_status TEXT DEFAULT 'pending', -- 'pending' | 'claimed'
  claimed_at TIMESTAMPTZ,
  prize_amount DECIMAL(18, 8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_wallet ON tickets(user_wallet);
CREATE INDEX IF NOT EXISTS idx_tickets_draw ON tickets(draw_id);
CREATE INDEX IF NOT EXISTS idx_tickets_claim_status ON tickets(claim_status);
CREATE INDEX IF NOT EXISTS idx_draws_executed ON draws(executed);

-- Insert first draw (MOCK data)
INSERT INTO draws (draw_id, end_time, executed, winning_numbers, power_number, total_tickets, prize_pool)
VALUES (1, NOW() + INTERVAL '7 days', FALSE, NULL, NULL, 0, 0)
ON CONFLICT (draw_id) DO NOTHING;

-- Success message
SELECT 'Supabase schema created successfully! ✅' AS message;
