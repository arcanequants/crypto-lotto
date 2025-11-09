'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * ADMIN PAGE: DRAW TIME CONFIGURATION
 *
 * Permite al admin cambiar los horarios de los sorteos daily y weekly
 * sin necesidad de tocar código o hacer redeploy.
 *
 * Features:
 * - Ver horarios actuales en UTC y zonas horarias clave
 * - Cambiar hora del daily draw (0-23 UTC)
 * - Cambiar hora del weekly draw (0-23 UTC)
 * - Cambiar día del weekly draw (Domingo-Sábado)
 * - Preview de cómo afecta a cada zona horaria
 * - Guardar cambios en database
 *
 * URL: /admin/draw-config
 */

type DrawConfig = {
  daily_draw_hour_utc: number;
  weekly_draw_hour_utc: number;
  weekly_draw_day: number; // 0=Sunday, 6=Saturday
};

const DAYS_OF_WEEK = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

const TIMEZONES = [
  { name: 'USA West (PST)', offset: -8 },
  { name: 'USA East (EST)', offset: -5 },
  { name: 'México (CST)', offset: -6 },
  { name: 'Brasil (BRT)', offset: -3 },
  { name: 'Europa (CET)', offset: 1 },
  { name: 'Japón (JST)', offset: 9 },
  { name: 'India (IST)', offset: 5.5 },
];

export default function DrawConfigPage() {
  const [config, setConfig] = useState<DrawConfig>({
    daily_draw_hour_utc: 2,
    weekly_draw_hour_utc: 0,
    weekly_draw_day: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Cargar configuración actual
  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const { data, error } = await supabase
        .from('draw_config')
        .select('config_key, config_value')
        .in('config_key', ['daily_draw_hour_utc', 'weekly_draw_hour_utc', 'weekly_draw_day']);

      if (error) throw error;

      const configMap = data.reduce((acc, item) => {
        acc[item.config_key] = parseInt(item.config_value);
        return acc;
      }, {} as any);

      setConfig({
        daily_draw_hour_utc: configMap.daily_draw_hour_utc || 2,
        weekly_draw_hour_utc: configMap.weekly_draw_hour_utc || 0,
        weekly_draw_day: configMap.weekly_draw_day || 0,
      });
    } catch (error) {
      console.error('Error loading config:', error);
      setMessage('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    setSaving(true);
    setMessage('');

    try {
      // Actualizar cada config
      const updates = [
        { key: 'daily_draw_hour_utc', value: config.daily_draw_hour_utc.toString() },
        { key: 'weekly_draw_hour_utc', value: config.weekly_draw_hour_utc.toString() },
        { key: 'weekly_draw_day', value: config.weekly_draw_day.toString() },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('draw_config')
          .update({
            config_value: update.value,
            updated_at: new Date().toISOString(),
          })
          .eq('config_key', update.key);

        if (error) throw error;
      }

      setMessage('✅ Configuración guardada! Los cambios se aplicarán en el próximo CRON.');
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage('❌ Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  }

  // Helper: Convertir UTC hour a hora local
  function convertToTimezone(utcHour: number, offset: number): string {
    let localHour = utcHour + offset;
    let dayOffset = 0;

    if (localHour < 0) {
      localHour += 24;
      dayOffset = -1;
    } else if (localHour >= 24) {
      localHour -= 24;
      dayOffset = 1;
    }

    const period = localHour >= 12 ? 'PM' : 'AM';
    const hour12 = localHour === 0 ? 12 : localHour > 12 ? localHour - 12 : localHour;

    let dayText = '';
    if (dayOffset === -1) dayText = ' (día anterior)';
    if (dayOffset === 1) dayText = ' (día siguiente)';

    return `${hour12}:00 ${period}${dayText}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <p>Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">⚙️ Configuración de Horarios</h1>
          <p className="text-gray-400">
            Ajusta los horarios de los sorteos daily y weekly. Los cambios se aplican automáticamente.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded ${message.includes('✅') ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            {message}
          </div>
        )}

        {/* Daily Draw Config */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">📅 Daily Draw</h2>

          <div className="mb-4">
            <label className="block mb-2 font-semibold">Hora UTC (0-23):</label>
            <input
              type="number"
              min="0"
              max="23"
              value={config.daily_draw_hour_utc}
              onChange={(e) => setConfig({ ...config, daily_draw_hour_utc: parseInt(e.target.value) })}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded"
            />
            <p className="text-sm text-gray-400 mt-1">
              Actual: {config.daily_draw_hour_utc}:00 UTC (todos los días)
            </p>
          </div>

          {/* Timezone preview */}
          <div className="bg-gray-700 rounded p-4">
            <h3 className="font-semibold mb-3">Vista por zona horaria:</h3>
            <div className="grid grid-cols-2 gap-2">
              {TIMEZONES.map((tz) => (
                <div key={tz.name} className="text-sm">
                  <span className="text-gray-400">{tz.name}:</span>{' '}
                  <span className="font-mono">{convertToTimezone(config.daily_draw_hour_utc, tz.offset)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Draw Config */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">🎰 Weekly Draw</h2>

          <div className="mb-4">
            <label className="block mb-2 font-semibold">Día de la semana:</label>
            <select
              value={config.weekly_draw_day}
              onChange={(e) => setConfig({ ...config, weekly_draw_day: parseInt(e.target.value) })}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded"
            >
              {DAYS_OF_WEEK.map((day, index) => (
                <option key={index} value={index}>
                  {day}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-400 mt-1">
              Actual: {DAYS_OF_WEEK[config.weekly_draw_day]}
            </p>
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-semibold">Hora UTC (0-23):</label>
            <input
              type="number"
              min="0"
              max="23"
              value={config.weekly_draw_hour_utc}
              onChange={(e) => setConfig({ ...config, weekly_draw_hour_utc: parseInt(e.target.value) })}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded"
            />
            <p className="text-sm text-gray-400 mt-1">
              Actual: {DAYS_OF_WEEK[config.weekly_draw_day]} {config.weekly_draw_hour_utc}:00 UTC
            </p>
          </div>

          {/* Timezone preview */}
          <div className="bg-gray-700 rounded p-4">
            <h3 className="font-semibold mb-3">Vista por zona horaria:</h3>
            <div className="grid grid-cols-2 gap-2">
              {TIMEZONES.map((tz) => (
                <div key={tz.name} className="text-sm">
                  <span className="text-gray-400">{tz.name}:</span>{' '}
                  <span className="font-mono">{convertToTimezone(config.weekly_draw_hour_utc, tz.offset)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="bg-blue-900/30 rounded-lg p-6 mb-6">
          <h3 className="font-bold mb-2">💡 Recomendaciones:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
            <li><strong>Daily: 2 AM UTC</strong> = Prime time USA (6 PM PST / 9 PM EST)</li>
            <li><strong>Weekly: 0 AM UTC (Domingo)</strong> = Sábado noche USA / Domingo mañana Asia</li>
            <li>Evita cambiar horarios con frecuencia (confunde a usuarios)</li>
            <li>Considera: 60% del mercado crypto está en América</li>
          </ul>
        </div>

        {/* Save Button */}
        <button
          onClick={saveConfig}
          disabled={saving}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : '💾 Guardar Cambios'}
        </button>

        {/* Warning */}
        <div className="mt-6 bg-yellow-900/30 rounded-lg p-4">
          <p className="text-sm text-yellow-200">
            ⚠️ <strong>Importante:</strong> Los cambios se aplicarán en la próxima ejecución del CRON.
            Los draws ya programados NO se verán afectados.
          </p>
        </div>
      </div>
    </div>
  );
}
