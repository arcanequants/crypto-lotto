-- =====================================================
-- UPDATE DRAW PRIZE POOL - RPC FUNCTION
-- =====================================================
-- Esta función actualiza el prize pool de un draw cuando
-- se compran tickets. Incrementa:
-- - wbtc_amount (70% del ticket price en BTC)
-- - eth_amount (25% del ticket price en ETH)
-- - token_amount (5% del ticket price en TOKEN DEL MES dinámico)
-- - total_tickets (contador de tickets vendidos)
-- - total_prize_usd (total en USD)
--
-- El token_symbol se lee del draw (SOL, LINK, DOGE, etc.)
-- Los usuarios votan mensualmente por el token a agregar.
--
-- Uso:
-- SELECT update_draw_prize_pool(1, 0.00001, 0.00005, 0.5, 1, 0.25);
-- =====================================================

CREATE OR REPLACE FUNCTION update_draw_prize_pool(
  p_draw_id INTEGER,
  p_btc_delta DECIMAL(18, 8),
  p_eth_delta DECIMAL(18, 8),
  p_token_delta DECIMAL(18, 8),  -- Genérico: soporta cualquier token (SOL, LINK, DOGE, etc.)
  p_ticket_delta INTEGER,
  p_usd_delta DECIMAL(18, 8)
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE draws
  SET
    wbtc_amount = COALESCE(wbtc_amount, 0) + p_btc_delta,
    eth_amount = COALESCE(eth_amount, 0) + p_eth_delta,
    token_amount = COALESCE(token_amount, 0) + p_token_delta,  -- Usa el token_symbol del draw
    total_tickets = COALESCE(total_tickets, 0) + p_ticket_delta,
    total_prize_usd = COALESCE(total_prize_usd, 0) + p_usd_delta
  WHERE id = p_draw_id;

  -- Verificar que el draw existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draw with id % not found', p_draw_id;
  END IF;
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION update_draw_prize_pool IS 'Incrementa el prize pool de un draw cuando se venden tickets. Actualiza crypto amounts, ticket count, y total USD.';

-- Success message
SELECT '✅ RPC Function update_draw_prize_pool created successfully!' AS message;
