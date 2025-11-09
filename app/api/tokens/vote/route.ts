import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging/logger';

// Tipos para las funciones RPC
interface RegisterVoteResult {
  success: boolean;
  message: string;
  votes_registered: number;
}

interface VoteSummaryResult {
  has_voted: boolean;
  total_tickets: number;
  votes_used: number;
  votes_available: number;
  voted_token: string | null;
}

/**
 * POST /api/tokens/vote
 *
 * Permite a un usuario votar por un token del mes.
 * VOTOS PONDERADOS: Cada ticket comprado = 1 voto
 * Todos los tickets disponibles votan por el mismo token.
 *
 * Body:
 * {
 *   "wallet_address": "0x123...",
 *   "token_symbol": "BTC"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "12 votes registered for BTC",
 *   "votes_registered": 12,
 *   "token_symbol": "BTC"
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parsear body
    const body = await request.json();
    const { wallet_address, token_symbol } = body;

    // Validaciones
    if (!wallet_address || typeof wallet_address !== 'string') {
      return NextResponse.json(
        { success: false, error: 'wallet_address is required and must be a string' },
        { status: 400 }
      );
    }

    if (!token_symbol || typeof token_symbol !== 'string') {
      return NextResponse.json(
        { success: false, error: 'token_symbol is required and must be a string' },
        { status: 400 }
      );
    }

    // Obtener propuesta activa del mes actual
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const { data: proposal, error: proposalError } = await supabase
      .from('monthly_token_proposals')
      .select('*')
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .eq('status', 'active')
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active proposal found for current month',
          message: 'Voting is not open yet',
        },
        { status: 404 }
      );
    }

    // Verificar que el token está en la lista de propuestas
    if (!proposal.proposed_tokens.includes(token_symbol)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid token',
          message: `Token ${token_symbol} is not in the current month's proposals`,
          available_tokens: proposal.proposed_tokens,
        },
        { status: 400 }
      );
    }

    // Verificar que la votación no ha terminado
    const endDate = new Date(proposal.voting_end_date);
    const now = new Date();
    if (now > endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Voting period has ended',
          message: 'This month\'s voting is closed',
        },
        { status: 400 }
      );
    }

    // Usar la función RPC register_weighted_vote
    const { data: voteResult, error: voteError } = await supabase
      .rpc('register_weighted_vote', {
        p_wallet_address: wallet_address.toLowerCase(),
        p_proposal_id: proposal.id,
        p_token_symbol: token_symbol,
      })
      .single() as { data: RegisterVoteResult | null; error: any };

    if (voteError) {
      logger.error('Vote registration failed', {
        error: voteError.message,
        proposal_id: proposal.id,
        token_symbol,
      });
      return NextResponse.json(
        { success: false, error: voteError.message },
        { status: 500 }
      );
    }

    // Verificar resultado de la función
    if (!voteResult || !voteResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: voteResult?.message || 'Failed to register votes',
          message: voteResult?.message || 'Failed to register votes',
        },
        { status: 400 }
      );
    }

    // Log votes registered (anonymized - no wallet address)
    logger.info('Votes registered', {
      token_symbol,
      votes_registered: voteResult.votes_registered,
      proposal_id: proposal.id,
      // DO NOT log wallet_address for privacy
    });

    return NextResponse.json({
      success: true,
      message: voteResult.message,
      votes_registered: voteResult.votes_registered,
      token_symbol: token_symbol,
    });

  } catch (error) {
    logger.error('Vote registration exception', {
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
 * GET /api/tokens/vote
 *
 * Retorna información de votos del usuario (sistema ponderado).
 *
 * Query params:
 * - wallet_address: Dirección de wallet del usuario
 *
 * Response:
 * {
 *   "success": true,
 *   "has_voted": true,
 *   "total_tickets": 15,
 *   "votes_used": 12,
 *   "votes_available": 3,
 *   "voted_token": "BTC"
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('wallet_address');

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'wallet_address query parameter is required' },
        { status: 400 }
      );
    }

    // Obtener propuesta activa del mes actual
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const { data: proposal, error: proposalError } = await supabase
      .from('monthly_token_proposals')
      .select('id')
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .eq('status', 'active')
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json({
        success: true,
        has_voted: false,
        total_tickets: 0,
        votes_used: 0,
        votes_available: 0,
        voted_token: null,
        message: 'No active proposal found',
      });
    }

    // Usar función RPC para obtener resumen de votos
    const { data: voteSummary, error: summaryError } = await supabase
      .rpc('get_user_vote_summary', {
        p_wallet_address: walletAddress.toLowerCase(),
        p_proposal_id: proposal.id,
      })
      .single() as { data: VoteSummaryResult | null; error: any };

    if (summaryError) {
      logger.error('Vote summary retrieval failed', {
        error: summaryError.message,
      });
      return NextResponse.json(
        { success: false, error: summaryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      has_voted: voteSummary?.has_voted || false,
      total_tickets: voteSummary?.total_tickets || 0,
      votes_used: voteSummary?.votes_used || 0,
      votes_available: voteSummary?.votes_available || 0,
      voted_token: voteSummary?.voted_token || null,
    });

  } catch (error) {
    logger.error('Vote status check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
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
