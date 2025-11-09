-- ============================================================
-- Token Voting System - Database Schema
-- ============================================================
-- Versión: 2.0 (BTC Always Included + Solana SPL Only)
-- Fecha: 2025-10-23
-- ============================================================

-- ============================================================
-- 1. TABLA: token_tiers
-- Almacena todos los tokens disponibles organizados por tiers
-- ============================================================
CREATE TABLE IF NOT EXISTS token_tiers (
  id SERIAL PRIMARY KEY,
  token_symbol TEXT UNIQUE NOT NULL,
  tier INTEGER NOT NULL, -- 1=BTC (always), 2=Wrapped, 3=DeFi, 4=Meme, 5=Stable
  position_in_tier INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  solana_mint_address TEXT, -- SPL Token Mint Address
  is_always_available BOOLEAN DEFAULT FALSE, -- TRUE solo para BTC
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_token_tiers_tier ON token_tiers(tier);
CREATE INDEX IF NOT EXISTS idx_token_tiers_always_available ON token_tiers(is_always_available);

-- ============================================================
-- 2. TABLA: monthly_token_proposals
-- Propuestas de tokens generadas cada mes (5 opciones)
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_token_proposals (
  id SERIAL PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2025),
  proposed_tokens TEXT[] NOT NULL, -- Array de símbolos: ['BTC', 'JUP', 'BONK', 'DOGE', 'USDC']
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  winner_token TEXT, -- Token que ganó la votación
  total_votes INTEGER DEFAULT 0,
  voting_start_date TIMESTAMP DEFAULT NOW(),
  voting_end_date TIMESTAMP, -- Se calcula: último día del mes
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(month, year)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_proposals_status ON monthly_token_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_month_year ON monthly_token_proposals(month, year);

-- ============================================================
-- 3. TABLA: token_votes
-- Votos de usuarios para el token del mes
-- ============================================================
CREATE TABLE IF NOT EXISTS token_votes (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER NOT NULL REFERENCES monthly_token_proposals(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  voted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(proposal_id, wallet_address) -- Un usuario solo puede votar una vez por mes
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_votes_proposal ON token_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_wallet ON token_votes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_votes_token ON token_votes(token_symbol);

-- ============================================================
-- 4. INSERTAR TOKENS INICIALES (12 tokens compatibles con Solana)
-- ============================================================

-- Limpiar datos previos si existen
TRUNCATE TABLE token_tiers RESTART IDENTITY CASCADE;

-- TIER 1: BTC (siempre disponible)
INSERT INTO token_tiers (token_symbol, tier, position_in_tier, name, description, solana_mint_address, is_always_available) VALUES
  ('BTC', 1, 1, 'Bitcoin', 'Wrapped Bitcoin (cbBTC) - $1B+ TVL', '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', TRUE);

-- TIER 2: Wrapped con alta liquidez
INSERT INTO token_tiers (token_symbol, tier, position_in_tier, name, description, solana_mint_address, is_always_available) VALUES
  ('DOGE', 2, 1, 'Dogecoin', 'The original meme coin - Wormhole NTT', 'HLptm5e6rTgh4EKgDpYFrnRHbjpkMyVdEeREEa2G7rf9', FALSE);

-- TIER 3: Solana DeFi Blue Chips
INSERT INTO token_tiers (token_symbol, tier, position_in_tier, name, description, solana_mint_address, is_always_available) VALUES
  ('JUP', 3, 1, 'Jupiter', 'DEX aggregator líder en Solana', 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', FALSE),
  ('RAY', 3, 2, 'Raydium', 'AMM con más volumen en Solana', '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', FALSE),
  ('JTO', 3, 3, 'Jito', 'Liquid staking + MEV infrastructure', 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', FALSE),
  ('PYTH', 3, 4, 'Pyth Network', 'Oracle de precios descentralizado', 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', FALSE),
  ('ORCA', 3, 5, 'Orca', 'DEX con mejor UX en Solana', 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', FALSE);

-- TIER 4: Solana Meme Coins
INSERT INTO token_tiers (token_symbol, tier, position_in_tier, name, description, solana_mint_address, is_always_available) VALUES
  ('BONK', 4, 1, 'Bonk', 'Meme coin #1 de Solana', 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', FALSE),
  ('WIF', 4, 2, 'dogwifhat', 'Top 50 meme coin global', 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', FALSE),
  ('POPCAT', 4, 3, 'Popcat', 'Viral meme coin de Solana', '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', FALSE);

-- TIER 5: Stablecoins (Backup)
INSERT INTO token_tiers (token_symbol, tier, position_in_tier, name, description, solana_mint_address, is_always_available) VALUES
  ('USDC', 5, 1, 'USD Coin', 'Stablecoin respaldado 1:1 por USD', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', FALSE),
  ('USDT', 5, 2, 'Tether', 'Stablecoin más usado globalmente', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', FALSE);

-- Nota: SOL se incluirá en la rotación pero no necesita estar en token_tiers
-- porque es nativo de Solana y siempre está disponible para comprar/vender

-- ============================================================
-- 5. FUNCIÓN RPC: get_monthly_vote_results
-- Obtiene resultados de votación de un mes específico
-- ============================================================
CREATE OR REPLACE FUNCTION get_monthly_vote_results(
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE (
  token_symbol TEXT,
  vote_count BIGINT,
  vote_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tv.token_symbol,
    COUNT(tv.id) AS vote_count,
    ROUND(
      (COUNT(tv.id)::DECIMAL / NULLIF(
        (SELECT COUNT(*) FROM token_votes tv2
         JOIN monthly_token_proposals mtp2 ON tv2.proposal_id = mtp2.id
         WHERE mtp2.month = p_month AND mtp2.year = p_year),
        0
      )) * 100,
      2
    ) AS vote_percentage
  FROM token_votes tv
  JOIN monthly_token_proposals mtp ON tv.proposal_id = mtp.id
  WHERE mtp.month = p_month AND mtp.year = p_year
  GROUP BY tv.token_symbol
  ORDER BY vote_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. FUNCIÓN RPC: finalize_monthly_vote
-- Finaliza votación y determina ganador
-- ============================================================
CREATE OR REPLACE FUNCTION finalize_monthly_vote(
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE (
  success BOOLEAN,
  winner_token TEXT,
  total_votes INTEGER,
  message TEXT
) AS $$
DECLARE
  v_proposal_id INTEGER;
  v_winner_token TEXT;
  v_total_votes INTEGER;
BEGIN
  -- Obtener proposal_id
  SELECT id INTO v_proposal_id
  FROM monthly_token_proposals
  WHERE month = p_month AND year = p_year AND status = 'active';

  IF v_proposal_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, 0, 'No active proposal found for this month';
    RETURN;
  END IF;

  -- Obtener token ganador (el que tiene más votos)
  SELECT tv.token_symbol, COUNT(tv.id)
  INTO v_winner_token, v_total_votes
  FROM token_votes tv
  WHERE tv.proposal_id = v_proposal_id
  GROUP BY tv.token_symbol
  ORDER BY COUNT(tv.id) DESC
  LIMIT 1;

  -- Si no hay votos, BTC gana por defecto
  IF v_winner_token IS NULL THEN
    v_winner_token := 'BTC';
    v_total_votes := 0;
  END IF;

  -- Actualizar proposal
  UPDATE monthly_token_proposals
  SET
    status = 'completed',
    winner_token = v_winner_token,
    total_votes = v_total_votes,
    voting_end_date = NOW(),
    updated_at = NOW()
  WHERE id = v_proposal_id;

  -- Actualizar draws del siguiente mes con el token ganador
  UPDATE draws
  SET token_symbol = v_winner_token
  WHERE EXTRACT(MONTH FROM draw_time) = (p_month % 12) + 1
    AND EXTRACT(YEAR FROM draw_time) = CASE
      WHEN p_month = 12 THEN p_year + 1
      ELSE p_year
    END;

  RETURN QUERY SELECT
    TRUE,
    v_winner_token,
    v_total_votes,
    'Voting finalized successfully. Winner: ' || v_winner_token;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. FUNCIÓN HELPER: get_current_month_proposal
-- Obtiene la propuesta activa del mes actual
-- ============================================================
CREATE OR REPLACE FUNCTION get_current_month_proposal()
RETURNS TABLE (
  proposal_id INTEGER,
  month INTEGER,
  year INTEGER,
  proposed_tokens TEXT[],
  status TEXT,
  total_votes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    mtp.month,
    mtp.year,
    mtp.proposed_tokens,
    mtp.status,
    mtp.total_votes
  FROM monthly_token_proposals mtp
  WHERE mtp.month = EXTRACT(MONTH FROM NOW())::INTEGER
    AND mtp.year = EXTRACT(YEAR FROM NOW())::INTEGER
    AND mtp.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMENTARIOS FINALES
-- ============================================================
-- Este schema implementa el Bracket System v2.0 con:
-- ✅ BTC siempre disponible en votaciones
-- ✅ 12 tokens compatibles con Solana (SPL)
-- ✅ Sistema de votación mensual automático
-- ✅ Funciones RPC para contar votos y finalizar
-- ✅ Rotación justa por tiers
--
-- Próximos pasos:
-- 1. Ejecutar este script en Supabase SQL Editor
-- 2. Implementar APIs (generate-proposals, vote, finalize)
-- 3. Setup CRON jobs para automatización
-- 4. Crear UI de votación en frontend
-- ============================================================
