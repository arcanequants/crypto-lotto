-- ============================================================
-- WEIGHTED VOTING SYSTEM - 1 Ticket = 1 Vote
-- ============================================================
-- Este script actualiza el sistema de votación para soportar
-- votos ponderados basados en tickets comprados
-- ============================================================

-- ============================================================
-- 1. NUEVA TABLA: ticket_votes
-- Tracking individual de qué tickets votaron por qué token
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_votes (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  proposal_id INTEGER NOT NULL REFERENCES monthly_token_proposals(id) ON DELETE CASCADE,
  token_symbol TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  voted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ticket_id) -- Un ticket solo puede votar una vez
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ticket_votes_ticket ON ticket_votes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_votes_proposal ON ticket_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_ticket_votes_wallet ON ticket_votes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_ticket_votes_token ON ticket_votes(token_symbol);

-- ============================================================
-- 2. FUNCIÓN: get_available_votes
-- Retorna cuántos votos tiene disponibles un usuario
-- (cuenta tickets que aún no han votado)
-- ============================================================
CREATE OR REPLACE FUNCTION get_available_votes(
  p_wallet_address TEXT,
  p_proposal_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_available_votes INTEGER;
BEGIN
  -- Contar tickets que NO están en ticket_votes para esta proposal
  SELECT COUNT(*)
  INTO v_available_votes
  FROM tickets t
  WHERE t.wallet_address = p_wallet_address
    AND t.status = 'active'
    AND t.id NOT IN (
      SELECT ticket_id
      FROM ticket_votes
      WHERE proposal_id = p_proposal_id
    );

  RETURN COALESCE(v_available_votes, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. FUNCIÓN: get_user_vote_summary
-- Retorna resumen de votos del usuario para una propuesta
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_vote_summary(
  p_wallet_address TEXT,
  p_proposal_id INTEGER
)
RETURNS TABLE (
  total_tickets INTEGER,
  votes_used INTEGER,
  votes_available INTEGER,
  voted_token TEXT,
  has_voted BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH user_tickets AS (
    SELECT COUNT(*) as total
    FROM tickets
    WHERE wallet_address = p_wallet_address
      AND status = 'active'
  ),
  user_votes AS (
    SELECT
      COUNT(*) as used,
      token_symbol
    FROM ticket_votes
    WHERE wallet_address = p_wallet_address
      AND proposal_id = p_proposal_id
    GROUP BY token_symbol
    LIMIT 1
  )
  SELECT
    COALESCE(ut.total, 0)::INTEGER as total_tickets,
    COALESCE(uv.used, 0)::INTEGER as votes_used,
    (COALESCE(ut.total, 0) - COALESCE(uv.used, 0))::INTEGER as votes_available,
    uv.token_symbol,
    (COALESCE(uv.used, 0) > 0)::BOOLEAN as has_voted
  FROM user_tickets ut
  LEFT JOIN user_votes uv ON true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. FUNCIÓN ACTUALIZADA: get_monthly_vote_results
-- Ahora suma votos ponderados (cuenta ticket_votes en vez de token_votes)
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
  WITH proposal AS (
    SELECT id
    FROM monthly_token_proposals
    WHERE month = p_month AND year = p_year
    LIMIT 1
  ),
  total_votes AS (
    SELECT COUNT(*) as total
    FROM ticket_votes tv
    JOIN proposal p ON tv.proposal_id = p.id
  )
  SELECT
    tv.token_symbol,
    COUNT(tv.id) AS vote_count,
    ROUND(
      (COUNT(tv.id)::DECIMAL / NULLIF(t.total, 0)) * 100,
      2
    ) AS vote_percentage
  FROM ticket_votes tv
  JOIN proposal p ON tv.proposal_id = p.id
  CROSS JOIN total_votes t
  GROUP BY tv.token_symbol, t.total
  ORDER BY vote_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. FUNCIÓN ACTUALIZADA: finalize_monthly_vote
-- Ahora cuenta votos ponderados de ticket_votes
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

  -- Obtener token ganador (el que tiene más votos ponderados)
  SELECT tv.token_symbol, COUNT(tv.id)
  INTO v_winner_token, v_total_votes
  FROM ticket_votes tv
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
    'Voting finalized successfully. Winner: ' || v_winner_token || ' with ' || v_total_votes || ' weighted votes';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. FUNCIÓN HELPER: register_weighted_vote
-- Registra votos ponderados para un usuario
-- ============================================================
CREATE OR REPLACE FUNCTION register_weighted_vote(
  p_wallet_address TEXT,
  p_proposal_id INTEGER,
  p_token_symbol TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  votes_registered INTEGER,
  message TEXT
) AS $$
DECLARE
  v_available_tickets INTEGER[];
  v_votes_registered INTEGER := 0;
  v_ticket_id INTEGER;
BEGIN
  -- Verificar que el token está en la propuesta
  IF NOT EXISTS (
    SELECT 1 FROM monthly_token_proposals
    WHERE id = p_proposal_id
      AND p_token_symbol = ANY(proposed_tokens)
  ) THEN
    RETURN QUERY SELECT FALSE, 0, 'Token not in current proposal';
    RETURN;
  END IF;

  -- Obtener todos los tickets disponibles (no votados) del usuario
  SELECT ARRAY_AGG(t.id)
  INTO v_available_tickets
  FROM tickets t
  WHERE t.wallet_address = p_wallet_address
    AND t.status = 'active'
    AND t.id NOT IN (
      SELECT ticket_id
      FROM ticket_votes
      WHERE proposal_id = p_proposal_id
    );

  -- Si no hay tickets disponibles
  IF v_available_tickets IS NULL OR array_length(v_available_tickets, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'No available votes (all tickets already voted)';
    RETURN;
  END IF;

  -- Insertar un voto por cada ticket disponible
  FOREACH v_ticket_id IN ARRAY v_available_tickets
  LOOP
    INSERT INTO ticket_votes (
      ticket_id,
      proposal_id,
      token_symbol,
      wallet_address
    ) VALUES (
      v_ticket_id,
      p_proposal_id,
      p_token_symbol,
      p_wallet_address
    );

    v_votes_registered := v_votes_registered + 1;
  END LOOP;

  -- Actualizar contador total en la propuesta
  UPDATE monthly_token_proposals
  SET
    total_votes = total_votes + v_votes_registered,
    updated_at = NOW()
  WHERE id = p_proposal_id;

  RETURN QUERY SELECT
    TRUE,
    v_votes_registered,
    'Successfully registered ' || v_votes_registered || ' weighted votes for ' || p_token_symbol;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMENTARIOS FINALES
-- ============================================================
-- Este sistema implementa votación ponderada donde:
-- ✅ 1 ticket comprado = 1 voto
-- ✅ Compras 10 tickets = 10 votos
-- ✅ Todos los votos se usan al mismo tiempo
-- ✅ No puedes dividir votos entre diferentes tokens
-- ✅ Cada ticket solo puede votar una vez por mes
--
-- Próximos pasos:
-- 1. Ejecutar este script en Supabase SQL Editor
-- 2. Actualizar API /api/tokens/vote para usar register_weighted_vote()
-- 3. Actualizar frontend para mostrar votos disponibles
-- ============================================================
