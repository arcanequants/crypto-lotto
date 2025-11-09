import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logging/logger';
import { requireCronAuth } from '@/lib/security/cron';

/**
 * CRON JOB 1: CREATE NEXT DRAWS
 *
 * Ejecuta: DIARIAMENTE a las 12:00 AM (medianoche)
 *
 * Propósito:
 * - Asegura que SIEMPRE haya draws disponibles para los próximos 7 días (daily)
 * - Asegura que SIEMPRE haya draws disponibles para las próximas 4 semanas (weekly)
 * - Sistema INFINITO: Nunca se queda sin draws
 *
 * Lógica:
 * 1. Cuenta cuántos daily draws NO ejecutados existen
 * 2. Si hay menos de 7, crea más hasta tener 7
 * 3. Cuenta cuántos weekly draws NO ejecutados existen
 * 4. Si hay menos de 4, crea más hasta tener 4
 *
 * Schedule (vercel.json):
 * "0 0 * * *" - Todos los días a las 12:00 AM
 */

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación con multi-layer security
    const authResponse = requireCronAuth(request);
    if (authResponse) {
      return authResponse; // Unauthorized
    }

    logger.info('Starting create-next-draws job', { jobType: 'create-draws' });

    // ============================================
    // PASO 0: Leer configuración de horarios (admin-configurable)
    // ============================================

    const { data: configRows, error: configError } = await supabase
      .from('draw_config')
      .select('config_key, config_value')
      .in('config_key', ['daily_draw_hour_utc', 'weekly_draw_hour_utc', 'weekly_draw_day']);

    if (configError) {
      logger.warn('Error loading config, using defaults');
    }

    const configMap = (configRows || []).reduce((acc, row) => {
      acc[row.config_key] = parseInt(row.config_value);
      return acc;
    }, {} as Record<string, number>);

    const dailyDrawHour = configMap['daily_draw_hour_utc'] || 2; // Default: 2 AM UTC
    const weeklyDrawHour = configMap['weekly_draw_hour_utc'] || 0; // Default: 0 AM UTC
    const weeklyDrawDay = configMap['weekly_draw_day'] || 0; // Default: Sunday

    logger.info('Configured draw times', {
      dailyDrawHour,
      weeklyDrawHour,
      weeklyDrawDay
    });

    // ============================================
    // PARTE 1: DAILY DRAWS
    // ============================================

    // Contar cuántos daily draws NO ejecutados tenemos
    const { count: dailyCount, error: dailyCountError } = await supabase
      .from('draws')
      .select('id', { count: 'exact', head: true })
      .eq('draw_type', 'daily')
      .eq('executed', false);

    if (dailyCountError) {
      logger.error('Error counting daily draws', { error: dailyCountError.message });
      return NextResponse.json({ error: dailyCountError.message }, { status: 500 });
    }

    logger.info('Current unexecuted daily draws', { dailyCount });

    // Si tenemos menos de 7, crear más
    const dailyToCreate = Math.max(0, 7 - (dailyCount || 0));

    if (dailyToCreate > 0) {
      logger.info('Creating new daily draws', { dailyToCreate });

      // Obtener el último daily draw para saber desde qué fecha crear
      const { data: lastDailyDraw, error: lastDailyError } = await supabase
        .from('draws')
        .select('end_time')
        .eq('draw_type', 'daily')
        .order('end_time', { ascending: false })
        .limit(1)
        .single();

      if (lastDailyError && lastDailyError.code !== 'PGRST116') {
        // PGRST116 = no rows found, está OK
        logger.error('Error fetching last daily draw', { error: lastDailyError.message });
        return NextResponse.json({ error: lastDailyError.message }, { status: 500 });
      }

      // Calcular fecha de inicio
      let startDate = new Date();
      if (lastDailyDraw) {
        startDate = new Date(lastDailyDraw.end_time);
        startDate.setDate(startDate.getDate() + 1); // Día siguiente al último
      } else {
        // No hay draws, empezar hoy con la hora configurada
        startDate.setUTCHours(dailyDrawHour, 0, 0, 0);
      }

      // Obtener el último draw_id para generar nuevos IDs únicos
      const { data: maxDrawIdData } = await supabase
        .from('draws')
        .select('draw_id')
        .order('draw_id', { ascending: false })
        .limit(1)
        .single();

      let nextDrawId = maxDrawIdData ? maxDrawIdData.draw_id + 1 : 1000; // Start at 1000 for daily

      // Crear los draws
      const newDailyDraws = [];
      for (let i = 0; i < dailyToCreate; i++) {
        const drawDate = new Date(startDate);
        drawDate.setDate(drawDate.getDate() + i);

        newDailyDraws.push({
          draw_id: nextDrawId++,
          draw_type: 'daily',
          end_time: drawDate.toISOString(),
          executed: false,
          total_tickets: 0,
          prize_pool: 0,
          cbbtc_amount: 0,
          weth_amount: 0,
          token_amount: 0,
          month_token: 'MATIC', // TODO: Obtener token del mes dinámicamente
          rollover_tier_5_1: 0,
          rollover_tier_5_0: 0,
          rollover_tier_4_1: 0,
          platform_fee_collected: 0,
        });
      }

      const { error: insertDailyError } = await supabase
        .from('draws')
        .insert(newDailyDraws);

      if (insertDailyError) {
        logger.error('Error inserting daily draws', { error: insertDailyError.message });
        return NextResponse.json({ error: insertDailyError.message }, { status: 500 });
      }

      logger.info('Daily draws created', { dailyDrawsCreated: dailyToCreate });
    } else {
      logger.info('Daily draws OK', { message: 'Already have 7+ draws' });
    }

    // ============================================
    // PARTE 2: WEEKLY DRAWS
    // ============================================

    // Contar cuántos weekly draws NO ejecutados tenemos
    const { count: weeklyCount, error: weeklyCountError } = await supabase
      .from('draws')
      .select('id', { count: 'exact', head: true })
      .eq('draw_type', 'weekly')
      .eq('executed', false);

    if (weeklyCountError) {
      logger.error('Error counting weekly draws', { error: weeklyCountError.message });
      return NextResponse.json({ error: weeklyCountError.message }, { status: 500 });
    }

    logger.info('Current unexecuted weekly draws', { weeklyCount });

    // Si tenemos menos de 4, crear más
    const weeklyToCreate = Math.max(0, 4 - (weeklyCount || 0));

    if (weeklyToCreate > 0) {
      logger.info('Creating new weekly draws', { weeklyToCreate });

      // Obtener el último weekly draw
      const { data: lastWeeklyDraw, error: lastWeeklyError } = await supabase
        .from('draws')
        .select('end_time')
        .eq('draw_type', 'weekly')
        .order('end_time', { ascending: false })
        .limit(1)
        .single();

      if (lastWeeklyError && lastWeeklyError.code !== 'PGRST116') {
        logger.error('Error fetching last weekly draw', { error: lastWeeklyError.message });
        return NextResponse.json({ error: lastWeeklyError.message }, { status: 500 });
      }

      // Calcular fecha de inicio (próximo día configurado)
      let startDate = new Date();
      if (lastWeeklyDraw) {
        startDate = new Date(lastWeeklyDraw.end_time);
        startDate.setDate(startDate.getDate() + 7); // Siguiente semana
      } else {
        // No hay draws, buscar próximo día configurado (ej: domingo)
        const dayOfWeek = startDate.getUTCDay(); // 0 = domingo, 6 = sábado
        const daysUntilTargetDay = weeklyDrawDay >= dayOfWeek
          ? weeklyDrawDay - dayOfWeek
          : 7 - (dayOfWeek - weeklyDrawDay);
        startDate.setUTCDate(startDate.getUTCDate() + daysUntilTargetDay);
        startDate.setUTCHours(weeklyDrawHour, 0, 0, 0);
      }

      // Obtener el último draw_id para generar nuevos IDs únicos
      const { data: maxDrawIdData2 } = await supabase
        .from('draws')
        .select('draw_id')
        .order('draw_id', { ascending: false })
        .limit(1)
        .single();

      let nextDrawId = maxDrawIdData2 ? maxDrawIdData2.draw_id + 1 : 2000; // Start at 2000 for weekly

      // Crear los draws
      const newWeeklyDraws = [];
      for (let i = 0; i < weeklyToCreate; i++) {
        const drawDate = new Date(startDate);
        drawDate.setDate(drawDate.getDate() + (i * 7)); // Cada 7 días (domingo)

        newWeeklyDraws.push({
          draw_id: nextDrawId++,
          draw_type: 'weekly',
          end_time: drawDate.toISOString(),
          executed: false,
          total_tickets: 0,
          prize_pool: 0,
          cbbtc_amount: 0,
          weth_amount: 0,
          token_amount: 0,
          month_token: 'MATIC', // TODO: Obtener token del mes dinámicamente
          rollover_tier_5_1: 0,
          rollover_tier_5_0: 0,
          rollover_tier_4_1: 0,
          platform_fee_collected: 0,
        });
      }

      const { error: insertWeeklyError } = await supabase
        .from('draws')
        .insert(newWeeklyDraws);

      if (insertWeeklyError) {
        logger.error('Error inserting weekly draws', { error: insertWeeklyError.message });
        return NextResponse.json({ error: insertWeeklyError.message }, { status: 500 });
      }

      logger.info('Weekly draws created', { weeklyDrawsCreated: weeklyToCreate });
    } else {
      logger.info('Weekly draws OK', { message: 'Already have 4+ draws' });
    }

    // ============================================
    // RETURN SUCCESS
    // ============================================

    return NextResponse.json({
      success: true,
      dailyDrawsCreated: dailyToCreate,
      weeklyDrawsCreated: weeklyToCreate,
      message: `CRON completed: Created ${dailyToCreate} daily draws and ${weeklyToCreate} weekly draws`,
    });

  } catch (error) {
    logger.error('Error in create-next-draws', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
