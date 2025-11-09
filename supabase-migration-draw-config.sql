-- MIGRACIÓN: CONFIGURACIÓN DE HORARIOS DE DRAWS (ADMIN)
-- Fecha: 2025-10-23
-- Permite al admin cambiar los horarios de draws sin tocar código

-- ============================================
-- TABLA: draw_config
-- ============================================

CREATE TABLE IF NOT EXISTS draw_config (
  id SERIAL PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- ============================================
-- INSERTAR CONFIGURACIÓN INICIAL
-- ============================================

-- Daily draw time (UTC hour, 0-23)
INSERT INTO draw_config (config_key, config_value, description)
VALUES (
  'daily_draw_hour_utc',
  '2',
  'Hora UTC del sorteo diario (0-23). Actual: 2 AM UTC = 6 PM PST / 9 PM EST'
) ON CONFLICT (config_key) DO NOTHING;

-- Weekly draw time (UTC hour, 0-23)
INSERT INTO draw_config (config_key, config_value, description)
VALUES (
  'weekly_draw_hour_utc',
  '0',
  'Hora UTC del sorteo semanal (0-23). Actual: 0 AM UTC = 4 PM PST (sábado) / 7 PM EST (sábado)'
) ON CONFLICT (config_key) DO NOTHING;

-- Weekly draw day (0 = Sunday, 6 = Saturday)
INSERT INTO draw_config (config_key, config_value, description)
VALUES (
  'weekly_draw_day',
  '0',
  'Día de la semana para sorteo semanal (0=Domingo, 1=Lunes, ..., 6=Sábado)'
) ON CONFLICT (config_key) DO NOTHING;

-- Timezone display (for admin UI reference)
INSERT INTO draw_config (config_key, config_value, description)
VALUES (
  'timezone_reference',
  'America/Los_Angeles',
  'Zona horaria de referencia para mostrar en UI admin'
) ON CONFLICT (config_key) DO NOTHING;

-- ============================================
-- FUNCIÓN HELPER: Obtener configuración
-- ============================================

CREATE OR REPLACE FUNCTION get_draw_config(key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  config_val TEXT;
BEGIN
  SELECT config_value INTO config_val
  FROM draw_config
  WHERE config_key = key;

  RETURN config_val;
END;
$$;

-- ============================================
-- FUNCIÓN HELPER: Actualizar configuración
-- ============================================

CREATE OR REPLACE FUNCTION update_draw_config(
  key TEXT,
  new_value TEXT,
  admin_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE draw_config
  SET
    config_value = new_value,
    updated_at = NOW(),
    updated_by = admin_email
  WHERE config_key = key;

  RETURN FOUND;
END;
$$;

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_draw_config_key ON draw_config(config_key);

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE draw_config IS 'Configuración dinámica de horarios de sorteos (modificable por admin)';
COMMENT ON COLUMN draw_config.config_key IS 'Clave única de configuración';
COMMENT ON COLUMN draw_config.config_value IS 'Valor de la configuración (string)';
COMMENT ON COLUMN draw_config.description IS 'Descripción de qué hace esta config';
COMMENT ON COLUMN draw_config.updated_at IS 'Última vez que se modificó';
COMMENT ON COLUMN draw_config.updated_by IS 'Email del admin que modificó';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT 'Draw configuration table created successfully! ✅' AS message;
SELECT 'Default times: Daily at 2 AM UTC, Weekly at 0 AM UTC (Sunday)' AS info;
SELECT 'Admin can now change draw times without code changes' AS feature;
