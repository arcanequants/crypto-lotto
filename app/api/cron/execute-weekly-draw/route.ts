import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logging/logger';
import { requireCronAuth } from '@/lib/security/cron';
import { batchUpdateTickets } from '@/lib/database/batchOperations';

/**
 * CRON JOB 3: EXECUTE WEEKLY DRAW
 *
 * Ejecuta: DOMINGO a las 8:00 PM
 *
 * Propósito:
 * - Ejecuta el weekly draw del DOMINGO a las 8 PM
 * - Genera números ganadores (MOCK o Chainlink VRF)
 * - Calcula ganadores por tier (INCLUYENDO JACKPOT)
 * - Calcula rollover multi-tier
 * - Si hay ganador de JACKPOT: RESETEA rollover a $0 y empieza de nuevo 🎉
 * - Si NO hay ganador: ACUMULA rollover (crece exponencialmente)
 * - Sistema INFINITO: Siempre hay un siguiente draw
 *
 * Diferencia vs Daily:
 * - Weekly tiene JACKPOT más grande (crece de $4K a $182K)
 * - Weekly tiene más tickets (acumulados durante toda la semana)
 * - Weekly es el sorteo "premium" / principal
 *
 * Schedule (vercel.json):
 * "0 20 * * 0" - Domingos a las 8:00 PM (20:00)
 */

// Prize tier distribution (mismo que daily)
const TIER_PERCENTAGES = {
  '5+1': 0.50, // 50% del pool (JACKPOT)
  '5+0': 0.20, // 20% del pool
  '4+1': 0.15, // 15% del pool
  '4+0': 0.10, // 10% del pool
  '3+1': 0.05, // 5% del pool
};

// Helper function: Generate random winning numbers (MOCK)
function generateWinningNumbers() {
  const numbers: number[] = [];
  while (numbers.length < 5) {
    const num = Math.floor(Math.random() * 50) + 1; // 1-50
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  const powerNumber = Math.floor(Math.random() * 20) + 1; // 1-20

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
function determineTier(matches: number, powerMatch: boolean): string | null {
  if (matches === 5 && powerMatch) return '5+1';
  if (matches === 5) return '5+0';
  if (matches === 4 && powerMatch) return '4+1';
  if (matches === 4) return '4+0';
  if (matches === 3 && powerMatch) return '3+1';
  return null; // No winner
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación con multi-layer security
    const authResponse = requireCronAuth(request);
    if (authResponse) {
      return authResponse; // Unauthorized
    }

    logger.info('Starting execute-weekly-draw job', { jobType: 'weekly-draw' });

    // ============================================
    // PASO 1: Buscar weekly draw de HOY (domingo)
    // ============================================

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const { data: drawToExecute, error: drawError } = await supabase
      .from('draws')
      .select('*')
      .eq('draw_type', 'weekly')
      .eq('executed', false)
      .gte('end_time', todayStart.toISOString())
      .lte('end_time', todayEnd.toISOString())
      .order('end_time', { ascending: true })
      .limit(1)
      .single();

    if (drawError) {
      if (drawError.code === 'PGRST116') {
        logger.info('No weekly draw to execute today');
        return NextResponse.json({
          success: true,
          message: 'No weekly draw scheduled for today',
        });
      }
      logger.error('Error fetching draw', { error: drawError.message });
      return NextResponse.json({ error: drawError.message }, { status: 500 });
    }

    logger.info('Executing weekly draw', {
      drawId: drawToExecute.id,
      endTime: drawToExecute.end_time,
      rollover_5_1: drawToExecute.rollover_tier_5_1,
      rollover_5_0: drawToExecute.rollover_tier_5_0,
      rollover_4_1: drawToExecute.rollover_tier_4_1
    });

    // ============================================
    // PASO 2: Generar winning numbers
    // ============================================

    const { winning_numbers, power_number } = generateWinningNumbers();
    logger.info('Winning numbers generated (weekly)', {
      winningNumbers: winning_numbers,
      powerNumber: power_number
    });

    // ============================================
    // PASO 3: Obtener todos los tickets asignados
    // ============================================

    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('assigned_weekly_draw_id', drawToExecute.id);

    if (ticketsError) {
      logger.error('Error fetching tickets', { error: ticketsError.message });
      return NextResponse.json({ error: ticketsError.message }, { status: 500 });
    }

    logger.info('Tickets fetched for weekly draw', { ticketCount: tickets?.length || 0 });

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

    console.log('[CRON] 🎉 Winners by tier:', {
      '5+1 (JACKPOT)': winnersByTier['5+1'].length,
      '5+0': winnersByTier['5+0'].length,
      '4+1': winnersByTier['4+1'].length,
      '4+0': winnersByTier['4+0'].length,
      '3+1': winnersByTier['3+1'].length,
    });

    // ============================================
    // PASO 5: Calcular prize amounts (con rollover)
    // ============================================

    const totalPool = drawToExecute.total_prize_usd || 0;
    const prizeAmounts: Record<string, number> = {};

    // TIER 5+1 (JACKPOT): Base + Rollover
    const jackpotBase = totalPool * TIER_PERCENTAGES['5+1'];
    const jackpotRollover = drawToExecute.rollover_tier_5_1 || 0;
    const jackpotTotal = jackpotBase + jackpotRollover;

    if (winnersByTier['5+1'].length > 0) {
      prizeAmounts['5+1'] = jackpotTotal / winnersByTier['5+1'].length;
      console.log(`[CRON] 🚀 JACKPOT WON! $${jackpotTotal} / ${winnersByTier['5+1'].length} winner(s) = $${prizeAmounts['5+1']} each`);
    } else {
      prizeAmounts['5+1'] = 0;
      console.log(`[CRON] No jackpot winner → Will rollover $${jackpotTotal}`);
    }

    // TIER 5+0: Base + Rollover
    const tier50Base = totalPool * TIER_PERCENTAGES['5+0'];
    const tier50Rollover = drawToExecute.rollover_tier_5_0 || 0;
    const tier50Total = tier50Base + tier50Rollover;

    if (winnersByTier['5+0'].length > 0) {
      prizeAmounts['5+0'] = tier50Total / winnersByTier['5+0'].length;
    } else {
      prizeAmounts['5+0'] = 0;
    }

    // TIER 4+1: Base + Rollover
    const tier41Base = totalPool * TIER_PERCENTAGES['4+1'];
    const tier41Rollover = drawToExecute.rollover_tier_4_1 || 0;
    const tier41Total = tier41Base + tier41Rollover;

    if (winnersByTier['4+1'].length > 0) {
      prizeAmounts['4+1'] = tier41Total / winnersByTier['4+1'].length;
    } else {
      prizeAmounts['4+1'] = 0;
    }

    // TIER 4+0 y 3+1: Base only (no rollover)
    const tier40Pool = totalPool * TIER_PERCENTAGES['4+0'];
    const tier31Pool = totalPool * TIER_PERCENTAGES['3+1'];

    prizeAmounts['4+0'] = winnersByTier['4+0'].length > 0 ? tier40Pool / winnersByTier['4+0'].length : 0;
    prizeAmounts['3+1'] = winnersByTier['3+1'].length > 0 ? tier31Pool / winnersByTier['3+1'].length : 0;

    logger.info('Prize amounts calculated per tier (weekly)', prizeAmounts);

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
        weekly_processed: true,
        weekly_winner: tier !== null,
        weekly_tier: tier,
        weekly_prize_amount: tier ? prizeAmounts[tier] : 0,
      };
    });

    // Ejecutar batch update
    const batchResult = await batchUpdateTickets(supabase, ticketUpdates);

    if (!batchResult.success) {
      logger.error('Batch ticket update failed (weekly)', { error: batchResult.error });
      return NextResponse.json({ error: 'Failed to update tickets' }, { status: 500 });
    }

    logger.info('All tickets updated with weekly results (batch)', {
      ticketsUpdated: ticketUpdates.length
    });

    // ============================================
    // PASO 7: Calcular rollover para PRÓXIMO weekly
    // ============================================

    let new_rollover_5_1 = 0;
    let new_rollover_5_0 = 0;
    let new_rollover_4_1 = 0;
    let extraForJackpot = 0;

    // TIER 5+1 (JACKPOT): 100% rollover si no hay ganadores
    if (winnersByTier['5+1'].length === 0) {
      new_rollover_5_1 = jackpotTotal; // Acumular TODO
      console.log(`[CRON] 🔄 No jackpot winner → Rollover: $${jackpotTotal} (will grow next week)`);
    } else {
      new_rollover_5_1 = 0; // RESET si hay ganador
      console.log(`[CRON] 🎊 JACKPOT CLAIMED! → Rollover reset to $0 (lottery starts fresh)`);
    }

    // TIER 5+0: 100% rollover si no hay ganadores
    if (winnersByTier['5+0'].length === 0) {
      new_rollover_5_0 = tier50Total;
      console.log(`[CRON] No 5+0 winners → Rollover: $${tier50Total}`);
    } else {
      new_rollover_5_0 = 0;
      console.log(`[CRON] 5+0 winner(s) found → Rollover reset to $0`);
    }

    // TIER 4+1: 50% rollover + 50% a jackpot
    if (winnersByTier['4+1'].length === 0) {
      new_rollover_4_1 = tier41Total * 0.5;
      extraForJackpot += tier41Total * 0.5;
      console.log(`[CRON] No 4+1 winners → Rollover: $${new_rollover_4_1}, Jackpot bonus: $${tier41Total * 0.5}`);
    } else {
      new_rollover_4_1 = 0;
      console.log(`[CRON] 4+1 winner(s) found → Rollover reset to $0`);
    }

    // TIER 3+1: 100% a jackpot
    if (winnersByTier['3+1'].length === 0) {
      extraForJackpot += tier31Pool;
      console.log(`[CRON] No 3+1 winners → Jackpot bonus: $${tier31Pool}`);
    }

    // TIER 4+0: 100% a jackpot
    if (winnersByTier['4+0'].length === 0) {
      extraForJackpot += tier40Pool;
      console.log(`[CRON] No 4+0 winners → Jackpot bonus: $${tier40Pool}`);
    }

    // Agregar extra al jackpot
    new_rollover_5_1 += extraForJackpot;

    console.log(`[CRON] 💰 Final rollover for next week: 5+1=$${new_rollover_5_1}, 5+0=$${new_rollover_5_0}, 4+1=$${new_rollover_4_1}`);

    // ============================================
    // PASO 8: Actualizar próximo weekly draw con rollover
    // ============================================

    const { data: nextDraw, error: nextDrawError } = await supabase
      .from('draws')
      .select('id')
      .eq('draw_type', 'weekly')
      .eq('executed', false)
      .gt('end_time', drawToExecute.end_time)
      .order('end_time', { ascending: true })
      .limit(1)
      .single();

    if (nextDrawError) {
      logger.warn('Could not find next weekly draw for rollover');
    } else {
      await supabase
        .from('draws')
        .update({
          rollover_tier_5_1: new_rollover_5_1,
          rollover_tier_5_0: new_rollover_5_0,
          rollover_tier_4_1: new_rollover_4_1,
        })
        .eq('id', nextDraw.id);

      logger.info('Next weekly draw updated with rollover', { nextDrawId: nextDraw.id });
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

    logger.info('Weekly draw marked as executed', { drawId: drawToExecute.id });

    // ============================================
    // RETURN SUCCESS
    // ============================================

    const hasJackpotWinner = winnersByTier['5+1'].length > 0;

    return NextResponse.json({
      success: true,
      drawId: drawToExecute.id,
      drawType: 'weekly',
      winningNumbers: winning_numbers,
      powerNumber: power_number,
      totalTickets: tickets?.length || 0,
      jackpot: {
        total: jackpotTotal,
        hasWinner: hasJackpotWinner,
        winners: winnersByTier['5+1'].length,
        prizePerWinner: prizeAmounts['5+1'],
        nextWeekRollover: new_rollover_5_1,
      },
      winners: {
        '5+1 (JACKPOT)': winnersByTier['5+1'].length,
        '5+0': winnersByTier['5+0'].length,
        '4+1': winnersByTier['4+1'].length,
        '4+0': winnersByTier['4+0'].length,
        '3+1': winnersByTier['3+1'].length,
      },
      rollover: {
        tier_5_1: new_rollover_5_1,
        tier_5_0: new_rollover_5_0,
        tier_4_1: new_rollover_4_1,
      },
      message: hasJackpotWinner
        ? `🎊 JACKPOT WON! $${jackpotTotal} claimed by ${winnersByTier['5+1'].length} winner(s)! Lottery restarting fresh.`
        : `Weekly draw completed. Jackpot rolls over to next week: $${new_rollover_5_1}`,
    });

  } catch (error) {
    logger.error('Error in execute-weekly-draw', {
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
