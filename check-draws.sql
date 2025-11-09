-- Verificar los draws creados por la migración
SELECT
  id,
  draw_id,
  draw_type,
  end_time,
  executed,
  total_tickets,
  prize_pool
FROM draws
WHERE draw_type IN ('daily', 'weekly')
ORDER BY draw_type, draw_id;

-- Contar draws por tipo
SELECT
  draw_type,
  COUNT(*) as count
FROM draws
GROUP BY draw_type;
