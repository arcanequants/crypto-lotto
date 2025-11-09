import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logging/logger';
import { requireCronAuth } from '@/lib/security/cron';
import { batchUpdateTickets } from '@/lib/database/batchOperations';
import { acquireCronLock, releaseCronLock } from '@/lib/cron/idempotency';
import { LOTTERY_CONFIG } from '@/lib/config/lottery';

/**
 * CRON JOB 2: EXECUTE DAILY DRAW
 *
 * Ejecuta: DIARIAMENTE a las 8:00 PM
 *
 * Propósito:
 * - Ejecuta el daily draw de HOY a las 8 PM
 * - Genera números ganadores (MOCK o Chainlink VRF)
 * - Calcula ganadores por tier
 * - Calcula rollover multi-tier
 * - Transfiere rollover al próximo daily draw
 * - Sistema INFINITO: Siempre hay un siguiente draw
 *
 * Lógica:
 * 1. Buscar daily draw que termine HOY a las 8 PM y NO esté ejecutado
 * 2. Generar winning numbers (MOCK random por ahora)
 * 3. Obtener todos los tickets asignados a este draw
 * 4. Calcular matches y determinar ganadores por tier
 * 5. Calcular prize amounts por tier (dividir pool entre ganadores)
 * 6. Actualizar tickets con resultados (daily_winner, daily_tier, daily_prize_amount)
 * 7. Calcular rollover multi-tier:
 *    - Tier 5+1: Si nadie gana, 100% rollover → próximo draw
 *    - Tier 5+0: Si nadie gana, 100% rollover → próximo draw
 *    - Tier 4+1: Si nadie gana, 50% rollover + 50% a jackpot
 *    - Tier 3+1 y 4+0: 100% a jackpot
 * 8. Actualizar próximo daily draw con rollover
 * 9. Marcar draw actual como ejecutado
 *
 * Schedule (vercel.json):
 * "0 20 * * *" - Todos los días a las 8:00 PM (20:00)
 */

// Prize tier distribution
const TIER_PERCENTAGES = {
  '5+1': 0.50, // 50% del pool
  '5+0': 0.20, // 20% del pool
  '4+1': 0.15, // 15% del pool
  '4+0': 0.10, // 10% del pool
  '3+1': 0.05, // 5% del pool
};

// Helper function: Generate random winning numbers (MOCK)
// Uses dynamic configuration from LOTTERY_CONFIG
function generateWinningNumbers() {
  const numbers: number[] = [];
  while (numbers.length < LOTTERY_CONFIG.numbers.count) {
    const num = Math.floor(Math.random() * LOTTERY_CONFIG.numbers.max) + LOTTERY_CONFIG.numbers.min;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  const powerNumber = Math.floor(Math.random() * LOTTERY_CONFIG.powerNumber.max) + LOTTERY_CONFIG.powerNumber.min;

  return {
    winning_numbers: numbers.sort((a, b) => a - b),
    power_number: powerNumber,
  };
}

// Helper function: Calculate matches
function calculateMatches(ticketNumbers: number[], winningNumbers: number[]) {
  return ticketNumbers.filter(n => winningNumbers.includes(n)).length;
}

// Helper function: Determine tier
// Dynamically check prize tiers from config
function determineTier(matches: number, powerMatch: boolean): string | null {
  const tiers = LOTTERY_CONFIG.prizeTiers;

  // Check each tier in order (higher tiers first)
  for (const [tierKey, tierConfig] of Object.entries(tiers)) {
    if (tierConfig.match === matches && tierConfig.powerMatch === powerMatch) {
      return `${matches}+${powerMatch ? '1' : '0'}`;
    }
  }

  return null; // No winner
}

export async function GET(request: NextRequest) {
  // ============================================
  // CRITICAL FIX C-10: Idempotency Lock
  // ============================================
  let lockResult: Awaited<ReturnType<typeof acquireCronLock>> | null = null;

  try {
    // Verificar autenticación con multi-layer security
    const authResponse = requireCronAuth(request);
    if (authResponse) {
      return authResponse; // Unauthorized
    }

    // Acquire distributed lock (prevents duplicate executions)
    lockResult = await acquireCronLock('execute-daily-draw', 300); // 5 min timeout

    if (!lockResult.acquired) {
      logger.warn('CRON job already running, skipping execution', {
        job: 'execute-daily-draw',
        reason: lockResult.message,
      });

      return NextResponse.json({
        success: false,
        message: 'Job already running',
        reason: lockResult.message,
      }, { status: 409 });
    }

    logger.info('Starting execute-daily-draw job', {
      jobType: 'daily-draw',
      executionUuid: lockResult.execution_uuid,
    });

    // ============================================
    // PASO 0: Leer configuración de horario (admin-configurable)
    // ============================================

    const { data: configData, error: configError } = await supabase
      .from('draw_config')
      .select('config_value')
      .eq('config_key', 'daily_draw_hour_utc')
      .single();

    if (configError) {
      logger.warn('Error loading config, using default hour', { defaultHour: 2 });
    }

    const configuredHour = configData ? parseInt(configData.config_value) : 2;
    logger.info('Configured daily draw hour', { configuredHour });

    // ============================================
    // PASO 1: Buscar draw de HOY que debe ejecutarse
    // ============================================

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const { data: drawToExecute, error: drawError } = await supabase
      .from('draws')
      .select('*')
      .eq('draw_type', 'daily')
      .eq('executed', false)
      .gte('end_time', todayStart.toISOString())
      .lte('end_time', todayEnd.toISOString())
      .order('end_time', { ascending: true })
      .limit(1)
      .single();

    if (drawError) {
      if (drawError.code === 'PGRST116') {
        logger.info('No daily draw to execute today');
        return NextResponse.json({
          success: true,
          message: 'No daily draw scheduled for today',
        });
      }
      logger.error('Error fetching draw', { error: drawError.message });
      return NextResponse.json({ error: drawError.message }, { status: 500 });
    }

    logger.info('Executing daily draw', {
      drawId: drawToExecute.id,
      endTime: drawToExecute.end_time
    });

    // ============================================
    // PASO 2: Generar winning numbers
    // ============================================

    // Check if cheat mode numbers are set (testing only)
    let winning_numbers: number[];
    let power_number: number;

    if (drawToExecute.cheat_mode_winning_numbers && drawToExecute.cheat_mode_power_number) {
      // Use pre-set cheat mode numbers
      winning_numbers = drawToExecute.cheat_mode_winning_numbers;
      power_number = drawToExecute.cheat_mode_power_number;
      logger.info('🧪 CHEAT MODE: Using pre-set winning numbers', {
        winningNumbers: winning_numbers,
        powerNumber: power_number
      });
    } else {
      // Generate random numbers normally
      const generated = generateWinningNumbers();
      winning_numbers = generated.winning_numbers;
      power_number = generated.power_number;
      logger.info('Winning numbers generated', {
        winningNumbers: winning_numbers,
        powerNumber: power_number
      });
    }

    // ============================================
    // PASO 3: Obtener todos los tickets asignados
    // ============================================

    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('assigned_daily_draw_id', drawToExecute.id);

    if (ticketsError) {
      logger.error('Error fetching tickets', { error: ticketsError.message });
      return NextResponse.json({ error: ticketsError.message }, { status: 500 });
    }

    logger.info('Tickets fetched for draw', { ticketCount: tickets?.length || 0 });

    // ============================================
    // PASO 4: Calcular ganadores por tier
    // ============================================

    const winnersByTier: Record<string, any[]> = {
      '5+1': [],
      '5+0': [],
      '4+1': [],
      '4+0': [],
      '3+1': [],
    };

    for (const ticket of tickets || []) {
      const matches = calculateMatches(ticket.numbers, winning_numbers);
      const powerMatch = ticket.power_number === power_number;
      const tier = determineTier(matches, powerMatch);

      if (tier) {
        winnersByTier[tier].push(ticket);
      }
    }

    logger.info('Winners calculated by tier', {
      tier_5_1: winnersByTier['5+1'].length,
      tier_5_0: winnersByTier['5+0'].length,
      tier_4_1: winnersByTier['4+1'].length,
      tier_4_0: winnersByTier['4+0'].length,
      tier_3_1: winnersByTier['3+1'].length,
    });

    // ============================================
    // PASO 5: Calcular prize amounts
    // ============================================

    const totalPool = drawToExecute.total_prize_usd || 0;
    const prizeAmounts: Record<string, number> = {};

    for (const [tier, winners] of Object.entries(winnersByTier)) {
      const tierPool = totalPool * TIER_PERCENTAGES[tier as keyof typeof TIER_PERCENTAGES];
      const winnersCount = winners.length;

      if (winnersCount > 0) {
        prizeAmounts[tier] = tierPool / winnersCount; // Dividir entre ganadores
      } else {
        prizeAmounts[tier] = 0; // No ganadores
      }
    }

    logger.info('Prize amounts calculated per tier', prizeAmounts);

    // ============================================
    // PASO 6: Actualizar tickets con resultados (BATCH OPERATION)
    // ============================================

    // Preparar updates en batch (10-20x más rápido que N+1 queries)
    const ticketUpdates = (tickets || []).map(ticket => {
      const matches = calculateMatches(ticket.numbers, winning_numbers);
      const powerMatch = ticket.power_number === power_number;
      const tier = determineTier(matches, powerMatch);

      return {
        id: ticket.id,
        daily_processed: true,
        daily_winner: tier !== null,
        daily_tier: tier,
        daily_prize_amount: tier ? prizeAmounts[tier] : 0,
      };
    });

    // Ejecutar batch update
    const batchResult = await batchUpdateTickets(supabase, ticketUpdates);

    if (!batchResult.success) {
      logger.error('Batch ticket update failed', { error: batchResult.error });
      return NextResponse.json({ error: 'Failed to update tickets' }, { status: 500 });
    }

    logger.info('All tickets updated with results (batch)', {
      ticketsUpdated: ticketUpdates.length
    });

    // ============================================
    // PASO 7: Calcular rollover multi-tier
    // ============================================

    let rollover_5_1 = drawToExecute.rollover_tier_5_1 || 0;
    let rollover_5_0 = drawToExecute.rollover_tier_5_0 || 0;
    let rollover_4_1 = drawToExecute.rollover_tier_4_1 || 0;
    let extraForJackpot = 0;

    // TIER 5+1: 100% rollover si no hay ganadores
    if (winnersByTier['5+1'].length === 0) {
      const tier51Pool = totalPool * TIER_PERCENTAGES['5+1'];
      rollover_5_1 += tier51Pool;
      logger.info('No 5+1 winners, rolling over', { rolloverAmount: tier51Pool });
    } else {
      rollover_5_1 = 0; // Reset si hay ganador
      logger.info('5+1 winner(s) found, rollover reset');
    }

    // TIER 5+0: 100% rollover si no hay ganadores
    if (winnersByTier['5+0'].length === 0) {
      const tier50Pool = totalPool * TIER_PERCENTAGES['5+0'];
      rollover_5_0 += tier50Pool;
      logger.info('No 5+0 winners, rolling over', { rolloverAmount: tier50Pool });
    } else {
      rollover_5_0 = 0; // Reset si hay ganador
      logger.info('5+0 winner(s) found, rollover reset');
    }

    // TIER 4+1: 50% rollover + 50% a jackpot
    if (winnersByTier['4+1'].length === 0) {
      const tier41Pool = totalPool * TIER_PERCENTAGES['4+1'];
      rollover_4_1 += tier41Pool * 0.5; // 50% rollover
      extraForJackpot += tier41Pool * 0.5; // 50% a jackpot
      logger.info('No 4+1 winners', {
        rolloverAmount: tier41Pool * 0.5,
        jackpotBonus: tier41Pool * 0.5
      });
    } else {
      rollover_4_1 = 0; // Reset si hay ganador
      logger.info('4+1 winner(s) found, rollover reset');
    }

    // TIER 3+1: 100% a jackpot
    if (winnersByTier['3+1'].length === 0) {
      const tier31Pool = totalPool * TIER_PERCENTAGES['3+1'];
      extraForJackpot += tier31Pool;
      logger.info('No 3+1 winners, adding to jackpot', { jackpotBonus: tier31Pool });
    }

    // TIER 4+0: 100% a jackpot
    if (winnersByTier['4+0'].length === 0) {
      const tier40Pool = totalPool * TIER_PERCENTAGES['4+0'];
      extraForJackpot += tier40Pool;
      logger.info('No 4+0 winners, adding to jackpot', { jackpotBonus: tier40Pool });
    }

    // Agregar extra al jackpot (tier 5+1)
    rollover_5_1 += extraForJackpot;

    logger.info('Final rollover calculated', {
      rollover_5_1,
      rollover_5_0,
      rollover_4_1
    });

    // ============================================
    // PASO 8: Actualizar próximo daily draw con rollover
    // ============================================

    const { data: nextDraw, error: nextDrawError } = await supabase
      .from('draws')
      .select('id')
      .eq('draw_type', 'daily')
      .eq('executed', false)
      .gt('end_time', drawToExecute.end_time)
      .order('end_time', { ascending: true })
      .limit(1)
      .single();

    if (nextDrawError) {
      logger.warn('Could not find next daily draw for rollover');
    } else {
      await supabase
        .from('draws')
        .update({
          rollover_tier_5_1: rollover_5_1,
          rollover_tier_5_0: rollover_5_0,
          rollover_tier_4_1: rollover_4_1,
        })
        .eq('id', nextDraw.id);

      logger.info('Next draw updated with rollover', { nextDrawId: nextDraw.id });
    }

    // ============================================
    // PASO 9: Marcar draw actual como ejecutado
    // ============================================

    await supabase
      .from('draws')
      .update({
        executed: true,
        executed_at: new Date().toISOString(),
        winning_numbers,
        power_number,
      })
      .eq('id', drawToExecute.id);

    logger.info('Draw marked as executed', { drawId: drawToExecute.id });

    // ============================================
    // RETURN SUCCESS
    // ============================================

    // Release lock with success
    if (lockResult?.execution_uuid) {
      await releaseCronLock(lockResult.execution_uuid, 'completed', null, {
        drawId: drawToExecute.id,
        totalTickets: tickets?.length || 0,
        totalWinners: Object.values(winnersByTier).reduce((sum, winners) => sum + winners.length, 0),
      });
    }

    return NextResponse.json({
      success: true,
      drawId: drawToExecute.id,
      drawType: 'daily',
      winningNumbers: winning_numbers,
      powerNumber: power_number,
      totalTickets: tickets?.length || 0,
      winners: {
        '5+1': winnersByTier['5+1'].length,
        '5+0': winnersByTier['5+0'].length,
        '4+1': winnersByTier['4+1'].length,
        '4+0': winnersByTier['4+0'].length,
        '3+1': winnersByTier['3+1'].length,
      },
      rollover: {
        tier_5_1: rollover_5_1,
        tier_5_0: rollover_5_0,
        tier_4_1: rollover_4_1,
      },
      message: 'Daily draw executed successfully',
    });

  } catch (error) {
    // Release lock with failure
    if (lockResult?.execution_uuid) {
      await releaseCronLock(
        lockResult.execution_uuid,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    logger.error('Error in execute-daily-draw', {
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
