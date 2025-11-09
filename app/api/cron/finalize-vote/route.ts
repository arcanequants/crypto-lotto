import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging/logger';
import { requireCronAuth } from '@/lib/security/cron';

/**
 * GET /api/cron/finalize-vote
 *
 * CRON job que finaliza la votación del mes actual y determina el ganador.
 * Debe ejecutarse el último día de cada mes a las 23:59.
 *
 * También genera automáticamente las propuestas para el siguiente mes.
 *
 * Este endpoint debe ser llamado por:
 * - Vercel Cron (en producción)
 * - GitHub Actions (alternativa)
 * - Manualmente por admin si es necesario
 *
 * Seguridad: Usa Authorization header con CRON_SECRET
 *
 * Response:
 * {
 *   "success": true,
 *   "finalized": {
 *     "month": 1,
 *     "year": 2025,
 *     "winner": "BTC",
 *     "total_votes": 150
 *   },
 *   "next_month_generated": {
 *     "month": 2,
 *     "year": 2025,
 *     "proposed_tokens": ["BTC", "RAY", "WIF", "JUP", "PYTH"]
 *   }
 * }
 */

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación con multi-layer security
    const authResponse = requireCronAuth(request);
    if (authResponse) {
      return authResponse; // Unauthorized
    }

    const supabase = await createClient();

    // Obtener mes y año actual
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Calcular siguiente mes
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    logger.info('Finalizing vote for month', { currentMonth, currentYear });

    // 1. FINALIZAR VOTACIÓN DEL MES ACTUAL
    // Obtener propuesta activa
    const { data: proposal, error: proposalError } = await supabase
      .from('monthly_token_proposals')
      .select('*')
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .eq('status', 'active')
      .single();

    if (proposalError || !proposal) {
      logger.warn('No active proposal found to finalize');
      return NextResponse.json({
        success: false,
        error: 'No active proposal found',
        message: 'Nothing to finalize',
      }, { status: 404 });
    }

    // Contar votos por token
    const { data: votes } = await supabase
      .from('token_votes')
      .select('token_symbol')
      .eq('proposal_id', proposal.id);

    // Agrupar votos
    const voteCounts: Record<string, number> = {};
    votes?.forEach((vote) => {
      voteCounts[vote.token_symbol] = (voteCounts[vote.token_symbol] || 0) + 1;
    });

    // Determinar ganador
    let winnerToken = 'BTC'; // Default si no hay votos
    let maxVotes = 0;

    Object.entries(voteCounts).forEach(([token, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winnerToken = token;
      }
    });

    const totalVotes = votes?.length || 0;

    // Actualizar propuesta como completada
    const { error: updateError } = await supabase
      .from('monthly_token_proposals')
      .update({
        status: 'completed',
        winner_token: winnerToken,
        total_votes: totalVotes,
        voting_end_date: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', proposal.id);

    if (updateError) {
      logger.error('Error updating proposal', { error: updateError.message });
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    logger.info('Vote finalized', {
      winnerToken,
      totalVotes,
      currentMonth,
      currentYear
    });

    // 2. ACTUALIZAR DRAWS DEL SIGUIENTE MES CON EL TOKEN GANADOR
    const { error: drawsError } = await supabase
      .from('draws')
      .update({ token_symbol: winnerToken })
      .eq('month', nextMonth)
      .eq('year', nextYear);

    if (drawsError) {
      logger.warn('Error updating draws', { error: drawsError.message });
      // No es crítico, continuar
    } else {
      logger.info('Draws updated with winner token', {
        nextMonth,
        nextYear,
        winnerToken
      });
    }

    // 3. GENERAR PROPUESTAS PARA EL SIGUIENTE MES
    // Calcular posición en el ciclo
    const cyclePosition = (nextMonth - 1) % 12;

    // Configuración de tokens
    const TIER_3_DEFI = ['JUP', 'RAY', 'JTO', 'PYTH', 'ORCA'];
    const TIER_4_MEME = ['BONK', 'WIF', 'POPCAT'];
    const ADDITIONAL_OPTIONS = ['DOGE', 'JUP', 'RAY', 'JTO', 'PYTH', 'ORCA'];
    const WILDCARD_OPTIONS = ['USDC', 'PYTH', 'ORCA', 'DOGE', 'USDT', 'BONK', 'WIF', 'JUP', 'RAY', 'PYTH', 'JUP', 'RAY'];

    // Generar propuestas
    const proposedTokens: string[] = ['BTC'];

    const tier3Index = cyclePosition % TIER_3_DEFI.length;
    proposedTokens.push(TIER_3_DEFI[tier3Index]);

    const tier4Index = cyclePosition % TIER_4_MEME.length;
    proposedTokens.push(TIER_4_MEME[tier4Index]);

    const additionalIndex = cyclePosition % ADDITIONAL_OPTIONS.length;
    const additional = ADDITIONAL_OPTIONS[additionalIndex];
    if (!proposedTokens.includes(additional)) {
      proposedTokens.push(additional);
    } else {
      for (let i = 0; i < ADDITIONAL_OPTIONS.length; i++) {
        const nextIndex = (additionalIndex + i) % ADDITIONAL_OPTIONS.length;
        const nextToken = ADDITIONAL_OPTIONS[nextIndex];
        if (!proposedTokens.includes(nextToken)) {
          proposedTokens.push(nextToken);
          break;
        }
      }
    }

    const wildcardIndex = cyclePosition % WILDCARD_OPTIONS.length;
    const wildcard = WILDCARD_OPTIONS[wildcardIndex];
    if (!proposedTokens.includes(wildcard)) {
      proposedTokens.push(wildcard);
    } else {
      for (let i = 0; i < WILDCARD_OPTIONS.length; i++) {
        const nextIndex = (wildcardIndex + i) % WILDCARD_OPTIONS.length;
        const nextToken = WILDCARD_OPTIONS[nextIndex];
        if (!proposedTokens.includes(nextToken)) {
          proposedTokens.push(nextToken);
          break;
        }
      }
    }

    while (proposedTokens.length < 5) {
      proposedTokens.push('USDC');
    }

    // Calcular fecha de fin de votación
    const votingEndDate = new Date(nextYear, nextMonth, 0, 23, 59, 59);

    // Crear propuesta para siguiente mes
    const { data: nextProposal, error: nextProposalError } = await supabase
      .from('monthly_token_proposals')
      .insert({
        month: nextMonth,
        year: nextYear,
        proposed_tokens: proposedTokens.slice(0, 5),
        status: 'active',
        voting_end_date: votingEndDate.toISOString(),
      })
      .select()
      .single();

    if (nextProposalError) {
      logger.warn('Error creating next month proposal', { error: nextProposalError.message });
      // No es crítico, continuar
    } else {
      logger.info('Generated proposals for next month', {
        nextMonth,
        nextYear,
        proposedTokens: proposedTokens.slice(0, 5)
      });
    }

    // 4. RETORNAR RESULTADO
    return NextResponse.json({
      success: true,
      message: 'Monthly vote finalized and next month proposals generated',
      finalized: {
        month: currentMonth,
        year: currentYear,
        winner: winnerToken,
        total_votes: totalVotes,
        vote_breakdown: voteCounts,
      },
      next_month_generated: {
        month: nextMonth,
        year: nextYear,
        proposed_tokens: proposedTokens.slice(0, 5),
        proposal_id: nextProposal?.id || null,
      },
    });

  } catch (error) {
    logger.error('Error in finalize-vote CRON', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/finalize-vote
 *
 * Versión POST para testing manual por admin.
 * Permite especificar mes/año específico (útil para testing).
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación con multi-layer security
    const authResponse = requireCronAuth(request);
    if (authResponse) {
      return authResponse; // Unauthorized
    }

    // Permitir override de mes/año para testing
    const body = await request.json().catch(() => ({}));
    const targetMonth = body.month || new Date().getMonth() + 1;
    const targetYear = body.year || new Date().getFullYear();

    logger.info('Manual finalize-vote execution', { targetMonth, targetYear });

    // Llamar lógica de finalización usando RPC function
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('finalize_monthly_vote', {
      p_month: targetMonth,
      p_year: targetYear,
    });

    if (error) {
      logger.error('Error calling finalize_monthly_vote', { error: error.message });
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const result = data && data.length > 0 ? data[0] : null;

    return NextResponse.json({
      success: result?.success || false,
      winner_token: result?.winner_token,
      total_votes: result?.total_votes,
      message: result?.message,
      manual_execution: true,
    });

  } catch (error) {
    logger.error('Error in manual finalize-vote', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
