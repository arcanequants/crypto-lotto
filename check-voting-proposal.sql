-- ============================================
-- CHECK VOTING PROPOSAL - Sistema de Votación
-- ============================================

-- 1. Verificar si existe propuesta activa
SELECT
  id,
  month,
  year,
  proposed_tokens,
  voting_start_date,
  voting_end_date,
  status,
  total_votes,
  winner_token,
  created_at
FROM monthly_token_proposals
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 1;

-- Si NO hay propuesta activa, ejecutar lo siguiente:
-- ============================================
-- CREAR PROPUESTA ACTIVA PARA OCTUBRE 2025
-- ============================================

INSERT INTO monthly_token_proposals (
  month,
  year,
  proposed_tokens,
  voting_start_date,
  voting_end_date,
  status,
  total_votes
) VALUES (
  10,  -- Octubre
  2025,
  ARRAY['MATIC', 'LINK', 'UNI', 'AAVE', 'CRV'],
  '2025-10-01 00:00:00+00',
  '2025-10-25 23:59:59+00',
  'active',
  0
)
ON CONFLICT DO NOTHING;

-- Verificar que se creó
SELECT
  id,
  month,
  year,
  proposed_tokens,
  status,
  total_votes
FROM monthly_token_proposals
WHERE month = 10 AND year = 2025
ORDER BY created_at DESC
LIMIT 1;
